import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

const LOGOUT_CHANNEL_NAME = "dawh-auth";
const LOGOUT_STORAGE_KEY = "dawh_auth_logout";

const USER_LOCAL_STORAGE_KEYS = [
  "dawh_user_profile",
  "dawh_session_user",
  "current_user_id",
  "current_user_email",
  "current_user_role",
  "current_user_birth_date",
  "current_user_phone",
  "dawh_needs_password_reset",
  "dawh_needs_pin_reset",
] as const;

const USER_SESSION_STORAGE_KEYS = [
  "dawh_pending_profile",
  "dawh_pending_notice",
] as const;

function clearUserClientState() {
  if (typeof window === "undefined") return;

  for (const key of USER_LOCAL_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }

  for (const key of USER_SESSION_STORAGE_KEYS) {
    sessionStorage.removeItem(key);
  }
}

function replaceWithLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/auth/login") return;

  window.location.replace("/auth/login");
}

function publishLogout() {
  if (typeof window === "undefined") return;

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(LOGOUT_CHANNEL_NAME);
    channel.postMessage({ type: "logout" });
    channel.close();
  }

  // Fallback for browsers without BroadcastChannel. The value contains no user data.
  localStorage.setItem(LOGOUT_STORAGE_KEY, String(Date.now()));
}

function handleRemoteLogout() {
  clearUserClientState();
  replaceWithLogin();
}

if (typeof window !== "undefined") {
  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(LOGOUT_CHANNEL_NAME);
    channel.addEventListener("message", (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === "logout") handleRemoteLogout();
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === LOGOUT_STORAGE_KEY && event.newValue) handleRemoteLogout();
  });
}

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

export async function logout() {
  try {
    const { error } = await authClient.signOut();
    if (error) throw new Error(error.message);

    clearUserClientState();
    publishLogout();
    replaceWithLogin();
  } catch (err) {
    console.error("SignOut error:", err);
    throw err;
  }
}
