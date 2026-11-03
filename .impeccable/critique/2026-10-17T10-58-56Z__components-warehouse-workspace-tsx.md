---
target: Workspace hub
total_score: 23
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
target_identity: "file:M:\\project\\dawh\\components\\warehouse\\Workspace.tsx"
target_fingerprint: "sha256:0fb0e3745fe8e29260a70f1a21f6d3c578c2f005bbe34b29d3691633bb7835b7"
target_path: "M:\\project\\dawh\\components\\warehouse\\Workspace.tsx"
timestamp: 2026-10-17T10-58-56Z
slug: components-warehouse-workspace-tsx
---
Method: dual-agent (A: /root/assessment_a · B: /root/assessment_b)

# Design Health Score

ประเมินหน้า Workspace สำหรับผู้ใช้ที่ลงชื่อเข้าใช้ จาก components/warehouse/Workspace.tsx คะแนน 23/40 หรือ 57.5% อยู่ในระดับ Acceptable.

| # | Heuristic | คะแนน | ประเด็นหลัก |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | แสดง Active, Maintenance และ Locked แต่ไม่บอก workspace ล่าสุดหรือที่ใช้เป็นค่าเริ่มต้น |
| 2 | Match System / Real World | 2 | “HP Datacenter” ต้องมีความรู้เดิม และความสัมพันธ์กับ Horizon WMS ยังไม่ชัด |
| 3 | User Control and Freedom | 3 | เข้าโมดูลที่เปิดได้ง่าย แต่ไม่มีทางลัดกลับไปทำงานล่าสุด |
| 4 | Consistency and Standards | 2 | สองโมดูลแรกเป็นการ์ดสูง อีกสองโมดูลเป็นแถวเตี้ย และลิงก์ครอบปุ่ม |
| 5 | Error Prevention | 2 | Maintenance CTA ดูเหมือนใช้งานได้ แต่กดแล้วไม่เกิดผล |
| 6 | Recognition Rather Than Recall | 3 | มีชื่อ คำอธิบาย และสถานะ แต่บางชื่อยังต้องตีความ |
| 7 | Flexibility and Efficiency | 2 | ไม่มี recent/default workspace สำหรับผู้ใช้ประจำ |
| 8 | Aesthetic and Minimalist Design | 3 | แบรนด์และลำดับชั้นสอดคล้องกัน แต่การ์ดสูง 390px ใช้พื้นที่มาก |
| 9 | Error Recovery | 2 | มีพื้นที่แสดง error แต่ไม่มีคำแนะนำแก้ปัญหาหรือกลับไปทำงานต่อ |
| 10 | Help and Documentation | 1 | ไม่มีคำอธิบายการเข้าถึงโมดูลหรือเหตุผลที่ปิดใช้งาน |
| **รวม** |  | **23/40** | **Acceptable — ควรแก้ interaction และความชัดเจนก่อน** |

# Design Specificity Verdict

แบรนด์ DAWH, ชื่อ Horizon และข้อความไทย/อังกฤษให้เอกลักษณ์บางส่วน แต่การ์ดสี่ใบ ไอคอนทั่วไป และหัวข้อ “เลือกพื้นที่ทำงาน” ยังใช้กับ enterprise portal อื่นได้ อีกทั้งเอกสารผลิตภัณฑ์พูดถึง Horizon WMS ขณะที่ hub นำเสนอ Hire-Purchase, รายงาน, payment gateway และ CRM โดยไม่อธิบายความสัมพันธ์

**Detector:** สแกน components/warehouse/Workspace.tsx สำเร็จและคืน [] (0 findings) ไม่มี rule/location ปัญหา semantics และพฤติกรรมที่พบจากโค้ดยังเป็นข้อสังเกตจากการประเมินด้วยคน

**ภาพหน้าเว็บ:** เปิด http://localhost:3000/workspace ไม่สำเร็จ (ERR_CONNECTION_TIMED_OUT) จึงไม่มีภาพยืนยันและไม่ได้ฉีด overlay ข้อสรุปอิงโค้ด/เอกสาร และยังยืนยัน responsive behavior, contrast และ focus order ด้วยภาพจริงไม่ได้

# Overall Impression

หน้าเป็นจุดเริ่มต้นที่เรียบและมีแบรนด์ แต่ Maintenance ที่ดูคลิกได้และปุ่มซ้อนในลิงก์ลดความน่าเชื่อถือ โอกาสหลักคือทำสถานะ/ปลายทางให้ชัดและจัดรูปแบบโมดูลให้สม่ำเสมอ

# What's Working

- มีชื่อและคำอธิบายทั้งไทยและอังกฤษ พร้อมชื่อ/บทบาทบัญชีผู้ใช้
- สถานะมีข้อความกำกับ ไม่ได้สื่อด้วยสีอย่างเดียว
- รองรับ prefers-reduced-motion

# Priority Issues

1. **[P1] CTA Maintenance ดูเหมือนกดได้แต่ไม่ทำงาน** — แถว Maintenance เป็น div แต่ CTA ยังเป็นปุ่มที่ focus และ activate ได้ ควรเปลี่ยนเป็นข้อความสถานะ หรือ disable พร้อมอธิบายเหตุผล **คำสั่งแนะนำ:** $impeccable harden

2. **[P1] ปุ่มซ้อนในลิงก์ของโมดูล Active** — Link ครอบ ActionButton ที่เป็น button ทำให้ semantics และ focus สับสน ควรเหลือ interactive element เดียว **คำสั่งแนะนำ:** $impeccable audit

3. **[P2] ชื่อและขอบเขตโมดูลไม่ชัด** — “HP Datacenter” ไม่บอกผู้ใช้ใหม่ว่าคืออะไร และความสัมพันธ์กับ WMS/payment gateway/CRM ไม่ปรากฏ เพิ่มคำอธิบายหน้าที่และความสัมพันธ์ของแต่ละโมดูล **คำสั่งแนะนำ:** $impeccable clarify

4. **[P2] การ์ดมีน้ำหนักและขนาดไม่เท่ากัน** — โมดูล Active สูงขั้นต่ำ 390px ส่วน Maintenance/Locked เป็นแถวเตี้ย ใช้ระบบการ์ดหรือแถวเดียวกันและจัดลำดับตามบทบาท/การใช้งาน **คำสั่งแนะนำ:** $impeccable layout

5. **[P2] Focus ring อาจกลืนในธีมสว่าง** — focus-visible:ring-white/40 เป็นสีคงที่ ควรปรับตามธีมและให้เห็นชัด **คำสั่งแนะนำ:** $impeccable audit

# Cognitive Load

ไม่ผ่าน 2 ข้อ ระดับปานกลาง: ลวดลายพื้นหลัง/ปุ่มบัญชีแข่งขันกับการเลือกโมดูล และการ์ดสูงสองใบเด่นกว่าสองโมดูลที่ย่อเป็นแถว ผ่านด้านจำนวนตัวเลือก (4) และการจัดกลุ่มข้อมูล การประเมินนี้อิงโค้ดเพราะเปิดหน้าเว็บไม่ได้

# Emotional Journey

ผู้ใช้เห็นแบรนด์และสองโมดูล Active ได้เร็ว แต่ความมั่นใจลดลงเมื่อ Maintenance กดแล้วไม่เกิดผล หรือชื่อ/คำอธิบายไม่สื่อว่างานนั้นเกี่ยวกับผู้ใช้อย่างไร

# Persona Red Flags

- **Alex (Power User):** ไม่มีทางลัดไป workspace ล่าสุดหรือหลัก ต้องไล่ดูรายการทุกครั้ง
- **Sam (ผู้ใช้คีย์บอร์ด/โปรแกรมอ่านหน้าจอ):** ลิงก์ครอบปุ่มอาจทำให้ focus/announcement สับสน; focus ring สีขาวอาจมองยากในธีมสว่าง; Maintenance CTA ยังรับ focus แม้ไม่ทำงาน

AGENTS.md ไม่มีส่วน ## Design Context จึงไม่มี persona เฉพาะโครงการเพิ่ม

# Minor Observations

- คำอธิบายของแถวแนวนอนถูกตัดเหลือบรรทัดเดียว
- ไม่มี ETA ปิดปรับปรุงหรือวิธีขอสิทธิ์โมดูล Locked
- การ์ดสูงขั้นต่ำ 390px ควรตรวจบนหน้าจอเตี้ย/มือถือ

# Questions to Consider

- Hub ควรพาไป workspace ล่าสุดหรือที่เหมาะกับบทบาทหรือไม่?
- ข้อมูลอะไรจะอธิบายความสัมพันธ์ของ Horizon WMS กับ Hire-Purchase?
- Maintenance/Locked ควรบอก ETA หรือวิธีขอสิทธิ์อย่างไร?
