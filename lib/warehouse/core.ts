// Shared imports for warehouse route handlers and services.
export { getActor, requireRole, canUseBranch, requireBranch } from "@/lib/warehouse/access";
export type { Actor, Role } from "@/lib/warehouse/access";
export { audit, recordRevision } from "@/lib/warehouse/audit";
export {
  id,
  text,
  optionalText,
  quantity,
  money,
  date,
  optionalDate,
  optionalMoney,
  optionalCount,
  idempotencyKey,
} from "@/lib/warehouse/validation";
