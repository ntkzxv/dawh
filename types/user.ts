import { UserRole } from "@/config/roles";

export type { UserRole };

export type PrefixType = "mr" | "mrs" | "miss" | string;

export interface EmployeeProfile {
  id: string;
  staff_code?: string | null;
  username?: string | null;
  pin_code?: string | null;
  is_pin_enabled?: boolean;
  needs_password_reset?: boolean;
  needs_pin_reset?: boolean;
  prefix?: PrefixType | null;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  nickname?: string | null;
  // 🇹🇭 Thai-specific name fields
  first_name_th?: string | null;
  last_name_th?: string | null;
  nickname_th?: string | null;
  birth_date?: string | null;
  id_card?: string | null;
  blood_type?: string | null;
  nationality?: string | null;
  religion?: string | null;
  phone?: string | null;
  email: string;
  current_address?: string | null;
  registered_address?: string | null; // 🏡 ที่อยู่ตามทะเบียนบ้าน / ภูมิลำเนา
  emergency_contact_name?: string | null;
  emergency_contact_name_th?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_contact_phone?: string | null;
  role?: UserRole | string | null;
  department?: string | null;
  branch_id?: string | null;
  branch_name?: string | null;
  start_date?: string | null;
  salary?: number | null;
  employment_status?: string | null;
  education_level?: string | null;
  major_subject?: string | null;
  university_name?: string | null;
  university_th?: string | null;
  university_en?: string | null;
  gender?: string | null;
  marital_status?: string | null; // 💍 สถานะการแต่งงาน / สถานภาพสมรส (โสด, สมรส, หย่าร้าง, หม้าย)
  avatar_url?: string | null;
  bio?: string | null;
  is_active?: boolean;
  last_login_at?: string | null; // ⏱️ เวลาล็อกอินล่าสุดจริง
  created_at?: string;
  updated_at?: string;
  terms_version?: string | null;
  terms_accepted_at?: string | null;
  profile_completed_at?: string | null;
}

/**
 * 🏷️ Normalize prefix into standard values: "mr" | "mrs" | "miss" | ""
 */
export function normalizePrefix(prefix?: string | null): string {
  if (!prefix) return "";
  const raw = prefix.trim().toLowerCase();
  if (raw === "นาย" || raw === "mr" || raw === "mr.") return "mr";
  if (raw === "นาง" || raw === "mrs" || raw === "mrs.") return "mrs";
  if (raw === "นางสาว" || raw === "น.ส." || raw === "น.ส" || raw === "miss" || raw === "ms" || raw === "ms.") return "miss";
  return raw;
}

/**
 * 🏷️ Helper function to format / translate Name Prefix (คำนำหน้าชื่อ: mr, mrs, miss)
 */
export function formatPrefix(prefix?: string | null, lang: "TH" | "EN" = "TH"): string {
  if (!prefix) return "";
  const raw = prefix.trim().toLowerCase();

  if (raw === "mr" || raw === "mr." || raw === "นาย") {
    return lang === "TH" ? "นาย" : "Mr.";
  }
  if (raw === "mrs" || raw === "mrs." || raw === "นาง") {
    return lang === "TH" ? "นาง" : "Mrs.";
  }
  if (raw === "miss" || raw === "ms" || raw === "ms." || raw === "นางสาว" || raw === "น.ส." || raw === "น.ส") {
    return lang === "TH" ? "นางสาว" : (raw.startsWith("ms") ? "Ms." : "Miss");
  }

  return prefix;
}

/**
 * 🏷️ Helper function to get display label for Prefix (e.g. "นาย (Mr.)" or "Mr. (นาย)")
 */
export function getPrefixDisplayLabel(prefix?: string | null, lang: "TH" | "EN" = "TH"): string {
  if (!prefix) return "—";
  const raw = prefix.trim().toLowerCase();

  if (raw === "mr" || raw === "mr." || raw === "นาย") {
    return lang === "TH" ? "นาย (Mr.)" : "Mr. (นาย)";
  }
  if (raw === "mrs" || raw === "mrs." || raw === "นาง") {
    return lang === "TH" ? "นาง (Mrs.)" : "Mrs. (นาง)";
  }
  if (raw === "miss" || raw === "นางสาว" || raw === "น.ส." || raw === "น.ส") {
    return lang === "TH" ? "นางสาว (Miss)" : "Miss (นางสาว)";
  }
  if (raw === "ms" || raw === "ms.") {
    return lang === "TH" ? "นางสาว (Ms.)" : "Ms. (นางสาว)";
  }

  return prefix;
}

/**
 * 💍 Helper function to format Marital Status (สถานภาพสมรส)
 */
export function formatMaritalStatus(status?: string | null, lang: "TH" | "EN" = "TH"): string {
  if (!status) return lang === "TH" ? "โสด (Single)" : "Single";

  const raw = status.trim().toLowerCase();

  if (raw.includes("สมรส") || raw.includes("แต่งงาน") || raw.includes("married")) {
    return lang === "TH" ? "สมรส (Married)" : "Married";
  }
  if (raw.includes("หย่า") || raw.includes("divorced")) {
    return lang === "TH" ? "หย่าร้าง (Divorced)" : "Divorced";
  }
  if (raw.includes("หม้าย") || raw.includes("widowed")) {
    return lang === "TH" ? "หม้าย (Widowed)" : "Widowed";
  }
  if (raw.includes("แยกกันอยู่") || raw.includes("separated")) {
    return lang === "TH" ? "แยกกันอยู่ (Separated)" : "Separated";
  }

  return lang === "TH" ? "โสด (Single)" : "Single";
}

/**
 * ⏱️ Helper function to format relative login time (เช่น 'เมื่อ 5 นาทีที่แล้ว', 'วันนี้ 14:30 น.')
 */
export function formatRelativeTime(dateString?: string | null, lang: "TH" | "EN" = "TH"): string {
  if (!dateString) return lang === "TH" ? "ยังไม่มีบันทึก" : "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) {
    return lang === "TH" ? "เมื่อสักครู่" : "Just now";
  }
  if (diffMin < 60) {
    return lang === "TH" ? `${diffMin} นาทีที่แล้ว` : `${diffMin}m ago`;
  }
  if (diffHours < 24) {
    return lang === "TH" ? `${diffHours} ชม. ที่แล้ว` : `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return lang === "TH" ? "เมื่อวานนี้" : "Yesterday";
  }
  if (diffDays < 7) {
    return lang === "TH" ? `${diffDays} วันที่แล้ว` : `${diffDays}d ago`;
  }

  return date.toLocaleDateString(lang === "TH" ? "th-TH" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Helper function to compute Full Name (supports Thai & English)
 */
export function getEmployeeFullName(profile?: Partial<EmployeeProfile> | null, lang: "TH" | "EN" = "TH"): string {
  if (!profile) return "";

  const prefixFormatted = profile.prefix ? formatPrefix(profile.prefix, lang) : "";
  const prefixStr = prefixFormatted ? `${prefixFormatted} ` : "";

  if (lang === "TH" && profile.first_name_th && profile.last_name_th) {
    return `${prefixStr}${profile.first_name_th} ${profile.last_name_th}`.trim();
  }

  if (profile.first_name && profile.last_name) {
    return `${prefixStr}${profile.first_name} ${profile.last_name}`.trim();
  }

  const validFullName =
    profile.full_name &&
    profile.full_name !== "Authorized Staff" &&
    profile.full_name !== "H. Administrator" &&
    profile.full_name !== "Staff Member"
      ? profile.full_name
      : "";

  return (
    validFullName ||
    profile.nickname_th ||
    profile.nickname ||
    profile.username ||
    profile.email?.split("@")[0] ||
    "Administrator"
  );
}

/**
 * 🎓 Bilingual Education Level Translator & Formatter (รองรับ ปวช., ปวส., ม.6, ปริญญาตรี, ฯลฯ)
 */
export function translateEducationLevel(level?: string | null, lang: "TH" | "EN" = "TH"): string {
  if (!level) return lang === "TH" ? "ไม่ได้ระบุ" : "Not specified";

  const raw = level.trim().toLowerCase();

  // 1. ปวช. (Vocational Certificate)
  if (raw.includes("ปวช") || raw.includes("vocational certificate") || raw.includes("voc. cert")) {
    return lang === "TH"
      ? "ประกาศนียบัตรวิชาชีพ (ปวช.)"
      : "Vocational Certificate (Voc. Cert. / ปวช.)";
  }

  // 2. ปวส. (High Vocational Certificate / Diploma)
  if (raw.includes("ปวส") || raw.includes("high vocational") || raw.includes("diploma") || raw.includes("อนุปริญญา")) {
    return lang === "TH"
      ? "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.) / อนุปริญญา"
      : "High Vocational Certificate (Dip. / High Voc. Cert. / ปวส.)";
  }

  // 3. ปวท. (Technical Vocational Certificate)
  if (raw.includes("ปวท")) {
    return lang === "TH"
      ? "ประกาศนียบัตรวิชาชีพเทคนิค (ปวท.)"
      : "Technical Vocational Certificate (ปวท.)";
  }

  // 4. มัธยมศึกษาตอนปลาย / ม.6 (High School)
  if (raw.includes("ม.6") || raw.includes("มัธยมศึกษาตอนปลาย") || raw.includes("high school")) {
    return lang === "TH"
      ? "มัธยมศึกษาตอนปลาย (ม.6)"
      : "High School Diploma (Grade 12 / M.6)";
  }

  // 5. มัธยมศึกษาตอนต้น / ม.3 (Junior High School)
  if (raw.includes("ม.3") || raw.includes("มัธยมศึกษาตอนต้น") || raw.includes("junior high")) {
    return lang === "TH"
      ? "มัธยมศึกษาตอนต้น (ม.3)"
      : "Junior High School (Grade 9 / M.3)";
  }

  // 6. ปริญญาตรี (Bachelor's Degree)
  if (raw.includes("ตรี") || raw.includes("bachelor")) {
    return lang === "TH"
      ? "ปริญญาตรี (Bachelor's Degree)"
      : "Bachelor's Degree (B.Sc. / B.A. / B.Eng.)";
  }

  // 7. ปริญญาโท (Master's Degree)
  if (raw.includes("โท") || raw.includes("master")) {
    return lang === "TH"
      ? "ปริญญาโท (Master's Degree)"
      : "Master's Degree (M.Sc. / M.A. / MBA)";
  }

  // 8. ปริญญาเอก (Doctoral Degree / Ph.D.)
  if (raw.includes("เอก") || raw.includes("doctor") || raw.includes("ph.d") || raw.includes("phd")) {
    return lang === "TH"
      ? "ปริญญาเอก (Doctoral Degree / Ph.D.)"
      : "Doctoral Degree (Ph.D. / Doctorate)";
  }

  return level;
}

/**
 * 🏛️ Bilingual University & Educational Institution Translator
 */
const UNIVERSITY_DICTIONARY: Array<{
  th: string;
  en: string;
  keywords: string[];
}> = [
  {
    th: "จุฬาลงกรณ์มหาวิทยาลัย",
    en: "Chulalongkorn University",
    keywords: ["จุฬา", "chulalongkorn", "chula"],
  },
  {
    th: "มหาวิทยาลัยธรรมศาสตร์",
    en: "Thammasat University",
    keywords: ["ธรรมศาสตร์", "thammasat", "tu"],
  },
  {
    th: "มหาวิทยาลัยเกษตรศาสตร์",
    en: "Kasetsart University",
    keywords: ["เกษตรศาสตร์", "kasetsart", "ku"],
  },
  {
    th: "มหาวิทยาลัยมหิดล",
    en: "Mahidol University",
    keywords: ["มหิดล", "mahidol", "mu"],
  },
  {
    th: "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง (สจล.)",
    en: "King Mongkut's Institute of Technology Ladkrabang (KMITL)",
    keywords: ["ลาดกระบัง", "kmitl", "เจ้าคุณทหาร"],
  },
  {
    th: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (มจธ. / บางมด)",
    en: "King Mongkut's University of Technology Thonburi (KMUTT)",
    keywords: ["บางมด", "kmutt", "พระจอมเกล้าธนบุรี"],
  },
  {
    th: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (มจพ.)",
    en: "King Mongkut's University of Technology North Bangkok (KMUTNB)",
    keywords: ["พระนครเหนือ", "kmutnb"],
  },
  {
    th: "มหาวิทยาลัยเชียงใหม่",
    en: "Chiang Mai University",
    keywords: ["เชียงใหม่", "chiang mai", "cmu"],
  },
  {
    th: "มหาวิทยาลัยขอนแก่น",
    en: "Khon Kaen University",
    keywords: ["ขอนแก่น", "khon kaen", "kku"],
  },
  {
    th: "มหาวิทยาลัยสงขลานครินทร์",
    en: "Prince of Songkla University",
    keywords: ["สงขลา", "songkla", "psu"],
  },
  {
    th: "มหาวิทยาลัยรามคำแหง",
    en: "Ramkhamhaeng University",
    keywords: ["รามคำแหง", "ramkhamhaeng", "ru"],
  },
  {
    th: "มหาวิทยาลัยกรุงเทพ",
    en: "Bangkok University",
    keywords: ["กรุงเทพ", "bangkok university", "bu"],
  },
  {
    th: "มหาวิทยาลัยศรีปทุม",
    en: "Sripatum University",
    keywords: ["ศรีปทุม", "sripatum", "spu"],
  },
  {
    th: "มหาวิทยาลัยอัสสัมชัญ (เอแบค)",
    en: "Assumption University (ABAC)",
    keywords: ["เอแบค", "abac", "assumption"],
  },
  {
    th: "มหาวิทยาลัยรังสิต",
    en: "Rangsit University",
    keywords: ["รังสิต", "rangsit", "rsu"],
  },
  {
    th: "มหาวิทยาลัยหอการค้าไทย",
    en: "University of the Thai Chamber of Commerce (UTCC)",
    keywords: ["หอการค้า", "utcc"],
  },
  {
    th: "วิทยาลัยเทคนิค / วิทยาลัยอาชีวศึกษา",
    en: "Vocational & Technical College",
    keywords: ["วิทยาลัยเทคนิค", "วิทยาลัยอาชีว", "vocational college", "technical college"],
  },
];

export function translateUniversity(universityName?: string | null, lang: "TH" | "EN" = "TH"): string {
  if (!universityName) return lang === "TH" ? "ไม่ได้ระบุ" : "Not specified";

  const raw = universityName.trim().toLowerCase();

  for (const item of UNIVERSITY_DICTIONARY) {
    if (
      raw.includes(item.th.toLowerCase()) ||
      raw.includes(item.en.toLowerCase()) ||
      item.keywords.some((k) => raw.includes(k.toLowerCase()))
    ) {
      return lang === "TH" ? item.th : item.en;
    }
  }

  return universityName;
}

export interface AuthUserState {
  user: EmployeeProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * 🏢 Branch Database Interface
 */
export interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  branch_name_th?: string | null;
  branch_name_en?: string | null;
  address?: string | null;
  phone?: string | null;
  is_active?: boolean;
}

/**
 * 🏛️ Standard Pre-seeded Branches List (Used as immediate UI options & database fallbacks)
 */
export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    branch_code: "HQ-01",
    branch_name: "สำนักงานใหญ่ (Headquarter)",
    branch_name_th: "สำนักงานใหญ่",
    branch_name_en: "Headquarter",
    address: "อาคาร ดีเอดับเบิลยูเอช ทาวเวอร์ กรุงเทพฯ",
    phone: "02-123-4567",
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    branch_code: "BKK-01",
    branch_name: "สาขากรุงเทพฯ (Bangkok Branch)",
    branch_name_th: "สาขากรุงเทพฯ",
    branch_name_en: "Bangkok Branch",
    address: "เขตจตุจักร กรุงเทพมหานคร",
    phone: "02-987-6543",
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    branch_code: "CNX-01",
    branch_name: "สาขาเชียงใหม่ (Chiang Mai Branch)",
    branch_name_th: "สาขาเชียงใหม่",
    branch_name_en: "Chiang Mai Branch",
    address: "อำเภอเมือง จังหวัดเชียงใหม่",
    phone: "053-123-456",
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    branch_code: "KKC-01",
    branch_name: "สาขาขอนแก่น (Khon Kaen Branch)",
    branch_name_th: "สาขาขอนแก่น",
    branch_name_en: "Khon Kaen Branch",
    address: "อำเภอเมือง จังหวัดขอนแก่น",
    phone: "043-123-456",
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    branch_code: "HYI-01",
    branch_name: "สาขาหาดใหญ่ (Hatyai Branch)",
    branch_name_th: "สาขาหาดใหญ่",
    branch_name_en: "Hatyai Branch",
    address: "อำเภอหาดใหญ่ จังหวัดสงขลา",
    phone: "074-123-456",
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    branch_code: "CBI-01",
    branch_name: "สาขาชลบุรี (Chonburi Branch)",
    branch_name_th: "สาขาชลบุรี",
    branch_name_en: "Chonburi Branch",
    address: "อำเภอเมือง จังหวัดชลบุรี",
    phone: "038-123-456",
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000007",
    branch_code: "NMA-01",
    branch_name: "สาขานครราชสีมา (Korat Branch)",
    branch_name_th: "สาขานครราชสีมา",
    branch_name_en: "Korat Branch",
    address: "อำเภอเมือง จังหวัดนครราชสีมา",
    phone: "044-123-456",
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000008",
    branch_code: "HKT-01",
    branch_name: "สาขาภูเก็ต (Phuket Branch)",
    branch_name_th: "สาขาภูเก็ต",
    branch_name_en: "Phuket Branch",
    address: "อำเภอเมือง จังหวัดภูเก็ต",
    phone: "076-123-456",
    is_active: true,
  },
];

/**
 * 🏷️ Helper function to format Branch display text
 */
export function formatBranchName(branchName?: string | null, lang: "TH" | "EN" = "TH"): string {
  if (!branchName) return lang === "TH" ? "สำนักงานใหญ่" : "Headquarter";
  const found = DEFAULT_BRANCHES.find(
    (b) =>
      b.branch_name.toLowerCase() === branchName.toLowerCase() ||
      b.branch_code.toLowerCase() === branchName.toLowerCase() ||
      (b.branch_name_th && b.branch_name_th.toLowerCase() === branchName.toLowerCase()) ||
      (b.branch_name_en && b.branch_name_en.toLowerCase() === branchName.toLowerCase())
  );
  if (found) {
    return lang === "TH" ? found.branch_name_th || found.branch_name : found.branch_name_en || found.branch_name;
  }
  return branchName;
}
