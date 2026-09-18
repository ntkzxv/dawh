import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export async function getCurrentSession() {
  const { data, error } = await authClient.getSession();
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const { error } = await authClient.signOut();
  if (error) throw new Error(error.message);
}
