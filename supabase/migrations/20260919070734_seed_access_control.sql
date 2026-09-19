-- Production-minimum master data for a fresh Horizon WMS database.
-- This migration is intentionally idempotent and does not create users,
-- products, opening stock, or operational documents.

BEGIN;

SELECT pg_advisory_xact_lock(hashtext('horizon_wms_production_minimum_seed'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE is_active = true
      AND code <> 'HORIZON'
  ) THEN
    RAISE EXCEPTION
      'Cannot seed HORIZON: another active organization already exists.';
  END IF;
END;
$$;

INSERT INTO public.organizations (id, code, name, timezone, is_active)
VALUES (gen_random_uuid(), 'HORIZON', 'Horizon Logistics', 'Asia/Bangkok', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  timezone = EXCLUDED.timezone,
  is_active = true,
  updated_at = now();

INSERT INTO public.permissions (id, code, module, description)
VALUES
  (gen_random_uuid(), 'admin.users.read', 'admin', 'View users'),
  (gen_random_uuid(), 'admin.users.manage', 'admin', 'Manage users'),
  (gen_random_uuid(), 'admin.roles.read', 'admin', 'View roles and permissions'),
  (gen_random_uuid(), 'admin.roles.manage', 'admin', 'Manage roles and assignments'),
  (gen_random_uuid(), 'admin.facilities.read', 'admin', 'View every facility'),
  (gen_random_uuid(), 'admin.facilities.manage', 'admin', 'Manage facilities'),
  (gen_random_uuid(), 'admin.products.read', 'admin', 'View product administration'),
  (gen_random_uuid(), 'admin.products.manage', 'admin', 'Manage product master data'),
  (gen_random_uuid(), 'admin.reason_codes.manage', 'admin', 'Manage reason codes'),
  (gen_random_uuid(), 'product.read', 'product', 'View product master data'),
  (gen_random_uuid(), 'stock.read', 'stock', 'View stock balances'),
  (gen_random_uuid(), 'stock.ledger.read', 'stock', 'View stock ledger'),
  (gen_random_uuid(), 'stock.receive', 'stock', 'Receive stock'),
  (gen_random_uuid(), 'stock.putaway', 'stock', 'Put stock away'),
  (gen_random_uuid(), 'stock.move', 'stock', 'Move stock'),
  (gen_random_uuid(), 'stock.adjust.request', 'stock', 'Request stock adjustment'),
  (gen_random_uuid(), 'stock.adjust.approve', 'stock', 'Approve stock adjustment'),
  (gen_random_uuid(), 'stock.count', 'stock', 'Perform stock count'),
  (gen_random_uuid(), 'transfer.read', 'transfer', 'View transfers'),
  (gen_random_uuid(), 'transfer.create', 'transfer', 'Create transfers'),
  (gen_random_uuid(), 'transfer.approve', 'transfer', 'Approve transfers'),
  (gen_random_uuid(), 'transfer.dispatch', 'transfer', 'Dispatch transfers'),
  (gen_random_uuid(), 'transfer.receive', 'transfer', 'Receive transfers'),
  (gen_random_uuid(), 'pick.read', 'pick', 'View pick work'),
  (gen_random_uuid(), 'pick.operate', 'pick', 'Perform picking'),
  (gen_random_uuid(), 'pack.read', 'pack', 'View pack work'),
  (gen_random_uuid(), 'pack.operate', 'pack', 'Perform packing'),
  (gen_random_uuid(), 'shipment.read', 'shipment', 'View shipments'),
  (gen_random_uuid(), 'shipment.manage', 'shipment', 'Manage shipments'),
  (gen_random_uuid(), 'shipment.deliver', 'shipment', 'Record delivery'),
  (gen_random_uuid(), 'receipt.read', 'receipt', 'View receipts'),
  (gen_random_uuid(), 'receipt.manage', 'receipt', 'Manage receipts'),
  (gen_random_uuid(), 'claim.read', 'claim', 'View claims'),
  (gen_random_uuid(), 'claim.manage', 'claim', 'Manage claims'),
  (gen_random_uuid(), 'report.read', 'report', 'View reports'),
  (gen_random_uuid(), 'notification.read', 'notification', 'View notifications'),
  (gen_random_uuid(), 'audit.read', 'audit', 'View audit trail')
ON CONFLICT (code) DO UPDATE SET
  module = EXCLUDED.module,
  description = EXCLUDED.description,
  is_active = true,
  updated_at = now();

INSERT INTO public.roles (id, code, name, description, is_system)
VALUES
  (gen_random_uuid(), 'SYSTEM_ADMINISTRATOR', 'System Administrator', 'Full system access', true),
  (gen_random_uuid(), 'WAREHOUSE_ADMINISTRATOR', 'Warehouse Administrator', 'Warehouse configuration and operations', true),
  (gen_random_uuid(), 'BRANCH_ADMINISTRATOR', 'Branch Administrator', 'Branch configuration and operations', true),
  (gen_random_uuid(), 'WAREHOUSE_MANAGER', 'Warehouse Manager', 'Warehouse approvals and operations', true),
  (gen_random_uuid(), 'WAREHOUSE_STAFF', 'Warehouse Staff', 'Warehouse daily operations', true),
  (gen_random_uuid(), 'BRANCH_MANAGER', 'Branch Manager', 'Branch approvals and operations', true),
  (gen_random_uuid(), 'BRANCH_STAFF', 'Branch Staff', 'Branch daily operations', true),
  (gen_random_uuid(), 'DRIVER', 'Driver', 'Shipment delivery operations', true),
  (gen_random_uuid(), 'AUDITOR', 'Auditor', 'Read-only reporting and audit access', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system = true,
  is_active = true,
  updated_at = now();

WITH role_grants(role_code, permission_code) AS (
  SELECT 'SYSTEM_ADMINISTRATOR', code FROM public.permissions
  UNION ALL
  SELECT 'WAREHOUSE_ADMINISTRATOR', code FROM public.permissions
  WHERE code NOT IN ('admin.users.manage', 'admin.roles.manage')
  UNION ALL VALUES
    ('BRANCH_ADMINISTRATOR','product.read'), ('BRANCH_ADMINISTRATOR','stock.read'),
    ('BRANCH_ADMINISTRATOR','stock.ledger.read'), ('BRANCH_ADMINISTRATOR','stock.count'),
    ('BRANCH_ADMINISTRATOR','transfer.read'), ('BRANCH_ADMINISTRATOR','transfer.create'),
    ('BRANCH_ADMINISTRATOR','transfer.approve'), ('BRANCH_ADMINISTRATOR','transfer.receive'),
    ('BRANCH_ADMINISTRATOR','receipt.read'), ('BRANCH_ADMINISTRATOR','receipt.manage'),
    ('BRANCH_ADMINISTRATOR','claim.read'), ('BRANCH_ADMINISTRATOR','claim.manage'),
    ('BRANCH_ADMINISTRATOR','report.read'), ('BRANCH_ADMINISTRATOR','notification.read'),
    ('WAREHOUSE_MANAGER','product.read'), ('WAREHOUSE_MANAGER','stock.read'),
    ('WAREHOUSE_MANAGER','stock.ledger.read'), ('WAREHOUSE_MANAGER','stock.receive'),
    ('WAREHOUSE_MANAGER','stock.putaway'), ('WAREHOUSE_MANAGER','stock.move'),
    ('WAREHOUSE_MANAGER','stock.adjust.request'), ('WAREHOUSE_MANAGER','stock.adjust.approve'),
    ('WAREHOUSE_MANAGER','stock.count'), ('WAREHOUSE_MANAGER','transfer.read'),
    ('WAREHOUSE_MANAGER','transfer.create'), ('WAREHOUSE_MANAGER','transfer.approve'),
    ('WAREHOUSE_MANAGER','transfer.dispatch'), ('WAREHOUSE_MANAGER','pick.read'),
    ('WAREHOUSE_MANAGER','pick.operate'), ('WAREHOUSE_MANAGER','pack.read'),
    ('WAREHOUSE_MANAGER','pack.operate'), ('WAREHOUSE_MANAGER','shipment.read'),
    ('WAREHOUSE_MANAGER','shipment.manage'), ('WAREHOUSE_MANAGER','report.read'),
    ('WAREHOUSE_MANAGER','notification.read'),
    ('WAREHOUSE_STAFF','product.read'), ('WAREHOUSE_STAFF','stock.read'),
    ('WAREHOUSE_STAFF','stock.receive'), ('WAREHOUSE_STAFF','stock.putaway'),
    ('WAREHOUSE_STAFF','stock.move'), ('WAREHOUSE_STAFF','stock.adjust.request'),
    ('WAREHOUSE_STAFF','stock.count'), ('WAREHOUSE_STAFF','transfer.read'),
    ('WAREHOUSE_STAFF','transfer.dispatch'), ('WAREHOUSE_STAFF','pick.read'),
    ('WAREHOUSE_STAFF','pick.operate'), ('WAREHOUSE_STAFF','pack.read'),
    ('WAREHOUSE_STAFF','pack.operate'), ('WAREHOUSE_STAFF','shipment.read'),
    ('WAREHOUSE_STAFF','notification.read'),
    ('BRANCH_MANAGER','product.read'), ('BRANCH_MANAGER','stock.read'),
    ('BRANCH_MANAGER','stock.ledger.read'), ('BRANCH_MANAGER','stock.count'),
    ('BRANCH_MANAGER','transfer.read'), ('BRANCH_MANAGER','transfer.create'),
    ('BRANCH_MANAGER','transfer.approve'), ('BRANCH_MANAGER','transfer.receive'),
    ('BRANCH_MANAGER','receipt.read'), ('BRANCH_MANAGER','receipt.manage'),
    ('BRANCH_MANAGER','claim.read'), ('BRANCH_MANAGER','claim.manage'),
    ('BRANCH_MANAGER','report.read'), ('BRANCH_MANAGER','notification.read'),
    ('BRANCH_STAFF','product.read'), ('BRANCH_STAFF','stock.read'),
    ('BRANCH_STAFF','transfer.read'), ('BRANCH_STAFF','transfer.receive'),
    ('BRANCH_STAFF','receipt.read'), ('BRANCH_STAFF','receipt.manage'),
    ('BRANCH_STAFF','claim.read'), ('BRANCH_STAFF','claim.manage'),
    ('BRANCH_STAFF','notification.read'),
    ('DRIVER','shipment.read'), ('DRIVER','shipment.deliver'), ('DRIVER','notification.read'),
    ('AUDITOR','product.read'), ('AUDITOR','stock.read'), ('AUDITOR','stock.ledger.read'),
    ('AUDITOR','transfer.read'), ('AUDITOR','shipment.read'), ('AUDITOR','receipt.read'),
    ('AUDITOR','claim.read'), ('AUDITOR','report.read'), ('AUDITOR','audit.read')
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM role_grants grant_row
JOIN public.roles role ON role.code = grant_row.role_code
JOIN public.permissions permission ON permission.code = grant_row.permission_code
ON CONFLICT (role_id, permission_id) DO NOTHING;

WITH organization AS (
  SELECT id
  FROM public.organizations
  WHERE code = 'HORIZON'
)
INSERT INTO public.facilities (
  id,
  organization_id,
  code,
  name,
  facility_type,
  is_active
)
SELECT
  gen_random_uuid(),
  organization.id,
  'HQ-01',
  'Headquarter',
  'CENTRAL_WAREHOUSE',
  true
FROM organization
ON CONFLICT (organization_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  facility_type = EXCLUDED.facility_type,
  is_active = true,
  updated_at = now();

WITH facility AS (
  SELECT facility.id
  FROM public.facilities AS facility
  JOIN public.organizations AS organization
    ON organization.id = facility.organization_id
  WHERE organization.code = 'HORIZON'
    AND facility.code = 'HQ-01'
),
locations(code, name, location_type, path) AS (
  VALUES
    ('RCV-01', 'Receiving Zone', 'RECEIVING', '/HQ-01/RCV-01'),
    ('STG-01', 'Storage Zone', 'STORAGE', '/HQ-01/STG-01'),
    ('PCK-01', 'Picking Zone', 'PICKING', '/HQ-01/PCK-01'),
    ('PAK-01', 'Packing Zone', 'PACKING', '/HQ-01/PAK-01'),
    ('DSP-01', 'Dispatch Zone', 'DISPATCH', '/HQ-01/DSP-01'),
    ('QTN-01', 'Quarantine Zone', 'QUARANTINE', '/HQ-01/QTN-01'),
    ('DMG-01', 'Damaged Goods Zone', 'DAMAGED', '/HQ-01/DMG-01'),
    ('RTN-01', 'Return Zone', 'RETURN', '/HQ-01/RTN-01'),
    ('CLM-01', 'Claim Holding Zone', 'CLAIM_HOLDING', '/HQ-01/CLM-01')
)
INSERT INTO public.warehouse_locations (
  id,
  facility_id,
  parent_id,
  code,
  name,
  hierarchy_type,
  location_type,
  path,
  depth,
  status,
  is_active
)
SELECT
  gen_random_uuid(),
  facility.id,
  NULL,
  locations.code,
  locations.name,
  'ZONE',
  locations.location_type,
  locations.path,
  0,
  'ACTIVE',
  true
FROM facility
CROSS JOIN locations
ON CONFLICT (facility_id, code) DO UPDATE SET
  parent_id = NULL,
  name = EXCLUDED.name,
  hierarchy_type = EXCLUDED.hierarchy_type,
  location_type = EXCLUDED.location_type,
  path = EXCLUDED.path,
  depth = 0,
  status = 'ACTIVE',
  is_active = true,
  updated_at = now();

WITH organization AS (
  SELECT id
  FROM public.organizations
  WHERE code = 'HORIZON'
),
units(code, name, decimal_scale) AS (
  VALUES
    ('EA', 'Each', 0::smallint),
    ('PCS', 'Piece', 0::smallint),
    ('SET', 'Set', 0::smallint),
    ('BOX', 'Box', 0::smallint),
    ('PACK', 'Pack', 0::smallint),
    ('KG', 'Kilogram', 3::smallint),
    ('G', 'Gram', 3::smallint),
    ('L', 'Liter', 3::smallint),
    ('ML', 'Milliliter', 3::smallint),
    ('M', 'Meter', 3::smallint)
)
INSERT INTO public.units_of_measure (
  id,
  organization_id,
  code,
  name,
  decimal_scale,
  is_active
)
SELECT
  gen_random_uuid(),
  organization.id,
  units.code,
  units.name,
  units.decimal_scale,
  true
FROM organization
CROSS JOIN units
ON CONFLICT (organization_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  decimal_scale = EXCLUDED.decimal_scale,
  is_active = true,
  updated_at = now();

WITH organization AS (
  SELECT id
  FROM public.organizations
  WHERE code = 'HORIZON'
),
reasons(domain, code, name, description, requires_note, requires_attachment) AS (
  VALUES
    ('ADJUSTMENT', 'COUNT_VARIANCE', 'Count variance', 'Physical count differs from system quantity.', true, false),
    ('ADJUSTMENT', 'DAMAGED', 'Damaged stock', 'Stock quantity changed because goods are damaged.', true, true),
    ('ADJUSTMENT', 'EXPIRED', 'Expired stock', 'Stock quantity changed because goods expired.', true, false),
    ('ADJUSTMENT', 'LOST', 'Lost stock', 'Stock could not be located during investigation.', true, false),
    ('ADJUSTMENT', 'FOUND', 'Found stock', 'Previously unrecorded stock was found.', true, false),
    ('MOVEMENT', 'LOCATION_OVERRIDE', 'Location override', 'Operator overrides the recommended destination location.', true, false),
    ('MOVEMENT', 'QUARANTINE', 'Move to quarantine', 'Stock requires inspection before further use.', true, false),
    ('MOVEMENT', 'RELEASE_QUARANTINE', 'Release from quarantine', 'Inspected stock is released from quarantine.', true, false),
    ('RECEIVING', 'OVERAGE', 'Receiving overage', 'Received quantity is greater than the expected quantity.', true, false),
    ('RECEIVING', 'SHORTAGE', 'Receiving shortage', 'Received quantity is lower than the expected quantity.', true, false),
    ('RECEIVING', 'DAMAGED', 'Damaged on receipt', 'Goods were damaged when received.', true, true),
    ('RECEIVING', 'WRONG_ITEM', 'Wrong item received', 'Received product does not match the expected product.', true, true),
    ('TRANSFER', 'PARTIAL_APPROVAL', 'Partial transfer approval', 'Only part of the requested transfer is approved.', true, false),
    ('TRANSFER', 'REJECTED', 'Transfer rejected', 'The transfer request is rejected.', true, false),
    ('TRANSFER', 'SHORTAGE', 'Transfer shortage', 'Transferred quantity is lower than the dispatched quantity.', true, false),
    ('TRANSFER', 'DAMAGED_IN_TRANSIT', 'Damaged in transit', 'Goods were damaged while in transit.', true, true),
    ('CLAIM', 'DAMAGED', 'Damaged goods claim', 'Claim created for damaged goods.', true, true),
    ('CLAIM', 'LOST', 'Lost goods claim', 'Claim created for lost goods.', true, true),
    ('CLAIM', 'SHORTAGE', 'Quantity shortage claim', 'Claim created for a quantity shortage.', true, true),
    ('CLAIM', 'WRONG_ITEM', 'Wrong item claim', 'Claim created because the wrong item was delivered.', true, true),
    ('WRITE_OFF', 'DAMAGED', 'Write off damaged stock', 'Damaged stock is permanently written off.', true, true),
    ('WRITE_OFF', 'EXPIRED', 'Write off expired stock', 'Expired stock is permanently written off.', true, false),
    ('WRITE_OFF', 'LOST', 'Write off lost stock', 'Lost stock is permanently written off.', true, false)
)
INSERT INTO public.reason_codes (
  id,
  organization_id,
  domain,
  code,
  name,
  description,
  requires_note,
  requires_attachment,
  is_active
)
SELECT
  gen_random_uuid(),
  organization.id,
  reasons.domain,
  reasons.code,
  reasons.name,
  reasons.description,
  reasons.requires_note,
  reasons.requires_attachment,
  true
FROM organization
CROSS JOIN reasons
ON CONFLICT (organization_id, domain, code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  requires_note = EXCLUDED.requires_note,
  requires_attachment = EXCLUDED.requires_attachment,
  is_active = true,
  updated_at = now();

COMMIT;
