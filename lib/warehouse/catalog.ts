import "server-only";

import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import { ApiError, NotFoundError, ValidationError } from "@/lib/core/http/errors";
import {
  audit,
  id,
  money,
  optionalText,
  requireBranch,
  requireRole,
  text,
  type Actor,
} from "@/lib/warehouse/core";

type Kind = "branches" | "warehouses" | "suppliers" | "units" | "product-groups"
  | "product-categories" | "brands" | "product-models" | "products";

const tables: Record<Kind, string> = {
  branches: "branches",
  warehouses: "warehouses",
  suppliers: "suppliers",
  units: "units",
  "product-groups": "product_groups",
  "product-categories": "product_categories",
  brands: "brands",
  "product-models": "product_models",
  products: "products",
};

const editableColumns: Record<Kind, Record<string, string>> = {
  branches: { code: "code", name: "name", address: "address", active: "active" },
  warehouses: { code: "code", name: "name", active: "active" },
  suppliers: { code: "code", name: "name", contact: "contact", phone: "phone", address: "address", active: "active" },
  units: { code: "code", name: "name" },
  "product-groups": { name: "name" },
  "product-categories": { name: "name", groupId: "group_id" },
  brands: { name: "name" },
  "product-models": { name: "name", brandId: "brand_id" },
  products: {
    sku: "sku", name: "name", groupId: "group_id", categoryId: "category_id",
    brandId: "brand_id", modelId: "model_id", unitId: "unit_id",
    serialTracked: "serial_tracked", cost: "cost", salePrice: "sale_price",
    reorderPoint: "reorder_point", active: "active",
  },
};

function catalog(kind: string): { kind: Kind; table: string } {
  if (!Object.hasOwn(tables, kind)) throw new NotFoundError("Catalog collection");
  return { kind: kind as Kind, table: tables[kind as Kind] };
}

function requireEditor(actor: Actor, kind: Kind) {
  requireRole(actor, kind === "warehouses" ? ["ADMIN", "CEO", "MANAGER"] : ["ADMIN", "CEO"]);
}

function reorderPoint(value: unknown): string | null {
  if (value == null) return null;
  const raw = String(value);
  if (!/^\d{1,15}(?:\.\d{1,3})?$/.test(raw)) {
    throw new ValidationError({ reorderPoint: "Use a nonnegative quantity with at most three decimals." });
  }
  return raw;
}

function createFields(kind: Kind, body: Record<string, unknown>): { columns: string[]; values: unknown[] } {
  switch (kind) {
    case "branches": return {
      columns: ["code", "name", "address"],
      values: [text(body.code, "code", 50), text(body.name, "name", 160), optionalText(body.address, "address", 1000)],
    };
    case "warehouses": return {
      columns: ["branch_id", "code", "name"],
      values: [id(body.branchId, "branchId"), text(body.code, "code", 50), text(body.name, "name", 160)],
    };
    case "suppliers": return {
      columns: ["code", "name", "contact", "phone", "address"],
      values: [
        text(body.code, "code", 50), text(body.name, "name", 160),
        optionalText(body.contact, "contact", 160), optionalText(body.phone, "phone", 50),
        optionalText(body.address, "address", 1000),
      ],
    };
    case "units": return {
      columns: ["code", "name"],
      values: [text(body.code, "code", 30), text(body.name, "name", 80)],
    };
    case "product-groups":
    case "brands": return { columns: ["name"], values: [text(body.name, "name", 160)] };
    case "product-categories": return {
      columns: ["group_id", "name"],
      values: [body.groupId == null ? null : id(body.groupId, "groupId"), text(body.name, "name", 160)],
    };
    case "product-models": return {
      columns: ["brand_id", "name"],
      values: [body.brandId == null ? null : id(body.brandId, "brandId"), text(body.name, "name", 160)],
    };
    case "products": return {
      columns: [
        "sku", "name", "group_id", "category_id", "brand_id", "model_id",
        "unit_id", "serial_tracked", "cost", "sale_price", "reorder_point",
      ],
      values: [
        text(body.sku, "sku", 80), text(body.name, "name", 200),
        body.groupId == null ? null : id(body.groupId, "groupId"),
        body.categoryId == null ? null : id(body.categoryId, "categoryId"),
        body.brandId == null ? null : id(body.brandId, "brandId"),
        body.modelId == null ? null : id(body.modelId, "modelId"),
        id(body.unitId, "unitId"), body.serialTracked === true,
        body.cost == null ? null : money(body.cost, "cost"),
        body.salePrice == null ? null : money(body.salePrice, "salePrice"),
        reorderPoint(body.reorderPoint),
      ],
    };
  }
}

function editValue(key: string, value: unknown): unknown {
  if (key === "active" || key === "serialTracked") {
    if (typeof value !== "boolean") throw new ValidationError({ [key]: "Use true or false." });
    return value;
  }
  if (key.endsWith("Id")) return value == null ? null : id(value, key);
  if (key === "cost" || key === "salePrice") return value == null ? null : money(value, key);
  if (key === "reorderPoint") return reorderPoint(value);
  return value == null ? null : text(value, key, 1000);
}

export async function listCatalog(actor: Actor, inputKind: string) {
  const { kind, table } = catalog(inputKind);
  if (actor.role === "EMPLOYEE" && kind !== "branches" && kind !== "products") {
    throw new ApiError(403, "FORBIDDEN", "This catalog is not available to employees.");
  }
  const scoped = actor.role !== "ADMIN" && actor.role !== "CEO";
  const where = scoped && kind === "branches" ? "WHERE id = ANY($1::integer[])"
    : scoped && kind === "warehouses" ? "WHERE branch_id = ANY($1::integer[])" : "";
  const columns = actor.role === "EMPLOYEE"
    ? kind === "products" ? "id,sku,name,unit_id,serial_tracked,active" : "id,code,name,active"
    : "*";
  const result = await dbPool.query(
    `SELECT ${columns} FROM app.${table} ${where} ORDER BY id DESC LIMIT 500`,
    where ? [actor.branchIds] : [],
  );
  return result.rows;
}

export async function createCatalog(actor: Actor, inputKind: string, body: Record<string, unknown>) {
  const { kind, table } = catalog(inputKind);
  requireEditor(actor, kind);
  const { columns, values } = createFields(kind, body);
  if (kind === "warehouses") requireBranch(actor, values[0] as number);

  return withTransaction(async (client) => {
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
    const result = await client.query(
      `INSERT INTO app.${table}(${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    await audit(client, actor, "CATALOG_CREATED", table, result.rows[0].id, result.rows[0]);
    return result.rows[0];
  });
}

export async function updateCatalog(actor: Actor, inputKind: string, entityId: number, body: Record<string, unknown>) {
  const { kind, table } = catalog(inputKind);
  requireEditor(actor, kind);
  const entries = Object.entries(body);
  if (!entries.length || entries.some(([key]) => !editableColumns[kind][key])) {
    throw new ValidationError({ body: "No editable fields supplied." });
  }
  const values = entries.map(([key, value]) => editValue(key, value));

  return withTransaction(async (client) => {
    const current = await client.query(`SELECT * FROM app.${table} WHERE id = $1 FOR UPDATE`, [entityId]);
    if (!current.rowCount) throw new NotFoundError("Catalog item");
    if (kind === "warehouses") requireBranch(actor, current.rows[0].branch_id);

    const assignments = entries.map(([key], index) => `${editableColumns[kind][key]} = $${index + 1}`).join(", ");
    const result = await client.query(
      `UPDATE app.${table} SET ${assignments} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, entityId],
    );
    await audit(client, actor, "CATALOG_UPDATED", table, entityId, result.rows[0], current.rows[0]);
    return result.rows[0];
  });
}
