import "server-only";
import type { Pool, PoolClient } from "pg";
import { AuthorizationError } from "@/lib/access/service";
import type { AccessContext } from "@/lib/access/types";
import { writeAuditLog } from "@/lib/audit/service";
import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import type { RequestContext } from "@/lib/core/http/context";
import { ConflictError, NotFoundError } from "@/lib/core/http/errors";
import type {
  DepartmentDto,
  DepartmentInput,
  DepartmentUpdateInput,
} from "@/lib/departments/types";
type Executor = Pick<Pool | PoolClient, "query">;
type Row = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  is_active: boolean;
  version: number;
  created_at: Date;
  updated_at: Date;
};
function map(r: Row): DepartmentDto {
  return {
    id: r.id,
    organizationId: r.organization_id,
    code: r.code,
    name: r.name,
    isActive: r.is_active,
    version: r.version,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}
function permission(c: AccessContext, p: string) {
  if (!c.permissions.includes(p)) throw new AuthorizationError();
}
function duplicate(e: unknown): never {
  if ((e as { code?: string }).code === "23505")
    throw new ConflictError("CONFLICT", "The department code already exists.");
  throw e;
}
export async function listDepartments(c: AccessContext) {
  permission(c, "admin.facilities.read");
  const r = await dbPool.query<Row>(
    `SELECT * FROM public.departments WHERE organization_id=$1 ORDER BY code`,
    [c.organization.id],
  );
  return r.rows.map(map);
}
export async function getDepartment(
  c: AccessContext,
  id: string,
  executor: Executor = dbPool,
) {
  permission(c, "admin.facilities.read");
  const r = await executor.query<Row>(
    `SELECT * FROM public.departments WHERE id=$1 AND organization_id=$2`,
    [id, c.organization.id],
  );
  if (!r.rows[0]) throw new NotFoundError("Department");
  return map(r.rows[0]);
}
export async function createDepartment(
  c: AccessContext,
  rc: RequestContext,
  input: DepartmentInput,
) {
  permission(c, "admin.facilities.manage");
  try {
    return await withTransaction(async (client) => {
      const r = await client.query<Row>(
        `INSERT INTO public.departments(organization_id,code,name,is_active,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$5) RETURNING *`,
        [c.organization.id, input.code, input.name, input.isActive, c.user.id],
      );
      const dto = map(r.rows[0]);
      await writeAuditLog(client, {
        organizationId: c.organization.id,
        requestId: rc.requestId,
        actorUserId: c.user.id,
        action: "department.created",
        entityType: "department",
        entityId: dto.id,
        newData: dto,
        ipAddress: rc.ipAddress,
        userAgent: rc.userAgent,
      });
      return dto;
    });
  } catch (e) {
    return duplicate(e);
  }
}
export async function updateDepartment(
  c: AccessContext,
  rc: RequestContext,
  id: string,
  input: DepartmentUpdateInput,
) {
  permission(c, "admin.facilities.manage");
  try {
    return await withTransaction(async (client) => {
      const before = await getDepartment(c, id, client);
      const m = { ...before, ...input };
      const r = await client.query<Row>(
        `UPDATE public.departments SET code=$3,name=$4,is_active=$5,version=version+1,updated_by=$6 WHERE id=$1 AND organization_id=$2 AND version=$7 RETURNING *`,
        [
          id,
          c.organization.id,
          m.code,
          m.name,
          m.isActive,
          c.user.id,
          input.version,
        ],
      );
      if (!r.rows[0])
        throw new ConflictError(
          "VERSION_CONFLICT",
          "The department was updated by another request.",
        );
      const dto = map(r.rows[0]);
      await writeAuditLog(client, {
        organizationId: c.organization.id,
        requestId: rc.requestId,
        actorUserId: c.user.id,
        action: "department.updated",
        entityType: "department",
        entityId: id,
        oldData: before,
        newData: dto,
        ipAddress: rc.ipAddress,
        userAgent: rc.userAgent,
      });
      return dto;
    });
  } catch (e) {
    return duplicate(e);
  }
}
