// ==============================================================================
// DAWH MASTER DATA - THAI UNIVERSITIES, SCHOOLS & THAILAND ADDRESS AUTOCOMPLETE
// File: data/masterData.ts
// ==============================================================================

import fullAddressJson from "./thailand_full_addresses.json";
import fullSchoolJson from "./thai_schools_universities.json";

export interface UniversityItem {
  id: string;
  name_th: string;
  name_en: string;
  category: "รัฐบาล" | "ในกำกับรัฐ" | "เอกชน" | "ราชภัฏ" | "ราชมงคล" | "นานาชาติ/ต่างประเทศ" | "โรงเรียน/มัธยมศึกษา" | "อื่นๆ" | string;
  abbr_th?: string;
  abbr_en?: string;
}

export const THAI_UNIVERSITIES: UniversityItem[] = (fullSchoolJson as UniversityItem[]) || [];

/**
 * 🎓 Filter and search universities & schools by keyword (Thai / English name or abbreviation)
 */
export function searchUniversities(query: string): UniversityItem[] {
  if (!query || query.trim() === "") return THAI_UNIVERSITIES.slice(0, 20);
  const q = query.toLowerCase().trim();
  return THAI_UNIVERSITIES.filter((item) => {
    return (
      item.name_th.toLowerCase().includes(q) ||
      item.name_en.toLowerCase().includes(q) ||
      (item.abbr_th && item.abbr_th.toLowerCase().includes(q)) ||
      (item.abbr_en && item.abbr_en.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  }).slice(0, 30);
}

// ==============================================================================
// 📍 THAILAND ADDRESS AUTOCOMPLETE MASTER DATA (All 77 Provinces, 930 Districts, 7,452 Subdistricts)
// ==============================================================================

export interface ThaiAddressItem {
  id: string;
  subdistrict_th: string;
  subdistrict_en: string;
  district_th: string;
  district_en: string;
  province_th: string;
  province_en: string;
  zipcode: string;
}

export const THAI_ADDRESS_DATA: ThaiAddressItem[] = (fullAddressJson as ThaiAddressItem[]) || [];


/**
 * 📍 Search Thai address by keyword (subdistrict, district, province, or 5-digit zipcode)
 */
export function searchThaiAddress(query: string): ThaiAddressItem[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  return THAI_ADDRESS_DATA.filter((item) => {
    return (
      item.zipcode.startsWith(q) ||
      item.subdistrict_th.toLowerCase().includes(q) ||
      item.subdistrict_en.toLowerCase().includes(q) ||
      item.district_th.toLowerCase().includes(q) ||
      item.district_en.toLowerCase().includes(q) ||
      item.province_th.toLowerCase().includes(q) ||
      item.province_en.toLowerCase().includes(q)
    );
  }).slice(0, 10);
}

/**
 * Format address object into Thai string
 */
export function formatThaiAddressString(item: ThaiAddressItem, detailPrefix: string = ""): string {
  const prefix = detailPrefix.trim() ? `${detailPrefix.trim()} ` : "";
  const isBkk = item.province_th.includes("กรุงเทพ");
  const subLabel = isBkk ? `แขวง${item.subdistrict_th}` : `ต.${item.subdistrict_th}`;
  const distLabel = isBkk ? item.district_th : `อ.${item.district_th}`;
  const provLabel = isBkk ? item.province_th : `จ.${item.province_th}`;
  return `${prefix}${subLabel} ${distLabel} ${provLabel} ${item.zipcode}`.trim();
}

/**
 * Format address object into English string
 */
export function formatEnglishAddressString(item: ThaiAddressItem, detailPrefix: string = ""): string {
  const prefix = detailPrefix.trim() ? `${detailPrefix.trim()}, ` : "";
  return `${prefix}${item.subdistrict_en}, ${item.district_en}, ${item.province_en} ${item.zipcode}`.trim();
}

// ==============================================================================
// 🏙️ CASCADE ADDRESS HELPER FUNCTIONS
// ==============================================================================

export interface ProvinceOption {
  province_th: string;
  province_en: string;
}

export interface DistrictOption {
  district_th: string;
  district_en: string;
}

export interface SubdistrictOption {
  subdistrict_th: string;
  subdistrict_en: string;
  zipcode: string;
}

/** Get unique provinces sorted */
export function getProvinces(): ProvinceOption[] {
  const seen = new Set<string>();
  const result: ProvinceOption[] = [];
  for (const item of THAI_ADDRESS_DATA) {
    if (!seen.has(item.province_en)) {
      seen.add(item.province_en);
      result.push({ province_th: item.province_th, province_en: item.province_en });
    }
  }
  return result.sort((a, b) => {
    // Bangkok first, then alphabetical
    if (a.province_en === "Bangkok") return -1;
    if (b.province_en === "Bangkok") return 1;
    return a.province_th.localeCompare(b.province_th, "th");
  });
}

/** Get unique districts filtered by province */
export function getDistricts(province_en: string): DistrictOption[] {
  const seen = new Set<string>();
  const result: DistrictOption[] = [];
  for (const item of THAI_ADDRESS_DATA) {
    if (item.province_en === province_en && !seen.has(item.district_en)) {
      seen.add(item.district_en);
      result.push({ district_th: item.district_th, district_en: item.district_en });
    }
  }
  return result.sort((a, b) => a.district_th.localeCompare(b.district_th, "th"));
}

/** Get unique subdistricts filtered by province + district */
export function getSubdistricts(province_en: string, district_en: string): SubdistrictOption[] {
  const seen = new Set<string>();
  const result: SubdistrictOption[] = [];
  for (const item of THAI_ADDRESS_DATA) {
    if (item.province_en === province_en && item.district_en === district_en && !seen.has(item.subdistrict_en)) {
      seen.add(item.subdistrict_en);
      result.push({
        subdistrict_th: item.subdistrict_th,
        subdistrict_en: item.subdistrict_en,
        zipcode: item.zipcode,
      });
    }
  }
  return result.sort((a, b) => a.subdistrict_th.localeCompare(b.subdistrict_th, "th"));
}

/** Get zipcode from province + district + subdistrict */
export function getZipcode(province_en: string, district_en: string, subdistrict_en: string): string {
  const match = THAI_ADDRESS_DATA.find(
    (item) =>
      item.province_en === province_en &&
      item.district_en === district_en &&
      item.subdistrict_en === subdistrict_en
  );
  return match?.zipcode || "";
}

/** Find ThaiAddressItem by province + district + subdistrict (English keys) */
export function findAddressItem(province_en: string, district_en: string, subdistrict_en: string): ThaiAddressItem | null {
  return THAI_ADDRESS_DATA.find(
    (item) =>
      item.province_en === province_en &&
      item.district_en === district_en &&
      item.subdistrict_en === subdistrict_en
  ) || null;
}

// ==============================================================================
// 🎓 MAJOR SUBJECT — Thai to English Mapping
// ==============================================================================

export interface MajorSubjectItem {
  id: string;
  name_th: string;
  name_en: string;
  category: string;
}

export const MAJOR_SUBJECTS: MajorSubjectItem[] = [
  // วิศวกรรมศาสตร์
  { id: "cs", name_th: "วิทยาการคอมพิวเตอร์", name_en: "Computer Science", category: "วิทยาศาสตร์และเทคโนโลยี" },
  { id: "it", name_th: "เทคโนโลยีสารสนเทศ", name_en: "Information Technology", category: "วิทยาศาสตร์และเทคโนโลยี" },
  { id: "se", name_th: "วิศวกรรมซอฟต์แวร์", name_en: "Software Engineering", category: "วิศวกรรมศาสตร์" },
  { id: "ce", name_th: "วิศวกรรมคอมพิวเตอร์", name_en: "Computer Engineering", category: "วิศวกรรมศาสตร์" },
  { id: "ee", name_th: "วิศวกรรมไฟฟ้า", name_en: "Electrical Engineering", category: "วิศวกรรมศาสตร์" },
  { id: "me", name_th: "วิศวกรรมเครื่องกล", name_en: "Mechanical Engineering", category: "วิศวกรรมศาสตร์" },
  { id: "cve", name_th: "วิศวกรรมโยธา", name_en: "Civil Engineering", category: "วิศวกรรมศาสตร์" },
  { id: "cheme", name_th: "วิศวกรรมเคมี", name_en: "Chemical Engineering", category: "วิศวกรรมศาสตร์" },
  { id: "ind", name_th: "วิศวกรรมอุตสาหการ", name_en: "Industrial Engineering", category: "วิศวกรรมศาสตร์" },
  { id: "env", name_th: "วิศวกรรมสิ่งแวดล้อม", name_en: "Environmental Engineering", category: "วิศวกรรมศาสตร์" },
  { id: "pet", name_th: "วิศวกรรมปิโตรเลียม", name_en: "Petroleum Engineering", category: "วิศวกรรมศาสตร์" },
  { id: "mat", name_th: "วิศวกรรมวัสดุ", name_en: "Materials Engineering", category: "วิศวกรรมศาสตร์" },
  { id: "aero", name_th: "วิศวกรรมการบินและอวกาศ", name_en: "Aerospace Engineering", category: "วิศวกรรมศาสตร์" },
  { id: "bio_eng", name_th: "วิศวกรรมชีวการแพทย์", name_en: "Biomedical Engineering", category: "วิศวกรรมศาสตร์" },
  // วิทยาศาสตร์
  { id: "math", name_th: "คณิตศาสตร์", name_en: "Mathematics", category: "วิทยาศาสตร์และเทคโนโลยี" },
  { id: "stat", name_th: "สถิติ", name_en: "Statistics", category: "วิทยาศาสตร์และเทคโนโลยี" },
  { id: "phys", name_th: "ฟิสิกส์", name_en: "Physics", category: "วิทยาศาสตร์และเทคโนโลยี" },
  { id: "chem", name_th: "เคมี", name_en: "Chemistry", category: "วิทยาศาสตร์และเทคโนโลยี" },
  { id: "bio", name_th: "ชีววิทยา", name_en: "Biology", category: "วิทยาศาสตร์และเทคโนโลยี" },
  { id: "microbio", name_th: "จุลชีววิทยา", name_en: "Microbiology", category: "วิทยาศาสตร์และเทคโนโลยี" },
  { id: "biotech", name_th: "เทคโนโลยีชีวภาพ", name_en: "Biotechnology", category: "วิทยาศาสตร์และเทคโนโลยี" },
  { id: "env_sci", name_th: "วิทยาศาสตร์สิ่งแวดล้อม", name_en: "Environmental Science", category: "วิทยาศาสตร์และเทคโนโลยี" },
  { id: "food_sci", name_th: "วิทยาศาสตร์การอาหาร", name_en: "Food Science", category: "วิทยาศาสตร์และเทคโนโลยี" },
  { id: "data_sci", name_th: "วิทยาศาสตร์ข้อมูล", name_en: "Data Science", category: "วิทยาศาสตร์และเทคโนโลยี" },
  { id: "ai", name_th: "ปัญญาประดิษฐ์", name_en: "Artificial Intelligence", category: "วิทยาศาสตร์และเทคโนโลยี" },
  { id: "cybersec", name_th: "ความมั่นคงไซเบอร์", name_en: "Cybersecurity", category: "วิทยาศาสตร์และเทคโนโลยี" },
  { id: "network", name_th: "เครือข่ายคอมพิวเตอร์", name_en: "Computer Networks", category: "วิทยาศาสตร์และเทคโนโลยี" },
  // บริหารธุรกิจ
  { id: "bba", name_th: "บริหารธุรกิจ", name_en: "Business Administration", category: "บริหารธุรกิจและการจัดการ" },
  { id: "mkt", name_th: "การตลาด", name_en: "Marketing", category: "บริหารธุรกิจและการจัดการ" },
  { id: "fin", name_th: "การเงิน", name_en: "Finance", category: "บริหารธุรกิจและการจัดการ" },
  { id: "acc", name_th: "การบัญชี", name_en: "Accounting", category: "บริหารธุรกิจและการจัดการ" },
  { id: "hr", name_th: "การบริหารทรัพยากรมนุษย์", name_en: "Human Resource Management", category: "บริหารธุรกิจและการจัดการ" },
  { id: "om", name_th: "การจัดการการดำเนินงาน", name_en: "Operations Management", category: "บริหารธุรกิจและการจัดการ" },
  { id: "econ", name_th: "เศรษฐศาสตร์", name_en: "Economics", category: "บริหารธุรกิจและการจัดการ" },
  { id: "int_trade", name_th: "การค้าระหว่างประเทศ", name_en: "International Trade", category: "บริหารธุรกิจและการจัดการ" },
  { id: "logistics", name_th: "โลจิสติกส์", name_en: "Logistics", category: "บริหารธุรกิจและการจัดการ" },
  { id: "tourism", name_th: "การจัดการท่องเที่ยวและโรงแรม", name_en: "Tourism and Hospitality Management", category: "บริหารธุรกิจและการจัดการ" },
  { id: "entrep", name_th: "ผู้ประกอบการ", name_en: "Entrepreneurship", category: "บริหารธุรกิจและการจัดการ" },
  // นิติศาสตร์และรัฐศาสตร์
  { id: "law", name_th: "นิติศาสตร์", name_en: "Law", category: "สังคมศาสตร์และมนุษยศาสตร์" },
  { id: "poli_sci", name_th: "รัฐศาสตร์", name_en: "Political Science", category: "สังคมศาสตร์และมนุษยศาสตร์" },
  { id: "pub_admin", name_th: "รัฐประศาสนศาสตร์", name_en: "Public Administration", category: "สังคมศาสตร์และมนุษยศาสตร์" },
  { id: "inter_rel", name_th: "ความสัมพันธ์ระหว่างประเทศ", name_en: "International Relations", category: "สังคมศาสตร์และมนุษยศาสตร์" },
  { id: "sociology", name_th: "สังคมวิทยา", name_en: "Sociology", category: "สังคมศาสตร์และมนุษยศาสตร์" },
  { id: "psych", name_th: "จิตวิทยา", name_en: "Psychology", category: "สังคมศาสตร์และมนุษยศาสตร์" },
  { id: "anthro", name_th: "มานุษยวิทยา", name_en: "Anthropology", category: "สังคมศาสตร์และมนุษยศาสตร์" },
  { id: "educ", name_th: "ศึกษาศาสตร์", name_en: "Education", category: "สังคมศาสตร์และมนุษยศาสตร์" },
  // ศิลปศาสตร์และภาษา
  { id: "eng_lang", name_th: "ภาษาอังกฤษ", name_en: "English Language", category: "ศิลปศาสตร์และภาษา" },
  { id: "thai_lang", name_th: "ภาษาไทย", name_en: "Thai Language", category: "ศิลปศาสตร์และภาษา" },
  { id: "chinese", name_th: "ภาษาจีน", name_en: "Chinese Language", category: "ศิลปศาสตร์และภาษา" },
  { id: "japanese", name_th: "ภาษาญี่ปุ่น", name_en: "Japanese Language", category: "ศิลปศาสตร์และภาษา" },
  { id: "french", name_th: "ภาษาฝรั่งเศส", name_en: "French Language", category: "ศิลปศาสตร์และภาษา" },
  { id: "korean", name_th: "ภาษาเกาหลี", name_en: "Korean Language", category: "ศิลปศาสตร์และภาษา" },
  { id: "comm", name_th: "นิเทศศาสตร์", name_en: "Communication Arts", category: "ศิลปศาสตร์และภาษา" },
  { id: "jour", name_th: "วารสารศาสตร์", name_en: "Journalism", category: "ศิลปศาสตร์และภาษา" },
  { id: "fine_arts", name_th: "วิจิตรศิลป์", name_en: "Fine Arts", category: "ศิลปศาสตร์และภาษา" },
  { id: "design", name_th: "การออกแบบ", name_en: "Design", category: "ศิลปศาสตร์และภาษา" },
  { id: "archi", name_th: "สถาปัตยกรรมศาสตร์", name_en: "Architecture", category: "ศิลปศาสตร์และภาษา" },
  { id: "int_design", name_th: "การออกแบบภายใน", name_en: "Interior Design", category: "ศิลปศาสตร์และภาษา" },
  { id: "digi_media", name_th: "สื่อดิจิทัล", name_en: "Digital Media", category: "ศิลปศาสตร์และภาษา" },
  // แพทย์และสาธารณสุข
  { id: "med", name_th: "แพทยศาสตร์", name_en: "Medicine", category: "สุขภาพและวิทยาศาสตร์การแพทย์" },
  { id: "nursing", name_th: "พยาบาลศาสตร์", name_en: "Nursing", category: "สุขภาพและวิทยาศาสตร์การแพทย์" },
  { id: "pharma", name_th: "เภสัชศาสตร์", name_en: "Pharmacy", category: "สุขภาพและวิทยาศาสตร์การแพทย์" },
  { id: "dentistry", name_th: "ทันตแพทยศาสตร์", name_en: "Dentistry", category: "สุขภาพและวิทยาศาสตร์การแพทย์" },
  { id: "pub_health", name_th: "สาธารณสุขศาสตร์", name_en: "Public Health", category: "สุขภาพและวิทยาศาสตร์การแพทย์" },
  { id: "med_tech", name_th: "เทคนิคการแพทย์", name_en: "Medical Technology", category: "สุขภาพและวิทยาศาสตร์การแพทย์" },
  { id: "physio", name_th: "กายภาพบำบัด", name_en: "Physical Therapy", category: "สุขภาพและวิทยาศาสตร์การแพทย์" },
  { id: "sport_sci", name_th: "วิทยาศาสตร์การกีฬา", name_en: "Sports Science", category: "สุขภาพและวิทยาศาสตร์การแพทย์" },
  // เกษตร
  { id: "agri", name_th: "เกษตรศาสตร์", name_en: "Agriculture", category: "เกษตรศาสตร์" },
  { id: "agri_tech", name_th: "เทคโนโลยีการเกษตร", name_en: "Agricultural Technology", category: "เกษตรศาสตร์" },
  { id: "vetmed", name_th: "สัตวแพทยศาสตร์", name_en: "Veterinary Medicine", category: "เกษตรศาสตร์" },
  { id: "forestry", name_th: "วนศาสตร์", name_en: "Forestry", category: "เกษตรศาสตร์" },
  { id: "fishery", name_th: "ประมง", name_en: "Fisheries", category: "เกษตรศาสตร์" },
];

export function searchMajorSubjects(query: string, lang: "TH" | "EN" = "TH"): MajorSubjectItem[] {
  let list = MAJOR_SUBJECTS;
  if (query && query.trim() !== "") {
    const q = query.toLowerCase().trim();
    list = MAJOR_SUBJECTS.filter((item) =>
      item.name_th.toLowerCase().includes(q) ||
      item.name_en.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }
  
  return [...list].sort((a, b) =>
    lang === "TH"
      ? a.name_th.localeCompare(b.name_th, "th")
      : a.name_en.localeCompare(b.name_en, "en")
  ).slice(0, 30);
}

/**
 * Translate Thai major subject name to English (exact match)
 */
export function translateMajorToEnglish(nameTh: string): string {
  const found = MAJOR_SUBJECTS.find(
    (s) => s.name_th === nameTh || s.name_en.toLowerCase() === nameTh.toLowerCase()
  );
  return found?.name_en || nameTh;
}
