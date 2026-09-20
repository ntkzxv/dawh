import { getAccessContext } from "@/lib/access/service";
import {
  controlPanelTabs,
  type ControlPanelTab,
  type ControlPanelTabQuery,
} from "@/lib/admin/control-panel/types";
import { parseUserQuery } from "@/lib/admin/users/validation";
import { getControlPanelTab } from "@/lib/admin/control-panel/service";
import { ValidationError } from "@/lib/core/http/errors";
import { apiRoute } from "@/lib/core/http/handler";
import { parsePageRequest } from "@/lib/core/http/pagination";
import { jsonOk } from "@/lib/core/http/response";

export const runtime = "nodejs";

export const GET = apiRoute<{ params: Promise<{ tab: string }> }>(
  async (request, routeContext) => {
    const { tab } = await routeContext.params;
    if (!controlPanelTabs.includes(tab as ControlPanelTab)) {
      throw new ValidationError({ tab: "Use a supported Control Panel tab." });
    }

    const controlPanelTab = tab as ControlPanelTab;
    const url = new URL(request.url);
    let query: ControlPanelTabQuery;
    if (
      controlPanelTab === "users" ||
      controlPanelTab === "roles" ||
      controlPanelTab === "scopes"
    ) {
      const { page, filters } = parseUserQuery(url);
      query = { page, userFilters: filters };
    } else {
      query = { page: parsePageRequest(url) };
    }

    if (controlPanelTab === "stock") {
      query.balancePage = parsePageRequest(url, {
        cursorParam: "balanceCursor",
      });
      query.ledgerPage = parsePageRequest(url, {
        cursorParam: "ledgerCursor",
      });
    }

    const context = await getAccessContext(request);
    return jsonOk(
      request,
      await getControlPanelTab(context, controlPanelTab, query),
    );
  },
);
