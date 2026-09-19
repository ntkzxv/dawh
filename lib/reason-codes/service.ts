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
  ReasonCodeDto,
  ReasonCodeInput,
  ReasonCodeUpdateInput,
} from "@/lib/reason-codes/types";
type Ex = Pick<Pool | PoolClient, "query">;
type Row = {
  id: string;
  organization_id: string;
  domain: string;
  code: string;
  name: string;
  description: string | null;
  requires_note: boolean;
  requires_attachment: boolean;
  is_active: boolean;
  version: number;
  created_at: Date;
  updated_at: Date;
};
const map = (r: Row): ReasonCodeDto => ({
  id: r.id,
  organizationId: r.organization_id,
  domain: r.domain,
  code: r.code,
  name: r.name,
  description: r.description,
  requiresNote: r.requires_note,
  requiresAttachment: r.requires_attachment,
  isActive: r.is_active,
  version: r.version,
  createdAt: r.created_at.toISOString(),
  updatedAt: r.updated_at.toISOString(),
});
function allow(c: AccessContext, p: string) {
  if (!c.permissions.includes(p)) throw new AuthorizationError();
}
function dup(e: unknown): never {
  if ((e as { code?: string }).code === "23505")
    throw new ConflictError(
      "CONFLICT",
      "The reason code already exists in this domain.",
    );
  throw e;
}
export async function listReasonCodes(c: AccessContext) {
  allow(c, "admin.products.read");
  return (
    await dbPool.query<Row>(
      `SELECT * FROM public.reason_codes WHERE organization_id=$1 ORDER BY domain,code`,
      [c.organization.id],
    )
  ).rows.map(map);
}
export async function getReasonCode(
  c: AccessContext,
  id: string,
  x: Ex = dbPool,
) {
  allow(c, "admin.products.read");
  const r = await x.query<Row>(
    `SELECT * FROM public.reason_codes WHERE id=$1 AND organization_id=$2`,
    [id, c.organization.id],
  );
  if (!r.rows[0]) throw new NotFoundError("Reason code");
  return map(r.rows[0]);
}
export async function createReasonCode(
  c: AccessContext,
  rc: RequestContext,
  i: ReasonCodeInput,
) {
  allow(c, "admin.reason_codes.manage");
  try {
    return await withTransaction(async (x) => {
      const dto = map(
        (
          await x.query<Row>(
            `INSERT INTO public.reason_codes(organization_id,domain,code,name,description,requires_note,requires_attachment,is_active,created_by,updated_by)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)RETURNING *`,
            [
              c.organization.id,
              i.domain,
              i.code,
              i.name,
              i.description,
              i.requiresNote,
              i.requiresAttachment,
              i.isActive,
              c.user.id,
            ],
          )
        ).rows[0],
      );
      await writeAuditLog(x, {
        organizationId: c.organization.id,
        requestId: rc.requestId,
        actorUserId: c.user.id,
        action: "reason_code.created",
        entityType: "reason_code",
        entityId: dto.id,
        newData: dto,
        ipAddress: rc.ipAddress,
        userAgent: rc.userAgent,
      });
      return dto;
    });
  } catch (e) {
    return dup(e);
  }
}
export async function updateReasonCode(
  c: AccessContext,
  rc: RequestContext,
  id: string,
  i: ReasonCodeUpdateInput,
) {
  allow(c, "admin.reason_codes.manage");
  try {
    return await withTransaction(async (x) => {
      const old = await getReasonCode(c, id, x),
        m = { ...old, ...i };
      const r = await x.query<Row>(
        `UPDATE public.reason_codes SET domain=$3,code=$4,name=$5,description=$6,requires_note=$7,requires_attachment=$8,is_active=$9,version=version+1,updated_by=$10 WHERE id=$1 AND organization_id=$2 AND version=$11 RETURNING *`,
        [
          id,
          c.organization.id,
          m.domain,
          m.code,
          m.name,
          m.description,
          m.requiresNote,
          m.requiresAttachment,
          m.isActive,
          c.user.id,
          i.version,
        ],
      );
      if (!r.rows[0])
        throw new ConflictError(
          "VERSION_CONFLICT",
          "The reason code was updated by another request.",
        );
      const dto = map(r.rows[0]);
      await writeAuditLog(x, {
        organizationId: c.organization.id,
        requestId: rc.requestId,
        actorUserId: c.user.id,
        action: "reason_code.updated",
        entityType: "reason_code",
        entityId: id,
        oldData: old,
        newData: dto,
        ipAddress: rc.ipAddress,
        userAgent: rc.userAgent,
      });
      return dto;
    });
  } catch (e) {
    return dup(e);
  }
}
