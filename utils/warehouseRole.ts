import type { Role } from "@/lib/contracts/warehouse";

const warehouseRoleLabels: Record<Role, { TH: string; EN: string }> = {
  ADMIN: { TH: "ผู้ดูแลระบบ", EN: "System Administrator" },
  CEO: { TH: "ผู้บริหารสูงสุด", EN: "Chief Executive Officer" },
  MANAGER: { TH: "ผู้จัดการสาขา", EN: "Branch Manager" },
  COUNTER_STAFF: { TH: "เจ้าหน้าที่เคาน์เตอร์", EN: "Counter Staff" },
  EMPLOYEE: { TH: "พนักงาน", EN: "Employee" },
};

export function getWarehouseRoleLabel(
  role: Role | string | null | undefined,
  lang: "TH" | "EN",
): string {
  if (!role) return "";
  return warehouseRoleLabels[role as Role]?.[lang] ?? role;
}
