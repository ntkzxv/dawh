# DAWH: ผลตรวจประสิทธิภาพเว็บ วันที่ 27 กันยายน 2026

## ข้อสรุป

พบปัจจัยหลักร่วมกัน: การ compile หน้า/API ใน development, การเรียกข้อมูลผู้ใช้ซ้ำ, การโหลดข้อมูลหลายชุดก่อนแสดงหน้า, เวลารอที่กำหนดใน animation และการเปิด connection ฐานข้อมูลใหม่ มีหลักฐาน connection timeout ใน log ด้วย แต่ยังระบุสาเหตุของ timeout แต่ละครั้งไม่ได้

ข้อมูลปัจจุบันมี products 1 รายการ, stock_balances 0 รายการ และ purchase_orders 0 รายการ จึงไม่มีหลักฐานว่าปริมาณข้อมูลหรือ SQL ที่ประมวลผลช้าเป็นสาเหตุหลักในตอนนี้

การตรวจนี้ไม่ได้แก้ application code, environment, schema หรือข้อมูลธุรกิจ เพิ่มเฉพาะรายงานนี้

## วิธีตรวจและขอบเขต

- อ่านเส้นทางหน้า, layout, navigation, loading, account/profile, API client, route handlers, authentication, connection pool, SQL, migrations และ uploads
- วัด HTTP แบบ GET ที่ localhost:3000 สองครั้งต่อเส้นทาง และตรวจ development log ของ server ที่เปิดอยู่
- วัด SELECT 1 ผ่าน connection ไป Supabase ด้วย pool ชั่วคราว 1 connection แล้วปิด connection หลังวัด
- อ่านจำนวนข้อมูล, สถิติ pg_stat_statements และ performance advisor จาก Supabase แบบอ่านอย่างเดียว
- HTTP ของหน้าเป็นเวลาได้รับ HTML ทั้งหมด ไม่รวม hydration, JavaScript execution และ API หลังล็อกอิน ไม่ใช่เวลาที่ตารางพร้อมใช้งาน
- ไม่มี authenticated browser session ที่เครื่องมือเข้าถึงได้ จึงยังไม่ได้เก็บ network waterfall หลังล็อกอิน, LCP, INP หรือผลบนมือถือจริง
- ยังไม่ได้ benchmark production build ของโค้ดปัจจุบัน ตัวเลขต่อไปนี้ไม่ใช่ production SLA หรือ p95

## ผลวัด

| เส้นทาง | GET ครั้งแรกในชุดวัด | GET ซ้ำ | หมายเหตุ |
| --- | ---: | ---: | --- |
| /workspace | เกิน timeout 15 วินาที | 4,391 ms | มี log compile; ยังไม่ได้วัดซ้ำหลังอุ่นเต็มที่ |
| /account | 4,453 ms | 87 ms | มี log compile |
| /settings | 5,927 ms | 75 ms | มี log compile |
| /warehouse | 155 ms | 153 ms | route อาจอุ่นอยู่แล้ว |
| /warehouse/inventory?kind=products | 210 ms | 111 ms | มี preliminary request ก่อนชุดวัด; ไม่ใช่ cold start |
| /warehouse/inventory?kind=units | 77 ms | 88 ms | ใช้ route เดียวกับ products |
| /warehouse/receive | 1,284 ms | 102 ms | ครั้งแรกช้ากว่าซ้ำ |
| /warehouse/stock | 2,956 ms | 84 ms | ครั้งแรกช้ากว่าซ้ำ |
| /warehouse/reports | 1,619 ms | 145 ms | ครั้งแรกช้ากว่าซ้ำ |
| /api/health/live | 3,312 ms | 35 ms | endpoint ไม่ query ฐานข้อมูล |
| /api/health/ready | 1,500 ms | 51 ms | endpoint ตรวจ schema ผ่านฐานข้อมูล |

SELECT 1: ครั้งแรก 460 ms; อีกสามครั้ง 34, 34, 34 ms ตัวเลขแรกมี connection setup รวมอยู่ด้วย ไม่ใช่ SQL execution time ล้วน

สถิติสะสมจาก pg_stat_statements (ไม่ใช่สถิติเฉพาะการทดสอบนี้):

| กลุ่ม query | จำนวน calls | execution เฉลี่ย | execution สูงสุด |
| --- | ---: | ---: | ---: |
| auth/session | 21,343 | 0.038 ms | 11.643 ms |
| auth/rate limit | 12,838 | 0.146 ms | 28.748 ms |
| actor/members | 4,171 | 0.054 ms | 8.675 ms |
| branch membership | 3,870 | 0.008 ms | 0.687 ms |
| products | 277 | 0.087 ms | 7.848 ms |

สถิตินี้เป็นเวลาใน PostgreSQL ไม่รวม network, การรอ connection, Next compilation หรือ browser และเป็นการจัดกลุ่มจากข้อความ query

## สาเหตุและแนวทางแก้

### 1. Development compile เพิ่มเวลาหลายวินาที [ยืนยันจากการวัด]

`package.json:6` ใช้ `next dev --webpack`; `.next/dev/logs/next-development.log` มีการ compile ทั้งหน้าและ API ซ้ำ รวมถึงประวัติ full reload ระหว่างแก้โค้ด ตัวอย่าง health/live ที่ไม่ใช้ DB ก็ใช้ 3.31 วินาทีครั้งแรก แต่ 35 ms ครั้งถัดไป

วิธีแก้: วัด production ด้วย build ใหม่และ next start บนพอร์ตแยกก่อนตัดสินความเร็วจริง; สำหรับ dev ให้เปรียบเทียบ Turbopack กับ Webpack หลังตรวจ compatibility โดยวัด cold/warm route เดียวกัน แยก compile time ออกจาก API time ไม่ควรสรุปว่าเปลี่ยน bundler แล้วแก้ปัญหา API ทั้งหมดได้

### 2. Desktop และ mobile เรียกข้อมูลบัญชีซ้ำ [ยืนยันจากโค้ด]

`hooks/useAccountMenu.ts:30` เรียก session และ /api/me จากนั้นเรียก member เพื่อเอารูป ทั้ง `SidebarMain.tsx:89` และ `MobileNavbar.tsx:63` ใช้ hook นี้ และ SidebarMain mount MobileNavbar ที่บรรทัด 540 แม้ mobile UI จะถูก CSS ซ่อนไว้บน desktop

Account และ Settings mount HeaderNavbar กับ MobileNavbar พร้อมกันด้วย; Workspace เรียก /api/me เองและจาก account menu อีกครั้ง ส่วน `app/warehouse/layout.tsx:29` เรียก session แล้ว /api/me เพิ่ม

วิธีแก้: ใช้ account/session provider หรือ shared query cache หนึ่งชุด ให้ header/sidebar/mobile/page อ่านผลร่วมกัน; deduplicate request ที่กำลังทำงาน; ส่ง avatar/name/role ที่ต้องใช้ใน bootstrap response; โหลด profile เต็มเฉพาะหน้า account; ล้าง cache เมื่อ logout/เปลี่ยนบัญชี และ invalidate เมื่อแก้ profile/สิทธิ์

### 3. ทุก API ตรวจ session และสิทธิ์ผ่านหลาย DB round trips [ยืนยันจากโค้ด; พบ timeout ใน log]

`lib/warehouse/access.ts:17` ตรวจ session แล้ว query actor และ branch membership ตามลำดับ `lib/auth.ts:62` ปิด session cookie cache และใช้ rate limit storage ในฐานข้อมูล การกระจายข้อมูลหน้าเดียวออกเป็นหลาย API จึงเพิ่มงานตรวจสิทธิ์ซ้ำ

Log พบข้อความ `Connection terminated due to connection timeout` และ `Failed to get session` ของ /api/me และ /api/catalog/products จำนวน 14 entries ที่ตรงเงื่อนไขการค้นหา ไม่ใช่ 14 เหตุการณ์อิสระ เพราะเหตุเดียวอาจถูก log หลายชั้น

ค่าจาก .env.local คือ pool max 20, idle timeout 10,000 ms และ query timeout 15,000 ms; fallback ในโค้ดคือ max 1 และ connection timeout 5,000 ms ยังไม่ได้ตรวจค่าใน pool ของ process ที่รันอยู่โดยตรง การอ่าน env file ไม่รับประกันว่า process เก่าโหลดค่าใหม่แล้ว

วิธีแก้: ลด request ซ้ำก่อน; รวม actor+branches ใน query เดียวที่ยังตรวจบัญชีถูกระงับและสิทธิ์ครบ; รวมข้อมูลสำหรับ initial view ใน endpoint ที่ตรวจสิทธิ์ครั้งเดียว; เพิ่ม metric pool.waitingCount/totalCount/idleCount, connect time และ SQL time; ตรวจ connection budget ของทุก instance กับ Supabase pooler; ทดลอง idle timeout ที่ยาวขึ้นถ้าโฮสต์เป็น long-lived server แล้ววัดผล ไม่เพิ่ม max connections หรือ timeout แบบเดาสุ่ม

ถ้าจะเปิด session cache ต้องออกแบบการ revoke, ban และเปลี่ยนสิทธิ์ก่อน ไม่ใช้ cache เป็นเหตุให้ข้าม authorization ฝั่ง server

### 4. โหลดมากเกินจำเป็นและรอทั้งชุด [ยืนยันจากโค้ด]

`CatalogScreen.tsx:80` เรียก 8 API แม้หน้า units ต้องแสดงเพียงหน่วยสินค้า และเรียก units ซ้ำเป็นทั้งรายการหลักและ reference ฟอร์ม ทุกหน้าโหลด reference ทั้งหกชุดก่อนเปิดฟอร์ม

`ProductInventorySplitView.tsx:45` เรียก 7 API และรอ Promise.all ก่อนแสดงข้อมูล; Receive รอ me แล้วชุด 4 requests แล้วชุด 5 requests สำหรับผู้ใช้ที่ไม่ใช่ EMPLOYEE; Overview รอสามช่วงคล้ายกัน; Reports โหลดทั้งสองแท็บพร้อมกัน

วิธีแก้: โหลดรายการของแท็บที่ใช้งานก่อน; โหลด reference ตาม fields ของฟอร์มเมื่อกดเพิ่ม/แก้ไข; cache master data ตามขอบเขตสิทธิ์; ให้แต่ละส่วนแสดงผลได้เมื่อพร้อม; สำหรับ Overview ใช้ aggregate/summary endpoint แทนดึงรายการทั้งหมดมานับ; parallel เฉพาะงานที่ไม่ขึ้นต่อกันหลังทราบสิทธิ์

### 5. ไม่มี shared data cache และไม่มี cancellation ใน useRemote [ยืนยันจากโค้ด]

`components/warehouse/Ui.tsx:23` โหลดใหม่เมื่อ component mount และ refresh() โหลดทั้งชุดซ้ำ; cleanup กัน setState แต่ไม่ abort network request ที่เริ่มแล้ว `lib/api/client.ts:62` ใช้ fetch แบบ no-store และไม่มี timeout ค่าเริ่มต้น; callers ของ warehouseApi ยังไม่ได้ส่ง AbortSignal

วิธีแก้: shared query keys + request deduplication เช่น SWR/TanStack Query หรือ helper กลางที่เหมาะกับขอบเขต; แยกนโยบาย freshness ของ catalog/profile/stock; รองรับ AbortSignal และ timeout ที่เหมาะสม; หลัง mutation invalidate เฉพาะข้อมูลที่เกี่ยวข้อง; ไม่ cache ข้อมูลสิทธิ์หรือข้อมูลข้ามผู้ใช้แบบ global

`lib/auth-client.ts:75` คืน null ทั้งกรณีไม่มี session และ network/server error ทำให้ WarehouseLayout อาจส่งไป login เมื่อระบบ auth ชั่วคราวมีปัญหา ควรแยก unauthenticated จาก unavailable และแสดง retry state ที่ชัดเจน

### 6. กำหนดเวลารอไว้ใน UI [ยืนยันจากโค้ด]

`LoadingProvider.tsx:132` หน่วง router.push 350 ms และบรรทัด 155 บังคับ flow อย่างน้อย 1,300 ms + hold 80 ms; LoadingScreen exit ใช้อีก 550-650 ms ดังนั้น navigation ที่เรียก navigateWithLoading อาจเห็น overlay ราว 1.9-2.0 วินาที แม้ route พร้อมเร็ว

`RootSessionGate.tsx:26` รอ 1,600 ms ก่อนเข้า workspace; AuthView หน่วงหลัง sign-in 350 ms ด้วย ข้อสังเกตนี้ไม่ครอบคลุมทุก sidebar click: NavbarsubWarehouse ใช้ router.push โดยตรง

วิธีแก้: navigate ทันที ใช้ pending state ตามงานจริง; แสดง loader เมื่อรอเกินช่วงสั้นเพื่อกันกระพริบ และใช้ exit สั้นลง; เก็บ animation โดยไม่ขวางข้อมูลที่พร้อมแล้ว Skeleton ช่วย feedback แต่ไม่ได้ทำให้ API เร็วขึ้น

### 7. หน้า account โหลดชุดข้อมูลใหญ่ก่อนใช้ [ยืนยันจาก import และขนาดไฟล์]

AccountProfile static-import SecondaryRegModal ที่บรรทัด 14; modal import selectors ที่ใช้ `data/masterData.ts:6` ซึ่ง import address JSON 2,215,067 bytes และ school JSON 137,097 bytes รวมประมาณ 2.35 MB ของ source ก่อน compression แม้ modal จะยังไม่เปิด

ไฟล์ account page.js ใน dev ที่ตรวจพบมีขนาด 10,551,381 bytes (ประมาณ 10.55 MB); workspace 4.62 MB และ inventory 3.30 MB ตัวเลขเหล่านี้เป็นไฟล์ dev ที่มี overhead/source maps ไม่ใช่ขนาด production download

วิธีแก้: dynamic import modal และ avatar cropper; โหลด address/school data เมื่อเปิดส่วนที่ต้องใช้ หรือค้นหาผ่าน endpoint ที่จำกัดผลลัพธ์; แยก address และ school ออกจาก masterData module เดียว; ตรวจ bundle ของ production ก่อนและหลัง

### 8. Pagination ปัจจุบันลด DOM แต่ไม่ลด API payload [ยืนยันจากโค้ด]

Catalog และ products ใช้ slice() หลังโหลดข้อมูลแล้ว API catalog ใช้ LIMIT 500 (`lib/warehouse/catalog.ts:142`), balances/ledger ใช้ LIMIT 1000 (`lib/warehouse/stock.ts:17,35`) และไม่มีการเลื่อนไปดึงชุดถัดไปใน client ปัจจุบัน

เมื่อข้อมูลเกิน limit ไม่เพียงช้า: จำนวนทั้งหมดใน UI จะเป็นแค่ข้อมูลชุดที่โหลดมา และการรวมยอดคงเหลือจาก balances ที่ตัดไว้ 1000 แถวอาจไม่ครบ นี่เป็นข้อจำกัดของ pagination ที่เพิ่งเพิ่มด้วย

วิธีแก้: server-side pagination พร้อม filter/search/sort และ page metadata; ทำ product summary query ที่รวมยอด stock ภายใต้ branch scope ก่อน paginate สินค้า; lookup ของ dropdown ต้องค้นหา/แบ่งหน้าแยก ไม่ใช้ dataset ของหน้าตารางเป็น reference ทั้งระบบ; export ต้องมี flow แยกเพื่อส่งออกครบ

### 9. Index และ SQL ที่จะเสี่ยงเมื่อข้อมูลโต [ยืนยัน advisor; ยังไม่ใช่คอขวดที่วัดพบตอนนี้]

Supabase performance advisor พบ foreign keys ไม่มี covering index 54 ข้อ และ unused indexes 9 ข้อ ฐานข้อมูลยังเล็กมาก จึงไม่ควรเพิ่ม index ทุกข้อหรือลบ unused index โดยไม่มี workload สนับสนุน

จุดตรวจเป็นลำดับแรก: goods_receipt_lines(purchase_order_line_id), supplier_receipt_lines(purchase_order_line_id), carrier_receipt_lines(carrier_receipt_id, product_id), inventory_document_lines(document_id), issue_events(issue_report_id), และ evidence_links ตาม owner ที่ query ใช้

`lib/warehouse/reports.ts:28` และ `purchase-orders.ts:34` ใช้ correlated aggregate subqueries หลายครั้งต่อรายการ ควร EXPLAIN (ANALYZE, BUFFERS) ด้วยข้อมูลตัวแทน แล้วพิจารณา aggregate ครั้งเดียวและ join ผล; ตอนนี้ข้อมูลน้อยจนยังพิสูจน์ผลต่างบน production workload ไม่ได้

### 10. Upload และงานบันทึกหลายรายการ [ยืนยันโครงสร้าง; ยังไม่ได้ benchmark]

EvidencePicker ใน Ui.tsx อัปโหลดทีละไฟล์ตามลำดับ; media.ts อ่านไฟล์ทั้งก้อนเข้า memory แล้วส่งจาก app server ต่อไป Storage; งานลงรับ/serial มี query ใน loop ภายใน transaction

วิธีแก้: วัด upload แยกจาก page load, จำกัด concurrency เช่น 2-3 ไฟล์พร้อมกัน, พิจารณา signed upload ที่ยังตรวจไฟล์และบันทึก ownership ครบ; batch insert/validation ที่ทำได้ แต่รักษา transaction, idempotency และ stock row locking ห้ามย้าย query ออกจาก transaction เพียงเพื่อให้เร็วขึ้น

## แผนรายหน้า

จำนวน calls ด้านล่างนับจากโค้ดเฉพาะ loader ของหน้า ไม่รวม navigation/session/profile ของ layout และไม่ใช่ network count ที่วัดหลังล็อกอิน

| หน้า/ส่วน | สิ่งที่ตรวจพบ | แนวทางที่เหมาะ |
| --- | --- | --- |
| / และ auth/login | session check + timer + eager client view | server redirect เมื่อรู้ session; ลด timer; ใช้ session ชุดเดียว |
| /workspace | /me ของหน้า + /me ของ menu | shared bootstrap/profile; ลดการโหลดซ้ำ |
| /account | me ต่อ member; header/mobile ซ้ำ; modal/data ใหญ่ | shared profile, lazy modal/datasets, invalidate หลังบันทึก |
| /settings | organization 1 call แต่ account hooks ของ navbar ซ้ำ | ใช้ shared account และแสดงองค์กรได้อิสระ |
| /controlpanel | 4 calls และโหลดองค์กร/สาขาก่อนใช้บางแท็บ | per-tab query; member list pagination; audit โหลดเมื่อเปิดแท็บอยู่แล้ว |
| /warehouse | 5 calls แบ่งสามช่วง; ดึงรายการมานับ | summary endpoint + shared actor |
| inventory products | 7 calls; รวม stock/filter ฝั่ง browser | paginated product summary endpoint + shared reference cache |
| inventory kinds, branches, suppliers | 8 calls ทุก kind; reference เกินจำเป็น | รายการ 1 query + shared actor; reference ตามฟอร์มเมื่อใช้ |
| receive | 10 calls/สามช่วงสำหรับ non-EMPLOYEE | โหลดตาม workflow step; paginated lists; details เมื่อเลือก |
| stock / movements / transfer | 5 calls โหลด balance/ledger พร้อมกัน | query ตาม initialTab; server filter/pagination; reference ของฟอร์มแยก |
| warehouse/issues | list แล้ว details; refresh ทั้ง list หลังเปลี่ยน | paginate list; invalidate/update รายการที่เปลี่ยน |
| warehouse/reports | 2 reports โหลดพร้อมกัน | โหลดแท็บ active; filter ช่วงเวลา; query/index ตามแผนจริง |
| warehouse alerts / analysis / transfer/audit / inventory/[sku] | redirect ไปหน้าปลายทาง | ประเมินหน้าปลายทาง; navigation ควรชี้ปลายทางตรงเมื่อเหมาะสม |
| /datacenter /integration /reports | placeholder/under development | ไม่ใช่ business API ช้า; /reports มี countdown กลับ workspace 10 วินาที |
| assets/fonts/background | root โหลด 4 font families; Prompt 6 weights | ตรวจ fonts ที่ใช้จริง/production waterfall; ลด weights ที่ไม่ได้ใช้หลังวัด |

## ส่งต่องาน Backend และ Database

รายการนี้ระบุขอบเขตงานสำหรับส่งให้ทีม Backend และ Database โดยตรง

### งาน Backend

**BE-1: เพิ่ม API และ database timing**

- จุดเริ่ม: `lib/core/http/handler.ts`, `lib/core/db/pool.ts`, `lib/core/http/response.ts`
- บันทึกเวลารวมต่อ API และแยกช่วงตรวจ session, ขอ connection จาก pool, query และ serialize response โดยใช้ request ID เดิม
- เก็บสถานะ pool ที่จำเป็น เช่น จำนวน connection ที่ใช้งาน/ว่าง/รอ และนับ timeout แยกตามขั้นตอน ห้ามบันทึก cookie, token, รหัสผ่าน, SQL parameters หรือข้อมูลส่วนบุคคล
- เพิ่ม `Server-Timing` เฉพาะค่าที่เปิดเผยได้ และ log แบบมีขอบเขต ไม่ log SQL เต็มที่อาจมีข้อมูลลับ
- ผลส่งมอบ: log ที่เชื่อมต่อด้วย request ID ได้ พร้อมแยกได้ว่า request ช้าเพราะ session, pool queue, SQL หรือขั้นตอนอื่น
- ตรวจรับ: เรียก endpoint ที่ไม่ใช้ DB และ endpoint ที่ใช้ DB แล้วเห็น timing แยกกัน; timeout หนึ่งครั้งระบุขั้นตอนที่เกิดได้

**BE-2: ลดการตรวจ actor ซ้ำใน API หลายตัว**

- จุดเริ่ม: `lib/warehouse/access.ts` และ `lib/warehouse/core.ts` ซึ่ง endpoint เรียกตรวจ session, actor และ branch membership
- ตรวจว่ารวม query actor กับ branch memberships เป็น query เดียวได้หรือไม่ โดยยังเช็กบัญชีถูกลบ/ระงับ, role, branch scope และ `must_change_password` เหมือนเดิม
- สำรวจ endpoint รวมข้อมูลสำหรับ initial view ของหน้าที่เรียก API หลายชุด แต่ต้องยืนยันสิทธิ์ของทุกข้อมูลที่รวมและห้ามส่ง field ที่ role นั้นอ่านไม่ได้
- ผลส่งมอบ: query/request ลดลงเมื่อเปิดหน้า โดยไม่ลดขั้นตอน authorization ของ server
- ตรวจรับ: ทดสอบทุก role และ branch scope รวมถึงบัญชีถูกระงับ/ต้องเปลี่ยนรหัสผ่าน และยืนยันว่าได้รับผลลัพธ์หรือ error แบบเดิมตามสิทธิ์

**BE-3: เพิ่ม server-side pagination ให้ API รายการ**

- จุดเริ่ม: `lib/warehouse/catalog.ts`, `lib/warehouse/stock.ts`, `lib/warehouse/purchase-orders.ts`, `lib/warehouse/carrier-receipts.ts`, `lib/warehouse/supplier-receipts.ts`, `lib/warehouse/goods-receipts.ts`, `lib/warehouse/issues.ts` และ `lib/core/http/pagination.ts`
- รองรับ `limit` กับ cursor หรือรูปแบบ page ที่ตกลงกับ FE; กำหนด default/max limit, ตรวจค่าผิดรูปแบบ, กรองและเรียงฝั่ง server ก่อนแบ่งหน้า
- ให้ response มีข้อมูลหน้า `limit`, `nextCursor`/`hasMore` และ `total` เฉพาะกรณีที่ต้องใช้และคำนวณได้อย่างเหมาะสม
- รักษา response เดิมไว้ระหว่างทยอยย้าย client: ใช้พฤติกรรมเดิมเมื่อไม่ได้ส่งพารามิเตอร์ใหม่ หรือออก version ใหม่แล้วกำหนดวันเลิกใช้สัญญาเดิมชัดเจน
- ผลส่งมอบ: API ดึงหน้าถัดไปได้โดยไม่ข้าม/ซ้ำเมื่อข้อมูลมีการเพิ่ม และไม่ส่งเกินเพดานที่กำหนด
- ตรวจรับ: ทดสอบหน้าแรก/กลาง/สุดท้าย, ไม่มีข้อมูล, limit ต่ำกว่า 1/สูงเกินกำหนด, filter ร่วม pagination, role/branch scope และข้อมูลมากกว่า 500/1,000 รายการ

**BE-4: ทำ API สรุปสินค้าและสต๊อกที่ถูกต้องก่อนแบ่งหน้า**

- จุดเริ่ม: `lib/warehouse/stock.ts` และ `app/api/stock/balances/route.ts`; ปัจจุบันหน้า products โหลด products/balances แล้ว join และกรองใน browser
- ออกแบบ query/API ที่คำนวณยอดต่อสินค้า ภายใต้ branch/warehouse scope ก่อนเลือกหน้าสินค้า; ระบุสถานะและ reorder point จากข้อมูลชุดเดียวกัน
- ห้าม paginate balances ก่อนรวมยอด เพราะจะทำให้ยอดสินค้าต่อ warehouse ไม่ครบ; กำหนดรูปแบบผลลัพธ์ที่ FE นำไปแทน client-side join ได้
- ผลส่งมอบ: API ตอบหน้าสินค้าและ stock summary พร้อม metadata โดยไม่ต้องโหลด balances ทั้งระบบ
- ตรวจรับ: เทียบยอด API กับ SQL รวมยอดโดยตรงหลายสินค้า/หลายคลัง/หลายสาขา รวมสินค้าที่ไม่มี balance และผู้ใช้ที่เห็นได้เพียงบางสาขา

**BE-5: ปรับการโหลดรายงานและดูแล request อายุยาว**

- จุดเริ่ม: `lib/warehouse/reports.ts`, `lib/warehouse/purchase-orders.ts`, `lib/api/client.ts` และ callers ของ `useRemote`
- สำหรับรายงาน PO ค้างรับ ตรวจ correlated aggregate ที่คำนวณยอดรับซ้ำต่อบรรทัดและพิจารณา aggregate แล้ว join ครั้งเดียวเมื่อ plan ยืนยันว่าดีกว่า
- รองรับ timeout/cancel ของ request ที่ผู้ใช้เปลี่ยนหน้าแล้ว และแยก session หมดอายุออกจาก auth/database ชั่วคราว เพื่อให้ UI แสดง retry แทน redirect ผิดกรณี
- ผลส่งมอบ: รายงานพร้อมเวลาฐานข้อมูลและเวลา request แยก; request ที่ยกเลิกไม่ไปอัปเดตหน้าที่ออกไปแล้ว
- ตรวจรับ: เทียบจำนวน/ยอดกับผลเดิมด้วยชุดข้อมูลหลายเอกสาร และทดสอบ session error, DB timeout และ cancel request

**BE-6: ปรับงานอัปโหลด/บันทึกเอกสารหลังมี baseline**

- จุดเริ่ม: `components/warehouse/Ui.tsx` และ `lib/warehouse/media.ts`, `lib/warehouse/goods-receipts.ts`
- วัดเวลาและ memory แยก upload จาก API/page load ก่อน; จากนั้นพิจารณาจำกัด concurrency ของหลายไฟล์หรือ batch insert ที่ตรวจสิทธิ์/ownership ได้ครบ
- รักษา transaction, idempotency, stock locking และ rollback เมื่อ upload หรือการบันทึกฐานข้อมูลล้มเหลว
- ผลส่งมอบ: วัดขนาดไฟล์/จำนวนบรรทัดตัวแทน พร้อมหลักฐานว่า failure และ retry ไม่สร้างข้อมูลหรือ stock ซ้ำ

### งาน Database

**DB-1: ตรวจ index ด้วย query plan และข้อมูลตัวแทน**

- เริ่มจาก SQL ที่ใช้ซ้ำใน `lib/warehouse/reports.ts`, `lib/warehouse/purchase-orders.ts`, `lib/warehouse/stock.ts`, `lib/warehouse/issues.ts` และ `lib/warehouse/media.ts`
- ใช้ `EXPLAIN (ANALYZE, BUFFERS)` บนข้อมูลจำลองที่มีขนาดใกล้การใช้งานจริง เก็บ query plan, row estimate/actual, buffers และเวลารันก่อนเสนอ index
- ตรวจความเหมาะสมของ index สำหรับ `goods_receipt_lines.purchase_order_line_id`, `supplier_receipt_lines.purchase_order_line_id`, `carrier_receipt_lines.carrier_receipt_id`/`product_id`, `inventory_document_lines.document_id`, `issue_events.issue_report_id` และ owner columns ใน `evidence_links`
- Performance advisor รายงาน FK ไม่มี covering index 54 จุด ให้ประเมินตาม query workload และงานลบ/แก้ parent row ไม่สร้าง index ครบ 54 จุดโดยไม่ดูแผน
- ผลส่งมอบ: รายการ index ที่เสนอพร้อม query ที่รองรับ, plan ก่อน/หลัง, ขนาดพื้นที่โดยประมาณ และผลกระทบต่อ write
- ตรวจรับ: plan หลังเปลี่ยนใช้ index ตามคาดกับข้อมูลตัวแทน และค่าจำนวนแถว/ผลลัพธ์ไม่เปลี่ยน

**DB-2: ทำ migration แบบเพิ่มก่อนและย้อนกลับได้**

- สร้าง migration ผ่าน Supabase CLI ตามขั้นตอนของ repository; ใส่เฉพาะ index ที่ผ่าน DB-1
- ระบุวิธี deploy ที่ลดการ block writes ตามข้อจำกัดของ migration/ระบบจริง และตรวจสถานะ index หลัง deploy
- เพิ่ม index เป็น additive change; ยังไม่ลบ index ที่ advisor ระบุว่า unused จนยืนยัน workload รอบยาวและตรวจ dependency
- ผลส่งมอบ: migration, วิธีตรวจหลัง deploy และขั้นตอน rollback ที่ไม่ลบข้อมูลธุรกิจ
- ตรวจรับ: migration ทำงานบนฐานข้อมูลทดสอบ, index valid, API ที่เกี่ยวข้องคืนผลเดิม และ rollback plan ผ่านการทบทวน

**DB-3: ตรวจ connection pool และสาเหตุ timeout**

- เทียบเวลารอ connection จาก BE-1 กับ `DATABASE_POOL_MAX`, จำนวน worker/process/instance และเพดาน connection ของ Supabase pooler
- ยืนยันค่า configuration จาก process ที่รันจริง ไม่ใช้เพียงค่าที่อ่านจาก `.env.local`; ตรวจช่วงหลัง idle 10 วินาทีว่าต้องเปิด connection ใหม่บ่อยหรือไม่
- ตรวจ query ที่ใช้เวลาสูง, lock wait, connection saturation และช่วงเวลาที่เกิด `Connection terminated due to connection timeout`
- ผลส่งมอบ: ข้อเสนอค่า pool/idle/connection/query timeout พร้อมคำนวณ connection budget รวมต่อ environment
- ตรวจรับ: ทดสอบ concurrency ตามโหลดตัวแทน; pool ไม่มีคิวค้าง/timeout ภายใต้เป้าหมาย และฐานข้อมูลยังมี connection headroom
- ห้ามเพิ่ม `DATABASE_POOL_MAX` หรือ timeout โดยไม่มีตัวเลข connection budget และผลทดสอบ เพราะหลาย process คูณ pool size อาจใช้ connection เกินเพดาน

**DB-4: ตรวจ SQL รายงานที่รวมยอดซ้ำ**

- หลังได้ข้อมูลตัวแทน ให้ DB และ BE ทบทวน correlated subqueries ใน PO outstanding และ detail queries ของ purchase order
- เปรียบเทียบรูปแบบเดิมกับการ aggregate `goods_receipt_lines` หนึ่งครั้งแล้ว join โดยคงเงื่อนไข reversed/posted และยอดเดิมครบ
- ผลส่งมอบ: plan และเวลาเปรียบเทียบพร้อมผลการตรวจความเท่ากันของยอด
- ตรวจรับ: รายงานนับยอด counted, posted, damaged, wrong และ remaining ได้ตรงกับข้อมูลจริงก่อน/หลังการเปลี่ยน

### งานร่วม BE + Database

1. ทำ BE-1 และ DB-3 ก่อน เพื่อบอกให้ได้ว่า latency มาจาก app, connection queue, network หรือ SQL
2. ทำ DB-1 แล้วจึงตัดสินใจ DB-2; ใช้ข้อมูลตัวแทนเพราะตารางจริงปัจจุบันเล็กเกินจะพิสูจน์ประโยชน์ของ index ได้
3. ทำ BE-2 แล้วเปลี่ยน API ตาม BE-3/BE-4 โดยให้ BE กับ FE ตกลง response schema และช่วงเปลี่ยนผ่านก่อนเริ่มย้าย client
4. ทำ BE-5/BE-6 หลังเก็บ baseline เพื่อโฟกัส endpoint ที่มีเวลาสูงจริง

**Definition of Done ของงานชุดนี้:** มีผลก่อน/หลังแยก cold/warm และเวลาของ API/DB; p50/p95 จากหลายรอบใน production-like environment; pagination คืนข้อมูลครบเมื่อเกิน limit; ผล aggregate stock/report เท่ากับ query ตรวจสอบ; authorization ผ่านทุก role/branch; migration ตรวจย้อนกลับได้; และ connection pool ยังมี headroom ตามงบของทุก instance

## ลำดับดำเนินการที่แนะนำ

1. เก็บ baseline production และ authenticated waterfall; ใช้รายการ BE-1/DB-3 ในหัวข้อส่งต่องานเพื่อแยกเวลารอแต่ละช่วง
2. ลดการเรียก account/session ซ้ำตาม BE-2 โดยคง server authorization ทุก endpoint
3. แยกการโหลดข้อมูลตามหน้า/แท็บ/ฟอร์ม และ lazy-load account modal/datasets
4. เพิ่ม shared cache ที่มี invalidation และ cancellation; ลด refresh ทั้งชุดหลังบันทึก
5. ทำ server-side pagination และ product summary query ตาม BE-3/BE-4
6. จูน index/SQL/connection ตามผล DB-1 ถึง DB-4 ไม่ปรับจากจำนวน warning อย่างเดียว
7. ตรวจ upload และ transaction loops ด้วยขนาดเอกสารตัวแทนตาม BE-6

หลังแก้ให้เปรียบเทียบ first visit/revisit, desktop/mobile, เปลี่ยน kind/filters, เปิด modal, บันทึกแล้วกลับหน้าเดิม, logout/login และหลาย role; ใช้ข้อมูลเกิน 500 products/1000 balances เพื่อพิสูจน์ความครบของ pagination และยอด stock เก็บหลายตัวอย่างก่อนรายงาน p50/p95 และทดสอบว่าไม่มีข้อมูลข้ามผู้ใช้/สิทธิ์หลัง cache

## เอกสารอ้างอิง

- [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist): แนะนำ build/start และวัด production แยกจาก dev
- [Next.js client-side data fetching](https://nextjs.org/docs/app/guides/client-side-data-fetching): shared cache, deduplication และ server-provided initial data
- [node-postgres pooling](https://node-postgres.com/features/pooling): connection setup cost และการใช้ pool
- [Supabase unindexed foreign keys remediation](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys): ลิงก์ remediation จาก performance advisor

อ่านเอกสาร Next.js ที่ติดตั้งใน node_modules/next/dist/docs ประกอบด้วย เพื่อเทียบกับเวอร์ชันของโปรเจกต์
