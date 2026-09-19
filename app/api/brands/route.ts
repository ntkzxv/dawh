import { requireAccess } from "@/lib/access/service";
import { createBrand, listBrands } from "@/lib/brands/service";
import { parseCreateBrand } from "@/lib/brands/validation";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
export const runtime = "nodejs";
export const GET = apiRoute(async (r) => {
  const c = await requireAccess(r, { permission: "admin.products.read" });
  return jsonOk(r, await listBrands(c));
});
export const POST = apiRoute(async (r) => {
  const c = await requireAccess(r, { permission: "admin.products.manage" });
  return jsonOk(
    r,
    await createBrand(
      c,
      getRequestContext(r),
      parseCreateBrand(await parseJsonObject(r)),
    ),
    201,
  );
});
