# การเชื่อม Frontend กับ Warehouse API

ปรับวันที่ 27 กันยายน 2026. ระบบใช้หนึ่งองค์กร ผู้ดูแลเดิมที่เก็บไว้เข้าใช้งานด้วย Better Auth แล้วสร้างข้อมูลองค์กรและสมาชิกผ่านหน้าจอ ไม่มีข้อมูลธุรกิจ seed.

## หน้าที่เชื่อมแล้ว

| หน้า | API ที่เรียก | การทำงาน |
|---|---|---|
| `/workspace` | `/api/me` | แสดงโมดูลที่เข้าใช้ได้ตามสิทธิ์ |
| `/settings` | `/api/org` | ดูและแก้ไขการตั้งค่าระดับองค์กร |
| `/controlpanel` | `/api/org`, `/api/org/members?view=summary`, `/api/org/members/{id}`, `/api/catalog/branches`, `/api/audit` | โหลดข้อมูลแยกตามแท็บ; เปิดสมาชิกแล้วจึงดึงรายละเอียดตามสิทธิ์ |
| `/account` | `/api/me`, `/api/org/members/{memberId}`, `/api/me/change-email`, `/api/me/change-password` | สมาชิกดู/แก้ข้อมูลส่วนตัวและข้อมูลการจ้างงานของตนเอง พร้อมเปลี่ยนอีเมลหรือรหัสผ่านได้ |
| `/warehouse/inventory`, `/warehouse/branches`, `/warehouse/suppliers` | `/api/warehouse/inventory/products`, `/api/catalog/{kind}` | รายการสินค้าและ catalog แบ่งหน้า/กรองที่ BE; โหลดข้อมูลอ้างอิงของฟอร์มเมื่อเปิดฟอร์ม |
| `/warehouse/receive` | `/api/purchase-orders`, `/api/supplier-receipts`, `/api/carrier-receipts`, `/api/goods-receipts`, `/api/media`, `/api/org/ceos` | บันทึก PO ที่ CEO สั่งจริง, ใบผู้ขาย, ใบขนส่ง, รูป, สาขาที่รับ, ผลนับ และลงเฉพาะของดีเข้าสต๊อก |
| `/warehouse/stock`, `/warehouse/transfer`, `/warehouse/movements` | `/api/stock/balances`, `/api/stock/ledger`, `/api/stock/documents` | ยอดและ ledger แบ่งหน้าที่ BE; เปิดฟอร์มเมื่อจะบันทึก โอน จ่าย ปรับ หรือกลับรายการ |
| `/warehouse/issues`, `/warehouse/reports` | `/api/issues`, `/api/reports/*` | บันทึกปัญหา สถานะและการติดตามนอกระบบ; ดู PO ค้างรับกับประวัติรับ |

Client transport อยู่ที่ `lib/api/client.ts`; endpoint warehouse อยู่ที่ `lib/api/warehouse.ts` และชนิดข้อมูลที่ FE/BE ใช้ร่วมกันอยู่ที่ `lib/contracts/warehouse.ts`. ข้อมูลบัญชีย่อใช้ `/api/me` ร่วมกันข้ามหน้า; navbar ไม่ดึง member profile เต็ม. หน้าเว็บไม่เชื่อม PostgreSQL หรือ Supabase Storage โดยตรง. การเปิดไฟล์หลักฐานผ่าน `/api/media/{id}` และต้องผ่านสิทธิ์ฝั่ง server.

## ลำดับเริ่มใช้งาน

1. Admin ที่เก็บไว้ลงชื่อเข้าใช้ แล้วตั้งชื่อองค์กรที่ `/controlpanel`.
2. ตั้งสาขา คลัง หน่วยสินค้า ผู้ขาย และสินค้าในหน้าข้อมูลหลัก.
3. เพิ่มสมาชิก CEO ในหน้าองค์กรและกำหนดรหัสผ่านเริ่มต้น. สมาชิกเข้าใช้งานได้ทันที; หากต้องการเปลี่ยนรหัสผ่านให้ไปที่ `/account`.
4. ที่หน้ารับสินค้า เลือก CEO ผู้สั่งจริง สร้าง PO, อัปโหลดใบผู้ขายและใบขนส่ง, ระบุรหัส PO บนฟอร์มใบขนส่ง, ยืนยันสาขาที่รับจริงพร้อมภาพ, นับสินค้า และกดลงสต๊อก.
5. ติดตาม PO ที่ยังขาดของดีและปัญหาในหน้ารายงาน/ปัญหา.

## ข้อจำกัดที่ยังเห็นได้

- ต้องตั้ง `NEXT_PUBLIC_SUPABASE_URL` และ `SUPABASE_SERVICE_ROLE_KEY` ฝั่ง server ก่อนอัปโหลดรูป. สภาพแวดล้อมปัจจุบันยังไม่มี service role key; ฟอร์มเอกสารที่บังคับรูปจะยังบันทึกไม่ได้ และ UI จะแสดงข้อผิดพลาดจาก Storage.
- หน้าจอรองรับการแก้วันที่และหมายเหตุ PO ก่อนมีหลักฐาน; API ยังรองรับการแก้รายละเอียด PO, ใบผู้ขาย และใบขนส่งเพิ่มเติม แต่ยังไม่มีฟอร์มแก้ไขทุกฟิลด์บนหน้าเว็บ. ข้อมูลแก้ย้อนหลังต้องทำผ่าน API ที่ตรวจสิทธิ์และบันทึก revision.
- รายการรายงานและเอกสารรับบางส่วนยังใช้ขีดจำกัดจำนวนรายการของ API เดิม; pagination รอบนี้ครอบคลุม inventory, catalog, balance และ ledger.
- ไม่มีการทดสอบ flow ด้วยข้อมูลธุรกิจจริงในรอบนี้.
- TypeScript, ESLint และ production build ผ่านด้วย Webpack. ตั้ง `npm run build` ให้ใช้ `next build --webpack` เพราะ Turbopack ในสภาพแวดล้อมนี้หยุดที่การ bind port ระหว่างแปลง CSS.
