"use client";

import { apiGet } from "@/lib/api/client";

export function listStockBalances(query = "") { return apiGet<unknown[]>(`/api/stock/balances${query}`); }
export function listStockLedger(query = "") { return apiGet<unknown[]>(`/api/stock/ledger${query}`); }
export function listNetworkStock(query = "") { return apiGet<unknown[]>(`/api/stock/network${query}`); }

