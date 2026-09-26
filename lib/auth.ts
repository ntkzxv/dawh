import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";

import { sendVerificationEmail } from "@/lib/auth/email";
import { dbPool } from "@/lib/core/db/pool";

const oneDay = 60 * 60 * 24;
const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const authEmailEnabled = process.env.AUTH_EMAIL_ENABLED === "true";
const trustedOrigins = [
  baseURL,
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

const createAuth = () =>
  betterAuth({
    appName: "DAWH",
    baseURL,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins,
    database: dbPool,
    advanced: {
      cookiePrefix: "dawh",
      defaultCookieAttributes: {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: authEmailEnabled,
    },
    emailVerification: {
      sendOnSignUp: authEmailEnabled,
      sendOnSignIn: false,
      autoSignInAfterVerification: true,
      ...(authEmailEnabled
        ? {
            sendVerificationEmail: ({ user, url }: { user: { email: string }; url: string }) =>
              sendVerificationEmail({ email: user.email, url }),
          }
        : {}),
    },
    user: {
      changeEmail: {
        enabled: authEmailEnabled,
      },
    },
    session: {
      expiresIn: oneDay * 7,
      updateAge: oneDay,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
    },
    plugins: [admin()],
  });

type BetterAuthInstance = ReturnType<typeof createAuth>;

const globalForBetterAuth = globalThis as typeof globalThis & {
  dawhBetterAuth?: BetterAuthInstance;
};

export const auth =
  globalForBetterAuth.dawhBetterAuth ??
  createAuth();

if (process.env.NODE_ENV !== "production") {
  globalForBetterAuth.dawhBetterAuth = auth;
}
