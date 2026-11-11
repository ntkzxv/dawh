-- Sales slice 1: customers, cash bills, bill lines, payments.
ALTER TABLE app.inventory_documents DROP CONSTRAINT inventory_documents_kind_check;
ALTER TABLE app.inventory_documents ADD CONSTRAINT inventory_documents_kind_check
  CHECK (kind IN ('GOODS_RECEIPT','ISSUE','TRANSFER','ADJUSTMENT','REVERSAL','SALE'));

CREATE TABLE app.customers (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 1 AND 200),
  phone text NOT NULL CHECK (length(btrim(phone)) BETWEEN 1 AND 30),
  citizen_id text CHECK (citizen_id ~ '^\d{13}$'),
  address text,
  note text,
  created_branch_id integer REFERENCES app.branches(id),
  created_by_id integer NOT NULL REFERENCES app.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX customers_citizen_id_key ON app.customers(citizen_id) WHERE citizen_id IS NOT NULL;

CREATE TABLE app.sales (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_no text GENERATED ALWAYS AS ('SO-' || lpad(id::text, 8, '0')) STORED UNIQUE,
  sale_type text NOT NULL CHECK (sale_type IN ('CASH','INSTALLMENT')),
  customer_id integer NOT NULL REFERENCES app.customers(id),
  branch_id integer NOT NULL REFERENCES app.branches(id),
  warehouse_id integer NOT NULL,
  sold_on date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Bangkok')::date,
  total_amount numeric(18,2) NOT NULL CHECK (total_amount >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('TRANSFER','CASH','CREDIT_CARD')),
  inventory_document_id integer NOT NULL UNIQUE REFERENCES app.inventory_documents(id),
  note text,
  created_by_id integer NOT NULL REFERENCES app.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  cancelled_by_id integer REFERENCES app.app_users(id),
  cancel_reason text,
  FOREIGN KEY (warehouse_id, branch_id) REFERENCES app.warehouses(id, branch_id),
  CONSTRAINT sales_cancel_all_or_none CHECK (
    (cancelled_at IS NULL AND cancelled_by_id IS NULL AND cancel_reason IS NULL)
    OR (cancelled_at IS NOT NULL AND cancelled_by_id IS NOT NULL AND cancel_reason IS NOT NULL)
  )
);
CREATE INDEX sales_branch_idx ON app.sales(branch_id, id DESC);
CREATE INDEX sales_customer_idx ON app.sales(customer_id, id DESC);

CREATE TABLE app.sale_lines (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sale_id integer NOT NULL REFERENCES app.sales(id),
  product_id integer NOT NULL REFERENCES app.products(id),
  quantity numeric(18,3) NOT NULL CHECK (quantity > 0),
  unit_price numeric(18,2) NOT NULL CHECK (unit_price >= 0),
  line_total numeric(18,2) NOT NULL CHECK (line_total >= 0),
  serial_numbers text[] NOT NULL DEFAULT '{}',
  UNIQUE (sale_id, product_id)
);

CREATE TABLE app.sale_payments (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_no text GENERATED ALWAYS AS ('RC-' || lpad(id::text, 8, '0')) STORED UNIQUE,
  sale_id integer NOT NULL REFERENCES app.sales(id),
  kind text NOT NULL CHECK (kind IN ('CASH_SALE','DOWN_PAYMENT','INSTALLMENT')),
  method text NOT NULL CHECK (method IN ('TRANSFER','CASH','CREDIT_CARD')),
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  paid_on date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Bangkok')::date,
  reference_no text,
  created_by_id integer NOT NULL REFERENCES app.app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  voided_at timestamptz,
  voided_by_id integer REFERENCES app.app_users(id),
  void_reason text,
  CONSTRAINT sale_payments_void_all_or_none CHECK (
    (voided_at IS NULL AND voided_by_id IS NULL AND void_reason IS NULL)
    OR (voided_at IS NOT NULL AND voided_by_id IS NOT NULL AND void_reason IS NOT NULL)
  )
);
CREATE INDEX sale_payments_sale_idx ON app.sale_payments(sale_id, id DESC);

REVOKE ALL ON app.customers, app.sales, app.sale_lines, app.sale_payments FROM PUBLIC, anon, authenticated;
