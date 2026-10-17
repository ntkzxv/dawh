# รายงานงาน Cache ฝั่ง Warehouse FE

อัปเดต: 14 ตุลาคม 2026
สถานะ: ข้อ 1–5 เสร็จแล้ว — เป้าหมาย, inventory, shared reference cache และ lazy loading ของ Receive

## เป้าหมายของงาน

1. ลด API request ที่ซ้ำ เมื่อหลาย component หรือหลายหน้าเรียกข้อมูล Warehouse ชุดเดียวกัน
2. เมื่อกลับเข้าหน้าหรือเปิดฟอร์มซ้ำ ให้ reuse ข้อมูลอ้างอิงที่ยังสด และ refresh เมื่อถึงเวลาที่กำหนด
3. โหลดรายการและข้อมูลอ้างอิงเฉพาะแท็บหรือฟอร์มที่ผู้ใช้กำลังใช้งาน
4. หลังบันทึกหรือแก้ไขข้อมูล ต้องไม่แสดง cache เก่าที่ทำให้เข้าใจว่ายังเป็นค่าปัจจุบัน
5. การ cache ต้องไม่เปลี่ยนการตรวจ session, role และ branch scope ของ API ฝั่ง server

## ขอบเขตที่ตกลงใช้เป็นแนวทาง

- เริ่มจาก cache ในหน่วยความจำของ browser; ยังไม่บันทึกข้อมูลธุรกรรมลง `localStorage`, `sessionStorage` หรือ IndexedDB
- Cache ใช้เพื่อ reuse ผลอ่านข้อมูลที่ server อนุญาตแล้วเท่านั้น; server ยังคงเป็นผู้ตัดสินสิทธิ์ทุก request
- แยก key ตามบัญชี/สิทธิ์, resource และพารามิเตอร์ที่เปลี่ยนผลลัพธ์ เช่น search, filter, sort และ cursor
- เริ่มจากข้อมูลอ้างอิงที่เปลี่ยนไม่บ่อยและมีการเรียกซ้ำชัดเจน ก่อนขยายไปยังรายการธุรกรรมและรายละเอียด
- ไม่ cache mutation และไม่ทำ optimistic update ในระยะแรก; เมื่อ mutation สำเร็จให้ invalidate ข้อมูลที่เกี่ยวข้อง
- ล้าง cache และยกเลิก request ที่แชร์อยู่เมื่อ logout หรือเปลี่ยนบัญชี/สิทธิ์

## เหตุผลจาก codebase

- `lib/api/client.ts` ตั้ง `fetch` เป็น `no-store`; cache ที่ทำในงานนี้จึงเป็น client-side memory cache ไม่ใช่ browser HTTP cache
- `lib/api/warehouse.ts` เป็นจุดรวม API ของ Warehouse และมีการรวม in-flight request สำหรับ `/api/me` อยู่เฉพาะจุดเดียว
- `hooks/useRemoteResource.ts` และ `hooks/useCursorResource.ts` เก็บผลใน state แยกตาม hook instance จึงยังไม่แชร์ผลระหว่าง component หรือหน้า
- `docs/warehouse-frontend-cache.md` มีแผนรายละเอียดเดิมเกี่ยวกับ key, freshness, invalidation, lazy loading และการตรวจรับ; งานนี้ใช้รายงานนี้บันทึกความคืบหน้ารายข้อ และใช้แผนเดิมเป็นรายละเอียดอ้างอิง

## เกณฑ์ความสำเร็จ

- คำขอ key เดียวกันที่เกิดพร้อมกัน reuse request เดียวกัน
- การกลับมาใช้ข้อมูลที่ยัง fresh ลด request ซ้ำได้ โดยข้อมูลที่ stale ถูก refresh ตามนโยบาย
- cache แยกขาดเมื่อบัญชีหรือ scope เปลี่ยน และไม่มีข้อมูลจากผู้ใช้ก่อนหน้าหลัง logout/login
- mutation ที่สำเร็จทำให้ข้อมูลที่เกี่ยวข้องเปลี่ยนหรือถูกโหลดใหม่; mutation ที่ล้มเหลวไม่ทำให้ cache แสดงค่าที่บันทึกสำเร็จ
- การเปลี่ยน search, filter, sort, cursor หรือ resource ไม่หยิบผล cache ของ query อื่นมาแสดง
- วัด request count และเวลาแสดงข้อมูลก่อน/หลังจาก browser flow เดียวกัน; ยังไม่ตั้งตัวเลขเป้าหมายจนกว่าจะได้ baseline จริง

## ข้อ 1 เสร็จแล้ว: เป้าหมายและขอบเขต

กำหนดเป้าหมายและข้อจำกัดของ cache ตามหัวข้อด้านบน ไม่มีการแก้โค้ดในขั้นนี้

## ข้อ 2 เสร็จแล้ว: inventory ข้อมูล Warehouse

inventory นี้บันทึก call sites และเงื่อนไขโหลดก่อนทำข้อ 4; ความถี่เปลี่ยนเป็นการจัดระดับเพื่อวางนโยบาย ไม่ใช่สถิติจาก production. ยังไม่ได้เก็บ authenticated browser waterfall จึงไม่นับ request จริงต่อ navigation.

### Reference และ lookup

| Resource / endpoint | จุดใช้และเงื่อนไขโหลดปัจจุบัน | ระดับเปลี่ยน | Mutation ที่ต้อง invalidate |
| --- | --- | --- | --- |
| Catalog references: /api/catalog/{kind} เช่น warehouses, branches, product-categories, units, brands, suppliers | Stock โหลด warehouses ตอนเข้าเพจ; Transfer โหลด warehouses ตอนเข้าเพจ; Inventory โหลด categories + warehouses ตอนเข้าเพจ และ units + brands เมื่อเปิด modal; Receive เรียก suppliers/CEO, branches หรือ warehouses ตาม workflow step; Catalog โหลด references เมื่อเปิดฟอร์มหรือ filter บางชนิด; Control Panel โหลด branches เมื่อเปิดแท็บ members | ต่ำถึงกลาง; แก้ผ่านหน้าจัดการข้อมูลหลัก | create/update ของ catalog kind เดียวกัน; เปลี่ยนบัญชี/role/branch scope ต้องล้าง namespace |
| CEO list: /api/org/ceos | โหลดเมื่อ Receive อยู่ขั้น PO; ใช้ในฟอร์มสร้าง PO | ต่ำถึงกลาง | เปลี่ยนสมาชิกหรือ role ที่ส่งผลต่อ CEO list |
| Product search: /api/catalog/products?lookup=1&q=... | ProductSearchSelect เริ่มโหลดหลังผู้ใช้ activate และเปลี่ยน query; ใช้ query ที่ normalize เป็น key แยก | กลาง; เปลี่ยนตาม query และ catalog | create/update product |

### รายการ, รายละเอียด และรายงาน

| Resource / endpoint family | จุดใช้และเงื่อนไขโหลดปัจจุบัน | ความสดที่ต้องการ | Mutation/การเปลี่ยน query ที่เกี่ยวข้อง |
| --- | --- | --- | --- |
| Catalog pages: /api/catalog/{kind} พร้อม page/search/filter | Catalog และ Branch Management โหลดหน้าปัจจุบัน; key ต้องมี kind, page, search และ filters | กลาง | create/update ของ catalog kind นั้น; แยกจาก reference lookup แบบเต็ม |
| Inventory products: /api/warehouse/inventory/products | โหลดเมื่อเข้า Inventory และเปลี่ยน page/search/category/status/warehouse; search มี debounce ใน UI | กลางถึงสูง | create/update product และ stock movements ที่เปลี่ยน summary |
| Receiving lists: purchase orders, supplier receipts, carrier receipts, goods receipts | Receive โหลด list ตาม workflow step; pagination แยก resource; PO search มี query; เปลี่ยน step แล้วโหลดชุดใหม่ | สูง/ธุรกรรม | create/update/close PO, create/update supplier receipt, create/update/confirm carrier, create/post goods receipt |
| Stock balances และ ledger | Stock โหลด dataset ตาม tab/filter/page; ledger query รวม search, date, kind, operator; warehouses โหลดแยกต่างหาก | สูง โดยเฉพาะ balances | create/reverse stock document และการลง stock จาก goods receipt |
| Stock transfers | Transfer โหลดตาม page/search/warehouse/date; TransferAuditBoard โหลด summary list ขนาดเล็กและ audit | สูง/ธุรกรรม | create/reverse transfer; ต้อง invalidate balances และ ledger ด้วย |
| Issues list/detail และ reports | Issues โหลด cursor list และ detail เมื่อเลือก/refresh; Reports โหลดเฉพาะ active tab และ reset component เมื่อสลับแท็บ | Issues และ reports สะท้อนธุรกรรม จึง stale ได้เร็ว | create issue, add event/claim; การรับ/ลง/กลับรายการกระทบ outstanding และ receipt reports |
| Members, organization, dashboard, audit | Control Panel โหลด members + branches เมื่อเปิด members tab และ audit เมื่อเปิด audit tab; dashboard โหลดเมื่อเปิด Overview; organization/profile โหลดในหน้าตั้งค่าหรือบัญชี | กลางถึงสูงตาม resource | member create/update/delete/restore และ role change; save organization; audit ถูกเพิ่มจาก mutation ที่ตรวจสอบได้ |

### ข้อค้นพบที่มีผลต่อการออกแบบ

- useRemoteResource และ useCursorResource เก็บ state แยกต่อ hook; การกลับหน้าและการเรียกจากอีก component จึงไม่ reuse result กัน. มีเพียง /api/me ที่รวม in-flight promise ใน lib/api/warehouse.ts.
- Receive โหลด reference ตาม step ทันทีเมื่อ account พร้อม (enabled: !!account?.me), ไม่ได้รอให้เปิดฟอร์ม; list ของ Receive เป็น step-specific และควรใช้ key แยกกัน.
- Stock ปัจจุบันส่ง search เข้า load โดยตรงทุกครั้งที่ state เปลี่ยน; ถ้าจะ cache search ต้องใช้ query ที่ normalize/debounce แล้ว ไม่ควรแชร์ key ระหว่างข้อความค้นหาต่างกัน.
- รายการที่แบ่งหน้าและ reference lookup แม้ใช้ catalog endpoint เดียวกันต้องมีคนละ key; ห้ามถือว่าหน้าแรกของ catalog คือรายการทั้งหมด.
- Mutation ปัจจุบันส่วนใหญ่ refresh state ของหน้าที่กำลังเปิดเท่านั้น; shared cache ต้องมี invalidation ข้ามหน้า/resource ตามตารางและไม่ invalidate เมื่อ mutation ล้มเหลว.
- data key ต้องมี identity/scope จาก session state; key ฝั่ง client เป็นเพียง namespace และไม่แทนการตรวจสิทธิ์ API.

### Resource แรกที่แนะนำ

เริ่ม cache read-only reference catalog("warehouses") ใน memory เพราะถูกเรียกซ้ำจาก Stock, Transfer, Inventory และ Receive ขั้นนับ; freshness โดยทั่วไปสูงกว่า list ธุรกรรม และ invalidation แคบเมื่อมีการแก้ warehouses. ต้องใช้ key ที่รวม account/role/branch scope และแยกจาก paginated warehouse catalog. หากผู้ใช้แก้ warehouse สำเร็จ ให้ invalidate reference key นี้และข้อมูล filter ที่พึ่งพาคลัง.

### ข้อจำกัดของ inventory

inventory ในข้อ 2 สรุปจาก source code; ยังไม่ได้ตรวจ network waterfall ด้วย authenticated browser จึงไม่มีตัวเลขจำนวน request, payload หรือเวลาที่ประหยัดจาก cache.

## ข้อ 3 เสร็จแล้ว: shared cache สำหรับ warehouse reference

เพิ่ม client-side memory cache สำหรับ reference warehouses โดยไม่เปลี่ยน API request ของรายการธุรกรรม และยังคง fetch แบบ no-store ฝั่ง browser ตาม client เดิม

- TTL 60 วินาที; เมื่อหมดอายุ request ถัดไปจะดึงข้อมูลใหม่ ไม่มีการเก็บถาวรหรือ stale-while-revalidate
- key ประกอบด้วย auth user ID, account ID, role และ branch IDs ที่เรียงลำดับแล้ว; ข้อมูลที่ต่าง scope ใช้คนละ entry
- รวม request ที่กำลังทำงานสำหรับ key เดียวกัน; การยกเลิกของ consumer หนึ่งรายไม่ยกเลิก request ที่ shared consumer อื่นยังใช้
- cache ล้างและ abort request ที่เกี่ยวข้องเมื่อ logout หรือ scope เปลี่ยน
- การเพิ่ม/แก้ warehouse สำเร็จจาก Catalog จะล้าง warehouse reference cache; mutation ที่ล้มเหลวไม่ล้างในเส้นทางนี้
- ย้าย call sites ของ Stock, Transfer, Inventory filters และ Receive ขั้นนับมาใช้ cache ร่วมกัน; Stock/Transfer/Inventory รอ account scope ก่อนโหลด reference

ไฟล์ที่เปลี่ยน: lib/api/warehouse-reference-cache.ts, context/WarehouseAccountContext.tsx, components/warehouse/StockScreen.tsx, components/warehouse/TransferScreen.tsx, app/warehouse/inventory/ProductInventorySplitView.tsx, components/warehouse/ReceiveScreen.tsx และ components/warehouse/CatalogScreen.tsx.

ยังไม่ได้วัด authenticated browser waterfall หรือรัน automated checks ในรอบนี้ จึงยืนยันได้จากการตรวจ source ว่า call sites ใช้ helper เดียวกัน แต่ยังไม่มีหลักฐาน runtime ว่า request ลดลงจริงหรือ TTL 60 วินาทีเหมาะสมกับข้อมูลจริง

## ข้อ 4 เสร็จแล้ว: โหลด Receive references เมื่อจำเป็น

ปรับจังหวะโหลด references ใน Receive ตามการใช้งานจริง:

- suppliers และ CEO โหลดเมื่อเปิดฟอร์มสร้าง PO
- warehouses โหลดเมื่อเปิดฟอร์มใบตรวจรับ และ reuse cache จากข้อ 3
- branches โหลดเมื่อเลือกใบขนส่งที่ยังไม่ยืนยันรับ เพราะต้องใช้ในฟอร์มยืนยันสาขารับจริง
- workflow ที่ไม่ต้องใช้ reference เพิ่ม เช่น supplier receipt และ carrier form ไม่ยิง reference request
- ระหว่างโหลดแสดง spinner; เมื่อโหลดล้มเหลวมีปุ่ม retry และไม่แสดงฟอร์มที่ยังไม่มี options
- จำกัดข้อมูล reference ใน component ด้วย account scope ป้องกันข้อมูลจาก scope ก่อนหน้าปรากฏระหว่างสลับบัญชี

ไฟล์ที่เปลี่ยนในข้อนี้: components/warehouse/ReceiveScreen.tsx.

ยังไม่ได้รัน automated checks หรือทดสอบ flow ใน browser; จึงยังไม่ได้ยืนยันจำนวน request จริงหลังเปลี่ยนจังหวะโหลด.

## ข้อ 5 เสร็จแล้ว: shared cache สำหรับ branch references

ขยาย cache ใน memory จาก warehouses ให้รองรับ branches ด้วย โดยใช้ key แยกตามชนิดข้อมูลและ account scope เดิม (auth user, account, role และ branch IDs):

- Control Panel แชร์ branch reference กับ Receive; request ที่กำลังทำงานและข้อมูลใน TTL เดียวกัน reuse ร่วมกัน
- Receive ยังโหลด branches เฉพาะเมื่อเลือกใบขนส่งที่ยังไม่ยืนยันรับ ตาม lazy loading จากข้อ 4
- TTL ยังคง 60 วินาที และ scope เปลี่ยน/logout ยังคงล้าง entry กับ abort request ที่เกี่ยวข้อง
- เพิ่ม/แก้ branches สำเร็จจาก Branch Management หรือ Catalog จะ invalidate branch reference ทุก scope; เพิ่ม/แก้ warehouses สำเร็จยัง invalidate เฉพาะ warehouse reference
- Control Panel ตรวจ scope ของผลลัพธ์ก่อนแสดง เพื่อไม่ให้ข้อมูลสมาชิก/สาขาจาก scope ก่อนหน้าค้างระหว่างโหลดใหม่

ไฟล์ที่เปลี่ยนในข้อนี้: lib/api/warehouse-reference-cache.ts, components/warehouse/ControlPanel.tsx, components/warehouse/ReceiveScreen.tsx, components/warehouse/BranchManagement.tsx, components/warehouse/CatalogScreen.tsx และ call sites ของ warehouse reference เดิมที่เปลี่ยนมาใช้ helper ทั่วไป.

ยังไม่ได้รัน automated checks หรือทดสอบ flow ใน browser; ยืนยันจาก source ว่าจุดโหลด branches ทั้งสองใช้ cache helper และ mutation paths ที่เกี่ยวข้อง invalidate หลัง API สำเร็จ แต่ยังไม่มีตัวเลข runtime ของ request ที่ลดลง.

## ขอบเขตข้อ 6 ที่กำลังตรวจ

**เก็บ baseline และตรวจ cache flows ใน browser** — ตรวจ request count / reuse ใน Stock, Transfer, Inventory, Control Panel และ Receive รวมทั้ง account switch, TTL expiry และการแก้ branches/warehouses ก่อนขยาย cache ไปยัง reference ชนิดอื่น. วิธีนี้จะช่วยเลือก resource ถัดไปจากหลักฐานการเรียกจริง แทนการเดาจากจำนวน call sites ใน source.

## ข้อ 6 ตรวจบางส่วนแล้ว: browser flows และการเชื่อมต่อ

หลังผู้ใช้แจ้งว่าเชื่อม Supabase MCP แล้ว ได้ตรวจ project `dawh.db` ซึ่งสถานะ `ACTIVE_HEALTHY`; read-only query `select now()` สำเร็จเวลา 2026-10-14 11:38 UTC. Supabase logs ช่วง 11:44–11:50 UTC มีการเชื่อมต่อที่ authenticate และเปิด backend ได้ แต่ log ชุดนี้ไม่ได้ระบุ endpoint ของ Warehouse FE จึงใช้ยืนยันจำนวน API request หรือ cache hit ไม่ได้

ผลตรวจ browser รอบล่าสุด:

- Inventory โหลดตารางสินค้าได้
- เปิด Stock แล้วเห็นตาราง balances แต่ไม่มีรายการที่ตรงกับ filter ปัจจุบัน
- เปิด Transfer แล้วรายการโหลดสำเร็จและแสดง 0 transfers; เปิดฟอร์ม Create transfer แล้วตรวจเห็นช่องเลือก source/destination warehouse. ปิดฟอร์มโดยไม่ยืนยัน จึงไม่มี mutation
- ในรอบก่อน Control Panel แสดง branch options ใน Add user form; ปิดฟอร์มโดยไม่บันทึกข้อมูล
- Receive โหลด supplier/CEO references เมื่อเปิด PO form ตาม lazy loading ที่ทำในข้อ 4; carrier step ไม่มี delivery note จึงตรวจ branch reference ใน workflow นั้นไม่ได้

อาการเชื่อมต่อยังไม่สม่ำเสมอ: log ก่อนหน้ามี `getaddrinfo EAI_AGAIN` และ connection timeout ระหว่าง `getSession()`; log ตัวอย่างที่แนบมี inventory request สำเร็จหนึ่งครั้งที่ 580ms และภายหลังล้มที่ 4.0s. จึงไม่ใช้เวลาเหล่านี้เป็น baseline ของ cache

ข้อ 6 ยังไม่เสร็จสมบูรณ์: browser ยืนยันว่าแต่ละหน้าสามารถแสดงข้อมูลได้ แต่ไม่มี Network trace/API access log ที่ผูก request กับ navigation จึงยังสรุปไม่ได้ว่า `/api/catalog/warehouses` หรือ `/api/catalog/branches` ถูก reuse จริงหรือไม่. ยังไม่ได้ตรวจ TTL 60 วินาที, account scope change หรือ invalidation หลัง mutation. ไม่มีการแก้/สร้าง branch หรือ warehouse เพราะไม่มี test record ที่ระบุว่าใช้เปลี่ยนข้อมูลได้

**ขั้นถัดไป:** เก็บ browser Network trace หรือเพิ่ม API access logging ชั่วคราวใน dev session เพื่อวัดจำนวน request ของ `branches`/`warehouses` ระหว่างหน้าและฟอร์ม จากนั้นตรวจ expiry หลัง 60 วินาทีและเปลี่ยน scope; ทดสอบ mutation เมื่อมี test record ชัดเจน โดยไม่ปะปน Supabase connection logs กับ FE API request count.

### แก้ปัญหา pagination ที่พบระหว่างตรวจ

- รวมค่าจำนวนรายการต่อชุดไว้ที่ `lib/warehouse/pagination-config.ts` เป็น 10 และใช้กับตารางแบบเปลี่ยนหน้าใน Catalog, Inventory, Branch Management, Stock, Transfer, Audit และ Control Panel รวมถึงตารางตัวอย่างใน Table Design Playground
- ปรับรายการแบบ “โหลดเพิ่ม” ให้ดึงครั้งละ 10 รายการด้วย ทั้ง Receive, Issues และ Reports; API cursor ที่ไม่ได้ส่ง `limit` ใช้ค่าเริ่มต้นเดียวกัน
- ปรับรายการเคลื่อนไหวล่าสุดบน Dashboard จาก 8 เป็น 10 แถว และให้ API Audit ใช้ค่า 10 เดียวกับหน้าตาราง
- ย้ายกติกาความสูงตารางมาไว้ใน common `DataTable`: ตารางมีแถวข้อมูลขั้นต่ำ 10 แถว แถวละ 60px; เติมแถวว่างที่ซ่อนจาก accessibility tree เมื่อมีข้อมูลไม่ครบ 10 รายการ และป้องกัน cell ขึ้นบรรทัดใหม่ กติกานี้ใช้โดย default กับทุก DataTable โดยไม่ต้องตั้ง prop ที่แต่ละหน้า
- ตาราง Inventory ที่ render เองใช้ constants และ helper จาก common `DataTable` ชุดเดียวกัน ส่วน `components/common/common/DataTable` เปลี่ยนเป็น re-export common implementation เพื่อไม่ให้มี table behavior สองชุด
- สาเหตุที่เห็นรายการ 10 แถวค้างเมื่อเปลี่ยน query ไปยังผลลัพธ์ที่มี 1 รายการคือ `useRemote` เก็บ data ก่อนหน้าไว้ระหว่าง request ใหม่ ขณะที่ Catalog ตรวจเพียงเลขหน้า จึงยอมแสดง data เก่าระหว่างโหลด
- เพิ่มตัวเลือก `resetDataOnLoadChange` ใน `useRemote` และเปิดใช้กับ Catalog เพื่อเคลียร์ data เก่าทันทีเมื่อ query เปลี่ยน; page size ของ Catalog เดิมเป็น 10 อยู่แล้ว
- ตรวจ source แล้วไม่พบขนาดเดิม 20/25/8/5 ในเส้นทาง pagination ที่ไล่ตรวจ และ `git diff --check` ผ่าน; ไม่ได้รัน test suite

## เอกสารอ้างอิง

- [แผน cache ข้อมูลฝั่ง Warehouse FE](warehouse-frontend-cache.md)
- [ผลตรวจประสิทธิภาพเว็บ](performance-audit-2026-09-27.md)





