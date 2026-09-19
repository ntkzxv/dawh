import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { ApiError } from "@/lib/core/http/errors";

export class AuthenticationRequiredError extends ApiError {
  constructor() {
    super(401, "UNAUTHORIZED", "Authentication is required.");
    this.name = "AuthenticationRequiredError";
  }
}

export async function getSession(request?: Request) {
  return auth.api.getSession({ headers: request?.headers ?? (await headers()) });
}

export async function requireSession(request?: Request) {
  const session = await getSession(request);
  if (!session) throw new AuthenticationRequiredError();
  return session;
}
