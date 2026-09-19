begin;

select pg_advisory_xact_lock(hashtext('dawh_development_p0_seed'));

do $$
begin
  if (select count(*) from public.organizations where code = 'HORIZON' and is_active) <> 1 then
    raise exception 'Development seed requires one active HORIZON organization';
  end if;
  if not exists (
    select 1
    from public."user" u
    join public.user_role_assignments a on a.user_id = u.id and a.revoked_at is null
    join public.roles r on r.id = a.role_id and r.code = 'SYSTEM_ADMINISTRATOR'
    left join public.user_access_controls c on c.user_id = u.id
    where coalesce(c.status, 'ACTIVE') = 'ACTIVE'
      and (a.valid_from is null or a.valid_from <= now())
      and (a.valid_until is null or a.valid_until > now())
  ) then
    raise exception 'Development seed requires an active SYSTEM_ADMINISTRATOR';
  end if;
end;
$$;

insert into public.facilities (organization_id, code, name, facility_type, province, is_active)
select o.id, v.code, v.name, v.facility_type, v.province, true
from public.organizations o
cross join (values
  ('BKK-01', 'Bangkok Branch', 'BRANCH', 'Bangkok'),
  ('CNX-01', 'Chiang Mai Branch', 'BRANCH', 'Chiang Mai')
) v(code, name, facility_type, province)
where o.code = 'HORIZON' and o.is_active
on conflict (organization_id, code) do update
set name = excluded.name, facility_type = excluded.facility_type,
    province = excluded.province, is_active = true;

insert into public.departments (organization_id, code, name, is_active)
select o.id, v.code, v.name, true
from public.organizations o
cross join (values
  ('IT', 'Information Technology'), ('WH', 'Warehouse'), ('OPS', 'Operations'),
  ('FIN', 'Finance'), ('HR', 'Human Resources')
) v(code, name)
where o.code = 'HORIZON' and o.is_active
on conflict (organization_id, code) do update set name = excluded.name, is_active = true;

insert into public.product_categories (organization_id, code, name, description, is_active)
select o.id, v.code, v.name, v.description, true
from public.organizations o
cross join (values
  ('ELECTRONICS', 'Electronics', 'Development electronics catalog'),
  ('FOOD', 'Food', 'Development food catalog'),
  ('OFFICE', 'Office Supplies', 'Development office catalog')
) v(code, name, description)
where o.code = 'HORIZON' and o.is_active
on conflict (organization_id, code) do update
set name = excluded.name, description = excluded.description, is_active = true;

insert into public.brands (organization_id, code, name, is_active)
select o.id, v.code, v.name, true
from public.organizations o
cross join (values ('DAWH', 'DAWH'), ('HORIZON', 'Horizon'), ('GENERIC', 'Generic')) v(code, name)
where o.code = 'HORIZON' and o.is_active
on conflict (organization_id, code) do update set name = excluded.name, is_active = true;

insert into public.warehouse_locations (
  facility_id, parent_id, code, name, hierarchy_type, location_type, path, depth,
  status, is_active
)
select f.id, null, v.code, v.name, 'ZONE', v.location_type,
       '/' || f.code || '/' || v.code, 0, 'ACTIVE', true
from public.facilities f
join public.organizations o on o.id = f.organization_id and o.code = 'HORIZON'
cross join (values
  ('RCV-01', 'Receiving Zone', 'RECEIVING'),
  ('STG-01', 'Storage Zone', 'STORAGE'),
  ('PCK-01', 'Picking Zone', 'PICKING'),
  ('PAK-01', 'Packing Zone', 'PACKING'),
  ('DSP-01', 'Dispatch Zone', 'DISPATCH'),
  ('QTN-01', 'Quarantine Zone', 'QUARANTINE'),
  ('DMG-01', 'Damaged Goods Zone', 'DAMAGED'),
  ('RTN-01', 'Return Zone', 'RETURN'),
  ('CLM-01', 'Claim Holding Zone', 'CLAIM_HOLDING')
) v(code, name, location_type)
where f.code in ('BKK-01', 'CNX-01')
on conflict (facility_id, code) do update
set name = excluded.name, hierarchy_type = excluded.hierarchy_type,
    location_type = excluded.location_type, path = excluded.path, depth = excluded.depth,
    status = 'ACTIVE', is_active = true;

insert into public.products (
  organization_id, sku, name_th, name_en, description, category_id, brand_id,
  base_unit_id, tracking_method, picking_strategy, standard_cost, currency_code,
  shelf_life_days, storage_condition, is_active
)
select o.id, v.sku, v.name_th, v.name_en, v.description, c.id, b.id, u.id,
       v.tracking_method, v.picking_strategy, v.standard_cost, 'THB',
       v.shelf_life_days, v.storage_condition, true
from public.organizations o
join public.units_of_measure u on u.organization_id = o.id and u.code = 'EA'
join (values
  ('DEMO-NONE-001', 'สินค้าทั่วไปตัวอย่าง', 'Demo General Item', 'No tracking demo', 'OFFICE', 'DAWH', 'NONE', 'FIFO', 25.00::numeric, null::integer, 'DRY'),
  ('DEMO-LOT-001', 'สินค้าแบบล็อตตัวอย่าง', 'Demo Lot Item', 'Lot and expiry demo', 'FOOD', 'HORIZON', 'LOT', 'FEFO', 45.00::numeric, 365, 'AMBIENT'),
  ('DEMO-SERIAL-001', 'สินค้าแบบซีเรียลตัวอย่าง', 'Demo Serial Item', 'Serial tracking demo', 'ELECTRONICS', 'GENERIC', 'SERIAL', 'FIFO', 990.00::numeric, null::integer, 'DRY')
) v(sku, name_th, name_en, description, category_code, brand_code, tracking_method, picking_strategy, standard_cost, shelf_life_days, storage_condition) on true
join public.product_categories c on c.organization_id = o.id and c.code = v.category_code
join public.brands b on b.organization_id = o.id and b.code = v.brand_code
where o.code = 'HORIZON' and o.is_active
on conflict (organization_id, sku) do update
set name_th = excluded.name_th, name_en = excluded.name_en, description = excluded.description,
    category_id = excluded.category_id, brand_id = excluded.brand_id,
    base_unit_id = excluded.base_unit_id, tracking_method = excluded.tracking_method,
    picking_strategy = excluded.picking_strategy, standard_cost = excluded.standard_cost,
    currency_code = excluded.currency_code, shelf_life_days = excluded.shelf_life_days,
    storage_condition = excluded.storage_condition, is_active = true;

insert into public.product_units (product_id, unit_id, base_quantity, is_active)
select p.id, u.id, v.base_quantity, true
from public.products p
join public.organizations o on o.id = p.organization_id and o.code = 'HORIZON'
join (values
  ('DEMO-NONE-001', 'BOX', 10.000000::numeric),
  ('DEMO-LOT-001', 'BOX', 20.000000::numeric),
  ('DEMO-SERIAL-001', 'PCS', 1.000000::numeric)
) v(sku, unit_code, base_quantity) on v.sku = p.sku
join public.units_of_measure u on u.organization_id = o.id and u.code = v.unit_code
on conflict (product_id, unit_id) do update
set base_quantity = excluded.base_quantity, is_active = true;

insert into public.product_barcodes (product_id, product_unit_id, barcode, barcode_type, is_primary)
select p.id, pu.id, v.barcode, 'INTERNAL', true
from public.products p
join public.organizations o on o.id = p.organization_id and o.code = 'HORIZON'
join (values
  ('DEMO-NONE-001', 'BOX', 'DAWH-DEMO-NONE-001'),
  ('DEMO-LOT-001', 'BOX', 'DAWH-DEMO-LOT-001'),
  ('DEMO-SERIAL-001', 'PCS', 'DAWH-DEMO-SERIAL-001')
) v(sku, unit_code, barcode) on v.sku = p.sku
join public.units_of_measure u on u.organization_id = o.id and u.code = v.unit_code
join public.product_units pu on pu.product_id = p.id and pu.unit_id = u.id
on conflict (barcode) do update
set product_id = excluded.product_id, product_unit_id = excluded.product_unit_id,
    barcode_type = excluded.barcode_type, is_primary = excluded.is_primary;

insert into public.lots (product_id, lot_number, manufactured_at, expiry_date, status)
select p.id, 'DEMO-LOT-2030', date '2029-01-01', date '2030-01-01', 'ACTIVE'
from public.products p
join public.organizations o on o.id = p.organization_id and o.code = 'HORIZON'
where p.sku = 'DEMO-LOT-001'
on conflict (product_id, lot_number) do update
set manufactured_at = excluded.manufactured_at, expiry_date = excluded.expiry_date,
    status = 'ACTIVE';

insert into public.serial_numbers (product_id, serial_number, status)
select p.id, v.serial_number, 'ACTIVE'
from public.products p
join public.organizations o on o.id = p.organization_id and o.code = 'HORIZON'
cross join (values ('DEMO-SERIAL-001-001'), ('DEMO-SERIAL-001-002'), ('DEMO-SERIAL-001-003')) v(serial_number)
where p.sku = 'DEMO-SERIAL-001'
on conflict (product_id, serial_number) do update set status = 'ACTIVE';

insert into public.safety_stock_rules (
  facility_id, product_id, minimum_quantity, maximum_quantity, reorder_point, safety_quantity
)
select f.id, p.id, 5.000000, 500.000000, 20.000000, 10.000000
from public.facilities f
join public.organizations o on o.id = f.organization_id and o.code = 'HORIZON'
join public.products p on p.organization_id = o.id
where f.code in ('HQ-01', 'BKK-01', 'CNX-01')
  and p.sku in ('DEMO-NONE-001', 'DEMO-LOT-001', 'DEMO-SERIAL-001')
on conflict (facility_id, product_id) do update
set minimum_quantity = excluded.minimum_quantity,
    maximum_quantity = excluded.maximum_quantity,
    reorder_point = excluded.reorder_point,
    safety_quantity = excluded.safety_quantity;

insert into public.inventory_transactions (
  transaction_no, organization_id, transaction_type, reference_type, reference_id,
  note, occurred_at, posted_by
)
select 'OPEN-DEV-P0-001', o.id, 'ADJUST', 'ORGANIZATION', o.id,
       'Deterministic P0 development opening stock', timestamptz '2026-09-19 00:00:00+07',
       admin_user.id
from public.organizations o
cross join lateral (
  select u.id
  from public."user" u
  join public.user_role_assignments a on a.user_id = u.id and a.revoked_at is null
  join public.roles r on r.id = a.role_id and r.code = 'SYSTEM_ADMINISTRATOR'
  left join public.user_access_controls c on c.user_id = u.id
  where coalesce(c.status, 'ACTIVE') = 'ACTIVE'
    and (a.valid_from is null or a.valid_from <= now())
    and (a.valid_until is null or a.valid_until > now())
  order by u.id limit 1
) admin_user
where o.code = 'HORIZON' and o.is_active
on conflict (transaction_no) do nothing;

with seed_grains as (
  select row_number() over (order by p.sku, f.code)::integer line_no,
         f.id facility_id, l.id location_id, p.id product_id,
         case when p.sku = 'DEMO-LOT-001' then lot.id end lot_id,
         case when p.sku = 'DEMO-SERIAL-001' then sn.id end serial_id,
         case
           when p.sku = 'DEMO-NONE-001' and f.code = 'HQ-01' then 100.000000
           when p.sku = 'DEMO-NONE-001' and f.code = 'BKK-01' then 80.000000
           when p.sku = 'DEMO-NONE-001' then 60.000000
           when p.sku = 'DEMO-LOT-001' then 50.000000
           else 1.000000
         end::numeric quantity
  from public.organizations o
  join public.facilities f on f.organization_id = o.id and f.code in ('HQ-01', 'BKK-01', 'CNX-01')
  join public.warehouse_locations l on l.facility_id = f.id and l.code = 'STG-01'
  join public.products p on p.organization_id = o.id and p.sku in ('DEMO-NONE-001', 'DEMO-LOT-001', 'DEMO-SERIAL-001')
  left join public.lots lot on lot.product_id = p.id and lot.lot_number = 'DEMO-LOT-2030'
  left join public.serial_numbers sn on sn.product_id = p.id and sn.serial_number =
    case f.code when 'HQ-01' then 'DEMO-SERIAL-001-001' when 'BKK-01' then 'DEMO-SERIAL-001-002' else 'DEMO-SERIAL-001-003' end
  where o.code = 'HORIZON' and o.is_active
)
insert into public.inventory_transaction_lines (
  transaction_id, line_no, facility_id, location_id, product_id, lot_id, serial_id,
  stock_status, quantity_before, quantity_delta, quantity_after, posted_at
)
select t.id, g.line_no, g.facility_id, g.location_id, g.product_id, g.lot_id, g.serial_id,
       'AVAILABLE', 0, g.quantity, g.quantity, t.posted_at
from seed_grains g
join public.inventory_transactions t on t.transaction_no = 'OPEN-DEV-P0-001'
on conflict (transaction_id, line_no) do nothing;

with seed_grains as (
  select f.id facility_id, l.id location_id, p.id product_id,
         case when p.sku = 'DEMO-LOT-001' then lot.id end lot_id,
         case when p.sku = 'DEMO-SERIAL-001' then sn.id end serial_id,
         case
           when p.sku = 'DEMO-NONE-001' and f.code = 'HQ-01' then 100.000000
           when p.sku = 'DEMO-NONE-001' and f.code = 'BKK-01' then 80.000000
           when p.sku = 'DEMO-NONE-001' then 60.000000
           when p.sku = 'DEMO-LOT-001' then 50.000000
           else 1.000000
         end::numeric quantity
  from public.organizations o
  join public.facilities f on f.organization_id = o.id and f.code in ('HQ-01', 'BKK-01', 'CNX-01')
  join public.warehouse_locations l on l.facility_id = f.id and l.code = 'STG-01'
  join public.products p on p.organization_id = o.id and p.sku in ('DEMO-NONE-001', 'DEMO-LOT-001', 'DEMO-SERIAL-001')
  left join public.lots lot on lot.product_id = p.id and lot.lot_number = 'DEMO-LOT-2030'
  left join public.serial_numbers sn on sn.product_id = p.id and sn.serial_number =
    case f.code when 'HQ-01' then 'DEMO-SERIAL-001-001' when 'BKK-01' then 'DEMO-SERIAL-001-002' else 'DEMO-SERIAL-001-003' end
  where o.code = 'HORIZON' and o.is_active
)
insert into public.stock_balances (
  facility_id, location_id, product_id, lot_id, serial_id, shipment_id,
  stock_status, quantity
)
select facility_id, location_id, product_id, lot_id, serial_id, null, 'AVAILABLE', quantity
from seed_grains
on conflict (facility_id, location_id, shipment_id, product_id, lot_id, serial_id, stock_status)
do update set quantity = excluded.quantity, version = public.stock_balances.version + 1,
              updated_at = now();

do $$
begin
  if exists (
    select 1 from public.inventory_transaction_lines
    where quantity_before + quantity_delta <> quantity_after
  ) then
    raise exception 'Opening ledger arithmetic mismatch';
  end if;
end;
$$;

commit;
