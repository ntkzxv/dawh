import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export async function getCurrentSession() {
  try {
    const { data, error } = await authClient.getSession();
    if (error) {
      console.warn("Better Auth getSession warning:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Better Auth getSession network error:", err);
    return null;
  }
}

export async function signOut() {
  try {
    const { error } = await authClient.signOut();
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error("SignOut error:", err);
    throw err;
  }
}
