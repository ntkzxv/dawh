"use client";

import { apiGet, apiPatch, apiPost, type ApiPage } from "@/lib/api/client";
import type { AdminUserSummary, AccountStatus } from "@/lib/admin/users/types";

function query(params: Record<string, string | number | boolean | null | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  }
  const result = search.toString();
  return result ? `?${result}` : "";
}

export type AdminUserPage = { data: AdminUserSummary[]; page?: ApiPage };

export function listAdminUsers(filters: Record<string, string | number | boolean | null | undefined> = {}) {
  return apiGet<AdminUserSummary[]>(`/api/admin/users${query(filters)}`);
}

export function getAdminUser(userId: string) {
  return apiGet<AdminUserSummary>(`/api/admin/users/${encodeURIComponent(userId)}`);
}

export function changeAccountStatus(userId: string, status: AccountStatus, reason: string) {
  return apiPatch<AdminUserSummary>(`/api/admin/users/${encodeURIComponent(userId)}/status`, { status, reason });
}

export function listRoles() {
  return apiGet<unknown[]>("/api/admin/roles");
}

export function listPermissions() {
  return apiGet<unknown[]>("/api/admin/permissions");
}

export function assignRole(userId: string, body: { roleId: string; validFrom: string | null; validUntil: string | null }) {
  return apiPost<unknown>(`/api/admin/users/${encodeURIComponent(userId)}/role-assignments`, body);
}

export function revokeRole(userId: string, assignmentId: string, reason: string) {
  return apiPost<unknown>(`/api/admin/users/${encodeURIComponent(userId)}/role-assignments/${encodeURIComponent(assignmentId)}/revoke`, { reason });
}

export function assignFacilityScope(userId: string, body: { facilityId: string; scopeType: string; validFrom: string | null; validUntil: string | null }) {
  return apiPost<unknown>(`/api/admin/users/${encodeURIComponent(userId)}/facility-scopes`, body);
}

export function updateFacilityScope(userId: string, scopeId: string, body: { scopeType: string; validFrom: string | null; validUntil: string | null; version: number }) {
  return apiPatch<unknown>(`/api/admin/users/${encodeURIComponent(userId)}/facility-scopes/${encodeURIComponent(scopeId)}`, body);
}

export function revokeFacilityScope(userId: string, scopeId: string, version: number, reason: string) {
  return apiPost<unknown>(`/api/admin/users/${encodeURIComponent(userId)}/facility-scopes/${encodeURIComponent(scopeId)}/revoke`, { version, reason });
}

export function listAuditLogsApi(params: Record<string, string | number | boolean | null | undefined> = {}) {
  return apiGet<import("@/lib/audit/types").AuditLogRecord[]>(`/api/admin/audit-logs${query(params)}`);
}

