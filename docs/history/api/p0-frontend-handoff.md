# P0 backend contract for frontend handoff

This document describes the implemented P0 backend surface. Authentication is
Better Auth at `/api/auth/[...all]`; Supabase Auth is unused by DAWH. Browser
code must call these Next.js APIs and must not query Supabase business tables
directly.

## Conventions

- Set `BASE_URL=http://localhost:3000` and replace `SESSION_COOKIE` in the curl
  commands with a Better Auth cookie captured from a signed-in browser.
- All new/stabilized JSON keys are camelCase.
- Every PostgreSQL `bigint` ID and every PostgreSQL decimal value is a JSON
  string. Never parse them as a JavaScript `number`.
- Mutation bodies reject unknown keys.
- Versioned `PATCH` bodies require the current integer `version`. A stale value
  returns `409 VERSION_CONFLICT`.
- Master records are deactivated through `isActive: false`; there are no hard
  delete endpoints.
- Every response has an `x-request-id` header.

Success:

```json
{"data": {}, "meta": {"requestId": "..."}}
```

Paginated collection:

```json
{"data": [], "page": {"limit": 50, "nextCursor": null, "hasMore": false}, "meta": {"requestId": "..."}}
```

Error:

```json
{"error": {"code": "VALIDATION_ERROR", "message": "The request is invalid.", "details": {}, "requestId": "..."}}
```

Common errors are `UNAUTHORIZED`, `ACCOUNT_SUSPENDED`, `PROFILE_INCOMPLETE`,
`FORBIDDEN`, `FORBIDDEN_FACILITY_SCOPE`, `VALIDATION_ERROR`, `NOT_FOUND`,
`CONFLICT`, `VERSION_CONFLICT`, and `INTERNAL_ERROR`.

## Session, onboarding, and profile

### `GET /api/me`

Requires a valid session. Returns `user`, `organization`, `accountStatus`, the
canonical profile or `null`, `profileComplete`, active `roles`, effective
`permissions`, and active `facilityScopes`.

```bash
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/me"
```

### `GET /api/onboarding/options`

Requires a session but not a completed profile. Returns `termsVersion`, active
facilities and departments, plus supported profile select values.

```bash
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/onboarding/options"
```

### `GET /api/profile/me`

Requires a session. Returns the current canonical profile or `null`.

```bash
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/profile/me"
```

### `PUT /api/profile/me/complete`

Requires a session. The body must contain every key below. Empty strings are
valid only for optional display fields; `departmentId` and
`emergencyContactNameEn` may be `null`; `village` and `soi` in each address may
be `null`. The server supplies the current terms version.

```json
{
  "username": "employee.one",
  "prefix": "Mr.",
  "firstNameTh": "ทดสอบ",
  "lastNameTh": "ระบบ",
  "nicknameTh": "เทส",
  "firstNameEn": "Test",
  "lastNameEn": "User",
  "nicknameEn": "Tester",
  "citizenId": "1101700207030",
  "birthDate": "1995-05-15",
  "gender": "Male",
  "bloodType": "O",
  "maritalStatus": "Single",
  "nationality": "Thai",
  "religion": "Buddhist",
  "educationLevel": "Bachelor's Degree",
  "majorSubject": "Computer Engineering",
  "universityNameTh": "มหาวิทยาลัย",
  "universityNameEn": "University",
  "phone": "0812345678",
  "emergencyContactNameTh": "สมศรี ใจดี",
  "emergencyContactNameEn": null,
  "emergencyContactRelationship": "Parent",
  "emergencyContactPhone": "0898765432",
  "currentAddress": {"houseNo":"99/9","village":null,"soi":null,"province":"Pathum Thani","district":"Khlong Luang","subdistrict":"Khlong Nueng","postalCode":"12120"},
  "registeredAddress": {"houseNo":"99/9","village":null,"soi":null,"province":"Pathum Thani","district":"Khlong Luang","subdistrict":"Khlong Nueng","postalCode":"12120"},
  "facilityId": "1",
  "departmentId": null,
  "termsAccepted": true
}
```

```bash
curl -X PUT -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data @profile.json "$BASE_URL/api/profile/me/complete"
```

### `PATCH /api/profile/me`

Requires a completed profile. Accepts only editable fields: `prefix`, both
nicknames, nationality, religion, education fields, phone, emergency-contact
fields, `currentAddress`, and `registeredAddress`. It cannot change username,
citizen ID, facility, department, role, scope, or account status.

```bash
curl -X PATCH -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"phone":"0811111111"}' "$BASE_URL/api/profile/me"
```

## User and access administration

All routes require profile completion.

| Method and path | Permission | Input / behavior |
| --- | --- | --- |
| `GET /api/admin/users` | `admin.users.read` | Query: `search`, `status`, `roleCode`, `facilityId`, `profileComplete`, `limit`, `cursor`. |
| `GET /api/admin/users/{userId}` | `admin.users.read` | Better Auth identity plus application profile, status, roles, and scopes. No password/token fields. |
| `PATCH /api/admin/users/{userId}/status` | `admin.users.manage` | `{status, reason}`; status is `ACTIVE`, `SUSPENDED`, or `TERMINATED`. Self-disable and disabling the last active system admin return `409`. |
| `GET /api/admin/roles` | `admin.roles.read` | Active canonical roles with effective permission codes. |
| `GET /api/admin/permissions` | `admin.roles.read` | Active atomic permission catalog. |
| `POST /api/admin/users/{userId}/role-assignments` | `admin.roles.manage` | `{roleId, validFrom, validUntil}`; timestamps may be `null`. |
| `POST /api/admin/users/{userId}/role-assignments/{assignmentId}/revoke` | `admin.roles.manage` | `{reason}`; never deletes history and protects the last system admin. |
| `POST /api/admin/users/{userId}/facility-scopes` | `admin.users.manage` | `{facilityId, scopeType, validFrom, validUntil}`; scope is `READ`, `OPERATE`, `APPROVE`, or `ADMIN`. |
| `PATCH /api/admin/users/{userId}/facility-scopes/{scopeId}` | `admin.users.manage` | `{scopeType, validFrom, validUntil, version}`. |
| `POST /api/admin/users/{userId}/facility-scopes/{scopeId}/revoke` | `admin.users.manage` | `{version, reason}`; closes the validity period without deleting history. |

```bash
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/admin/users?limit=50&status=ACTIVE"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/admin/users/USER_ID"
curl -X PATCH -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"status":"SUSPENDED","reason":"Offboarding"}' "$BASE_URL/api/admin/users/USER_ID/status"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/admin/roles"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/admin/permissions"
curl -X POST -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"roleId":"1","validFrom":null,"validUntil":null}' "$BASE_URL/api/admin/users/USER_ID/role-assignments"
curl -X POST -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"reason":"Role changed"}' "$BASE_URL/api/admin/users/USER_ID/role-assignments/1/revoke"
curl -X POST -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"facilityId":"1","scopeType":"OPERATE","validFrom":null,"validUntil":null}' "$BASE_URL/api/admin/users/USER_ID/facility-scopes"
curl -X PATCH -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"scopeType":"ADMIN","validFrom":null,"validUntil":null,"version":1}' "$BASE_URL/api/admin/users/USER_ID/facility-scopes/1"
curl -X POST -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"version":2,"reason":"Facility reassignment"}' "$BASE_URL/api/admin/users/USER_ID/facility-scopes/1/revoke"
```

## Facility, location, and department masters

Facility reads are restricted to visible facility scopes unless the caller has
global facility administration. Mutations require `admin.facilities.manage`.

| Method and path | Permission | Input / query |
| --- | --- | --- |
| `GET /api/facilities` | completed profile | `search`, `facilityType`, `active`, `limit`, `cursor`. |
| `POST /api/facilities` | `admin.facilities.manage` | Facility body below. |
| `GET /api/facilities/{facilityId}` | visible scope or `admin.facilities.read` | Facility detail. |
| `PATCH /api/facilities/{facilityId}` | `admin.facilities.manage` | Any facility fields plus required `version`. |
| `GET /api/facilities/{facilityId}/locations` | visible scope or `admin.facilities.read` | Ordered location hierarchy. |
| `POST /api/facilities/{facilityId}/locations` | `admin.facilities.manage` | Location body below. |
| `GET /api/locations/{locationId}` | visible scope or `admin.facilities.read` | Location detail. |
| `PATCH /api/locations/{locationId}` | `admin.facilities.manage` | Any location fields plus required `version`. |
| `GET /api/departments` | `admin.facilities.read` | Organization department catalog. |
| `POST /api/departments` | `admin.facilities.manage` | `{code, name, isActive}`. |
| `GET /api/departments/{departmentId}` | `admin.facilities.read` | Department detail. |
| `PATCH /api/departments/{departmentId}` | `admin.facilities.manage` | Any department fields plus `version`. |

Facility body keys: `code`, `name`, `facilityType`, `addressLine1`,
`addressLine2`, `province`, `district`, `subdistrict`, `postalCode`, `latitude`,
`longitude`, `isActive`. Nullable address and coordinate fields use `null`.

Location body keys: `parentId`, `code`, `name`, `hierarchyType`, `locationType`,
`maxVolume`, `maxWeight`, `status`, `isActive`. The backend computes `path` and
`depth` and prevents cross-facility or cyclic parents.

```bash
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/facilities?active=true&limit=50"
curl -X POST -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"code":"BKK-02","name":"Bangkok 2","facilityType":"BRANCH","addressLine1":null,"addressLine2":null,"province":"Bangkok","district":null,"subdistrict":null,"postalCode":null,"latitude":null,"longitude":null,"isActive":true}' "$BASE_URL/api/facilities"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/facilities/1"
curl -X PATCH -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"name":"Updated HQ","version":1}' "$BASE_URL/api/facilities/1"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/facilities/1/locations"
curl -X POST -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"parentId":null,"code":"STG-02","name":"Storage 2","hierarchyType":"ZONE","locationType":"STORAGE","maxVolume":null,"maxWeight":null,"status":"ACTIVE","isActive":true}' "$BASE_URL/api/facilities/1/locations"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/locations/1"
curl -X PATCH -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"status":"BLOCKED","version":1}' "$BASE_URL/api/locations/1"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/departments"
curl -X POST -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"code":"QA","name":"Quality Assurance","isActive":true}' "$BASE_URL/api/departments"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/departments/1"
curl -X PATCH -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"isActive":false,"version":1}' "$BASE_URL/api/departments/1"
```

## Product reference masters

Reads require `admin.products.read`; creates/updates require
`admin.products.manage`, except reason-code mutations require
`admin.reason_codes.manage`.

| Resource | Collection body | Update body |
| --- | --- | --- |
| `/api/product-categories` | `{parentId, code, name, description, isActive}` | Any collection fields plus `version`. Cycles and cross-organization parents are rejected. |
| `/api/brands` | `{code, name, isActive}` | Any fields plus `version`. |
| `/api/units-of-measure` | `{code, name, decimalScale, isActive}` | Any fields plus `version`; scale is 0–6. |
| `/api/reason-codes` | `{domain, code, name, description, requiresNote, requiresAttachment, isActive}` | Any fields plus `version`. |

Each collection supports `GET` and `POST`; each `/{id}` route supports `GET`
and `PATCH`.

```bash
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/product-categories"
curl -X POST -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"parentId":null,"code":"MEDICAL","name":"Medical","description":null,"isActive":true}' "$BASE_URL/api/product-categories"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/product-categories/1"
curl -X PATCH -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"name":"Medical Supplies","version":1}' "$BASE_URL/api/product-categories/1"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/brands"
curl -X POST -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"code":"ACME","name":"Acme","isActive":true}' "$BASE_URL/api/brands"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/brands/1"
curl -X PATCH -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"isActive":false,"version":1}' "$BASE_URL/api/brands/1"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/units-of-measure"
curl -X POST -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"code":"PALLET","name":"Pallet","decimalScale":0,"isActive":true}' "$BASE_URL/api/units-of-measure"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/units-of-measure/1"
curl -X PATCH -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"decimalScale":2,"version":1}' "$BASE_URL/api/units-of-measure/1"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/reason-codes"
curl -X POST -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"domain":"STOCK","code":"OTHER","name":"Other","description":null,"requiresNote":true,"requiresAttachment":false,"isActive":true}' "$BASE_URL/api/reason-codes"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/reason-codes/1"
curl -X PATCH -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"requiresAttachment":true,"version":1}' "$BASE_URL/api/reason-codes/1"
```

## Products, units, barcodes, and safety stock

Product reads require `product.read`; administrative subresources require
`admin.products.read`; all mutations require `admin.products.manage`.

`GET /api/products` accepts `search`, `categoryId`, `brandId`,
`trackingMethod`, `active`, `limit`, and `cursor`. Product create requires:
`sku`, `nameTh`, nullable `nameEn`, nullable `description`, nullable
`categoryId`, nullable `brandId`, `baseUnitId`, `trackingMethod`,
`pickingStrategy`, nullable dimension/weight/cost decimal strings,
`currencyCode`, nullable `shelfLifeDays`, nullable `storageCondition`, and
`isActive`. FEFO requires LOT tracking and a positive shelf life.

| Method and path | Input / output |
| --- | --- |
| `GET/POST /api/products` | Filtered page / full product create. |
| `GET/PATCH /api/products/{productId}` | Full product detail / partial fields plus `version`. |
| `GET/POST /api/products/{productId}/units` | Unit list / `{unitId, baseQuantity, lengthCm, widthCm, heightCm, weightKg, isActive}`. |
| `PATCH /api/products/{productId}/units/{productUnitId}` | Partial unit fields plus `version`. |
| `GET/POST /api/products/{productId}/barcodes` | Barcode list / `{productUnitId, barcode, barcodeType, isPrimary}`. |
| `PATCH /api/products/{productId}/barcodes/{barcodeId}` | Full barcode body. The table has no version column; primary switching is transactional. |
| `GET/POST /api/safety-stock-rules` | Visible list / `{facilityId, productId, minimumQuantity, maximumQuantity, reorderPoint, safetyQuantity}`. |
| `GET/PATCH /api/safety-stock-rules/{ruleId}` | Scoped detail / partial quantities plus `version`. |

```bash
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/products?trackingMethod=LOT&limit=50"
curl -X POST -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data @product.json "$BASE_URL/api/products"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/products/1"
curl -X PATCH -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"nameEn":"Updated","version":1}' "$BASE_URL/api/products/1"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/products/1/units"
curl -X POST -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"unitId":"4","baseQuantity":"12.000000","lengthCm":null,"widthCm":null,"heightCm":null,"weightKg":null,"isActive":true}' "$BASE_URL/api/products/1/units"
curl -X PATCH -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"baseQuantity":"10.000000","version":1}' "$BASE_URL/api/products/1/units/1"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/products/1/barcodes"
curl -X POST -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"productUnitId":null,"barcode":"INTERNAL-001","barcodeType":"INTERNAL","isPrimary":true}' "$BASE_URL/api/products/1/barcodes"
curl -X PATCH -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"productUnitId":null,"barcode":"INTERNAL-002","barcodeType":"INTERNAL","isPrimary":true}' "$BASE_URL/api/products/1/barcodes/1"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/safety-stock-rules"
curl -X POST -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"facilityId":"1","productId":"1","minimumQuantity":"5.000000","maximumQuantity":"100.000000","reorderPoint":"20.000000","safetyQuantity":"10.000000"}' "$BASE_URL/api/safety-stock-rules"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/safety-stock-rules/1"
curl -X PATCH -H "cookie: $SESSION_COOKIE" -H 'content-type: application/json' --data '{"safetyQuantity":"12.000000","version":1}' "$BASE_URL/api/safety-stock-rules/1"
```

## Stock reads

These routes never mutate stock. Results are restricted to active facility
scopes; system administrators can read all active organization facilities.

| Method and path | Permission | Query |
| --- | --- | --- |
| `GET /api/stock/balances` | `stock.read` | `facilityId`, `locationId`, `productId`, `stockStatus`, `lotId`, `serialId`, `search`, `limit`, `cursor`. |
| `GET /api/stock/ledger` | `stock.ledger.read` | `facilityId`, `productId`, `locationId`, `transactionType`, `referenceType`, `referenceId`, `postedFrom`, `postedTo`, `limit`, `cursor`. |
| `GET /api/stock/network` | `stock.read` | Optional `facilityId` and `productId`; returns physical, available, safety, transferable, and in-transit decimal strings per product/facility. |

Balances expose the exact stock-status grain. `availableQuantity` is nonzero
only for an `AVAILABLE` row. `availableToTransfer` is
`max(availableQuantity - safetyQuantity, 0)`.

```bash
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/stock/balances?facilityId=1&stockStatus=AVAILABLE&limit=50"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/stock/ledger?facilityId=1&transactionType=ADJUST&limit=50"
curl -H "cookie: $SESSION_COOKIE" "$BASE_URL/api/stock/network?productId=1"
```

## Frontend integration order

1. Establish a Better Auth session.
2. Call `GET /api/me`.
3. If `profileComplete` is false, call `GET /api/onboarding/options` and force
   profile completion before rendering WMS modules.
4. Submit `PUT /api/profile/me/complete`, then refresh `/api/me`.
5. Render navigation from `permissions` and `facilityScopes`; role names are for
   display, not authorization decisions.
6. Use the admin, master-data, product, and stock routes above. Do not use a
   Supabase browser client for business tables.

## Development data

Run `supabase/seeds/development_p0.sql` after the P0 schema patch. It requires
an active system administrator and creates deterministic development masters,
three demo products (`NONE`, `LOT`, and `SERIAL` tracking), and the reconciled
opening transaction `OPEN-DEV-P0-001`. It is safe to rerun.
