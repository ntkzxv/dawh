export type EmployeeProfileRecord = {
  user_id: string;
  username: string;
  prefix: string | null;
  first_name_th: string | null;
  last_name_th: string | null;
  nickname_th: string | null;
  first_name_en: string;
  last_name_en: string;
  nickname_en: string | null;
  citizen_id: string | null;
  birth_date: string | null;
  gender: string | null;

  blood_type: string | null;
  marital_status: string | null;
  nationality: string | null;
  religion: string | null;
  education_level: string | null;
  major_subject: string | null;
  university_name_th: string | null;
  university_name_en: string | null;
  phone: string;
  emergency_contact_name_th: string | null;
  emergency_contact_name_en: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  current_house_no: string | null;
  current_village: string | null;
  current_soi: string | null;
  current_province: string | null;
  current_district: string | null;
  current_subdistrict: string | null;
  current_postal_code: string | null;
  registered_house_no: string | null;
  registered_village: string | null;
  registered_soi: string | null;
  registered_province: string | null;
  registered_district: string | null;
  registered_subdistrict: string | null;
  registered_postal_code: string | null;
  department: string | null;
  branch_name: string | null;
  branch_code: string | null;
  facility_id: string | null;
  department_id: string | null;
  terms_version: string | null;
  terms_accepted_at: string | null;
  profile_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EmployeeProfileResponse = EmployeeProfileRecord & {
  email: string;
  is_complete: boolean;
};

export type AddressInput = {
  houseNo: string;
  village: string | null;
  soi: string | null;
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
};

export type EmployeeProfileDto = {
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
  facilityId: string;
  departmentId: string | null;
  facility: { id: string; code: string; name: string };
  department: { id: string; code: string; name: string } | null;
  termsVersion: string;
  termsAcceptedAt: string;
  profileCompletedAt: string;
  createdAt: string;
  updatedAt: string;
  isComplete: boolean;
};

export type CompleteEmployeeProfileInput = Omit<
  EmployeeProfileDto,
  | "userId"
  | "email"
  | "facility"
  | "department"
  | "termsVersion"
  | "termsAcceptedAt"
  | "profileCompletedAt"
  | "createdAt"
  | "updatedAt"
  | "isComplete"
> & { termsAccepted: true };

export type UpdateEmployeeProfileInput = Pick<
  CompleteEmployeeProfileInput,
  | "prefix"
  | "nicknameTh"
  | "nicknameEn"
  | "nationality"
  | "religion"
  | "educationLevel"
  | "majorSubject"
  | "universityNameTh"
  | "universityNameEn"
  | "phone"
  | "emergencyContactNameTh"
  | "emergencyContactNameEn"
  | "emergencyContactRelationship"
  | "emergencyContactPhone"
  | "currentAddress"
  | "registeredAddress"
>;
