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
