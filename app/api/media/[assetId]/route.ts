import { apiRoute } from "@/lib/core/http/handler";
import { getActor, id } from "@/lib/warehouse/core";
import { getEvidenceUrl } from "@/lib/warehouse/media";
export const runtime = "nodejs";
export const GET = apiRoute<{ params: Promise<{ assetId: string }> }>(async (request, context) => Response.redirect(await getEvidenceUrl(await getActor(request), id((await context.params).assetId)), 302));
