# P0 Frontend Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver stable onboarding, authorization administration, master-data, product, and stock-read backend contracts so frontend development can proceed against real APIs and deterministic development data.

**Architecture:** Keep the existing Next.js 16 modular monolith and `pg` data-access model. Add one standalone transactional SQL patch outside migration history, then implement thin Route Handlers over domain services with application-owned permission/facility enforcement, common JSON envelopes, and audit writes for every mutation.

**Tech Stack:** Next.js 16.3.5 App Router, TypeScript strict mode, Better Auth 1.7.5, node-postgres 8.23, Supabase PostgreSQL, custom validation without Zod/ORM.

**Spec:** `docs/superpowers/specs/2026-09-19-p0-frontend-handoff-design.md`

## Global Constraints

- Implement only approved P0 items 2 through 7.
- Do not modify migration history or the three untracked baseline migration files.
- Do not add automated tests or a test framework; use the explicit manual/static verification steps in this plan.
- Do not modify frontend code, UX, UI, CSS, `DESIGN.md`, or client-side data adapters.
- Do not add `/api/v1`; every new business route stays directly under `/api`.
- Better Auth owns authentication and session only; do not edit Better Auth tables outside Better Auth behavior.
- Do not enable Resend, email verification, storage, PIN, or email/password UI work.
- Do not implement operational WMS commands or tables: receiving, putaway, movement, adjustment, count, transfer, reservation, picking, packing, shipment, receipt, claim, notification, reporting, or export.
- Use `pg` through `lib/core/db/pool.ts`; add no ORM, Kysely, Prisma, or Zod.
- Browser code never accesses Supabase business tables directly.
- WMS `bigint` IDs and numeric quantities remain strings in TypeScript/JSON.
- New SQL schema changes belong only in `supabase/sql/p0_frontend_handoff.sql`, not `supabase/migrations/`.
- Development data belongs only in `supabase/seeds/development_p0.sql`.

## Review Focus

1. **Legacy profile with an unknown branch code:** the SQL patch must leave `facility_id` null and the API must treat the profile as incomplete instead of silently assigning HQ; verify in Task 2.
2. **Last system administrator protection:** self-suspension, last-admin suspension, and last-admin role revocation must return `409 CONFLICT`; verify in Tasks 5 and 6.
3. **Cross-organization or out-of-scope bigint IDs:** every read/mutation must return `404 NOT_FOUND` or `403 FORBIDDEN_FACILITY_SCOPE` without exposing another facility's data; verify in Tasks 7–10.
4. **Development seed replay:** a second execution must leave master counts, ledger totals, and balance totals unchanged; verify in Task 11.
5. **Large IDs and decimal quantities:** IDs such as `9223372036854775807` and values such as `123456789012.123456` must not pass through JavaScript `number`; verify in Tasks 3 and 10.

---

### Task 1: Read the Next.js 16 Route Handler Contract and Freeze the File Map

**Files:**
- Read: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- Read: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`
- Read: `docs/superpowers/specs/2026-09-19-p0-frontend-handoff-design.md`
- Read: `schema.md`

**Interfaces:**
- Consumes: repository-local Next.js 16 documentation required by `AGENTS.md`.
- Produces: no files; confirms that all later route signatures and dynamic `params` handling match the installed framework.

- [ ] **Step 1: Read the installed Route Handler guide completely**

```bash
cat node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
```

- [ ] **Step 2: Read the installed dynamic-route guide completely**

```bash
cat node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md
```

- [ ] **Step 3: Record the implementation rule in the work log**

Dynamic route handlers must use the exact `params` shape documented by the installed Next.js version. Do not copy older synchronous `params` examples from memory.

- [ ] **Step 4: Confirm the worktree has no unexpected edits before implementation**

```bash
git status --short
```

Expected: only the user's pre-existing untracked `.env.example`, `scripts/`, and three baseline migration files appear. Do not stage or edit them unless a later task names the exact file.

### Task 2: Add the Standalone P0 Database Patch

**Files:**
- Create: `supabase/sql/p0_frontend_handoff.sql`
- Modify: `.env.example`

**Interfaces:**
- Consumes: live bigint tables documented in `schema.md`; current role/permission codes.
- Produces: `departments`, `user_access_controls`, profile facility/department references, canonical roles, role grants, indexes, RLS/revokes, and `CURRENT_TERMS_VERSION` configuration.

- [ ] **Step 1: Add the server-owned terms version to the environment example**

Append under Better Auth configuration:

```dotenv
# Employee onboarding — server only.
CURRENT_TERMS_VERSION=2026-09-19
```

- [ ] **Step 2: Create the transactional schema patch header and lock**

Start `supabase/sql/p0_frontend_handoff.sql` with:

```sql
begin;

select pg_advisory_xact_lock(hashtext('dawh_p0_frontend_handoff'));

do $$
begin
  if (select count(*) from public.organizations where is_active) <> 1 then
    raise exception 'P0 patch requires exactly one active organization';
  end if;
end;
$$;
```

- [ ] **Step 3: Add departments and user access controls**

Use live bigint identities and Better Auth text user IDs:

```sql
create table if not exists public.departments (
  id bigint generated by default as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete restrict,
  code text not null check (btrim(code) <> ''),
  name text not null check (btrim(name) <> ''),
  is_active boolean not null default true,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  created_by text references public."user"(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by text references public."user"(id) on delete set null,
  unique (id, organization_id),
  unique (organization_id, code)
);

create table if not exists public.user_access_controls (
  user_id text primary key references public."user"(id) on delete cascade,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE','SUSPENDED','TERMINATED')),
  reason text,
  changed_at timestamptz not null default now(),
  changed_by text references public."user"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Add `set_updated_at` triggers, enable RLS, and revoke `anon`/`authenticated` privileges for both tables.

- [ ] **Step 4: Add and backfill profile references without guessing**

```sql
alter table public.employee_profiles
  add column if not exists facility_id bigint references public.facilities(id) on delete restrict,
  add column if not exists department_id bigint references public.departments(id) on delete set null;

alter table public.user_facility_scopes
  add column if not exists version integer not null default 1 check (version > 0);

update public.employee_profiles p
set facility_id = f.id
from public.facilities f
join public.organizations o on o.id = f.organization_id
where p.facility_id is null
  and o.is_active
  and f.is_active
  and f.code = p.branch_code;

create index if not exists employee_profiles_facility_id_idx
  on public.employee_profiles(facility_id);
create index if not exists employee_profiles_department_id_idx
  on public.employee_profiles(department_id);
```

Do not default unmatched rows to `HQ-01`.

- [ ] **Step 5: Seed canonical roles and replace their permission mappings**

Insert/update the nine role codes from the approved spec using identity-generated IDs. Build a `role_grants(role_code, permission_code)` CTE containing the complete matrix below, delete mappings only for these nine canonical roles, then insert the desired mappings:

```text
SYSTEM_ADMINISTRATOR: every active permission
HQ_AREA_MANAGER: admin.facilities.read, admin.products.read, product.read,
  stock.read, stock.ledger.read, transfer.read, transfer.create,
  transfer.approve, shipment.read, shipment.manage, receipt.read, claim.read,
  claim.manage, report.read, notification.read
WAREHOUSE_MANAGER: product.read, stock.read, stock.ledger.read, stock.receive,
  stock.putaway, stock.move, stock.adjust.request, stock.adjust.approve,
  stock.count, transfer.read, transfer.create, transfer.approve,
  transfer.dispatch, pick.read, pick.operate, pack.read, pack.operate,
  shipment.read, shipment.manage, report.read, notification.read
STOCK_CONTROLLER: product.read, stock.read, stock.ledger.read, stock.receive,
  stock.putaway, stock.move, stock.adjust.request, stock.count,
  transfer.read, notification.read
PICKER_PACKER: product.read, stock.read, transfer.read, pick.read,
  pick.operate, pack.read, pack.operate, shipment.read, notification.read
BRANCH_REQUESTER: product.read, stock.read, transfer.read, transfer.create,
  notification.read
BRANCH_RECEIVER: product.read, stock.read, transfer.read, transfer.receive,
  receipt.read, receipt.manage, claim.read, claim.manage, notification.read
CLAIM_OFFICER: product.read, stock.read, transfer.read, shipment.read,
  receipt.read, claim.read, claim.manage, report.read, notification.read
AUDITOR: product.read, stock.read, stock.ledger.read, transfer.read,
  shipment.read, receipt.read, claim.read, report.read, audit.read
```

Map assigned legacy roles before deactivation:

```text
WAREHOUSE_ADMINISTRATOR -> HQ_AREA_MANAGER
WAREHOUSE_STAFF -> STOCK_CONTROLLER
BRANCH_ADMINISTRATOR -> BRANCH_REQUESTER
BRANCH_MANAGER -> BRANCH_REQUESTER
BRANCH_STAFF -> BRANCH_RECEIVER
DRIVER -> no automatic replacement; keep active when assigned
```

Insert replacement assignments with the same validity window and assignment actor. Deactivate only legacy roles that have no active assignment after mapping. Never delete a role or assignment.

- [ ] **Step 6: Complete the patch and statically inspect it**

End the file with:

```sql
commit;
```

Then run:

```bash
rg -n "uuid|gen_random_uuid|drop table|truncate|delete from public\.\"user\"" supabase/sql/p0_frontend_handoff.sql
```

Expected: no UUID generation and no destructive identity-table operation. The only permitted `delete` is replacement of `role_permissions` for the nine canonical roles.

- [ ] **Step 7: Apply the patch to the connected database**

Run the file through `pg` using `.env`; the script itself owns the transaction:

```bash
node --env-file=.env -e 'const fs=require("node:fs");const pg=require("pg");(async()=>{const raw=process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]+/,"");const c=new pg.Client({connectionString:raw,ssl:{rejectUnauthorized:false}});await c.connect();await c.query(fs.readFileSync("supabase/sql/p0_frontend_handoff.sql","utf8"));await c.end()})().catch(e=>{console.error(e);process.exit(1)})'
```

Expected: exit code 0.

- [ ] **Step 8: Verify the patch with catalog queries**

Run a read-only query proving:

```sql
select table_name from information_schema.tables
where table_schema='public'
  and table_name in ('departments','user_access_controls');

select column_name, data_type
from information_schema.columns
where table_schema='public'
  and table_name='employee_profiles'
  and column_name in ('facility_id','department_id');

select code, is_active from public.roles order by code;
```

Expected: two tables, two bigint profile columns, and all nine canonical roles active.

- [ ] **Step 9: Commit the database patch only**

```bash
git add .env.example supabase/sql/p0_frontend_handoff.sql
git commit -m "feat(db): add p0 onboarding and access schema"
```

### Task 3: Standardize HTTP, Validation, Transactions, and Audit

**Files:**
- Create: `lib/core/db/transaction.ts`
- Create: `lib/core/http/body.ts`
- Create: `lib/core/http/context.ts`
- Create: `lib/core/validation/fields.ts`
- Create: `lib/audit/service.ts`
- Create: `lib/audit/types.ts`
- Modify: `lib/core/http/errors.ts`
- Modify: `lib/core/http/response.ts`
- Modify: `lib/access/types.ts`
- Modify: `lib/access/service.ts`

**Interfaces:**
- Produces: `withTransaction`, `parseJsonObject`, strict field readers, `RequestContext`, `writeAuditLog`, standard domain errors, account-status enforcement, and system-admin facility bypass.
- Consumed by: every mutation/read task below.

- [ ] **Step 1: Add transaction and request-context primitives**

```ts
export async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>
): Promise<T>;

export type RequestContext = {
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export function getRequestContext(request: Request): RequestContext;
```

`withTransaction` must check out one `pg` client, execute `BEGIN`, run `work`, execute `COMMIT`, roll back on error, and release in `finally`.

- [ ] **Step 2: Add strict JSON parsing and reusable field readers**

```ts
export async function parseJsonObject(request: Request): Promise<Record<string, unknown>>;
export function rejectUnknownFields(body: Record<string, unknown>, allowed: readonly string[]): void;
export function requiredText(body: Record<string, unknown>, key: string): string;
export function optionalText(body: Record<string, unknown>, key: string): string | null;
export function requiredBigIntId(body: Record<string, unknown>, key: string): string;
export function optionalBigIntId(body: Record<string, unknown>, key: string): string | null;
export function requiredInteger(body: Record<string, unknown>, key: string, min: number, max: number): number;
export function requiredBoolean(body: Record<string, unknown>, key: string): boolean;
```

Never coerce bigint IDs or decimal quantities with `Number()`.

- [ ] **Step 3: Add typed API errors**

```ts
export class NotFoundError extends ApiError {
  constructor(resource = "Resource");
}
export class ConflictError extends ApiError {
  constructor(code: "CONFLICT" | "VERSION_CONFLICT", message: string, details?: Record<string, unknown>);
}
export class AccountStatusError extends ApiError {
  constructor(status: "SUSPENDED" | "TERMINATED");
}
```

Keep the existing envelope produced by `jsonError`; profile routes will be migrated to it in Task 4.

- [ ] **Step 4: Add transactional audit writes**

```ts
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

export async function writeAuditLog(client: PoolClient, input: AuditInput): Promise<void>;
```

Insert into existing `audit_logs`; when `entityId` is present, validate it as a
bigint string before sending it to the bigint column. Better Auth user/profile
audits use `entityId: null` and include `targetUserId` inside the redacted
old/new JSON. Redact any keys matching `password`, `token`, `secret`,
`authorization`, `cookie`, or `databaseUrl` recursively before serialization.

- [ ] **Step 5: Add account status to access context and enforce it**

Extend `AccessContext`:

```ts
accountStatus: "ACTIVE" | "SUSPENDED" | "TERMINATED";
isSystemAdministrator: boolean;
```

`getAccessContext` left-joins `user_access_controls`, defaults missing rows to `ACTIVE`, and throws `AccountStatusError` for other statuses. Compute system administrator membership from active assignments; do not trust Better Auth metadata.

- [ ] **Step 6: Centralize facility authorization**

Add:

```ts
export function canAccessFacility(
  context: AccessContext,
  facilityId: string,
  requiredScope: FacilityScopeType
): boolean;

export function visibleFacilityIds(context: AccessContext): string[] | null;
```

`visibleFacilityIds` returns `null` for system administrators to mean unrestricted within the active organization; all other callers receive their scoped IDs.

- [ ] **Step 7: Run static verification**

```bash
npm run typecheck
npx eslint lib/core lib/access lib/audit
```

Expected: both commands exit 0.

- [ ] **Step 8: Commit the shared backend foundation**

```bash
git add lib/core lib/access lib/audit
git commit -m "refactor(backend): standardize p0 request and access handling"
```

### Task 4: Implement Onboarding Options and Canonical Profile APIs

**Files:**
- Create: `lib/onboarding/types.ts`
- Create: `lib/onboarding/service.ts`
- Create: `app/api/onboarding/options/route.ts`
- Modify: `lib/profiles/types.ts`
- Modify: `lib/profiles/validation.ts`
- Modify: `lib/profiles/service.ts`
- Modify: `app/api/profile/me/route.ts`
- Modify: `app/api/profile/me/complete/route.ts`

**Interfaces:**
- Consumes: `getAccessContext`, shared validation, common responses, current terms environment value.
- Produces: `GET /api/onboarding/options`, `GET/PATCH /api/profile/me`, and
  `PUT /api/profile/me/complete` contracts.

- [ ] **Step 1: Define onboarding option types and fixed values**

```ts
export type OnboardingOptions = {
  termsVersion: string;
  facilities: Array<{ id: string; code: string; name: string; facilityType: "CENTRAL_WAREHOUSE" | "BRANCH" }>;
  departments: Array<{ id: string; code: string; name: string }>;
  prefixes: string[];
  genders: string[];
  bloodTypes: string[];
  maritalStatuses: string[];
  religions: string[];
  educationLevels: string[];
  nationalities: string[];
  emergencyRelationships: string[];
};
```

Use explicit constants in `lib/onboarding/service.ts`; only facilities and departments come from DB.

- [ ] **Step 2: Implement the session-only onboarding query**

```ts
export async function getOnboardingOptions(request: Request): Promise<OnboardingOptions>;
```

Require a valid active session/account but do not require profile completion or facility scope. Query only active facilities and departments in the single active organization.

- [ ] **Step 3: Replace profile transport types with camelCase DTOs**

Define:

```ts
export type CompleteEmployeeProfileInput = {
  username: string;
  prefix: string;
  firstNameTh: string;
  lastNameTh: string;
  nicknameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  nicknameEn: string;
  citizenId: string;
  birthDate: string;
  gender: string;
  bloodType: string;
  maritalStatus: string;
  nationality: string;
  religion: string;
  educationLevel: string;
  majorSubject: string;
  universityNameTh: string;
  universityNameEn: string;
  phone: string;
  emergencyContactNameTh: string;
  emergencyContactNameEn: string | null;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  currentAddress: AddressInput;
  registeredAddress: AddressInput;
  departmentId: string | null;
  facilityId: string;
  termsAccepted: true;
};
```

The output DTO uses camelCase, includes derived `facility` and `department`, and never exposes raw DB column names.

- [ ] **Step 4: Implement strict profile validation**

Validation must:

```text
reject unknown top-level/address fields
require birthDate and verify a real non-future YYYY-MM-DD date
verify Thai citizen ID with checksum
require 5-digit postal codes
validate phone without converting it to a number
require termsAccepted === true
require valid bigint facilityId and optional departmentId
```

Thai citizen-ID checksum algorithm:

```ts
const digits = citizenId.split("").map(Number);
const sum = digits.slice(0, 12).reduce((total, digit, index) => total + digit * (13 - index), 0);
const checkDigit = (11 - (sum % 11)) % 10;
if (checkDigit !== digits[12]) invalid.push("citizenId");
```

- [ ] **Step 5: Implement profile completion as one transaction**

```ts
export async function completeEmployeeProfile(
  context: AccessContext,
  requestContext: RequestContext,
  input: CompleteEmployeeProfileInput
): Promise<EmployeeProfileDto>;
```

Inside the transaction:

1. Resolve active facility in `context.organization.id`.
2. Resolve optional active department in the same organization.
3. Read `CURRENT_TERMS_VERSION`; fail startup/request with `503` if absent.
4. Upsert the profile with DB snake_case columns.
5. Derive `branch_name`, `branch_code`, and `department` from DB rows.
6. Set `terms_version`, `terms_accepted_at`, and `profile_completed_at` server-side.
7. Insert `profile.completed` audit data with citizen ID redacted.

- [ ] **Step 6: Implement restricted self-profile updates**

```ts
export type UpdateEmployeeProfileInput = Pick<CompleteEmployeeProfileInput,
  "prefix" | "nicknameTh" | "nicknameEn" | "nationality" | "religion" |
  "educationLevel" | "majorSubject" | "universityNameTh" | "universityNameEn" |
  "phone" | "emergencyContactNameTh" | "emergencyContactNameEn" |
  "emergencyContactRelationship" | "emergencyContactPhone" |
  "currentAddress" | "registeredAddress"
>;
```

Do not accept username, citizen ID, birth date, facility, department, role, scope, terms, or account status in PATCH.

- [ ] **Step 7: Convert profile routes to the shared route wrapper**

Use `apiRoute`, `parseJsonObject`, `jsonOk`, and standard errors for `GET`, `PUT`, and `PATCH`. Remove route-local `try/catch` and string-only errors.

- [ ] **Step 8: Verify onboarding/profile behavior manually**

With the development server running, verify:

```bash
curl -i http://localhost:3000/api/onboarding/options
curl -i http://localhost:3000/api/profile/me
```

Expected without a session: `401` standard error envelope. In an authenticated browser, options must load for an incomplete profile. Submit missing/invalid birth date, citizen ID, inactive facility, and `termsAccepted:false`; each must return `400 VALIDATION_ERROR` without writing completion.

- [ ] **Step 9: Run static verification and commit**

```bash
npm run typecheck
npx eslint app/api/onboarding app/api/profile lib/onboarding lib/profiles
git add app/api/onboarding app/api/profile lib/onboarding lib/profiles
git commit -m "feat(profile): stabilize onboarding and profile contracts"
```

### Task 5: Implement Admin User Directory and Account Status

**Files:**
- Create: `lib/admin/users/types.ts`
- Create: `lib/admin/users/validation.ts`
- Create: `lib/admin/users/service.ts`
- Create: `app/api/admin/users/route.ts`
- Create: `app/api/admin/users/[userId]/route.ts`
- Create: `app/api/admin/users/[userId]/status/route.ts`

**Interfaces:**
- Consumes: `requireAccess`, `withTransaction`, `writeAuditLog`, common pagination and response helpers.
- Produces: user directory/detail/status APIs and last-admin protection helper.

- [ ] **Step 1: Define the user administration DTOs**

```ts
export type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  accountStatus: "ACTIVE" | "SUSPENDED" | "TERMINATED";
  profileComplete: boolean;
  username: string | null;
  facility: { id: string; code: string; name: string } | null;
  department: { id: string; code: string; name: string } | null;
  roles: Array<{ assignmentId: string; code: string; name: string; validFrom: string | null; validUntil: string | null }>;
  facilityScopes: Array<{ id: string; facilityId: string; facilityCode: string; scopeType: FacilityScopeType; validFrom: string | null; validUntil: string | null }>;
  createdAt: string;
};
```

- [ ] **Step 2: Implement scoped list and detail queries**

```ts
export async function listAdminUsers(context: AccessContext, page: PageRequest, filters: UserFilters): Promise<AdminUserSummary[]>;
export async function getAdminUser(context: AccessContext, userId: string): Promise<AdminUserSummary>;
```

Require `admin.users.read`. System administrators may read all users in the active organization. Other future admin readers must only see users whose active facility scopes intersect their own; do not expose account/session token columns.

- [ ] **Step 3: Implement account-status validation and mutation**

```ts
export type ChangeAccountStatusInput = {
  status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
  reason: string;
};

export async function changeAccountStatus(
  context: AccessContext,
  requestContext: RequestContext,
  userId: string,
  input: ChangeAccountStatusInput
): Promise<AdminUserSummary>;
```

Require `admin.users.manage`, reject self-targeting, lock the target control row, and reject suspending/terminating the last active `SYSTEM_ADMINISTRATOR`. Upsert `user_access_controls` and write an audit row in one transaction.

- [ ] **Step 4: Add list/detail/status route handlers**

Use cursor pagination for users ordered by Better Auth `createdAt DESC, id DESC`. Support `search`, `status`, `roleCode`, `facilityId`, and `profileComplete` filters. Validate `facilityId` as a bigint string.

- [ ] **Step 5: Manually verify last-admin safety**

Call the status endpoint for the current system administrator. Expected: `409 CONFLICT`. Create or identify a non-admin user and suspend/reactivate them; expected subsequent `/api/me` response while suspended: `403 ACCOUNT_SUSPENDED`.

- [ ] **Step 6: Run static verification and commit**

```bash
npm run typecheck
npx eslint app/api/admin/users lib/admin/users
git add app/api/admin/users lib/admin/users
git commit -m "feat(admin): add user directory and access status"
```

### Task 6: Implement Role Assignment and Facility Scope Administration

**Files:**
- Create: `lib/admin/roles/types.ts`
- Create: `lib/admin/roles/validation.ts`
- Create: `lib/admin/roles/service.ts`
- Create: `lib/admin/scopes/types.ts`
- Create: `lib/admin/scopes/validation.ts`
- Create: `lib/admin/scopes/service.ts`
- Create: `app/api/admin/roles/route.ts`
- Create: `app/api/admin/permissions/route.ts`
- Create: `app/api/admin/users/[userId]/role-assignments/route.ts`
- Create: `app/api/admin/users/[userId]/role-assignments/[assignmentId]/revoke/route.ts`
- Create: `app/api/admin/users/[userId]/facility-scopes/route.ts`
- Create: `app/api/admin/users/[userId]/facility-scopes/[scopeId]/route.ts`
- Create: `app/api/admin/users/[userId]/facility-scopes/[scopeId]/revoke/route.ts`

**Interfaces:**
- Produces: canonical role/permission catalogs, auditable role assignments, and facility-scope assignment/update/revocation.

- [ ] **Step 1: Implement role and permission catalogs**

```ts
export async function listRoles(context: AccessContext): Promise<RoleDto[]>;
export async function listPermissions(context: AccessContext): Promise<PermissionDto[]>;
```

Require `admin.roles.read`. Return active canonical roles, their active permissions, and version metadata. Do not expose inactive legacy roles by default.

- [ ] **Step 2: Implement role assignment**

```ts
export type AssignRoleInput = {
  roleId: string;
  validFrom: string | null;
  validUntil: string | null;
};

export async function assignRole(
  context: AccessContext,
  requestContext: RequestContext,
  userId: string,
  input: AssignRoleInput
): Promise<RoleAssignmentDto>;
```

Require `admin.roles.manage`; validate active canonical role, user existence, and ordered validity dates. Reject duplicate active assignments with `409 CONFLICT`. Write assignment and audit atomically.

- [ ] **Step 3: Implement role revocation with last-admin protection**

```ts
export async function revokeRole(
  context: AccessContext,
  requestContext: RequestContext,
  userId: string,
  assignmentId: string,
  reason: string
): Promise<RoleAssignmentDto>;
```

Lock the assignment. Reject self-revocation of `SYSTEM_ADMINISTRATOR` and reject removing the last active non-suspended system administrator. Set revocation columns; never delete history.

- [ ] **Step 4: Implement facility scope create/update/revoke**

```ts
export type FacilityScopeInput = {
  facilityId: string;
  scopeType: "READ" | "OPERATE" | "APPROVE" | "ADMIN";
  validFrom: string | null;
  validUntil: string | null;
};
```

Require `admin.users.manage`; validate active same-organization facility. POST
creates a row, rejects an active duplicate, or reactivates an expired row while
incrementing its version. PATCH requires `version`, increments it, and returns
`409 VERSION_CONFLICT` when stale. Revoke sets `valid_until` to the current time,
increments version, and records audit history without deleting the row.

- [ ] **Step 5: Add thin route handlers and standard envelopes**

Every dynamic ID is validated before service invocation. Every mutation reads request context and passes it to the service for audit.

- [ ] **Step 6: Manually verify assignments and cross-facility protection**

Assign a non-admin canonical role and one facility scope to a test user, read `/api/me`, then revoke both and verify they disappear from active access. Attempt an out-of-organization or nonexistent facility ID and expect `404 NOT_FOUND`.

- [ ] **Step 7: Run static verification and commit**

```bash
npm run typecheck
npx eslint app/api/admin lib/admin
git add app/api/admin lib/admin
git commit -m "feat(admin): manage roles and facility scopes"
```

### Task 7: Implement Facility, Location, and Department Master Data

**Files:**
- Modify: `lib/facilities/types.ts`
- Create: `lib/facilities/validation.ts`
- Modify: `lib/facilities/service.ts`
- Modify: `app/api/facilities/route.ts`
- Create: `app/api/facilities/[facilityId]/route.ts`
- Create: `lib/locations/types.ts`
- Create: `lib/locations/validation.ts`
- Create: `lib/locations/service.ts`
- Create: `app/api/facilities/[facilityId]/locations/route.ts`
- Create: `app/api/locations/[locationId]/route.ts`
- Create: `lib/departments/types.ts`
- Create: `lib/departments/validation.ts`
- Create: `lib/departments/service.ts`
- Create: `app/api/departments/route.ts`
- Create: `app/api/departments/[departmentId]/route.ts`

**Interfaces:**
- Produces: facility/location/department list, detail, create, and versioned update contracts.

- [ ] **Step 1: Expand facility DTOs and filters**

Facility DTOs include code, name, type, address, coordinates as decimal strings, active state, version, and timestamps. List filters support `search`, `facilityType`, and `active`.

- [ ] **Step 2: Implement facility POST/PATCH transactions**

Require `admin.facilities.manage`. Codes are uppercase trimmed values matching `^[A-Z0-9][A-Z0-9_-]{1,31}$`. PATCH requires `version`, updates `version = version + 1`, and writes audit atomically.

- [ ] **Step 3: Implement location hierarchy rules**

```ts
export type LocationInput = {
  parentId: string | null;
  code: string;
  name: string;
  hierarchyType: "ZONE" | "AISLE" | "RACK" | "SHELF" | "BIN";
  locationType: "RECEIVING" | "STORAGE" | "PICKING" | "PACKING" | "DISPATCH" | "QUARANTINE" | "DAMAGED" | "RETURN" | "CLAIM_HOLDING";
  maxVolume: string | null;
  maxWeight: string | null;
  status: "ACTIVE" | "BLOCKED" | "MAINTENANCE";
  isActive: boolean;
};
```

Resolve the parent in the same facility. Compute `path` and `depth` server-side. Reject moving a node under itself or its descendants. Require visible facility scope for reads and `admin.facilities.manage` for mutations.

- [ ] **Step 4: Implement department CRUD**

Department create/update requires `admin.facilities.manage`, uses organization-scoped unique codes, optimistic versioning, soft deactivation, and audit writes.

- [ ] **Step 5: Manually verify scope and concurrency**

Verify a scoped user sees only their facilities/locations. Submit a stale version to each PATCH endpoint and expect `409 VERSION_CONFLICT`. Submit a parent from another facility and expect `404 NOT_FOUND`.

- [ ] **Step 6: Run static verification and commit**

```bash
npm run typecheck
npx eslint app/api/facilities app/api/locations app/api/departments lib/facilities lib/locations lib/departments
git add app/api/facilities app/api/locations app/api/departments lib/facilities lib/locations lib/departments
git commit -m "feat(master-data): manage facilities locations and departments"
```

### Task 8: Implement Product Reference Master Data

**Files:**
- Create: `lib/product-categories/types.ts`
- Create: `lib/product-categories/validation.ts`
- Create: `lib/product-categories/service.ts`
- Create: `lib/brands/types.ts`
- Create: `lib/brands/validation.ts`
- Create: `lib/brands/service.ts`
- Create: `lib/units-of-measure/types.ts`
- Create: `lib/units-of-measure/validation.ts`
- Create: `lib/units-of-measure/service.ts`
- Create: `lib/reason-codes/types.ts`
- Create: `lib/reason-codes/validation.ts`
- Create: `lib/reason-codes/service.ts`
- Create: `app/api/product-categories/route.ts`
- Create: `app/api/product-categories/[categoryId]/route.ts`
- Create: `app/api/brands/route.ts`
- Create: `app/api/brands/[brandId]/route.ts`
- Create: `app/api/units-of-measure/route.ts`
- Create: `app/api/units-of-measure/[unitId]/route.ts`
- Create: `app/api/reason-codes/route.ts`
- Create: `app/api/reason-codes/[reasonCodeId]/route.ts`

**Interfaces:**
- Produces: organization-scoped reference catalogs consumed by product routes and frontend forms.

- [ ] **Step 1: Implement one consistent reference-master service shape per domain**

Each service exports `list*`, `get*`, `create*`, and `update*`. Inputs use camelCase; SQL aliases outputs to camelCase or maps rows explicitly. Every update requires version and increments it.

- [ ] **Step 2: Enforce category hierarchy and same-organization references**

Category parent must be active, belong to the same organization, and not be the category itself or a descendant. Compute no materialized path because the existing table does not store one.

- [ ] **Step 3: Enforce UOM and reason-code constraints**

UOM `decimalScale` is an integer 0–6. Reason codes require a non-empty domain/code/name plus explicit `requiresNote`, `requiresAttachment`, and `isActive`. Codes/domains are uppercase and organization-scoped.

- [ ] **Step 4: Enforce permissions**

Reads require `admin.products.read` for categories/brands/UOM administration and the appropriate operational read where reused. Mutations require `admin.products.manage`; reason-code mutations require `admin.reason_codes.manage`.

- [ ] **Step 5: Add audit writes and standard routes**

All creates/updates execute data mutation and `writeAuditLog` in the same transaction. Unique violations map to `409 CONFLICT`; stale versions map to `409 VERSION_CONFLICT`.

- [ ] **Step 6: Run static/manual verification and commit**

```bash
npm run typecheck
npx eslint app/api/product-categories app/api/brands app/api/units-of-measure app/api/reason-codes lib/product-categories lib/brands lib/units-of-measure lib/reason-codes
git add app/api/product-categories app/api/brands app/api/units-of-measure app/api/reason-codes lib/product-categories lib/brands lib/units-of-measure lib/reason-codes
git commit -m "feat(master-data): add product reference APIs"
```

Manually verify duplicate codes return `409`, cross-organization parents return `404`, and stale versions return `409 VERSION_CONFLICT`.

### Task 9: Implement Product, Unit, Barcode, and Safety-Stock Administration

**Files:**
- Modify: `lib/products/types.ts`
- Create: `lib/products/validation.ts`
- Modify: `lib/products/service.ts`
- Modify: `app/api/products/route.ts`
- Create: `app/api/products/[productId]/route.ts`
- Create: `lib/product-units/types.ts`
- Create: `lib/product-units/validation.ts`
- Create: `lib/product-units/service.ts`
- Create: `lib/product-barcodes/types.ts`
- Create: `lib/product-barcodes/validation.ts`
- Create: `lib/product-barcodes/service.ts`
- Create: `lib/safety-stock/types.ts`
- Create: `lib/safety-stock/validation.ts`
- Create: `lib/safety-stock/service.ts`
- Create: `app/api/products/[productId]/units/route.ts`
- Create: `app/api/products/[productId]/units/[productUnitId]/route.ts`
- Create: `app/api/products/[productId]/barcodes/route.ts`
- Create: `app/api/products/[productId]/barcodes/[barcodeId]/route.ts`
- Create: `app/api/safety-stock-rules/route.ts`
- Create: `app/api/safety-stock-rules/[ruleId]/route.ts`

**Interfaces:**
- Produces: filterable product list/detail and product administration contracts used by stock reads and frontend catalog screens.

- [ ] **Step 1: Define the full product DTO and strict input**

Include organization ID, SKU, Thai/English names, description, category, brand, base unit, tracking/picking rules, dimensions, weight, cost/currency, shelf life, storage condition, active state, version, units, barcodes, and timestamps. Decimal values stay strings.

- [ ] **Step 2: Expand product list filters**

Support `search`, `categoryId`, `brandId`, `trackingMethod`, `active`, `limit`, and `cursor`. Search matches SKU and Thai/English names using `ILIKE` with escaped wildcard characters.

- [ ] **Step 3: Implement product POST/PATCH**

Require `admin.products.manage`. Resolve active category, brand, and base unit in
the active organization. Accept `FEFO` only when `trackingMethod` is `LOT` and
`shelfLifeDays` is a positive integer. Require ISO uppercase three-letter
currency when cost is present. Use optimistic versioning and audit.

- [ ] **Step 4: Implement product-unit conversion administration**

`baseQuantity`, dimensions, and weight are positive decimal strings. Unit must belong to the organization. Product/unit uniqueness returns `409`. Deactivation is allowed; hard delete is not.

- [ ] **Step 5: Implement barcode administration**

Validate barcode type against the existing DB set. Enforce product-unit ownership. When setting a barcode primary, clear the previous primary for the product in the same transaction before setting the new row.

- [ ] **Step 6: Implement safety-stock administration**

Require `admin.products.manage`; validate visible active facility and active product in the organization. All quantities are non-negative decimal strings. Enforce logical ordering where supplied:

```text
minimumQuantity <= reorderPoint <= maximumQuantity
safetyQuantity <= maximumQuantity
```

- [ ] **Step 7: Run static/manual verification and commit**

```bash
npm run typecheck
npx eslint app/api/products app/api/safety-stock-rules lib/products lib/product-units lib/product-barcodes lib/safety-stock
git add app/api/products app/api/safety-stock-rules lib/products lib/product-units lib/product-barcodes lib/safety-stock
git commit -m "feat(products): add catalog administration APIs"
```

Verify a product cannot reference another organization's category/unit, only one primary barcode remains, decimal strings round-trip unchanged, and stale versions fail.

### Task 10: Expand Stock Balance, Ledger, and Network Read Models

**Files:**
- Modify: `lib/stock/types.ts`
- Create: `lib/stock/validation.ts`
- Modify: `lib/stock/service.ts`
- Modify: `app/api/stock/balances/route.ts`
- Create: `app/api/stock/ledger/route.ts`
- Create: `app/api/stock/network/route.ts`

**Interfaces:**
- Consumes: canonical product/facility DTO identifiers and `visibleFacilityIds`.
- Produces: scoped balance, ledger, and network-stock read contracts; no stock writes.

- [ ] **Step 1: Define read filters and DTOs**

```ts
export type StockBalanceFilters = {
  facilityId?: string;
  locationId?: string;
  productId?: string;
  stockStatus?: string;
  lotId?: string;
  serialId?: string;
  search?: string;
};

export type StockLedgerFilters = {
  facilityId?: string;
  productId?: string;
  locationId?: string;
  transactionType?: string;
  referenceType?: string;
  referenceId?: string;
  postedFrom?: string;
  postedTo?: string;
};
```

Every bigint identifier remains a validated string.

- [ ] **Step 2: Expand stock balance joins**

Join facilities, locations, products, categories, brands, UOM, lots, serials, and safety-stock rules. Return quantities and balance version as strings. Calculate:

```text
availableQuantity = AVAILABLE balance quantity for the row/grain
availableToTransfer = max(availableQuantity - safetyQuantity, 0)
```

Do not sum mutually exclusive stock statuses as available.

- [ ] **Step 3: Implement ledger reads**

Join immutable transaction headers and lines, enforce `stock.ledger.read`, filter to authorized facilities, and keyset paginate by `posted_at DESC, line.id DESC`. Return before/delta/after as decimal strings.

- [ ] **Step 4: Implement network stock aggregation**

Require `stock.read`. Group by product and authorized facility. Return physical on-hand, available, safety quantity, available-to-transfer, and in-transit as decimal strings. System administrators may query all active facilities in the active organization; other users are restricted to scopes.

- [ ] **Step 5: Verify cross-scope and numeric behavior**

Use a scoped non-admin user and request another facility explicitly. Expected: `403 FORBIDDEN_FACILITY_SCOPE` or `404 NOT_FOUND` according to route disclosure. Query the largest seeded decimal and verify the JSON value is a string with six-decimal precision.

- [ ] **Step 6: Run static verification and commit**

```bash
npm run typecheck
npx eslint app/api/stock lib/stock
git add app/api/stock lib/stock
git commit -m "feat(stock): add scoped balance ledger and network reads"
```

### Task 11: Add Rerunnable Development Master and Opening-Stock Seed

**Files:**
- Create: `supabase/seeds/development_p0.sql`

**Interfaces:**
- Consumes: P0 SQL patch and existing WMS foundation tables.
- Produces: deterministic development facilities, locations, departments, products, lot/serial data, safety rules, opening ledger, and matching balances.

- [ ] **Step 1: Start a transactional idempotent seed**

```sql
begin;
select pg_advisory_xact_lock(hashtext('dawh_development_p0_seed'));
```

Resolve the active `HORIZON` organization, existing UOM IDs, and one active
non-suspended `SYSTEM_ADMINISTRATOR` through CTEs/subqueries; never hardcode
identity IDs. Raise a clear exception before inserting opening stock if no such
administrator exists, because `inventory_transactions.posted_by` is mandatory.

- [ ] **Step 2: Seed facilities, departments, categories, and brands by natural key**

Use `ON CONFLICT` against existing unique natural keys for:

```text
Facilities: BKK-01, CNX-01
Departments: IT, WH, OPS, FIN, HR
Categories: ELECTRONICS, FOOD, OFFICE
Brands: DAWH, HORIZON, GENERIC
```

Create the nine functional top-level locations per new facility using natural facility code + location code.

- [ ] **Step 3: Seed representative products and catalog relations**

Create at least:

```text
DEMO-NONE-001  tracking NONE, FIFO
DEMO-LOT-001   tracking LOT, FEFO, expiry lot
DEMO-SERIAL-001 tracking SERIAL, FIFO, unique serial records
```

Add alternate units, one primary barcode per product, and safety-stock rules for all three facilities.

- [ ] **Step 4: Seed opening stock as ledger plus balance projection**

Use deterministic transaction number `OPEN-DEV-P0-001`, transaction type
`ADJUST`, reference type `ORGANIZATION`, and the active organization ID as
`reference_id`. Use the resolved system administrator as `posted_by`. Insert the
transaction only if it does not exist, insert matching lines with positive
deltas, then insert/update the exact matching balance grains. For serial-tracked
products, each serial has quantity `1.000000` and only one positive balance row.

Validate before commit:

```sql
do $$
begin
  if exists (
    select 1
    from public.inventory_transaction_lines
    where quantity_before + quantity_delta <> quantity_after
  ) then
    raise exception 'Opening ledger arithmetic mismatch';
  end if;
end;
$$;

commit;
```

- [ ] **Step 5: Apply the seed twice**

```bash
node --env-file=.env -e 'const fs=require("node:fs");const pg=require("pg");(async()=>{const raw=process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]+/,"");const c=new pg.Client({connectionString:raw,ssl:{rejectUnauthorized:false}});await c.connect();const sql=fs.readFileSync("supabase/seeds/development_p0.sql","utf8");await c.query(sql);await c.query(sql);await c.end()})().catch(e=>{console.error(e);process.exit(1)})'
```

Expected: both executions exit 0.

- [ ] **Step 6: Verify replay and reconciliation**

Run queries proving:

```sql
select transaction_no, count(*)
from public.inventory_transactions
where transaction_no = 'OPEN-DEV-P0-001'
group by transaction_no;

select product_id, facility_id, sum(quantity_delta) ledger_quantity
from public.inventory_transaction_lines
where transaction_id = (
  select id from public.inventory_transactions where transaction_no='OPEN-DEV-P0-001'
)
group by product_id, facility_id;

select product_id, facility_id, sum(quantity) balance_quantity
from public.stock_balances
group by product_id, facility_id;
```

Expected: one opening transaction and matching ledger/balance quantities for the seeded grains after both runs.

- [ ] **Step 7: Commit the development seed**

```bash
git add supabase/seeds/development_p0.sql
git commit -m "chore(db): add p0 development seed"
```

### Task 12: Update Backend Contract Documentation

**Files:**
- Modify: `schema.md`
- Create: `docs/api/p0-frontend-handoff.md`

**Interfaces:**
- Produces: the database delta and FE-facing endpoint/payload/error/permission handoff documentation.

- [ ] **Step 1: Update the schema snapshot notes**

Document `departments`, `user_access_controls`, profile facility/department references, canonical roles, standalone patch path, and development seed path. Explicitly retain the warning that migration history is not repaired by this P0 work.

- [ ] **Step 2: Document every delivered API contract**

For each endpoint, record method/path, permission, query parameters, request JSON, success JSON, error codes, bigint/decimal-as-string rule, and one curl example. Include onboarding, profile, admin, facility/location/department, product master, and stock read routes.

- [ ] **Step 3: Document the FE integration order**

```text
1. Better Auth session
2. GET /api/me
3. If profileComplete=false, GET /api/onboarding/options
4. PUT /api/profile/me/complete
5. Render navigation from permissions and facilityScopes
6. Use admin/master/stock endpoints without direct Supabase access
```

- [ ] **Step 4: Check docs and commit**

```bash
rg -n "/api/v1|Supabase Auth" schema.md docs/api/p0-frontend-handoff.md
git diff --check -- schema.md docs/api/p0-frontend-handoff.md
git add schema.md docs/api/p0-frontend-handoff.md
git commit -m "docs: publish p0 backend contract"
```

Expected: no placeholders or `/api/v1`; any mention of Supabase Auth explicitly states it is unused by DAWH authentication.

### Task 13: Final P0 Verification and Scope Audit

**Files:**
- Verify only; do not create automated tests.

**Interfaces:**
- Consumes: every preceding task.
- Produces: evidence that the approved P0 slice is complete without out-of-scope changes.

- [ ] **Step 1: Run TypeScript and backend-scoped lint**

```bash
npm run typecheck
npx eslint app/api lib scripts proxy.ts
```

Expected: both commands exit 0.

- [ ] **Step 2: Run the production build in an environment that permits Turbopack subprocesses**

```bash
npm run build
```

Expected: exit 0. If the sandbox blocks port binding with `Operation not permitted`, record it as an environment limitation and do not treat it as an application failure.

- [ ] **Step 3: Verify database security posture for new tables**

Run read-only catalog queries confirming:

```text
RLS enabled on departments and user_access_controls
anon has no privileges
authenticated has no privileges
all new foreign keys have supporting indexes
no SECURITY DEFINER function was added
```

- [ ] **Step 4: Exercise the primary handoff flow manually**

```text
register/sign in through Better Auth
read onboarding options while profile is incomplete
complete the profile with a real facility
bootstrap or use a system administrator
list users and canonical roles
assign a role and facility scope to another user
create/update a department and product reference row
list seeded products
read seeded balance, ledger, and network stock
suspend the secondary user and verify WMS access is blocked
reactivate the secondary user
```

Every business response must contain a consistent envelope and request ID.

- [ ] **Step 5: Audit git scope**

```bash
git status --short
git diff --stat be1ec77..HEAD
git diff --name-only be1ec77..HEAD
```

Expected: no frontend component/page/style file, `DESIGN.md`, baseline migration, automated test, Resend enablement, or operational WMS route/table was changed.

- [ ] **Step 6: Review secrets and generated artifacts**

```bash
git diff --cached --check
git status --short
```

Confirm no `.env`, credentials, session tokens, database passwords, Resend keys, or generated `.next` artifacts are staged.

- [ ] **Step 7: Commit any verification-only documentation correction**

Only if Task 13 found a documentation mismatch:

```bash
git add schema.md docs/api/p0-frontend-handoff.md
git commit -m "docs: align p0 verification notes"
```

Do not create an empty commit.
