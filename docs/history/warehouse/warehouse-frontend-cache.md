# แผน cache ข้อมูลฝั่ง Warehouse FE

สถานะ: **ข้อเสนอสำหรับงาน FE; ยังไม่มี shared cache ตามแผนนี้ใน codebase**. เอกสารนี้ต่อยอดจาก performance audit และสัญญา Warehouse API ปัจจุบัน ไม่ใช่ผล benchmark.

## เป้าหมาย

- ลด request ซ้ำเมื่อหลาย component หรือหลายหน้าใช้ข้อมูลเดียวกัน
- ให้กลับเข้าหน้าและเปิดฟอร์มซ้ำได้โดยใช้ข้อมูลอ้างอิงที่ยังสด
- โหลดเฉพาะรายการของหน้า/แท็บ และข้อมูลอ้างอิงที่ต้องใช้ในฟอร์ม
- คงการตรวจ session, role และ branch scope ที่ server ทุก request
- ทำให้ข้อมูลที่แก้ไขแล้วไม่ค้างอยู่ใน cache

การจัดกลุ่มเมนูเพียงอย่างเดียวไม่ลด API; ผลมาจากการเลื่อนโหลดที่ไม่จำเป็น การใช้ผลลัพธ์ร่วมกัน และการรวม request ที่กำลังทำงานด้วย key เดียวกัน

## สถานะปัจจุบัน

- `hooks/useRemoteResource.ts` เก็บข้อมูลใน state ของ hook แต่ละ instance; ไม่มี cache ข้าม component.
- Hook ยกเลิก request ของ instance เมื่อเปลี่ยนงานหรือ unmount และกัน response เก่ามาเขียนทับ state.
- `lib/api/client.ts` ใช้ `cache: "no-store"` เป็นค่าเริ่มต้นสำหรับ fetch; การใช้ cache ที่เสนอจึงเป็น memory cache ฝั่ง client ไม่ใช่ browser HTTP cache.
- มีจุดที่โหลดตามการใช้งานแล้ว เช่น selector สินค้า, รายงานตามแท็บ และข้อมูลอ้างอิงบางฟอร์ม; งานต่อไปคือใช้กติกาเดียวกันและแชร์ผลลัพธ์ระหว่างจุดใช้งาน.
- BE รองรับ catalog lookup เช่น `/api/catalog/warehouses?lookup=1&q=...`, filter สำหรับเอกสาร และ detail แบบย่อ ดู contract ที่ [warehouse-backend.md](warehouse-backend.md#optional-reads-for-warehouse-forms).

## แบบ cache ที่เสนอ

เริ่มจาก helper กลางหรือ query cache ที่ repository ใช้อยู่แล้ว หากมี โดยให้เจ้าของข้อมูลเป็น query key ที่ deterministic และมีสถานะ `fresh`, `stale`, `loading` และ `error`. Cache ต้องรองรับทั้งข้อมูลพร้อมใช้และ Promise ที่กำลังทำงาน เพื่อให้ concurrent callers ใช้ request เดียวกัน.

### Query key และขอบเขต

ทุก key ต้องแยกตาม:

1. ผู้ใช้/บัญชีที่ login อยู่
2. role และ branch scope ที่ส่งผลต่อการมองเห็นข้อมูล
3. resource และรูปแบบผลลัพธ์
4. query params ที่มีผลต่อข้อมูล: search, filters, page/cursor, sort และ detail view

ให้ normalize query params ก่อนสร้าง key (เช่น trim search, เรียงชื่อ params) เพื่อให้คำขอที่มีความหมายเดียวกันแชร์ผลได้. ห้ามใช้ key เดียวกันระหว่างข้อมูล selector กับรายการแบ่งหน้า หรือระหว่างคนละ branch scope.

ตัวอย่างรูปแบบ key:

```text
warehouse:{accountScope}:catalog:warehouses:lookup:{branchId}:{normalizedQuery}
warehouse:{accountScope}:purchase-orders:list:{filters}:{cursor}
warehouse:{accountScope}:purchase-orders:detail:{poId}:lines
warehouse:{accountScope}:stock:balances:{filters}:{cursor}
```

`accountScope` เป็น cache namespace ภายใน client ที่เปลี่ยนเมื่อ identity หรือสิทธิ์เปลี่ยน; ห้ามนำ role/branch จาก client ไปใช้แทน authorization ฝั่ง server.

### แยก cache ตามชนิดข้อมูล

| ชนิดข้อมูล | ตัวอย่าง | พฤติกรรมที่เสนอ |
|---|---|---|
| Reference lookup | สาขา, คลัง, คู่ค้า, หน่วย, กลุ่ม, หมวด, ยี่ห้อ, รุ่น, CEO | โหลดเมื่อเปิดใช้/เมื่อ cache ไม่มีหรือหมดอายุ; แชร์ข้ามหน้าและฟอร์ม; ใช้ lookup endpoint สำหรับ selector |
| รายการหลัก | PO, ใบผู้ขาย, ใบขนส่ง, ใบตรวจรับ, issues, balances, ledger, reports | key ตาม filter และ cursor; โหลดเฉพาะหน้าหรือแท็บ active; refresh ตามการกลับเข้าใช้งานและ mutation |
| รายละเอียด | PO lines, carrier confirmation, รายละเอียดเอกสาร | โหลดเมื่อเลือกเอกสาร; reuse ข้ามขั้นตอนได้จน stale หรือมี mutation ที่เกี่ยวข้อง |
| ผลค้นหา | ProductSearchSelect และ catalog search | key ตาม query ที่ normalize; debounce ก่อนส่ง; รวม concurrent request ที่ query เดียวกัน |

อย่านำผล catalog แบบ paginated มาใช้เป็นตัวเลือกทั้งหมด. Selector ควรใช้ `lookup=1` และ `q`; API ปัจจุบันคืนได้สูงสุด 50 รายการ จึงต้องให้ค้นหาเพิ่มเมื่อรายการเกินขอบเขตนี้.

### Freshness และการหมดอายุ

กำหนด freshness ตามความเปลี่ยนแปลงของข้อมูล ไม่ใช้ TTL เดียวกับทุก resource:

- Reference data เปลี่ยนไม่บ่อย: ใช้ซ้ำระหว่างเปิดหน้า/ฟอร์ม แล้วกำหนดอายุเริ่มต้นที่สั้นพอให้เห็นการแก้ไขจากผู้ใช้อื่นได้; ปรับอายุจากการใช้งานจริง.
- รายการธุรกรรมและยอดสต๊อก: stale ได้เร็วกว่า reference; refresh เมื่อเปิดแท็บหรือกลับมา focus ตามนโยบายที่เลือก และ invalidate หลัง mutation ที่เกี่ยวข้อง.
- รายละเอียดเอกสาร: reuse ระหว่าง workflow; invalidate หลังแก้เอกสาร, ยืนยันรับ, บันทึกผลนับ, ลงสต๊อก หรือกลับรายการ.

ควรแสดงข้อมูล stale ได้ทันทีเมื่อเหมาะสม พร้อม revalidate เบื้องหลัง โดยไม่แสดงข้อมูลจาก namespace ของบัญชีก่อนหน้า. หากยังไม่ได้กำหนด freshness สำหรับ resource ใด ให้เริ่มจาก cache ระหว่าง navigation ของ session และวัดก่อนตั้ง TTL ยาว.

## จังหวะโหลดที่ควรใช้

### รับสินค้า

| หน้าหรือเหตุการณ์ | โหลด |
|---|---|
| เปิดแท็บ PO | รายการ PO |
| กดสร้าง PO | คู่ค้าและ CEO; reuse lookup ที่ยังสด |
| เปิดแท็บเอกสารผู้ขาย | รายการเอกสารผู้ขาย |
| กดสร้างเอกสารผู้ขาย | ค้นหา PO ที่ยังเปิด และโหลด PO lines แบบย่อเมื่อเลือก |
| เปิดแท็บขนส่ง | รายการใบขนส่ง |
| กดสร้างใบขนส่ง | ค้นหา PO; โหลดสาขาเมื่อเริ่มยืนยันรับ |
| เปิดแท็บนับ | รายการใบตรวจรับ |
| กดเริ่มนับ | ค้นหาใบขนส่งที่รับแล้วและยังไม่มีใบตรวจรับ; โหลดคลังที่เลือกได้ |

รายละเอียดที่มีอยู่แล้วใน cache ให้ใช้ซ้ำตาม key เดิม. หลีกเลี่ยงการเรียก full-detail endpoint หาก workflow ใช้เพียง `view=lines` หรือ `view=confirmation`.

### สต๊อกและข้อมูลหลัก

- Stock โหลด balances เมื่อเปิดแท็บยอด และ ledger เมื่อเปิดแท็บประวัติ; แชร์ lookup คลังกับ filter/ฟอร์ม.
- เปิดฟอร์มโอน/จ่าย/ปรับเมื่อผู้ใช้เริ่มทำรายการ แล้วใช้ lookup คลัง/สินค้า/ผู้ดำเนินการตามสิทธิ์.
- Product Master โหลดรายการหลักก่อน; โหลด selector/reference เมื่อเปิด filter หรือฟอร์มที่ต้องใช้.
- Catalog แต่ละ kind ยังคงโหลดเฉพาะ kind ที่เลือก; cache query แยกตาม kind, page, search และ filters.

## Invalidation หลัง mutation

Mutation ต้องอัปเดตค่าที่แน่ชัดจาก response หรือ invalidate เฉพาะ query ที่ขึ้นต่อกัน. ตัวอย่างขั้นต่ำ:

| Mutation | Cache ที่ต้องอัปเดต/หมดอายุ |
|---|---|
| เพิ่ม/แก้สาขาหรือคลัง | catalog list และ lookup ที่เกี่ยวข้อง; inventory/stock filters ตามผลกระทบ |
| เพิ่ม/แก้สินค้า | product list, product lookup/search และ summary ที่เกี่ยวข้อง |
| สร้าง/แก้ PO | PO lists, PO detail, selector PO ที่ยังเปิด, reports/overview ที่เกี่ยวข้อง |
| บันทึกใบผู้ขาย | supplier receipt list/detail และ PO detail |
| ยืนยันรับใบขนส่ง | carrier list/detail และ selector สำหรับเริ่มนับ |
| บันทึกผลนับ | goods receipt list/detail, carrier eligibility, PO detail และ issues ถ้ามี |
| ลงสต๊อก/กลับรายการ | balances, ledger, product stock summary, PO และ reports/overview ที่เกี่ยวข้อง |

หาก mutation ล้มเหลว ห้ามแก้ cache ให้ดูเหมือนบันทึกสำเร็จ. Optimistic update ใช้เฉพาะกรณี rollback ได้และผลลัพธ์คาดเดาแน่นอน; รอบแรกให้ invalidate หลัง response สำเร็จก่อน.

## Identity, error และ cancellation

- ล้าง cache ทั้งหมดและยกเลิก request ที่แชร์อยู่เมื่อ logout, เปลี่ยนบัญชี หรือสิทธิ์/branch scope เปลี่ยน.
- ห้ามเก็บข้อมูลธุรกรรมข้ามผู้ใช้ใน global/static cache หรือ persistent browser storage.
- Request ที่ล้มเหลวหรือถูกยกเลิกต้องไม่ถูกเก็บเป็นข้อมูลสำเร็จ; อนุญาต retry หลังผู้ใช้สั่งหรือเมื่อ revalidate.
- เมื่อรวม request ที่กำลังโหลด อย่าให้ component หนึ่ง unmount แล้ว abort request ที่ยังมี consumer อื่นใช้อยู่. ยกเลิกเมื่อไม่มี consumer เหลือ หรือใช้ cache layer ที่จัดการ subscriber lifecycle.
- Server ยังคงตรวจ session, role และ branch scope ทุกครั้ง; client cache เป็นเพียงการ reuse response ที่ได้รับอนุญาตแล้ว.

## ลำดับนำไปใช้

1. เพิ่ม shared cache/request dedup สำหรับ reference lookup; ย้ายจุดเรียกซ้ำที่ชัดเจน เช่น warehouses และ branches.
2. ปรับ Receive ให้แยกรายการออกจากฟอร์ม และโหลดข้อมูลของฟอร์มเมื่อเริ่มสร้าง/ทำขั้นตอนนั้น.
3. ทำ detail reuse และ cache ผลค้นหา product/PO/carrier ตาม query key.
4. ปรับ Stock ให้ใช้ lookup คลังร่วมและโหลดเฉพาะ active tab.
5. ต่อ invalidation ของ mutation แต่ละชนิด แล้วตรวจการเปลี่ยนบัญชีและสิทธิ์.
6. ค่อยพิจารณา cache หน้า list/report เพิ่มจากผลวัดจริง.

## การตรวจรับและการวัด

เปรียบเทียบ cold load กับ revisit ด้วย user/role/branch และข้อมูลชุดเดียวกัน โดยบันทึก request count, waterfall, เวลาเห็นรายการหลัก, response size และ `Server-Timing` ที่มีอยู่. ตรวจอย่างน้อย:

- หลาย component ขอ lookup key เดียวกันพร้อมกันแล้วมี network request เดียว.
- เปิด/ปิดฟอร์มซ้ำหรือกลับเข้าหน้าในช่วง freshness แล้วไม่มี lookup ซ้ำโดยไม่จำเป็น.
- การสลับ query, filter, page/cursor หรือ branch ได้ข้อมูลคนละ key อย่างถูกต้อง.
- รายการและรายละเอียดไม่ปนกับ lookup; pagination ยังครบ ไม่ใช้หน้าแรกเสมือนข้อมูลทั้งหมด.
- สลับแท็บแล้วโหลดเฉพาะข้อมูลของแท็บที่เปิด.
- Mutation สำเร็จแล้วข้อมูลที่เกี่ยวข้องอัปเดต; mutation ล้มเหลวไม่แสดงผลสำเร็จใน cache.
- Logout/login หรือเปลี่ยน role/branch แล้วไม่มีข้อมูลจาก identity เดิม.
- Request เก่าหรือถูกยกเลิกไม่เขียนทับผลลัพธ์ใหม่.

เป้าหมายเปิดดูรายการรับสินค้าครบ 4 แท็บโดยไม่เริ่มทำรายการคือประมาณ 4 list requests แทนการโหลด reference สำหรับฟอร์มด้วย แต่ตัวเลขจริงขึ้นกับจำนวน endpoints ของแต่ละแท็บและต้องยืนยันด้วย authenticated browser waterfall. Cache ไม่ลดเวลาของ request แรกที่ไม่มีข้อมูล และจำนวน request ที่ลดลงเพียงอย่างเดียวไม่ยืนยันว่าเวลาตอบ API หรือเวลาแสดงผลดีขึ้น.

## ผลตรวจ FE เพิ่มเติมจากโค้ดปัจจุบัน

รายการนี้เป็นจุดที่พบจากการอ่านโค้ด FE; ยังไม่ได้วัด request ใน browser. ให้ใช้เป็นงาน FE ต่อจากแผน cache ด้านบน.

### โหลดข้อมูลก่อนเปิดฟอร์ม

`ReceiveScreen` เปิดโหลด references เมื่อมีข้อมูลบัญชี (`enabled: !!account?.me`) โดยไม่ได้ผูกกับ `formOpen`. จึงโหลดคู่ค้าและ CEO ในขั้น PO, สาขาในขั้นขนส่ง หรือคลังในขั้นนับ แม้ผู้ใช้เพียงเปิดดูรายการ.

ปรับให้โหลด references เมื่อเปิดฟอร์มหรือเริ่มขั้นตอนที่ต้องใช้เท่านั้น และใช้ cache key แยกตาม resource กับ account scope. รักษาการโหลดเฉพาะ references ที่จำเป็นต่อขั้นปัจจุบัน.

### ลด request ที่เกิดจากการค้นหา

- ในแท็บ Ledger ของ `StockScreen` การพิมพ์แต่ละอักษรเปลี่ยน `search` และเริ่มโหลดรายการทันที. เพิ่ม debounce ก่อนเปลี่ยน query ที่ส่งให้ API เพื่อลด request ต่ออักษร.
- Product Master รีเซ็ตหน้าเป็น 1 ทันที แต่ใช้ `debouncedSearch` หลัง 250 ms. ถ้าผู้ใช้ค้นหาจากหน้าที่มากกว่า 1 อาจเกิด request หน้าที่ 1 ด้วยคำค้นเดิมก่อน request คำค้นใหม่. เปลี่ยน query ที่ใช้โหลดพร้อมกับการ reset หน้าในจังหวะเดียว.
- `ProductSearchSelect` เริ่มโหลดเมื่อช่องถูก activate แม้ query ยังว่าง และแต่ละ instance มี loader ของตัวเอง. ข้ามการค้นหาว่างเมื่อไม่จำเป็น และรวม request/ผลลัพธ์ตาม normalized query ผ่าน shared cache.

### ใช้รายละเอียดเอกสารซ้ำและเลี่ยงการรอแบบต่อกัน

ใน `CountForm` การเลือกใบขนส่งเรียก detail แล้วรอ PO detail ต่ออีกครั้ง. ฝั่ง FE ควรมี wrapper ที่รับ `view` ของ endpoint และใช้รูปแบบอ่านย่อที่มีอยู่แล้ว เช่น `view=confirmation` สำหรับใบขนส่ง และ `view=lines` สำหรับ PO. Cache รายละเอียดด้วย key ตามชนิดเอกสาร, ID, view และ account scope เพื่อ reuse ระหว่างขั้นตอน.

### เก็บข้อมูลของแท็บที่เคยเปิด

`ReportsScreen` ใช้ `key={tab}` ทำให้ `ReportList` ถูกสร้างใหม่เมื่อสลับแท็บ และรายการที่โหลดไว้หายไป. เก็บสถานะรายงานแยกตาม tab/query key เหนือ component ที่ remount หรือใช้ shared query cache เพื่อให้กลับแท็บเดิมได้โดยไม่เริ่ม request ซ้ำทันที.

### กรองทางเข้าตาม role ใน FE

`NavbarsubWarehouse` รับ `userRole` แต่ยังไม่ได้ใช้กรองเมนู. ปรับการแสดงเมนูและปุ่มตามสิทธิ์ที่ FE ทราบ เพื่อลดการนำผู้ใช้ไปหน้าที่จะตอบ 403 และทำให้ทางเข้าตรงกับงานที่ใช้ได้. การตรวจสิทธิ์ฝั่ง server ยังคงเป็นแหล่งตัดสินสุดท้าย.

### ลำดับแก้ FE ที่พบ

1. ผูกการโหลด Receive references กับการเริ่มทำรายการ.
2. ลด waterfall ใน CountForm และใช้ compact detail ผ่าน API wrapper.
3. Debounce Stock search และแก้จังหวะเปลี่ยน query/page ของ Product Master.
4. เพิ่ม shared cache/dedup สำหรับ product search และ detail.
5. เก็บ cache รายงานข้ามการสลับแท็บ และกรองเมนูตาม role.
