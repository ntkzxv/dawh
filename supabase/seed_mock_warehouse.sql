-- Mock data for the warehouse master-data screens.
-- Safe to run more than once: branches, warehouses, units, groups and products
-- are matched by their unique business codes/names and updated in place.
-- This script does not create inventory balances or transaction history.

BEGIN;

INSERT INTO app.branches (code, name, address, active)
VALUES
  ('BR-BKK-01', 'สาขากรุงเทพฯ', 'เขตบางนา กรุงเทพมหานคร', true),
  ('BR-CNX-01', 'สาขาเชียงใหม่', 'อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่', true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    address = EXCLUDED.address,
    active = EXCLUDED.active;

INSERT INTO app.warehouses (branch_id, code, name, active)
SELECT b.id, v.code, v.name, true
FROM (VALUES
  ('BR-BKK-01', 'WH-BKK-MAIN', 'คลังหลักกรุงเทพฯ'),
  ('BR-CNX-01', 'WH-CNX-MAIN', 'คลังหลักเชียงใหม่')
) AS v(branch_code, code, name)
JOIN app.branches AS b ON b.code = v.branch_code
ON CONFLICT (branch_id, code) DO UPDATE
SET name = EXCLUDED.name,
    active = EXCLUDED.active;

INSERT INTO app.units (code, name)
VALUES
  ('PCS', 'ชิ้น'),
  ('BOX', 'กล่อง'),
  ('SET', 'ชุด'),
  ('ROLL', 'ม้วน'),
  ('REAM', 'รีม')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO app.product_groups (name)
VALUES
  ('อุปกรณ์สำนักงาน'),
  ('อุปกรณ์คอมพิวเตอร์'),
  ('อุปกรณ์ไฟฟ้า'),
  ('วัสดุบรรจุภัณฑ์'),
  ('เครื่องมือช่าง')
ON CONFLICT (name) DO NOTHING;

INSERT INTO app.products
  (sku, name, group_id, unit_id, serial_tracked, cost, sale_price, reorder_point, active)
SELECT
  v.sku,
  v.name,
  g.id,
  u.id,
  v.serial_tracked,
  v.cost,
  v.sale_price,
  v.reorder_point,
  true
FROM (VALUES
  ('OFF-001', 'กระดาษถ่ายเอกสาร A4 80 แกรม', 'อุปกรณ์สำนักงาน', 'REAM', false, 105.00, 139.00, 10.000),
  ('OFF-002', 'ปากกาลูกลื่นสีน้ำเงิน', 'อุปกรณ์สำนักงาน', 'BOX', false, 72.00, 99.00, 5.000),
  ('OFF-003', 'แฟ้มเอกสารสันกว้าง', 'อุปกรณ์สำนักงาน', 'PCS', false, 28.00, 39.00, 10.000),
  ('OFF-004', 'เทปใส 1 นิ้ว', 'อุปกรณ์สำนักงาน', 'ROLL', false, 12.00, 18.00, 12.000),
  ('OFF-005', 'กรรไกรสแตนเลส 8 นิ้ว', 'อุปกรณ์สำนักงาน', 'PCS', false, 35.00, 49.00, 5.000),
  ('IT-001', 'เมาส์ USB แบบมีสาย', 'อุปกรณ์คอมพิวเตอร์', 'PCS', false, 120.00, 189.00, 5.000),
  ('IT-002', 'คีย์บอร์ด USB ภาษาไทย', 'อุปกรณ์คอมพิวเตอร์', 'PCS', false, 220.00, 329.00, 5.000),
  ('IT-003', 'จอภาพ LED 24 นิ้ว', 'อุปกรณ์คอมพิวเตอร์', 'PCS', true, 2850.00, 3490.00, 2.000),
  ('IT-004', 'สาย HDMI 2 เมตร', 'อุปกรณ์คอมพิวเตอร์', 'PCS', false, 95.00, 159.00, 5.000),
  ('IT-005', 'External SSD 1TB', 'อุปกรณ์คอมพิวเตอร์', 'PCS', true, 2450.00, 2990.00, 2.000),
  ('EL-001', 'ปลั๊กพ่วง 4 ช่อง 3 เมตร', 'อุปกรณ์ไฟฟ้า', 'PCS', false, 260.00, 359.00, 3.000),
  ('EL-002', 'หลอดไฟ LED 9 วัตต์', 'อุปกรณ์ไฟฟ้า', 'BOX', false, 240.00, 320.00, 4.000),
  ('EL-003', 'ถ่านอัลคาไลน์ AA', 'อุปกรณ์ไฟฟ้า', 'BOX', false, 88.00, 125.00, 5.000),
  ('EL-004', 'อะแดปเตอร์ USB-C 65 วัตต์', 'อุปกรณ์ไฟฟ้า', 'PCS', false, 590.00, 790.00, 2.000),
  ('PK-001', 'กล่องพัสดุไซซ์ S', 'วัสดุบรรจุภัณฑ์', 'PCS', false, 6.50, 10.00, 30.000),
  ('PK-002', 'กล่องพัสดุไซซ์ M', 'วัสดุบรรจุภัณฑ์', 'PCS', false, 9.50, 15.00, 30.000),
  ('PK-003', 'บับเบิลกันกระแทก 65 ซม.', 'วัสดุบรรจุภัณฑ์', 'ROLL', false, 85.00, 120.00, 5.000),
  ('PK-004', 'ซองเอกสารพลาสติก', 'วัสดุบรรจุภัณฑ์', 'BOX', false, 110.00, 159.00, 3.000),
  ('TL-001', 'ไขควงชุด 6 ชิ้น', 'เครื่องมือช่าง', 'SET', false, 145.00, 220.00, 2.000),
  ('TL-002', 'คีมปากจิ้งจก 8 นิ้ว', 'เครื่องมือช่าง', 'PCS', false, 125.00, 189.00, 2.000)
) AS v(sku, name, group_name, unit_code, serial_tracked, cost, sale_price, reorder_point)
JOIN app.product_groups AS g ON g.name = v.group_name
JOIN app.units AS u ON u.code = v.unit_code
ON CONFLICT (sku) DO UPDATE
SET name = EXCLUDED.name,
    group_id = EXCLUDED.group_id,
    unit_id = EXCLUDED.unit_id,
    serial_tracked = EXCLUDED.serial_tracked,
    cost = EXCLUDED.cost,
    sale_price = EXCLUDED.sale_price,
    reorder_point = EXCLUDED.reorder_point,
    active = EXCLUDED.active;

COMMIT;
