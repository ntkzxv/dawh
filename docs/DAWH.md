# DAWH — Product and Engineering Guide

**Updated:** 3 November 2026
**Source of truth:** the current application code and migrations under `supabase/migrations/`. Archived design documents may describe an earlier database or aspirational features; they are retained under [`history/`](history/).

## 1. Product status

### Business Model (target)

DAWH serves one organization operating across multiple branches. The organization buys and receives physical products into branch warehouses, then sells those products to customers at offline stores. Warehouse operations, customer sales/receivables, and organization/employee administration are separate business areas in one application.

After a customer purchase/payment occurs at the store, a staff member records the transaction in the back-office system: customer details first, the actual payment details next, then the products sold. The system keeps the customer and sales/receivable history, records which staff member entered it, and links sold products/quantities to the existing branch warehouse. Customer installment financing is part of the intended customer business direction, but contract, pricing, repayment, and collection rules still need to be defined.

Employees are staff users who enter and manage customer transactions; they are not borrowers in this business model. Employee/member records, branches, roles, and access belong to Organization & People. Customer financial history must not be mixed into employee administration. There is no employee loan, employee installment, payroll deduction, automatic payment charge, or automatic collection feature in the current target.

The system records payments after they occur; it does not initiate a charge, automatically deduct money, or collect an installment. Sales are expected to connect to warehouse stock, but the exact stock-posting point, returns, and reversal rules are open requirements. This document records the current direction from the project discussion; it does not infer additional financial rules from old WMS specifications or marketing copy.

| Area | Current status |
| --- | --- |
| Authentication, organization settings, branches, members and access | Core implemented with Better Auth and server-side role/branch checks; this is not a full HR/payroll suite |
| Warehouses, suppliers, products and units | Implemented as warehouse master data |
| Purchase order and inbound receiving | Implemented: PO, supplier/carrier documents, delivery confirmation, goods count and posting |
| Inventory | Implemented: balances, ledger, issue, adjustment, direct warehouse transfer and reversal |
| Issues, claims, reports and audit | Implemented at the API/UI scope described below; external supplier resolution remains outside the application |
| Stock by branch warehouse and SKU | Current model; inventory is tracked per warehouse, without shelf/bin address tracking |
| Cycle count | Planned; count and reconcile by warehouse and SKU |
| Transfer request, approval, reservation, picking, packing, dispatch and destination receiving | Planned workflow; current transfer posts stock between warehouses immediately |
| Customer/debtor records and offline sales entry | Intended addition; staff will manually record customer, actual payment details, and products sold; no customer or sales records/API exist yet |
| Customer installment records and collections | Intended direction; staff manually record actual payments; no contract, repayment schedule, or payment records exist yet; business rules are pending |
| Employee loans/installments/payroll deductions | Not part of the current target; employees are transaction operators, not debtors |

### Intended module boundaries

| Module | Owns | Must stay outside this module |
| --- | --- | --- |
| **Warehouse** (existing) | Product and warehouse stock, receipts, stock movements, issues, and inventory history | Customer debt contracts and employee/org administration |
| **Sales & Customer Receivables** (planned) | Customer/debtor profile, offline sales entered by staff, manually recorded customer payment details, customer receivables, installment agreements and collection history once rules are approved | Employee records, org setup, roles, and branch membership administration |
| **Organization & People** (existing foundation; keep separate) | Organization and branch settings, members/employees, roles, branch assignments, and access control | Customer purchase history, receivables, and financing details |

These are logical module and data-ownership boundaries within the current application. They do not require separate microservices. To address loading speed, each module should load only its own paginated data and fetch tab/detail data when needed; separating navigation alone does not guarantee faster loading.

### Planned offline sales recording flow

1. A staff member starts a sales record and finds or enters the customer/debtor details.
2. The staff member records the payment details based on the payment already made at the store. Payment capture is manual; the system does not initiate a charge or deduction.
3. The staff member links the products and quantities sold to the transaction.
4. The system saves the transaction, the staff member who entered it, and any remaining customer receivable/installment information supported by the agreed rules.
5. The transaction will connect to warehouse stock. When stock is deducted, and how corrections, returns, or reversals work, must be defined before implementation.

The exact payment fields, accepted payment types, proof/receipt requirements, and customer installment calculation are still open requirements. “Manual payment entry” means recording an actual offline payment; it does not mean that the application will process or automatically collect money.

## 2. Technical architecture

- **Web:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- **Authentication:** Better Auth owns the auth tables and session. Application roles and warehouse business records are managed server-side.
- **Database:** PostgreSQL in the `app` schema for the current single-organization warehouse model. The Next.js server connects through `DATABASE_URL`; browser code must use the application API and must not query business tables directly.
- **Evidence files:** private Supabase Storage bucket `warehouse-evidence`, accessed only from the server through `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL`.
- **Business scope:** one organization, multiple branches, warehouses assigned to branches. Roles are `ADMIN`, `CEO`, `MANAGER`, `COUNTER_STAFF`, and `EMPLOYEE`; the server enforces permissions and branch scope.
- **Stock integrity:** posted movements are immutable. Reversals create new records. Stock posting uses transactions and idempotency keys.

The active migration sequence is in [`supabase/migrations`](../supabase/migrations). `20260926000000_single_org_warehouse.sql` is the warehouse rebuild; later migrations add employee profiles, account settings, and audit query indexes. The older [`schema.md`](history/schema.md) and earlier WMS specifications describe another database design and must not be used as the current schema contract.

## 3. Implemented application areas

| User-facing area | Route | Main behavior |
| --- | --- | --- |
| Workspace | `/workspace` | Entry point to available modules |
| Account and settings | `/account`, `/settings` | Personal profile and organization settings |
| Control panel | `/controlpanel` | Organization, members, branches and audit views |
| Warehouse overview | `/warehouse` | Warehouse summary |
| Product inventory | `/warehouse/inventory` | Product catalog and stock view |
| Branch catalog | `/warehouse/branches` | Branch and warehouse catalog management |
| Receiving | `/warehouse/receive` | PO, supplier receipt, carrier receipt, confirmation, count and stock posting |
| Stock and transfers | `/warehouse/stock`, `/warehouse/transfer`, `/warehouse/movements` | Balances, issues, adjustments, immediate transfers, ledger and reversal |
| Issues and reports | `/warehouse/issues`, `/warehouse/reports` | Operational issue tracking and inbound reports |
| HP Datacenter | `/datacenter` | Under-development placeholder |

### Current inbound workflow

1. An administrator sets the organization and creates branches, warehouses, units, suppliers, and products.
2. An authorized user records the PO and the CEO who actually placed the order.
3. Supplier and carrier documents and their evidence are recorded against the PO.
4. The receiving member confirms the branch and package condition.
5. The member counts good, damaged, and wrong items. Exceptions create issues.
6. Posting adds only good counted quantities to stock. The operation is idempotent and writes inventory records transactionally.
7. Users track outstanding PO quantities, receipt history, stock ledger, issues, and audit history according to role.

### Current stock transfer behavior

The transfer form writes a completed stock transfer directly: it reduces the source warehouse and increases the destination warehouse in one operation. It does **not** create a request/approval queue, reserve stock, generate pick/pack tasks, record dispatch or shipment, or wait for destination receiving. The transfer audit route currently redirects to the issues page.

## 4. API overview

Warehouse API handlers live under [`app/api`](../app/api); shared browser request wrappers are in [`lib/api/warehouse.ts`](../lib/api/warehouse.ts), shared request/response types are in [`lib/contracts/warehouse.ts`](../lib/contracts/warehouse.ts), and domain services are in [`lib/warehouse`](../lib/warehouse).

All business API calls require an authenticated Better Auth session. The server derives role and branch permissions from the session; client-supplied role or branch scope is never authorization. JSON responses use a `data` envelope and request ID; errors use an `error` envelope and request ID.

| Domain | Main routes |
| --- | --- |
| Identity and organization | `/api/me`, `/api/me/change-password`, `/api/org`, `/api/org/ceos` |
| Members | `/api/org/members`, `/api/org/members/{memberId}` and member restore/password actions |
| Catalog and products | `/api/catalog/{kind}`, `/api/catalog/{kind}/{entityId}`, `/api/warehouse/inventory/products` |
| Purchasing and receiving | `/api/purchase-orders`, `/api/supplier-receipts`, `/api/carrier-receipts`, `/api/goods-receipts` |
| Stock | `/api/stock/balances`, `/api/stock/ledger`, `/api/stock/documents`, `/api/stock/documents/{documentId}/reverse` |
| Issues and evidence | `/api/issues`, `/api/media` |
| Reports and audit | `/api/reports/receipts`, `/api/reports/outstanding`, `/api/audit` |

Stock posting requires an `Idempotency-Key`. Counts support up to three decimal places; money is THB with up to two decimal places. See route handlers and service validation for the definitive request contract.

## 5. Database and data protection

The current business schema is defined by the active SQL migrations, not by the archived September 19 snapshot. The current model includes organization settings, app users and branch memberships, warehouses assigned to branches, product masters, purchase and receipt documents, inventory documents/lines, stock balances and ledger, issues/claims, evidence links, audit records, and idempotency data. Stock is tracked by product and warehouse (with the warehouse belonging to a branch); it does not track an aisle, shelf, bin, or exact storage address. That matches the current operating requirement.

The current schema does not contain customer accounts, hire-purchase contracts, repayment schedules, customer payment records, employee installment loans, or payroll deduction records. Employee profile data is not a lending/credit model.

Never run the one-time database rebuild script against a database containing data that must be retained. Review [`scripts/rebuild-database.mjs`](../scripts/rebuild-database.mjs) and the migration history before any database reset or migration action.

## 6. Setup and operations

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Available project scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server (Webpack) |
| `npm run build` | Production build (Webpack) |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Vitest suite |
| `npm run bootstrap:admin -- admin@example.com` | Bootstrap an explicitly selected administrator |

Runtime configuration must be supplied through the local/deployment environment, not committed. The application needs database and Better Auth configuration. Evidence upload additionally needs `NEXT_PUBLIC_SUPABASE_URL` and server-only `SUPABASE_SERVICE_ROLE_KEY`; never expose the service role key through a `NEXT_PUBLIC_` variable. Email delivery is feature-gated and requires valid Resend credentials before enabling it.

On a fresh environment, apply the repository's Supabase migrations in timestamp order, then configure the initial administrator and business records. Do not use `scripts/rebuild-database.mjs` as a routine migration command: it is destructive and intended only for a legacy database transition.

## 7. Known gaps and recommended roadmap

These are feature gaps, not claims that an implementation already exists.

1. **Sales & Customer Receivables:** define and build customer/debtor records and a staff-entered offline sales workflow. Decide how completed sales connect to warehouse stock and how receivables are created.
2. **Customer installment records and collections:** define contract terms, repayment schedule, fees/interest, manual payment entry, adjustments, reversals, and permissions before building financial records. No automatic payment deduction is planned.
3. **Cycle count:** count physical quantities by warehouse and SKU, review variance, and post controlled adjustments. No shelf/bin address is required.
4. **Transfer fulfillment:** request and approval, reservation, quantity picking from the source warehouse, packing, dispatch/in-transit, and destination receiving. Picking can reference SKU and quantity without a bin location.
5. **Logistics and claims:** shipment events, exceptions, SLA and resolution workflow.

Bin-level Location Master and Putaway should be added only if operations later need to know the exact shelf/bin for each item. They are not prerequisites for the current branch-warehouse stock model.

The formal Business Model for customer sales and finance was not present in the archived Markdown or Git history. This guide now records the direction agreed in the current project discussion: staff-entered offline sales, manual recording of actual customer payments, customer receivables/installments, and a separate organization/employee administration area. Payment, contract, and accounting rules remain open requirements. The old WMS roadmap in [`history/DESIGN.md`](history/DESIGN.md) remains a proposal for warehouse logistics only; it does not define the sales or finance modules.

## 8. Development rules

- Before changing Next.js code, read the applicable guide under `node_modules/next/dist/docs/`; this repository uses a Next.js version with breaking changes.
- For loading UI, use the existing `SkeletonBox`/route skeleton components or `Loader2` for action feedback. Do not add bare loading paragraphs or plain-text loading messages inside JSX.
- Keep authorization and validation in server-side API/service layers. Do not trust the browser for roles, branch scopes, stock totals, or financial amounts.
- Use transactions and idempotency for stock mutations. Do not edit or delete posted ledger history; use reversal workflows.
- Keep feature status synchronized with the code. A menu entry, marketing statement, role description, mockup, or preview screen is not evidence that a module is operational.

## 9. Historical documents

The files in [`docs/history`](history/) are preserved source documents, reports, plans, handoffs, and previous schema/design snapshots. They are not separate current manuals. If a historical detail is still useful, reconcile it with the active code and migrations before relying on it.
