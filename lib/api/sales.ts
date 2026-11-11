"use client";

import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { ApiListPage } from "@/lib/api/warehouse";
import { WAREHOUSE_TABLE_PAGE_SIZE } from "@/lib/warehouse/pagination-config";

export type PaymentMethod = "TRANSFER" | "CASH" | "CREDIT_CARD";
export type Customer = {
  id: number;
  full_name: string;
  phone: string;
  citizen_id: string | null;
  address: string | null;
  note: string | null;
  created_at: string;
};
export type CustomerInput = {
  fullName: string;
  phone: string;
  citizenId?: string;
  address?: string;
  note?: string;
};
export type SaleSummary = {
  id: number;
  record_no: string;
  sale_type: "CASH" | "INSTALLMENT";
  customer_id: number;
  customer_name: string;
  branch_id: number;
  warehouse_id: number;
  sold_on: string;
  total_amount: string;
  payment_method: PaymentMethod | null;
  created_at: string;
  cancelled_at: string | null;
  outstanding?: string | null;
  next_due_on?: string | null;
};
export type SaleLine = {
  id: number;
  product_id: number;
  sku: string;
  product_name: string;
  quantity: string;
  unit_price: string;
  line_total: string;
  serial_numbers: string[];
};
export type SalePayment = {
  id: number;
  record_no: string;
  kind: "CASH_SALE" | "DOWN_PAYMENT" | "INSTALLMENT";
  method: PaymentMethod;
  amount: string;
  paid_on: string;
  reference_no: string | null;
  created_at: string;
  voided_at: string | null;
  void_reason: string | null;
};
export type SaleInstallment = {
  seq: number;
  due_on: string;
  amount: string;
  paid_amount: string;
  status: "PAID" | "PARTIAL" | "OVERDUE" | "UPCOMING";
};
export type SaleGuarantor = {
  id: number;
  full_name: string;
  phone: string;
  citizen_id: string | null;
  address: string | null;
  relationship: string | null;
};
export type Organization = { name: string; phone: string | null; address: string | null };
export type Receipt = Pick<SalePayment, "id" | "record_no" | "kind" | "method" | "amount" | "paid_on" | "reference_no" | "voided_at" | "void_reason"> & {
  sale_id: number;
  sale_record_no: string;
  sale_type: SaleSummary["sale_type"];
  sold_on: string;
  total_amount: string;
  cancelled_at: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  branch_name: string;
  created_by_name: string;
  organization: Organization | null;
};
export type SaleDetail = SaleSummary & {
  down_payment: string | null;
  interest_rate: string | null;
  interest_amount: string | null;
  financed_amount: string | null;
  months: number | null;
  installment_amount: string | null;
  first_due_on: string | null;
  installments: SaleInstallment[];
  guarantors: SaleGuarantor[];
  customer_phone: string;
  customer_address: string | null;
  created_by_name: string;
  organization: Organization | null;
  warehouse_name: string;
  branch_name: string;
  note: string | null;
  cancel_reason: string | null;
  closed_at: string | null;
  lines: SaleLine[];
  payments: SalePayment[];
};
export type SellableProduct = {
  id: number;
  sku: string;
  name: string;
  sale_price: string | null;
  serial_tracked: boolean;
  on_hand: string;
  serials: string[];
};
export type PaymentInput = { amount: string; method: PaymentMethod; paidOn?: string; referenceNo?: string };
export type SaleInput = {
  customerId: number;
  warehouseId: number;
  saleType: "CASH" | "INSTALLMENT";
  paymentMethod?: PaymentMethod;
  installment?: {
    downPayment: string;
    interestRate: string;
    months: number;
    firstDueOn: string;
    guarantors: { fullName: string; phone: string; citizenId?: string; address?: string; relationship?: string }[];
  };
  referenceNo?: string;
  note?: string;
  lines: { productId: number; quantity: string; unitPrice?: string; serialNumbers?: string[] }[];
};

export type ArPayment = {
  id: number;
  record_no: string;
  kind: SalePayment["kind"];
  method: PaymentMethod;
  amount: string;
  paid_on: string;
  reference_no: string | null;
  voided_at: string | null;
  sale_id: number;
  sale_record_no: string;
  customer_id: number;
  customer_name: string;
};
export type ArOverview = {
  open_contracts: number;
  outstanding: string;
  overdue_count: number;
  overdue_amount: string;
  customers: number;
  recent_payments: Pick<ArPayment, "id" | "record_no" | "kind" | "amount" | "paid_on" | "sale_id" | "sale_record_no" | "customer_name">[];
};
export type OverdueInstallment = {
  id: number;
  sale_id: number;
  record_no: string;
  customer_id: number;
  customer_name: string;
  phone: string;
  seq: number;
  due_on: string;
  amount: string;
  paid_amount: string;
  days_overdue: number;
};
export type CustomerProfile = Customer & {
  summary: { cash_count: number; installment_count: number; total_purchased: string; outstanding: string; overdue_amount: string };
};

async function listPage<T>(path: string, cursor: string | null, query: string, signal?: AbortSignal, extra: Record<string, string> = {}): Promise<ApiListPage<T>> {
  const params = new URLSearchParams({ limit: String(WAREHOUSE_TABLE_PAGE_SIZE), ...extra });
  if (cursor) params.set("cursor", cursor);
  if (query.trim()) params.set("q", query.trim());
  const response = await apiGet<T[]>(`${path}?${params}`, { signal });
  if (!response.page) throw new Error("List response has no page information.");
  return { items: response.data, page: response.page };
}

export const salesApi = {
  customersPage: (cursor: string | null, query: string, signal?: AbortSignal) =>
    listPage<Customer>("/api/sales/customers", cursor, query, signal),
  createCustomer: async (body: CustomerInput) =>
    (await apiPost<Customer>("/api/sales/customers", body)).data,
  updateCustomer: async (id: number, body: Partial<CustomerInput>) =>
    (await apiPatch<Customer>(`/api/sales/customers/${id}`, body)).data,
  salesPage: (cursor: string | null, query: string, signal?: AbortSignal, saleType = "", customerId = 0) =>
    listPage<SaleSummary>("/api/sales/bills", cursor, query, signal, {
      ...(saleType ? { saleType } : {}),
      ...(customerId ? { customerId: String(customerId) } : {}),
    }),
  openInstallments: (cursor: string | null, query: string, signal?: AbortSignal) =>
    listPage<SaleSummary>("/api/sales/bills", cursor, query, signal, { saleType: "INSTALLMENT", open: "true" }),
  // A/R views: contracts = installment bills, open=true hides closed ones.
  contractsPage: (cursor: string | null, query: string, signal: AbortSignal | undefined, openOnly: boolean, customerId = 0) =>
    listPage<SaleSummary>("/api/sales/bills", cursor, query, signal, {
      saleType: "INSTALLMENT",
      ...(openOnly ? { open: "true" } : {}),
      ...(customerId ? { customerId: String(customerId) } : {}),
    }),
  arOverview: async (signal?: AbortSignal) => (await apiGet<ArOverview>("/api/sales/ar/overview", { signal })).data,
  arOverdue: (cursor: string | null, query: string, signal?: AbortSignal) =>
    listPage<OverdueInstallment>("/api/sales/ar/overdue", cursor, query, signal),
  arPayments: (cursor: string | null, query: string, signal?: AbortSignal, kind = "", customerId = 0) =>
    listPage<ArPayment>("/api/sales/ar/payments", cursor, query, signal, {
      ...(kind ? { kind } : {}),
      ...(customerId ? { customerId: String(customerId) } : {}),
    }),
  customerProfile: async (id: number, signal?: AbortSignal) =>
    (await apiGet<CustomerProfile>(`/api/sales/ar/customers/${id}`, { signal })).data,
  recordPayment: async (saleId: number, body: PaymentInput, idempotencyKey: string) =>
    (
      await apiPost<{ id: number; recordNo: string; closed: boolean }>(`/api/sales/bills/${saleId}/payments`, body, {
        headers: { "Idempotency-Key": idempotencyKey },
      })
    ).data,
  voidPayment: async (paymentId: number, reason: string) =>
    (await apiPost<{ id: number }>(`/api/sales/payments/${paymentId}/void`, { reason })).data,
  receipt: async (id: number, signal?: AbortSignal) =>
    (await apiGet<Receipt>(`/api/sales/payments/${id}`, { signal })).data,
  sale: async (id: number, signal?: AbortSignal) =>
    (await apiGet<SaleDetail>(`/api/sales/bills/${id}`, { signal })).data,
  createSale: async (body: SaleInput, idempotencyKey: string) =>
    (
      await apiPost<{ id: number; repeated: boolean }>("/api/sales/bills", body, {
        headers: { "Idempotency-Key": idempotencyKey },
      })
    ).data,
  sellableStock: async (warehouseId: string, query: string, signal?: AbortSignal) =>
    (await apiGet<SellableProduct[]>(`/api/sales/stock?${new URLSearchParams({ warehouseId, q: query.trim() })}`, { signal })).data,
  cancelSale: async (id: number, reason: string) =>
    (await apiPost<{ id: number }>(`/api/sales/bills/${id}/cancel`, { reason })).data,
};
