import "server-only";

import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import { ApiError, NotFoundError, ValidationError } from "@/lib/core/http/errors";
import { audit, id, optionalText, quantity, requireBranch, requireRole, text, type Actor } from "@/lib/warehouse/core";
import { attachEvidence } from "@/lib/warehouse/media";

type Status = "OPEN" | "FOLLOWING_UP" | "RESOLVED" | "CLOSED";
const statuses: Status[] = ["OPEN", "FOLLOWING_UP", "RESOLVED", "CLOSED"];
const next: Record<Status, Status[]> = { OPEN: ["FOLLOWING_UP", "RESOLVED", "CLOSED"], FOLLOWING_UP: ["RESOLVED", "CLOSED"], RESOLVED: ["CLOSED", "FOLLOWING_UP"], CLOSED: [] };
async function issueBranch(issue: { goods_receipt_id: number | null; carrier_receipt_id: number | null }) {
  if (issue.goods_receipt_id) {
    const result = await dbPool.query<{ receiving_branch_id: number }>(`SELECT receiving_branch_id FROM app.goods_receipts WHERE id=$1`, [issue.goods_receipt_id]);
    return result.rows[0]?.receiving_branch_id ?? null;
  }
  if (issue.carrier_receipt_id) {
    const result = await dbPool.query<{ receiving_branch_id: number }>(`SELECT receiving_branch_id FROM app.delivery_confirmations WHERE carrier_receipt_id=$1`, [issue.carrier_receipt_id]);
    return result.rows[0]?.receiving_branch_id ?? null;
  }
  return null;
}
export async function listIssues(actor: Actor) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const result = await dbPool.query(`SELECT i.*, COALESCE(gr.receiving_branch_id,dc.receiving_branch_id) AS branch_id
    FROM app.issue_reports i LEFT JOIN app.goods_receipts gr ON gr.id=i.goods_receipt_id
    LEFT JOIN app.delivery_confirmations dc ON dc.carrier_receipt_id=i.carrier_receipt_id
    WHERE ($1::boolean OR COALESCE(gr.receiving_branch_id,dc.receiving_branch_id) IS NULL
      OR COALESCE(gr.receiving_branch_id,dc.receiving_branch_id)=ANY($2::integer[]))
    ORDER BY i.id DESC LIMIT 500`, [actor.role === "ADMIN" || actor.role === "CEO", actor.branchIds]);
  return result.rows;
}
export async function getIssue(actor: Actor, issueId: number) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const head = await dbPool.query(`SELECT * FROM app.issue_reports WHERE id=$1`, [issueId]);
  if (!head.rowCount) throw new NotFoundError("Issue report");
  const branchId = await issueBranch(head.rows[0]);
  if (branchId != null) requireBranch(actor, branchId);
  const [events, claims, media] = await Promise.all([
    dbPool.query(`SELECT * FROM app.issue_events WHERE issue_report_id=$1 ORDER BY id`, [issueId]),
    dbPool.query(`SELECT * FROM app.claim_tracking WHERE issue_report_id=$1 ORDER BY id`, [issueId]),
    dbPool.query(`SELECT e.media_asset_id,e.page_number,m.sha256,m.mime_type FROM app.evidence_links e JOIN app.media_assets m ON m.id=e.media_asset_id WHERE e.issue_report_id=$1 ORDER BY e.page_number`, [issueId]),
  ]);
  return { ...head.rows[0], events: events.rows, claims: claims.rows, media: media.rows };
}
export async function createIssue(actor: Actor, body: Record<string, unknown>) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const data = {
    title: text(body.title, "title", 200), detail: text(body.detail, "detail", 10000),
    kind: optionalText(body.kind, "kind", 80),
    poId: body.purchaseOrderId == null ? null : id(body.purchaseOrderId, "purchaseOrderId"),
    carrierId: body.carrierReceiptId == null ? null : id(body.carrierReceiptId, "carrierReceiptId"),
    goodsId: body.goodsReceiptId == null ? null : id(body.goodsReceiptId, "goodsReceiptId"),
    productId: body.productId == null ? null : id(body.productId, "productId"),
    amount: body.quantity == null ? null : quantity(body.quantity, "quantity", true),
    serialNo: optionalText(body.serialNo, "serialNo", 160),
  };
  if (data.goodsId) {
    const related = await dbPool.query<{ carrier_receipt_id: number; purchase_order_id: number }>(`SELECT gr.carrier_receipt_id,cr.purchase_order_id FROM app.goods_receipts gr JOIN app.carrier_receipts cr ON cr.id=gr.carrier_receipt_id WHERE gr.id=$1`, [data.goodsId]);
    if (!related.rowCount) throw new NotFoundError("Goods receipt");
    if ((data.carrierId && data.carrierId !== related.rows[0].carrier_receipt_id) || (data.poId && data.poId !== related.rows[0].purchase_order_id)) throw new ValidationError({ links: "The linked documents must belong to the same purchase order." });
    data.carrierId = related.rows[0].carrier_receipt_id;
    data.poId = related.rows[0].purchase_order_id;
  } else if (data.carrierId) {
    const related = await dbPool.query<{ purchase_order_id: number }>(`SELECT purchase_order_id FROM app.carrier_receipts WHERE id=$1`, [data.carrierId]);
    if (!related.rowCount) throw new NotFoundError("Carrier receipt");
    if (data.poId && data.poId !== related.rows[0].purchase_order_id) throw new ValidationError({ links: "The linked documents must belong to the same purchase order." });
    data.poId = related.rows[0].purchase_order_id;
  }
  if (data.productId && data.poId) {
    const product = await dbPool.query(`SELECT 1 FROM app.purchase_order_lines WHERE purchase_order_id=$1 AND product_id=$2`, [data.poId, data.productId]);
    if (!product.rowCount) throw new ValidationError({ productId: "This product is not on the linked purchase order." });
  }
  const branchId = await issueBranch({ goods_receipt_id: data.goodsId, carrier_receipt_id: data.carrierId });
  if (branchId != null) requireBranch(actor, branchId);
  const newId = await withTransaction(async (client) => {
    const created = await client.query<{ id: number }>(`INSERT INTO app.issue_reports(title,detail,kind,purchase_order_id,carrier_receipt_id,goods_receipt_id,product_id,quantity,serial_no,reported_by_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, [data.title, data.detail, data.kind, data.poId, data.carrierId, data.goodsId, data.productId, data.amount, data.serialNo, actor.id]);
    const issueId = created.rows[0].id;
    await client.query(`INSERT INTO app.issue_events(issue_report_id,status,note,performed_by_id) VALUES ($1,'OPEN',$2,$3)`, [issueId, "Report created", actor.id]);
    await attachEvidence(client, actor, "issue_report_id", issueId, body.mediaAssetIds);
    await audit(client, actor, "ISSUE_REPORTED", "issue_reports", issueId, data);
    return issueId;
  });
  return getIssue(actor, newId);
}
export async function addIssueEvent(actor: Actor, issueId: number, body: Record<string, unknown>) {
  const issue = await getIssue(actor, issueId);
  const status = text(body.status, "status", 30) as Status;
  if (!statuses.includes(status) || !next[issue.status as Status].includes(status)) throw new ValidationError({ status: "Invalid status transition." });
  const note = text(body.note, "note", 3000);
  await withTransaction(async (client) => {
    const updated = await client.query(`UPDATE app.issue_reports SET status=$1,updated_at=now() WHERE id=$2 AND status=$3 RETURNING id`, [status, issueId, issue.status]);
    if (!updated.rowCount) throw new ApiError(409, "STATUS_CHANGED", "Issue status changed. Reload and try again.");
    await client.query(`INSERT INTO app.issue_events(issue_report_id,status,note,performed_by_id) VALUES ($1,$2,$3,$4)`, [issueId, status, note, actor.id]);
    await audit(client, actor, "ISSUE_STATUS_CHANGED", "issue_reports", issueId, { status, note }, { status: issue.status });
  });
  return getIssue(actor, issueId);
}
export async function addClaimNote(actor: Actor, issueId: number, body: Record<string, unknown>) {
  await getIssue(actor, issueId);
  const party = optionalText(body.contactedParty, "contactedParty", 160);
  const contactedAt = body.contactedAt == null ? null : new Date(text(body.contactedAt, "contactedAt", 40));
  const followUpAt = body.followUpAt == null ? null : new Date(text(body.followUpAt, "followUpAt", 40));
  if ((contactedAt && Number.isNaN(contactedAt.getTime())) || (followUpAt && Number.isNaN(followUpAt.getTime()))) throw new ValidationError({ date: "Use a valid timestamp." });
  return withTransaction(async (client) => {
    const created = await client.query(`INSERT INTO app.claim_tracking(issue_report_id,contacted_party,contacted_at,external_reference,follow_up_at,outcome,recorded_by_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [issueId, party, contactedAt, optionalText(body.externalReference, "externalReference", 160), followUpAt, optionalText(body.outcome, "outcome", 3000), actor.id]);
    await audit(client, actor, "CLAIM_NOTE_ADDED", "claim_tracking", created.rows[0].id, created.rows[0]);
    return created.rows[0];
  });
}
