/**
 * Canonical Employee Profile & Onboarding Contracts
 * Conforms strictly to docs/api/p0-frontend-handoff.md
 */

export interface AddressInput {
  houseNo: string;
  village: string | null;
  soi: string | null;
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
}

export interface FacilitySummary {
  id: string;
  code: string;
  name: string;
}

export interface DepartmentSummary {
  id: string;
  code: string;
  name: string;
}

export interface EmployeeProfileDto {
  userId: string;
  email: string;
  username: string;
  prefix: string;
  firstNameTh: string;
  lastNameTh: string;
  nicknameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  nicknameEn: string;
  citizenId: string;
  birthDate: string;
  gender: string;
  bloodType: string;
  maritalStatus: string;
  nationality: string;
  religion: string;
  educationLevel: string;
  majorSubject: string;
  universityNameTh: string;
  universityNameEn: string;
  phone: string;
  emergencyContactNameTh: string;
  emergencyContactNameEn: string | null;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  currentAddress: AddressInput;
  registeredAddress: AddressInput;
  facilityId: string | null;
  departmentId: string | null;
  facility: FacilitySummary | null;
  department: DepartmentSummary | null;
  termsVersion: string;
  termsAcceptedAt: string;
  profileCompletedAt: string;
  createdAt: string;
  updatedAt: string;
  isComplete: boolean;
}

export interface CompleteEmployeeProfileInput {
  username: string;
  prefix: string;
  firstNameTh: string;
  lastNameTh: string;
  nicknameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  nicknameEn: string;
  citizenId: string;
  birthDate: string;
  gender: string;
  bloodType: string;
  maritalStatus: string;
  nationality: string;
  religion: string;
  educationLevel: string;
  majorSubject: string;
  universityNameTh: string;
  universityNameEn: string;
  phone: string;
  emergencyContactNameTh: string;
  emergencyContactNameEn: string | null;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  currentAddress: AddressInput;
  registeredAddress: AddressInput;
  facilityId: string;
  departmentId: string | null;
  termsAccepted: true;
}

export interface UpdateEmployeeProfileInput {
  prefix?: string;
  nicknameTh?: string;
  nicknameEn?: string;
  nationality?: string;
  religion?: string;
  educationLevel?: string;
  majorSubject?: string;
  universityNameTh?: string;
  universityNameEn?: string;
  phone?: string;
  emergencyContactNameTh?: string;
  emergencyContactNameEn?: string | null;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  currentAddress?: AddressInput;
  registeredAddress?: AddressInput;
}

export type PartialUpdateEmployeeProfileInput = Partial<UpdateEmployeeProfileInput>;

export interface OnboardingOptionsDto {
  termsVersion: string;
  facilities: Array<{
    id: string;
    code: string;
    name: string;
    facilityType: string;
    isActive: boolean;
  }>;
  departments: Array<{
    id: string;
    code: string;
    name: string;
    isActive: boolean;
  }>;
  prefixes: string[];
  educationLevels: string[];
  maritalStatuses: string[];
  genders: string[];
  bloodTypes: string[];
  nationalities: string[];
  religions: string[];
}
