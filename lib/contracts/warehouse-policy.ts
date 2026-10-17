import type { CatalogKind, Role } from "./warehouse";

export const stockManagers: readonly Role[] = ["ADMIN", "CEO", "MANAGER"];
export const catalogEditors: readonly Role[] = ["ADMIN", "CEO"];

export function canManageStock(role: Role | null | undefined) {
  return role != null && stockManagers.includes(role);
}

export function canEditCatalog(role: Role | null | undefined, kind: CatalogKind) {
  return role != null && (catalogEditors.includes(role) || (kind === "warehouses" && role === "MANAGER"));
}

export function isGlobalRole(role: Role | null | undefined) {
  return role === "ADMIN" || role === "CEO";
}
