import "server-only";

import { createHash } from "node:crypto";
import { timedPoolQuery } from "@/lib/core/http/request-timing";
import { withTransaction } from "@/lib/core/db/transaction";
import {
  ApiError,
  NotFoundError,
  ValidationError,
} from "@/lib/core/http/errors";
import {
  audit,
  id,
  idempotencyKey,
  date,
  money,
  optionalText,
  quantity,
  requireBranch,
  requireRole,
  text,
  type Actor,
} from "@/lib/warehouse/core";
import { isGlobalRole } from "@/lib/contracts/warehouse-policy";
import { cursorPageResult, parseCursorPage } from "@/lib/warehouse/cursor-pagination";
import { postInventoryLine } from "@/lib/warehouse/ledger";
import { issueSerials, reverseDocumentInTx } from "@/lib/warehouse/stock-documents";
import { buildSchedule } from "@/lib/sales/schedule";
import { salesRoles } from "@/lib/sales/customers";

const cancelRoles = ["ADMIN", "CEO", "MANAGER"] as const;
const paymentMethods = ["TRANSFER", "CASH", "CREDIT_CARD"] as const;

// Money is handled as integer satang so line and bill totals never drift.
export function toSatang(value: string): bigint {
  const [baht, fraction = ""] = value.split(".");
  return BigInt(baht) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}
export function fromSatang(value: bigint): string {
  return `${value / BigInt(100)}.${String(value % BigInt(100)).padStart(2, "0")}`;
}
export const bangkokToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
// Installment status is computed on read, never stored.
function installmentStatus(row: { due_on: string; amount: string; paid_amount: string }, today: string) {
  const paid = toSatang(row.paid_amount);
  if (paid >= toSatang(row.amount)) return "PAID";
  if (String(row.due_on).slice(0, 10) < today) return "OVERDUE";
  return paid > BigInt(0) ? "PARTIAL" : "UPCOMING";
}

// quantity has at most 3 decimals; round half-up to whole satang.
export function lineTotalSatang(qty: string, unitPriceSatang: bigint): bigint {
  const [whole, fraction = ""] = qty.split(".");
  const milli = BigInt(whole) * BigInt(1000) + BigInt(fraction.padEnd(3, "0"));
  return (milli * unitPriceSatang + BigInt(500)) / BigInt(1000);
}

type Line = {
  productId: number;
  quantity: string;
  unitPrice: string | null;
  serialNumbers: string[];
};
function parseLines(raw: unknown): Line[] {
  if (!Array.isArray(raw) || !raw.length)
    throw new ValidationError({ lines: "Add at least one product." });
  const lines = raw.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item))
      throw new ValidationError({ lines: "Each line must be an object." });
    const row = item as Record<string, unknown>;
    if (
      row.serialNumbers != null &&
      (!Array.isArray(row.serialNumbers) ||
        row.serialNumbers.some((serial) => typeof serial !== "string" || !serial.trim()))
    )
      throw new ValidationError({ serialNumbers: "Use an array of serials." });
    let unitPrice: string | null = null;
    if (row.unitPrice != null && row.unitPrice !== "") {
      const raw = String(row.unitPrice);
      if ((typeof row.unitPrice !== "string" && typeof row.unitPrice !== "number") || !/^\d{1,13}(?:\.\d{1,2})?$/.test(raw))
        throw new ValidationError({ unitPrice: "Use a THB amount with at most two decimal places." });
      unitPrice = raw;
    }
    return {
      productId: id(row.productId, "productId"),
      quantity: quantity(row.quantity, "quantity"),
      unitPrice,
      serialNumbers: ((row.serialNumbers as string[] | undefined) ?? []).map((serial) => serial.trim()),
    };
  });
  if (new Set(lines.map((line) => line.productId)).size !== lines.length)
    throw new ValidationError({ lines: "Use one line per product." });
  return lines;
}

type Guarantor = { fullName: string; phone: string; citizenId: string | null; address: string | null; relationship: string | null };
function parseInstallment(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new ValidationError({ installment: "Installment terms are required." });
  const row = raw as Record<string, unknown>;
  if (typeof row.interestRate !== "string" && typeof row.interestRate !== "number")
    throw new ValidationError({ interestRate: "Enter an interest rate." });
  const guarantorsRaw = row.guarantors ?? [];
  if (!Array.isArray(guarantorsRaw) || guarantorsRaw.length > 10)
    throw new ValidationError({ guarantors: "Use at most 10 guarantors." });
  const guarantors: Guarantor[] = guarantorsRaw.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item))
      throw new ValidationError({ guarantors: "Each guarantor must be an object." });
    const g = item as Record<string, unknown>;
    const citizenId = optionalText(g.citizenId, "citizenId", 13);
    if (citizenId && !/^\d{13}$/.test(citizenId))
      throw new ValidationError({ citizenId: "Citizen ID must be 13 digits." });
    return {
      fullName: text(g.fullName, "fullName", 200),
      phone: text(g.phone, "phone", 30),
      citizenId,
      address: optionalText(g.address, "address", 500),
      relationship: optionalText(g.relationship, "relationship", 100),
    };
  });
  const downPayment = row.downPayment == null || row.downPayment === "" ? "0" : money(row.downPayment, "downPayment");
  return {
    downPayment,
    ratePct: String(row.interestRate),
    months: Number(row.months),
    firstDueOn: date(row.firstDueOn, "firstDueOn"),
    guarantors,
  };
}

export async function listSales(actor: Actor, search: URLSearchParams) {
  requireRole(actor, salesRoles);
  const { limit, cursor } = parseCursorPage(search);
  const query = search.get("q")?.trim() ?? "";
  const saleType = search.get("saleType") ?? "";
  if (saleType && saleType !== "CASH" && saleType !== "INSTALLMENT")
    throw new ValidationError({ saleType: "Use CASH or INSTALLMENT." });
  if (query.length > 100) throw new ValidationError({ q: "Use at most 100 characters." });
  const openParam = search.get("open");
  if (openParam != null && openParam !== "true" && openParam !== "false")
    throw new ValidationError({ open: "Use true or false." });
  const open = openParam === "true";
  const customerId = search.get("customerId") ? id(search.get("customerId"), "customerId") : null;
  const result = await timedPoolQuery<Record<string, unknown> & { id: number }>(
    `SELECT s.id,s.record_no,s.sale_type,s.customer_id,c.full_name AS customer_name,s.branch_id,s.warehouse_id,
      s.sold_on,s.total_amount,s.created_at,s.cancelled_at,
      (SELECT p.method FROM app.sale_payments p WHERE p.sale_id=s.id ORDER BY p.id LIMIT 1) AS payment_method,
      (SELECT SUM(i.amount-i.paid_amount) FROM app.sale_installments i WHERE i.sale_id=s.id) AS outstanding,
      (SELECT MIN(i.due_on) FROM app.sale_installments i WHERE i.sale_id=s.id AND i.paid_amount<i.amount) AS next_due_on
    FROM app.sales s JOIN app.customers c ON c.id=s.customer_id
    WHERE ($1::boolean OR s.branch_id=ANY($2::integer[]))
      AND ($3::text = '' OR s.record_no ILIKE '%' || $3 || '%' OR c.full_name ILIKE '%' || $3 || '%' OR c.phone ILIKE '%' || $3 || '%')
      AND ($4::bigint IS NULL OR s.id < $4)
      AND ($6::text = '' OR s.sale_type=$6)
      AND (NOT $7::boolean OR (s.sale_type='INSTALLMENT' AND s.cancelled_at IS NULL AND s.closed_at IS NULL))
      AND ($8::integer IS NULL OR s.customer_id=$8)
    ORDER BY s.id DESC LIMIT $5`,
    [isGlobalRole(actor.role), actor.branchIds, query, cursor?.parentId ?? null, limit + 1, saleType, open, customerId],
  );
  return cursorPageResult(result.rows, limit, (row) => ({ parentId: row.id }));
}

export async function getSale(actor: Actor, saleId: number) {
  requireRole(actor, salesRoles);
  const head = await timedPoolQuery<Record<string, unknown> & { branch_id: number }>(
    `SELECT s.*,(SELECT p.method FROM app.sale_payments p WHERE p.sale_id=s.id ORDER BY p.id LIMIT 1) AS payment_method,
      c.full_name AS customer_name,c.phone AS customer_phone,c.address AS customer_address,w.name AS warehouse_name,b.name AS branch_name,
      cu.name AS created_by_name,(SELECT jsonb_build_object('name',o.name,'phone',o.phone,'address',o.address) FROM app.organization_settings o WHERE o.id=1) AS organization
    FROM app.sales s JOIN app.customers c ON c.id=s.customer_id
    JOIN app.warehouses w ON w.id=s.warehouse_id JOIN app.branches b ON b.id=s.branch_id
    JOIN app.app_users au ON au.id=s.created_by_id JOIN public."user" cu ON cu.id=au.auth_user_id
    WHERE s.id=$1`,
    [saleId],
  );
  if (!head.rowCount) throw new NotFoundError("Sale");
  requireBranch(actor, head.rows[0].branch_id);
  const [lines, payments, installments, guarantors] = await Promise.all([
    timedPoolQuery(
      `SELECT l.id,l.product_id,l.quantity,l.unit_price,l.line_total,l.serial_numbers,p.sku,p.name AS product_name
      FROM app.sale_lines l JOIN app.products p ON p.id=l.product_id WHERE l.sale_id=$1 ORDER BY l.id`,
      [saleId],
    ),
    timedPoolQuery(
      `SELECT id,record_no,kind,method,amount,paid_on,reference_no,created_at,voided_at,void_reason
      FROM app.sale_payments WHERE sale_id=$1 ORDER BY id`,
      [saleId],
    ),
    timedPoolQuery<{ due_on: string; amount: string; paid_amount: string }>(
      `SELECT seq,due_on,amount,paid_amount FROM app.sale_installments WHERE sale_id=$1 ORDER BY seq`,
      [saleId],
    ),
    timedPoolQuery(
      `SELECT id,full_name,phone,citizen_id,address,relationship FROM app.sale_guarantors WHERE sale_id=$1 ORDER BY id`,
      [saleId],
    ),
  ]);
  const today = bangkokToday();
  return {
    ...head.rows[0],
    lines: lines.rows,
    payments: payments.rows,
    installments: installments.rows.map((row) => ({ ...row, status: installmentStatus(row, today) })),
    guarantors: guarantors.rows,
  };
}

export async function createSale(actor: Actor, body: Record<string, unknown>, key: string) {
  requireRole(actor, salesRoles);
  idempotencyKey(key);
  const saleType = body.saleType ?? "CASH";
  if (saleType !== "CASH" && saleType !== "INSTALLMENT")
    throw new ValidationError({ saleType: "Use CASH or INSTALLMENT." });
  const terms = saleType === "INSTALLMENT" ? parseInstallment(body.installment) : null;
  const customerId = id(body.customerId, "customerId");
  const warehouseId = id(body.warehouseId, "warehouseId");
  const paymentMethod = body.paymentMethod;
  // An installment bill with no down payment records no payment, so no method is needed.
  const needsMethod = !terms || toSatang(terms.downPayment) > BigInt(0);
  if (needsMethod && !paymentMethods.includes(paymentMethod as (typeof paymentMethods)[number]))
    throw new ValidationError({ paymentMethod: "Choose TRANSFER, CASH or CREDIT_CARD." });
  const referenceNo = optionalText(body.referenceNo, "referenceNo", 100);
  const note = optionalText(body.note, "note", 2000);
  const lines = parseLines(body.lines);

  const customer = await timedPoolQuery(`SELECT id FROM app.customers WHERE id=$1`, [customerId]);
  if (!customer.rowCount) throw new ValidationError({ customerId: "Choose an existing customer." });
  const warehouse = await timedPoolQuery<{ branch_id: number }>(
    `SELECT branch_id FROM app.warehouses WHERE id=$1 AND active`,
    [warehouseId],
  );
  if (!warehouse.rowCount) throw new ValidationError({ warehouseId: "Choose an active warehouse." });
  const branchId = warehouse.rows[0].branch_id;
  requireBranch(actor, branchId);
  const products = await timedPoolQuery<{ id: number; serial_tracked: boolean; sale_price: string | null }>(
    `SELECT id,serial_tracked,sale_price FROM app.products WHERE id=ANY($1::integer[]) AND active`,
    [lines.map((line) => line.productId)],
  );
  if (products.rowCount !== lines.length)
    throw new ValidationError({ lines: "One or more products are inactive or missing." });
  const byId = new Map(products.rows.map((product) => [product.id, product]));

  let total = BigInt(0);
  const priced = lines.map((line) => {
    const product = byId.get(line.productId)!;
    const unitPrice = line.unitPrice ?? product.sale_price;
    if (unitPrice == null)
      throw new ValidationError({ unitPrice: "This product has no sale price; enter a price." });
    if (product.serial_tracked) {
      const count = Number(line.quantity);
      if (
        !Number.isInteger(count) ||
        line.serialNumbers.length !== count ||
        new Set(line.serialNumbers).size !== count
      )
        throw new ValidationError({ serialNumbers: "Provide one unique serial per item." });
    } else if (line.serialNumbers.length)
      throw new ValidationError({ serialNumbers: "This product does not track serials." });
    const unitSatang = toSatang(unitPrice);
    const lineTotal = lineTotalSatang(line.quantity, unitSatang);
    total += lineTotal;
    return { ...line, unitPrice: fromSatang(unitSatang), lineTotal: fromSatang(lineTotal), tracked: product.serial_tracked };
  });
  const totalAmount = fromSatang(total);
  const schedule = terms
    ? buildSchedule({
        priceSatang: total,
        ratePct: terms.ratePct,
        downSatang: toSatang(terms.downPayment),
        months: terms.months,
        firstDueOn: terms.firstDueOn,
      })
    : null;
  if (terms && terms.firstDueOn < bangkokToday())
    throw new ValidationError({ firstDueOn: "First due date cannot be before today." });

  const hash = createHash("sha256")
    .update(JSON.stringify({ actor: actor.id, customerId, warehouseId, paymentMethod, referenceNo, note, lines: priced, saleType, terms }))
    .digest("hex");
  return withTransaction(async (client) => {
    const prior = await client.query<{ result_entity_id: number; request_hash: string; operation: string }>(
      `SELECT result_entity_id,request_hash,operation FROM app.idempotency_keys WHERE key=$1 FOR UPDATE`,
      [key],
    );
    if (prior.rowCount) {
      if (prior.rows[0].request_hash !== hash || prior.rows[0].operation !== "SALE_CREATE")
        throw new ApiError(409, "IDEMPOTENCY_CONFLICT", "This key was used with different data.");
      return { id: prior.rows[0].result_entity_id, repeated: true };
    }
    const document = await client.query<{ id: number }>(
      `INSERT INTO app.inventory_documents(kind,warehouse_id,reason,posted_by_id) VALUES ('SALE',$1,'Sale',$2) RETURNING id`,
      [warehouseId, actor.id],
    );
    const documentId = document.rows[0].id;
    const sale = await client.query<{ id: number; record_no: string }>(
      `INSERT INTO app.sales(sale_type,customer_id,branch_id,warehouse_id,total_amount,inventory_document_id,note,created_by_id,
        down_payment,interest_rate,interest_amount,financed_amount,months,installment_amount,first_due_on)
      VALUES ($8,$1,$2,$3,$4,$5,$6,$7,$9,$10,$11,$12,$13,$14,$15) RETURNING id,record_no`,
      [
        customerId, branchId, warehouseId, totalAmount, documentId, note, actor.id, saleType,
        ...(terms && schedule
          ? [terms.downPayment, terms.ratePct, fromSatang(schedule.interestSatang), fromSatang(schedule.financedSatang),
             terms.months, fromSatang(schedule.installmentSatang), terms.firstDueOn]
          : Array(7).fill(null)),
      ],
    );
    const saleId = sale.rows[0].id;
    for (const line of priced) {
      await postInventoryLine(client, {
        documentId,
        warehouseId,
        productId: line.productId,
        quantity: `-${line.quantity}`,
        serialNumbers: line.serialNumbers,
      });
      if (line.tracked) await issueSerials(client, line.productId, line.serialNumbers, warehouseId);
      await client.query(
        `INSERT INTO app.sale_lines(sale_id,product_id,quantity,unit_price,line_total,serial_numbers) VALUES ($1,$2,$3,$4,$5,$6)`,
        [saleId, line.productId, line.quantity, line.unitPrice, line.lineTotal, line.serialNumbers],
      );
    }
    if (terms && schedule) {
      await client.query(
        `INSERT INTO app.sale_installments(sale_id,seq,due_on,amount)
        SELECT $1,seq,due_on,amount FROM unnest($2::int[],$3::date[],$4::numeric[]) AS t(seq,due_on,amount)`,
        [
          saleId,
          schedule.installments.map((row) => row.seq),
          schedule.installments.map((row) => row.dueOn),
          schedule.installments.map((row) => fromSatang(row.amountSatang)),
        ],
      );
      for (const g of terms.guarantors)
        await client.query(
          `INSERT INTO app.sale_guarantors(sale_id,full_name,phone,citizen_id,address,relationship) VALUES ($1,$2,$3,$4,$5,$6)`,
          [saleId, g.fullName, g.phone, g.citizenId, g.address, g.relationship],
        );
    }
    const paidNow = terms ? terms.downPayment : totalAmount;
    if (!terms || toSatang(paidNow) > BigInt(0))
      await client.query(
        `INSERT INTO app.sale_payments(sale_id,kind,method,amount,reference_no,created_by_id) VALUES ($1,$2,$3,$4,$5,$6)`,
        [saleId, terms ? "DOWN_PAYMENT" : "CASH_SALE", paymentMethod, paidNow, referenceNo, actor.id],
      );
    await client.query(
      `INSERT INTO app.idempotency_keys(key,actor_user_id,operation,request_hash,result_entity_id) VALUES ($1,$2,'SALE_CREATE',$3,$4)`,
      [key, actor.id, hash, saleId],
    );
    await audit(client, actor, "SALE_CREATED", "sales", saleId, {
      customerId, warehouseId, totalAmount, saleType, paymentMethod, inventoryDocumentId: documentId,
    });
    return { id: saleId, recordNo: sale.rows[0].record_no, repeated: false };
  });
}

export async function cancelSale(actor: Actor, saleId: number, reasonValue: unknown) {
  requireRole(actor, cancelRoles);
  const reason = text(reasonValue, "reason", 2000);
  return withTransaction(async (client) => {
    const sale = await client.query<{ branch_id: number; cancelled_at: Date | null; inventory_document_id: number; sale_type: string }>(
      `SELECT branch_id,cancelled_at,inventory_document_id,sale_type FROM app.sales WHERE id=$1 FOR UPDATE`,
      [saleId],
    );
    if (!sale.rowCount) throw new NotFoundError("Sale");
    const row = sale.rows[0];
    requireBranch(actor, row.branch_id);
    if (row.cancelled_at)
      throw new ApiError(409, "ALREADY_CANCELLED", "This sale was already cancelled.");
    if (row.sale_type === "INSTALLMENT") {
      const paid = await client.query(
        `SELECT 1 FROM app.sale_payments WHERE sale_id=$1 AND kind='INSTALLMENT' AND voided_at IS NULL LIMIT 1`,
        [saleId],
      );
      if (paid.rowCount)
        throw new ApiError(409, "HAS_INSTALLMENT_PAYMENTS", "Void the installment payments before cancelling this bill.");
    }
    const document = await client.query<{ kind: string; warehouse_id: number; transfer_pair_id: number | null }>(
      `SELECT kind,warehouse_id,transfer_pair_id FROM app.inventory_documents WHERE id=$1`,
      [row.inventory_document_id],
    );
    const reversalDocumentIds = await reverseDocumentInTx(
      client, actor, row.inventory_document_id, document.rows[0], reason,
    );
    await client.query(
      `UPDATE app.sale_payments SET voided_at=now(),voided_by_id=$2,void_reason=$3 WHERE sale_id=$1 AND voided_at IS NULL`,
      [saleId, actor.id, reason],
    );
    await client.query(
      `UPDATE app.sales SET cancelled_at=now(),cancelled_by_id=$2,cancel_reason=$3 WHERE id=$1`,
      [saleId, actor.id, reason],
    );
    await audit(client, actor, "SALE_CANCELLED", "sales", saleId, { reason, reversalDocumentIds });
    return { id: saleId, reversalDocumentIds };
  });
}

// Products with stock in one warehouse, for the sale form: default price and AVAILABLE serials included.
export async function listSellableStock(actor: Actor, search: URLSearchParams) {
  requireRole(actor, salesRoles);
  const warehouseId = id(search.get("warehouseId"), "warehouseId");
  const q = search.get("q")?.trim() ?? "";
  if (q.length > 100) throw new ValidationError({ q: "Use at most 100 characters." });
  const warehouse = await timedPoolQuery<{ branch_id: number }>(
    `SELECT branch_id FROM app.warehouses WHERE id=$1 AND active`,
    [warehouseId],
  );
  if (!warehouse.rowCount) throw new ValidationError({ warehouseId: "Choose an active warehouse." });
  requireBranch(actor, warehouse.rows[0].branch_id);
  // shortcut: lookup capped at 50, add paging if a warehouse sells >50 distinct SKUs
  const result = await timedPoolQuery(
    `SELECT p.id,p.sku,p.name,p.sale_price,p.serial_tracked,b.quantity AS on_hand,
      CASE WHEN p.serial_tracked THEN COALESCE((SELECT array_agg(s.serial_no ORDER BY s.serial_no)
        FROM app.product_serials s WHERE s.product_id=p.id AND s.warehouse_id=$1 AND s.status='AVAILABLE'), '{}')
        ELSE '{}' END AS serials
    FROM app.products p JOIN app.stock_balances b ON b.product_id=p.id AND b.warehouse_id=$1
    WHERE p.active AND b.quantity > 0
      AND ($2::text = '' OR p.sku ILIKE '%' || $2 || '%' OR p.name ILIKE '%' || $2 || '%')
    ORDER BY p.sku LIMIT 50`,
    [warehouseId, q],
  );
  return result.rows;
}
