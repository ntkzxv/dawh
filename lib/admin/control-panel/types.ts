import type { AdminUserSummary } from "@/lib/admin/users/types";
import type { PermissionDto, RoleDto } from "@/lib/admin/roles/types";
import type { DepartmentDto } from "@/lib/departments/types";
import type { Facility } from "@/lib/facilities/types";
import type { LocationDto } from "@/lib/locations/types";
import type { BrandDto } from "@/lib/brands/types";
import type { ProductCategoryDto } from "@/lib/product-categories/types";
import type { Product } from "@/lib/products/types";
import type { ReasonCodeDto } from "@/lib/reason-codes/types";
import type { SafetyStockRuleDto } from "@/lib/safety-stock/types";
import type { StockBalance, StockLedgerLine } from "@/lib/stock/types";
import type { UnitOfMeasureDto } from "@/lib/units-of-measure/types";
import type { AuditLogRecord } from "@/lib/audit/types";
import type { UserFilters } from "@/lib/admin/users/types";
import type { PageRequest } from "@/lib/core/http/pagination";
import type { PageMeta } from "@/lib/core/http/response";

export const controlPanelTabs = [
  "users",
  "roles",
  "scopes",
  "organization",
  "products",
  "stock",
  "safety_stock",
  "audit_logs",
] as const;

export type ControlPanelTab = (typeof controlPanelTabs)[number];

export type ControlPanelTabQuery = {
  page: PageRequest;
  userFilters?: UserFilters;
  balancePage?: PageRequest;
  ledgerPage?: PageRequest;
};

export type ControlPanelTabData =
  | {
      tab: "users";
      users: AdminUserSummary[];
      roles: RoleDto[];
      facilities: Facility[];
      departments: DepartmentDto[];
      page: PageMeta;
    }
  | {
      tab: "roles";
      users: AdminUserSummary[];
      roles: RoleDto[];
      permissions: PermissionDto[];
      page: PageMeta;
    }
  | {
      tab: "scopes";
      users: AdminUserSummary[];
      facilities: Facility[];
      page: PageMeta;
    }
  | {
      tab: "organization";
      facilities: Facility[];
      departments: DepartmentDto[];
      locations: LocationDto[];
    }
  | {
      tab: "products";
      products: Product[];
      categories: ProductCategoryDto[];
      brands: BrandDto[];
      uoms: UnitOfMeasureDto[];
      reasonCodes: ReasonCodeDto[];
      page: PageMeta;
    }
  | {
      tab: "stock";
      balances: StockBalance[];
      ledger: StockLedgerLine[];
      balancePage: PageMeta;
      ledgerPage: PageMeta;
    }
  | {
      tab: "safety_stock";
      safetyRules: SafetyStockRuleDto[];
      facilities: Facility[];
      products: Product[];
      page: PageMeta;
    }
  | {
      tab: "audit_logs";
      logs: AuditLogRecord[];
      page: PageMeta;
    };
