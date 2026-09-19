"use client";

import { apiGet, apiPatch, apiPost } from "@/lib/api/client";

function path(id?: string) { return `/api/products${id ? `/${encodeURIComponent(id)}` : ""}`; }
export function listProducts(query = "") { return apiGet<unknown[]>(`${path()}${query}`); }
export function getProduct(id: string) { return apiGet<unknown>(path(id)); }
export function createProduct(body: unknown) { return apiPost<unknown>(path(), body); }
export function updateProduct(id: string, body: unknown) { return apiPatch<unknown>(path(id), body); }
export function listProductUnits(productId: string) { return apiGet<unknown[]>(`${path(productId)}/units`); }
export function createProductUnit(productId: string, body: unknown) { return apiPost<unknown>(`${path(productId)}/units`, body); }
export function updateProductUnit(productId: string, unitId: string, body: unknown) { return apiPatch<unknown>(`${path(productId)}/units/${encodeURIComponent(unitId)}`, body); }
export function listProductBarcodes(productId: string) { return apiGet<unknown[]>(`${path(productId)}/barcodes`); }
export function createProductBarcode(productId: string, body: unknown) { return apiPost<unknown>(`${path(productId)}/barcodes`, body); }
export function updateProductBarcode(productId: string, barcodeId: string, body: unknown) { return apiPatch<unknown>(`${path(productId)}/barcodes/${encodeURIComponent(barcodeId)}`, body); }
export function listSafetyStockRules(query = "") { return apiGet<unknown[]>(`/api/safety-stock-rules${query}`); }
export function createSafetyStockRule(body: unknown) { return apiPost<unknown>("/api/safety-stock-rules", body); }
export function getSafetyStockRule(id: string) { return apiGet<unknown>(`/api/safety-stock-rules/${encodeURIComponent(id)}`); }
export function updateSafetyStockRule(id: string, body: unknown) { return apiPatch<unknown>(`/api/safety-stock-rules/${encodeURIComponent(id)}`, body); }

