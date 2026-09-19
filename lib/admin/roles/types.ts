export type RoleDto = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  version: number;
  permissions: string[];
};

export type PermissionDto = {
  id: string;
  code: string;
  module: string;
  description: string;
};

export type AssignRoleInput = {
  roleId: string;
  validFrom: string | null;
  validUntil: string | null;
};

export type RoleAssignmentDto = {
  id: string;
  userId: string;
  roleId: string;
  roleCode: string;
  validFrom: string | null;
  validUntil: string | null;
  assignedAt: string;
  assignedBy: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
  revokeReason: string | null;
};
