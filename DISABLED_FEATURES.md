# บันทึกรายการฟังก์ชันที่ถูกปิดชั่วคราว (Disabled Features & Guards Log)

เอกสารนี้รวบรวมรายการฟังก์ชัน เงื่อนไขการตรวจสอบสิทธิ์ (Role Check) และระบบป้องกันข้อมูลไม่ครบถ้วน (Incomplete Profile Guard) ที่ถูกปิดการทำงานชั่วคราว เพื่อความสะดวกในการทดสอบระบบและพัฒนา UI/UX โดยสามารถเปิดกลับคืนมาได้ตลอดเวลา

---

## 1. การปิดการตรวจสอบสิทธิ์แอดมิน (Admin / DevOps Role Check)

### วัตถุประสงค์ที่ปิด:
เพื่อให้ผู้ใช้ทุกคนสามารถมองเห็นและกดเข้าไปที่เมนู **"แผงควบคุมระบบ" (Control Panel)** ใน Account Dropdown บนแถบ Navbar ได้โดยไม่ต้องมีสิทธิ์เป็น Admin หรือ DevOps ในฐานข้อมูล

### ไฟล์ที่เกี่ยวข้อง:
- **[`components/navbar/HeaderNavbar.tsx`](file:///m:/project/dawh/components/navbar/HeaderNavbar.tsx#L152-L161)**

### สิ่งที่แก้ไข:
```tsx
// เดิม: มีการตรวจสอบค่า role จาก profile ของผู้ใช้
const isAdmin =
  profile.role?.toLowerCase() === "devops" ||
  profile.role?.toLowerCase() === "super_admin" ||
  profile.role?.toLowerCase() === "superadmin" ||
  profile.role?.toLowerCase() === "admin" ||
  profile.role?.toLowerCase().includes("devops") ||
  profile.role?.toLowerCase().includes("administrator") ||
  profile.role?.toLowerCase().includes("admin");

// ปัจจุบัน (ปิดชั่วคราว):
const isAdmin = true;
```

---

## 2. การปิดการตรวจสอบความสมบูรณ์ของโปรไฟล์ (Incomplete Profile Guards) — [เปิดใช้งานและ Refactor รองรับ Auth ใหม่]

ระบบตรวจสอบความสมบูรณ์ของโปรไฟล์ได้รับการ Refactor ให้ทำงานร่วมกับ Better Auth และตาราง `public.employee_profiles` บน PostgreSQL อย่างสมบูรณ์:
1. **เกณฑ์การตรวจสอบ (Completeness Rules)**:
   - ตรวจสอบฟิลด์ประวัติพนักงานจริงตามสกีมาใหม่ (ชื่อ-นามสกุลทั้งไทยและอังกฤษ, บัตรประชาชน, เบอร์โทรศัพท์, ที่อยู่, สาขา, ระดับการศึกษา)
   - ตรวจสอบ `profile_completed_at` หรือสถานะ `is_complete` จากฐานข้อมูล
   - **ยกเลิก Quick PIN 6 หลัก** ออกจากการคำนวณความสมบูรณ์ เนื่องจากระบบ Auth ใหม่ไม่รองรับ PIN แล้ว
2. **จุดควบคุม (Guards Enforced)**:
   - **Workspace Cards**: เมื่อคลิกเข้าสู่โมดูลงาน (Warehouse ERP, HP Datacenter) หากโปรไฟล์ไม่สมบูรณ์จะแสดง `ProfileGuardModal` พร้อมแจ้งเตือน Toast นำทางไปยัง `/settings`
   - **Header & Mobile Navbars**: ระงับการเปิดโมดูลงานหากข้อมูลไม่สมบูรณ์
   - **Module Layout Guard**: ป้องกันการเข้าถึงโมดูลตรงผ่าน URL (เช่น `/warehouse`) หากโปรไฟล์ไม่สมบูรณ์จะถูก Redirect กลับมายัง `/workspace?incomplete=true` เพื่อเปิด Guard Modal แจ้งเตือน

---

## 3. ระบบคู่ค้าและการจัดซื้อ (Suppliers & Procurement Portal) — [อยู่นอกขอบเขต MVP ตาม DESIGN.md]

ตามเอกสารสถาปัตยกรรม [`DESIGN.md`](file:///m:/project/dawh/DESIGN.md) ข้อ 2.2 ระบุชัดเจนว่า *"ระบบ Procurement และ Supplier Portal แบบครบวงจร ไม่อยู่ในขอบเขตเวอร์ชันแรก"* ของ Horizon WMS

1. **การปรับปรุงหน้าจอ CS:**
   - หน้า [`app/warehouse/suppliers/page.tsx`](file:///m:/project/dawh/app/warehouse/suppliers/page.tsx) ถูกปรับให้แสดงข้อความชี้แจงสถานะ **อยู่นอกขอบเขตเวอร์ชันแรก (Out-of-Scope MVP)** พร้อมปุ่มนำทางกลับสู่ภาพรวมคลังสินค้า และ Product Master
   - ไฟล์ต้นฉบับเดิมถูกสำรองไว้ที่ `app/warehouse/suppliers/LegacySuppliersView.bak.tsx` เพื่อนำกลับมาพัฒนาต่อยอดใน v2 (ระยะหลังจบ MVP)
2. **การปรับปรุง Sidebar Navigation:**
   - เพิ่ม Badge กำกับที่เมนู "ผู้ผลิต/คู่ค้า" ใน [`components/navbar/NavbarsubWarehouse.tsx`](file:///m:/project/dawh/components/navbar/NavbarsubWarehouse.tsx) เพื่อให้ผู้ใช้ทราบว่าเป็นฟีเจอร์สำหรับเวอร์ชันถัดไป

---

## 4. สถานะฟังก์ชัน (Feature Status Summary)

| ฟังก์ชัน / Guard | สถานะปัจจุบัน | ไฟล์ที่ควบคุม |
| :--- | :--- | :--- |
| **Admin Role Check** | ปิดชั่วคราว (Bypassed) | [`components/navbar/HeaderNavbar.tsx`](file:///m:/project/dawh/components/navbar/HeaderNavbar.tsx) (`const isAdmin = true;`) |
| **Incomplete Profile Guards** | **เปิดใช้งานปกติ (Active & Refactored for New Auth)** | [`lib/user-profile.ts`](file:///m:/project/dawh/lib/user-profile.ts), [`workspace.tsx`](file:///m:/project/dawh/components/users/workspace.tsx), [`HeaderNavbar.tsx`](file:///m:/project/dawh/components/navbar/HeaderNavbar.tsx), [`account.tsx`](file:///m:/project/dawh/components/users/account.tsx), [`WarehouseLayout.tsx`](file:///m:/project/dawh/app/warehouse/layout.tsx) |
| **Suppliers & Procurement Portal** | **อยู่นอกขอบเขต MVP (Out-of-Scope v1)** | [`app/warehouse/suppliers/page.tsx`](file:///m:/project/dawh/app/warehouse/suppliers/page.tsx), [`components/navbar/NavbarsubWarehouse.tsx`](file:///m:/project/dawh/components/navbar/NavbarsubWarehouse.tsx) |

