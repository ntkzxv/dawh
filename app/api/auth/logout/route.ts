import { NextResponse } from "next/server";

const sessionCookies = ["session_token", "session_data", "dont_remember"];
const cookiePrefixes = ["dawh.", "__Secure-dawh."];

export async function POST() {
  const response = NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );

  for (const prefix of cookiePrefixes) {
    for (const cookie of sessionCookies) {
      const name = `${prefix}${cookie}`;
      response.cookies.set(name, "", {
        path: "/",
        expires: new Date(0),
        maxAge: 0,
        httpOnly: true,
        sameSite: "lax",
        secure: prefix.startsWith("__Secure-"),
      });
    }
  }

  return response;
}
