"use client";

import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { AdminUserSummary, AccountStatus } from "@/lib/admin/users/types";
import type { RoleDto, PermissionDto } from "@/lib/admin/roles/types";
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
export async function fetchUsersTabData() {
  const [usersRes, rolesRes, facilitiesRes, departmentsRes] = await Promise.all([
    apiGet<AdminUserSummary[]>("/api/admin/users?limit=100").catch(() => ({ data: [] })),
    apiGet<RoleDto[]>("/api/admin/roles").catch(() => ({ data: [] })),
    apiGet<Facility[]>("/api/facilities?limit=50").catch(() => ({ data: [] })),
    apiGet<DepartmentDto[]>("/api/departments").catch(() => ({ data: [] })),
  ]);

  return {
    rawUsers: usersRes.data || [],
    users: (usersRes.data || []).map(mapUserSummaryToRecord),
    roles: (rolesRes.data || []).map(mapRoleDtoToCanonicalRole),
    facilities: (facilitiesRes.data || []).map(mapFacilityDtoToRecord),
    departments: (departmentsRes.data || []).map(mapDepartmentDtoToRecord),
  };
}

export async function fetchRolesTabData() {
  const [rolesRes, permissionsRes, usersRes] = await Promise.all([
    apiGet<RoleDto[]>("/api/admin/roles").catch(() => ({ data: [] })),
    apiGet<PermissionDto[]>("/api/admin/permissions").catch(() => ({ data: [] })),
    apiGet<AdminUserSummary[]>("/api/admin/users?limit=100").catch(() => ({ data: [] })),
  ]);

  return {
    roles: (rolesRes.data || []).map(mapRoleDtoToCanonicalRole),
    permissions: permissionsRes.data || [],
    rawUsers: usersRes.data || [],
    users: (usersRes.data || []).map(mapUserSummaryToRecord),
  };
}

export async function fetchScopesTabData() {
  const [usersRes, facilitiesRes] = await Promise.all([
    apiGet<AdminUserSummary[]>("/api/admin/users?limit=100").catch(() => ({ data: [] })),
    apiGet<Facility[]>("/api/facilities?limit=50").catch(() => ({ data: [] })),
  ]);

  return {
    rawUsers: usersRes.data || [],
    users: (usersRes.data || []).map(mapUserSummaryToRecord),
    facilities: (facilitiesRes.data || []).map(mapFacilityDtoToRecord),
  };
}

export async function fetchOrganizationTabData() {
  const [facilitiesRes, departmentsRes] = await Promise.all([
    apiGet<Facility[]>("/api/facilities?limit=50").catch(() => ({ data: [] })),
    apiGet<DepartmentDto[]>("/api/departments").catch(() => ({ data: [] })),
  ]);

  let allLocations: LocationDto[] = [];
  if (facilitiesRes.data && facilitiesRes.data.length > 0) {
    const locResults = await Promise.all(
      facilitiesRes.data.map((f) =>
        apiGet<LocationDto[]>(`/api/facilities/${encodeURIComponent(f.id)}/locations`).catch(
          () => ({ data: [] })
        )
      )
    );
    allLocations = locResults.flatMap((r) => r.data || []);
  }

  return {
    rawFacilities: facilitiesRes.data || [],
    rawDepartments: departmentsRes.data || [],
    rawLocations: allLocations,
    facilities: (facilitiesRes.data || []).map(mapFacilityDtoToRecord),
    departments: (departmentsRes.data || []).map(mapDepartmentDtoToRecord),
    locations: allLocations.map(mapLocationDtoToRecord),
  };
}

export async function fetchProductsTabData() {
  const [productsRes, categoriesRes, brandsRes, uomsRes, reasonCodesRes] = await Promise.all([
    apiGet<Product[]>("/api/products?limit=100").catch(() => ({ data: [] })),
    apiGet<ProductCategoryDto[]>("/api/product-categories").catch(() => ({ data: [] })),
    apiGet<BrandDto[]>("/api/brands").catch(() => ({ data: [] })),
    apiGet<UnitOfMeasureDto[]>("/api/units-of-measure").catch(() => ({ data: [] })),
    apiGet<ReasonCodeDto[]>("/api/reason-codes").catch(() => ({ data: [] })),
  ]);

  return {
    rawProducts: productsRes.data || [],
    rawCategories: categoriesRes.data || [],
    rawBrands: brandsRes.data || [],
    rawUoms: uomsRes.data || [],
    rawReasonCodes: reasonCodesRes.data || [],
    products: (productsRes.data || []).map(mapProductDtoToRecord),
    categories: (categoriesRes.data || []).map(mapCategoryDtoToRecord),
    brands: (brandsRes.data || []).map(mapBrandDtoToRecord),
    uoms: (uomsRes.data || []).map(mapUomDtoToRecord),
    reasonCodes: (reasonCodesRes.data || []).map(mapReasonCodeDtoToRecord),
  };
}

export async function fetchStockTabData() {
  const [balancesRes, ledgerRes] = await Promise.all([
    apiGet<StockBalance[]>("/api/stock/balances?limit=100").catch(() => ({ data: [] })),
    apiGet<StockLedgerLine[]>("/api/stock/ledger?limit=100").catch(() => ({ data: [] })),
  ]);

  return {
    balances: (balancesRes.data || []).map(mapStockBalanceDtoToRecord),
    ledger: (ledgerRes.data || []).map(mapStockLedgerDtoToRecord),
  };
}

export async function fetchSafetyStockTabData() {
  const [safetyRulesRes, facilitiesRes, productsRes] = await Promise.all([
    apiGet<SafetyStockRuleDto[]>("/api/safety-stock-rules").catch(() => ({ data: [] })),
    apiGet<Facility[]>("/api/facilities?limit=50").catch(() => ({ data: [] })),
    apiGet<Product[]>("/api/products?limit=100").catch(() => ({ data: [] })),
  ]);

  const facilityMap = new Map<string, string>();
  (facilitiesRes.data || []).forEach((f) => facilityMap.set(f.id, f.name));

  const productMap = new Map<string, string>();
  (productsRes.data || []).forEach((p) => productMap.set(p.id, p.nameTh));

  return {
    rawSafetyRules: safetyRulesRes.data || [],
    safetyRules: (safetyRulesRes.data || []).map((r) =>
      mapSafetyRuleDtoToRecord(
        r,
        facilityMap.get(r.facilityId) || r.facilityCode,
        productMap.get(r.productId) || r.sku
      )
    ),
  };
}

// ============================================================================
// Legacy All-In-One Fetcher (kept for backward compatibility)
// ============================================================================
export async function fetchControlPanelInitialData() {
  const [
    usersRes,
    rolesRes,
    permissionsRes,
    facilitiesRes,
    departmentsRes,
    categoriesRes,
    brandsRes,
    uomsRes,
    reasonCodesRes,
    productsRes,
    safetyRulesRes,
    balancesRes,
    ledgerRes,
  ] = await Promise.all([
    apiGet<AdminUserSummary[]>("/api/admin/users?limit=100").catch(() => ({ data: [] })),
    apiGet<RoleDto[]>("/api/admin/roles").catch(() => ({ data: [] })),
    apiGet<PermissionDto[]>("/api/admin/permissions").catch(() => ({ data: [] })),
    apiGet<Facility[]>("/api/facilities?limit=50").catch(() => ({ data: [] })),
    apiGet<DepartmentDto[]>("/api/departments").catch(() => ({ data: [] })),
    apiGet<ProductCategoryDto[]>("/api/product-categories").catch(() => ({ data: [] })),
    apiGet<BrandDto[]>("/api/brands").catch(() => ({ data: [] })),
    apiGet<UnitOfMeasureDto[]>("/api/units-of-measure").catch(() => ({ data: [] })),
    apiGet<ReasonCodeDto[]>("/api/reason-codes").catch(() => ({ data: [] })),
    apiGet<Product[]>("/api/products?limit=100").catch(() => ({ data: [] })),
    apiGet<SafetyStockRuleDto[]>("/api/safety-stock-rules").catch(() => ({ data: [] })),
    apiGet<StockBalance[]>("/api/stock/balances?limit=100").catch(() => ({ data: [] })),
    apiGet<StockLedgerLine[]>("/api/stock/ledger?limit=100").catch(() => ({ data: [] })),
  ]);

  // Load locations for all facilities
  let allLocations: LocationDto[] = [];
  if (facilitiesRes.data && facilitiesRes.data.length > 0) {
    const locResults = await Promise.all(
      facilitiesRes.data.map((f) =>
        apiGet<LocationDto[]>(`/api/facilities/${encodeURIComponent(f.id)}/locations`).catch(
          () => ({ data: [] })
        )
      )
    );
    allLocations = locResults.flatMap((r) => r.data || []);
  }

  // Facility and Product lookup maps for display enrichment
  const facilityMap = new Map<string, string>();
  (facilitiesRes.data || []).forEach((f) => facilityMap.set(f.id, f.name));

  const productMap = new Map<string, string>();
  (productsRes.data || []).forEach((p) => productMap.set(p.id, p.nameTh));

  return {
    rawUsers: usersRes.data || [],
    rawFacilities: facilitiesRes.data || [],
    rawDepartments: departmentsRes.data || [],
    rawProducts: productsRes.data || [],
    rawCategories: categoriesRes.data || [],
    rawBrands: brandsRes.data || [],
    rawUoms: uomsRes.data || [],
    rawReasonCodes: reasonCodesRes.data || [],
    rawSafetyRules: safetyRulesRes.data || [],
    rawLocations: allLocations,

    users: (usersRes.data || []).map(mapUserSummaryToRecord),
    roles: (rolesRes.data || []).map(mapRoleDtoToCanonicalRole),
    permissions: permissionsRes.data || [],
    facilities: (facilitiesRes.data || []).map(mapFacilityDtoToRecord),
    locations: allLocations.map(mapLocationDtoToRecord),
    departments: (departmentsRes.data || []).map(mapDepartmentDtoToRecord),
    categories: (categoriesRes.data || []).map(mapCategoryDtoToRecord),
    brands: (brandsRes.data || []).map(mapBrandDtoToRecord),
    uoms: (uomsRes.data || []).map(mapUomDtoToRecord),
    reasonCodes: (reasonCodesRes.data || []).map(mapReasonCodeDtoToRecord),
    products: (productsRes.data || []).map(mapProductDtoToRecord),
    safetyRules: (safetyRulesRes.data || []).map((r) =>
      mapSafetyRuleDtoToRecord(
        r,
        facilityMap.get(r.facilityId) || r.facilityCode,
        productMap.get(r.productId) || r.sku
      )
    ),
    balances: (balancesRes.data || []).map(mapStockBalanceDtoToRecord),
    ledger: (ledgerRes.data || []).map(mapStockLedgerDtoToRecord),
  };
}
