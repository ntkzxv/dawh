"use client";

import { apiGet, apiPatch, apiPost } from "@/lib/api/client";

function resourcePath(resource: string, id?: string) {
  return `/api/${resource}${id ? `/${encodeURIComponent(id)}` : ""}`;
}

export function listFacilities(query = "") { return apiGet<unknown[]>(`/api/facilities${query}`); }
export function getFacility(id: string) { return apiGet<unknown>(resourcePath("facilities", id)); }
export function createFacility(body: unknown) { return apiPost<unknown>("/api/facilities", body); }
export function updateFacility(id: string, body: unknown) { return apiPatch<unknown>(resourcePath("facilities", id), body); }
export function listFacilityLocations(id: string) { return apiGet<unknown[]>(`${resourcePath("facilities", id)}/locations`); }
export function createFacilityLocation(id: string, body: unknown) { return apiPost<unknown>(`${resourcePath("facilities", id)}/locations`, body); }
export function getLocation(id: string) { return apiGet<unknown>(resourcePath("locations", id)); }
export function updateLocation(id: string, body: unknown) { return apiPatch<unknown>(resourcePath("locations", id), body); }
export function listDepartments() { return apiGet<unknown[]>("/api/departments"); }
export function getDepartment(id: string) { return apiGet<unknown>(resourcePath("departments", id)); }
export function createDepartment(body: unknown) { return apiPost<unknown>("/api/departments", body); }
export function updateDepartment(id: string, body: unknown) { return apiPatch<unknown>(resourcePath("departments", id), body); }

export const productReferenceApi = {
  listCategories: () => apiGet<unknown[]>("/api/product-categories"),
  getCategory: (id: string) => apiGet<unknown>(`/api/product-categories/${encodeURIComponent(id)}`),
  createCategory: (body: unknown) => apiPost<unknown>("/api/product-categories", body),
  updateCategory: (id: string, body: unknown) => apiPatch<unknown>(`/api/product-categories/${encodeURIComponent(id)}`, body),
  listBrands: () => apiGet<unknown[]>("/api/brands"),
  getBrand: (id: string) => apiGet<unknown>(`/api/brands/${encodeURIComponent(id)}`),
  createBrand: (body: unknown) => apiPost<unknown>("/api/brands", body),
  updateBrand: (id: string, body: unknown) => apiPatch<unknown>(`/api/brands/${encodeURIComponent(id)}`, body),
  listUnits: () => apiGet<unknown[]>("/api/units-of-measure"),
  getUnit: (id: string) => apiGet<unknown>(`/api/units-of-measure/${encodeURIComponent(id)}`),
  createUnit: (body: unknown) => apiPost<unknown>("/api/units-of-measure", body),
  updateUnit: (id: string, body: unknown) => apiPatch<unknown>(`/api/units-of-measure/${encodeURIComponent(id)}`, body),
  listReasonCodes: () => apiGet<unknown[]>("/api/reason-codes"),
  getReasonCode: (id: string) => apiGet<unknown>(`/api/reason-codes/${encodeURIComponent(id)}`),
  createReasonCode: (body: unknown) => apiPost<unknown>("/api/reason-codes", body),
  updateReasonCode: (id: string, body: unknown) => apiPatch<unknown>(`/api/reason-codes/${encodeURIComponent(id)}`, body),
};

