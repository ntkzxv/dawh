import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

const LOGOUT_CHANNEL_NAME = "dawh-auth";
const LOGOUT_STORAGE_KEY = "dawh_auth_logout";
let logoutChannel: BroadcastChannel | null = null;

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

  try {
    for (const key of USER_LOCAL_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // Continue sign-out even if browser storage is unavailable.
  }

  try {
    for (const key of USER_SESSION_STORAGE_KEYS) {
      sessionStorage.removeItem(key);
    }
  } catch {
    // Continue sign-out even if browser storage is unavailable.
  }
}

function replaceWithLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/auth/login") return;

  window.location.replace("/auth/login");
}

function publishLogout() {
  if (typeof window === "undefined") return;

  // Reuse the receiving channel so this tab does not receive its own message.
  logoutChannel?.postMessage({ type: "logout" });

  // Fallback for browsers without BroadcastChannel. The value contains no user data.
  try {
    localStorage.setItem(LOGOUT_STORAGE_KEY, String(Date.now()));
  } catch {
    // BroadcastChannel still notifies other tabs when storage is unavailable.
  }
}

function handleRemoteLogout() {
  clearUserClientState();
  window.dispatchEvent(new Event("dawh:auth-logout"));
  replaceWithLogin();
}

if (typeof window !== "undefined") {
  if ("BroadcastChannel" in window) {
    logoutChannel = new BroadcastChannel(LOGOUT_CHANNEL_NAME);
    logoutChannel.addEventListener(
      "message",
      (event: MessageEvent<{ type?: string }>) => {
        if (event.data?.type === "logout") handleRemoteLogout();
      },
    );
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
  if (typeof window === "undefined") return;

  clearUserClientState();

  // Revoke the database session in the background so an unavailable database
  // does not keep the current tab showing the signed-in account.
  void authClient
    .signOut({ fetchOptions: { keepalive: true } })
    .then(({ error }) => {
      if (error) console.warn("Better Auth sign-out warning:", error.message);
    })
    .catch((error) => console.warn("Better Auth sign-out request failed:", error));

  // Clear the HTTP-only session cookies before navigating. This route is
  // database-free; waiting for its response prevents the login page from
  // seeing the old session cookie and redirecting to workspace.
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      keepalive: true,
    });
    if (!response.ok)
      console.warn("Immediate logout cookie cleanup failed:", response.status);
  } catch (error) {
    console.warn("Immediate logout cookie cleanup failed:", error);
  }

  publishLogout();
  replaceWithLogin();
}
