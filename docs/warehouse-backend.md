# Warehouse backend

Thai feature status and operational flow: [warehouse-backend-status-th.md](warehouse-backend-status-th.md).

This is the backend contract for the single-organization warehouse rebuild. The conversation requirements dated 26 September 2026 supersede the old WMS business schema. The frontend now calls these routes through `lib/api/warehouse.ts`; see [warehouse-frontend.md](warehouse-frontend.md) for screen coverage and remaining limits.

## Database state and setup

- The connected Supabase PostgreSQL database was rebuilt on 26 September 2026. Thirty old business tables were removed; `app` now contains the warehouse tables. The five Better Auth tables in `public` remain. An additive member profile table was added on 27 September 2026.
- Three existing users with the old `SYSTEM_ADMINISTRATOR` role and a credential account were preserved as `app.app_users.role = 'ADMIN'`. All other auth users and all existing sessions were removed. No organization, branch, supplier, product, or stock data was seeded.
- New environments apply `20260918160439_create_better_auth.sql`, then `20260926000000_single_org_warehouse.sql`, `20260926181053_member_profiles.sql`, `20260926205454_expand_member_profiles_and_account_settings.sql`, and `20260927042725_drop_must_change_password.sql` in timestamp order. The one-time `scripts/rebuild-database.mjs` is for an environment that still has the old role tables; it drops all old business data and is not an ordinary migration command. It applies the warehouse and member-profile migrations in order.
- `app` is omitted from Supabase Data API exposure. The Next.js service connects with `DATABASE_URL`. Evidence uses the private `warehouse-evidence` Storage bucket through server-only `SUPABASE_SERVICE_ROLE_KEY`. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` before using the media API. Never put the secret key in a `NEXT_PUBLIC_` variable.
- Better Auth owns its five tables. Business IDs are PostgreSQL `integer`; `app.app_users.auth_user_id` points to the Better Auth string ID. A stored `record_no` such as `PO-00000001` is generated from each business ID without a branch prefix.

## First records

1. Sign in with one of the retained admin credentials. Sessions were cleared during the rebuild.
2. `POST /api/org` once to set the organization name. It is a singleton and has no second-org endpoint.
3. Create branches, warehouses, units, suppliers, and products with `/api/catalog/{kind}`. Create a CEO with `/api/org/members` before the first PO because `orderedByCeoId` must reference an active CEO.
4. ADMIN creates members with an initial password. Public sign-up is disabled. Members can use the system immediately and may change their password later through `POST /api/me/change-password`.

## API conventions

Every domain API requires a Better Auth session cookie. JSON responses use `{ "data": ..., "meta": { "requestId": "..." } }`. Offset-paginated reads also include `page: { page, limit, total, hasMore, nextCursor: null }`; cursor-paginated document reads include `page: { limit, hasMore, nextCursor }` without a total. Errors use `{ "error": { "code", "message", "requestId" } }`. IDs are positive integers. Counts use decimal values with up to three places; money uses THB with up to two places. The browser cannot assert its own role or branch membership. `GET /api/me` returns the authenticated member's ID, role, branch IDs, name, email, and image for shared navigation.

| Area | Routes |
|---|---|
| Identity | `GET /api/me`, `POST /api/me/change-password` |
| One organization | `GET/POST/PATCH /api/org`, `GET /api/org/ceos` for selecting the actual CEO orderer |
| Members and profiles | `GET/POST /api/org/members`, `GET/PATCH/DELETE /api/org/members/{memberId}`, `POST .../restore`, `POST .../reset-password` |
| Master data | `GET/POST /api/catalog/{branches,warehouses,suppliers,units,product-groups,product-categories,brands,product-models,products}`, `PATCH /api/catalog/{kind}/{entityId}` |
| Inventory list | `GET /api/warehouse/inventory/products` with server-side stock aggregation and filters |
| Purchasing | `GET/POST /api/purchase-orders`, `GET/PATCH /api/purchase-orders/{poId}`, `POST .../close` |
| Supplier evidence | `GET/POST /api/supplier-receipts`, `GET/PATCH /api/supplier-receipts/{receiptId}` |
| Carrier evidence | `GET/POST /api/carrier-receipts`, `GET/PATCH /api/carrier-receipts/{receiptId}`, `POST .../confirm` |
| Count and stock | `GET/POST /api/goods-receipts`, `GET /api/goods-receipts/{receiptId}`, `POST .../post`, `GET /api/stock/balances`, `GET /api/stock/ledger`, `POST /api/stock/documents`, `POST /api/stock/documents/{documentId}/reverse` |
| Problems | `GET/POST /api/issues`, `GET /api/issues/{issueId}`, `POST .../events`, `POST .../claims` |
| Evidence and reports | `POST /api/media` (multipart field `file`), `GET /api/media/{assetId}`, `GET /api/reports/receipts`, `GET /api/reports/outstanding`, `GET /api/audit` |

Member reads are scoped by the server: ADMIN and CEO see full details for all active members; ADMIN also sees soft-deleted members. MANAGER sees full details for members sharing any assigned branch. COUNTER_STAFF and EMPLOYEE see only `id`, `name`, `role`, and shared `branchIds` for colleagues, but see their own full record. Inaccessible member IDs return 404. `GET /api/org/members?view=summary` returns lightweight rows for the member list; `GET /api/org/members/{id}` loads permitted details on demand. The original list response is retained. Full records include `email`, account status and `profile`; summary records carry `detailLevel: "SUMMARY"` and omit personal fields. Full records carry `detailLevel: "FULL"`.

Only ADMIN can create, soft-delete, restore, reset passwords, or edit another member's name, email, role, branches and profile. Every active member may PATCH their own name and personal profile fields (`phone`, `address`, emergency contact). Only ADMIN can set `employeeCode` and `startedOn`; self-service email and access changes are rejected. CEO and MANAGER can read records in scope but cannot edit others. The profile table is private, optional one-to-one with `app.app_users`, and existing admins need no profile backfill.

`POST /api/stock/documents` and `POST /api/goods-receipts/{receiptId}/post` require an `Idempotency-Key` header (8–120 letters, digits, `_` or `-`). Posted stock movements are immutable; reversals create new documents and movements. GET balance and ledger routes accept `warehouseId` and `productId`; balance also accepts `branchId`; ledger also accepts `from` and `to` in `YYYY-MM-DD` form. The receipt report accepts `supplierId`, `productId`, `branchId`, `from`, and `to`.

Inventory, catalog, balance, and ledger list screens request `page` (starting at 1) and `limit` (1–100); the default page size is 20. Inventory accepts `q`, `categoryId`, `warehouseId`, and `status` (`in_stock`, `low_stock`, `out_of_stock`) and computes stock within the actor's branches. Catalog accepts `q`; `GET /api/catalog/products?lookup=1&q=...` returns up to 50 active SKU/name matches for product selectors. Catalog, balance, and ledger routes retain their previous unpaginated response when `page` is omitted so existing callers continue to work.

## Optional reads for Warehouse forms

These options allow callers to request eligible records and smaller details on demand. Existing calls without the new options keep their previous fields, permissions, ordering, and pagination. This backend change does not change frontend loading, deduplicate browser requests, or introduce a shared cache; the frontend must adopt these options to benefit from them.

### Document filters

| Request | Meaning |
|---|---|
| `GET /api/purchase-orders?closed=false&limit=20` | Only POs with `closed_at IS NULL`; `closed=true` selects closed POs. This is the stored closing state, not a calculation of outstanding quantity. Existing `q` and `cursor` still work. |
| `GET /api/carrier-receipts?received=true&hasGoodsReceipt=false&limit=20` | Only carrier documents with a non-null delivery confirmation `received_at` and no linked goods receipt. Suitable for the count-form selector. |
| `GET /api/carrier-receipts?received=false` | Carrier documents without a recorded receipt time, including documents without a delivery confirmation. |
| `GET /api/carrier-receipts?hasGoodsReceipt=true` | Carrier documents with any linked goods receipt; posted/reversed state does not change this existence check. |
| `GET /api/catalog/warehouses?branchId=7` | Only warehouses in branch 7, intersected with the actor's existing branch scope. Also works with `page`, `q` in paginated mode, or `lookup=1`. An inaccessible branch returns an empty list, never broader access. |

The document filters are applied before the existing descending-ID cursor limit. Both boolean filters on carriers can be combined; omitting either leaves that criterion unfiltered. Boolean values must be exactly `true` or `false`; empty/invalid values return 400. `branchId` must be a positive PostgreSQL integer. Document page sizes remain 1–100, default 20; selectors must follow `nextCursor` when more results are needed.

### Compact detail views

| Request | `data` fields | Business database query calls |
|---|---|---|
| `GET /api/purchase-orders/12?view=lines` | Existing PO header and `lines`, including the original line calculations and Employee-specific projection. Omits `supplierReceipts`, `carrierReceipts`, `goodsReceipts`, and `revisions`. | 2 instead of 6; Employee: 2 instead of 3. |
| `GET /api/carrier-receipts/12?view=confirmation` | Existing carrier header and `confirmation` (object or `null`). Omits `lines`, `media`, and `revisions`. | 2 instead of 5. |

Omitting `view` or passing `view=full` keeps the full detail response. Unknown or empty `view` returns 400. Missing documents and permission checks retain their existing behavior. The query counts above exclude authentication and actor lookup; they are verified with mocked query calls, not a live database latency benchmark. The PO line query still performs its existing quantity calculations.

### Catalog selectors

Use `GET /api/catalog/{kind}?lookup=1&q=...` **without `page`** for a compact selector list. Searches trim `q`, accept at most 100 characters, and return up to 50 records with no pagination metadata or total. For longer lists, refine the search or use the existing paginated catalog API. When `page` is present, the route retains its original paginated catalog behavior, even if `lookup=1` is also supplied.

| Kind | Returned columns | Search / ordering |
|---|---|---|
| `branches` | `id, code, name, active` | code or name / descending ID |
| `warehouses` | `id, branch_id, code, name, active` | code or name / descending ID; optional `branchId` |
| `suppliers` | `id, code, name, active` | code or name / descending ID |
| `units` | `id, code, name` | code or name / descending ID |
| `product-groups`, `brands` | `id, name` | name / descending ID |
| `product-categories` | `id, group_id, name` | name / descending ID |
| `product-models` | `id, brand_id, name` | name / descending ID |
| `products` | `id, sku, name, unit_id, serial_tracked, active` | SKU or name / SKU, then ID; active products only, as before |

The new non-product lookups do not exclude inactive records; callers receive `active` where the catalog supports it. Branch and warehouse scope is enforced exactly as for the existing list. Employee access remains limited to branches and products. Calls without `lookup=1` keep the previous catalog shape and limits.

## Stock document HTTP entry points

The routes below expose the existing stock posting and reversal services. Service rules, transaction boundaries, ledger/serial handling, audit events, and authorization are unchanged. Both require an authenticated ADMIN, CEO, or MANAGER and the existing warehouse branch permissions.

`POST /api/stock/documents` returns 201 with the existing service result inside `data`. Include `Idempotency-Key: movement-key-123` and a JSON body such as:

```json
{"kind":"ISSUE","warehouseId":7,"reason":"Internal use","lines":[{"productId":3,"quantity":"2","serialNumbers":[]}]}
```

`kind` supports `ISSUE`, `ADJUSTMENT`, and `TRANSFER`. Adjustment lines use `quantityDelta` instead of `quantity`; transfers also require `destinationWarehouseId`. The service still validates quantities, reason, active warehouses/products, and serials. A new result contains `inventoryDocumentId`, `destinationDocumentId` (nullable), and `repeated: false`. An existing-key replay returns the original `inventoryDocumentId` and `repeated: true`; a reused key with different data returns 409. Missing/invalid keys return 400.

`POST /api/stock/documents/12/reverse` accepts `{"reason":"Correction"}` and returns 200 with `data: { reversalDocumentIds: [...] }`. It delegates to the existing reversal rules, including transfer pairs, serial validation, and conflict handling. It does not require an `Idempotency-Key`; a duplicate reversal remains subject to the service's existing conflict checks. Both routes use the standard JSON error envelope and request ID.

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
