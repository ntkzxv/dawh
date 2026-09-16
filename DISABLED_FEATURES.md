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

## 2. การปิดการตรวจสอบความสมบูรณ์ของโปรไฟล์ (Incomplete Profile Guards)

### วัตถุประสงค์ที่ปิด:
เพื่อไม่ให้ผู้ใช้ถูกบล็อกการเปิดหน้าต่าง ๆ เช่น โมดูลงาน (Datacenter, Warehouse ฯลฯ) รวมถึงไม่ให้มีป็อปอัปแจ้งเตือนสีเหลืองเตือนข้อมูลไม่ครบ และไม่แสดงแบนเนอร์แจ้งเตือนให้กรอกข้อมูลรอบสองในหน้าตั้งค่า

### ไฟล์ที่เกี่ยวข้องและสิ่งที่แก้ไข:

#### 2.1. [`utils/auth.ts`](file:///m:/project/dawh/utils/auth.ts#L399-L408)
- **ฟังก์ชัน**: `checkProfileCompleteness(profile)`
- **การเปลี่ยนแปลง**: กำหนดให้คืนค่า `isComplete: true` และ `missingFields: []` ทันทีเสมอ
```tsx
export function checkProfileCompleteness(profile: Partial<EmployeeProfile> | null | undefined): {
  isComplete: boolean;
  missingFields: string[];
} {
  // [BYPASS TEMPORARILY] ปิดการตรวจสอบ incomplete profile ชั่วคราวเพื่อให้เข้าใช้งานระบบได้ทันที
  return {
    isComplete: true,
    missingFields: [],
  };
  ...
}
```

#### 2.2. [`components/navbar/HeaderNavbar.tsx`](file:///m:/project/dawh/components/navbar/HeaderNavbar.tsx#L241-L255)
- **ฟังก์ชัน**: `handleGuardedNavigate`
- **การเปลี่ยนแปลง**: คอมเมนต์เงื่อนไขที่ตรวจ `!isComplete` ออก ทำให้สามารถคลิกเปิดหน้าโมดูลต่าง ๆ ในระบบได้ทันทีโดยไม่ติด `ProfileGuardModal` (Modal ที่เคยบล็อกไม่ให้ออกไปหน้าอื่นจนกว่าจะกรอกข้อมูลครบ)
```tsx
const handleGuardedNavigate = (target: string, fallbackPath?: string) => {
  // [DISABLED TEMPORARILY] ปิดการบล็อก incomplete profile ชั่วคราวเพื่อให้เข้าถึงทุกโมดูลได้อิสระ
  /*
  if (!isComplete && target !== "settings" && target !== "account" && target !== "auth" && target !== "workspace" && target !== "portal") {
    setShowGuardModal(true);
    notify.warning(...);
    return;
  }
  */
  ...
};
```

#### 2.3. [`components/users/account.tsx`](file:///m:/project/dawh/components/users/account.tsx#L1868)
- **ตัวแปร**: `isProfileIncomplete`
- **การเปลี่ยนแปลง**: กำหนดค่าเป็น `false` เพื่อ:
  1. ไม่แสดงการแจ้งเตือนเตือนสีเหลืองมุมขวาล่าง (`Complete Profile Information / ข้อมูลประวัติยังไม่สมบูรณ์`)
  2. ไม่แสดงแบนเนอร์สีขาวด้านบนในหน้า Account (`ข้อมูลโปรไฟล์ของคุณยังไม่ครบถ้วน (กรอกข้อมูลรอบสอง)`)
```tsx
// [DISABLED TEMPORARILY] ปิดแจ้งเตือนและแบนเนอร์ incomplete profile ชั่วคราว
const isProfileIncomplete = false;
// const isProfileIncomplete = missingFields.length > 0;
```

---

## 3. วิธีเปิดการทำงานกลับมา (How to Re-enable)

หากต้องการเปิดระบบตรวจสอบสิทธิ์และบล็อกโปรไฟล์ไม่สมบูรณ์กลับคืนมา:

1. **เปิด Admin Role Check**:
   - ใน `components/navbar/HeaderNavbar.tsx` ลบ `const isAdmin = true;` แล้วนำโค้ดที่คอมเมนต์ไว้กลับมา
2. **เปิด Incomplete Profile Check**:
   - ใน `utils/auth.ts` ลบ `return { isComplete: true, missingFields: [] };` และปลดบล็อกโค้ดในฟังก์ชัน `checkProfileCompleteness`
   - ใน `components/navbar/HeaderNavbar.tsx` ปลดคอมเมนต์ใน `handleGuardedNavigate`
   - ใน `components/users/account.tsx` เปลี่ยน `const isProfileIncomplete = false;` กลับเป็น `missingFields.length > 0;`
