# P0 Frontend Handoff Backend Design

> Status: Ready for review
>
> Date: 2026-09-19
>
> Source of truth: `DESIGN.md`, the connected Supabase schema, and the user's
> approved P0 scope.

## 1. Goal

Prepare a stable backend and database contract that lets the frontend team build
onboarding, administration, master-data, product, and stock-read screens without
depending on mock data or unstable authorization rules.

The implementation remains a modular monolith using Next.js Route Handlers,
Better Auth for identity/session only, `pg` for server-side PostgreSQL access,
and application-owned role, permission, and facility-scope checks.

## 2. Scope Boundary

### 2.1 In scope

This work implements only the previously identified P0 items 2 through 7:

1. Correct and stabilize onboarding/profile contracts.
2. Reconcile and freeze the role/permission model.
3. Add administration APIs for users, roles, and facility scopes.
4. Add master-data APIs for facilities, locations, departments, product catalog,
   safety stock, and reason codes.
5. Expand product and stock read APIs for real frontend screens.
6. Add deterministic development seed data for catalog and opening stock.

### 2.2 Explicitly out of scope

- Migration baseline repair, migration-history reconciliation, or changes to the
  three existing untracked baseline migrations.
- Automated test files or a new test framework.
- Frontend code, UX, UI, `DESIGN.md`, or CSS changes.
- API version prefixes such as `/api/v1`.
- Receiving, putaway, movement, adjustment, count, transfer, reservation,
  picking, packing, shipment, receipt, claim, notification, reporting, or export
  workflows.
- Supabase Auth, direct browser access to business tables, ORM, Kysely, Prisma,
  or Zod.
- Enabling Resend or email verification.
- Storage, file upload, avatar, PIN, password-management UI, or email-change UI.
- Background workers, cron jobs, queues, or realtime subscriptions.

No unrelated cleanup or refactor is allowed. Existing frontend files are not
modified even if the stabilized API contract requires later frontend adaptation.

## 3. Delivery Strategy

Use a contract-first vertical implementation in this order:

1. Shared HTTP and validation contract.
2. Onboarding and profile completion.
3. Canonical RBAC catalog and access enforcement.
4. Admin users, assignments, and facility scopes.
5. Facility, location, and department master data.
6. Product master data.
7. Stock read models.
8. Development seed and manual verification.

Database changes required by this scope are delivered as one explicit standalone
SQL patch outside `supabase/migrations/`. It is not a baseline migration and does
not attempt to repair Supabase migration history. Development seed SQL is kept
separate from the schema patch and is safe to rerun.

## 4. API Contract

### 4.1 General rules

- All business routes are under `/api` without a version segment.
- Better Auth remains mounted at `/api/auth/[...all]`.
- JSON fields exposed by new or stabilized APIs use `camelCase`.
- PostgreSQL `bigint` IDs and numeric quantities are JSON strings.
- Every response includes the request ID in both `meta.requestId` and the
  `x-request-id` response header.
- Collection endpoints use keyset pagination where ordering is time-based and
  bounded list responses for small reference catalogs.
- Mutation payloads reject unknown fields.
- The backend derives organization, permissions, and facility scope from the
  authenticated session. Client-supplied organization IDs are ignored.
- Resource mutations use the existing integer `version` column. A stale version
  returns `409 VERSION_CONFLICT`.
- Master records are deactivated with `isActive=false`; referenced records are
  not hard deleted.

Success envelope:

```json
{
  "data": {},
  "meta": {
    "requestId": "request-id"
  }
}
```

Collection envelope:

```json
{
  "data": [],
  "page": {
    "limit": 50,
    "nextCursor": null,
    "hasMore": false
  },
  "meta": {
    "requestId": "request-id"
  }
}
```

Error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid.",
    "details": {
      "field": "reason"
    },
    "requestId": "request-id"
  }
}
```

### 4.2 Shared error codes

- `UNAUTHORIZED` — no valid Better Auth session.
- `ACCOUNT_SUSPENDED` — the WMS account is suspended or terminated.
- `PROFILE_INCOMPLETE` — a WMS module requires a completed profile.
- `FORBIDDEN` — permission is missing.
- `FORBIDDEN_FACILITY_SCOPE` — facility scope is insufficient.
- `VALIDATION_ERROR` — payload or query validation failed.
- `NOT_FOUND` — resource is absent or not visible in the caller's scope.
- `CONFLICT` — uniqueness or business conflict.
- `VERSION_CONFLICT` — optimistic version is stale.
- `INTERNAL_ERROR` — unexpected server failure.

## 5. Onboarding and Employee Profile

### 5.1 Database additions

The standalone P0 SQL patch adds:

- `departments`, scoped to the organization, with unique code, name, active
  state, version, and audit timestamps.
- `employee_profiles.facility_id bigint`, referencing `facilities(id)`.
- `employee_profiles.department_id bigint`, referencing `departments(id)`.
- `user_access_controls`, keyed by Better Auth `user_id`, with status
  `ACTIVE`, `SUSPENDED`, or `TERMINATED`, reason, actor, and timestamps.

Existing `branch_name`, `branch_code`, and `department` columns remain for the
current database and frontend compatibility, but they cease to be authorization
authority. The service derives them from the selected facility and department
when writing a profile. Facility scope and role assignments remain the only
authorization sources.

The SQL patch backfills `facility_id` by matching the existing `branch_code` to
an active facility in the single active organization. It does not mark an
unmatched legacy profile complete.

### 5.2 Completion rules

Profile completion requires all displayed mandatory fields, including
`birthDate`, plus a valid active `facilityId`, a valid current terms acceptance,
and the current terms agreement flag. Village, soi, department, and English
emergency-contact name remain optional because the existing form labels or data
model treat them as optional.

The server owns the active terms version through `CURRENT_TERMS_VERSION` and
does not trust a version supplied by the client. The completion payload sends
`termsAccepted: true`; the backend stores the configured version and current
timestamp.

Citizen IDs must contain 13 digits and pass the Thai citizen-ID checksum.
Birth dates must be valid calendar dates and must not be in the future. Phone and
postal-code formats are validated at the API boundary.

### 5.3 Onboarding APIs

```text
GET   /api/onboarding/options
GET   /api/profile/me
PUT   /api/profile/me/complete
PATCH /api/profile/me
```

`GET /api/onboarding/options` requires only a session, not profile completion.
It returns:

- current terms version;
- active facilities safe for onboarding selection;
- active departments;
- supported prefix, gender, blood type, marital status, religion, education,
  nationality, and emergency-relationship values.

`PUT /api/profile/me/complete` is idempotent for the same user. It resolves the
facility and department server-side, stores the profile, and returns the
canonical profile representation.

`PATCH /api/profile/me` updates editable personal profile fields after
completion. It does not change role, facility scope, account status, username,
citizen ID, organization, or employment assignment. Those fields require admin
APIs or remain immutable.

## 6. Canonical Roles and Permissions

The canonical role catalog follows `DESIGN.md`:

1. `SYSTEM_ADMINISTRATOR`
2. `HQ_AREA_MANAGER`
3. `WAREHOUSE_MANAGER`
4. `STOCK_CONTROLLER`
5. `PICKER_PACKER`
6. `BRANCH_REQUESTER`
7. `BRANCH_RECEIVER`
8. `CLAIM_OFFICER`
9. `AUDITOR`

The SQL patch creates or updates these role codes and their permission mappings.
Legacy role records are not deleted. A legacy role with no active assignment is
deactivated; an assigned legacy role remains active until an explicit mapping is
applied by the patch. Existing `SYSTEM_ADMINISTRATOR`, `WAREHOUSE_MANAGER`, and
`AUDITOR` assignments retain their semantic role.

Permission codes already used by the backend remain canonical. No permission
code is renamed merely to match prose in the older architecture draft. The
mapping is:

| Role | Effective capability |
| --- | --- |
| `SYSTEM_ADMINISTRATOR` | Every active permission and all facilities. |
| `HQ_AREA_MANAGER` | Multi-facility product, stock, ledger, transfer, shipment, claim, report, and notification access; no role mutation. |
| `WAREHOUSE_MANAGER` | Read and operate warehouse stock plus warehouse approvals in assigned facilities. |
| `STOCK_CONTROLLER` | Receive, put away, move, count, and request adjustments in assigned facilities. |
| `PICKER_PACKER` | Read stock/product and operate pick/pack tasks in assigned facilities. |
| `BRANCH_REQUESTER` | Read branch product/stock and create/read transfer requests in assigned facilities. |
| `BRANCH_RECEIVER` | Read transfers and operate destination receipt/claim intake in assigned facilities. |
| `CLAIM_OFFICER` | Read related transfer/shipment/receipt data and manage claims in assigned facilities. |
| `AUDITOR` | Read-only product, stock ledger, transfer, shipment, receipt, claim, report, and audit access. |

Routes authorize atomic permissions, never role names. Role names exist only for
assignment and presentation.

Facility scope levels remain ordered:

```text
READ < OPERATE < APPROVE < ADMIN
```

## 7. Administration APIs

All routes require profile completion and explicit admin permission. User list
results expose Better Auth identity and application access metadata but never
account passwords, tokens, or verification values.

```text
GET   /api/admin/users
GET   /api/admin/users/{userId}
PATCH /api/admin/users/{userId}/status

GET   /api/admin/roles
GET   /api/admin/permissions

POST  /api/admin/users/{userId}/role-assignments
POST  /api/admin/users/{userId}/role-assignments/{assignmentId}/revoke

POST  /api/admin/users/{userId}/facility-scopes
PATCH /api/admin/users/{userId}/facility-scopes/{scopeId}
POST  /api/admin/users/{userId}/facility-scopes/{scopeId}/revoke
```

Rules:

- `admin.users.read` reads the directory and user access detail.
- `admin.users.manage` changes account status and facility scopes.
- `admin.roles.read` reads roles and permissions.
- `admin.roles.manage` assigns or revokes roles.
- A user cannot suspend or terminate their own account.
- The last active system administrator cannot be suspended, terminated, or have
  the system-administrator role revoked.
- Revocation is auditable and does not hard-delete assignment history.
- Suspending or terminating a user blocks WMS API access immediately on the next
  request. Better Auth still owns authentication and session records.
- Facility scope assignments must reference active facilities in the active
  organization.
- Role and scope validity windows are validated and returned by the API.

## 8. Facility, Location, and Department APIs

```text
GET   /api/facilities
POST  /api/facilities
GET   /api/facilities/{facilityId}
PATCH /api/facilities/{facilityId}

GET   /api/facilities/{facilityId}/locations
POST  /api/facilities/{facilityId}/locations
GET   /api/locations/{locationId}
PATCH /api/locations/{locationId}

GET   /api/departments
POST  /api/departments
GET   /api/departments/{departmentId}
PATCH /api/departments/{departmentId}
```

Read access is always intersected with facility scope unless the caller has a
global administration permission. Mutations require
`admin.facilities.manage`. Location parent and child must be in the same
facility. Location hierarchy, location type, path, depth, capacity, status, and
active state use the existing database constraints.

## 9. Product Master APIs

```text
GET/POST   /api/product-categories
GET/PATCH  /api/product-categories/{categoryId}

GET/POST   /api/brands
GET/PATCH  /api/brands/{brandId}

GET/POST   /api/units-of-measure
GET/PATCH  /api/units-of-measure/{unitId}

GET/POST   /api/products
GET/PATCH  /api/products/{productId}

GET/POST   /api/products/{productId}/units
PATCH      /api/products/{productId}/units/{productUnitId}

GET/POST   /api/products/{productId}/barcodes
PATCH      /api/products/{productId}/barcodes/{barcodeId}

GET/POST   /api/safety-stock-rules
GET/PATCH  /api/safety-stock-rules/{ruleId}

GET/POST   /api/reason-codes
GET/PATCH  /api/reason-codes/{reasonCodeId}
```

Rules:

- `product.read` reads operational product data.
- `admin.products.read` reads product administration detail.
- `admin.products.manage` creates or modifies catalog data.
- `admin.reason_codes.manage` modifies reason codes.
- Category, brand, unit, product, and rule relationships must remain within the
  active organization.
- A product base unit must be active and must belong to the organization.
- Product tracking method and picking strategy use existing constrained values.
- Existing referenced master records are deactivated, not deleted.
- Product list filters support search, category, brand, tracking method, and
  active state.

Lot and serial write workflows are excluded because they belong to inventory
operations. Product detail may read existing lot and serial records.

## 10. Stock Read APIs

```text
GET /api/stock/balances
GET /api/stock/ledger
GET /api/stock/network
```

`/api/stock/balances` supports facility, location, product, stock status, lot,
serial, and text-search filters. Results include facility, location, product,
category, brand, base unit, lot, serial, safety quantity, and derived available
quantity fields required by frontend tables.

`/api/stock/ledger` reads immutable transaction lines joined to transaction
headers. It supports facility, product, location, transaction type, reference,
and posted-date filters.

`/api/stock/network` groups one product across authorized facilities and returns
physical on-hand, available, safety quantity, available-to-transfer, and
in-transit totals as decimal strings.

All three endpoints require explicit permissions and restrict rows to the
caller's active facility scopes. System-wide permissions do not silently bypass
facility restrictions except for `SYSTEM_ADMINISTRATOR` or a documented global
admin read capability.

No endpoint in this scope mutates stock, balances, or ledger rows.

## 11. Service and File Boundaries

Each domain under `lib` owns its contract and SQL behavior:

```text
lib/<domain>/
  service.ts       database queries and business rules
  types.ts         request/result domain types
  validation.ts    explicit validation without Zod
```

Large domains may add focused files such as `queries.ts` or `commands.ts` only
when `service.ts` would mix unrelated responsibilities. Route handlers remain
thin: parse request, call the service, and return the common response envelope.

Database calls continue through `lib/core/db/pool.ts`. Multi-statement mutations
use a checked-out `pg` client and a short transaction. No new database library is
introduced.

## 12. Audit and Request Trace

Every administration and master-data mutation inserts an `audit_logs` row in the
same database transaction as the change. Audit data contains request ID, actor,
action, entity, facility when relevant, and redacted before/after values.

Audit writes never include passwords, access tokens, refresh tokens, session
tokens, Better Auth verification values, database URLs, or secrets.

The existing proxy continues to accept a valid incoming `x-request-id` or create
one. Services receive the request context needed to persist it for mutations.

## 13. Development Seed

The rerunnable development seed creates non-production demo data only:

- two branch facilities in addition to `HQ-01`;
- facility locations for receiving, storage, picking, packing, dispatch,
  quarantine, damaged, return, and claim holding;
- departments;
- product categories and brands;
- products covering `NONE`, `LOT`, and `SERIAL` tracking;
- product units and barcodes;
- safety-stock rules;
- lots and serial numbers where required;
- opening inventory transactions, transaction lines, and matching balances.

Opening stock is inserted as a reconciled ledger and balance projection in one
transaction. The seed never inserts a balance without its corresponding opening
ledger lines. Re-running it produces no duplicate master records, documents, or
stock.

Seed SQL does not create Better Auth users or store passwords. A developer
registers normally and uses the existing bootstrap command for the first system
administrator.

## 14. Manual Verification

Automated tests are excluded, but completion still requires manual and static
verification:

- `npm run typecheck` passes.
- Backend-scoped ESLint passes for `app/api`, `lib`, `scripts`, and `proxy.ts`.
- The standalone SQL patch runs in a transaction against the connected database.
- The seed can run twice with identical entity and quantity totals.
- A registered user can retrieve onboarding options before profile completion.
- Profile completion rejects missing birth date, invalid citizen ID, inactive
  facility, stale terms, and incomplete required fields.
- A system administrator can list users, assign/revoke roles, assign/revoke
  facility scopes, and suspend/reactivate another user.
- A suspended user receives `ACCOUNT_SUSPENDED` from WMS APIs.
- A scoped user cannot read another facility's stock.
- Product, facility, location, department, safety-stock, and reason-code CRUD
  returns the standard envelope and writes an audit row.
- Product, balance, ledger, and network-stock reads return seeded data.

## 15. Completion Criteria

The P0 slice is complete when:

1. The standalone DB patch and development seed are present and verified without
   changing migration history.
2. Onboarding no longer depends on hard-coded frontend branch data.
3. Profile completion uses server-owned terms and real facility references.
4. Canonical roles and permissions are queryable and enforced by atomic
   permission plus facility scope.
5. Admin APIs manage application access without directly managing Better Auth
   credentials.
6. Master-data APIs provide the stable contracts required by frontend admin
   screens.
7. Product and stock read APIs support real list/detail/filter screens.
8. All changed backend code passes TypeScript and backend-scoped lint checks.

