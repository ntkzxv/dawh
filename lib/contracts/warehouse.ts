// Types shared by the warehouse API and its browser client. Authorization remains server-side.
export const warehouseRoles = ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF", "EMPLOYEE"] as const;
export type Role = typeof warehouseRoles[number];
export type CatalogKind = "branches" | "warehouses" | "suppliers" | "units" | "product-groups"
  | "product-categories" | "brands" | "product-models" | "products";

export type MemberProfile = {
  username?: string | null;
  prefix?: string | null;
  firstNameTh?: string | null;
  lastNameTh?: string | null;
  nicknameTh?: string | null;
  firstNameEn?: string | null;
  lastNameEn?: string | null;
  nicknameEn?: string | null;
  citizenId?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  bloodType?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  religion?: string | null;
  department?: string | null;
  employmentStatus?: string | null;
  endedOn?: string | null;
  educationLevel?: string | null;
  majorSubject?: string | null;
  universityNameTh?: string | null;
  universityNameEn?: string | null;
  contactEmail?: string | null;
  emergencyContactNameEn?: string | null;
  emergencyContactRelationship?: string | null;
  registeredAddress?: string | null;
  employeeCode: string | null;
  phone: string | null;
  address: string | null;
  startedOn: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
};
