export type OnboardingOptions = {
  termsVersion: string;
  facilities: Array<{
    id: string;
    code: string;
    name: string;
    facilityType: "CENTRAL_WAREHOUSE" | "BRANCH";
  }>;
  departments: Array<{ id: string; code: string; name: string }>;
  prefixes: string[];
  genders: string[];
  bloodTypes: string[];
  maritalStatuses: string[];
  religions: string[];
  educationLevels: string[];
  nationalities: string[];
  emergencyRelationships: string[];
};
