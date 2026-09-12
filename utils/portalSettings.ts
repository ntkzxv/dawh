"use client";

export type WorkspaceCardId = "datacenter" | "warehouse" | "ai";
export type WorkspaceStatusMode = "active" | "maintenance" | "disabled";

export interface WorkspaceCardConfig {
  id: WorkspaceCardId;
  isMaintenanceLock: boolean; // ON (true) = Cannot access (Blocked), OFF (false) = Normal access (Allowed)
  lockedAt?: string; // ISO Timestamp when maintenance lock was activated
  statusMode: WorkspaceStatusMode;
  statusTextTh: string;
  statusTextEn: string;
  statusColor: string;
  badgeTh?: string;
  badgeEn?: string;
  maintenanceMessageTh?: string;
  maintenanceMessageEn?: string;
}

export interface PortalSystemSettings {
  cards: Record<WorkspaceCardId, WorkspaceCardConfig>;
  updatedAt: string;
  updatedBy?: string;
}

export const PORTAL_SETTINGS_KEY = "dawh_portal_workspace_settings";
export const PORTAL_SETTINGS_EVENT = "dawh_portal_settings_updated";

export const DEFAULT_PORTAL_SETTINGS: PortalSystemSettings = {
  cards: {
    datacenter: {
      id: "datacenter",
      isMaintenanceLock: false,
      statusMode: "active",
      statusTextTh: "พร้อมใช้งาน",
      statusTextEn: "Active",
      statusColor: "#2EC4B6",
      badgeTh: "ระบบการเงินและสัญญาเช่าซื้อ",
      badgeEn: "Core Finance & Operations",
      maintenanceMessageTh: "ระบบกำลังอยู่ในช่วงปรับปรุงและอัปเกรดระบบฐานข้อมูลสัญญาเช่าซื้อ ขออภัยในความไม่สะดวก",
      maintenanceMessageEn: "System is undergoing scheduled maintenance and ledger calibration.",
    },
    warehouse: {
      id: "warehouse",
      isMaintenanceLock: false,
      statusMode: "active",
      statusTextTh: "พร้อมใช้งาน",
      statusTextEn: "Active",
      statusColor: "#2EC4B6",
      badgeTh: "ระบบคลังสินค้าและการจัดส่ง",
      badgeEn: "Supply Chain & Logistics",
      maintenanceMessageTh: "ระบบกำลังอยู่ในช่วงปรับปรุงและตรวจนับจัดสรรสต็อกสินค้า ขออภัยในความไม่สะดวก",
      maintenanceMessageEn: "System is undergoing scheduled inventory reconciliation.",
    },
    ai: {
      id: "ai",
      isMaintenanceLock: false,
      statusMode: "active",
      statusTextTh: "พร้อมใช้งาน",
      statusTextEn: "Active",
      statusColor: "#2EC4B6",
      badgeTh: "ระบบพยากรณ์และปัญญาประดิษฐ์เชิงลึก",
      badgeEn: "Predictive Intelligence & Neural Models",
      maintenanceMessageTh: "ระบบกำลังอยู่ในช่วงปรับปรุงและปรับเทียบโมเดล Neural Network ประจำรอบ",
      maintenanceMessageEn: "Deep learning predictive models are undergoing routine re-calibration.",
    },
  },
  updatedAt: new Date().toISOString(),
  updatedBy: "System Default",
};

/**
 * Get current portal workspace card settings from localStorage with default fallback
 */
export function getPortalSettings(): PortalSystemSettings {
  if (typeof window === "undefined") {
    return DEFAULT_PORTAL_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(PORTAL_SETTINGS_KEY);
    if (!raw) return DEFAULT_PORTAL_SETTINGS;

    const parsed: PortalSystemSettings = JSON.parse(raw);
    return {
      cards: {
        datacenter: {
          ...DEFAULT_PORTAL_SETTINGS.cards.datacenter,
          ...parsed.cards?.datacenter,
          isMaintenanceLock:
            parsed.cards?.datacenter?.isMaintenanceLock !== undefined
              ? parsed.cards.datacenter.isMaintenanceLock
              : false,
          lockedAt: parsed.cards?.datacenter?.lockedAt,
        },
        warehouse: {
          ...DEFAULT_PORTAL_SETTINGS.cards.warehouse,
          ...parsed.cards?.warehouse,
          isMaintenanceLock:
            parsed.cards?.warehouse?.isMaintenanceLock !== undefined
              ? parsed.cards.warehouse.isMaintenanceLock
              : false,
          lockedAt: parsed.cards?.warehouse?.lockedAt,
        },
        ai: {
          ...DEFAULT_PORTAL_SETTINGS.cards.ai,
          ...parsed.cards?.ai,
          isMaintenanceLock:
            parsed.cards?.ai?.isMaintenanceLock !== undefined
              ? parsed.cards.ai.isMaintenanceLock
              : false,
          lockedAt: parsed.cards?.ai?.lockedAt,
        },
      },
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      updatedBy: parsed.updatedBy || "DevOps",
    };
  } catch (err) {
    console.error("Error reading portal settings from storage:", err);
    return DEFAULT_PORTAL_SETTINGS;
  }
}

/**
 * Save portal settings to localStorage and notify all components/tabs in real-time
 */
export function savePortalSettings(settings: PortalSystemSettings, updatedBy = "DevOps"): void {
  if (typeof window === "undefined") return;

  const payload: PortalSystemSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  try {
    localStorage.setItem(PORTAL_SETTINGS_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent(PORTAL_SETTINGS_EVENT, { detail: payload }));
  } catch (err) {
    console.error("Error saving portal settings to storage:", err);
  }
}

/**
 * Reset portal settings back to system defaults
 */
export function resetPortalSettings(): PortalSystemSettings {
  savePortalSettings(DEFAULT_PORTAL_SETTINGS, "Reset to Default");
  return DEFAULT_PORTAL_SETTINGS;
}

/**
 * Check if a user can enter the workspace card based strictly on isMaintenanceLock (OFF / ON)
 */
export function checkWorkspaceAccess(
  cardConfig: WorkspaceCardConfig
): {
  allowed: boolean;
  title: string;
  reason: string;
} {
  // If Maintenance Lock is ON -> Blocked
  if (cardConfig.isMaintenanceLock) {
    return {
      allowed: false,
      title:
        cardConfig.statusMode === "disabled"
          ? "ปิดการเข้าใช้งานชั่วคราว"
          : "ระบบกำลังปรับปรุง",
      reason:
        cardConfig.maintenanceMessageTh ||
        "ระบบกำลังอยู่ในช่วงปรับปรุงและอัปเกรดระบบชั่วคราว เพื่อเพิ่มประสิทธิภาพการทำงาน ขออภัยในความไม่สะดวก",
    };
  }

  // If Maintenance Lock is OFF -> Allowed
  return {
    allowed: true,
    title: "พร้อมใช้งาน",
    reason: "",
  };
}
