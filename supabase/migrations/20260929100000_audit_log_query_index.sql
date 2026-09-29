CREATE INDEX IF NOT EXISTS audit_events_action_created_id_idx
  ON app.audit_events(action, created_at DESC, id DESC);
