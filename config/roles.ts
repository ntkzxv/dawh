/**
 * DAWH Enterprise Role-Based Access Control (RBAC)
 * Roles: devops (Supreme Root), super_admin, manager, collector, auditor, staff, viewer
 */

export type UserRole = "devops" | "super_admin" | "manager" | "collector" | "auditor" | "staff" | "viewer";

export interface RoleDefinition {
  key: UserRole;
  level: number;
  label: {
    en: string;
    th: string;
  };
  description: {
    en: string;
    th: string;
  };
  badgeColor: {
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
  permissions: {
    canManageUsers: boolean;
    canEditContracts: boolean;
    canViewAuditLogs: boolean;
    canManageInventory: boolean;
    canExportReports: boolean;
    canDeleteRecords: boolean;
  };
}

export interface ModulePolicy {
  dashboard: boolean;
  customers: boolean;
  inventory: boolean;
  reports: boolean;
  settings: boolean;
}

/**
 * ลำดับขั้นของ Role (Hierarchy)
 * devops (99 - Root Supreme) > super_admin (6) > manager (5) > auditor (4) > collector (3) > staff (2) > viewer (1)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  devops: 99,
  super_admin: 6,
  manager: 5,
  auditor: 4,
  collector: 3,
  staff: 2,
  viewer: 1,
};

export const ROLES: Record<UserRole, RoleDefinition> = {
  devops: {
    key: "devops",
    level: 99,
    label: {
      en: "DevOps",
      th: "DevOps & Core Infrastructure",
    },
    description: {
      en: "Root-level infrastructure, database administration, and unified system governance.",
      th: "สิทธิ์สูงสุดระดับ Root ดูแลโครงสร้างพื้นฐาน ฐานข้อมูล คลาวด์ และระบบแกนกลางทั้งหมด",
    },
    badgeColor: {
      bg: "bg-[#2C2C2C] dark:bg-white",
      text: "text-white dark:text-black font-bold",
      border: "border-[#2C2C2C] dark:border-white",
      dot: "bg-white dark:bg-black",
    },
    permissions: {
      canManageUsers: true,
      canEditContracts: true,
      canViewAuditLogs: true,
      canManageInventory: true,
      canExportReports: true,
      canDeleteRecords: true,
    },
  },
  super_admin: {
    key: "super_admin",
    level: 6,
    label: {
      en: "Super Admin",
      th: "ผู้ดูแลระบบสูงสุด",
    },
    description: {
      en: "Full access to platform configuration, RBAC permissions, and audit logs.",
      th: "สิทธิ์สูงสุดในการควบคุมระบบ, กำหนดสิทธิ์พนักงาน, และดูประวัติ Audit Logs ทั้งหมด",
    },
    badgeColor: {
      bg: "bg-[#111111]/10 dark:bg-white/15",
      text: "text-[#111111] dark:text-white font-bold",
      border: "border-[#111111]/30 dark:border-white/30",
      dot: "bg-[#111111] dark:bg-white",
    },
    permissions: {
      canManageUsers: true,
      canEditContracts: true,
      canViewAuditLogs: true,
      canManageInventory: true,
      canExportReports: true,
      canDeleteRecords: true,
    },
  },
  manager: {
    key: "manager",
    level: 5,
    label: {
      en: "Manager",
      th: "ผู้จัดการ",
    },
    description: {
      en: "Oversee branch operations, contract approvals, inventory flows, and executive reports.",
      th: "กำกับดูแลการทำงานของสาขา, อนุมัติสัญญาเช่าซื้อ, ควบคุมสต็อกสินค้า และดูรายงาน",
    },
    badgeColor: {
      bg: "bg-[#111111]/5 dark:bg-white/10",
      text: "text-[#222222] dark:text-[#F4F4F5] font-semibold",
      border: "border-slate-300 dark:border-white/20",
      dot: "bg-slate-700 dark:bg-neutral-300",
    },
    permissions: {
      canManageUsers: false,
      canEditContracts: true,
      canViewAuditLogs: true,
      canManageInventory: true,
      canExportReports: true,
      canDeleteRecords: false,
    },
  },
  collector: {
    key: "collector",
    level: 3,
    label: {
      en: "Collector",
      th: "เจ้าหน้าที่เร่งรัดหนี้สิน",
    },
    description: {
      en: "Customer account tracking, hire-purchase loan collections, and payment notices.",
      th: "ติดตามทวงถามหนี้, บริหารสัญญาเช่าซื้อ, ตรวจสอบสถานะชำระเงิน และติดต่อลูกค้า",
    },
    badgeColor: {
      bg: "bg-[#111111]/5 dark:bg-white/10",
      text: "text-[#222222] dark:text-[#F4F4F5] font-semibold",
      border: "border-slate-300 dark:border-white/20",
      dot: "bg-slate-700 dark:bg-neutral-300",
    },
    permissions: {
      canManageUsers: false,
      canEditContracts: true,
      canViewAuditLogs: false,
      canManageInventory: false,
      canExportReports: false,
      canDeleteRecords: false,
    },
  },
  auditor: {
    key: "auditor",
    level: 4,
    label: {
      en: "Auditor",
      th: "ผู้ตรวจสอบบัญชี",
    },
    description: {
      en: "Compliance audit, financial transactions oversight, inventory checks, and system logs.",
      th: "ตรวจสอบความโปร่งใส, รายงานการเงิน, ประวัติการปรับเปลี่ยนสต็อก และความเสี่ยง",
    },
    badgeColor: {
      bg: "bg-[#111111]/5 dark:bg-white/10",
      text: "text-[#222222] dark:text-[#F4F4F5] font-semibold",
      border: "border-slate-300 dark:border-white/20",
      dot: "bg-slate-700 dark:bg-neutral-300",
    },
    permissions: {
      canManageUsers: false,
      canEditContracts: false,
      canViewAuditLogs: true,
      canManageInventory: true,
      canExportReports: true,
      canDeleteRecords: false,
    },
  },
  staff: {
    key: "staff",
    level: 2,
    label: {
      en: "Staff",
      th: "เจ้าหน้าที่ปฏิบัติการ",
    },
    description: {
      en: "Day-to-day warehouse operations, barcode scanning, stock receive, and picking.",
      th: "ปฏิบัติงานประจำวัน, สแกนบาร์โค้ดสินค้า, รับ-จ่ายสินค้าในคลัง และตรวจสอบสภาพ",
    },
    badgeColor: {
      bg: "bg-[#111111]/5 dark:bg-white/10",
      text: "text-[#222222] dark:text-[#F4F4F5] font-semibold",
      border: "border-slate-300 dark:border-white/20",
      dot: "bg-slate-600 dark:bg-neutral-400",
    },
    permissions: {
      canManageUsers: false,
      canEditContracts: false,
      canViewAuditLogs: false,
      canManageInventory: true,
      canExportReports: false,
      canDeleteRecords: false,
    },
  },
  viewer: {
    key: "viewer",
    level: 1,
    label: {
      en: "Viewer",
      th: "ผู้ดูข้อมูล",
    },
    description: {
      en: "Read-only access to dashboard statistics, business KPIs, and general performance reports.",
      th: "ดูสถิติภาพรวมแดชบอร์ด, ดัชนีชี้วัดธุรกิจ (KPI), และรายงานทั่วไปโดยไม่สามารถแก้ไขได้",
    },
    badgeColor: {
      bg: "bg-[#111111]/5 dark:bg-white/5",
      text: "text-[#666666] dark:text-[#E4E4E7]",
      border: "border-slate-200 dark:border-white/10",
      dot: "bg-slate-400 dark:bg-neutral-500",
    },
    permissions: {
      canManageUsers: false,
      canEditContracts: false,
      canViewAuditLogs: false,
      canManageInventory: false,
      canExportReports: true,
      canDeleteRecords: false,
    },
  },
};

/**
 * 🎯 Figma RBAC Policies Specification
 * System Role vs Modules (Dashboard, Customers, Inventory, Reports, Settings)
 */
export const RBAC_POLICIES_SPEC: {
  roleKey: UserRole;
  roleName: string;
  roleNameEn: string;
  modules: ModulePolicy;
}[] = [
  {
    roleKey: "devops",
    roleName: "DevOps (สิทธิ์ระบบแกนกลางสูงสุด / Root Infrastructure)",
    roleNameEn: "DevOps (Supreme Root)",
    modules: {
      dashboard: true,
      customers: true,
      inventory: true,
      reports: true,
      settings: true,
    },
  },
  {
    roleKey: "super_admin",
    roleName: "ผู้ดูแลระบบสูงสุด (Super Admin)",
    roleNameEn: "Super Admin",
    modules: {
      dashboard: true,
      customers: true,
      inventory: true,
      reports: true,
      settings: true,
    },
  },
  {
    roleKey: "manager",
    roleName: "ผู้จัดการ (Manager)",
    roleNameEn: "Manager",
    modules: {
      dashboard: true,
      customers: true,
      inventory: true,
      reports: true,
      settings: false,
    },
  },
  {
    roleKey: "collector",
    roleName: "เจ้าหน้าที่เร่งรัดหนี้สิน (Collector)",
    roleNameEn: "Collector",
    modules: {
      dashboard: true,
      customers: true,
      inventory: false,
      reports: false,
      settings: false,
    },
  },
  {
    roleKey: "auditor",
    roleName: "ผู้ตรวจสอบบัญชี (Auditor)",
    roleNameEn: "Auditor",
    modules: {
      dashboard: true,
      customers: true,
      inventory: true,
      reports: true,
      settings: false,
    },
  },
  {
    roleKey: "staff",
    roleName: "เจ้าหน้าที่ปฏิบัติการ (Staff)",
    roleNameEn: "Staff",
    modules: {
      dashboard: true,
      customers: false,
      inventory: true,
      reports: false,
      settings: false,
    },
  },
  {
    roleKey: "viewer",
    roleName: "ผู้ดูข้อมูล (Viewer)",
    roleNameEn: "Viewer",
    modules: {
      dashboard: true,
      customers: false,
      inventory: false,
      reports: true,
      settings: false,
    },
  },
];

/**
 * ตรวจสอบว่า userRole มีสิทธิ์เท่ากับหรือสูงกว่า requiredRole หรือไม่
 */
export function hasRolePermission(
  userRole: UserRole | string | undefined | null,
  requiredRole: UserRole
): boolean {
  if (!userRole) return false;
  const cleanRole = (userRole.toLowerCase() as UserRole) || "staff";
  const userLevel = ROLE_HIERARCHY[cleanRole] ?? 1;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 1;
  return userLevel >= requiredLevel;
}

/**
 * ดึงชื่อแสดงผลของ Role ตามภาษา
 */
export function getRoleDisplayName(
  role: UserRole | string | undefined | null,
  lang: "en" | "th" = "en"
): string {
  const cleanRole = (role?.toLowerCase() as UserRole) || "staff";
  return ROLES[cleanRole]?.label[lang] || cleanRole.toUpperCase();
}

/**
 * Role เริ่มต้นสำหรับบัญชีที่สมัครใหม่
 */
export const DEFAULT_NEW_USER_ROLE: UserRole = "staff";

