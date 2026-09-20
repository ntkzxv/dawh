import { requireAccess } from "@/lib/access/service";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { parseRouteBigIntId } from "@/lib/core/ids/bigint";
import { listNetworkStock } from "@/lib/stock/service";
export const runtime = "nodejs";
export const GET = apiRoute(async (request) => {
  const url = new URL(request.url),
    facilityId = url.searchParams.get("facilityId"),
    productId = url.searchParams.get("productId");
  const parsedFacilityId = facilityId
    ? parseRouteBigIntId(facilityId, "facilityId")
    : null;
  const parsedProductId = productId
    ? parseRouteBigIntId(productId, "productId")
    : null;
  const context = await requireAccess(request, {
    permission: "stock.read",
    facilityId: parsedFacilityId ?? undefined,
    facilityScope: "READ",
  });
  return jsonOk(
    request,
    await listNetworkStock(context, parsedFacilityId, parsedProductId),
  );
});
