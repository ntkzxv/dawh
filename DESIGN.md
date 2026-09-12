# Horizon WMS

## Warehouse, Stock, Branch Logistics & Claim Management System

เอกสารฉบับนี้สรุปขอบเขตผลิตภัณฑ์และสถาปัตยกรรมของระบบ Horizon WMS สำหรับทีมพัฒนา 2 คน โดยเน้นให้ระบบมี workflow จริง มีความน่าเชื่อถือด้านข้อมูล และนำเสนอเป็นโปรเจกต์จบได้อย่างมืออาชีพ โดยไม่ขยาย scope ไปเป็น ERP เต็มรูปแบบ

## 1. Product Vision

Horizon WMS เป็นระบบกลางสำหรับควบคุมสินค้าในคลังกลางและสาขาต่าง ๆ ตั้งแต่รับสินค้า จัดเก็บ ตรวจนับ เบิก โอนระหว่างสาขา จัดส่ง ติดตามขนส่ง ตรวจรับปลายทาง และจัดการ Claim เมื่อสินค้าเสียหาย สูญหาย หรือมีจำนวนไม่ตรง

จุดขายหลักของระบบคือ:

- มองเห็น Stock ทั้งเครือข่ายแบบแยกคลังและสาขา
- รองรับ Central-to-Branch, Branch-to-Branch และ Branch-to-Central
- ใช้ Stock Ledger ตรวจสอบการเคลื่อนไหวทุกชิ้นย้อนหลังได้
- ติดตามสินค้าระหว่างทางโดยไม่เพิ่ม Stock ปลายทางก่อนตรวจรับ
- เชื่อม Claim เข้ากับ Shipment, Package, SKU, Lot และ Stock Transaction
- จำกัดสิทธิ์ตามทั้ง Role และสาขาที่ผู้ใช้รับผิดชอบ
- ใช้ Barcode/QR ช่วยลดความผิดพลาดในการทำงาน

## 2. Scope และสมมติฐาน

### 2.1 ขอบเขตองค์กร

- มีองค์กรเดียวคือ Horizon Logistics
- มีคลังกลางอย่างน้อย 1 แห่ง
- มีสาขาหลายแห่ง แต่ใช้ Application และ Database กลางร่วมกัน
- แต่ละสาขามี Stock Balance ของตัวเอง
- ผู้ใช้บางคนเห็นเฉพาะสาขาตัวเอง ขณะที่ผู้บริหารและ Auditor เห็นหลายสาขา
- สาขาสามารถขอและส่งสินค้าให้กันโดยตรงได้หลังผ่าน Approval

### 2.2 สิ่งที่ไม่อยู่ในขอบเขตเวอร์ชันแรก

- ระบบบัญชีและ General Ledger
- Procurement และ Supplier Portal แบบครบวงจร
- ระบบขายหรือ POS
- Demand Forecasting ด้วย Machine Learning
- Route Optimization
- Live GPS จากอุปกรณ์บนรถจริง
- Native Mobile Application
- IoT Sensor ภายในคลัง
- Multi-tenant SaaS สำหรับหลายบริษัท
- การเชื่อมต่อ Carrier API ภายนอก

## 3. แนวทางสถาปัตยกรรม

### 3.1 Technology Stack

- Frontend และ Backend for Frontend: Next.js 16 App Router
- API: Next.js Route Handlers ที่ทีมเขียนเองทั้งหมด
- Authentication และ Session: Better Auth
- Authorization: เขียน Permission และ Branch Scope ใน Application Layer
- Database Infrastructure: Supabase PostgreSQL
- File Infrastructure: Supabase Storage เฉพาะ Claim Evidence, Proof of Delivery และรูปจากการตรวจรับ หากต้องการเก็บไฟล์
- Database Access: Server-side เท่านั้น ผ่าน Data Access Layer
- Validation: Schema validation ที่ API boundary
- Deployment Model: Modular Monolith หนึ่ง Application

### 3.2 หลักการสำคัญ

Browser ไม่อ่านหรือแก้ Business Table ผ่าน Supabase Data API โดยตรง ทุกคำสั่งต้องผ่าน API ของ Horizon WMS เพื่อให้ระบบตรวจ Session, Permission, Branch Scope, Document State และ Stock Rule ก่อนเขียนข้อมูล

```text
Browser / PWA
    |
    v
Next.js 16 Route Handlers
    |
    +-- Better Auth Session Validation
    +-- Role & Branch Authorization
    +-- Request Validation
    |
    v
Application Services / Domain Rules
    |
    +-- Inventory Service
    +-- Transfer Service
    +-- Shipment Service
    +-- Claim Service
    +-- Reporting Service
    |
    v
Repository / Data Access Layer
    |
    v
Supabase PostgreSQL
```

### 3.3 เหตุผลที่ใช้ Modular Monolith

- ทีมสองคนดูแลได้ง่ายกว่า Microservices
- Transaction ระหว่าง Transfer, Shipment และ Stock ทำในฐานข้อมูลเดียวได้
- แยก Domain Module ชัดเจนโดยไม่เพิ่มงานด้าน Infrastructure
- ทดสอบ End-to-End Workflow ได้ง่าย
- สามารถแยก Service ภายหลังได้หากระบบเติบโต

### 3.4 การใช้ Supabase

Supabase ทำหน้าที่เป็น Managed PostgreSQL และอาจใช้ Storage แต่ไม่ใช้ Supabase Auth, Edge Functions หรือ auto-generated REST API เป็นแกน Business Logic

แนวทางฐานข้อมูล:

- ตารางของ Better Auth แยกอยู่ใน schema `better_auth` เพื่อไม่ชนกับ schema `auth` ที่ Supabase สงวนไว้ให้ Supabase Auth
- Business Table อยู่ใน private schema เช่น `app`
- ไม่ expose schema `app` ผ่าน Data API
- API Server เชื่อม Postgres ผ่าน Connection String ที่เก็บใน Server Environment เท่านั้น
- Environment แบบ Serverless ใช้ Transaction Pooler และตั้งค่าตามข้อจำกัดของ Driver
- Migration เป็น source of truth ของ Schema และถูกเก็บใน repository
- Secret, Database Password และ Service Key ห้ามส่งไปฝั่ง Browser

หากใช้ Supabase Storage ผู้ใช้จะขอ Upload ผ่าน API ของระบบ และ API เป็นผู้ตรวจสิทธิ์ก่อนสร้าง signed upload URL หรืออัปโหลดแทนผู้ใช้ Service Key จะอยู่ฝั่ง Server เท่านั้น

## 4. User Roles และ Access Scope

| Role | ขอบเขต | ความสามารถหลัก |
|---|---|---|
| System Administrator | ทุกสาขา | ผู้ใช้ Role ข้อมูล Master และตั้งค่าระบบ |
| HQ/Area Manager | หลายสาขา | อนุมัติ Transfer ดู Network Stock และ KPI |
| Warehouse Manager | คลังที่รับผิดชอบ | Receiving, Adjustment, Stock Count และ Fulfillment |
| Stock Controller | คลังที่รับผิดชอบ | รับสินค้า Putaway Movement และตรวจนับ |
| Picker/Packer | คลังหรือสาขาที่รับผิดชอบ | Picking, Packing และ Dispatch Task |
| Branch Requester | สาขาตัวเอง | ขอสินค้า ดูสถานะ และดู Stock สาขา |
| Branch Receiver | สาขาตัวเอง | ตรวจรับ ยืนยันจำนวน และเปิด Claim |
| Claim Officer | หลายสาขาตามที่กำหนด | ตรวจสอบ Claim ตัดสิน Resolution และปิดเคส |
| Auditor | ทุกสาขาแบบ Read-only | รายงาน Stock Ledger และ Audit Log |

Authorization ต้องตรวจทั้ง Permission และ Location Scope ทุก API เช่น ผู้ใช้ที่มี `stock.read` ของเชียงใหม่ต้องไม่สามารถอ่าน Stock ภูเก็ตได้ แม้จะเปลี่ยน URL หรือ Request Body เอง

## 5. Warehouse Organization

### 5.1 Location Hierarchy

```text
Organization
  -> Warehouse or Branch
    -> Zone
      -> Aisle
        -> Rack
          -> Shelf
            -> Bin
```

คลังกลางใช้ Hierarchy เต็ม ส่วนสาขาขนาดเล็กสามารถใช้เพียง Branch -> Zone -> Bin ได้

### 5.2 Location Type

- Receiving
- Storage
- Picking
- Packing
- Dispatch
- Quarantine
- Damaged
- Return
- Claim Holding

### 5.3 Location Data

- Location Code และ QR Code
- ชื่อและประเภทพื้นที่
- Warehouse/Branch เจ้าของพื้นที่
- ความจุและน้ำหนักสูงสุด
- ประเภทสินค้าที่อนุญาต
- สถานะ Active, Blocked หรือ Maintenance
- จำนวนสินค้าปัจจุบัน
- Capacity Utilization

### 5.4 Suggested Putaway

ระบบแนะนำ Bin ด้วย Rule-based Score จากพื้นที่ว่าง ประเภทสินค้า น้ำหนัก SKU ที่มีอยู่แล้ว ความถี่การเบิก และเงื่อนไข FIFO/FEFO ผู้ใช้ที่มีสิทธิ์สามารถ Override ได้ แต่ต้องระบุเหตุผล

## 6. Product และ SKU Management

### 6.1 Product Master

- SKU และ Barcode
- ชื่อ รายละเอียด รูปสินค้า Brand และ Category
- Base Unit และหน่วยนับเสริม
- น้ำหนักและขนาด
- ราคาต้นทุนเพื่อใช้ใน Stock Valuation แบบพื้นฐาน
- Minimum Stock, Maximum Stock และ Reorder Point
- Shelf Life และเงื่อนไขการเก็บ
- Tracking Method: None, Lot หรือ Serial
- สถานะ Active/Inactive

### 6.2 Unit Conversion

รองรับตัวอย่างเช่น 1 ลัง = 12 กล่อง และ 1 กล่อง = 6 ชิ้น โดย Stock Ledger บันทึกใน Base Unit เสมอเพื่อป้องกันยอดคลาดเคลื่อน

### 6.3 Lot, Serial และ Expiry

- Lot Number และ Manufacturing Date
- Expiry Date
- Serial Number รายชิ้น
- ป้องกัน Serial เดียวอยู่มากกว่าหนึ่ง Location
- แจ้งเตือนสินค้าใกล้หมดอายุ
- รองรับ FIFO และ FEFO ในการแนะนำรายการหยิบ

## 7. Stock Model

### 7.1 Stock Status

- Available
- Reserved
- Picked
- Packed
- In Transit
- Quarantine
- Damaged
- Claim Pending
- Expired
- Lost

```text
Available Stock = On-hand - Reserved - Quarantine - Damaged
```

```text
Available-to-Transfer = On-hand - Reserved - Quarantine - Damaged - Safety Stock
```

Safety Stock ถูกกำหนดราย SKU ต่อสาขา เพื่อป้องกันสาขาส่งของให้ที่อื่นจนตัวเองขาด Stock

### 7.2 Inventory Ledger

ห้ามแก้จำนวน Stock โดยตรง ทุกการเปลี่ยนแปลงต้องสร้าง Inventory Transaction เช่น:

- RECEIVE
- PUTAWAY
- MOVE
- RESERVE
- RELEASE_RESERVATION
- PICK
- PACK
- DISPATCH
- RECEIVE_TRANSFER
- QUARANTINE
- CLAIM_HOLD
- ADJUST
- WRITE_OFF
- RETURN

Transaction เก็บ Reference Document, Source/Destination Location, SKU, Lot/Serial, Quantity Before, Quantity Changed, Quantity After, Actor, Reason และ Timestamp

ตาราง Stock Balance เป็นยอดปัจจุบันเพื่อให้ Query เร็ว แต่ Ledger เป็นหลักฐานการเปลี่ยนแปลงและห้ามแก้ย้อนหลังโดยตรง

### 7.3 Data Integrity

- ใช้ Database Transaction กับทุกคำสั่งที่เปลี่ยน Stock
- Lock Stock Balance ที่เกี่ยวข้องระหว่างตรวจและตัดยอด
- ป้องกัน Negative Stock
- ใช้ Idempotency Key กับคำสั่งสำคัญ เช่น Dispatch และ Receiving
- Document ที่ Post แล้วห้ามลบ ให้ Cancel, Reverse หรือ Adjust ผ่าน Workflow
- ทุก Transaction ต้อง Balance และมี Reference ที่ตรวจสอบได้

## 8. Inbound และ Internal Inventory Operations

### 8.1 Receiving

1. สร้างเอกสารรับสินค้า
2. ระบุแหล่งที่มาและรายการที่คาดว่าจะรับ
3. สแกน SKU, Lot หรือ Serial
4. บันทึกจำนวนจริง
5. ระบุครบ ขาด เกิน ผิด SKU หรือเสียหาย
6. แนบหลักฐานหากมี Exception
7. ยืนยันรับเข้า Receiving Area
8. สร้าง Putaway Task

### 8.2 Putaway

- แนะนำ Destination Bin
- สแกนสินค้ากับ Bin
- ป้องกันวางผิด Warehouse หรือ Location Type
- บันทึกผู้ทำงานและเวลา
- อนุญาต Override พร้อมเหตุผลตาม Permission

### 8.3 Internal Movement

- ย้ายระหว่าง Bin
- เติมสินค้าจาก Storage ไป Picking Area
- ย้ายเข้า Quarantine หรือ Damaged Area
- คืนสินค้าจาก Quarantine ไป Available หลังตรวจสอบ

### 8.4 Stock Adjustment

- ระบุ Reason Code
- แสดงยอดก่อนและหลัง
- แนบหลักฐาน
- แยก Requester และ Approver
- สร้าง Ledger หลังอนุมัติเท่านั้น
- เก็บ Audit Trail ของการอนุมัติและปฏิเสธ

### 8.5 Cycle Count และ Stocktake

- สร้าง Count Plan ตาม Warehouse, Zone, Bin หรือ SKU
- รองรับ Blind Count
- Recount เมื่อยอดไม่ตรง
- คำนวณ Variance
- สร้าง Adjustment หลัง Manager อนุมัติ
- รายงาน Stock Accuracy

## 9. Multi-Branch Transfer

### 9.1 Transfer Type

- Central-to-Branch
- Branch-to-Branch
- Branch-to-Central

### 9.2 Transfer State

```text
Draft
-> Submitted
-> Approved
-> Allocated
-> Picking
-> Picked
-> Packed
-> Dispatched
-> In Transit
-> Delivered
-> Received
-> Completed
```

สถานะพิเศษ:

- Rejected
- Cancelled
- Partially Fulfilled
- Partially Received
- Delivery Failed
- Claim Opened

### 9.3 Request Data

- Source และ Destination
- SKU และจำนวน
- Required Date
- Priority
- Reason
- Requester
- Attachment
- หมายเหตุ

### 9.4 Source Recommendation

กรณีผู้ขอไม่ระบุต้นทาง ระบบแสดงสาขาที่สามารถส่งได้โดยดูจาก Available-to-Transfer, Lead Time, ระยะทางแบบ Master Data และจำนวนงานค้าง ระบบเสนอแนะเท่านั้น ไม่สร้าง Transfer อัตโนมัติ

### 9.5 Approval

Branch-to-Branch ต้องผ่าน HQ/Area Manager ในเวอร์ชันแรก ผู้อนุมัติสามารถอนุมัติเต็มจำนวน อนุมัติบางส่วน เปลี่ยนต้นทาง ส่งกลับให้แก้ไข หรือปฏิเสธพร้อมเหตุผล

### 9.6 Scope Constraint

- หนึ่ง Transfer มี Source เดียวและ Destination เดียว
- Transfer หลายต้นทางต้องแยกเป็นหลายเอกสาร
- ใช้ Approval ขั้นเดียว
- ห้าม Source และ Destination เป็น Location เดียวกัน
- การส่งต่ำกว่า Safety Stock ต้องใช้ Special Approval หรือปฏิเสธใน MVP

## 10. Picking, Packing และ Dispatch

### 10.1 Picking

- สร้าง Pick List จาก Transfer ที่ Approved
- แนะนำ Bin และ Lot ตาม FIFO/FEFO
- สแกน Bin ก่อนสแกนสินค้า
- ตรวจ SKU, Lot, Serial และ Quantity
- รองรับ Short Pick พร้อม Reason
- มอบหมาย Task ให้ผู้ปฏิบัติงาน
- แสดง Progress และเวลาที่ใช้

### 10.2 Packing

- ตรวจรายการที่ Picked
- แบ่งเป็นหลาย Package
- สร้าง Package ID และ QR Label
- บันทึกน้ำหนักและขนาด
- แนบรูปก่อนปิดกล่อง
- พิมพ์ Packing List
- ป้องกันแพ็กสินค้าเกิน Picked Quantity

### 10.3 Dispatch

- Carrier
- Driver และเบอร์โทรศัพท์
- Vehicle Registration
- Tracking Number
- Seal Number
- Expected Delivery Time
- จำนวน Package
- เอกสารและรูปตอนขึ้นรถ

เมื่อยืนยัน Dispatch ระบบลด On-hand และ Reserved ของต้นทาง แล้วเพิ่ม In-transit Stock โดยไม่เพิ่ม On-hand ของปลายทาง

## 11. Shipment Tracking

### 11.1 Event-based Tracking

- Shipment Created
- Vehicle Departed
- Arrived at Distribution Point
- Out for Delivery
- Arrived at Branch
- Receiver Confirmed
- Delivery Delayed
- Delivery Failed
- Claim Opened

แต่ละ Event เก็บเวลา สถานที่ ผู้บันทึก หมายเหตุ รูป และพิกัดถ้ามี โดยไม่ต้องเชื่อม Live GPS ใน MVP

### 11.2 ETA และ Delay

- Expected Delivery Time
- Actual Delivery Time
- On-time/Delayed Status
- Delay Reason
- Notification ก่อนและหลังเกินกำหนด
- On-time Delivery Rate

### 11.3 Proof of Delivery

- ชื่อผู้รับ
- เวลาได้รับ
- ลายเซ็น รูปภาพ หรือ OTP/QR Confirmation
- จำนวน Package ที่รับ
- หมายเหตุ

## 12. Destination Receiving

สาขาปลายทางตรวจรับโดยเลือกผลต่อ SKU หรือ Package:

- Received in Full
- Partial Received
- Over Received
- Missing
- Wrong SKU
- Serial/Lot Mismatch
- Damaged
- Rejected

จำนวนที่ผ่านการตรวจรับเท่านั้นจึงเพิ่มเข้า Stock ปลายทาง จำนวนที่มีปัญหาถูกย้ายเป็น Claim Pending หรือ Quarantine ตามประเภท Exception

ตัวอย่างส่ง 20 ชิ้น รับปกติ 18 และเสียหาย 2:

```text
In Transit            -20
Destination Available +18
Destination Claim Pending +2
```

## 13. Claim Management

### 13.1 Claim Type

- Missing Quantity
- Over Quantity
- Wrong SKU
- Lot/Serial Mismatch
- Product Damaged
- Package Tampered
- Expired Product
- Lost Shipment
- Late Delivery
- Missing Document

### 13.2 Claim Data

- Claim Number
- Transfer, Shipment และ Package Reference
- Source และ Destination
- SKU, Lot/Serial และจำนวนที่มีปัญหา
- Issue Type และรายละเอียด
- Claimant
- Evidence
- Suspected Responsible Party
- SLA Due Date
- Resolution

### 13.3 Claim State

```text
Draft
-> Submitted
-> Under Review
-> Investigation
-> Approved or Rejected
-> Resolution in Progress
-> Resolved
-> Closed
```

### 13.4 Claim Resolution

- Replacement Transfer
- Send Missing Quantity
- Return to Source
- Move to Quarantine
- Move to Damaged
- Return to Available
- Stock Adjustment
- Write-off
- Close without Compensation

Resolution ที่มีผลต่อ Stock ต้องเรียก Inventory Service เพื่อสร้าง Ledger ห้าม Claim Module แก้ Stock Balance โดยตรง

### 13.5 Claim SLA และ Root Cause

- Response Deadline
- Investigation Deadline
- Countdown และ Overdue Alert
- Escalation ไปยัง Manager
- Root Cause: Picking, Packing, Loading, Transport, Receiving, Stock Data, Packaging หรือ Unknown
- KPI: Claim Rate, Average Resolution Time และ Claim by Route/Branch

## 14. Dashboard และ Reports

### 14.1 Organization Dashboard

- Total On-hand, Available, Reserved และ In Transit
- Stock แยกตามสาขา
- Low-stock และ Out-of-stock SKU
- Near-expiry Stock
- Pending Approval
- Delayed Shipment
- Open/Overdue Claim
- Warehouse/Branch Stock Accuracy

### 14.2 Branch Dashboard

- My Stock
- Incoming Shipment
- Outbound Transfer
- Pending Receiving
- Low-stock Alert
- Open Claim
- งานตรวจนับและงานที่ได้รับมอบหมาย

### 14.3 Network Stock View

แสดง SKU เทียบ Stock ของทุกสาขา พร้อม On-hand, Reserved, Available-to-Transfer, Safety Stock และ In Transit เพื่อช่วยตัดสินใจเลือก Source

### 14.4 Reports

- Stock Balance
- Stock Card และ Inventory Ledger
- Inventory Movement
- Stock Aging
- Low Stock และ Near Expiry
- Adjustment History
- Cycle Count Variance
- Transfer Performance
- Shipment Performance
- Claim Summary และ Root Cause
- User Activity และ Audit Log
- Export CSV สำหรับรายงานหลัก และ PDF สำหรับเอกสารที่ต้องพิมพ์

## 15. Notifications

- Transfer Request ใหม่
- รายการรอ Approval
- Picking/Packing Task ใหม่
- Stock ต่ำกว่า Reorder Point
- สินค้าใกล้หมดอายุ
- Shipment ใกล้หรือเกิน ETA
- Shipment รอรับที่ปลายทาง
- Receiving พบ Exception
- Claim ใหม่หรือใกล้เกิน SLA
- Cycle Count มี Variance

Notification Center ในระบบเป็น Must-have ส่วน Email หรือ Push Notification เป็น Optional

## 16. API Design

### 16.1 Route Group

```text
/api/auth/[...all]              Better Auth handler
/api/v1/me                      Session และ access scope
/api/v1/warehouses              Warehouse และ Location
/api/v1/products                Product และ SKU
/api/v1/stock/balances          Current stock
/api/v1/stock/ledger            Stock history
/api/v1/receivings              Inbound receiving
/api/v1/putaway-tasks           Putaway
/api/v1/stock-movements         Internal movement
/api/v1/stock-adjustments       Adjustment workflow
/api/v1/stock-counts            Cycle count
/api/v1/transfers               Multi-branch transfer
/api/v1/picking-tasks           Picking
/api/v1/packages                Packing
/api/v1/shipments               Dispatch และ shipment
/api/v1/shipments/:id/events    Tracking timeline
/api/v1/receipts                Destination receiving
/api/v1/claims                  Claim workflow
/api/v1/reports                 Operational reports
/api/v1/notifications           Notification center
/api/v1/audit-logs              Audit access
```

### 16.2 API Layer Rule

Route Handler ทำเฉพาะ:

1. ตรวจ Session
2. Parse และ Validate Input
3. ตรวจ Permission และ Branch Scope
4. เรียก Application Service
5. Map Result เป็น Response และ Error Code

Business Logic ต้องอยู่ใน Service ไม่ฝังใน React Component หรือ Route Handler เพื่อให้ทดสอบได้และใช้ซ้ำได้

### 16.3 Error Model

Error Response ใช้รูปแบบเดียวกัน:

```json
{
  "error": {
    "code": "INSUFFICIENT_AVAILABLE_STOCK",
    "message": "Available stock is lower than requested quantity",
    "details": {
      "available": 12,
      "requested": 20
    },
    "requestId": "req_xxx"
  }
}
```

ตัวอย่าง Domain Error:

- UNAUTHORIZED
- FORBIDDEN_BRANCH_SCOPE
- INVALID_DOCUMENT_STATE
- INSUFFICIENT_AVAILABLE_STOCK
- SAFETY_STOCK_VIOLATION
- SERIAL_ALREADY_ASSIGNED
- DUPLICATE_OPERATION
- CLAIM_SLA_EXPIRED
- CONCURRENT_STOCK_UPDATE

## 17. Authentication และ Authorization

### 17.1 Better Auth Responsibility

- Sign in/Sign out
- Password และ Account Lifecycle
- Session Creation, Validation และ Revocation
- Auth API ภายใต้ `/api/auth/[...all]`

### 17.2 Application Responsibility

- Role
- Permission
- Branch/Warehouse Membership
- Approval Authority
- Data Scope
- Audit Log

Better Auth User ID เชื่อมกับ Application User Profile และ Membership ผู้ใช้หนึ่งคนสามารถมีหลาย Role หรือหลาย Branch Scope ได้

### 17.3 Enforcement

- ใช้ Next.js 16 `proxy.ts` สำหรับ Redirect หน้าแบบเบื้องต้น
- API ทุกตัวตรวจ Session จาก Server อีกครั้ง
- ห้ามเชื่อถือ Role หรือ Branch ID ที่ Browser ส่งมา
- Query ต้องเติม Branch Scope จาก Session Context
- Sensitive Action เช่น Adjustment Approval, Dispatch และ Claim Resolution ตรวจ Permission เฉพาะเจาะจง

## 18. Core Data Model

### 18.1 Identity และ Access

- Better Auth user/session/account/verification tables
- user_profiles
- roles
- permissions
- role_permissions
- user_role_assignments
- user_location_scopes

### 18.2 Organization และ Inventory

- organizations
- facilities
- warehouse_locations
- products
- product_units
- product_barcodes
- lots
- serial_numbers
- safety_stock_rules
- stock_balances
- inventory_transactions

### 18.3 Operations

- receiving_orders
- receiving_items
- putaway_tasks
- stock_movements
- stock_adjustments
- stock_count_plans
- stock_count_items
- transfer_orders
- transfer_items
- stock_reservations
- picking_tasks
- picking_items
- packages
- package_items
- shipments
- shipment_events
- destination_receipts
- destination_receipt_items

### 18.4 Claim และ System

- claims
- claim_items
- claim_evidence
- claim_status_history
- claim_resolutions
- notifications
- audit_logs
- document_sequences
- idempotency_keys

## 19. UI Information Architecture

### 19.1 Global Navigation

- Overview
- Network Stock
- Warehouse Operations
- Transfers
- Shipments
- Claims
- Reports
- Administration

### 19.2 Branch Switcher

HQ และ Auditor เลือก All Locations หรือสาขาที่มีสิทธิ์ได้ พนักงานสาขาไม่เห็นตัวเลือกนอก Scope ของตัวเอง

### 19.3 Screen Inventory

1. Sign In
2. Organization Dashboard
3. Branch Dashboard
4. Network Stock View
5. Warehouse List
6. Warehouse Layout
7. Location Detail
8. Product List
9. Product Detail และ Stock by Location
10. Receiving List/Detail
11. Putaway Tasks
12. Inventory Movement
13. Stock Adjustment
14. Cycle Count
15. Transfer List/Detail
16. Transfer Approval Queue
17. Picking Task
18. Packing Station
19. Shipment List
20. Shipment Tracking
21. Destination Receiving
22. Claim List/Detail
23. Reports
24. Notifications
25. Users, Roles และ Location Scope
26. Audit Log

## 20. Professional Quality Requirements

### 20.1 Auditability

- ทุกเอกสารมี Created By, Updated By, Approved By และ Timestamp
- เก็บ Status History
- Audit ค่าเดิมและค่าใหม่ของข้อมูลสำคัญ
- เอกสารที่มี Stock Transaction ห้าม Hard Delete
- เลขเอกสารอ่านง่าย เช่น `TRF-202609-0001`, `SHP-202609-0001`, `CLM-202609-0001`

### 20.2 Security

- Password และ Session ให้ Better Auth จัดการ
- ตรวจ Authorization ที่ API ทุกครั้ง
- Rate limit จุดสำคัญตามความเหมาะสม
- Validate File Type และ File Size
- Signed URL สำหรับไฟล์ที่ไม่ควรเป็น Public
- Secrets อยู่ฝั่ง Server เท่านั้น
- Log เหตุการณ์สำคัญโดยไม่บันทึก Password, Token หรือ Secret

### 20.3 Reliability

- Idempotent Mutation สำหรับปุ่มที่กดซ้ำได้
- Database Transaction สำหรับ Stock Operation
- Optimistic หรือ Pessimistic Lock ตาม Use Case
- Retry เฉพาะ Operation ที่ปลอดภัย
- แสดง Request ID ใน Error เพื่อช่วย Debug

### 20.4 UX States

ทุกหน้าหลักต้องออกแบบ Loading, Empty, Error, Permission Denied, Disabled, Partial Success และ Confirmation State ไม่แสดงเฉพาะ Happy Path

## 21. Testing Strategy

### 21.1 Unit Test

- Available และ Available-to-Transfer Calculation
- FIFO/FEFO Selection
- Transfer State Transition
- Safety Stock Rule
- Claim Resolution Mapping
- Permission Check

### 21.2 Integration Test

- Reserve และ Dispatch ไม่ทำให้ Stock ติดลบ
- Concurrent Transfer ไม่ตัดสินค้าเกินยอด
- Dispatch ลดต้นทางและเพิ่ม In Transit ถูกต้อง
- Destination Receipt ลด In Transit และเพิ่มปลายทางถูกต้อง
- Partial Receipt สร้าง Claim Pending ถูกต้อง
- Claim Resolution สร้าง Ledger ถูกประเภท
- Branch Scope ป้องกันการอ่านและแก้ข้อมูลข้ามสาขา

### 21.3 End-to-End Test

- Central-to-Branch Happy Path
- Branch-to-Branch Happy Path
- Partial Receiving และ Claim
- Adjustment Approval
- Cycle Count Variance
- Unauthorized Cross-branch Access

## 22. KPI และ Success Criteria

- Stock Accuracy
- Picking Accuracy
- Order/Transfer Fulfillment Time
- On-time Dispatch Rate
- On-time Delivery Rate
- Claim Rate per Shipment
- Average Claim Resolution Time
- Inventory Adjustment Rate
- Number of Stockout SKU
- Warehouse Capacity Utilization

เกณฑ์สำเร็จของโปรเจกต์ไม่ใช่จำนวนหน้าจอ แต่คือสามารถ Demo Workflow จบตั้งแต่ Request จน Stock ปลายทางและ Claim ถูกสะท้อนใน Ledger อย่างถูกต้อง

## 23. MVP และ Differentiator

### 23.1 Must-have

- Better Auth และ Role/Branch Authorization
- Warehouse/Branch และ Location Hierarchy
- Product, SKU, Lot/Serial และ Safety Stock
- Stock Balance และ Append-only Ledger
- Receiving, Putaway และ Internal Movement
- Adjustment Approval และ Cycle Count
- Multi-branch Transfer และ Reservation
- Picking, Packing และ Dispatch
- Event-based Shipment Tracking
- Destination Receiving
- Claim Workflow และ Claim Resolution
- Dashboard, Network Stock View และรายงานหลัก
- Notification Center และ Audit Log

### 23.2 Differentiator ที่แนะนำ

เลือกทำให้เด่น 3 รายการ:

1. QR/Barcode Scanning ผ่าน Mobile Web/PWA
2. Suggested Putaway และ FIFO/FEFO Picking
3. Claim SLA พร้อม Root Cause Analytics

### 23.3 Optional หลัง MVP

- Real-time Dashboard
- Stock Heatmap
- OTP Proof of Delivery
- Automatic Source Recommendation Score
- Advanced PDF Report

## 24. Roadmap สำหรับทีม 2 คน

### Phase 1: Foundation

- Next.js 16 Project Structure
- Better Auth
- User, Role และ Branch Scope
- Supabase Postgres Connection และ Migration
- Warehouse, Location และ Product Master
- Stock Ledger Foundation

### Phase 2: Inbound Inventory

- Receiving
- Putaway
- Internal Movement
- Adjustment
- Cycle Count

### Phase 3: Transfer Fulfillment

- Transfer Request และ Approval
- Reservation
- Picking
- Packing
- Dispatch

### Phase 4: Logistics และ Claim

- Shipment Timeline
- Destination Receiving
- Partial/Exception Handling
- Claim Workflow, SLA และ Resolution

### Phase 5: Professional Polish

- Dashboard และ Reports
- QR/Barcode
- Audit Log
- Responsive UX และ Error States
- Automated Tests
- Security และ Performance Review

## 25. การแบ่งงานสองคน

### Developer A: Inventory Core

- Better Auth Integration และ Authorization Foundation
- Warehouse/Location/Product
- Database Schema และ Migration
- Stock Ledger และ Balance
- Receiving, Putaway และ Movement
- Adjustment และ Cycle Count

### Developer B: Distribution Operations

- Transfer Request และ Approval
- Reservation, Picking และ Packing
- Dispatch และ Tracking
- Destination Receiving
- Claim, Dashboard และ Reports

### งานที่ต้องออกแบบและ Review ร่วมกัน

- Domain Model และ API Contract
- Stock Transaction Rules
- Transfer/Shipment/Claim State Machine
- Permission Matrix
- Integration Test และ Demo Data
- Design System และ Navigation

## 26. Demo Scenario

1. สาขาเชียงใหม่มี Stock ต่ำกว่า Safety Stock และสร้างคำขอ 20 ชิ้น
2. Network Stock แสดงว่าลำปางส่งได้และใช้เวลาน้อยที่สุด
3. HQ Manager อนุมัติ Branch-to-Branch Transfer
4. ระบบ Reserve 20 ชิ้นที่ลำปาง
5. พนักงานลำปางเปิด Pick List และสแกน Bin/SKU ตาม FEFO
6. แพ็กสินค้าเป็น 2 Package และสร้าง QR Label
7. Dispatcher ระบุรถ คนขับ ETA และยืนยัน Dispatch
8. Stock ลำปางลดลงและ In Transit เพิ่ม 20 โดยเชียงใหม่ยังไม่เพิ่ม Stock
9. Tracking Timeline แสดงเหตุการณ์ระหว่างขนส่ง
10. เชียงใหม่รับปกติ 18 ชิ้นและพบเสียหาย 2 ชิ้น
11. ระบบเพิ่ม Available 18 และ Claim Pending 2
12. พนักงานเปิด Claim พร้อมรูปและ Package Reference
13. Claim Officer ตรวจสอบและอนุมัติ Replacement Transfer
14. Ledger, Dashboard, KPI และ Audit Log อัปเดตครบ

Demo นี้แสดง Authentication, Authorization, Multi-branch Stock, Reservation, Fulfillment, Logistics, Exception Handling, Claim และ Auditability ภายใน Flow เดียว

## 27. Definition of Done

ระบบถือว่าพร้อมนำเสนอเมื่อ:

- Workflow หลักทำงานจบโดยไม่แก้ Database ด้วยมือ
- Stock ของต้นทาง In Transit และปลายทาง Balance ถูกต้องทุกสถานะ
- Branch-to-Branch ถูกควบคุมด้วย Safety Stock และ Approval
- User ข้ามสาขาไม่ได้หากไม่มี Scope
- Partial Receiving และ Claim เชื่อม Stock Ledger ถูกต้อง
- Operation สำคัญกดซ้ำแล้วไม่สร้าง Transaction ซ้ำ
- Audit Log แสดงผู้กระทำ เวลา และ Reference Document
- มี Unit, Integration และ E2E Test สำหรับ Critical Flow
- Demo Data มีหลายสาขา หลาย SKU และกรณี Exception
- UI รองรับ Loading, Empty, Error และ Permission State

## 28. Technical References

- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Better Auth Next.js Integration](https://better-auth.com/docs/integrations/next)
- [Better Auth PostgreSQL Adapter](https://better-auth.com/docs/adapters/postgresql)
- [Supabase: Connect to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase: Connection Pooling and Limits](https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits)
