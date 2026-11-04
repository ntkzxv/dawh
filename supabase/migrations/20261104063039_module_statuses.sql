CREATE TABLE app.module_statuses (
  module_key text PRIMARY KEY CHECK (module_key IN ('datacenter', 'warehouse', 'sales', 'reports')),
  is_enabled boolean NOT NULL DEFAULT true,
  maintenance_reason text,
  updated_by_id integer REFERENCES app.app_users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT module_statuses_reason_check CHECK (
    (is_enabled AND maintenance_reason IS NULL)
    OR (
      NOT is_enabled
      AND maintenance_reason IS NOT NULL
      AND length(btrim(maintenance_reason)) BETWEEN 1 AND 500
    )
  )
);

REVOKE ALL ON app.module_statuses FROM PUBLIC, anon, authenticated;

INSERT INTO app.module_statuses (module_key, is_enabled, maintenance_reason)
VALUES
  ('datacenter', true, NULL),
  ('warehouse', true, NULL),
  ('sales', true, NULL),
  ('reports', false, 'อยู่ระหว่างเตรียมระบบรายงาน');
