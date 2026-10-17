-- Add categories and brands to the 20 products from seed_mock_warehouse.sql.
-- Safe to rerun: brands are unique by name, categories are checked by group/name,
-- and product attributes are updated by SKU.

BEGIN;

INSERT INTO app.product_categories (group_id, name)
SELECT g.id, v.category_name
FROM (VALUES
  ('อุปกรณ์สำนักงาน', 'กระดาษและเครื่องเขียน'),
  ('อุปกรณ์สำนักงาน', 'แฟ้มและอุปกรณ์จัดเก็บ'),
  ('อุปกรณ์สำนักงาน', 'อุปกรณ์สำนักงานทั่วไป'),
  ('อุปกรณ์คอมพิวเตอร์', 'อุปกรณ์ต่อพ่วง'),
  ('อุปกรณ์คอมพิวเตอร์', 'จอภาพและอุปกรณ์จัดเก็บข้อมูล'),
  ('อุปกรณ์ไฟฟ้า', 'ปลั๊กและอุปกรณ์เชื่อมต่อ'),
  ('อุปกรณ์ไฟฟ้า', 'หลอดไฟและถ่าน'),
  ('วัสดุบรรจุภัณฑ์', 'กล่องและซองพัสดุ'),
  ('วัสดุบรรจุภัณฑ์', 'วัสดุกันกระแทก'),
  ('เครื่องมือช่าง', 'เครื่องมือช่างมือ')
) AS v(group_name, category_name)
JOIN app.product_groups AS g ON g.name = v.group_name
WHERE NOT EXISTS (
  SELECT 1
  FROM app.product_categories AS c
  WHERE c.group_id = g.id
    AND c.name = v.category_name
);

INSERT INTO app.brands (name)
VALUES
  ('DAWH Office'),
  ('Logitech'),
  ('ViewSonic'),
  ('Anker'),
  ('Philips'),
  ('Panasonic'),
  ('PackPro'),
  ('ToolMate')
ON CONFLICT (name) DO NOTHING;

WITH product_attributes (sku, category_name, brand_name) AS (
  VALUES
    ('OFF-001', 'กระดาษและเครื่องเขียน', 'DAWH Office'),
    ('OFF-002', 'กระดาษและเครื่องเขียน', 'DAWH Office'),
    ('OFF-003', 'แฟ้มและอุปกรณ์จัดเก็บ', 'DAWH Office'),
    ('OFF-004', 'อุปกรณ์สำนักงานทั่วไป', 'DAWH Office'),
    ('OFF-005', 'อุปกรณ์สำนักงานทั่วไป', 'DAWH Office'),
    ('IT-001', 'อุปกรณ์ต่อพ่วง', 'Logitech'),
    ('IT-002', 'อุปกรณ์ต่อพ่วง', 'Logitech'),
    ('IT-003', 'จอภาพและอุปกรณ์จัดเก็บข้อมูล', 'ViewSonic'),
    ('IT-004', 'อุปกรณ์ต่อพ่วง', 'Anker'),
    ('IT-005', 'จอภาพและอุปกรณ์จัดเก็บข้อมูล', 'Anker'),
    ('EL-001', 'ปลั๊กและอุปกรณ์เชื่อมต่อ', 'Panasonic'),
    ('EL-002', 'หลอดไฟและถ่าน', 'Philips'),
    ('EL-003', 'หลอดไฟและถ่าน', 'Panasonic'),
    ('EL-004', 'ปลั๊กและอุปกรณ์เชื่อมต่อ', 'Anker'),
    ('PK-001', 'กล่องและซองพัสดุ', 'PackPro'),
    ('PK-002', 'กล่องและซองพัสดุ', 'PackPro'),
    ('PK-003', 'วัสดุกันกระแทก', 'PackPro'),
    ('PK-004', 'กล่องและซองพัสดุ', 'PackPro'),
    ('TL-001', 'เครื่องมือช่างมือ', 'ToolMate'),
    ('TL-002', 'เครื่องมือช่างมือ', 'ToolMate')
)
UPDATE app.products AS p
SET category_id = c.id,
    brand_id = b.id
FROM product_attributes AS a
JOIN app.product_categories AS c ON c.name = a.category_name
JOIN app.product_groups AS g ON g.id = c.group_id
JOIN app.products AS matched_product ON matched_product.sku = a.sku
  AND matched_product.group_id = g.id
JOIN app.brands AS b ON b.name = a.brand_name
WHERE p.id = matched_product.id;

COMMIT;
