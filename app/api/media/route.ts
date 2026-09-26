import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { uploadEvidence } from "@/lib/warehouse/media";
import { ValidationError } from "@/lib/core/http/errors";
export const runtime = "nodejs";
export const POST = apiRoute(async (request) => {
  const actor = await getActor(request);
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) throw new ValidationError({ file: "Choose a file." });
  return jsonOk(request, await uploadEvidence(actor, file), 201);
});
