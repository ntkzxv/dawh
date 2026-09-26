# สถานะ Backend ระบบคลังสินค้า

เอกสารนี้สรุปโค้ด Backend และฐานข้อมูลที่ทำตามข้อกำหนดวันที่ 26 กันยายน 2026 โครงการใช้หนึ่งองค์กร มี PO กลาง และบันทึกสาขาเมื่อรับของจริง สถานะการเชื่อม Frontend ปัจจุบันอยู่ที่ [warehouse-frontend.md](warehouse-frontend.md)

## สิ่งที่จัดการแล้ว

- ฐานข้อมูลธุรกิจเดิมถูกรื้อและสร้าง schema `app` สำหรับ warehouse ใหม่ โดยเก็บบัญชี admin เดิมที่มี credential ไว้ 3 คน ไม่ seed องค์กร สาขา สินค้า หรือยอดสต๊อก
- Better Auth ดูแลบัญชีและ session ส่วน role กับสมาชิกสาขาอยู่ใน `app.app_users` และ `app.branch_memberships` เปิดให้สร้างสมาชิกผ่าน API ขององค์กร ปิด public sign-up
- API เก็บ PO, ใบ supplier, ใบขนส่ง, การยืนยันรับ, การนับสินค้า, การลงสต๊อก, ปัญหา/เคลม, stock card, รายงาน และ audit log
- แยกบริการเอกสาร supplier กับขนส่งออกจากกัน แยกการตรวจสิทธิ์, validation และ audit เป็นส่วนกลาง และให้การลง stock movement ทุกประเภทผ่าน `postInventoryLine` ใน transaction เดียวกับการปรับยอด
- ลบ helper Backend รุ่นเดิมที่ไม่มี route หรือ service ใหม่ใช้แล้ว รวมทั้ง client service และหน้าที่เรียก API รุ่นเดิม

## ฟีเจอร์และสิทธิ์ที่มี API แล้ว

| ฟีเจอร์ | API หลัก | ผู้ใช้งาน |
|---|---|---|
| ตั้งค่าองค์กรเดียว | `GET/POST/PATCH /api/org` | อ่านได้เมื่อเข้าสู่ระบบ; Admin สร้าง/แก้ |
| สมาชิกและข้อมูลส่วนตัว | `/api/org/members` และ `/{memberId}`; restore/reset-password | Admin จัดการสมาชิกและข้อมูลได้ทุกคน; เจ้าของแก้ชื่อและข้อมูลติดต่อของตน; CEO อ่านรายละเอียดทุกคน; Manager อ่านรายละเอียดในสาขาตน; Counter/Employee เห็นข้อมูลย่อของคนในสาขาเดียวกัน |
| ข้อมูลหลัก | `/api/catalog/{kind}` | Admin/CEO จัดการข้อมูลหลัก; Manager จัดการคลังในสาขาตน |
| PO กลาง | `/api/purchase-orders` | Admin/CEO/Manager/Counter บันทึก; Employee อ่าน; Admin/CEO/Manager ปิด PO |
| ใบ supplier | `/api/supplier-receipts` | Admin/CEO/Manager/Counter |
| ใบขนส่งและรับพัสดุ | `/api/carrier-receipts`, `/{receiptId}/confirm` | Admin/CEO/Manager/Counter/Employee |
| นับสินค้าและลงสต๊อก | `/api/goods-receipts`, `/{receiptId}/post` | Admin/CEO/Manager/Counter ในสาขาที่รับ |
| จ่าย ปรับ และโอนสต๊อก | `/api/stock/documents`, `/{documentId}/reverse` | Admin/CEO/Manager ในสาขาที่เกี่ยวข้อง |
| ยอดคงเหลือและ stock card | `/api/stock/balances`, `/api/stock/ledger` | Admin/CEO ทุกสาขา; Manager/Counter เฉพาะสาขาตน |
| ปัญหาและติดตามเคลม | `/api/issues`, `/{issueId}/events`, `/{issueId}/claims` | Admin/CEO/Manager/Counter; ติดต่อ supplier ภายนอกระบบ |
| หลักฐานและรายงาน | `/api/media`, `/api/reports/receipts`, `/api/reports/outstanding`, `/api/audit` | เปิดรูปตามสิทธิ์; audit ให้ Admin/CEO |

Role `ADMIN` ใช้จัดการระบบภายในองค์กรเดียว ไม่ใช่ Better Auth public admin role. การ soft delete สมาชิกจะ ban บัญชีและลบ session; การกู้คืนปลด ban. สมาชิกใหม่ถูกบังคับเปลี่ยนรหัสผ่านเริ่มต้นก่อนใช้ API ธุรกิจ

## ลำดับการใช้งาน

1. **ตั้งค่าครั้งแรก:** admin เดิมเข้าสู่ระบบ → `POST /api/org` หนึ่งครั้ง → เพิ่มสาขา คลัง supplier หน่วย และสินค้า → เพิ่ม CEO/สมาชิกด้วย `/api/org/members` สมาชิกใหม่เปลี่ยนรหัสผ่านเริ่มต้นผ่าน `/api/me/change-initial-password`
2. **บันทึก PO:** CEO สั่งจริงภายนอกระบบ ผู้มีสิทธิ์บันทึก supplier, วันสั่ง, รายการ, จำนวนและราคา พร้อม `orderedByCeoId` แยกจากผู้กรอก PO ไม่มี `branchId` และไม่มีขั้นอนุมัติ
3. **เก็บหลักฐาน supplier:** อัปโหลดรูปแต่ละหน้าไป `/api/media` แล้วสร้าง `/api/supplier-receipts` โดยอ้าง PO, กรอกเลขเอกสารภายนอกและรายการสินค้าตามใบจริง ระบบเตือนเลข/รูปที่อาจซ้ำ
4. **เก็บหลักฐานขนส่ง:** อัปโหลดรูปแล้วสร้าง `/api/carrier-receipts` ด้วยรหัส PO ใบขนส่งหลายใบอ้าง PO เดียวกันได้ หากใบไม่มี SKU ให้ส่ง `lines: []` หรือไม่ส่ง `lines`
5. **ยืนยันพัสดุมาถึง:** `POST /api/carrier-receipts/{receiptId}/confirm` ระบุ `receivingBranchId`, จำนวนกล่องจริงและสภาพพัสดุ ผู้รับต้องมีสิทธิ์ในสาขาที่เลือก ขั้นนี้ยังไม่เพิ่มยอดสต๊อก
6. **เปิดกล่องนับ:** `POST /api/goods-receipts` ระบุคลังในสาขาที่รับ และจำนวนดี/ชำรุด/ผิดสินค้า หากมีของผิดปกติต้องแนบรูป หัวเรื่อง และรายละเอียด ระบบสร้าง issue ให้ใน transaction เดียวกัน
7. **ลงสต๊อก:** `POST /api/goods-receipts/{receiptId}/post` พร้อม `Idempotency-Key` เพิ่มเฉพาะจำนวนดีที่นับจริง บันทึก movement, balance, serial, ผู้ทำและเวลาใน transaction เดียว กันการ post ซ้ำและกันยอดดีที่ post เกินจำนวนสั่ง
8. **ติดตาม:** ดูยอดค้าง PO, ประวัติรับ, stock card, issue และ audit log ได้ตามสิทธิ์ หากต้องแก้ movement ที่ post แล้วให้สร้าง reversal ไม่ลบ ledger เดิม

ยอดค้าง PO คิดจากจำนวนที่สั่งลบ **ของดีที่นับรับจริง** จากใบขนส่งของ PO นั้น โดยแสดง `posted_good_quantity` แยกจาก `counted_good_quantity` จำนวนชำรุดและผิดสินค้าไม่เพิ่มสต๊อก

## เงื่อนไขก่อนใช้ flow ครบ

- ต้องตั้ง `SUPABASE_SERVICE_ROLE_KEY` ฝั่ง server เพื่ออัปโหลดและเปิดหลักฐานใน private bucket `warehouse-evidence` สภาพแวดล้อมปัจจุบันยังไม่มีค่านี้ จึงยังเดิน flow เอกสารที่บังคับรูปไม่ได้
- FE คลังหลักและหน้าจัดการสมาชิกเปลี่ยนมาใช้ API รุ่นใหม่แล้ว ดูขอบเขตที่เชื่อมและส่วนที่ยังไม่มีปุ่มบน UI ใน [warehouse-frontend.md](warehouse-frontend.md)
- ยังไม่มีข้อมูลธุรกิจ seed และยังไม่ได้รัน flow จริงด้วยข้อมูลตัวอย่าง การตรวจโค้ดรอบเชื่อม FE คือ TypeScript, ESLint และ production build ผ่านด้วย Webpack

รายละเอียด route, รูปแบบ request และการตั้งค่าอยู่ใน [warehouse-backend.md](warehouse-backend.md)
