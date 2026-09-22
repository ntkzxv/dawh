"use client";

import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPut, apiPatch, ApiRequestError } from "@/lib/api/client";
import type {
  EmployeeProfileDto,
  CompleteEmployeeProfileInput,
  UpdateEmployeeProfileInput,
} from "@/types";

export interface UseProfileReturn {
  profile: EmployeeProfileDto | null;
  isComplete: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchProfile: () => Promise<EmployeeProfileDto | null>;
  completeProfile: (
    input: CompleteEmployeeProfileInput,
  ) => Promise<{ success: boolean; data?: EmployeeProfileDto; error?: string }>;
  updateProfile: (
    input: UpdateEmployeeProfileInput,
  ) => Promise<{ success: boolean; data?: EmployeeProfileDto; error?: string }>;
  refresh: () => Promise<void>;
}

export function useProfile(autoFetch: boolean = true): UseProfileReturn {
  const [profile, setProfile] = useState<EmployeeProfileDto | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(autoFetch);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (): Promise<EmployeeProfileDto | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiGet<{
        profile: EmployeeProfileDto | null;
        profileComplete: boolean;
      }>("/api/profile/me");

      const fetchedProfile = response.data.profile;
      setProfile(fetchedProfile);
      setIsComplete(response.data.profileComplete ?? fetchedProfile?.isComplete ?? false);
      return fetchedProfile;
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 401) {
          setProfile(null);
          setIsComplete(false);
          return null;
        }
        setError(err.message);
      } else {
        setError("Failed to load employee profile");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchProfile();
    }
  }, [autoFetch, fetchProfile]);

  const completeProfile = useCallback(
    async (input: CompleteEmployeeProfileInput) => {
      try {
        setIsSaving(true);
        setError(null);

        const response = await apiPut<EmployeeProfileDto>(
          "/api/profile/me/complete",
          input,
        );

        const updated = response.data;
        setProfile(updated);
        setIsComplete(true);
        return { success: true, data: updated };
      } catch (err) {
        const msg =
          err instanceof ApiRequestError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to complete profile";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const updateProfile = useCallback(
    async (input: UpdateEmployeeProfileInput) => {
      try {
        setIsSaving(true);
        setError(null);

        const response = await apiPatch<EmployeeProfileDto>(
          "/api/profile/me",
          input,
        );

        const updated = response.data;
        setProfile(updated);
        return { success: true, data: updated };
      } catch (err) {
        const msg =
          err instanceof ApiRequestError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to update profile";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  return {
    profile,
    isComplete,
    isLoading,
    isSaving,
    error,
    fetchProfile,
    completeProfile,
    updateProfile,
    refresh: async () => {
      await fetchProfile();
    },
  };
}
