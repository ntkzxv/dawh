import { AuthenticationRequiredError, requireSession } from "@/lib/auth/session";
import { completeEmployeeProfile } from "@/lib/profiles/service";
import { parseCompleteEmployeeProfile, ProfileValidationError } from "@/lib/profiles/validation";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    const input = parseCompleteEmployeeProfile(await request.json());
    const profile = await completeEmployeeProfile(session.user.id, input);
    return Response.json({ profile, isComplete: true });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof ProfileValidationError) {
      return Response.json({ error: "Complete every required field.", fields: error.fields }, { status: 422 });
    }
    const databaseError = error as { code?: string };
    if (databaseError.code === "23505") {
      return Response.json({ error: "Username or national ID is already in use." }, { status: 409 });
    }
    console.error("Unable to complete employee profile", error);
    return Response.json({ error: "Unable to save employee profile" }, { status: 500 });
  }
}
