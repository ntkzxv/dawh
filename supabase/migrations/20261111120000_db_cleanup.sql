-- Cleanup after DB audit (2026-11-11).

-- Legacy functions not created by any repo migration and not used by any trigger.
DROP FUNCTION IF EXISTS public.set_employee_profile_updated_at();
DROP FUNCTION IF EXISTS public.set_updated_at();

-- Duplicate of the unique index goods_receipts_carrier_unique.
DROP INDEX IF EXISTS app.goods_receipts_carrier_idx;

-- Child-to-parent lookup paths only; *_by_id audit columns are intentionally left unindexed.
CREATE INDEX IF NOT EXISTS inventory_document_lines_document_idx ON app.inventory_document_lines(document_id);
CREATE INDEX IF NOT EXISTS supplier_receipt_lines_receipt_idx ON app.supplier_receipt_lines(supplier_receipt_id);
CREATE INDEX IF NOT EXISTS carrier_receipt_lines_receipt_idx ON app.carrier_receipt_lines(carrier_receipt_id);
CREATE INDEX IF NOT EXISTS issue_events_issue_idx ON app.issue_events(issue_report_id);
CREATE INDEX IF NOT EXISTS claim_tracking_issue_idx ON app.claim_tracking(issue_report_id);
CREATE INDEX IF NOT EXISTS receipt_discrepancies_line_idx ON app.receipt_discrepancies(goods_receipt_line_id);
CREATE INDEX IF NOT EXISTS evidence_links_supplier_receipt_idx ON app.evidence_links(supplier_receipt_id) WHERE supplier_receipt_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS evidence_links_carrier_receipt_idx ON app.evidence_links(carrier_receipt_id) WHERE carrier_receipt_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS evidence_links_delivery_confirmation_idx ON app.evidence_links(delivery_confirmation_id) WHERE delivery_confirmation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS evidence_links_goods_receipt_idx ON app.evidence_links(goods_receipt_id) WHERE goods_receipt_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS evidence_links_issue_report_idx ON app.evidence_links(issue_report_id) WHERE issue_report_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS stock_movements_product_idx ON app.stock_movements(product_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS sale_lines_product_idx ON app.sale_lines(product_id);

-- Second guard behind the conditional update in postInventoryLine.
ALTER TABLE app.stock_balances ADD CONSTRAINT stock_balances_quantity_non_negative CHECK (quantity >= 0);

-- Payment method lives on app.sale_payments; the bill-level copy could disagree with it.
ALTER TABLE app.sales DROP COLUMN IF EXISTS payment_method;
