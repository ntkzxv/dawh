import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getOnboardingOptions } from "@/lib/onboarding/service";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  return jsonOk(request, await getOnboardingOptions(request));
});
