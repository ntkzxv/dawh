import "server-only";

import { getAccessContext } from "@/lib/access/service";
import { dbPool } from "@/lib/core/db/pool";
import { ApiError } from "@/lib/core/http/errors";
import type { OnboardingOptions } from "@/lib/onboarding/types";

type FacilityRow = OnboardingOptions["facilities"][number];
type DepartmentRow = OnboardingOptions["departments"][number];

export function getCurrentTermsVersion(): string {
  const value = process.env.CURRENT_TERMS_VERSION?.trim();
  if (!value) {
    throw new ApiError(503, "TERMS_CONFIGURATION_ERROR", "The current terms version is not configured.");
  }
  return value;
}

export async function getOnboardingOptions(request: Request): Promise<OnboardingOptions> {
  const context = await getAccessContext(request);
  const [facilities, departments] = await Promise.all([
    dbPool.query<FacilityRow>(
      `SELECT id::text AS id, code, name, facility_type AS "facilityType"
       FROM public.facilities
       WHERE organization_id = $1 AND is_active = true
       ORDER BY facility_type, code`,
      [context.organization.id]
    ),
    dbPool.query<DepartmentRow>(
      `SELECT id::text AS id, code, name
       FROM public.departments
       WHERE organization_id = $1 AND is_active = true
       ORDER BY code`,
      [context.organization.id]
    ),
  ]);

  return {
    termsVersion: getCurrentTermsVersion(),
    facilities: facilities.rows,
    departments: departments.rows,
    prefixes: ["MR", "MRS", "MS", "OTHER"],
    genders: ["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"],
    bloodTypes: ["A", "B", "AB", "O", "UNKNOWN"],
    maritalStatuses: ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"],
    religions: ["BUDDHISM", "CHRISTIANITY", "ISLAM", "HINDUISM", "OTHER", "NONE"],
    educationLevels: ["SECONDARY", "VOCATIONAL", "DIPLOMA", "BACHELOR", "MASTER", "DOCTORATE", "OTHER"],
    nationalities: ["THAI", "OTHER"],
    emergencyRelationships: ["PARENT", "SPOUSE", "SIBLING", "RELATIVE", "FRIEND", "OTHER"],
  };
}
