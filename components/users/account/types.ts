import type React from "react";
import type { EmployeeProfile, Branch } from "@/types/user";
import type { AppMe } from "@/lib/api/session";

export const PRESET_RELIGIONS = ["พุทธ", "อิสลาม", "คริสต์", "ฮินดู", "ซิกข์", "ไม่นับถือศาสนา"];

export interface FormCustomSelectOption {
  value: string;
  label: string;
  sublabel?: string | null;
  badge?: string;
}

export interface FormCustomSelectProps {
  id: string;
  value: string;
  placeholder?: string;
  options: FormCustomSelectOption[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (val: string) => void;
  isLight: boolean;
  isInvalid?: boolean;
  icon?: React.ReactNode;
}

export interface AddressParts {
  houseNo: string;
  moo?: string;
  soi?: string;
  province_en: string;
  district_en: string;
  subdistrict_en: string;
  zipcode: string;
}

export type AccountTabType = "profile" | "employment" | "security" | "admin";

export interface AccountViewProps {
  onNavigate?: (target: string) => void;
  onBack?: () => void;
  initialTab?: AccountTabType;
}

export type SettingsViewProps = AccountViewProps;

export interface SecondaryRegFormData {
  username: string;
  prefix: string;
  first_name_th: string;
  last_name_th: string;
  nickname_th: string;
  first_name: string;
  last_name: string;
  nickname: string;
  id_card: string;
  birth_date: string;
  gender: string;
  blood_type: string;
  marital_status: string;
  nationality: string;
  religion: string;
  phone: string;
  emergency_contact_name_th: string;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  current_address: string;
  registered_address: string;
  department: string;
  branch_id: string;
  branch_name: string;
  education_level: string;
  major_subject: string;
  university_th: string;
  university_en: string;
  university_name: string;
  bio: string;
}
