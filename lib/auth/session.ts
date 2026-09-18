import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required.");
    this.name = "AuthenticationRequiredError";
  }
}

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new AuthenticationRequiredError();
  return session;
}
