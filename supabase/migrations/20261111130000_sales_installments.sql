-- Sales slice 2: installment terms on bills, schedule rows, guarantors.
ALTER TABLE app.sales
  ADD COLUMN down_payment numeric(18,2),
  ADD COLUMN interest_rate numeric(5,2),
  ADD COLUMN interest_amount numeric(18,2),
  ADD COLUMN financed_amount numeric(18,2),
  ADD COLUMN months integer,
  ADD COLUMN installment_amount numeric(18,2),
  ADD COLUMN first_due_on date,
  ADD COLUMN closed_at timestamptz,
  ADD CONSTRAINT sales_installment_terms CHECK (
    (sale_type = 'INSTALLMENT' AND down_payment IS NOT NULL AND interest_rate IS NOT NULL
      AND interest_amount IS NOT NULL AND financed_amount IS NOT NULL AND months IS NOT NULL
      AND installment_amount IS NOT NULL AND first_due_on IS NOT NULL)
    OR (sale_type = 'CASH' AND down_payment IS NULL AND interest_rate IS NULL
      AND interest_amount IS NULL AND financed_amount IS NULL AND months IS NULL
      AND installment_amount IS NULL AND first_due_on IS NULL AND closed_at IS NULL)
  ),
  ADD CONSTRAINT sales_installment_ranges CHECK (
    (interest_rate IS NULL OR interest_rate BETWEEN 0 AND 100)
    AND (months IS NULL OR months BETWEEN 1 AND 120)
    AND (down_payment IS NULL OR down_payment >= 0)
    AND (financed_amount IS NULL OR financed_amount > 0)
  );

CREATE TABLE app.sale_installments (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sale_id integer NOT NULL REFERENCES app.sales(id),
  seq integer NOT NULL CHECK (seq >= 1),
  due_on date NOT NULL,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  paid_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0 AND paid_amount <= amount),
  UNIQUE (sale_id, seq)
);

CREATE TABLE app.sale_guarantors (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sale_id integer NOT NULL REFERENCES app.sales(id),
  full_name text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 1 AND 200),
  phone text NOT NULL CHECK (length(btrim(phone)) BETWEEN 1 AND 30),
  citizen_id text CHECK (citizen_id ~ '^\d{13}$'),
  address text,
  relationship text
);
CREATE INDEX sale_guarantors_sale_idx ON app.sale_guarantors(sale_id);

REVOKE ALL ON app.sale_installments, app.sale_guarantors FROM PUBLIC, anon, authenticated;
