export type AuditInput = {
  organizationId: string;
  requestId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  facilityId?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuditLogCategory =
  | "all"
  | "security"
  | "organization"
  | "products"
  | "inventory";

export type AuditLogRecord = {
  id: string;
  organizationId: string;
  requestId: string;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  facilityId: string | null;
  facilityCode: string | null;
  facilityName: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: string;
};

export type AuditLogFilters = {
  category?: AuditLogCategory | string;
  entityType?: string;
  action?: string;
  actorUserId?: string;
  facilityId?: string;
  search?: string;
  limit?: number;
  offset?: number;
};
