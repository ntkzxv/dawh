export const MANAGED_MODULE_KEYS = ["datacenter", "warehouse", "sales", "reports"] as const;

export type ManagedModuleKey = (typeof MANAGED_MODULE_KEYS)[number];

export type ModuleStatus = {
  moduleKey: ManagedModuleKey;
  isEnabled: boolean;
  maintenanceReason: string | null;
  updatedAt: string;
};

export type ModuleStatusHistoryItem = {
  id: number;
  moduleKey: ManagedModuleKey;
  previousEnabled: boolean;
  isEnabled: boolean;
  reason: string | null;
  actor: string;
  changedAt: string;
};
