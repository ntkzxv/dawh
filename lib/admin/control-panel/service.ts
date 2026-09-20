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
  ControlPanelTabQuery,
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
import { nextCursor } from "@/lib/core/http/pagination";
import type { PageMeta } from "@/lib/core/http/response";

const lookupPage = { limit: 200, cursor: null };
const defaultPage = { limit: 50, cursor: null };
const facilityFilters = { search: null, facilityType: null, active: null };
const userFilters = {
  search: null,
  status: null,
  roleCode: null,
  roleAssigned: null,
  facilityId: null,
  departmentId: null,
  profileComplete: null,
};

function pageResult<T extends { id: string }>(
  rows: T[],
  limit: number,
  timestamp: (row: T) => string,
): { data: T[]; page: PageMeta } {
  const hasMore = rows.length > limit;
  return {
    data: hasMore ? rows.slice(0, limit) : rows,
    page: {
      limit,
      hasMore,
      nextCursor: hasMore ? nextCursor(rows, limit, timestamp) : null,
    },
  };
}

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
  query: ControlPanelTabQuery = { page: defaultPage },
): Promise<ControlPanelTabData> {
  requireControlPanelAccess(context);
  const page = query.page;

  switch (tab) {
    case "users": {
      const [users, roles, facilities, departments] = await Promise.all([
        listAdminUsersForContext(context, page, query.userFilters ?? userFilters),
        listRoles(context),
        listVisibleFacilities(context, lookupPage, facilityFilters),
        listDepartments(context),
      ]);
      const userPage = pageResult(users, page.limit, (user) => user.createdAt);
      return {
        tab,
        users: userPage.data,
        roles,
        facilities: facilities.slice(0, lookupPage.limit),
        departments,
        page: userPage.page,
      };
    }
    case "roles": {
      const [users, roles, permissions] = await Promise.all([
        listAdminUsersForContext(context, page, query.userFilters ?? userFilters),
        listRoles(context),
        listPermissions(context),
      ]);
      const userPage = pageResult(users, page.limit, (user) => user.createdAt);
      return {
        tab,
        users: userPage.data,
        roles,
        permissions,
        page: userPage.page,
      };
    }
    case "scopes": {
      const [users, facilities] = await Promise.all([
        listAdminUsersForContext(context, page, query.userFilters ?? userFilters),
        listVisibleFacilities(context, lookupPage, facilityFilters),
      ]);
      const userPage = pageResult(users, page.limit, (user) => user.createdAt);
      return {
        tab,
        users: userPage.data,
        facilities: facilities.slice(0, lookupPage.limit),
        page: userPage.page,
      };
    }
    case "organization": {
      const [facilities, departments, locations] = await Promise.all([
        listVisibleFacilities(context, lookupPage, facilityFilters),
        listDepartments(context),
        listVisibleLocations(context),
      ]);
      return {
        tab,
        facilities: facilities.slice(0, lookupPage.limit),
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
            page,
          }),
          listProductCategories(context),
          listBrands(context),
          listUnits(context),
          listReasonCodes(context),
        ]);
      const productPage = pageResult(products, page.limit, (product) => product.createdAt);
      return {
        tab,
        products: productPage.data,
        categories,
        brands,
        uoms,
        reasonCodes,
        page: productPage.page,
      };
    }
    case "stock": {
      const balancePage = query.balancePage ?? page;
      const ledgerPage = query.ledgerPage ?? page;
      const [balances, ledger] = await Promise.all([
        listScopedStockBalances(context, {
          facilityId: null,
          locationId: null,
          productId: null,
          stockStatus: null,
          lotId: null,
          serialId: null,
          search: null,
          page: balancePage,
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
          page: ledgerPage,
        }),
      ]);
      const balanceResult = pageResult(balances, balancePage.limit, (balance) => balance.updatedAt);
      const ledgerResult = pageResult(ledger, ledgerPage.limit, (line) => line.postedAt);
      return {
        tab,
        balances: balanceResult.data,
        ledger: ledgerResult.data,
        balancePage: balanceResult.page,
        ledgerPage: ledgerResult.page,
      };
    }
    case "safety_stock": {
      const [safetyRules, facilities, products] = await Promise.all([
        listSafetyStock(context, page),
        listVisibleFacilities(context, lookupPage, facilityFilters),
        listProducts(context, {
          search: null,
          categoryId: null,
          brandId: null,
          trackingMethod: null,
          active: null,
          page: lookupPage,
        }),
      ]);
      const safetyPage = pageResult(safetyRules, page.limit, (rule) => rule.createdAt);
      return {
        tab,
        safetyRules: safetyPage.data,
        facilities: facilities.slice(0, lookupPage.limit),
        products: products.slice(0, lookupPage.limit),
        page: safetyPage.page,
      };
    }
    case "audit_logs": {
      const logs = await listAuditLogs(context, {
        category: "all",
        limit: page.limit,
        cursor: page.cursor,
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
