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

export type ControlPanelTabData =
  | {
      tab: "users";
      users: AdminUserSummary[];
      roles: RoleDto[];
      facilities: Facility[];
      departments: DepartmentDto[];
    }
  | {
      tab: "roles";
      users: AdminUserSummary[];
      roles: RoleDto[];
      permissions: PermissionDto[];
    }
  | {
      tab: "scopes";
      users: AdminUserSummary[];
      facilities: Facility[];
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
    }
  | {
      tab: "stock";
      balances: StockBalance[];
      ledger: StockLedgerLine[];
    }
  | {
      tab: "safety_stock";
      safetyRules: SafetyStockRuleDto[];
      facilities: Facility[];
      products: Product[];
    }
  | {
      tab: "audit_logs";
      logs: AuditLogRecord[];
      page: { limit: number; nextCursor: string | null; hasMore: boolean };
    };
