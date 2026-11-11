# DAWH — คู่มือโครงสร้างไฟล์ Flow และ Feature ปัจจุบัน

> ตรวจจาก source tree ปัจจุบัน ณ 7 พฤศจิกายน 2026; อัปเดตส่วน Sales/A/R และ DB cleanup 11 พฤศจิกายน 2026  
> Source of truth: application code และ `supabase/migrations/`  
> เอกสารใน `docs/history/` เป็นหลักฐานย้อนหลัง ไม่ใช่สัญญาของระบบปัจจุบัน

## 1. ขอบเขตและวิธีอ่าน

คู่มือนี้อธิบายไฟล์ที่เป็นส่วนของ repository ได้แก่ source code, configuration, test, SQL migration/seed, reference data, documentation และ brand asset ส่วน `node_modules/`, `.next/`, `.git/`, build/cache output, `*.tsbuildinfo`, lockfile และ secret ใน `.env` ไม่อยู่ในขอบเขต

สถานะที่ใช้:

- **Current** — ถูกใช้ใน runtime หรือเป็น contract ปัจจุบัน
- **Preview** — มีหน้าจอ/ข้อความ แต่ยังไม่มี data model หรือ backend ที่ทำงานจริง
- **Historical** — เอกสารหรือแนวคิดเก่าที่อาจไม่ตรงกับโค้ดปัจจุบัน
- **Legacy/unused** — ยังอยู่ใน repository แต่ไม่มี import/runtime path ที่ยืนยันการใช้งาน
- **Generated/binary** — อธิบายหน้าที่และผู้ใช้ไฟล์ ไม่ถอดข้อมูลไบนารีภายใน

## 2. ภาพรวมระบบ

DAWH เป็น modular monolith บน Next.js 16 App Router และ React 19 เขียนด้วย TypeScript/Tailwind CSS 4 ฝั่ง browser ไม่อ่าน business tables โดยตรง แต่เรียก Route Handler ใต้ `app/api/`; handler ใช้ shared HTTP wrapper, อ่าน Better Auth session, แปลงเป็น application actor, ตรวจ role/branch scope แล้วเรียก service ใต้ `lib/warehouse/` เพื่อทำ SQL ผ่าน `pg`

```text
Browser page/component
  -> warehouseApi / apiRequest (cookie session, no-store, GET timeout)
  -> app/api/**/route.ts
  -> apiRoute (request timing + normalized errors)
  -> getActor (Better Auth session + app.app_users + branch memberships)
  -> domain service (validation + authorization)
  -> transaction / PostgreSQL app schema
  -> { data, meta.requestId, page? } หรือ { error, requestId }
```

องค์ประกอบสำคัญ:

- Better Auth เก็บ credential/session ใน schema `public`; role และ branch membership ของธุรกิจอยู่ใน schema `app`
- Role ปัจจุบันคือ `ADMIN`, `CEO`, `MANAGER`, `COUNTER_STAFF`, `EMPLOYEE`; `ADMIN`/`CEO` มองข้อมูลทุกสาขา ส่วน role อื่นถูกจำกัดด้วย `branch_memberships`
- stock movement ที่ post แล้วไม่ถูกแก้ย้อนหลัง การแก้ใช้เอกสาร `REVERSAL`; balance, document line และ immutable movement ถูกเขียนใน transaction เดียวกัน
- evidence อยู่ใน private Supabase Storage bucket `warehouse-evidence`; API ตรวจสิทธิ์แล้วสร้าง signed URL อายุ 60 วินาที
- mutation ของ stock ใช้ `Idempotency-Key`; API มี `x-request-id` และ `Server-Timing` สำหรับ auth/actor/pool/query/total
- module `warehouse` และ `sales` (Sales + A/R) ใช้งานจริง, `reports` ระดับ workspace เป็น placeholder แต่ `/warehouse/reports` เป็นรายงานคลังที่ใช้งานจริง

## 3. Flow และ Feature แบบ end-to-end

### 3.1 เข้าเว็บ ล็อกอิน และ Workspace

1. `proxy.ts` เติมหรือส่งต่อ `x-request-id` ทุก request ยกเว้น static/image/favicon
2. `/` เรียก `getSession()`; ถ้ามี session ไป `/workspace`, ถ้าไม่มีแสดง landing page, ถ้า auth backend ใช้ไม่ได้แสดง `AuthUnavailable`
3. `/auth` และ `/auth/login` ใช้ `AuthView`; การสมัครผ่าน UI มีโค้ดรองรับแต่ Better Auth ตั้ง `disableSignUp: true` และ `/auth/register` redirect กลับ login ดังนั้นบัญชีใช้งานจริงต้องถูกสร้างโดย admin
4. login สำเร็จเก็บรายการบัญชีล่าสุดใน local storage, prefetch เป้าหมาย และไป URL ใน `from` หรือ `/workspace`; logout ล้าง browser state/cookie และกระจาย event ข้ามแท็บ
5. `WarehouseAccountProvider` โหลด `/api/me` เฉพาะ protected path และเก็บ actor ปัจจุบันให้ layouts/components ใช้
6. Workspace โหลด `/api/modules/status`; card ที่ปิดจะแสดง maintenance reason ส่วน card ที่เปิดเรียก navigation loading overlay ก่อนเปลี่ยน route

### 3.2 Module availability

- Admin เปลี่ยนสถานะ `datacenter`, `warehouse`, `sales`, `reports` ผ่าน `/api/modules/status`
- การปิด module ต้องมีเหตุผล 1–500 ตัวอักษรและบันทึก audit event; history filter ได้ตาม module/status/date
- `ModuleAvailabilityGuard` โหลดสถานะใน client; ถ้าปิดจะ redirect ไปหน้า maintenance พร้อมส่งเหตุผลผ่าน query string

### 3.3 Organization, member และ account

1. `ADMIN` ตั้งค่า organization record เดียว (`id=1`) และแก้ชื่อ/โทรศัพท์/ที่อยู่
2. Admin สร้าง Better Auth user พร้อม `app.app_users`, branch memberships และ optional member profile; password เริ่มต้นขั้นต่ำ 8 ตัว
3. Non-global role ต้องมีอย่างน้อยหนึ่ง branch; ADMIN/CEO ไม่จำเป็นต้องผูก branch
4. Admin แก้ role, branches, email, profile, reset password, soft-delete และ restore สมาชิก; ระบบกันการลดสิทธิ์/ลบ admin คนสุดท้าย
5. ผู้ใช้แก้ข้อมูลส่วนตัวของตัวเองได้ แต่ email/role/branch เป็น admin-only; เปลี่ยน password จะ revoke session อื่น
6. `/account` เน้นข้อมูลบัญชี/ประวัติการทำงานและ security ส่วน `/settings` เป็น preference ฝั่ง browser เช่น theme, toast, sound และ security display

### 3.4 Master data และสินค้า

- Catalog มี branches, warehouses, suppliers, units, product groups/categories, brands/models และ products
- `ADMIN`/`CEO` แก้ catalog ได้; `MANAGER` แก้ warehouse ได้; `EMPLOYEE` อ่านได้เฉพาะ branch/product projection ที่จำกัด
- list แบบ lookup จำกัด 50 รายการ, list ปกติแบบ legacy จำกัด 500, หน้าตารางใช้ offset pagination และ filter/search
- inventory product view รวม master data กับ on-hand ตาม branch/warehouse และคำนวณ `in_stock`, `low_stock`, `out_of_stock`
- product detail แสดง stock กระจายตามสาขา และ stock manager สามารถสร้าง adjustment จากหน้าสินค้า

### 3.5 Inbound receiving

```text
PO -> Supplier receipt/evidence -> Carrier receipt/evidence
   -> Delivery confirmation -> Goods count
   -> discrepancy + issue (ถ้ามี) -> Post good quantity to stock
```

1. `ADMIN|CEO|MANAGER|COUNTER_STAFF` สร้าง PO โดยระบุ supplier, CEO ผู้สั่งจริง, วันที่ และ product lines; PO แก้ได้ก่อนมี supplier/carrier evidence และปิดได้โดย ADMIN/CEO/MANAGER
2. Supplier receipt ต้องตรง supplier ของ PO, มี line ที่อยู่ใน PO และต้องแนบ evidence; duplicate document number/hash เป็น warning ไม่ใช่ hard error
3. Carrier receipt สร้างได้ถึง `EMPLOYEE`, อ้าง PO code, แนบ evidence และอาจไม่มี SKU line; employee ยืนยัน delivery เข้า branch ที่ตนมีสิทธิ์ได้
4. หลัง confirmation, `COUNTER_STAFF` ขึ้นไปบันทึก goods count ลง warehouse ใน branch เดียวกัน แยก good/damaged/wrong และตรวจ serial ต่อ good item
5. ถ้ามี damaged/wrong ต้องแนบรูปและระบบสร้าง discrepancy, issue และ initial issue event ใน transaction เดียวกัน
6. การ post goods receipt เพิ่มเฉพาะ good quantity, ห้ามเกิน PO, สร้าง inventory document/lines/movements/balance/serials และ idempotency record ใน transaction เดียวกัน

### 3.6 Stock, transfer และ reversal

- Balance และ ledger จำกัด branch scope; ตารางกรอง warehouse/product/date/kind/operator/search ได้
- `ADMIN|CEO|MANAGER` post `ISSUE`, `ADJUSTMENT`, `TRANSFER`; reason บังคับและ serial-tracked product ต้องระบุ serial ครบ
- transfer ปัจจุบันเป็นการลดต้นทางและเพิ่มปลายทางทันทีผ่าน inventory document คู่ ไม่ใช่ request/approval/pick/pack/shipping workflow
- การตัด stock ใช้ conditional update ที่ห้าม balance ติดลบ
- reversal สร้างเอกสารใหม่และ movement ตรงข้ามทั้งคู่สำหรับ transfer; serial และ goods receipt reversal state ถูกปรับหลัง balance movements สำเร็จ
- `/warehouse/transfer/audit` ปัจจุบันเป็น status/audit board ของ transfer จริง ไม่ได้ redirect ไป issue ตามเอกสารเก่าบางฉบับ

### 3.7 Issue, claim, report และ audit

- Issue อาจเชื่อม PO/carrier/goods receipt/product; service ตรวจว่าเอกสารทั้งหมดอยู่ใน PO เดียวกันและตรวจ branch scope
- state transition ที่อนุญาต: `OPEN -> FOLLOWING_UP|RESOLVED|CLOSED`, `FOLLOWING_UP -> RESOLVED|CLOSED`, `RESOLVED -> CLOSED|FOLLOWING_UP`; `CLOSED` จบ flow
- claim note เก็บผู้ติดต่อ, เวลา, external reference, follow-up และ outcome
- warehouse reports มี receipt line report และ outstanding PO line report แบบ cursor pagination
- audit log สำหรับ ADMIN/CEO แบ่ง category/action/entity type ค้น actor/entity id, date range และ sort ได้

### 3.8 Sales และ Accounts Receivable (A/R)

กติกาธุรกิจที่ตกลงและ implement แล้วอยู่ใน `docs/requirements/sales-ar.md` หัวข้อ 8 ส่วนนี้สรุป flow ของโค้ด

```text
ลูกค้า -> บิลสด/บิลผ่อน (ตัดสต็อก SALE ใน transaction เดียว)
   -> บิลผ่อน: terms + ตารางงวด + ผู้ค้ำ + เงินดาวน์
   -> บันทึกค่างวด (FIFO) -> ปิดสัญญาเมื่อคงค้าง 0
   -> A/R อ่านอย่างเดียว / พิมพ์บิลและใบเสร็จ
```

1. Role ที่ใช้ Sales: `ADMIN|CEO|MANAGER|COUNTER_STAFF`; `EMPLOYEE` ได้ 403 ทุก sales API; ยกเลิกบิลและ void ค่างวดเฉพาะ `ADMIN|CEO|MANAGER`
2. ทุก sales API เรียก `requireModuleEnabled("sales")` ก่อน ถ้า module ปิดตอบ 503 `MODULE_DISABLED` (ฝั่ง server จริง ไม่ใช่แค่ UI guard)
3. ทะเบียนลูกค้าเป็นชุดเดียวทั้งองค์กร: บังคับชื่อ+เบอร์โทร, เลขบัตรประชาชน 13 หลักไม่บังคับแต่ห้ามซ้ำ
4. บิล: 1 บิล = 1 คลัง, สาขาของบิล = สาขาของคลัง (ใช้กำหนดสิทธิ์ดูบิล); ฟอร์มขายเลือกสินค้าจาก `/api/sales/stock` เฉพาะที่มีของในคลังนั้น, เติม `sale_price` อัตโนมัติ (แก้ได้) และเลือก serial ที่ `AVAILABLE`
5. บันทึกบิล: สร้าง `inventory_documents.kind='SALE'`, ตัดสต็อกผ่าน `postInventoryLine` (สต็อกไม่พอ 409), issue serial, บันทึก lines/payment และ idempotency key ใน transaction เดียว; เงินคำนวณเป็นสตางค์ (BigInt)
6. บิลผ่อน: ดอกเบี้ยคิดจากราคาเต็ม, ค่างวดปัด half-up 2 ตำแหน่ง, งวดสุดท้ายรับเศษ (`lib/sales/schedule.ts`); วันครบกำหนดรายเดือน clamp สิ้นเดือน; ผู้ค้ำ 0..n ต่อสัญญา; เงินดาวน์ > 0 เป็นแถว `DOWN_PAYMENT`
7. ค่างวด: ตัดงวดเก่าสุดก่อน (FIFO), จ่ายเกินคงค้าง 409 `OVERPAYMENT`, ปิดสัญญา (`sales.closed_at`) อัตโนมัติ; void ได้เฉพาะรายการค่างวดล่าสุดโดยคืนยอดจากงวดท้ายถอยกลับ (ไม่มีตาราง allocation)
8. ยกเลิกบิล: ต้องมีเหตุผล, คืนสต็อกด้วย REVERSAL และ void payments ใน transaction เดียว; บิลผ่อนที่มีค่างวดที่ยังไม่ void ยกเลิกไม่ได้ (409 `HAS_INSTALLMENT_PAYMENTS`); warehouse reverse API ปฏิเสธเอกสาร `SALE` (409 `SALE_DOCUMENT`)
9. สถานะงวดคำนวณตอนอ่าน: `PAID|PARTIAL|OVERDUE|UPCOMING` (OVERDUE = ครบกำหนดก่อนวันนี้ Asia/Bangkok และยังจ่ายไม่ครบ); ไม่มีค่าปรับ/เกรดเครดิต
10. A/R (`/sales/ar/**`) อ่านอย่างเดียว ลิงก์กลับไป Sales เมื่อต้องทำรายการ
11. เอกสารพิมพ์เป็น HTML + `window.print()` (A4, บังคับ light mode) ไม่มี PDF library; มีจำนวนเงินเป็นตัวอักษรไทย (`lib/sales/baht-text.ts`) และระบุว่า "ไม่ใช่ใบกำกับภาษี"

### 3.9 Module ที่ยังไม่เสร็จ
- `/datacenter`, `/integration` และ workspace-level `/reports` เป็น placeholder/maintenance experience
- `/controlpanel/user-scopes`, `/controlpanel/account-status`, `/controlpanel/master-data` เป็น roadmap page ไม่ใช่ CRUD ที่เชื่อม backend

## 4. Route map ปัจจุบัน

### User-facing routes

| Route | Entry component | สถานะ/หน้าที่ |
| --- | --- | --- |
| `/` | `app/page.tsx` | session-aware landing/redirect |
| `/auth`, `/auth/login` | `AuthView` | login; signup UI ไม่ใช่ public registration |
| `/workspace` | `Workspace` | module hub + module status |
| `/warehouse` | `OverviewScreen` | warehouse dashboard |
| `/warehouse/inventory` | `InventoryContent` | product inventory หรือ catalog ตาม `kind` |
| `/warehouse/branches`, `/warehouse/suppliers` | `CatalogScreen` | catalog shortcut |
| `/warehouse/receive` | `ReceiveScreen` | PO ถึง stock posting |
| `/warehouse/stock` | `StockScreen` | balance/ledger/mutation |
| `/warehouse/movements` | `StockScreen` | ledger-only view |
| `/warehouse/transfer` | `TransferScreen` | direct transfer |
| `/warehouse/transfer/audit` | `TransferAuditBoard` | transfer history/status |
| `/warehouse/issues` | `IssuesScreen` | issue + claim tracking |
| `/warehouse/reports` | `ReportsScreen` | inbound/outstanding reports |
| `/controlpanel/**` | `ControlPanel` และ admin pages | users, branches, products, audit, module status |
| `/account`, `/settings` | account/settings components | profile/security/preferences |
| `/sales` | `SalesOverview` | ภาพรวมขาย + ตัวเลขจาก A/R overview |
| `/sales/transactions`, `/sales/transactions/new` | `SalesTransactionsPage`, `NewSalePage` | รายการบิล/รายละเอียด/ยกเลิก และสร้างบิลสด/ผ่อน |
| `/sales/customers` | `CustomersPage` | ค้นหา/เพิ่ม/แก้ลูกค้า |
| `/sales/installments` | `InstallmentsPage` | บันทึกและ void ค่างวด (`?saleId=` preselect) |
| `/sales/ar`, `/sales/ar/customers[/id]`, `/sales/ar/contracts`, `/sales/ar/payments`, `/sales/ar/overdue` | `components/sales/ar/*` | A/R read-only |
| `/print/sales/bills/[saleId]`, `/print/sales/receipts/[paymentId]` | `BillPrint`, `ReceiptPrint` | เอกสารพิมพ์ A4 นอก sidebar layout |
| `/datacenter`, `/integration`, `/reports` | blocker views | Placeholder |

### API groups

| กลุ่ม | Routes | Service หลัก |
| --- | --- | --- |
| Auth/account | `/api/auth/**`, `/api/me/**` | Better Auth, account security |
| Organization/member | `/api/org`, `/api/org/members/**`, `/api/org/ceos` | members/profile services |
| Module status | `/api/modules/status/**` | `lib/modules/status.ts` |
| Catalog/inventory | `/api/catalog/**`, `/api/warehouse/inventory/products` | catalog/inventory read |
| Purchasing/receiving | `/api/purchase-orders/**`, supplier/carrier/goods receipt routes | inbound services |
| Stock | `/api/stock/**` | stock read + stock documents |
| Issues/evidence | `/api/issues/**`, `/api/media/**` | issues/media |
| Reports/audit/dashboard | `/api/reports/**`, `/api/audit`, `/api/warehouse/**` | reports/audit/dashboard |
| Sales | `/api/sales/customers/**`, `/api/sales/bills/**`, `/api/sales/stock`, `/api/sales/payments/**` | `lib/sales/customers.ts`, `sales.ts`, `payments.ts` |
| A/R | `/api/sales/ar/overview`, `/overdue`, `/payments`, `/customers/[id]` | `lib/sales/receivables.ts` |
| Health | `/api/health/live`, `/api/health/ready` | process/database readiness |

## 5. Database model ปัจจุบัน

- `public.user`, `session`, `account`, `verification`, `rateLimit`: Better Auth
- `app.organization_settings`, `app_users`, `member_profiles`, `branches`, `branch_memberships`: organization/people/access
- `warehouses`, `suppliers`, product group/category/brand/model/unit/product/serial tables: master data
- `purchase_orders`/lines, supplier/carrier receipts/lines, delivery confirmations, goods receipts/lines/discrepancies: inbound documents
- `inventory_documents`/lines, `stock_movements`, `stock_balances`: immutable inventory ledger และ materialized balance
- `issue_reports`, `issue_events`, `claim_tracking`: exception/claim lifecycle
- `media_assets`, `evidence_links`: private evidence metadata/linking
- `audit_events`, `document_revisions`, `idempotency_keys`: traceability/concurrency safety
- `module_statuses`: เปิด/ปิด module พร้อม maintenance reason

- `customers`: ทะเบียนลูกค้าทั้งองค์กร
- `sales` (`SO-`): บิลสด/ผ่อน, คลัง/สาขา, `inventory_document_id` (เอกสาร `SALE`), cancel fields และ terms ของบิลผ่อน (`down_payment`, `interest_rate`, `interest_amount`, `financed_amount`, `months`, `installment_amount`, `first_due_on`, `closed_at`) — CHECK บังคับว่า terms มีครบเฉพาะ INSTALLMENT
- `sale_lines`, `sale_installments` (`paid_amount ≤ amount`), `sale_guarantors`
- `sale_payments` (`RC-`): `CASH_SALE|DOWN_PAYMENT|INSTALLMENT`, ช่องทาง `TRANSFER|CASH|CREDIT_CARD`, void fields — ช่องทางชำระอยู่ที่นี่เท่านั้น (ไม่มี `sales.payment_method`)
- `stock_balances` มี CHECK `quantity >= 0` เป็นด่านที่สองต่อจาก `postInventoryLine`

ไม่มี payroll, credit grade, debt follow-up, refund/return หรือ shelf/bin tables ใน migration ปัจจุบัน

## 6. คำอธิบายรายไฟล์

### 6.1 ไฟล์ระดับ root

- `AGENTS.md` — กติกาสำหรับ agent: ต้องอ่าน Next.js docs ของ version ที่ติดตั้งก่อนแก้โค้ด และห้ามใช้ plain-text loading ใน JSX
- `CLAUDE.md` — instruction/context สำหรับ Claude tooling; ไม่ถูก import โดย runtime
- `README.md` — entry documentation สั้น ๆ ระบุ product boundary, คำสั่งพัฒนา และชี้ไป `docs/DAWH.md`
- `.env.example` — template ของ database pool/timeout, Better Auth, Supabase evidence storage และ optional Resend; ไม่มี secret จริง
- `package.json` — dependency และ scripts: dev/build ผ่าน Webpack, lint, typecheck, Vitest และ bootstrap admin
- `next.config.ts` — ปิด dev indicators และ allow remote images จาก Unsplash/Supabase
- `tsconfig.json` — strict TypeScript, bundler resolution, alias `@/*`, no emit
- `eslint.config.mjs` — Next core-web-vitals/TypeScript rules และ ignore build outputs
- `postcss.config.mjs` — เปิด Tailwind CSS 4 PostCSS plugin
- `vitest.config.mts` — test เฉพาะ `lib/**/*.test.ts`, map `@` และแทน `server-only` ด้วย test stub
- `translations.ts` — translation map รุ่นเก่าระดับ application; UI ปัจจุบันส่วนใหญ่ใช้ inline copy หรือ `config/translations.ts`
- `proxy.ts` — request-ID proxy ของ Next.js; validate incoming ID หรือสร้าง UUID แล้วใส่ทั้ง request/response header

### 6.2 `app/` — layouts, pages และ loading boundaries

- `app/layout.tsx` — root metadata/fonts/providers: theme, global loading, notification, auth loading และ account context
- `app/globals.css` — Tailwind import, color variables, theme classes, animation, scrollbar และ shared visual rules ทั้งระบบ
- `app/page.tsx` — root session gate: signed-in ไป workspace, signed-out เห็น landing
- `app/loading.tsx` — root App Router loading UI ที่ใช้ `LoadingScreen`
- `app/not-found.tsx` — 404 blocker view พร้อมทางกลับ workspace
- `app/_components/AuthUnavailable.tsx` — fallback เมื่อ session/auth service ล้มเหลว
- `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png` — metadata icons ที่ Next.js ตรวจอัตโนมัติ

#### Authentication, landing และ workspace

- `app/auth/page.tsx` — server-side session check แล้ว render sign-in view
- `app/auth/login/page.tsx` — canonical login route พร้อม metadata และ session redirect
- `app/auth/register/page.tsx` — redirect ไป login เพราะ public registration ไม่เปิด
- `app/auth/loading.tsx` — auth route skeleton/loading boundary
- `app/login/page.tsx` — compatibility redirect ไป `/auth/login`
- `app/landing-page/layout.tsx` — metadata/layout เฉพาะ public landing
- `app/landing-page/page.tsx` — หน้า marketing ขนาดใหญ่ มี hero, module showcase, benefit/CTA และ responsive motion; ไม่ใช่หลักฐานว่า module ทุกตัว implement แล้ว
- `app/landing-page/translations.ts` — bilingual copy ทั้งหมดของ landing page
- `app/workspace/page.tsx` — server session guard แล้วแสดง module hub
- `app/workspace/loading.tsx` — workspace skeleton

#### Warehouse pages

- `app/warehouse/layout.tsx` — protected client layout, sidebar state, theme, account redirect และ module availability guard
- `app/warehouse/page.tsx` — wrapper ของ `OverviewScreen`
- `app/warehouse/_components/WarehousePageTemplate.tsx` — frame มาตรฐานของหน้าคลัง: header, back/navigation loading, responsive content และ error/loading state
- `app/warehouse/branches/page.tsx` — เปิด `CatalogScreen` ที่ชนิด branches
- `app/warehouse/branches/loading.tsx` — catalog skeleton
- `app/warehouse/suppliers/page.tsx` — เปิด supplier catalog
- `app/warehouse/suppliers/loading.tsx` — catalog skeleton
- `app/warehouse/receive/page.tsx` — inbound receiving screen
- `app/warehouse/receive/loading.tsx` — receiving skeleton
- `app/warehouse/stock/page.tsx` — balance/ledger tabs
- `app/warehouse/stock/loading.tsx` — stock skeleton
- `app/warehouse/movements/page.tsx` — ledger-only configuration ของ StockScreen
- `app/warehouse/movements/loading.tsx` — ledger skeleton
- `app/warehouse/transfer/page.tsx` — direct transfer screen
- `app/warehouse/transfer/loading.tsx` — transfer skeleton
- `app/warehouse/transfer/audit/page.tsx` — transfer status/audit table
- `app/warehouse/transfer/audit/loading.tsx` — transfer audit skeleton
- `app/warehouse/issues/page.tsx` — issue/claim screen
- `app/warehouse/issues/loading.tsx` — issue skeleton
- `app/warehouse/reports/page.tsx` — warehouse reports screen
- `app/warehouse/reports/loading.tsx` — report skeleton
- `app/warehouse/alerts/page.tsx` — compatibility redirect ไป `/warehouse/issues`
- `app/warehouse/analysis/page.tsx` — compatibility redirect ไป `/warehouse/reports`
- `app/warehouse/inventory/page.tsx` — validate `kind` query และเลือก product/catalog view; รองรับ typo `branchs`
- `app/warehouse/inventory/InventoryContent.tsx` — dynamic import boundary เลือก product split view หรือ catalog screen
- `app/warehouse/inventory/ProductInventorySplitView.tsx` — inventory table/detail panel, filters, product create/edit และ stock adjustment
- `app/warehouse/inventory/InventoryLoading.tsx` — product/catalog skeleton exports
- `app/warehouse/inventory/loading.tsx` — route loading wrapper
- `app/warehouse/inventory/[sku]/page.tsx` — route เดิมที่ redirect กลับ inventory list; ไม่มี SKU detail URL แยก

#### Control panel/account/settings

- `app/controlpanel/layout.tsx` — protected admin layout, sidebar/mobile navigation, route-to-tab mapping และ audit category header
- `app/controlpanel/page.tsx` — redirect ไป users
- `app/controlpanel/users/page.tsx` — member management tab
- `app/controlpanel/branches/page.tsx` — branch management tab ใน ControlPanel
- `app/controlpanel/products/page.tsx` — product inventory view แบบซ่อนปุ่มเพิ่มสินค้า
- `app/controlpanel/audit-log/page.tsx` — redirect ไป audit category `catalog`
- `app/controlpanel/audit-log/[category]/page.tsx` — server validate category/role ก่อน render audit table
- `app/controlpanel/module-status/page.tsx` — ADMIN-only module status page
- `app/controlpanel/module-status/history/page.tsx` — ADMIN-only status history
- `app/controlpanel/access-preview/page.tsx` — preview ตารางสิทธิ์ ไม่ใช่ permission editor
- `app/controlpanel/user-scopes/page.tsx` — roadmap/empty API state
- `app/controlpanel/account-status/page.tsx` — roadmap/empty API state
- `app/controlpanel/master-data/page.tsx` — roadmap/empty API state
- `app/account/page.tsx` — own profile/security page
- `app/settings/page.tsx` — personal UI preferences page

#### Sales และ placeholder modules

- `app/sales/layout.tsx` — protected sales shell แบบเดียวกับ warehouse (sidebar, rAF sidebar state) และ module guard
- `app/sales/page.tsx`, `transactions/page.tsx`, `transactions/new/page.tsx`, `customers/page.tsx`, `installments/page.tsx` — thin pages ของ Sales components (installments ห่อ Suspense เพราะใช้ `useSearchParams`)
- `app/sales/ar/**` — thin pages ของ A/R components (overview, customers, customer profile, contracts, payments, overdue)
- `app/print/layout.tsx` — layout เอกสารพิมพ์: พื้นขาว `color-scheme: only light`, `@page A4 12mm`, `print-color-adjust: exact`
- `app/print/sales/bills/[saleId]/page.tsx`, `app/print/sales/receipts/[paymentId]/page.tsx` — หน้าพิมพ์บิลและใบเสร็จ
- `app/datacenter/page.tsx` — module-guarded under-development blocker
- `app/integration/page.tsx` — under-development blocker ที่ยังไม่อยู่ใน managed module status list
- `app/reports/page.tsx` — workspace-level reports blocker พร้อม countdown กลับ workspace
- `app/maintenance/page.tsx` — maintenance UI และ local-storage schedule simulation; แยกจาก server-backed `module_statuses`
- `app/test/page.tsx` — internal table design playground; ไม่ใช่ production business feature

### 6.3 `app/api/` — HTTP entrypoints

Route handlers ส่วนใหญ่ตั้ง `runtime = "nodejs"`, ใช้ `apiRoute`, `getActor`, service function และ response envelope ร่วมกัน ไฟล์สั้นไม่ได้แปลว่าไม่มี business logic เพราะ logic อยู่ใน `lib/warehouse/`

#### Auth/account/organization

- `app/api/auth/[...all]/route.ts` — mount Better Auth GET/POST handler ทั้งหมด
- `app/api/auth/logout/route.ts` — database-free cookie cleanup สำหรับ logout ที่ยังทำงานได้เมื่อ DB มีปัญหา
- `app/api/me/route.ts` — actor/current-user projection พร้อมชื่อไทย/อังกฤษ
- `app/api/me/change-email/route.ts` — direct email change endpoint ผ่าน password/verification policy
- `app/api/me/change-password/route.ts` — เปลี่ยนรหัสผ่านและ revoke session อื่น
- `app/api/org/route.ts` — GET organization; ADMIN POST initial setup และ PATCH update พร้อม transaction/audit
- `app/api/org/ceos/route.ts` — รายการ CEO ที่ใช้เลือกผู้สั่ง PO; CEO เห็นเฉพาะตัวเองตาม query policy
- `app/api/org/members/route.ts` — list full/summary และ ADMIN create member
- `app/api/org/members/[memberId]/route.ts` — member detail, patch และ soft-delete
- `app/api/org/members/[memberId]/restore/route.ts` — restore soft-deleted member
- `app/api/org/members/[memberId]/reset-password/route.ts` — ADMIN reset credential password

#### Module status

- `app/api/modules/status/route.ts` — authenticated list และ ADMIN patch module state
- `app/api/modules/status/history/route.ts` — ADMIN-only recent/full history list
- `app/api/modules/status/history/table/route.ts` — paginated/filterable history พร้อม validation ของ status/module/date/page

#### Catalog และ warehouse reads

- `app/api/catalog/[kind]/route.ts` — GET lookup/list/page และ POST catalog item ตาม dynamic kind
- `app/api/catalog/[kind]/[entityId]/route.ts` — PATCH catalog item
- `app/api/warehouse/overview/route.ts` — compact count overview รุ่นเก่า
- `app/api/warehouse/dashboard/route.ts` — dashboard aggregation พร้อม optional date range
- `app/api/warehouse/inventory/products/route.ts` — paginated enriched inventory products

#### Purchase/receiving

- `app/api/purchase-orders/route.ts` — cursor list/create PO
- `app/api/purchase-orders/[poId]/route.ts` — full/compact detail และ update
- `app/api/purchase-orders/[poId]/close/route.ts` — close PO
- `app/api/supplier-receipts/route.ts` — cursor list/create supplier document
- `app/api/supplier-receipts/[receiptId]/route.ts` — detail/revise supplier document
- `app/api/carrier-receipts/route.ts` — cursor list/create carrier document
- `app/api/carrier-receipts/[receiptId]/route.ts` — detail/compact confirmation view/revise
- `app/api/carrier-receipts/[receiptId]/confirm/route.ts` — delivery confirmation
- `app/api/goods-receipts/route.ts` — cursor list/create count record
- `app/api/goods-receipts/[receiptId]/route.ts` — detailed count/discrepancy/evidence/issues
- `app/api/goods-receipts/[receiptId]/post/route.ts` — idempotent good-stock posting

#### Stock/issues/reports/audit/media

- `app/api/stock/balances/route.ts` — legacy unpaged หรือ offset-paged balance list
- `app/api/stock/ledger/route.ts` — legacy unpaged หรือ offset-paged immutable movement list
- `app/api/stock/network/route.ts` — thin balance projection สำหรับ warehouse/product network filter; ไม่มี graph engine แยก
- `app/api/stock/transfers/route.ts` — paginated transfer pairs พร้อม summary
- `app/api/stock/documents/route.ts` — post ISSUE/ADJUSTMENT/TRANSFER พร้อม idempotency key
- `app/api/stock/documents/[documentId]/reverse/route.ts` — reverse inventory document
- `app/api/issues/route.ts` — cursor list/create issue
- `app/api/issues/[issueId]/route.ts` — issue detail
- `app/api/issues/[issueId]/events/route.ts` — status transition/event
- `app/api/issues/[issueId]/claims/route.ts` — claim/follow-up note
- `app/api/reports/receipts/route.ts` — receipt-line report
- `app/api/reports/outstanding/route.ts` — outstanding PO-line report
- `app/api/audit/route.ts` — category-aware audit query สำหรับ ADMIN/CEO
- `app/api/media/route.ts` — upload JPG/PNG/WebP/PDF ไม่เกิน 10 MB
- `app/api/media/[assetId]/route.ts` — permission check แล้ว redirect ไป signed Storage URL

#### Sales/A/R

ทุก route เรียก `requireModuleEnabled("sales")` ก่อน `getActor`

- `app/api/sales/customers/route.ts` — cursor list/search, create ลูกค้า
- `app/api/sales/customers/[customerId]/route.ts` — detail, patch ลูกค้า
- `app/api/sales/bills/route.ts` — cursor list (`q`, `saleType`, `open`, `customerId`) และ create บิลสด/ผ่อนพร้อม `Idempotency-Key`
- `app/api/sales/bills/[saleId]/route.ts` — bill detail: lines, payments, installments+status, guarantors, organization
- `app/api/sales/bills/[saleId]/cancel/route.ts` — ยกเลิกบิล (reverse stock + void payments)
- `app/api/sales/bills/[saleId]/payments/route.ts` — บันทึกค่างวดพร้อม `Idempotency-Key`
- `app/api/sales/payments/[paymentId]/route.ts` — ข้อมูลใบเสร็จสำหรับพิมพ์
- `app/api/sales/payments/[paymentId]/void/route.ts` — void ค่างวดล่าสุด
- `app/api/sales/stock/route.ts` — สินค้าที่มีของในคลังพร้อมราคาและ serial ที่ใช้ได้ (สูงสุด 50 SKU)
- `app/api/sales/ar/overview/route.ts`, `overdue/route.ts`, `payments/route.ts`, `customers/[customerId]/route.ts` — A/R reads

#### Health

- `app/api/health/live/route.ts` — process liveness ตอบ `{status:"ok"}` โดยไม่แตะ DB
- `app/api/health/ready/route.ts` — ตรวจ DB และตารางสำคัญ `app_users`/`purchase_orders`; failure เป็น 503

### 6.4 `components/warehouse/` — business UI

- `Workspace.tsx` — module-card hub, account/module-status loading, active/maintenance badge และ navigation loading integration
- `OverviewScreen.tsx` — dashboard KPIs, date filter, movement chart, category donut, branch stock, low-stock list และ recent movements; EMPLOYEE เห็น restricted empty metrics ตาม backend
- `WarehousePageLoading.tsx` — เลือก warehouse route skeleton ให้ consistent กับ page frame
- `Ui.tsx` — shared warehouse styles, error message normalization, field/notice/empty state และ evidence upload/link UI
- `CatalogScreen.tsx` — generic catalog CRUD/table/search/filter/pagination สำหรับทุก kind; โหลด parent references สำหรับ warehouse/category/model/product
- `BranchManagement.tsx` — branch-only paginated CRUD component ที่ใช้ใน ControlPanel
- `ProductSearchSelect.tsx` — debounced product lookup ผ่าน capped `/api/catalog/products?lookup=1`
- `ReceiveScreen.tsx` — orchestrator ของสี่ขั้น PO/supplier/carrier/count, แยก resource pagination, lazy detail, refresh และ action permissions
- `receive/ReceivePo.tsx` — PO form/detail, product lines, supplier/CEO/date/note และ progress quantities
- `receive/ReceiveSupplier.tsx` — supplier document form/detail; ค้น PO, โหลด PO lines, upload evidence แล้วส่ง asset IDs
- `receive/ReceiveCarrier.tsx` — carrier document form/detail, optional SKU lines, evidence และ delivery confirmation form
- `receive/ReceiveCount.tsx` — goods count form, warehouse selection, good/damaged/wrong, serial validation, discrepancy evidence และ issue fields
- `StockScreen.tsx` — balance/ledger tabs, offset filters/pagination, CSV export, stock document form และ reversal dialog
- `TransferScreen.tsx` — direct-transfer form/history/filters/export/detail/reversal; ใช้ stock document API ชนิด TRANSFER
- `TransferAuditBoard.tsx` — read-only transfer status metrics/table/detail ที่อ่าน transfer-pair query เดียวกับ transfer screen
- `IssuesScreen.tsx` — cursor list, issue detail, create issue, status transition และ claim note
- `ReportsScreen.tsx` — tabs ของ outstanding/receipt reports พร้อม cursor load-more
- `AccountProfile.tsx` — own account/profile/employment/security tabs, avatar crop/upload, profile modal, change email/password
- `MemberProfileFields.tsx` — reusable subset ของ employee code/contact/address/start date/emergency contact
- `ControlPanel.tsx` — member/branch admin UI: summary list, detail lazy load, create/edit role/branch/profile, reset password, deactivate/restore และ audit-related shell state
- `ControlPanelNavigationContext.tsx` — context เชื่อม layout/sidebar/page tab และ audit category state
- `ControlPanelRoadmapPage.tsx` — static roadmap/empty API states ของ scopes/account status/master data
- `AccessControlPreview.tsx` — visual permission matrix preview; ไม่เรียก API และไม่แก้ policy จริง
- `AuditCategoryPage.tsx` — server-backed audit table filters/pagination/detail before-after snapshot
- `auditLog.ts` — category definitions, allowed actions/entity types และ bilingual labels ที่ API audit ใช้ validate ด้วย
- `ControlPanelModuleStatusPage.tsx` — thin page wrapper ของ ModuleStatusPanel
- `ModuleStatusPanel.tsx` — list/change module state, maintenance reason modal และ recent history; ADMIN API
- `ModuleStatusHistoryPage.tsx` — filterable paginated status history table
- `Settings.tsx` — warehouse/system settings presentation, organization edit สำหรับ global admin, local preferences และ audit-policy explanation
- `TableDesignPlayground.tsx` — internal comparison ของ table designs 10 แบบ; ไม่มี business persistence

### 6.5 `components/sales/`

หน้าตาใช้ convention เดียวกับ warehouse (header 72px, card `rounded-xl border`, `DataTable` frame, form/detail ใน `SidePanel`)

- `SalesNavigation.tsx` — sidebar สองกลุ่ม Sales (รายการขาย, ลูกค้า, บันทึกชำระค่างวด) และ A/R (ภาพรวม, ทะเบียนลูกค้า, สัญญา, ประวัติชำระ, เกินกำหนด)
- `SalesPageFrame.tsx` — thin wrapper ของ `WarehousePageTemplate` (default fullBleed list, `narrow` สำหรับฟอร์ม)
- `SalesUi.tsx` — building blocks ร่วม: Toolbar, Card, TableFrame, LoadMore, LinkButton, SalesField, DetailRow, PanelSection, MiniTable, Segmented, Badge
- `SalesOverview.tsx` — ภาพรวม/quick action พร้อมตัวเลขจริงจาก A/R overview
- `SalesTransactionsPage.tsx` — รายการบิล, filter ประเภท, detail ใน SidePanel (สินค้า, payments, สัญญา/งวด, ผู้ค้ำ, ยกเลิก, ลิงก์พิมพ์); export `baht`, `methodLabel`, `statusLabel`
- `NewSalePage.tsx` — ฟอร์มบิลสด/ผ่อน: ลูกค้า, คลัง, เลือกสินค้าจาก stock ของคลัง, serial checkbox, ช่องทางชำระ, terms + preview ตารางงวดด้วย `buildSchedule` ตัวเดียวกับ server, ผู้ค้ำ, idempotency key ต่อฟอร์ม
- `CustomersPage.tsx`, `CustomerForm.tsx` — ทะเบียนลูกค้าและฟอร์มใน SidePanel
- `InstallmentsPage.tsx` — ค้นหาสัญญาที่เปิด, ตารางงวด, ฟอร์มรับชำระ, ประวัติและ void
- `PrintDocs.tsx` — ระบบเอกสารพิมพ์ร่วม (Sheet/Header/Parties/Totals/Words/Signatures/Footer/Stamp) และ `BillPrint`, `ReceiptPrint`, `printBillHref`, `printReceiptHref`
- `useDebouncedValue.ts` — debounce search input
- `ar/ArLists.tsx` — `ContractDetail` (read-only), `ContractsList`, `PaymentsList`, `kindLabel`, `day`
- `ar/ArOverviewPage.tsx`, `ArCustomersPage.tsx`, `ArCustomerProfilePage.tsx` (แท็บ ข้อมูลส่วนตัว/ประวัติซื้อ/สัญญาและการเงิน/ประวัติชำระ), `ArContractsPage.tsx`, `ArPaymentsPage.tsx`, `ArOverduePage.tsx`

### 6.6 `components/auth/`

- `components/auth/index.ts` — barrel export `AuthView` และ `ProfileGuardModal`
- `AuthView.tsx` — bilingual responsive auth UI, email/password sign-in, recent-account list, client-side PIN preview path, remember-device state, signup form/pending profile logic และ navigation transition; runtime config ปิด public signup อยู่
- `ProfileGuardModal.tsx` — modal บังคับ/ชวนเติม profile สำหรับ flow รุ่นเดิม; ต้องแยกจาก server authorization

### 6.7 `components/loading_screen/`

- `index.ts` — barrel exports ของ loading contexts/screens/skeletons
- `LoadingProvider.tsx` — global route-transition state, allowed route list, per-path duration estimate, API-in-flight tracking, progress fill, minimum display, watchdog และ `navigateWithLoading`
- `LoadingScreen.tsx` — full-screen branded progress UI สำหรับ route navigation
- `AuthLoadingProvider.tsx` — context เปิด/ปิด auth-specific loading
- `AuthLoadingScreen.tsx` — auth transition overlay
- `AuthBarrierLoader.tsx` — compact/full auth guard spinner/loader ที่มี accessible label
- `SkeletonLoading.tsx` — `SkeletonBox`, text/stat/table/chart และ dashboard/datacenter page skeletons
- `WarehouseRouteSkeletons.tsx` — skeletons สำหรับ stock/dashboard/transfer/audit/issues/reports
- `ReceivingPageSkeleton.tsx` — skeleton tabs/content สำหรับแต่ละ receiving step

### 6.8 `components/navbar/`

- `index.ts` — barrel exports main/header/dropdown/mobile และ warehouse subnavigation
- `SidebarMain.tsx` — main workspace sidebar, DAWH logos, minimize persistence, account menu และ settings/hub links
- `NavbarsubWarehouse.tsx` — warehouse menu groups, role-aware visibility และ client navigation; ไม่เรียก business API เอง
- `ControlPanelSidebar.tsx` — control panel navigation, audit categories, mobile/minimized modes และ account controls
- `SidebarAi.tsx` — AI module navigation prototype; ไม่มี route/module implementation ที่เชื่อมอยู่ใน app tree
- `NavbarsubDatacenter.tsx` — datacenter submenu prototype สำหรับ module ที่ยังเป็น placeholder
- `SidebarWarehouse.tsx` — compatibility re-export ของ warehouse subnavigation
- `SidebarDatacenter.tsx` — compatibility re-export ของ datacenter subnavigation
- `HeaderNavbar.tsx` — reusable page header/title/back/breadcrumb/account menu
- `MobileNavbar.tsx` — responsive bottom/mobile navigation and subtab handling
- `DropdownMenu.tsx` — account dropdown UI ใช้ `useAccountMenu` สำหรับ profile/settings/logout

### 6.9 `components/common/`

- `index.ts` — public barrel ของ common controls
- `Button.tsx` — button variants, icon position และ Loader2 action feedback
- `SecondaryButton.tsx` — typed wrapper ที่บังคับ secondary variant
- `SearchInput.tsx` — styled search input พร้อม clear/disabled/ref forwarding
- `FilterButton.tsx` — filter action button/badge
- `FilterDropdown.tsx` — generic native-like filter options
- `DataTable.tsx` — generic typed table, shared geometry, minimum placeholder rows, loading/empty/action rendering
- `CustomDropdown.tsx` — accessible generic custom select พร้อม search/portal/keyboard behavior
- `Pagination.tsx` — discriminated offset/cursor pagination UI
- `Calendar.tsx` — bilingual month/range calendar และ ISO date helpers
- `DatePicker.tsx` — popover date input ที่ใช้ Calendar-like date logic
- `SidePanel.tsx` — reusable detail/form drawer, alert/field errors และ responsive behavior
- `PlaceholderBlockerView.tsx` — branded 404/under-development/maintenance layout
- `common/index.ts` — barrel ของสำเนา nested common ชุดเก่า; ไม่มี active import path ที่พบ
- `common/Calendar.tsx` — สำเนาตรงกับ top-level Calendar; Legacy/unused
- `common/PlaceholderBlockerView.tsx` — สำเนาตรงกับ top-level blocker; Legacy/unused
- `common/CustomDropdown.tsx` — implementation รุ่นซ้อนที่ต่างจาก top-level เล็กน้อย; Legacy/unused
- `common/DatePicker.tsx` — implementation รุ่นซ้อน; Legacy/unused
- `common/Pagination.tsx` — implementation รุ่นซ้อน; Legacy/unused
- `common/DataTable.tsx` — placeholder/re-export ขนาดเล็ก ไม่ใช่ DataTable หลัก; Legacy/unused

### 6.10 `components/users/`

- `settings.tsx` — appearance/session/notification preference UI, local-storage persistence และ cached profile display; ไม่ใช่ server-side security policy editor
- `AvatarCropModal.tsx` — client canvas crop/zoom/rotate/export avatar image
- `account/types.ts` — form/select/address/account-tab contracts และ religion presets
- `account/modals/SecondaryRegModal.tsx` — form ขนาดใหญ่สำหรับแก้ member profile ไทย/อังกฤษ ที่อยู่ การศึกษา งาน และ emergency contact ผ่าน member API
- `account/selectors/FormCustomSelect.tsx` — styled form select
- `account/selectors/ThaiAddressSelector.tsx` — parse/build ที่อยู่ไทย/อังกฤษและ dependent province/district/subdistrict selector
- `account/selectors/UniversitySearchSelect.tsx` — university autocomplete จาก reference JSON
- `account/selectors/MajorSubjectAutocomplete.tsx` — major/subject autocomplete จาก master data

### 6.11 `components/modules/`

- `ModuleAvailabilityGuard.tsx` — client guard ที่โหลด module statuses, abort ตอน unmount, แสดง skeleton ระหว่างตรวจ และ redirect ไป `/maintenance` เมื่อ module ถูกปิด

### 6.12 `lib/api/`

- `client.ts` — browser HTTP core: JSON envelope parsing, typed errors, credential/no-store defaults, GET timeout 20 วินาที, abort forwarding และ navigation API-in-flight counters
- `warehouse.ts` — browser-facing warehouse contract/types และ method map ของทุก business endpoint; deduplicate `/api/me`, สร้าง query params และ random idempotency key ต่อ stock action
- `sales.ts` — `salesApi` client wrappers และ response types ของ Sales/A/R; mutation ที่ต้องกันซ้ำส่ง `Idempotency-Key`
- `warehouse-reference-cache.ts` — in-memory cache ของ branch/warehouse reference แยกตาม role/branch scope, request deduplication และ TTL 60 วินาที; invalidate เมื่อ catalog เปลี่ยนหรือ account scope เปลี่ยน

### 6.13 `lib/auth/` และ auth core

- `lib/auth.ts` — Better Auth server config: PostgreSQL adapter, cookie prefix/security, credential-only auth, disabled signup, optional email verification, 7-day session, DB rate limit และ admin plugin
- `lib/auth-client.ts` — Better Auth browser client, resilient logout, cookie cleanup route, user-state cleanup และ cross-tab logout ผ่าน BroadcastChannel/storage event
- `lib/auth/session.ts` — timed `getSession` และ `requireSession` ที่แปลง no-session เป็น standardized 401
- `lib/auth/account-security.ts` — direct own-email/password change, validation/password verify, duplicate protection, revoke-other-sessions และ audit
- `lib/auth/email.ts` — optional Resend verification-email sender; require env เฉพาะเมื่อ feature เปิด
- `lib/auth/pending-profile.ts` — session-storage helper สำหรับ profile draft จาก signup UI รุ่นเดิม

### 6.14 `lib/core/`

- `core/db/pool.ts` — singleton `pg.Pool`, raw DATE parser, bounded pool/timeouts, local/remote SSL และ safe invalid fallback URL
- `core/db/transaction.ts` — `BEGIN/COMMIT/ROLLBACK/release` wrapper บน instrumented client
- `core/http/handler.ts` — `apiRoute` error boundary; map ApiError, unique/FK/check/cast DB errors และ unexpected 500
- `core/http/body.ts` — parse request JSON และบังคับ plain object/body size/shape
- `core/http/response.ts` — success/page/error envelopes พร้อม request ID header
- `core/http/errors.ts` — `ApiError`, validation, not-found, conflict และ account-status error classes
- `core/http/pagination.ts` — shared keyset page request types รุ่นพื้นฐาน
- `core/http/request-id.ts` — validate/read request ID และสร้าง response header helper
- `core/http/request-timing.ts` — AsyncLocalStorage timing, instrument pool/client queries, timeout counters, opt-in JSON logs และ `Server-Timing`

### 6.15 `lib/contracts/`

- `warehouse.ts` — canonical current Role, CatalogKind และ MemberProfile shared types
- `warehouse-policy.ts` — centralized `stockManagers`, catalog editors, `canManageStock`, `canEditCatalog`, `isGlobalRole`
- `module-status.ts` — managed module keys และ status/history DTOs

### 6.16 `lib/warehouse/` — server domain/data services

- `core.ts` — barrel re-export access/audit/validation primitives ให้ domain services
- `access.ts` — session-to-actor query, disabled/banned checks, localized names, role guard และ branch guard
- `validation.ts` — integer ID, trimmed text, decimal quantity/money/date/count และ idempotency-key validators
- `audit.ts` — insert audit event และ numbered document revision helpers
- `catalog.ts` — catalog kind/table map, scoped lookup/list/page, field parsing และ audited create/update policies
- `purchase-orders.ts` — PO list/detail/compact lines, quantity progress calculations, create/revise/close และ revision/audit rules
- `supplier-receipts.ts` — supplier document list/detail/create/revise, PO/supplier/line validation, evidence และ revision
- `carrier-receipts.ts` — carrier document list/filter/detail/create/revise และ one-time branch delivery confirmation
- `goods-receipts.ts` — count validation, serial/discrepancy/issue creation และ idempotent transactional stock posting
- `stock-documents.ts` — ISSUE/ADJUSTMENT/TRANSFER posting, request hash/idempotency, serial movement, paired transfer docs และ reversal
- `ledger.ts` — atomic materialized-balance updateที่ห้ามติดลบ พร้อม document line และ immutable movement insert
- `stock.ts` — scoped balance/ledger/transfer/audit read queries, filters, offset pagination และ transfer summaries
- `inventory-read.ts` — enriched product inventory query รวม attributes, scoped stock, branch distribution และ stock status
- `issues.ts` — scoped issue lifecycle, linked-document consistency, status transition และ claim tracking
- `reports.ts` — cursor-based receipt line และ outstanding PO line reports
- `dashboard.ts` — 7 parallel dashboard queries: summary, daily, monthly, categories, branches, low stock, recent movements; ไม่มี Redis cache
- `overview.ts` — compact six-count overview รุ่นเดิม; dashboard UI หลักใช้ `dashboard.ts`
- `media.ts` — evidence validation/upload/metadata/link ownership/permission และ signed URL
- `document-support.ts` — duplicate external document/hash warnings
- `members.ts` — ADMIN member create/update/delete/restore/reset password และ self-profile rules; coordinate Better Auth กับ app schema
- `member-queries.ts` — load/list/detail member projections และ field redaction ตาม actor
- `member-profile.ts` — profile field mapping/parser, email validation, empty profile และ upsert profile
- `pagination.ts` — offset page parser/result รวม total/pages
- `cursor-pagination.ts` — signed-shape Base64 cursor parse/encode/result สำหรับ parent/child keyset
- `pagination-config.ts` — table page size กลางเท่ากับ 10
- `read-options.ts` — strict optional boolean และ compact view query parsing

`stock-documents.ts` export in-transaction helpers `issueSerials` และ `reverseDocumentInTx` ให้ Sales ใช้ใน transaction เดียวกับบิล; `reverseStockDocument` ปฏิเสธเอกสาร `SALE`

### 6.16.1 `lib/sales/` — Sales/A/R domain services

- `customers.ts` — `salesRoles`, customer validation (เลขบัตร 13 หลัก), list/get/create/update
- `sales.ts` — satang helpers (`toSatang`, `fromSatang`, `lineTotalSatang`), `bangkokToday`, list/get/create/cancel บิล, `listSellableStock`
- `schedule.ts` — pure `buildSchedule` (ดอกเบี้ย, ยอดผ่อน, ค่างวด, วันครบกำหนด) ใช้ร่วม server และ preview ใน browser
- `payments.ts` — pure `allocateFifo`/`unallocateTail`, record/void ค่างวด, `getReceipt`
- `receivables.ts` — A/R overview, overdue list, payment list, customer profile summary
- `baht-text.ts` — แปลงจำนวนเงินเป็นตัวอักษรไทย (`…บาทถ้วน`)
- Tests: `sales.test.ts`, `schedule.test.ts`, `payments.test.ts`, `receivables.test.ts`, `baht-text.test.ts` (mock `timedPoolQuery`/`withTransaction`)

### 6.17 `lib/modules/` และ feature type folders

- `lib/modules/status.ts` — list/update module statuses และแปลง audit events เป็น status-history DTO; update เป็น ADMIN-only transaction; `requireModuleEnabled(key)` สำหรับ server gate (503 `MODULE_DISABLED`)
- `lib/product-barcodes/types.ts` — barcode DTO/contracts สำหรับ feature ที่ยังไม่มี route/service ปัจจุบัน; Preview/unused
- `lib/product-units/types.ts` — product-unit DTO รุ่น specification; ไม่ใช่ current `app.units` service contract
- `lib/locations/types.ts` — bin/location types ของแนวคิดเก่า; current schema ไม่มี shelf/bin
- `lib/safety-stock/types.ts` — safety-stock/reorder policy types; current product มีเพียง `reorder_point`
- `lib/reason-codes/types.ts` — reason-code contracts ที่ยังไม่มี table/API
- `lib/departments/types.ts` — department DTO contracts; profile ปัจจุบันเก็บ department เป็น text
- `lib/onboarding/types.ts` — onboarding options/profile contracts รุ่น handoff เก่า; current auth flow ไม่ได้ expose API ชุดนี้

### 6.18 Tests ใน `lib/warehouse/`

- `api-routes.test.ts` — static/source-level assertions ว่า route handlers ใช้ shared wrapper/response contract และ stock routes delegate ถูก service
- `read-api.test.ts` — mock query tests ของ compact views, filters, scoping และ read behavior
- `pagination.test.ts` — offset page validation/result tests
- `cursor-pagination.test.ts` — cursor encode/decode, malformed cursor และ limit behavior tests

### 6.19 `hooks/`

- `index.ts` — barrel export hook หลัก
- `useRemoteResource.ts` — generic request hook ที่ abort stale request, track loading/error และ expose reload
- `useCursorResource.ts` — cursor list hook ที่รวม first page/load-more/reload และกัน duplicate request state
- `useAccountMenu.ts` — account dropdown state, language/theme/profile display และ logout/navigation actions

### 6.20 `context/`

- `ThemeContext.tsx` — dark/light state, CSS classes/tokens, localStorage/cookie persistence และ cross-tab sync
- `WarehouseAccountContext.tsx` — `/api/me` loader สำหรับ protected routes, 401/403 handling, cache scope invalidation และ logout clearing
- `NotificationContext.tsx` — toast queue/deduplication/actions, local preference sound synthesis, pending notice consumption, pauseable progress และ loading-aware rendering

### 6.21 `config/`

- `brand.ts` — canonical DAWH logo URLs แยก aspect/theme และ long logo
- `theme.ts` — light/dark color token definitions และ accessor
- `translations.ts` — common navigation/system bilingual labels
- `roles.ts` — **Legacy/preview role model** (`devops`, `super_admin`, `collector`, ฯลฯ) สำหรับ UI/type รุ่นเก่า; ไม่ใช่ server authorization ซึ่งใช้ uppercase warehouse roles

### 6.22 `utils/`

- `supabase.ts` — browser Supabase client helper รุ่นเก่า; business data ปัจจุบันห้าม query ตรงจาก browser และใช้ API แทน
- `warehouseRole.ts` — client role normalization/display helpers ของ current warehouse roles
- `portalSettings.ts` — local-storage workspace portal settings, defaults และ update event
- `language.ts` — TH/EN localStorage hook และ cross-component custom event
- `avatarUtils.ts` — avatar initials/color/file conversion/cache helpers

### 6.23 `types/`

- `index.ts` — barrel ของ API/auth/profile/user/warehouse types
- `api.ts` — generic API envelope/error codes รุ่น frontend handoff; current runtime client มี definition ใกล้เคียงใน `lib/api/client.ts`
- `auth.ts` — Auth/session/facility/account-status contracts รุ่น P0; facility/permission arrays ไม่ใช่ current `/api/me` shape
- `profile.ts` — detailed onboarding/profile DTO รุ่น P0 พร้อม facility/department/address object; current member profile shape ต่างกัน
- `user.ts` — large UI `EmployeeProfile`, formatting/translation helpers และ import legacy `UserRole`; บาง formatting helper ยังถูกใช้ใน auth/settings
- `warehouse.ts` — broad warehouse UI/domain types รุ่นก่อน current service types; ตรวจ import ก่อนถือเป็น contract

### 6.24 `data/`

- `masterData.ts` — preset education/major/religion/gender/blood/marital/nationality และ selector data
- `provinces.json` — จังหวัดไทยสำหรับ address selector
- `districts.json` — อำเภอ/เขตสัมพันธ์จังหวัด
- `sub_districts.json` — ตำบล/แขวงและรหัสไปรษณีย์; reference file ขนาดใหญ่
- `thailand_full_addresses.json` — flattened full-address search/reference dataset
- `thai_schools_universities.json` — รายชื่อสถานศึกษาไทย/อังกฤษสำหรับ university autocomplete

### 6.25 `scripts/`

- `bootstrap-admin.mjs` — รับ email ที่ระบุชัด, หา Better Auth credential user เดียว แล้ว upsert เป็น active `ADMIN` ใน transaction; ไม่สร้าง user ใหม่
- `rebuild-database.mjs` — **destructive one-time legacy transition**: เก็บ credential admins, drop public business tables/users อื่น, apply migration subset และสร้าง app admins; ไม่ใช่ routine migration และรายการ migration ใน script ไม่รวมของใหม่ทั้งหมด

### 6.26 `test/`

- `server-only.ts` — empty module ให้ Vitest resolve marker `server-only` ได้; production ใช้ behavior ของ Next.js

### 6.27 `supabase/`

- `config.toml` — local Supabase CLI config: PostgreSQL 17, API/Studio/Storage/Auth ports, migrations enabled, seed disabled และ schemas ที่ expose; application business schema `app` ถูก revoke จาก browser roles
- `migrations/20260918160439_create_better_auth.sql` — สร้าง Better Auth `public` tables/indexes, เปิด RLS และ revoke anon/authenticated
- `migrations/20260926000000_single_org_warehouse.sql` — migration หลักของ single-organization warehouse: roles/branches/catalog/inbound/inventory/issues/media/audit/idempotency และ private Storage bucket
- `migrations/20260926181053_member_profiles.sql` — optional employment/contact profile table แบบ server-only
- `migrations/20260926205454_expand_member_profiles_and_account_settings.sql` — เพิ่มชื่อสองภาษา ข้อมูลส่วนตัว การศึกษา งาน contact และ address fields
- `migrations/20260927042725_drop_must_change_password.sql` — ลบ column `must_change_password` ที่ไม่ได้ใช้แล้ว
- `migrations/20260929100000_audit_log_query_index.sql` — composite partial index เพื่อ audit action/date/id query
- `migrations/20261104063039_module_statuses.sql` — module status table/check constraint/default rows; reports เริ่มต้นปิด
- `migrations/20261111100000_sales_customers_cash.sql` — `customers`, `sales`, `sale_lines`, `sale_payments` และเพิ่ม `SALE` ใน `inventory_documents.kind`
- `migrations/20261111120000_db_cleanup.sql` — ลบ legacy functions/duplicate index/`sales.payment_method`, เพิ่ม FK lookup indexes และ CHECK `stock_balances.quantity >= 0`
- `migrations/20261111130000_sales_installments.sql` — installment terms บน `sales`, `sale_installments`, `sale_guarantors`

DB dev (`dawh.db`) apply ครบทุก version แล้วและ `supabase_migrations.schema_migrations` ตรงกับไฟล์ใน repo; การ apply ด้วยมือต้อง insert version ตามชื่อไฟล์ ไม่ใช้ MCP `apply_migration` ที่ตั้ง version เป็นเวลาปัจจุบัน
- `seed_mock_warehouse.sql` — idempotent mock branches/warehouses/units/groups/20 products; ไม่สร้าง stock/transaction
- `seed_mock_product_attributes.sql` — เติม categories/brands ให้ mock products แบบ rerunnable

### 6.28 Documentation ปัจจุบัน

- `docs/README.md` — แยก current guide ออกจาก historical archive
- `docs/DAWH.md` — consolidated product/engineering guide ปัจจุบัน: business boundaries, implementation status, architecture, flows, API, setup และ gaps
- `docs/PROJECT_CODEBASE_GUIDE_TH.md` — เอกสารฉบับนี้; inventory, current flows และ file-by-file guide

### 6.29 `docs/history/` — ภาคผนวกเอกสารย้อนหลัง

ทุกไฟล์ด้านล่างเป็น **Historical** ต้องเทียบ code/migrations ก่อนใช้อ้างอิง:

- `docs/history/api/p0-frontend-handoff.md` — API contract handoff ของ P0 architecture รุ่นก่อน current single-org warehouse
- `docs/history/report/cache-warehouse-fe.md` — รายงานเหตุผล/ขอบเขต cache ฝั่ง Warehouse FE
- `docs/history/superpowers/specs/2026-09-13-horizon-wms-database-api-design.md` — draft clean-slate WMS database/API design
- `docs/history/superpowers/specs/2026-09-19-p0-frontend-handoff-design.md` — P0 backend design ที่มี facility/permission concepts รุ่นเก่า
- `docs/history/superpowers/plans/2026-09-19-p0-frontend-handoff.md` — dated implementation plan/checklist ไม่ใช่สถานะว่างานทุกข้อเสร็จ
- `docs/history/warehouse/DESIGN.md` — Horizon WMS product vision/roadmap เชิง logistics; หลาย feature ยังไม่ได้ implement
- `docs/history/warehouse/DISABLED_FEATURES.md` — บันทึก guards/features ที่เคยปิดชั่วคราว
- `docs/history/warehouse/schema.md` — database catalog snapshot วันที่ 19 ก.ย. 2026 ซึ่งถูกแทนด้วย active migrations
- `docs/history/warehouse/warehouse-backend.md` — backend setup/API behavior snapshot
- `docs/history/warehouse/warehouse-backend-status-th.md` — status summary ภาษาไทย ณ เวลาหนึ่ง
- `docs/history/warehouse/warehouse-frontend.md` — frontend-to-warehouse API integration notes
- `docs/history/warehouse/warehouse-frontend-cache.md` — proposed FE cache design ไม่ใช่ cache implementation contract
- `docs/history/warehouse/5_10_26FE.md` — FE handoff สำหรับ filters/compact views/stock routes; หลายข้อถูกนำมาใช้แล้ว ต้องดู current code
- `docs/history/warehouse/performance-audit-2026-09-27.md` — dated performance audit/baseline
- `docs/history/warehouse/table-layout-guidelines.md` — table layout/UI conventions ที่ยังใช้เป็น design reference ได้
- `docs/history/warehouse/walkthought.md` — scratch/walkthrough note ที่ไม่มี current-contract header

### 6.30 `public/` และ binary/static assets

#### DAWH brand assets

- `public/assets/dawh_black1024logo.png`, `dawh_light1024logo.png` — square theme logos; sidebar/metadata ใช้งานจริง
- `public/assets/dawh_2048black_logo.png`, `dawh_2048light_logo.png` — square high-resolution variants ใน brand config
- `public/assets/dawh_2048x1024black_logo.png`, `dawh_2048x1024light_logo.png` — 2:1 variants ใน brand config
- `public/assets/dawh_black4x1024speclogo.png`, `dawh_light4x1025speclogo.png` — wide variants ใน brand config
- `public/assets/dawh_black4x2048logo.png`, `dawh_light2048logo.png` — extra-wide variants ใน brand config
- `public/assets/dawh_longnospace_logo.png` — long logo preloaded โดย root layout
- `public/assets/dawh_nospacewight_dark_logo.png`, `dawh_nospacewight_light_logo.png` — expanded sidebar logos ตาม theme (ชื่อไฟล์สะกด `wight` ตาม asset จริง)
- `public/assets/dawh_2048x1024light_logo - Copy.png`, `dawh_2048light_logo - Copy.png` — duplicate asset copies; ไม่มี active reference ที่พบ
- `public/assets/dawh_logo.psd` — editable Photoshop source; build/runtime ไม่อ่าน
- `public/assets/dawh_b1.png`, `dawh_b2.png`, `dawh_b3.png`, `dawh_b4.png` — small brand/decorative variants; ไม่มี active source reference ที่พบ
- `public/assets/Outfit-VariableFont_wght.ttf` — local Outfit font asset; root layout ปัจจุบันใช้ `next/font/google` จึงไม่มี active reference ที่พบ

#### Root public assets

- `public/favicon.ico` — legacy public favicon; App Router ยังมี icon metadata files ของตัวเอง
- `public/window.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/file.svg` — default Next starter graphics ไม่มี active project reference; **Unused scaffold assets**

## 7. จุดที่ต้องระวังเมื่อพัฒนาต่อ

1. อย่าใช้ `config/roles.ts`, `types/auth.ts`, `types/profile.ts` หรือ historical P0 docs เป็น authorization contract; server policy ปัจจุบันอยู่ใน `lib/contracts/warehouse*` และ `lib/warehouse/access.ts`
2. Sales: แก้ logic เงินต้องคำนวณเป็นสตางค์และคง invariant "ตัดยอด FIFO + void เฉพาะรายการล่าสุด" ไว้ เพราะการ void พึ่ง invariant นี้แทนตาราง allocation; เรื่องที่ยังไม่ตกลง (คืนสินค้า, ค่าปรับ, ใบกำกับภาษี ฯลฯ) อยู่ใน `docs/requirements/sales-ar.md` หัวข้อ 7
3. `scripts/rebuild-database.mjs` ทำลายข้อมูลและมี migration list แบบ snapshot ห้ามใช้แทน `supabase db push`
4. transfer ปัจจุบัน complete ทันที ไม่มี approval/reservation/picking/dispatch/receiving
5. `/reports` กับ `/warehouse/reports` เป็นคนละ feature: ตัวแรก placeholder module ตัวหลัง warehouse report ใช้งานจริง
6. localStorage settings/maintenance/PIN UI ไม่ใช่ server-enforced security state
7. common components มีสำเนาซ้อนใต้ `components/common/common/`; active imports ชี้ top-level
8. lookup endpoint capped 50 ต้องไม่ตีความว่าเป็น complete dataset ใน selector ขนาดใหญ่
9. idempotency wrapper ฝั่ง browser สร้าง key ใหม่ต่อการเรียก; ถ้าทำ automatic retry ต้อง reuse key ของ operation เดิม
10. `Server-Timing` มีทุก wrapped API แม้ `API_TIMING_LOGS` ปิด; JSON console logs เปิดเฉพาะค่า `1`

## 8. สรุปสถานะ Feature

| Feature | สถานะ |
| --- | --- |
| Authentication/session/logout | Implemented |
| Organization/member/profile/role/branch administration | Implemented |
| Module enable/maintenance/history | Implemented |
| Warehouse catalog/product inventory | Implemented |
| PO/supplier/carrier/delivery/count/posting | Implemented |
| Stock balance/ledger/issue/adjustment/direct transfer/reversal | Implemented |
| Serial tracking | Implemented ใน receiving/stock movement scope |
| Issue/status/claim/evidence | Implemented |
| Warehouse inbound/outstanding reports และ audit | Implemented |
| Cycle count | Planned, ไม่มี schema/API |
| Transfer approval/pick-pack-ship-receive | Planned, ไม่มี workflow |
| Customer/บิลสด/บิลผ่อน/ตารางงวด/ค่างวด/ยกเลิก/void | Implemented |
| A/R read-only views และเอกสารพิมพ์บิล/ใบเสร็จ | Implemented |
| ใบกำกับภาษี, คืนสินค้า/คืนเงิน, ค่าปรับ, เกรดเครดิต, ติดตามหนี้ | Planned, ไม่มี schema/API |
| Bin/shelf location | Not in current scope/schema |
| Datacenter/integration/workspace reports | Placeholder |

## ภาคผนวก A — Exact path index ของรายการที่อธิบายแบบอิงหัวข้อโฟลเดอร์

รายการต่อไปนี้มีคำอธิบายอยู่ในหัวข้อ 6 แล้ว ภาคผนวกนี้เก็บ path เต็มเพื่อให้ตรวจ inventory แบบอัตโนมัติได้โดยไม่สับสนกับไฟล์ชื่อซ้ำ:

```text
data/provinces.json
data/sub_districts.json
data/thai_schools_universities.json
data/thailand_full_addresses.json
data/districts.json
data/masterData.ts
lib/warehouse/catalog.ts
lib/warehouse/issues.ts
lib/warehouse/document-support.ts
lib/warehouse/media.ts
lib/warehouse/audit.ts
lib/warehouse/goods-receipts.ts
lib/warehouse/members.ts
lib/warehouse/api-routes.test.ts
lib/warehouse/cursor-pagination.test.ts
lib/warehouse/ledger.ts
lib/warehouse/core.ts
lib/warehouse/member-queries.ts
lib/warehouse/supplier-receipts.ts
lib/warehouse/stock.ts
lib/warehouse/member-profile.ts
lib/warehouse/overview.ts
lib/warehouse/dashboard.ts
lib/warehouse/pagination.test.ts
lib/warehouse/read-options.ts
lib/warehouse/read-api.test.ts
lib/warehouse/pagination-config.ts
lib/warehouse/stock-documents.ts
lib/warehouse/carrier-receipts.ts
lib/warehouse/purchase-orders.ts
lib/warehouse/reports.ts
lib/warehouse/pagination.ts
lib/warehouse/cursor-pagination.ts
lib/warehouse/inventory-read.ts
lib/warehouse/validation.ts
lib/api/warehouse.ts
lib/api/warehouse-reference-cache.ts
lib/contracts/warehouse.ts
lib/contracts/warehouse-policy.ts
lib/contracts/module-status.ts
lib/core/db/transaction.ts
lib/core/db/pool.ts
lib/core/http/handler.ts
lib/core/http/body.ts
lib/core/http/response.ts
lib/core/http/errors.ts
lib/core/http/pagination.ts
lib/core/http/request-id.ts
lib/core/http/request-timing.ts
scripts/bootstrap-admin.mjs
hooks/useCursorResource.ts
hooks/index.ts
hooks/useRemoteResource.ts
hooks/useAccountMenu.ts
public/assets/dawh_light4x1025speclogo.png
public/assets/dawh_2048light_logo.png
public/assets/dawh_nospacewight_light_logo.png
public/assets/dawh_light2048logo.png
public/assets/dawh_2048light_logo - Copy.png
public/assets/dawh_b2.png
public/assets/dawh_b3.png
public/assets/dawh_light1024logo.png
public/assets/dawh_b4.png
public/assets/dawh_2048x1024light_logo.png
components/modules/ModuleAvailabilityGuard.tsx
components/warehouse/Ui.tsx
components/warehouse/IssuesScreen.tsx
components/warehouse/AccountProfile.tsx
components/warehouse/ModuleStatusHistoryPage.tsx
components/warehouse/ReportsScreen.tsx
components/warehouse/ModuleStatusPanel.tsx
components/warehouse/BranchManagement.tsx
components/warehouse/TransferScreen.tsx
components/warehouse/AuditCategoryPage.tsx
components/warehouse/MemberProfileFields.tsx
components/warehouse/ControlPanelRoadmapPage.tsx
components/warehouse/Workspace.tsx
components/warehouse/receive/ReceivePo.tsx
components/warehouse/receive/ReceiveCount.tsx
components/warehouse/receive/ReceiveCarrier.tsx
components/warehouse/receive/ReceiveSupplier.tsx
components/warehouse/auditLog.ts
components/warehouse/AccessControlPreview.tsx
components/warehouse/TableDesignPlayground.tsx
components/warehouse/ControlPanelNavigationContext.tsx
components/warehouse/OverviewScreen.tsx
components/warehouse/StockScreen.tsx
components/warehouse/ControlPanel.tsx
components/warehouse/ProductSearchSelect.tsx
components/warehouse/WarehousePageLoading.tsx
components/warehouse/ControlPanelModuleStatusPage.tsx
components/warehouse/ReceiveScreen.tsx
components/warehouse/CatalogScreen.tsx
components/warehouse/TransferAuditBoard.tsx
components/warehouse/Settings.tsx
components/loading_screen/AuthBarrierLoader.tsx
components/loading_screen/SkeletonLoading.tsx
components/loading_screen/index.ts
components/loading_screen/WarehouseRouteSkeletons.tsx
components/loading_screen/LoadingProvider.tsx
components/loading_screen/ReceivingPageSkeleton.tsx
components/loading_screen/AuthLoadingScreen.tsx
components/loading_screen/AuthLoadingProvider.tsx
components/loading_screen/LoadingScreen.tsx
components/users/account/selectors/ThaiAddressSelector.tsx
components/users/account/selectors/FormCustomSelect.tsx
components/users/account/selectors/UniversitySearchSelect.tsx
components/users/account/selectors/MajorSubjectAutocomplete.tsx
components/users/account/types.ts
components/users/account/modals/SecondaryRegModal.tsx
components/users/AvatarCropModal.tsx
components/users/settings.tsx
components/common/SearchInput.tsx
components/common/SecondaryButton.tsx
components/common/FilterButton.tsx
components/common/FilterDropdown.tsx
components/common/Button.tsx
components/common/index.ts
components/common/DataTable.tsx
components/common/common/index.ts
components/common/common/DataTable.tsx
components/common/common/Calendar.tsx
components/common/common/PlaceholderBlockerView.tsx
components/common/common/CustomDropdown.tsx
components/common/common/DatePicker.tsx
components/common/common/Pagination.tsx
components/common/Calendar.tsx
components/common/SidePanel.tsx
components/common/PlaceholderBlockerView.tsx
components/common/CustomDropdown.tsx
components/common/DatePicker.tsx
components/common/Pagination.tsx
components/auth/AuthView.tsx
components/auth/ProfileGuardModal.tsx
components/sales/SalesOverview.tsx
components/sales/SalesNavigation.tsx
components/sales/SalesPageFrame.tsx
components/sales/SalesUi.tsx
components/sales/SalesTransactionsPage.tsx
components/sales/NewSalePage.tsx
components/sales/CustomersPage.tsx
components/sales/CustomerForm.tsx
components/sales/InstallmentsPage.tsx
components/sales/PrintDocs.tsx
components/sales/useDebouncedValue.ts
components/sales/ar/ArLists.tsx
components/sales/ar/ArOverviewPage.tsx
components/sales/ar/ArCustomersPage.tsx
components/sales/ar/ArCustomerProfilePage.tsx
components/sales/ar/ArContractsPage.tsx
components/sales/ar/ArPaymentsPage.tsx
components/sales/ar/ArOverduePage.tsx
lib/sales/customers.ts
lib/sales/sales.ts
lib/sales/schedule.ts
lib/sales/payments.ts
lib/sales/receivables.ts
lib/sales/baht-text.ts
lib/sales/sales.test.ts
lib/sales/schedule.test.ts
lib/sales/payments.test.ts
lib/sales/receivables.test.ts
lib/sales/baht-text.test.ts
lib/api/sales.ts
components/navbar/MobileNavbar.tsx
components/navbar/index.ts
components/navbar/DropdownMenu.tsx
components/navbar/HeaderNavbar.tsx
components/navbar/SidebarWarehouse.tsx
components/navbar/SidebarMain.tsx
components/navbar/NavbarsubDatacenter.tsx
components/navbar/SidebarDatacenter.tsx
components/navbar/NavbarsubWarehouse.tsx
components/navbar/SidebarAi.tsx
components/navbar/ControlPanelSidebar.tsx
supabase/seed_mock_warehouse.sql
supabase/config.toml
supabase/seed_mock_product_attributes.sql
supabase/migrations/20260926205454_expand_member_profiles_and_account_settings.sql
supabase/migrations/20260927042725_drop_must_change_password.sql
supabase/migrations/20261104063039_module_statuses.sql
supabase/migrations/20260918160439_create_better_auth.sql
supabase/migrations/20260926000000_single_org_warehouse.sql
supabase/migrations/20260929100000_audit_log_query_index.sql
supabase/migrations/20260926181053_member_profiles.sql
utils/supabase.ts
utils/warehouseRole.ts
utils/portalSettings.ts
utils/language.ts
utils/avatarUtils.ts
config/theme.ts
config/brand.ts
test/server-only.ts
types/user.ts
types/warehouse.ts
types/index.ts
types/api.ts
context/NotificationContext.tsx
context/ThemeContext.tsx
context/WarehouseAccountContext.tsx
```




