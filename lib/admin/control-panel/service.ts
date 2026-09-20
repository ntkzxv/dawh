import "server-only";

import {
  AuthorizationError,
  ProfileIncompleteError,
} from "@/lib/access/service";
import type { AccessContext } from "@/lib/access/types";
import { listAdminUsersForContext } from "@/lib/admin/users/service";
import { listPermissions, listRoles } from "@/lib/admin/roles/service";
import type {
  ControlPanelTab,
  ControlPanelTabData,
} from "@/lib/admin/control-panel/types";
import { listAuditLogs } from "@/lib/audit/service";
import { listBrands } from "@/lib/brands/service";
import { listDepartments } from "@/lib/departments/service";
import { listVisibleFacilities } from "@/lib/facilities/service";
import { listVisibleLocations } from "@/lib/locations/service";
import { listProductCategories } from "@/lib/product-categories/service";
import { listProducts } from "@/lib/products/service";
import { listReasonCodes } from "@/lib/reason-codes/service";
import { listSafetyStock } from "@/lib/safety-stock/service";
import { listScopedStockBalances, listStockLedger } from "@/lib/stock/service";
import { listUnits } from "@/lib/units-of-measure/service";

const firstPage = { limit: 100, cursor: null };
const facilityFilters = { search: null, facilityType: null, active: null };
const userFilters = {
  search: null,
  status: null,
  roleCode: null,
  facilityId: null,
  profileComplete: null,
};

function requireControlPanelAccess(context: AccessContext): void {
  if (!context.profile?.is_complete) throw new ProfileIncompleteError();
  if (!context.isSystemAdministrator) throw new AuthorizationError();
}

/**
 * Read model for the System Administrator Control Panel.
 *
 * One request builds exactly one tab. The existing domain endpoints remain
 * public internally; this aggregation layer removes client-side fan-out and
 * avoids Organization's former N+1 locations query.
 */
export async function getControlPanelTab(
  context: AccessContext,
  tab: ControlPanelTab,
): Promise<ControlPanelTabData> {
  requireControlPanelAccess(context);

  switch (tab) {
    case "users": {
      const [users, roles, facilities, departments] = await Promise.all([
        listAdminUsersForContext(context, firstPage, userFilters),
        listRoles(context),
        listVisibleFacilities(context, firstPage, facilityFilters),
        listDepartments(context),
      ]);
      return {
        tab,
        users: users.slice(0, firstPage.limit),
        roles,
        facilities: facilities.slice(0, firstPage.limit),
        departments,
      };
    }
    case "roles": {
      const [users, roles, permissions] = await Promise.all([
        listAdminUsersForContext(context, firstPage, userFilters),
        listRoles(context),
        listPermissions(context),
      ]);
      return {
        tab,
        users: users.slice(0, firstPage.limit),
        roles,
        permissions,
      };
    }
    case "scopes": {
      const [users, facilities] = await Promise.all([
        listAdminUsersForContext(context, firstPage, userFilters),
        listVisibleFacilities(context, firstPage, facilityFilters),
      ]);
      return {
        tab,
        users: users.slice(0, firstPage.limit),
        facilities: facilities.slice(0, firstPage.limit),
      };
    }
    case "organization": {
      const [facilities, departments, locations] = await Promise.all([
        listVisibleFacilities(context, firstPage, facilityFilters),
        listDepartments(context),
        listVisibleLocations(context),
      ]);
      return {
        tab,
        facilities: facilities.slice(0, firstPage.limit),
        departments,
        locations,
      };
    }
    case "products": {
      const [products, categories, brands, uoms, reasonCodes] =
        await Promise.all([
          listProducts(context, {
            search: null,
            categoryId: null,
            brandId: null,
            trackingMethod: null,
            active: null,
            page: firstPage,
          }),
          listProductCategories(context),
          listBrands(context),
          listUnits(context),
          listReasonCodes(context),
        ]);
      return {
        tab,
        products: products.slice(0, firstPage.limit),
        categories,
        brands,
        uoms,
        reasonCodes,
      };
    }
    case "stock": {
      const [balances, ledger] = await Promise.all([
        listScopedStockBalances(context, {
          facilityId: null,
          locationId: null,
          productId: null,
          stockStatus: null,
          lotId: null,
          serialId: null,
          search: null,
          page: firstPage,
        }),
        listStockLedger(context, {
          facilityId: null,
          productId: null,
          locationId: null,
          transactionType: null,
          referenceType: null,
          referenceId: null,
          postedFrom: null,
          postedTo: null,
          page: firstPage,
        }),
      ]);
      return {
        tab,
        balances: balances.slice(0, firstPage.limit),
        ledger: ledger.slice(0, firstPage.limit),
      };
    }
    case "safety_stock": {
      const [safetyRules, facilities, products] = await Promise.all([
        listSafetyStock(context),
        listVisibleFacilities(context, firstPage, facilityFilters),
        listProducts(context, {
          search: null,
          categoryId: null,
          brandId: null,
          trackingMethod: null,
          active: null,
          page: firstPage,
        }),
      ]);
      return {
        tab,
        safetyRules,
        facilities: facilities.slice(0, firstPage.limit),
        products: products.slice(0, firstPage.limit),
      };
    }
    case "audit_logs": {
      const logs = await listAuditLogs(context, {
        category: "all",
        limit: 200,
        cursor: null,
      });
      return {
        tab,
        logs: logs.data,
        page: {
          limit: logs.limit,
          nextCursor: logs.nextCursor,
          hasMore: logs.hasMore,
        },
      };
    }
  }
}
