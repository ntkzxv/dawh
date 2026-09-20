"use client";

import { apiGet } from "@/lib/api/client";
import type { AdminUserSummary } from "@/lib/admin/users/types";
import type { RoleDto } from "@/lib/admin/roles/types";
import type { Facility } from "@/lib/facilities/types";
import type { LocationDto } from "@/lib/locations/types";
import type { DepartmentDto } from "@/lib/departments/types";
import type { ProductCategoryDto } from "@/lib/product-categories/types";
import type { BrandDto } from "@/lib/brands/types";
import type { UnitOfMeasureDto } from "@/lib/units-of-measure/types";
import type { ReasonCodeDto } from "@/lib/reason-codes/types";
import type { Product } from "@/lib/products/types";
import type { SafetyStockRuleDto } from "@/lib/safety-stock/types";
import type { StockBalance, StockLedgerLine } from "@/lib/stock/types";
import type {
  ControlPanelTab,
  ControlPanelTabData,
} from "@/lib/admin/control-panel/types";

import type {
  AdminUserRecord,
  CanonicalRole,
  FacilityRecord,
  WarehouseLocationRecord,
  DepartmentRecord,
  ProductCategoryRecord,
  BrandRecord,
  UnitOfMeasureRecord,
  ReasonCodeRecord,
  ProductRecord,
  SafetyStockRuleRecord,
  StockBalanceRecord,
  StockLedgerRecord,
  LocationType,
} from "@/components/controlpanel/types";

// ============================================================================
// Thai Name Mapping for Roles
// ============================================================================
const ROLE_THAI_NAMES: Record<string, string> = {
  SYSTEM_ADMINISTRATOR: "ผู้ดูแลระบบสูงสุด",
  HQ_AREA_MANAGER: "ผู้จัดการส่วนกลาง",
  WAREHOUSE_MANAGER: "ผู้จัดการคลังสินค้า",
  STOCK_CONTROLLER: "ผู้ควบคุมสต็อกสินค้า",
  PICKER_PACKER: "เจ้าหน้าที่จัดและแพ็คสินค้า",
  BRANCH_REQUESTER: "ผู้ขอเบิกสินค้าประจำสาขา",
  BRANCH_RECEIVER: "ผู้รับสินค้าประจำสาขา",
  CLAIM_OFFICER: "เจ้าหน้าที่งานเคลม",
  AUDITOR: "ผู้ตรวจสอบระบบ",
};

// ============================================================================
// Data Mappers (Backend DTO -> UI Record)
// ============================================================================
export function mapUserSummaryToRecord(u: AdminUserSummary): AdminUserRecord {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    accountStatus: u.accountStatus,
    profileComplete: u.profileComplete,
    username: u.username,
    facility: u.facility,
    department: u.department,
    roles: u.roles || [],
    facilityScopes: u.facilityScopes || [],
    createdAt: u.createdAt,
  };
}

export function mapRoleDtoToCanonicalRole(r: RoleDto): CanonicalRole {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    nameTh: ROLE_THAI_NAMES[r.code] || r.name,
    description: r.description || "",
    isSystemAdmin: r.isSystem || r.code === "SYSTEM_ADMINISTRATOR",
    permissions: r.permissions || [],
  };
}

export function mapFacilityDtoToRecord(f: Facility): FacilityRecord {
  const addressParts = [
    f.addressLine1,
    f.addressLine2,
    f.subdistrict,
    f.district,
    f.province,
    f.postalCode,
  ].filter(Boolean);

  return {
    id: f.id,
    code: f.code,
    name: f.name,
    type: (f.facilityType as "CENTRAL_WAREHOUSE" | "BRANCH") || "BRANCH",
    address: addressParts.join(" ") || "-",
    province: f.province || "-",
    latitude: Number(f.latitude) || 13.7563,
    longitude: Number(f.longitude) || 100.5018,
    manager: "-",
    isActive: f.isActive,
  };
}

export function mapLocationDtoToRecord(l: LocationDto): WarehouseLocationRecord {
  const typeMap: Record<string, LocationType> = {
    ZONE: "Zone",
    AISLE: "Aisle",
    RACK: "Rack",
    SHELF: "Shelf",
    BIN: "Bin",
    RECEIVING: "Receiving",
    STORAGE: "Storage",
    PICKING: "Picking",
    PACKING: "Packing",
    DISPATCH: "Dispatch",
    QUARANTINE: "Quarantine",
    DAMAGED: "Damaged",
    RETURN: "Return",
  };

  const resolvedType =
    typeMap[l.hierarchyType] ||
    typeMap[l.locationType] ||
    "Zone";

  return {
    id: l.id,
    facilityId: l.facilityId,
    facilityCode: l.facilityCode,
    code: l.code,
    name: l.name,
    type: resolvedType,
    status: l.status,
    parentId: l.parentId,
    path: l.path || l.code,
    depth: l.depth || 1,
  };
}

export function mapDepartmentDtoToRecord(d: DepartmentDto): DepartmentRecord {
  return {
    id: d.id,
    code: d.code,
    name: d.name,
    nameTh: d.name,
    manager: "-",
    isActive: d.isActive,
  };
}

export function mapCategoryDtoToRecord(c: ProductCategoryDto): ProductCategoryRecord {
  return {
    id: c.id,
    code: c.code,
    nameTh: c.name,
    nameEn: c.name,
    parentId: c.parentId,
    depth: 1,
  };
}

export function mapBrandDtoToRecord(b: BrandDto): BrandRecord {
  return {
    id: b.id,
    code: b.code,
    name: b.name,
    country: "Thailand",
  };
}

export function mapUomDtoToRecord(u: UnitOfMeasureDto): UnitOfMeasureRecord {
  return {
    id: u.id,
    code: u.code,
    nameTh: u.name,
    nameEn: u.name,
    symbol: u.code,
  };
}

export function mapReasonCodeDtoToRecord(r: ReasonCodeDto): ReasonCodeRecord {
  const cat = r.domain === "CLAIM" ? "CLAIM" : "ADJUSTMENT";
  return {
    id: r.id,
    code: r.code,
    nameTh: r.name,
    nameEn: r.name,
    category: cat,
    description: r.description || "-",
  };
}

export function mapProductDtoToRecord(p: Product): ProductRecord {
  return {
    id: p.id,
    sku: p.sku,
    nameTh: p.nameTh,
    nameEn: p.nameEn || p.nameTh,
    categoryId: p.category?.id || "",
    categoryName: p.category?.name || "-",
    brandId: p.brand?.id || "",
    brandName: p.brand?.name || "-",
    baseUnit: p.baseUnit?.code || "PCS",
    trackingMethod: p.trackingMethod,
    pickingStrategy: p.pickingStrategy,
    weightKg: Number(p.weightKg) || 1.0,
    dimensionsCm: {
      width: Number(p.widthCm) || 10,
      length: Number(p.lengthCm) || 10,
      height: Number(p.heightCm) || 10,
    },
    shelfLifeDays: p.shelfLifeDays || 0,
    storageCondition: p.storageCondition || "Dry Ambient",
    isActive: p.isActive,
    units: (p.units || []).map((u) => ({
      id: u.id,
      unitCode: u.unitCode,
      unitName: u.unitCode,
      multiplier: Number(u.baseQuantity) || 1,
    })),
    barcodes: (p.barcodes || []).map((b) => ({
      id: b.id,
      barcode: b.barcode,
      unitCode: p.baseUnit?.code || "PCS",
      isPrimary: b.isPrimary,
    })),
  };
}

export function mapSafetyRuleDtoToRecord(
  rule: SafetyStockRuleDto,
  facilityName = "",
  productName = ""
): SafetyStockRuleRecord {
  return {
    id: rule.id,
    facilityId: rule.facilityId,
    facilityCode: rule.facilityCode,
    facilityName: facilityName || rule.facilityCode,
    productId: rule.productId,
    productSku: rule.sku,
    productName: productName || rule.sku,
    minQty: Number(rule.minimumQuantity) || 0,
    maxQty: Number(rule.maximumQuantity) || 0,
    reorderPoint: Number(rule.reorderPoint) || 0,
    safetyQty: Number(rule.safetyQuantity) || 0,
    currentBalance: 0,
  };
}

export function mapStockBalanceDtoToRecord(b: StockBalance): StockBalanceRecord {
  const onHand = Number(b.quantity) || 0;
  const avail = Number(b.availableQuantity) || 0;
  const reserved = Math.max(0, onHand - avail);

  return {
    id: b.id,
    facilityCode: b.facilityCode,
    facilityName: b.facilityName,
    locationCode: b.locationCode || "-",
    sku: b.sku,
    productName: b.productNameTh,
    baseUnit: b.baseUnit?.code || "PCS",
    onHand,
    reserved,
    available: avail,
    status: (b.stockStatus as "USABLE" | "QUARANTINE" | "DAMAGED") || "USABLE",
    updatedAt: b.updatedAt,
  };
}

export function mapStockLedgerDtoToRecord(l: StockLedgerLine): StockLedgerRecord {
  return {
    id: l.id,
    timestamp: l.occurredAt || l.postedAt,
    facilityCode: l.facilityCode,
    referenceDoc: l.transactionNo || l.referenceId || "-",
    transactionType:
      (l.transactionType as "RECEIVE" | "PUTAWAY" | "PICK" | "TRANSFER" | "ADJUST" | "CLAIM") ||
      "RECEIVE",
    sku: l.sku,
    productName: l.sku,
    qtyChange: Number(l.quantityDelta) || 0,
    balanceAfter: Number(l.quantityAfter) || 0,
    operatorName: l.postedBy || "System",
  };
}

// ============================================================================
// Modular Tab Fetchers (On-Demand / Lazy Loading)
// ============================================================================
export type ControlPanelListQuery = {
  limit?: number;
  cursor?: string | null;
  balanceCursor?: string | null;
  ledgerCursor?: string | null;
  search?: string | null;
  status?: string | null;
  roleCode?: string | null;
  roleAssigned?: boolean | null;
  facilityId?: string | null;
  departmentId?: string | null;
  profileComplete?: boolean | null;
};

function toQueryString(query: ControlPanelListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}

async function fetchControlPanelTab<T extends ControlPanelTab>(
  tab: T,
  query: ControlPanelListQuery = {},
) {
  return apiGet<Extract<ControlPanelTabData, { tab: T }>>(
    `/api/admin/control-panel/${tab}${toQueryString(query)}`,
  );
}

export async function fetchUsersTabData(query?: ControlPanelListQuery) {
  const { data } = await fetchControlPanelTab("users", query);

  return {
    rawUsers: data.users,
    users: data.users.map(mapUserSummaryToRecord),
    roles: data.roles.map(mapRoleDtoToCanonicalRole),
    facilities: data.facilities.map(mapFacilityDtoToRecord),
    departments: data.departments.map(mapDepartmentDtoToRecord),
    page: data.page,
  };
}

export async function fetchRolesTabData(query?: ControlPanelListQuery) {
  const { data } = await fetchControlPanelTab("roles", query);

  return {
    roles: data.roles.map(mapRoleDtoToCanonicalRole),
    permissions: data.permissions,
    rawUsers: data.users,
    users: data.users.map(mapUserSummaryToRecord),
    page: data.page,
  };
}

export async function fetchScopesTabData(query?: ControlPanelListQuery) {
  const { data } = await fetchControlPanelTab("scopes", query);

  return {
    rawUsers: data.users,
    users: data.users.map(mapUserSummaryToRecord),
    facilities: data.facilities.map(mapFacilityDtoToRecord),
    page: data.page,
  };
}

export async function fetchOrganizationTabData() {
  const { data } = await fetchControlPanelTab("organization");

  return {
    rawFacilities: data.facilities,
    rawDepartments: data.departments,
    rawLocations: data.locations,
    facilities: data.facilities.map(mapFacilityDtoToRecord),
    departments: data.departments.map(mapDepartmentDtoToRecord),
    locations: data.locations.map(mapLocationDtoToRecord),
  };
}

export async function fetchProductsTabData(query?: ControlPanelListQuery) {
  const { data } = await fetchControlPanelTab("products", query);

  return {
    rawProducts: data.products,
    rawCategories: data.categories,
    rawBrands: data.brands,
    rawUoms: data.uoms,
    rawReasonCodes: data.reasonCodes,
    products: data.products.map(mapProductDtoToRecord),
    categories: data.categories.map(mapCategoryDtoToRecord),
    brands: data.brands.map(mapBrandDtoToRecord),
    uoms: data.uoms.map(mapUomDtoToRecord),
    reasonCodes: data.reasonCodes.map(mapReasonCodeDtoToRecord),
    page: data.page,
  };
}

export async function fetchStockTabData(query?: ControlPanelListQuery) {
  const { data } = await fetchControlPanelTab("stock", query);

  return {
    balances: data.balances.map(mapStockBalanceDtoToRecord),
    ledger: data.ledger.map(mapStockLedgerDtoToRecord),
    balancePage: data.balancePage,
    ledgerPage: data.ledgerPage,
  };
}

export async function fetchSafetyStockTabData(query?: ControlPanelListQuery) {
  const { data } = await fetchControlPanelTab("safety_stock", query);

  const facilityMap = new Map<string, string>();
  data.facilities.forEach((f) => facilityMap.set(f.id, f.name));

  const productMap = new Map<string, string>();
  data.products.forEach((p) => productMap.set(p.id, p.nameTh));

  return {
    rawSafetyRules: data.safetyRules,
    safetyRules: data.safetyRules.map((r) =>
      mapSafetyRuleDtoToRecord(
        r,
        facilityMap.get(r.facilityId) || r.facilityCode,
        productMap.get(r.productId) || r.sku
      )
    ),
    page: data.page,
  };
}

export async function fetchAuditLogsTabData(query?: ControlPanelListQuery) {
  const { data } = await fetchControlPanelTab("audit_logs", query);
  return data;
}
