"use client";

export type PendingRegistrationProfile = {
  username: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function readPendingRegistrationProfile(): PendingRegistrationProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem("dawh_pending_profile");
    if (!raw) return null;
    const value = JSON.parse(raw) as Record<string, unknown>;
    return {
      username: asString(value.username),
      firstName: asString(value.first_name),
      lastName: asString(value.last_name),
      birthDate: asString(value.birth_date),
      phone: asString(value.phone),
    };
  } catch {
    return null;
  }
}

export function storePendingRegistrationProfile(profile: PendingRegistrationProfile) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    "dawh_pending_profile",
    JSON.stringify({
      username: profile.username,
      first_name: profile.firstName,
      last_name: profile.lastName,
      birth_date: profile.birthDate,
      phone: profile.phone,
    }),
  );
}

