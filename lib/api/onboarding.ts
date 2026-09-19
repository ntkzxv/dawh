"use client";

import { apiGet } from "@/lib/api/client";
import type { OnboardingOptions } from "@/lib/onboarding/types";

export async function getOnboardingOptions() {
  return apiGet<OnboardingOptions>("/api/onboarding/options");
}

