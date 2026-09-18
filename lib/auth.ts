import { betterAuth } from "better-auth";

import { authPool } from "@/lib/auth/db";
import { sendVerificationEmail } from "@/lib/auth/email";

const oneDay = 60 * 60 * 24;
const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const trustedOrigins = [
  baseURL,
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

export const auth = betterAuth({
  appName: "DAWH",
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: authPool,
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
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: ({ user, url }) =>
      sendVerificationEmail({ email: user.email, url }),
  },
  user: {
    changeEmail: {
      enabled: true,
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
});
