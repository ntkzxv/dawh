import type { FacilityScopeType } from "@/lib/access/types";
import type { AccountStatus } from "@/lib/admin/users/types";

export type AdminTabKey =
  | "users"
  | "roles"
  | "scopes"
  | "organization"
  | "products"
  | "stock"
  | "safety_stock"
  | "audit_logs";

export type AuditLogCategoryKey =
  | "all"
  | "security"
  | "organization"
  | "products"
  | "inventory";

export type ProductSubTabKey =
  | "products"
  | "categories"
  | "brands_uoms"
  | "reasons";

export type RoleSubTabKey =
  | "assignments"
  | "roles"
  | "matrix"
  | "history";

export interface AuditLogRecord {
  id: string;
  organizationId: string;
  requestId: string;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  facilityId: string | null;
  facilityCode: string | null;
  facilityName: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: string;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  accountStatus: AccountStatus;
  statusReason?: string;
  profileComplete: boolean;
  username: string | null;
  facility: { id: string; code: string; name: string } | null;
  department: { id: string; code: string; name: string } | null;
  roles: Array<{
    assignmentId: string;
    roleId: string;
    code: string;
    name: string;
    validFrom: string | null;
    validUntil: string | null;
  }>;
  facilityScopes: Array<{
    id: string;
    facilityId: string;
    facilityCode: string;
    scopeType: FacilityScopeType;
    validFrom: string | null;
    validUntil: string | null;
    version: number;
  }>;
  createdAt: string;
}

export interface CanonicalRole {
  id: string;
  code: string;
  name: string;
  nameTh: string;
  description: string;
  isSystemAdmin?: boolean;
  permissions: string[];
}

export interface RoleAssignmentHistory {
  id: string;
  userId: string;
  userName: string;
  roleCode: string;
  roleName: string;
  action: "ASSIGN" | "REVOKE";
  validFrom: string | null;
  validUntil: string | null;
  reason?: string;
  performedBy: string;
  timestamp: string;
}

export interface FacilityRecord {
  id: string;
  code: string;
  name: string;
  type: "CENTRAL_WAREHOUSE" | "BRANCH";
  address: string;
  province: string;
  latitude: number;
  longitude: number;
  manager: string;
  isActive: boolean;
}

export type LocationType =
  | "Zone"
  | "Aisle"
  | "Rack"
  | "Shelf"
  | "Bin"
  | "Receiving"
  | "Storage"
  | "Picking"
  | "Packing"
  | "Dispatch"
  | "Quarantine"
  | "Damaged"
  | "Return";

export interface WarehouseLocationRecord {
  id: string;
  facilityId: string;
  facilityCode: string;
  code: string;
  name: string;
  type: LocationType;
  status: "ACTIVE" | "BLOCKED" | "MAINTENANCE";
  parentId: string | null;
  path: string;
  depth: number;
}

export interface DepartmentRecord {
  id: string;
  code: string;
  name: string;
  nameTh: string;
  manager: string;
  isActive: boolean;
}

export interface ProductCategoryRecord {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  parentId: string | null;
  depth: number;
}

export interface BrandRecord {
  id: string;
  code: string;
  name: string;
  country: string;
}

export interface UnitOfMeasureRecord {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  symbol: string;
}

export interface ReasonCodeRecord {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  category: "ADJUSTMENT" | "CLAIM" | "OPERATIONAL";
  description: string;
}

export interface ProductRecord {
  id: string;
  sku: string;
  nameTh: string;
  nameEn: string;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  baseUnit: string;
  trackingMethod: "NONE" | "LOT" | "SERIAL";
  pickingStrategy: "FIFO" | "FEFO";
  weightKg: number;
  dimensionsCm: { width: number; length: number; height: number };
  shelfLifeDays: number;
  storageCondition: string;
  isActive: boolean;
  units: Array<{
    id: string;
    unitCode: string;
    unitName: string;
    multiplier: number;
  }>;
  barcodes: Array<{
    id: string;
    barcode: string;
    unitCode: string;
    isPrimary: boolean;
  }>;
}

export interface SafetyStockRuleRecord {
  id: string;
  facilityId: string;
  facilityCode: string;
  facilityName: string;
  productId: string;
  productSku: string;
  productName: string;
  minQty: number;
  maxQty: number;
  reorderPoint: number;
  safetyQty: number;
  currentBalance: number;
}

export interface StockBalanceRecord {
  id: string;
  facilityCode: string;
  facilityName: string;
  locationCode: string;
  sku: string;
  productName: string;
  baseUnit: string;
  onHand: number;
  reserved: number;
  available: number;
  status: "USABLE" | "QUARANTINE" | "DAMAGED";
  updatedAt: string;
}

export interface StockLedgerRecord {
  id: string;
  timestamp: string;
  facilityCode: string;
  referenceDoc: string;
  transactionType: "RECEIVE" | "PUTAWAY" | "PICK" | "TRANSFER" | "ADJUST" | "CLAIM";
  sku: string;
  productName: string;
  qtyChange: number;
  balanceAfter: number;
  operatorName: string;
}
