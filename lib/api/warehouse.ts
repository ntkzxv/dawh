"use client";

import { apiDelete, apiGet, apiPatch, apiPost, apiRequest } from "@/lib/api/client";

export type Role = "ADMIN" | "CEO" | "MANAGER" | "COUNTER_STAFF" | "EMPLOYEE";
export type Me = { id: number; authUserId: string; role: Role; branchIds: number[]; mustChangePassword: boolean };
export type MemberProfile = {
  employeeCode: string | null;
  phone: string | null;
  address: string | null;
  startedOn: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
};
export type MemberSummary = { id: number; name: string; role: Role; branchIds: number[]; detailLevel: "SUMMARY" };
export type MemberFull = Omit<MemberSummary, "detailLevel"> & {
  detailLevel: "FULL"; email: string; mustChangePassword: boolean;
  deletedAt: string | null; profile: MemberProfile;
};
export type Member = MemberSummary | MemberFull;
export type MemberUpdate = {
  name?: string; email?: string; role?: Role; branchIds?: number[];
  profile?: Partial<MemberProfile>;
};
export type Organization = { id: number; name: string; phone: string | null; address: string | null } | null;
export type CatalogKind = "branches" | "warehouses" | "suppliers" | "units" | "product-groups" | "product-categories" | "brands" | "product-models" | "products";
export type CatalogItem = { id: number; code?: string; sku?: string; name: string; active?: boolean; branch_id?: number; unit_id?: number; serial_tracked?: boolean; reorder_point?: string | null; [key: string]: unknown };
export type PurchaseOrder = { id: number; record_no: string; supplier_id: number; supplier_name?: string; ordered_by_ceo_id: number; ordered_at: string; note: string | null; closed_at: string | null; carrier_receipt_count?: number; lines?: PurchaseOrderLine[]; supplierReceipts?: SupplierReceipt[]; carrierReceipts?: CarrierReceipt[]; goodsReceipts?: GoodsReceipt[] };
export type PurchaseOrderLine = { id: number; product_id: number; sku: string; product_name: string; quantity: string; unit_price: string; unit_code: string; supplier_quantity: string; carrier_document_quantity: string | null; counted_good_quantity: string; posted_good_quantity: string; damaged_quantity: string; wrong_quantity: string; remaining_good_quantity: string };
export type MediaLink = { media_asset_id: number; page_number: number; mime_type: string };
export type SupplierReceipt = { id: number; record_no: string; purchase_order_id: number; purchase_order_no?: string; supplier_name?: string; external_doc_no: string | null; document_date: string | null; total_amount: string | null; lines?: Array<{ id: number; product_name: string; quantity: string; unit_price: string | null }>; media?: MediaLink[]; warnings?: string[] };
export type CarrierReceipt = { id: number; record_no: string; purchase_order_id: number; purchase_order_no?: string; external_doc_no: string | null; carrier_name: string | null; tracking_no: string | null; package_count: number | null; receiving_branch_id?: number | null; received_at?: string | null; confirmation?: { receiving_branch_id: number; received_at: string; actual_package_count: number; package_condition: string } | null; media?: MediaLink[]; lines?: Array<{ id: number; product_name: string; quantity: string | null }> ; warnings?: string[] };
export type GoodsReceipt = { id: number; record_no: string; carrier_receipt_id: number; carrier_receipt_no?: string; purchase_order_no?: string; receiving_branch_id: number; warehouse_id: number; branch_name?: string; warehouse_name?: string; counted_at: string; posted_at: string | null; lines?: Array<{ id: number; product_name: string; good_quantity: string; damaged_quantity: string; wrong_quantity: string }>; media?: MediaLink[] };
export type StockBalance = { warehouse_id: number; product_id: number; quantity: string; updated_at: string; branch_id: number; warehouse_name: string; branch_name: string; sku: string; product_name: string; unit_code: string };
export type StockMovement = { id: number; product_id: number; warehouse_id: number; quantity_delta: string; occurred_at: string; document_id: number; record_no: string; kind: string; warehouse_name: string; sku: string; product_name: string; [key: string]: unknown };
export type Issue = { id: number; title: string; detail: string; status: string; created_at: string; purchase_order_id: number | null; carrier_receipt_id: number | null; goods_receipt_id: number | null; quantity: string | null; events?: Array<{ id: number; status: string; note: string; created_at: string }>; claims?: Array<{ id: number; contacted_party: string | null; outcome: string | null; contacted_at: string | null }>; media?: MediaLink[] };
export type OutstandingLine = { purchase_order_id: number; purchase_order_no: string; ordered_at: string; supplier_name: string; sku: string; product_name: string; ordered_quantity: string; counted_good_quantity: string; posted_good_quantity: string; remaining_good_quantity: string };
export type AuditEvent = { id: number; action: string; entity_type: string; entity_id: number; actor_email: string | null; created_at: string };

const data = async <T>(promise: ReturnType<typeof apiGet<T>>): Promise<T> => (await promise).data;
export const warehouseApi = {
  me: () => data(apiGet<Me>("/api/me")),
  changeInitialPassword: (currentPassword: string, newPassword: string) => data(apiPost<{ changed: boolean }>("/api/me/change-initial-password", { currentPassword, newPassword })),
  organization: () => data(apiGet<Organization>("/api/org")),
  saveOrganization: (body: { name: string; phone?: string; address?: string }, exists: boolean) => data(exists ? apiPatch<Organization>("/api/org", body) : apiPost<Organization>("/api/org", body)),
  members: () => data(apiGet<Member[]>("/api/org/members")),
  member: (id: number) => data(apiGet<Member>(`/api/org/members/${id}`)),
  ceos: () => data(apiGet<Array<{ id: number; name: string }>>("/api/org/ceos")),
  createMember: (body: { name: string; email: string; role: Role; branchIds: number[]; initialPassword: string; profile?: Partial<MemberProfile> }) => data(apiPost<MemberFull>("/api/org/members", body)),
  updateMember: (id: number, body: MemberUpdate) => data(apiPatch<Member>(`/api/org/members/${id}`, body)),
  deleteMember: (id: number) => data(apiDelete<Member>(`/api/org/members/${id}`)),
  restoreMember: (id: number) => data(apiPost<Member>(`/api/org/members/${id}/restore`, {})),
  resetMemberPassword: (id: number, initialPassword: string) => data(apiPost<unknown>(`/api/org/members/${id}/reset-password`, { initialPassword })),
  catalog: (kind: CatalogKind) => data(apiGet<CatalogItem[]>(`/api/catalog/${kind}`)),
  createCatalog: (kind: CatalogKind, body: Record<string, unknown>) => data(apiPost<CatalogItem>(`/api/catalog/${kind}`, body)),
  updateCatalog: (kind: CatalogKind, id: number, body: Record<string, unknown>) => data(apiPatch<CatalogItem>(`/api/catalog/${kind}/${id}`, body)),
  purchaseOrders: () => data(apiGet<PurchaseOrder[]>("/api/purchase-orders")),
  purchaseOrder: (id: number) => data(apiGet<PurchaseOrder>(`/api/purchase-orders/${id}`)),
  createPurchaseOrder: (body: Record<string, unknown>) => data(apiPost<PurchaseOrder>("/api/purchase-orders", body)),
  updatePurchaseOrder: (id: number, body: Record<string, unknown>) => data(apiPatch<PurchaseOrder>(`/api/purchase-orders/${id}`, body)),
  closePurchaseOrder: (id: number) => data(apiPost<PurchaseOrder>(`/api/purchase-orders/${id}/close`, {})),
  supplierReceipts: () => data(apiGet<SupplierReceipt[]>("/api/supplier-receipts")),
  supplierReceipt: (id: number) => data(apiGet<SupplierReceipt>(`/api/supplier-receipts/${id}`)),
  createSupplierReceipt: (body: Record<string, unknown>) => data(apiPost<SupplierReceipt>("/api/supplier-receipts", body)),
  updateSupplierReceipt: (id: number, body: Record<string, unknown>) => data(apiPatch<SupplierReceipt>(`/api/supplier-receipts/${id}`, body)),
  carrierReceipts: () => data(apiGet<CarrierReceipt[]>("/api/carrier-receipts")),
  carrierReceipt: (id: number) => data(apiGet<CarrierReceipt>(`/api/carrier-receipts/${id}`)),
  createCarrierReceipt: (body: Record<string, unknown>) => data(apiPost<CarrierReceipt>("/api/carrier-receipts", body)),
  updateCarrierReceipt: (id: number, body: Record<string, unknown>) => data(apiPatch<CarrierReceipt>(`/api/carrier-receipts/${id}`, body)),
  confirmDelivery: (id: number, body: Record<string, unknown>) => data(apiPost<unknown>(`/api/carrier-receipts/${id}/confirm`, body)),
  goodsReceipts: () => data(apiGet<GoodsReceipt[]>("/api/goods-receipts")),
  goodsReceipt: (id: number) => data(apiGet<GoodsReceipt>(`/api/goods-receipts/${id}`)),
  createGoodsReceipt: (body: Record<string, unknown>) => data(apiPost<GoodsReceipt>("/api/goods-receipts", body)),
  postGoodsReceipt: (id: number) => data(apiPost<unknown>(`/api/goods-receipts/${id}/post`, {}, { headers: { "Idempotency-Key": crypto.randomUUID() } })),
  balances: (params?: URLSearchParams) => data(apiGet<StockBalance[]>(`/api/stock/balances${params?.size ? `?${params}` : ""}`)),
  ledger: (params?: URLSearchParams) => data(apiGet<StockMovement[]>(`/api/stock/ledger${params?.size ? `?${params}` : ""}`)),
  createStockDocument: (body: Record<string, unknown>) => data(apiPost<unknown>("/api/stock/documents", body, { headers: { "Idempotency-Key": crypto.randomUUID() } })),
  reverseStockDocument: (id: number, reason: string) => data(apiPost<unknown>(`/api/stock/documents/${id}/reverse`, { reason })),
  issues: () => data(apiGet<Issue[]>("/api/issues")),
  issue: (id: number) => data(apiGet<Issue>(`/api/issues/${id}`)),
  createIssue: (body: Record<string, unknown>) => data(apiPost<Issue>("/api/issues", body)),
  addIssueEvent: (id: number, body: Record<string, unknown>) => data(apiPost<Issue>(`/api/issues/${id}/events`, body)),
  addClaim: (id: number, body: Record<string, unknown>) => data(apiPost<unknown>(`/api/issues/${id}/claims`, body)),
  receiptReport: () => data(apiGet<Record<string, unknown>[]>("/api/reports/receipts")),
  outstandingReport: () => data(apiGet<OutstandingLine[]>("/api/reports/outstanding")),
  audit: () => data(apiGet<AuditEvent[]>("/api/audit")),
  upload: async (file: File) => { const form = new FormData(); form.append("file", file); return data(apiRequest<{ id: number; sha256: string }>("/api/media", { method: "POST", body: form })); },
  evidenceUrl: (id: number) => `/api/media/${id}`,
};
