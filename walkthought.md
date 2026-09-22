Walkthrough: ตรวจสอบว่า Warehouse Page ไหนพร้อมลบ Mock และเชื่อม API
ขั้นตอนที่ 1: สำรวจหน้า Warehouse ทั้งหมด
เริ่มจากไล่ดูหน้าในโฟลเดอร์ app/warehouse/:

/warehouse
/warehouse/inventory
/warehouse/inventory/[sku]
/warehouse/stock
/warehouse/receive
/warehouse/movements
/warehouse/branches
/warehouse/transfer
/warehouse/transfer/audit
/warehouse/alerts
/warehouse/analysis
/warehouse/suppliers
จากนั้นตรวจสอบว่าแต่ละหน้าใช้ข้อมูลจาก:

API จริง
Database ผ่าน API
Mock data ที่ประกาศในไฟล์
Hardcode หรือ local state
ขั้นตอนที่ 2: ตรวจสอบ API ที่มีอยู่
พบ API หลักใน app/api/:

Product API
มี API สำหรับข้อมูลสินค้าแล้ว:

GET /api/products
POST /api/products
GET/PATCH /api/products/:productId
GET/POST /api/products/:productId/barcodes
GET/POST /api/products/:productId/units
อ้างอิงจาก app/api/products/route.ts

Stock API
มี API สำหรับข้อมูลสต็อกแล้ว:

GET /api/stock/balances
GET /api/stock/ledger
GET /api/stock/network
อ้างอิงจาก:

app/api/stock/balances/route.ts
app/api/stock/ledger/route.ts
app/api/stock/network/route.ts
Facility API
มี API สำหรับคลังและตำแหน่งจัดเก็บ:

GET /api/facilities
POST /api/facilities
GET/PATCH /api/facilities/:facilityId
GET/POST /api/facilities/:facilityId/locations
GET/PATCH /api/locations/:locationId
อ้างอิงจาก app/api/facilities/

Master Data API
มี API สำหรับข้อมูลอ้างอิง:

Product Categories
Brands
Units of Measure
Reason Codes
Safety Stock Rules
Client wrapper อยู่ใน lib/api/master-data.ts และ lib/api/products.ts

ขั้นตอนที่ 3: ตรวจสอบ Database
จาก Migration 20260919070733_baseline_wms_foundation.sql พบตารางที่เกี่ยวข้องกับ Warehouse แล้ว เช่น:

facilities
facility_routes
warehouse_locations
product_categories
brands
units_of_measure
products
product_units
product_barcodes
lots
serial_numbers
safety_stock_rules
reason_codes
stock_balances
inventory_transactions
inventory_transaction_lines
ดังนั้นฝั่ง Database มีโครงสร้างสำหรับ Product และ Stock ค่อนข้างพร้อม แต่การมีตารางอย่างเดียวไม่ได้หมายความว่ามี API สำหรับใช้งานทุก flow แล้ว ต้องตรวจ route และ service ประกอบด้วย

ผลการตรวจสอบแต่ละหน้า
1. Product Master / Inventory
หน้า: app/warehouse/inventory/page.tsx

Component หลัก: WarehouseSplitLayoutView.tsx

หน้านี้เชื่อม API จริงอยู่แล้ว โดยเรียก:

listProducts()
listStockBalances()
listFacilities()
productReferenceApi.listCategories()
productReferenceApi.listUnits()
productReferenceApi.listBrands()
จุดโหลดข้อมูลอยู่ที่ WarehouseSplitLayoutView.tsx:353

นอกจากนี้ยังเพิ่มสินค้าและ Barcode ได้ผ่าน:

createProduct()
createProductBarcode()
จุดเพิ่มข้อมูลอยู่ที่ WarehouseSplitLayoutView.tsx:790

สรุป
หน้านี้พร้อมที่สุดและเชื่อม API อยู่แล้ว แต่ยังมี FALLBACK_INVENTORY สำหรับกรณี API ล้มเหลว หากต้องการลบ Mock ออกทั้งหมด ควรเปลี่ยน fallback เป็น:

Empty state
Error state
ปุ่ม Retry
แทนการแสดงข้อมูลตัวอย่าง

2. Product Detail
หน้า: app/warehouse/inventory/[sku]/page.tsx

หน้านี้โหลดข้อมูลจริงจาก:

Product
Stock Balance
Facility
จุดเรียก API อยู่ที่ page.tsx:67

สรุป
หน้านี้พร้อมใช้งานกับ API แล้ว และไม่มี Mock หลักที่ใช้แทนข้อมูลสินค้า

ข้อสังเกตคือปัจจุบันค้นหาสินค้าด้วย:


แทนการใช้:


แต่ยังถือว่าใช้ Backend จริงได้

3. Stock Balance
หน้า: app/warehouse/stock/page.tsx

หน้าปัจจุบันยังใช้ข้อมูลจำลองจาก:


ที่ stock/page.tsx:46

อย่างไรก็ตาม Backend พร้อมแล้วผ่าน:

GET /api/stock/balances
GET /api/stock/network
GET /api/stock/ledger
และมี client wrapper ใน lib/api/stock.ts

สิ่งที่ต้องทำ
Import listStockBalances
เรียก API ใน useEffect
Map field จาก API ให้ตรงกับ UI
เปลี่ยนการค้นหาและ filter ให้ทำงานกับข้อมูลจริง
เปลี่ยน Pagination เป็น server-side หากต้องรองรับข้อมูลจำนวนมาก
คำนวณ Summary จากข้อมูล API
ลบ STOCK_BALANCES
สรุป
Backend พร้อมแล้ว เหลือแก้ frontend เพื่อถอด Mock

4. Movement History
หน้า: app/warehouse/movements/page.tsx

ปัจจุบันใช้ข้อมูลจำลอง INITIAL_LOGS ที่ movements/page.tsx:35

แต่มี API Ledger พร้อมแล้ว:


อ้างอิงจาก app/api/stock/ledger/route.ts

สิ่งที่ทำได้
แสดงประวัติรับเข้า
แสดงประวัติเบิกออก
แสดงการปรับปรุงยอด
แสดงการเคลื่อนไหวตามเวลาจริงจาก Database
ข้อจำกัด
API ปัจจุบันเป็น Read API ยังไม่มี command API สำหรับสร้าง Movement จากหน้านี้โดยตรง

สรุป
พร้อมต่อ API สำหรับการอ่านข้อมูล แต่ต้องแก้ frontend และลบ INITIAL_LOGS

5. Branches
หน้า: app/warehouse/branches/page.tsx

ปัจจุบันใช้ BRANCH_DATA ที่ branches/page.tsx:65

Backend มีข้อมูลที่นำมาใช้ได้:

Facilities
Facility Locations
Network Stock
API ที่เกี่ยวข้อง:

GET /api/facilities
GET /api/facilities/:facilityId/locations
GET /api/stock/network
ข้อมูลที่ต่อได้
ชื่อคลัง
รหัสคลัง
ประเภทคลัง
Location
Stock แยกตามคลัง
จำนวน SKU จากข้อมูลสินค้าและยอดสต็อก
ข้อมูลที่ยังไม่มี API โดยตรง
ผู้จัดการคลัง
เบอร์โทร
ความจุรวม
อัตราการใช้พื้นที่
Temperature Controlled
Last Restock
สรุป
ต่อ API ได้บางส่วน แต่ยังไม่สามารถลบ Mock ได้ทั้งหมดจนกว่าจะกำหนด field ที่ขาด

6. Warehouse Overview
หน้า: app/warehouse/page.tsx

Metrics ปัจจุบันเป็น Hardcode เช่น:

4,892 Total SKUs
148 units Receiving Inbound
320 units Dispatch Outbound
2 items Critical Low Stock
ข้อมูลอยู่ใน page.tsx:11

Metrics ที่คำนวณจาก API ได้
Total SKU จาก GET /api/products
จำนวน Stock จาก GET /api/stock/balances
Low Stock จาก Stock Balance และ Safety Stock Rules
จำนวนคลังจาก GET /api/facilities
Metrics ที่ยังไม่มี API รองรับ
Receiving Inbound
Dispatch Outbound
Shipment Pending QC
Scheduled Transit
Outbound Status
สรุป
ต่อ API ได้บาง Metric แต่ยังไม่พร้อมลบ Mock ทั้งหน้า

7. Alerts
หน้า: app/warehouse/alerts/page.tsx

ตอนนี้หน้ายังเป็นเพียง WarehousePageTemplate และยังไม่มีระบบ Alert จริง

สามารถสร้าง Alert เบื้องต้นจาก:

Stock Balance
Safety Stock Rules
Lot Expiry
Stock Ledger
แต่ยังไม่มี Alert API โดยตรงสำหรับ:

บันทึก Alert
อ่านสถานะ Alert
Acknowledge Alert
Expired Batch Alert
Damaged Stock Alert
Notification State
สรุป
ยังไม่มี API ตรงสำหรับหน้านี้ ต้องออกแบบ Alert logic หรือ Alert API ก่อน

8. Receive / Goods Receiving
หน้า: app/warehouse/receive/page.tsx

ยังใช้ข้อมูลจำลอง:

INITIAL_PO_ITEMS
INITIAL_QC_ITEMS
Supplier hardcode
GRN hardcode
Destination Warehouse hardcode
จุดเริ่มต้นข้อมูลอยู่ที่ receive/page.tsx:38

แม้ Database จะมี:

inventory_transactions
inventory_transaction_lines
แต่ยังไม่พบ API สำหรับ:

Purchase Order
Goods Receipt
GRN
QC Result
Putaway
Receiving Transaction
สรุป
ยังไม่พร้อมลบ Mock ต้องสร้าง Backend API ก่อน

9. Transfer
หน้า: app/warehouse/transfer/page.tsx

ใช้ Mock data:

NODE_CENTERS
AVAILABLE_PRODUCTS
INITIAL_RECORDS
และสร้างเลข Transfer ด้วย Math.random()

จุดเริ่มต้นข้อมูลอยู่ที่ transfer/page.tsx:23

ยังไม่มี API สำหรับ:

Create Transfer
Transfer Lines
Approve Transfer
Dispatch Transfer
Receive Transfer
Update Transfer Status
แม้ Database จะมี facility_routes แต่ตารางนี้ใช้สำหรับเส้นทางระหว่างคลัง ไม่ใช่ Transfer transaction โดยตรง

สรุป
ยังไม่พร้อมถอด Mock ต้องสร้าง Transfer API และ service ก่อน

10. Transfer Audit
หน้า: app/warehouse/transfer/audit/page.tsx

ใช้ MANIFEST_ITEMS ที่ transfer/audit/page.tsx:27

ยังไม่มี API สำหรับ:

Transfer Manifest
Transfer Audit
Approval History
Creator
Transfer Status
In-Transit Tracking
Stock Ledger อาจนำมาใช้แสดงประวัติการเคลื่อนไหวบางส่วนได้ แต่ไม่สามารถแทนข้อมูล Transfer Audit ได้ทั้งหมด

สรุป
ยังไม่พร้อมต่อ API แบบเต็มรูปแบบ

11. AI Analysis
หน้า: app/warehouse/analysis/page.tsx

ปัจจุบันเป็น Template เปล่า ยังไม่มี API สำหรับ:

Demand Forecast
ABC Analysis
Stock Turnover
Reorder Recommendation
AI Stock Optimization
สรุป
ยังไม่มี Backend API รองรับ

12. Suppliers
หน้า: app/warehouse/suppliers/page.tsx

หน้านี้ระบุว่าอยู่นอกขอบเขต MVP ที่ suppliers/page.tsx:29

ยังไม่มี API สำหรับ:

Supplier
Procurement
Purchase Order
Supplier Contact
Supplier Performance
สรุป
ยังไม่ควรดำเนินการถอด Mock เพราะอยู่นอก Scope ปัจจุบัน

สรุปตามระดับความพร้อม
พร้อมใช้งาน API แล้ว
Product Master / Inventory
Product Detail
Barcode และ Product Unit ใน Inventory
Backend พร้อม แต่ต้องแก้ Frontend
Stock Balance
Movement History
Branches
ต่อได้บางส่วน แต่ยังต้องเพิ่ม Backend หรือกำหนดข้อมูลเพิ่มเติม
Warehouse Overview
Alerts
ยังไม่มี API ที่เพียงพอ
Receive
Transfer
Transfer Audit
AI Analysis
Suppliers
ลำดับที่แนะนำให้ดำเนินการ
ระยะที่ 1: เชื่อมได้เร็วที่สุด
Stock Balance
Movement History
Branches
ทั้งสามหน้านี้มี API และ Database รองรับอยู่แล้ว จึงไม่ต้องออกแบบ Backend ใหม่มาก

ระยะที่ 2: ปรับ Dashboard
Warehouse Overview
Alerts
ควรสร้าง query หรือ endpoint สำหรับ Summary โดยเฉพาะ เพื่อไม่ให้ frontend โหลดข้อมูลจำนวนมากมาคำนวณเอง

ระยะที่ 3: สร้าง Transaction API
Goods Receiving
Stock Transfer
Transfer Audit
กลุ่มนี้ควรออกแบบ transaction, permission, approval และ audit trail ให้ชัดเจนก่อนถอด Mock

ระยะที่ 4: ฟีเจอร์เพิ่มเติม
AI Analysis
Suppliers
สองส่วนนี้ยังไม่มี Backend รองรับและบางส่วนอยู่นอกขอบเขต MVP

ข้อสรุปสุดท้าย
ถ้าต้องการเริ่มงานทันทีโดยไม่ต้องสร้าง API ใหม่ ควรเริ่มจาก:

Stock Balance
Movement History
Branches
เพราะมี API และ Database รองรับอยู่แล้ว

ส่วน Inventory และ Product Detail เชื่อม API อยู่แล้ว เหลือเพียงพิจารณาว่าจะลบ fallback mock ออกหรือเก็บไว้เป็นกรณี API ล้มเหลว

หน้า Receive, Transfer, Transfer Audit, AI Analysis และ Suppliers ยังไม่ควรลบ Mock จนกว่าจะมี Backend API ที่รองรับ flow ของแต่ละหน้าอย่างครบถ้วนครับ

---

# แผนเตรียมงานสำหรับการเชื่อม API จริง

ส่วนนี้เป็น checklist สำหรับใช้เริ่มลงมือแก้โค้ดต่อ โดยจะแยกให้ชัดเจนว่าแต่ละหน้าต้องลบ Mock ตรงไหน ใช้ API ใด มีจุดบกพร่องอะไร และต้องถือว่างานเสร็จเมื่อใด

## หลักเกณฑ์ก่อนลบ Mock

ไม่ควรลบ Mock แล้วเปลี่ยนเป็น API แบบรวดเดียวโดยไม่มีสถานะรองรับ เพราะจะทำให้หน้าแสดงข้อมูลว่างเมื่อ API ช้า หรือล้มเหลวโดยไม่มีคำอธิบาย ทุกหน้าที่เปลี่ยนเป็นข้อมูลจริงควรมี state อย่างน้อย 4 แบบ:

1. `loading` — กำลังโหลดข้อมูล
2. `success` — โหลดข้อมูลสำเร็จ
3. `empty` — API สำเร็จแต่ไม่มีข้อมูล
4. `error` — API ล้มเหลว พร้อมปุ่ม Retry

สำหรับหน้าอ่านข้อมูล ไม่ควรใช้ข้อมูลตัวอย่างเพื่อซ่อน API error อีกต่อไป เพราะจะทำให้ผู้ใช้เข้าใจผิดว่าข้อมูลในหน้าจอเป็นข้อมูลจริง

## ลำดับการทำงานมาตรฐานต่อหนึ่งหน้า

ให้ทำตามลำดับนี้ทุกครั้ง:

1. ระบุ Mock ที่ต้องถอดออก เช่น `STOCK_BALANCES`, `INITIAL_LOGS`, `BRANCH_DATA`
2. ตรวจ response shape จาก service และ route จริงก่อนเขียน mapping
3. ตรวจ permission ที่ route ใช้ เช่น `stock.read`, `stock.ledger.read`, `product.read`
4. เพิ่มหรือใช้ client wrapper ใน `lib/api/` ห้ามเรียก `fetch` กระจายอยู่ใน component
5. เพิ่ม type สำหรับ response ที่จำเป็น หลีกเลี่ยงการใช้ `unknown` ต่อไปจนถึง UI
6. เพิ่ม state `isLoading`, `error`, `isRefreshing` และ `isEmpty`
7. เรียก API ใน `useEffect` หรือ callback ที่ควบคุม dependency ถูกต้อง
8. map ข้อมูล API เป็น view model ของหน้านั้นในจุดเดียว
9. ต่อ search, filter, pagination กับ query API ถ้า API รองรับ
10. ลบ Mock และ fallback ที่เป็นข้อมูลปลอมออก
11. ตรวจว่าการคำนวณ summary ใช้ข้อมูล API ไม่ใช่ค่าคงที่
12. ทดสอบกรณี success, empty, error, retry และ permission denied

## ระยะที่ 1: หน้าที่พร้อมต่อ API แล้ว

### A. Stock Balance

ไฟล์หลัก: `app/warehouse/stock/page.tsx`

#### Mock ที่ต้องลบ

- `STOCK_BALANCES`
- การคำนวณ `totalSkuCount`, `totalUnits`, `totalValuation` จาก array คงที่
- การ filter และ pagination ด้วย `.filter()` / `.slice()` บนข้อมูล mock

#### API ที่ใช้

- `GET /api/stock/balances`
- `GET /api/stock/network` สำหรับ breakdown รายคลัง
- `GET /api/stock/ledger` ถ้าต้องแสดงประวัติประกอบ

Client wrapper ที่ควรใช้จาก `lib/api/stock.ts`:

```ts
listStockBalances(query)
listNetworkStock(query)
listStockLedger(query)
```

#### ขั้นตอนแก้

1. เพิ่ม `StockBalance[]` state และ `loading/error` state
2. เรียก `listStockBalances()` ตอนเปิดหน้า
3. ส่ง filter เช่น `facilityId`, `search`, `limit`, `cursor` ให้ API แทนการ filter mock ใน browser
4. แปลง status จากค่าจริงของ backend เป็น status ที่ UI รองรับ
5. ใช้ `updatedAt` เป็นเวลาปรับปรุงล่าสุด
6. เรียก `/api/stock/network` สำหรับยอดรวมรายคลัง แทนการคำนวณจากข้อมูลที่โหลดมาเพียงบางหน้า
7. แสดง empty state เมื่อไม่มี stock balance
8. ลบ `STOCK_BALANCES`

#### จุดบกพร่องที่ต้องระวัง

- API เป็น cursor pagination แต่ UI เดิมใช้ page number ต้องเลือกวิธีใดวิธีหนึ่งให้ชัดเจน
- ถ้าโหลด `limit=250` แล้วคำนวณ summary อาจได้ยอดไม่ครบทั้งระบบ
- field ของ API อาจใช้ `productId`, `facilityId`, `quantityOnHand` ไม่ตรงกับ field view model เดิม
- ต้องไม่ถือว่า API สำเร็จเพียงเพราะได้ HTTP 200 หาก `data` ไม่ใช่ array

#### ถือว่างานเสร็จเมื่อ

- ไม่มีข้อมูลสินค้า demo แสดงเมื่อ API ล้มเหลว
- เปลี่ยน filter แล้ว query API จริง
- Retry โหลดข้อมูลใหม่ได้
- แสดง error และ empty state แยกกัน

### B. Movement History

ไฟล์หลัก: `app/warehouse/movements/page.tsx`

#### Mock ที่ต้องลบ

- `INITIAL_LOGS`
- filter วันที่และประเภทที่ทำงานกับข้อมูล mock เท่านั้น

#### API ที่ใช้

- `GET /api/stock/ledger`
- `listStockLedger()` จาก `lib/api/stock.ts`

#### ขั้นตอนแก้

1. เพิ่ม state สำหรับ ledger rows, cursor, loading และ error
2. เรียก API พร้อม filter วันที่, facility และประเภท movement
3. map `postedAt`, SKU, quantity, operator และ reference ให้ตรงกับ column
4. แสดง `nextCursor` หรือสร้าง adapter สำหรับ pagination ให้ตรงกับ UI
5. แยกกรณีไม่มีประวัติออกจากกรณีโหลดไม่ได้
6. ลบ `INITIAL_LOGS`

#### จุดบกพร่องที่ต้องระวัง

- Ledger route เป็น read-only ยังไม่มี command สำหรับสร้าง movement
- ชื่อประเภท transaction จาก backend อาจไม่ใช่ `inbound`, `outbound`, `transfer`, `adjustment`
- ต้อง format timezone ให้สอดคล้องกับ Asia/Bangkok
- ห้ามใช้ข้อมูลจากหน้า transfer ที่เป็น mock มาเติม ledger

### C. Branches

ไฟล์หลัก: `app/warehouse/branches/page.tsx`

#### Mock ที่ต้องลบหรือแยกออก

- `BRANCH_DATA`
- manager, phone, capacity และ temperature ที่ฝังอยู่ใน mock

#### API ที่ใช้

- `GET /api/facilities`
- `GET /api/facilities/:facilityId/locations`
- `GET /api/stock/network`

#### ขั้นตอนแก้

1. โหลด facilities ก่อน
2. โหลด network stock เพื่อจับคู่ยอดตาม facility
3. โหลด locations เฉพาะเมื่อเปิดรายละเอียดสาขา ไม่ควรยิงทุกสาขาพร้อมกันโดยไม่จำเป็น
4. map เฉพาะข้อมูลที่มีใน backend
5. เอา field ที่ไม่มี API ออก หรือแสดง `ไม่ระบุ` อย่างชัดเจน
6. ลบ `BRANCH_DATA`

#### จุดบกพร่องที่ต้องระวัง

- `facilities` ไม่ได้มี manager, phone หรือ capacity ใน schema ปัจจุบัน
- อย่าสร้างค่าประมาณจากชื่อสาขาหรือ hardcode เพื่อเติมช่องว่าง
- network stock อาจถูกจำกัดตาม facility scope ของผู้ใช้
- ถ้า facilities สำเร็จแต่ network ล้มเหลว ต้องแสดงสถานะแยก ไม่ใช่ถือว่าทั้งหน้าสำเร็จ

## ระยะที่ 2: หน้าที่ต่อได้บางส่วน ต้องปรับ contract ก่อน

### D. Product Master / Inventory

ไฟล์หลัก: `app/warehouse/_components/WarehouseSplitLayoutView.tsx`

หน้านี้เชื่อม API อยู่แล้ว แต่ยังมี `FALLBACK_INVENTORY` ซึ่งเป็น mock ที่อันตราย เพราะ API ล้มเหลวแล้วผู้ใช้ยังเห็นข้อมูล demo

#### จุดที่ต้องปรับปรุง

1. เปลี่ยน fallback เป็น empty/error state
2. แยก `apiError` ของ product, stock, facility และ master data ไม่ให้การโหลดส่วนหนึ่งล้มแล้วทำให้ผู้ใช้เข้าใจว่าทุกส่วนล้ม
3. แก้ `Promise.allSettled` ให้รายงานผลแต่ละ resource อย่างชัดเจน
4. เพิ่ม Retry เฉพาะ resource ที่ล้มเหลว
5. ตรวจ create product แล้ว refresh list จาก API จริง
6. ถ้า create barcode ล้มหลัง create product สำเร็จ ต้องแสดงผล partial failure และไม่แจ้งว่าสำเร็จสมบูรณ์
7. ตรวจว่า pagination ใช้ `total` และ `nextCursor` ให้ตรงกับ response จริง

#### จุดบกพร่องที่ต้องแก้ก่อนถือว่า production-ready

- การ cast `unknown` เป็น `Product` โดยไม่ validate response
- fallback ทำให้ข้อมูล demo ปะปนกับข้อมูลจริง
- การโหลด `stock_balances` จำนวนมากเพื่อประกอบรายการสินค้าอาจไม่ scale
- การค้นหา Product Detail ใช้ list search แทนการใช้ resource id โดยตรง

### E. Product Detail

ไฟล์หลัก: `app/warehouse/inventory/[sku]/page.tsx`

#### จุดที่ต้องปรับปรุง

1. เมื่อไม่พบ SKU ต้องแสดง Not Found ไม่ใช่เลือก `prods[0]`
2. ควรเพิ่ม API `GET /api/products/:productId` หรือค้นหาให้ backend รับ SKU โดยตรงอย่างชัดเจน
3. ใช้ `listProductBarcodes()` และ `listProductUnits()` จริง หาก UI ต้องแสดงรายละเอียดทั้งสองส่วน
4. แยก loading ของ product, balance และ facilities
5. ไม่ควรโหลด stock balances ทั้งหมด `limit=250` เพื่อกรองสินค้าเดียว

#### จุดบกพร่องสำคัญ

ปัจจุบัน logic ลักษณะนี้มีความเสี่ยง:

```ts
const found = products.find(matchesSku) || products[0];
```

ถ้า API ไม่พบ SKU ที่ขอ ผู้ใช้จะเห็นรายละเอียดของสินค้าตัวแรกแทน ซึ่งเป็น data integrity bug ต้องเปลี่ยนเป็น not found state

## ระยะที่ 3: ต้องเพิ่ม API ก่อนจึงลบ Mock ได้

### F. Warehouse Overview

ไฟล์หลัก: `app/warehouse/page.tsx`

#### API ที่ใช้ได้บางส่วน

- `GET /api/products` สำหรับจำนวน SKU
- `GET /api/stock/balances` หรือ `/api/stock/network` สำหรับ stock
- `GET /api/facilities` สำหรับจำนวนคลัง
- `GET /api/safety-stock-rules` สำหรับ rule

#### API ที่ยังขาด

- receiving inbound summary
- outbound / dispatch summary
- pending QC
- scheduled transit

#### แนวทางที่ควรทำ

สร้าง endpoint summary แยก เช่น `GET /api/warehouse/summary` เพื่อให้ backend คำนวณ aggregate จาก database โดยตรง ไม่ควรโหลดรายการสินค้าทั้งหมดมายัง browser แล้วคำนวณเอง

### G. Alerts

ไฟล์หลัก: `app/warehouse/alerts/page.tsx`

#### สิ่งที่ทำได้โดยไม่สร้างตารางใหม่

คำนวณ alert แบบ read-only จาก:

- stock balance ต่ำกว่า safety stock
- lot ใกล้หมดอายุ
- stock ติดลบหรืออยู่ในสถานะผิดปกติ

#### API ที่ควรเพิ่มถ้าต้องการระบบ Alert จริง

- `GET /api/warehouse/alerts`
- `PATCH /api/warehouse/alerts/:alertId` สำหรับ acknowledge
- ตารางหรือ view สำหรับ alert snapshot

ต้องตัดสินใจก่อนว่า alert เป็นข้อมูลคำนวณสด หรือเป็น record ที่เก็บใน database เพราะสองแบบนี้มี behavior และการทำ acknowledge ต่างกัน

### H. Receive / Goods Receiving

ไฟล์หลัก: `app/warehouse/receive/page.tsx`

ต้องสร้าง backend contract ก่อนลบ:

- Purchase order หรือ inbound reference
- Goods receipt header
- Goods receipt lines
- QC result
- Putaway
- การโพสต์เข้า `inventory_transactions`
- idempotency และ audit log

ห้ามต่อหน้าเข้ากับ `stock_balances` โดยการ update ตรงจาก browser เพราะจะข้าม ledger และทำให้ยอดตรวจสอบย้อนหลังไม่ได้

### I. Transfer และ Transfer Audit

ไฟล์หลัก:

- `app/warehouse/transfer/page.tsx`
- `app/warehouse/transfer/audit/page.tsx`

ต้องมีอย่างน้อย:

- transfer header และ lines
- create draft
- approve
- dispatch
- receive
- cancel
- audit history
- permission ของแต่ละ transition

ควรใช้เลข document จาก `document_sequences` แทน `Math.random()` และต้องใช้ transaction เดียวในการเปลี่ยนสถานะกับบันทึก ledger

## จุดบกพร่องร่วมของทุกหน้า

1. หลายหน้ามีข้อมูลภาษาไทยและอังกฤษ hardcode ปะปนกับ data model
2. บางหน้ามี `alert()` แทน notification pattern ของระบบ
3. ยังไม่มีมาตรฐานเดียวกันสำหรับ error response และ retry
4. บางหน้าใช้ page number แต่ API ใช้ cursor
5. หลายหน้าคำนวณ summary จากข้อมูลที่โหลดมาเพียงบางส่วน
6. ยังไม่มีการทดสอบ component ต่อ API response จริง
7. การ cast `unknown` เป็น domain type ยังไม่มี runtime validation
8. Permission error, profile incomplete และ network error ยังถูกแสดงไม่สม่ำเสมอ
9. การเก็บข้อมูลใน local state ทำให้ refresh แล้ว state ธุรกรรมหาย
10. การมี fallback mock ทำให้ตรวจสอบ production data ได้ยาก

## Checklist ก่อนเปิดใช้งานแต่ละหน้า

- [ ] ไม่มี constant mock ที่ใช้เป็นข้อมูลหลัก
- [ ] มี API client wrapper ใน `lib/api/`
- [ ] มี type ของ request/response
- [ ] ตรวจ permission ของ route แล้ว
- [ ] มี loading state
- [ ] มี empty state
- [ ] มี error state
- [ ] มี Retry
- [ ] มี success response ที่ตรวจ shape แล้ว
- [ ] filter และ pagination ใช้ข้อมูลจริง
- [ ] ไม่คำนวณยอดรวมจากข้อมูลที่โหลดมาไม่ครบ
- [ ] ไม่มี fallback ที่เป็นข้อมูลธุรกิจปลอม
- [ ] ทดสอบ API success
- [ ] ทดสอบ API empty
- [ ] ทดสอบ API error
- [ ] ทดสอบ permission denied
- [ ] รัน typecheck และ test ที่เกี่ยวข้อง

## คำสั่งเริ่มต้นงานที่แนะนำ

ถ้าจะสั่งงานแยกเป็น task ให้ใช้ลำดับและขอบเขตดังนี้:

### Task 1: เชื่อม Stock Balance

> เชื่อม `app/warehouse/stock/page.tsx` กับ `GET /api/stock/balances` และ `GET /api/stock/network` โดยลบ `STOCK_BALANCES`, เพิ่ม loading/empty/error/retry, รองรับ filter และ pagination ตาม contract จริง และห้ามใช้ข้อมูล mock เป็น fallback

### Task 2: เชื่อม Movement History

> เชื่อม `app/warehouse/movements/page.tsx` กับ `GET /api/stock/ledger` โดยลบ `INITIAL_LOGS`, map transaction types จาก backend, รองรับ cursor/filter/date range และเพิ่ม error/empty/retry state

### Task 3: เชื่อม Branches

> เชื่อม `app/warehouse/branches/page.tsx` กับ facilities, facility locations และ stock network โดยลบ `BRANCH_DATA`, แสดงเฉพาะ field ที่ backend มีจริง และไม่สร้างค่า manager/capacity/phone ขึ้นเอง

### Task 4: เอา Fake Fallback ออกจาก Inventory

> ปรับ `WarehouseSplitLayoutView.tsx` ให้เมื่อ Product API ล้มเหลวแสดง error state และ Retry แทน `FALLBACK_INVENTORY`; ตรวจ partial failure ของ stock, facilities และ master data รวมถึงผลสำเร็จบางส่วนตอนสร้าง product และ barcode

### Task 5: แก้ Product Detail Data Integrity

> ปรับ Product Detail ไม่ให้ fallback ไปใช้สินค้าตัวแรกเมื่อไม่พบ SKU, แยก not-found/error/loading state และใช้ endpoint รายตัวหรือ query ที่รับประกันการ match SKU

## ลำดับที่ควรเริ่มจริง

1. แก้ Product Detail data integrity bug
2. เชื่อม Stock Balance
3. เชื่อม Movement History
4. เชื่อม Branches เฉพาะ field ที่มีจริง
5. เอา `FALLBACK_INVENTORY` ออกจาก Inventory
6. สร้าง Warehouse Summary API
7. ออกแบบ Alert contract
8. ออกแบบ Receiving transaction
9. ออกแบบ Transfer transaction และ audit
10. ค่อยพิจารณา AI Analysis และ Suppliers

การแบ่งลำดับนี้ช่วยให้เริ่มจากหน้าที่มี API พร้อมก่อน ลดความเสี่ยง และไม่ทำให้ frontend สร้างพฤติกรรมที่ขัดกับ ledger, permission หรือ transaction model ของ backend