import { getAccessContext } from "@/lib/access/service";
import {
  controlPanelTabs,
  type ControlPanelTab,
} from "@/lib/admin/control-panel/types";
import { getControlPanelTab } from "@/lib/admin/control-panel/service";
import { ValidationError } from "@/lib/core/http/errors";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";

export const runtime = "nodejs";

export const GET = apiRoute<{ params: Promise<{ tab: string }> }>(
  async (request, routeContext) => {
    const { tab } = await routeContext.params;
    if (!controlPanelTabs.includes(tab as ControlPanelTab)) {
      throw new ValidationError({ tab: "Use a supported Control Panel tab." });
    }

    const context = await getAccessContext(request);
    return jsonOk(
      request,
      await getControlPanelTab(context, tab as ControlPanelTab),
    );
  },
);
