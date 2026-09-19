# Database schema

> Snapshot: 2026-09-19, read from the connected Supabase PostgreSQL catalog.
>
> This is the current database contract for backend work. It intentionally lists
> only objects that exist now; Receiving, Transfer, Picking, Shipment, Receipt,
> Claim, Notification, and Report tables have **not** been created yet.

## Access rules

- Application tables live in `public`. The Next.js server accesses them through
  `DATABASE_URL`; the browser must not call them through Supabase Data API.
- Row Level Security is enabled on every `public` table. `anon` and
  `authenticated` have no table privileges for Better Auth and WMS tables.
- Better Auth owns `public."user"`, `session`, `account`, `verification`, and
  `"rateLimit"`. Do not write to them outside Better Auth.
- `auth`, `storage`, `realtime`, `vault`, and other Supabase schemas are managed
  infrastructure. Do not use them as the WMS data model.

## Schemas in the database

| Schema | Owner / role | Tables or views currently present |
| --- | --- | --- |
| `public` | DAWH application, Better Auth, WMS foundation | 35 tables; documented in full below |
| `auth` | Supabase Auth (unused by DAWH authentication) | user/session/MFA/OAuth/SSO internals |
| `storage` | Supabase Storage | buckets, objects, multipart uploads, vector metadata |
| `realtime` | Supabase Realtime | messages, subscription, schema_migrations |
| `vault` | Supabase Vault | `secrets` table and `decrypted_secrets` view |
| `extensions` | PostgreSQL extensions | `pg_stat_statements` views and extension functions |
| `graphql_public` | Supabase GraphQL | `graphql(...)` function |
| `pgbouncer` | Connection pooler | `get_auth(...)` security-definer function |

## `public`: Better Auth

| Table | Columns | Relationship / responsibility |
| --- | --- | --- |
| `"user"` | `id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt` | Better Auth identity. `id` is the text user ID used by every app user reference; `email` is unique. |
| `session` | `id`, `expiresAt`, `token`, `createdAt`, `updatedAt`, `ipAddress`, `userAgent`, `userId` | Login session. `userId -> user.id` with cascade delete; `token` is unique. |
| `account` | `id`, `accountId`, `providerId`, `userId`, `accessToken`, `refreshToken`, `idToken`, token expiry columns, `scope`, `password`, timestamps | Password/OAuth account. `userId -> user.id` with cascade delete. |
| `verification` | `id`, `identifier`, `value`, `expiresAt`, timestamps | Better Auth verification token store. |
| `"rateLimit"` | `id`, `key`, `count`, `lastRequest` | Better Auth rate-limit state; `key` is unique. |

## `public`: Employee profile

### `employee_profiles`

One row per Better Auth user. `user_id` is the primary key and references
`public."user"(id)`. It is the onboarding/profile-completion record used before
opening WMS modules.

| Group | Columns |
| --- | --- |
| Identity | `user_id`, `username`, `prefix`, `first_name_th`, `last_name_th`, `nickname_th`, `first_name_en`, `last_name_en`, `nickname_en`, `citizen_id`, `birth_date`, `gender` |
| Personal | `blood_type`, `marital_status`, `nationality`, `religion` |
| Education | `education_level`, `major_subject`, `university_name_th`, `university_name_en` |
| Contact | `phone`, `emergency_contact_name_th`, `emergency_contact_name_en`, `emergency_contact_relationship`, `emergency_contact_phone` |
| Current address | `current_house_no`, `current_village`, `current_soi`, `current_province`, `current_district`, `current_subdistrict`, `current_postal_code` |
| Registered address | `registered_house_no`, `registered_village`, `registered_soi`, `registered_province`, `registered_district`, `registered_subdistrict`, `registered_postal_code` |
| Employment / completion | `facility_id`, `department_id`, legacy display fields `department`, `branch_name`, `branch_code`, `terms_version`, `terms_accepted_at`, `profile_completed_at`, `created_at`, `updated_at` |

The current profile-completion rule is application-owned: a profile is complete
when `profile_completed_at` is not null. `username` is unique; `citizen_id` is
also unique when supplied.

## `public`: RBAC and facility scope

| Table | Key columns | Purpose |
| --- | --- | --- |
| `roles` | `id`, unique `code`, `name`, `description`, `is_system`, `is_active`, `version`, audit columns | Named application roles. |
| `permissions` | `id`, unique `code`, `module`, `description`, `is_active`, timestamps | Atomic permission catalog. |
| `role_permissions` | composite PK `role_id`, `permission_id`; `created_at`, `created_by` | Role-to-permission mapping. |
| `user_role_assignments` | `id`, `user_id`, `role_id`, `valid_from`, `valid_until`, `assigned_at/by`, `revoked_at/by`, `revoke_reason` | Assigns a Better Auth user to a role. Active `(user_id, role_id)` is unique. |
| `user_facility_scopes` | `id`, `user_id`, `facility_id`, `scope_type`, validity period, version, audit columns | Limits a user to one facility with `READ`, `OPERATE`, `APPROVE`, or `ADMIN` scope. Unique per user/facility. |
| `user_access_controls` | `user_id`, `status`, `reason`, `changed_at/by`, timestamps | Application access state. Status is `ACTIVE`, `SUSPENDED`, or `TERMINATED`; authentication remains owned by Better Auth. |

## `public`: Organization and warehouse layout

| Table | Key columns | Important constraints |
| --- | --- | --- |
| `organizations` | `id`, unique `code`, `name`, `timezone`, `is_active`, `version`, audit columns | Root of the organization tree. Default timezone is `Asia/Bangkok`. |
| `facilities` | `id`, `organization_id`, `code`, `name`, `facility_type`, address fields, coordinates, `is_active`, `version`, audit columns | Unique `(organization_id, code)`; type is `CENTRAL_WAREHOUSE` or `BRANCH`. |
| `facility_routes` | `id`, `source_facility_id`, `destination_facility_id`, `distance_km`, `lead_time_minutes`, `priority`, `is_active`, version, audit columns | Unique route pair; source and destination cannot match. |
| `warehouse_locations` | `id`, `facility_id`, `parent_id`, `code`, `name`, `hierarchy_type`, `location_type`, `path`, `depth`, capacity, `status`, `is_active`, version, audit columns | Parent must be in the same facility. Unique `(facility_id, code)`. Hierarchy: `ZONE`, `AISLE`, `RACK`, `SHELF`, `BIN`. Status: `ACTIVE`, `BLOCKED`, `MAINTENANCE`. |
| `departments` | `id`, `organization_id`, `code`, `name`, `is_active`, version, audit columns | Organization-scoped employee department catalog. Unique `(organization_id, code)`. |

Location types are `RECEIVING`, `STORAGE`, `PICKING`, `PACKING`, `DISPATCH`,
`QUARANTINE`, `DAMAGED`, `RETURN`, and `CLAIM_HOLDING`.

## `public`: Product master

| Table | Key columns | Important constraints |
| --- | --- | --- |
| `product_categories` | `id`, `organization_id`, `parent_id`, `code`, `name`, `description`, `is_active`, version, audit columns | Hierarchical category; unique `(organization_id, code)` and parent must be in same organization. |
| `brands` | `id`, `organization_id`, `code`, `name`, `is_active`, version, audit columns | Unique `(organization_id, code)`. |
| `units_of_measure` | `id`, `organization_id`, `code`, `name`, `decimal_scale`, `is_active`, version, audit columns | `decimal_scale` is 0–6; unique `(organization_id, code)`. |
| `products` | `id`, `organization_id`, `sku`, `name_th`, `name_en`, `description`, category/brand/base unit IDs, tracking/picking fields, dimensions, cost, currency, shelf-life, storage condition, active/version/audit columns | Unique `(organization_id, sku)`. `tracking_method`: `NONE`, `LOT`, `SERIAL`; `picking_strategy`: `FIFO`, `FEFO`. Category, brand, and base unit must belong to the same organization. |
| `product_units` | `id`, `product_id`, `unit_id`, `base_quantity`, dimensions, weight, active/version/audit columns | Unit conversion. Unique `(product_id, unit_id)`; `base_quantity > 0`. |
| `product_barcodes` | `id`, `product_id`, optional `product_unit_id`, unique `barcode`, `barcode_type`, `is_primary`, timestamp/audit | Only one primary barcode per product. Types: `EAN_13`, `UPC_A`, `CODE_128`, `QR`, `INTERNAL`. |
| `lots` | `id`, `product_id`, `lot_number`, manufacture/expiry dates, `status`, audit columns | Unique `(product_id, lot_number)`. Status: `ACTIVE`, `EXPIRED`, `BLOCKED`. |
| `serial_numbers` | `id`, `product_id`, optional `lot_id`, `serial_number`, `status`, audit columns | Unique `(product_id, serial_number)`. Status: `ACTIVE`, `IN_TRANSIT`, `LOST`, `DAMAGED`, `RETIRED`. |
| `safety_stock_rules` | `id`, `facility_id`, `product_id`, minimum/maximum/reorder/safety quantities, version, audit columns | Unique `(facility_id, product_id)`. Quantities cannot be negative. |
| `reason_codes` | `id`, `organization_id`, `domain`, `code`, `name`, `description`, `requires_note`, `requires_attachment`, active/version/audit columns | Unique `(organization_id, domain, code)`. |

## `public`: Inventory foundation

| Table | Key columns | Important constraints |
| --- | --- | --- |
| `stock_balances` | `id`, facility/location/product/lot/serial/shipment IDs, `stock_status`, `quantity`, `version`, `updated_at` | Mutable read projection. Unique balance grain uses `NULLS NOT DISTINCT`. Quantity is non-negative. Positive serial can exist in only one balance row. |
| `inventory_transactions` | `id`, unique `transaction_no`, `organization_id`, `transaction_type`, polymorphic `reference_type`/`reference_id`, reversal/reason references, note, occurrence/post timestamps, `posted_by`, optional unique `idempotency_key_id` | Immutable ledger header. |
| `inventory_transaction_lines` | `id`, `transaction_id`, `line_no`, facility/location/product/lot/serial/shipment IDs, `stock_status`, `quantity_before`, `quantity_delta`, `quantity_after`, `posted_at` | Immutable ledger lines. Unique `(transaction_id, line_no)`; database enforces `before + delta = after` and non-negative result. |

`stock_status` is one of `AVAILABLE`, `RESERVED`, `PICKED`, `PACKED`,
`IN_TRANSIT`, `QUARANTINE`, `DAMAGED`, `CLAIM_PENDING`, `EXPIRED`, `LOST`.
For `IN_TRANSIT` and `LOST`, the row requires `shipment_id` and no physical
`location_id`; all other states require a physical location and no shipment.
`shipment_id` intentionally has no FK yet because the `shipments` table does
not exist.

## `public`: Cross-cutting backend tables

| Table | Key columns | Purpose |
| --- | --- | --- |
| `document_sequences` | composite PK `organization_id`, `document_type`, `period`; `last_value`, `updated_at` | Lock one row to allocate human document numbers. `period` is `YYYYMM`. |
| `idempotency_keys` | `id`, organization/user IDs, `route_fingerprint`, `idempotency_key`, `request_hash`, `status`, stored response, timestamps | Deduplicates retryable mutation commands. Unique `(organization_id, user_id, idempotency_key)`. |
| `audit_logs` | `id`, `organization_id`, `request_id`, actor/action/entity/facility references, old/new JSON, IP, agent, `occurred_at` | Append-only request and business audit log. |
| `outbox_events` | `id`, aggregate type/ID, event type, JSON payload, schedule/publish timestamps, attempt/error fields | Transactional outbox for post-commit side effects. |
| `attachments` | `id`, `organization_id`, entity type/ID, category, storage bucket/key, MIME/size/checksum, status, create/delete metadata | File metadata only. Object bytes belong in Supabase Storage. Status: `PENDING`, `ACTIVE`, `DELETED`. |

## Application functions and triggers

| Function | Security | Used by |
| --- | --- | --- |
| `public.set_employee_profile_updated_at()` | security invoker | Sets `employee_profiles.updated_at = now()` on update. |
| `public.set_updated_at()` | security invoker | Sets `NEW.updated_at = now()` on update for WMS mutable tables. |

`employee_profiles_set_updated_at` runs on `employee_profiles`.

The shared `set_updated_at` trigger runs on:

`roles`, `permissions`, `organizations`, `facilities`, `facility_routes`,
`warehouse_locations`, `user_facility_scopes`, `product_categories`, `brands`,
`units_of_measure`, `products`, `product_units`, `lots`, `serial_numbers`,
`safety_stock_rules`, `reason_codes`, `departments`, and `user_access_controls`.

No database trigger posts stock, changes document status, creates audit rows, or
increments the optimistic-lock `version`. Those are backend service duties.

## Supabase-managed functions and triggers

These exist in the database but are not application service APIs:

| Schema | Functions / triggers relevant to recognize |
| --- | --- |
| `auth` | `uid()`, `role()`, `email()`, `jwt()`; owned by Supabase Auth. DAWH uses Better Auth instead. |
| `storage` | Object helpers such as `foldername`, `filename`, `search`, plus bucket/object delete protection and `objects.updated_at` triggers. |
| `realtime` | Subscription validation, RLS evaluation, broadcast and WAL helper functions; `subscription.tr_check_filters` trigger. |
| `extensions` | `pgcrypto` (`gen_random_uuid`, `digest`, `crypt`, encryption helpers), `uuid-ossp`, and `pg_stat_statements`. |
| `vault` | `create_secret`, `update_secret` and cryptographic helper functions; do not query decrypted secrets from application code. |
| `pgbouncer` | `get_auth(...)` is `SECURITY DEFINER` and belongs solely to the connection pooler. |

### Managed table and view inventory

| Schema | Objects |
| --- | --- |
| `auth` | `audit_log_entries`, `custom_oauth_providers`, `flow_state`, `identities`, `instances`, `mfa_amr_claims`, `mfa_challenges`, `mfa_factors`, `mfa_recovery_code_sets`, `mfa_recovery_codes`, `oauth_authorizations`, `oauth_client_states`, `oauth_clients`, `oauth_consents`, `one_time_tokens`, `refresh_tokens`, `saml_providers`, `saml_relay_states`, `schema_migrations`, `scim_tokens`, `scim_users`, `sessions`, `sso_domains`, `sso_providers`, `users`, `webauthn_challenges`, `webauthn_credentials` |
| `storage` | `buckets`, `buckets_analytics`, `buckets_vectors`, `migrations`, `objects`, `s3_multipart_uploads`, `s3_multipart_uploads_parts`, `vector_indexes` |
| `realtime` | `messages` (partitioned), `schema_migrations`, `subscription` |
| `vault` | `secrets` table, `decrypted_secrets` view |
| `extensions` | `pg_stat_statements`, `pg_stat_statements_info` views |

Managed triggers are `realtime.tr_check_filters`, and Storage's
`enforce_bucket_name_length_trigger`, `protect_buckets_delete`,
`protect_objects_delete`, and `update_objects_updated_at`.

## Backend implementation notes

- WMS primary and foreign keys use PostgreSQL `bigint`. Primary keys are
  `GENERATED BY DEFAULT AS IDENTITY`, so inserts omit `id` and let PostgreSQL
  generate it.
- Keep WMS IDs as strings in TypeScript and JSON. Do not convert them to
  JavaScript `number`, which cannot safely represent every `bigint` value.
- Use `employee_profiles.profile_completed_at` to block incomplete accounts.
- Use `public."user".id` as every `*_user_id` value; never use Supabase
  `auth.users.id` for Better Auth authorization.
- Enforce roles/scopes in services with `roles` → `role_permissions` and
  `user_facility_scopes`. Do not use a client-supplied facility ID as authority.
- Stock writes must update `stock_balances`, append an inventory transaction and
  lines, store audit/outbox records, and claim an idempotency key in one short
  SQL transaction.

## P0 frontend handoff database additions

- `supabase/sql/p0_frontend_handoff.sql` is the standalone, transactional P0
  schema/access patch. It adds departments, account access controls, profile
  facility/department references, scope versioning, and the canonical role
  grants.
- `supabase/seeds/development_p0.sql` is a deterministic development-only seed
  for two branch facilities, master data, three tracking-model products, and a
  reconciled opening ledger/balance projection.
- The P0 patch does **not** repair or register migration history. The connected
  manually provisioned database must still have its migration history
  reconciled separately before `supabase db push` is used against it.

## Reproduce and bootstrap

The repository migrations are ordered as Better Auth, employee profile, WMS
foundation, then the production-minimum seed. On a fresh database managed by
Supabase migrations, apply them with `npx supabase db push`. The currently
connected database was provisioned manually and has no migration-history table;
run the production-minimum seed SQL directly there, or reconcile its migration
history before using `db push`. The seed creates the default active organization,
permission catalog, system roles, role-permission mappings, `HQ-01`, its nine
functional warehouse zones, common units of measure, and operational reason
codes. It does not create products, stock, operational documents, or grant a
role to an arbitrary user.

After the intended administrator has registered through Better Auth, grant the
initial administrator role and `HQ-01` facility scope explicitly:

```bash
npm run bootstrap:admin -- admin@example.com
```

Email delivery is feature-gated. Keep `AUTH_EMAIL_ENABLED=false` until Resend
and the sender domain are ready; registration remains usable without email
verification and change-email stays disabled. Set it to `true` only when
`RESEND_API_KEY` and `AUTH_EMAIL_FROM` are valid.
