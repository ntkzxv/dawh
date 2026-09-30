"use client";

import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiRequest,
} from "@/lib/api/client";
import type {
  CatalogKind,
  MemberProfile,
  Role,
} from "@/lib/contracts/warehouse";
import type { ApiPage } from "@/lib/api/client";

export type {
  CatalogKind,
  MemberProfile,
  Role,
} from "@/lib/contracts/warehouse";
export type Me = {
  id: number;
  authUserId: string;
  role: Role;
  branchIds: number[];
  name: string;
  nameTh?: string | null;
  nameEn?: string | null;
  email: string;
  image: string | null;
};
export type MemberSummary = {
  id: number;
  name: string;
  image?: string | null;
  role: Role;
  branchIds: number[];
  deletedAt?: string | null;
  detailLevel: "SUMMARY";
};
export type MemberFull = Omit<MemberSummary, "detailLevel"> & {
  detailLevel: "FULL";
  email: string;
  image?: string | null;
  deletedAt: string | null;
  profile: MemberProfile;
};
export type Member = MemberSummary | MemberFull;
export type MemberUpdate = {
  name?: string;
  email?: string;
  image?: string | null;
  role?: Role;
  branchIds?: number[];
  profile?: Partial<MemberProfile>;
};
export type Organization = {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
} | null;
export type CatalogItem = {
  id: number;
  code?: string;
  sku?: string;
  name: string;
  active?: boolean;
  branch_id?: number;
  unit_id?: number;
  serial_tracked?: boolean;
  reorder_point?: string | null;
  [key: string]: unknown;
};
export type PurchaseOrder = {
  id: number;
  record_no: string;
  supplier_id: number;
  supplier_name?: string;
  ordered_by_ceo_id: number;
  ordered_at: string;
  note: string | null;
  closed_at: string | null;
  carrier_receipt_count?: number;
  lines?: PurchaseOrderLine[];
  supplierReceipts?: SupplierReceipt[];
  carrierReceipts?: CarrierReceipt[];
  goodsReceipts?: GoodsReceipt[];
};
export type PurchaseOrderLine = {
  id: number;
  product_id: number;
  sku: string;
  product_name: string;
  quantity: string;
  unit_price: string;
  unit_code: string;
  supplier_quantity: string;
  carrier_document_quantity: string | null;
  counted_good_quantity: string;
  posted_good_quantity: string;
  damaged_quantity: string;
  wrong_quantity: string;
  remaining_good_quantity: string;
};
export type MediaLink = {
  media_asset_id: number;
  page_number: number;
  mime_type: string;
};
export type SupplierReceipt = {
  id: number;
  record_no: string;
  purchase_order_id: number;
  purchase_order_no?: string;
  supplier_name?: string;
  external_doc_no: string | null;
  document_date: string | null;
  total_amount: string | null;
  lines?: Array<{
    id: number;
    product_name: string;
    quantity: string;
    unit_price: string | null;
  }>;
  media?: MediaLink[];
  warnings?: string[];
};
export type CarrierReceipt = {
  id: number;
  record_no: string;
  purchase_order_id: number;
  purchase_order_no?: string;
  external_doc_no: string | null;
  carrier_name: string | null;
  tracking_no: string | null;
  package_count: number | null;
  receiving_branch_id?: number | null;
  received_at?: string | null;
  has_goods_receipt?: boolean;
  confirmation?: {
    receiving_branch_id: number;
    received_at: string;
    actual_package_count: number;
    package_condition: string;
  } | null;
  media?: MediaLink[];
  lines?: Array<{ id: number; product_name: string; quantity: string | null }>;
  warnings?: string[];
};
export type GoodsReceipt = {
  id: number;
  record_no: string;
  carrier_receipt_id: number;
  carrier_receipt_no?: string;
  purchase_order_no?: string;
  receiving_branch_id: number;
  warehouse_id: number;
  branch_name?: string;
  warehouse_name?: string;
  counted_at: string;
  posted_at: string | null;
  lines?: Array<{
    id: number;
    product_name: string;
    good_quantity: string;
    damaged_quantity: string;
    wrong_quantity: string;
  }>;
  media?: MediaLink[];
};
export type StockBalance = {
  warehouse_id: number;
  product_id: number;
  quantity: string;
  updated_at: string;
  branch_id: number;
  warehouse_name: string;
  branch_name: string;
  sku: string;
  product_name: string;
  unit_code: string;
};
export type StockMovement = {
  id: number;
  product_id: number;
  warehouse_id: number;
  quantity_delta: string;
  occurred_at: string;
  document_id: number;
  record_no: string;
  kind: string;
  warehouse_name: string;
  sku: string;
  product_name: string;
  [key: string]: unknown;
};
export type Issue = {
  id: number;
  title: string;
  detail: string;
  status: string;
  created_at: string;
  purchase_order_id: number | null;
  carrier_receipt_id: number | null;
  goods_receipt_id: number | null;
  quantity: string | null;
  events?: Array<{
    id: number;
    status: string;
    note: string;
    created_at: string;
  }>;
  claims?: Array<{
    id: number;
    contacted_party: string | null;
    outcome: string | null;
    contacted_at: string | null;
  }>;
  media?: MediaLink[];
};
export type OutstandingLine = {
  purchase_order_id: number;
  purchase_order_no: string;
  ordered_at: string;
  supplier_name: string;
  sku: string;
  product_name: string;
  ordered_quantity: string;
  counted_good_quantity: string;
  posted_good_quantity: string;
  remaining_good_quantity: string;
};
export type AuditEvent = {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  actor_name: string | null;
  actor_email: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
};
export type WarehouseOverview = {
  purchaseOrderCount: number;
  carrierReceiptCount: number;
  openPurchaseOrders: number;
  awaitingDelivery: number;
  stockItems: number;
  openIssues: number;
};
export type InventoryProduct = CatalogItem & {
  category_id: number | null;
  category_name: string | null;
  brand_id: number | null;
  brand_name: string | null;
  unit_id: number;
  unit_code: string;
  cost: string | null;
  sale_price: string | null;
  reorder_point: string | null;
  on_hand: string;
  warehouse_names: string | null;
  status: "in_stock" | "low_stock" | "out_of_stock";
};
export type ApiListPage<T> = { items: T[]; page: ApiPage };

async function cursorPage<T>(
  path: string,
  params: URLSearchParams,
  signal?: AbortSignal,
): Promise<ApiListPage<T>> {
  const response = await apiGet<T[]>(`${path}?${params}`, { signal });
  if (!response.page)
    throw new Error("List response has no page information.");
  return { items: response.data, page: response.page };
}

function cursorParams(cursor?: string | null) {
  const params = new URLSearchParams({ limit: "20" });
  if (cursor) params.set("cursor", cursor);
  return params;
}

const data = async <T>(promise: ReturnType<typeof apiGet<T>>): Promise<T> =>
  (await promise).data;

let pendingCurrentMeRequest: Promise<Me> | null = null;

function getCurrentMe() {
  if (pendingCurrentMeRequest) return pendingCurrentMeRequest;

  const request = data(apiGet<Me>("/api/me")).finally(() => {
    if (pendingCurrentMeRequest === request) pendingCurrentMeRequest = null;
  });
  pendingCurrentMeRequest = request;
  return request;
}

export const warehouseApi = {
  me: getCurrentMe,
  overview: (signal?: AbortSignal) =>
    data(apiGet<WarehouseOverview>("/api/warehouse/overview", { signal })),
  inventoryProducts: async (
    params: URLSearchParams,
    signal?: AbortSignal,
  ): Promise<ApiListPage<InventoryProduct>> => {
    const response = await apiGet<InventoryProduct[]>(
      `/api/warehouse/inventory/products?${params}`,
      { signal },
    );
    if (!response.page)
      throw new Error("Inventory response has no page information.");
    return { items: response.data, page: response.page };
  },
  changeEmail: (newEmail: string, confirmNewEmail: string) =>
    data(
      apiPost<{ changed: boolean; email: string }>("/api/me/change-email", {
        newEmail,
        confirmNewEmail,
      }),
    ),
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string,
  ) =>
    data(
      apiPost<{ changed: boolean }>("/api/me/change-password", {
        currentPassword,
        newPassword,
        confirmNewPassword,
      }),
    ),
  organization: (signal?: AbortSignal) =>
    data(apiGet<Organization>("/api/org", { signal })),
  saveOrganization: (
    body: { name: string; phone?: string; address?: string },
    exists: boolean,
  ) =>
    data(
      exists
        ? apiPatch<Organization>("/api/org", body)
        : apiPost<Organization>("/api/org", body),
    ),
  members: () => data(apiGet<Member[]>("/api/org/members")),
  membersSummary: (signal?: AbortSignal) =>
    data(apiGet<MemberSummary[]>("/api/org/members?view=summary", { signal })),
  member: (id: number) => data(apiGet<MemberFull>(`/api/org/members/${id}`)),
  ceos: (signal?: AbortSignal) =>
    data(
      apiGet<Array<{ id: number; name: string }>>("/api/org/ceos", { signal }),
    ),
  createMember: (body: {
    name: string;
    email: string;
    role: Role;
    branchIds: number[];
    initialPassword: string;
    profile?: Partial<MemberProfile>;
  }) => data(apiPost<MemberFull>("/api/org/members", body)),
  updateMember: (id: number, body: MemberUpdate) =>
    data(apiPatch<Member>(`/api/org/members/${id}`, body)),
  deleteMember: (id: number) =>
    data(apiDelete<Member>(`/api/org/members/${id}`)),
  restoreMember: (id: number) =>
    data(apiPost<Member>(`/api/org/members/${id}/restore`, {})),
  resetMemberPassword: (id: number, initialPassword: string) =>
    data(
      apiPost<unknown>(`/api/org/members/${id}/reset-password`, {
        initialPassword,
      }),
    ),
  catalog: (kind: CatalogKind, signal?: AbortSignal) =>
    data(apiGet<CatalogItem[]>(`/api/catalog/${kind}`, { signal })),
  catalogPage: async (
    kind: CatalogKind,
    params: URLSearchParams,
    signal?: AbortSignal,
  ): Promise<ApiListPage<CatalogItem>> => {
    const response = await apiGet<CatalogItem[]>(
      `/api/catalog/${kind}?${params}`,
      { signal },
    );
    if (!response.page)
      throw new Error("Catalog response has no page information.");
    return { items: response.data, page: response.page };
  },
  searchProducts: (query: string, signal?: AbortSignal) =>
    data(
      apiGet<CatalogItem[]>(
        `/api/catalog/products?lookup=1&q=${encodeURIComponent(query)}`,
        { signal },
      ),
    ),
  createCatalog: (kind: CatalogKind, body: Record<string, unknown>) =>
    data(apiPost<CatalogItem>(`/api/catalog/${kind}`, body)),
  updateCatalog: (
    kind: CatalogKind,
    id: number,
    body: Record<string, unknown>,
  ) => data(apiPatch<CatalogItem>(`/api/catalog/${kind}/${id}`, body)),
  purchaseOrdersPage: (
    cursor?: string | null,
    signal?: AbortSignal,
    query?: string,
  ) => {
    const params = cursorParams(cursor);
    if (query?.trim()) params.set("q", query.trim());
    return cursorPage<PurchaseOrder>("/api/purchase-orders", params, signal);
  },
  purchaseOrder: (id: number, signal?: AbortSignal) =>
    data(apiGet<PurchaseOrder>(`/api/purchase-orders/${id}`, { signal })),
  createPurchaseOrder: (body: Record<string, unknown>) =>
    data(apiPost<PurchaseOrder>("/api/purchase-orders", body)),
  updatePurchaseOrder: (id: number, body: Record<string, unknown>) =>
    data(apiPatch<PurchaseOrder>(`/api/purchase-orders/${id}`, body)),
  closePurchaseOrder: (id: number) =>
    data(apiPost<PurchaseOrder>(`/api/purchase-orders/${id}/close`, {})),
  supplierReceiptsPage: (cursor?: string | null, signal?: AbortSignal) =>
    cursorPage<SupplierReceipt>(
      "/api/supplier-receipts",
      cursorParams(cursor),
      signal,
    ),
  supplierReceipt: (id: number) =>
    data(apiGet<SupplierReceipt>(`/api/supplier-receipts/${id}`)),
  createSupplierReceipt: (body: Record<string, unknown>) =>
    data(apiPost<SupplierReceipt>("/api/supplier-receipts", body)),
  updateSupplierReceipt: (id: number, body: Record<string, unknown>) =>
    data(apiPatch<SupplierReceipt>(`/api/supplier-receipts/${id}`, body)),
  carrierReceiptsPage: (cursor?: string | null, signal?: AbortSignal) =>
    cursorPage<CarrierReceipt>(
      "/api/carrier-receipts",
      cursorParams(cursor),
      signal,
    ),
  carrierReceipt: (id: number, signal?: AbortSignal) =>
    data(apiGet<CarrierReceipt>(`/api/carrier-receipts/${id}`, { signal })),
  createCarrierReceipt: (body: Record<string, unknown>) =>
    data(apiPost<CarrierReceipt>("/api/carrier-receipts", body)),
  updateCarrierReceipt: (id: number, body: Record<string, unknown>) =>
    data(apiPatch<CarrierReceipt>(`/api/carrier-receipts/${id}`, body)),
  confirmDelivery: (id: number, body: Record<string, unknown>) =>
    data(apiPost<unknown>(`/api/carrier-receipts/${id}/confirm`, body)),
  goodsReceiptsPage: (cursor?: string | null, signal?: AbortSignal) =>
    cursorPage<GoodsReceipt>(
      "/api/goods-receipts",
      cursorParams(cursor),
      signal,
    ),
  goodsReceipt: (id: number) =>
    data(apiGet<GoodsReceipt>(`/api/goods-receipts/${id}`)),
  createGoodsReceipt: (body: Record<string, unknown>) =>
    data(apiPost<GoodsReceipt>("/api/goods-receipts", body)),
  postGoodsReceipt: (id: number) =>
    data(
      apiPost<unknown>(
        `/api/goods-receipts/${id}/post`,
        {},
        { headers: { "Idempotency-Key": crypto.randomUUID() } },
      ),
    ),
  balances: (params?: URLSearchParams) =>
    data(
      apiGet<StockBalance[]>(
        `/api/stock/balances${params?.size ? `?${params}` : ""}`,
      ),
    ),
  ledger: (params?: URLSearchParams) =>
    data(
      apiGet<StockMovement[]>(
        `/api/stock/ledger${params?.size ? `?${params}` : ""}`,
      ),
    ),
  balancesPage: async (
    params: URLSearchParams,
    signal?: AbortSignal,
  ): Promise<ApiListPage<StockBalance>> => {
    const response = await apiGet<StockBalance[]>(
      `/api/stock/balances?${params}`,
      { signal },
    );
    if (!response.page)
      throw new Error("Balance response has no page information.");
    return { items: response.data, page: response.page };
  },
  ledgerPage: async (
    params: URLSearchParams,
    signal?: AbortSignal,
  ): Promise<ApiListPage<StockMovement>> => {
    const response = await apiGet<StockMovement[]>(
      `/api/stock/ledger?${params}`,
      { signal },
    );
    if (!response.page)
      throw new Error("Ledger response has no page information.");
    return { items: response.data, page: response.page };
  },
  createStockDocument: (body: Record<string, unknown>) =>
    data(
      apiPost<unknown>("/api/stock/documents", body, {
        headers: { "Idempotency-Key": crypto.randomUUID() },
      }),
    ),
  reverseStockDocument: (id: number, reason: string) =>
    data(apiPost<unknown>(`/api/stock/documents/${id}/reverse`, { reason })),
  issuesPage: (cursor?: string | null, signal?: AbortSignal) =>
    cursorPage<Issue>("/api/issues", cursorParams(cursor), signal),
  issue: (id: number, signal?: AbortSignal) =>
    data(apiGet<Issue>(`/api/issues/${id}`, { signal })),
  createIssue: (body: Record<string, unknown>) =>
    data(apiPost<Issue>("/api/issues", body)),
  addIssueEvent: (id: number, body: Record<string, unknown>) =>
    data(apiPost<Issue>(`/api/issues/${id}/events`, body)),
  addClaim: (id: number, body: Record<string, unknown>) =>
    data(apiPost<unknown>(`/api/issues/${id}/claims`, body)),
  receiptReportPage: (cursor?: string | null, signal?: AbortSignal) =>
    cursorPage<Record<string, unknown>>(
      "/api/reports/receipts",
      cursorParams(cursor),
      signal,
    ),
  outstandingReportPage: (cursor?: string | null, signal?: AbortSignal) =>
    cursorPage<OutstandingLine>(
      "/api/reports/outstanding",
      cursorParams(cursor),
      signal,
    ),
  audit: (signal?: AbortSignal) =>
    data(apiGet<AuditEvent[]>("/api/audit", { signal })),
  auditPage: (
    params: { category: string; q?: string; from?: string; to?: string; action?: string; entityType?: string; sort?: string; page?: number },
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams({ category: params.category });
    if (params.q) query.set("q", params.q);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.action) query.set("action", params.action);
    if (params.entityType) query.set("entityType", params.entityType);
    if (params.sort) query.set("sort", params.sort);
    if (params.page && params.page > 1) query.set("page", String(params.page));
    return apiGet<{
      items: AuditEvent[];
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    }>(`/api/audit?${query.toString()}`, { signal });
  },
  upload: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return data(
      apiRequest<{ id: number; sha256: string }>("/api/media", {
        method: "POST",
        body: form,
      }),
    );
  },
  evidenceUrl: (id: number) => `/api/media/${id}`,
};
