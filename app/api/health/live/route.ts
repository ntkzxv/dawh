import { jsonOk } from "@/lib/core/http/response";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return jsonOk(request, { status: "ok" });
}
