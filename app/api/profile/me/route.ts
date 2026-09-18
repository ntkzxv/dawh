import { AuthenticationRequiredError, requireSession } from "@/lib/auth/session";
import { getEmployeeProfile } from "@/lib/profiles/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireSession();
    const profile = await getEmployeeProfile(session.user.id);
    return Response.json({ profile, isComplete: profile?.is_complete ?? false });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Unable to read employee profile", error);
    return Response.json({ error: "Unable to read employee profile" }, { status: 500 });
  }
}
