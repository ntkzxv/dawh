# Warehouse backend

Thai feature status and operational flow: [warehouse-backend-status-th.md](warehouse-backend-status-th.md).

This is the backend contract for the single-organization warehouse rebuild. The conversation requirements dated 26 September 2026 supersede the old WMS business schema. The frontend now calls these routes through `lib/api/warehouse.ts`; see [warehouse-frontend.md](warehouse-frontend.md) for screen coverage and remaining limits.

## Database state and setup

- The connected Supabase PostgreSQL database was rebuilt on 26 September 2026. Thirty old business tables were removed; `app` now contains the warehouse tables. The five Better Auth tables in `public` remain. An additive member profile table was added on 27 September 2026.
- Three existing users with the old `SYSTEM_ADMINISTRATOR` role and a credential account were preserved as `app.app_users.role = 'ADMIN'`. All other auth users and all existing sessions were removed. No organization, branch, supplier, product, or stock data was seeded.
- New environments apply `20260918160439_create_better_auth.sql`, then `20260926000000_single_org_warehouse.sql`, then `20260926181053_member_profiles.sql`. The one-time `scripts/rebuild-database.mjs` is for an environment that still has the old role tables; it drops all old business data and is not an ordinary migration command. The script now applies both warehouse migrations in order.
- `app` is omitted from Supabase Data API exposure. The Next.js service connects with `DATABASE_URL`. Evidence uses the private `warehouse-evidence` Storage bucket through server-only `SUPABASE_SERVICE_ROLE_KEY`. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` before using the media API. Never put the secret key in a `NEXT_PUBLIC_` variable.
- Better Auth owns its five tables. Business IDs are PostgreSQL `integer`; `app.app_users.auth_user_id` points to the Better Auth string ID. A stored `record_no` such as `PO-00000001` is generated from each business ID without a branch prefix.

## First records

1. Sign in with one of the retained admin credentials. Sessions were cleared during the rebuild.
2. `POST /api/org` once to set the organization name. It is a singleton and has no second-org endpoint.
3. Create branches, warehouses, units, suppliers, and products with `/api/catalog/{kind}`. Create a CEO with `/api/org/members` before the first PO because `orderedByCeoId` must reference an active CEO.
4. ADMIN creates members with an initial password. Public sign-up is disabled. New members call `POST /api/me/change-initial-password` with their current and new passwords before using business APIs.

## API conventions

Every domain API requires a Better Auth session cookie. JSON responses use `{ "data": ..., "meta": { "requestId": "..." } }`; errors use `{ "error": { "code", "message", "requestId" } }`. IDs are positive integers. Counts use decimal values with up to three places; money uses THB with up to two places. The browser cannot assert its own role or branch membership.

| Area | Routes |
|---|---|
| Identity | `GET /api/me`, `POST /api/me/change-initial-password` |
| One organization | `GET/POST/PATCH /api/org`, `GET /api/org/ceos` for selecting the actual CEO orderer |
| Members and profiles | `GET/POST /api/org/members`, `GET/PATCH/DELETE /api/org/members/{memberId}`, `POST .../restore`, `POST .../reset-password` |
| Master data | `GET/POST /api/catalog/{branches,warehouses,suppliers,units,product-groups,product-categories,brands,product-models,products}`, `PATCH /api/catalog/{kind}/{entityId}` |
| Purchasing | `GET/POST /api/purchase-orders`, `GET/PATCH /api/purchase-orders/{poId}`, `POST .../close` |
| Supplier evidence | `GET/POST /api/supplier-receipts`, `GET/PATCH /api/supplier-receipts/{receiptId}` |
| Carrier evidence | `GET/POST /api/carrier-receipts`, `GET/PATCH /api/carrier-receipts/{receiptId}`, `POST .../confirm` |
| Count and stock | `GET/POST /api/goods-receipts`, `GET /api/goods-receipts/{receiptId}`, `POST .../post`, `GET /api/stock/balances`, `GET /api/stock/ledger`, `POST /api/stock/documents`, `POST /api/stock/documents/{documentId}/reverse` |
| Problems | `GET/POST /api/issues`, `GET /api/issues/{issueId}`, `POST .../events`, `POST .../claims` |
| Evidence and reports | `POST /api/media` (multipart field `file`), `GET /api/media/{assetId}`, `GET /api/reports/receipts`, `GET /api/reports/outstanding`, `GET /api/audit` |

Member reads are scoped by the server: ADMIN and CEO see full details for all active members; ADMIN also sees soft-deleted members. MANAGER sees full details for members sharing any assigned branch. COUNTER_STAFF and EMPLOYEE see only `id`, `name`, `role`, and shared `branchIds` for colleagues, but see their own full record. Inaccessible member IDs return 404. Full records include `email`, account status and `profile` (`employeeCode`, `phone`, `address`, `startedOn`, `emergencyContactName`, `emergencyContactPhone`); summary records carry `detailLevel: "SUMMARY"` and omit these fields. Full records carry `detailLevel: "FULL"`.

Only ADMIN can create, soft-delete, restore, reset passwords, or edit another member's name, email, role, branches and profile. Every active member may PATCH their own name and personal profile fields (`phone`, `address`, emergency contact). Only ADMIN can set `employeeCode` and `startedOn`; self-service email and access changes are rejected. CEO and MANAGER can read records in scope but cannot edit others. The profile table is private, optional one-to-one with `app.app_users`, and existing admins need no profile backfill.

`POST /api/stock/documents` and `POST /api/goods-receipts/{receiptId}/post` require an `Idempotency-Key` header (8–120 letters, digits, `_` or `-`). Posted stock movements are immutable; reversals create new documents and movements. GET balance and ledger routes accept `warehouseId` and `productId`; balance also accepts `branchId`; ledger also accepts `from` and `to` in `YYYY-MM-DD` form. The receipt report accepts `supplierId`, `productId`, `branchId`, `from`, and `to`.

## Key request bodies

```json
{"name":"Example Organization","phone":"020000000","address":"Bangkok"}
```

```json
{"name":"Staff Name","email":"staff@example.com","role":"COUNTER_STAFF","branchIds":[1],"initialPassword":"temporary-password"}
```

```json
{"supplierId":1,"orderedByCeoId":2,"orderedAt":"2026-09-26","lines":[{"productId":1,"quantity":"10.000","unitPrice":"125.00"}]}
```

```json
{"purchaseOrderId":1,"supplierId":1,"externalDocNo":"INV-100","documentDate":"2026-09-26","totalAmount":"1250.00","lines":[{"purchaseOrderLineId":1,"quantity":"10.000","unitPrice":"125.00"}],"mediaAssetIds":[1]}
```

```json
{"purchaseOrderCode":"PO-00000001","externalDocNo":"TR-100","carrierName":"Carrier","packageCount":2,"mediaAssetIds":[2]}
```

```json
{"receivingBranchId":1,"actualPackageCount":2,"packageCondition":"Sealed","mediaAssetIds":[3]}
```

```json
{"carrierReceiptId":1,"warehouseId":1,"lines":[{"purchaseOrderLineId":1,"goodQuantity":"4","damagedQuantity":"1","wrongQuantity":"0","serialNumbers":[]}],"issueTitle":"Damaged item","issueDetail":"One item damaged in transit","mediaAssetIds":[4]}
```

POs have no branch field. Staff can reference any PO when recording a carrier document. `receivingBranchId` is recorded on delivery confirmation and copied to the physical count; posting increases only good quantity at a warehouse in that branch. Each carrier document can be counted once, while multiple carrier documents can reference one PO. When damaged or wrong quantity is entered, the count API requires issue title, detail, and evidence and opens an issue automatically. Carrier lines can be omitted when the paper document has no SKU; a missing value remains `NULL`.

Evidence records and their original images are append-only. PO, supplier, and carrier edits store before and after snapshots in `app.document_revisions` and write an audit event. PO edits stop once supplier or carrier evidence is linked. Carrier quantity and SKU lines stop changing after delivery confirmation. Supplier and carrier external numbers can repeat; the API returns duplicate warnings rather than treating them as globally unique.
