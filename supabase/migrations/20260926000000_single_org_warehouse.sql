-- Fresh single-organization warehouse schema. Apply after the Better Auth migration.
-- Keep public."user" and public.account for the existing administrator.
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false;
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS "banReason" text;
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS "banExpires" timestamptz;
ALTER TABLE public.session ADD COLUMN IF NOT EXISTS "impersonatedBy" text;

CREATE SCHEMA IF NOT EXISTS app;
REVOKE ALL ON SCHEMA app FROM PUBLIC, anon, authenticated;

CREATE TABLE app.organization_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  phone text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.app_users (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  auth_user_id text NOT NULL UNIQUE REFERENCES public."user"(id),
  role text NOT NULL CHECK (role IN ('ADMIN','CEO','MANAGER','COUNTER_STAFF','EMPLOYEE')),
  must_change_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by_id integer REFERENCES app.app_users(id)
);
CREATE INDEX app_users_active_role_idx ON app.app_users(role) WHERE deleted_at IS NULL;

CREATE TABLE app.branches (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  address text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE app.branch_memberships (
  user_id integer NOT NULL REFERENCES app.app_users(id),
  branch_id integer NOT NULL REFERENCES app.branches(id),
  PRIMARY KEY (user_id, branch_id)
);
CREATE INDEX branch_memberships_branch_idx ON app.branch_memberships(branch_id);
CREATE TABLE app.warehouses (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  branch_id integer NOT NULL REFERENCES app.branches(id),
  code text NOT NULL,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (branch_id, code),
  UNIQUE (id, branch_id)
);

CREATE TABLE app.suppliers (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  contact text,
  phone text,
  address text,
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE app.product_groups (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE app.product_categories (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  group_id integer REFERENCES app.product_groups(id),
  name text NOT NULL
);
CREATE TABLE app.brands (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE app.product_models (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brand_id integer REFERENCES app.brands(id),
  name text NOT NULL
);
CREATE TABLE app.units (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, code text NOT NULL UNIQUE, name text NOT NULL);
CREATE TABLE app.products (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  group_id integer REFERENCES app.product_groups(id),
  category_id integer REFERENCES app.product_categories(id),
  brand_id integer REFERENCES app.brands(id),
  model_id integer REFERENCES app.product_models(id),
  unit_id integer NOT NULL REFERENCES app.units(id),
  serial_tracked boolean NOT NULL DEFAULT false,
  cost numeric(18,2) CHECK (cost >= 0),
  sale_price numeric(18,2) CHECK (sale_price >= 0),
  reorder_point numeric(18,3) CHECK (reorder_point >= 0),
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE app.product_serials (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id integer NOT NULL REFERENCES app.products(id),
  serial_no text NOT NULL,
  warehouse_id integer REFERENCES app.warehouses(id),
  received_at timestamptz,
  status text NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','ISSUED','REVERSED')),
  UNIQUE (product_id, serial_no)
);

CREATE TABLE app.purchase_orders (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_no text GENERATED ALWAYS AS ('PO-' || lpad(id::text, 8, '0')) STORED UNIQUE,
  supplier_id integer NOT NULL REFERENCES app.suppliers(id),
  ordered_at date NOT NULL,
  ordered_by_ceo_id integer NOT NULL REFERENCES app.app_users(id),
  recorded_by_id integer NOT NULL REFERENCES app.app_users(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE TABLE app.purchase_order_lines (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  purchase_order_id integer NOT NULL REFERENCES app.purchase_orders(id),
  product_id integer NOT NULL REFERENCES app.products(id),
  quantity numeric(18,3) NOT NULL CHECK (quantity > 0),
  unit_price numeric(18,2) NOT NULL CHECK (unit_price >= 0),
  UNIQUE (purchase_order_id, product_id),
  UNIQUE (id, purchase_order_id)
);
CREATE INDEX purchase_order_lines_product_idx ON app.purchase_order_lines(product_id);

CREATE TABLE app.supplier_receipts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_no text GENERATED ALWAYS AS ('SR-' || lpad(id::text, 8, '0')) STORED UNIQUE,
  purchase_order_id integer NOT NULL REFERENCES app.purchase_orders(id),
  supplier_id integer NOT NULL REFERENCES app.suppliers(id),
  external_doc_no text,
  document_date date,
  total_amount numeric(18,2) CHECK (total_amount >= 0),
  note text,
  recorded_by_id integer NOT NULL REFERENCES app.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX supplier_receipts_po_idx ON app.supplier_receipts(purchase_order_id);
CREATE TABLE app.supplier_receipt_lines (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  supplier_receipt_id integer NOT NULL REFERENCES app.supplier_receipts(id),
  purchase_order_line_id integer REFERENCES app.purchase_order_lines(id),
  product_id integer NOT NULL REFERENCES app.products(id),
  quantity numeric(18,3) NOT NULL CHECK (quantity >= 0),
  unit_price numeric(18,2) CHECK (unit_price >= 0)
);

CREATE TABLE app.carrier_receipts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_no text GENERATED ALWAYS AS ('TR-' || lpad(id::text, 8, '0')) STORED UNIQUE,
  purchase_order_id integer NOT NULL REFERENCES app.purchase_orders(id),
  external_doc_no text,
  document_date date,
  carrier_name text,
  tracking_no text,
  package_count integer CHECK (package_count >= 0),
  freight_amount numeric(18,2) CHECK (freight_amount >= 0),
  note text,
  recorded_by_id integer NOT NULL REFERENCES app.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX carrier_receipts_po_idx ON app.carrier_receipts(purchase_order_id);
CREATE TABLE app.carrier_receipt_lines (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  carrier_receipt_id integer NOT NULL REFERENCES app.carrier_receipts(id),
  product_id integer NOT NULL REFERENCES app.products(id),
  quantity numeric(18,3) CHECK (quantity >= 0)
);
CREATE TABLE app.delivery_confirmations (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  carrier_receipt_id integer NOT NULL UNIQUE REFERENCES app.carrier_receipts(id),
  receiving_branch_id integer NOT NULL REFERENCES app.branches(id),
  received_by_id integer NOT NULL REFERENCES app.app_users(id),
  received_at timestamptz NOT NULL DEFAULT now(),
  actual_package_count integer NOT NULL CHECK (actual_package_count >= 0),
  package_condition text NOT NULL,
  note text
);

CREATE TABLE app.goods_receipts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_no text GENERATED ALWAYS AS ('GR-' || lpad(id::text, 8, '0')) STORED UNIQUE,
  carrier_receipt_id integer NOT NULL UNIQUE REFERENCES app.carrier_receipts(id),
  receiving_branch_id integer NOT NULL REFERENCES app.branches(id),
  warehouse_id integer NOT NULL,
  counted_by_id integer NOT NULL REFERENCES app.app_users(id),
  counted_at timestamptz NOT NULL DEFAULT now(),
  posted_by_id integer REFERENCES app.app_users(id),
  posted_at timestamptz,
  reversed_by_id integer REFERENCES app.app_users(id),
  reversed_at timestamptz,
  note text,
  FOREIGN KEY (warehouse_id, receiving_branch_id) REFERENCES app.warehouses(id, branch_id)
);
CREATE INDEX goods_receipts_carrier_idx ON app.goods_receipts(carrier_receipt_id);
CREATE TABLE app.goods_receipt_lines (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  goods_receipt_id integer NOT NULL REFERENCES app.goods_receipts(id),
  purchase_order_line_id integer NOT NULL REFERENCES app.purchase_order_lines(id),
  good_quantity numeric(18,3) NOT NULL DEFAULT 0 CHECK (good_quantity >= 0),
  damaged_quantity numeric(18,3) NOT NULL DEFAULT 0 CHECK (damaged_quantity >= 0),
  wrong_quantity numeric(18,3) NOT NULL DEFAULT 0 CHECK (wrong_quantity >= 0),
  serial_numbers text[] NOT NULL DEFAULT '{}',
  note text,
  UNIQUE (goods_receipt_id, purchase_order_line_id)
);
CREATE TABLE app.receipt_discrepancies (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  goods_receipt_line_id integer NOT NULL REFERENCES app.goods_receipt_lines(id),
  kind text NOT NULL CHECK (kind IN ('DAMAGED','WRONG_ITEM','SHORTAGE','OTHER')),
  quantity numeric(18,3) CHECK (quantity >= 0),
  detail text
);

CREATE TABLE app.inventory_documents (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_no text GENERATED ALWAYS AS ('IV-' || lpad(id::text, 8, '0')) STORED UNIQUE,
  kind text NOT NULL CHECK (kind IN ('GOODS_RECEIPT','ISSUE','TRANSFER','ADJUSTMENT','REVERSAL')),
  warehouse_id integer NOT NULL REFERENCES app.warehouses(id),
  goods_receipt_id integer UNIQUE REFERENCES app.goods_receipts(id),
  transfer_pair_id integer REFERENCES app.inventory_documents(id),
  reverses_document_id integer UNIQUE REFERENCES app.inventory_documents(id),
  reason text,
  posted_by_id integer NOT NULL REFERENCES app.app_users(id),
  posted_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE app.inventory_document_lines (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  document_id integer NOT NULL REFERENCES app.inventory_documents(id),
  product_id integer NOT NULL REFERENCES app.products(id),
  quantity numeric(18,3) NOT NULL CHECK (quantity <> 0),
  unit_cost numeric(18,2) CHECK (unit_cost >= 0),
  serial_numbers text[] NOT NULL DEFAULT '{}'
);
CREATE TABLE app.stock_movements (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  document_line_id integer NOT NULL UNIQUE REFERENCES app.inventory_document_lines(id),
  warehouse_id integer NOT NULL REFERENCES app.warehouses(id),
  product_id integer NOT NULL REFERENCES app.products(id),
  quantity_delta numeric(18,3) NOT NULL CHECK (quantity_delta <> 0),
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stock_movements_card_idx ON app.stock_movements(warehouse_id, product_id, occurred_at DESC);
CREATE TABLE app.stock_balances (
  warehouse_id integer NOT NULL REFERENCES app.warehouses(id),
  product_id integer NOT NULL REFERENCES app.products(id),
  quantity numeric(18,3) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (warehouse_id, product_id)
);

CREATE TABLE app.issue_reports (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  detail text NOT NULL CHECK (length(trim(detail)) > 0),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','FOLLOWING_UP','RESOLVED','CLOSED')),
  kind text,
  purchase_order_id integer REFERENCES app.purchase_orders(id),
  carrier_receipt_id integer REFERENCES app.carrier_receipts(id),
  goods_receipt_id integer REFERENCES app.goods_receipts(id),
  product_id integer REFERENCES app.products(id),
  quantity numeric(18,3) CHECK (quantity >= 0),
  serial_no text,
  reported_by_id integer NOT NULL REFERENCES app.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE app.issue_events (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  issue_report_id integer NOT NULL REFERENCES app.issue_reports(id),
  status text NOT NULL CHECK (status IN ('OPEN','FOLLOWING_UP','RESOLVED','CLOSED')),
  note text NOT NULL,
  performed_by_id integer NOT NULL REFERENCES app.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE app.claim_tracking (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  issue_report_id integer NOT NULL REFERENCES app.issue_reports(id),
  contacted_party text,
  contacted_at timestamptz,
  external_reference text,
  follow_up_at timestamptz,
  outcome text,
  recorded_by_id integer NOT NULL REFERENCES app.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.media_assets (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bucket text NOT NULL DEFAULT 'warehouse-evidence',
  object_path text NOT NULL UNIQUE,
  sha256 text NOT NULL,
  mime_type text NOT NULL,
  byte_size integer NOT NULL CHECK (byte_size > 0),
  uploaded_by_id integer NOT NULL REFERENCES app.app_users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE app.evidence_links (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  media_asset_id integer NOT NULL REFERENCES app.media_assets(id),
  supplier_receipt_id integer REFERENCES app.supplier_receipts(id),
  carrier_receipt_id integer REFERENCES app.carrier_receipts(id),
  delivery_confirmation_id integer REFERENCES app.delivery_confirmations(id),
  goods_receipt_id integer REFERENCES app.goods_receipts(id),
  issue_report_id integer REFERENCES app.issue_reports(id),
  page_number integer CHECK (page_number > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(supplier_receipt_id, carrier_receipt_id, delivery_confirmation_id, goods_receipt_id, issue_report_id) = 1)
);
CREATE INDEX evidence_links_media_idx ON app.evidence_links(media_asset_id);
CREATE TABLE app.audit_events (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id integer REFERENCES app.app_users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id integer,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_entity_idx ON app.audit_events(entity_type, entity_id, created_at DESC);
CREATE TABLE app.document_revisions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('PURCHASE_ORDER','SUPPLIER_RECEIPT','CARRIER_RECEIPT')),
  entity_id integer NOT NULL,
  revision_no integer NOT NULL CHECK (revision_no > 0),
  before_data jsonb NOT NULL,
  after_data jsonb NOT NULL,
  changed_by_id integer NOT NULL REFERENCES app.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, revision_no)
);
CREATE TABLE app.idempotency_keys (
  key text PRIMARY KEY,
  actor_user_id integer NOT NULL REFERENCES app.app_users(id),
  operation text NOT NULL,
  request_hash text,
  result_entity_id integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON ALL TABLES IN SCHEMA app FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA app FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('warehouse-evidence', 'warehouse-evidence', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;
