# Sprint 2 — exact implementation preflight

Status: BUSINESS CONTRACT FROZEN; implementation AUTHORIZED / IN PROGRESS. Owner approved exactly two additional paths; runtime evidence pending.
Base: main `2b47f0a619f494a811c94e41697f7d09dcb19e3a`; new branch `checkpoint-2` starts from that main, then receives the frozen business contract and this plan. Owner's current resume instruction authorizes PR/merge only after full green checks and review; production deployment remains forbidden.
Frozen contract commit: `fd3400aa93f2c365d422b2a50b2a66ee039621dd` on sprint2-contract.
Contract: `SPRINT_2_BUSINESS_CONTRACT.md`, FINAL, 36 invariants / 90 cases. One Sprint2 implementation checkpoint; no Sprint3 continuation. Changes outside the exact list below require report before creation.

## 1. Exact entities and fields

Only four additive business tables. Existing four foundation tables remain. UUID defaults use pg_catalog.gen_random_uuid(); timestamptz timestamps use actual server clock; money/version bigint, no floating arithmetic. Mutable version defaults 1, positive; created_at/updated_at NOT NULL. Mutable updates increment exactly once per successful command; no-op/duplicate do not increment or emit success audit. No client direct writes.

| Table | Exact columns |
|---|---|
| public.billiard_tables | id uuid PK; venue_id uuid NOT NULL FK venues; code text NOT NULL (1..32); label text NOT NULL (1..150); status text NOT NULL DEFAULT ACTIVE (ACTIVE/MAINTENANCE/DISABLED); hourly_price_vnd bigint NOT NULL >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; version bigint NOT NULL DEFAULT 1 >0 |
| public.table_sessions | id uuid PK; venue_id uuid NOT NULL; table_id uuid NOT NULL; customer_profile_id uuid NULL FK profiles; opened_by uuid NULL FK profiles; opening_method text NOT NULL PAYMENT/MANUAL; state text NOT NULL PENDING_PAYMENT/ACTIVE/CANCELLED; acquired_at timestamptz NOT NULL; expires_at timestamptz NULL; required_amount_vnd bigint NOT NULL >0; prepaid_minutes smallint NOT NULL DEFAULT 60 CHECK =60; started_at timestamptz NULL; cancelled_at timestamptz NULL; cancellation_reason text NULL fixed cause; manual_reason text NULL (1..500); request_actor_profile_id uuid NOT NULL FK profiles; request_key uuid NOT NULL; request_digest text NOT NULL; created_at/updated_at timestamptz NOT NULL; version bigint NOT NULL DEFAULT 1 >0 |
| public.payments | id uuid PK; session_id uuid NOT NULL UNIQUE FK table_sessions; reference text NOT NULL UNIQUE (server-generated opaque UUID-derived reference); state text NOT NULL WAITING/SUCCESS/CANCELLED/PAYMENT_NEEDS_RESOLUTION; payment_success_at timestamptz NULL; resolution_reason text NULL fixed cause; created_at/updated_at timestamptz NOT NULL; version bigint NOT NULL DEFAULT 1 >0 |
| public.payment_receipts | id uuid PK; payment_id uuid NULL FK payments; provider text NOT NULL (1..64); recipient_scope text NOT NULL (1..128, opaque non-bank-private identifier); external_event_id text NOT NULL (1..200); external_transaction_id text NULL (1..200); reference text NOT NULL (1..200); kind text NOT NULL CREDIT/REVERSAL_NOTICE/RECONCILIATION_NOTICE; amount_vnd bigint NULL; currency text NOT NULL CHECK =VND; provider_occurred_at timestamptz NOT NULL; provider_callback_received_at timestamptz NOT NULL; processed_at timestamptz NOT NULL; evidence_digest text NOT NULL; created_at timestamptz NOT NULL |

No persisted received/remaining/excess balance, busy/free flag, separate order/reservation/lock/customer identity table. CREDIT requires amount>0 and immutable external_transaction_id. Non-credit notices never contribute to received funds and cannot automatically reverse/refund/close; minimum evidence/management flag only. Append-only receipts/audit have no version. Unmatched verified receipts have NULL payment_id and restricted management access; never guessed allocation.

PAYMENT sessions require customer=request_actor, opened_by NULL, expiry=acquired_at+300 seconds, no manual_reason; only PENDING may activate after authentic credit. MANUAL sessions are created ACTIVE, expires_at NULL, opened_by=request_actor authorized profile, reason required, customer nullable (walk-in). No payment row fabricated for MANUAL. Known beneficiary must exist and be ACTIVE. Never create fake profiles/auth users. ACTIVE requires started_at; CANCELLED requires cancelled_at/cause, never start; PAYMENT ACTIVE must be backed by SUCCESS via protected transaction/constraint trigger. These are database constraints, not UI checks.

## 2. Additive migrations

1. `20261007000100_table_payment_contract.sql`: four tables, constraints/indexes/RLS/grants; narrow existing CHECK extensions described in section14; venue public contact field; immutable receipt trigger.
2. `20261007000200_table_payment_operations.sql`: private helpers/public projections/RPCs, trusted private ingestion, invalidation triggers, transaction discipline, explicit EXECUTE grants.

Do not modify the three frozen Sprint1 migrations or Auth configuration. All schema operations apply to clean/reset database. Migration rollback test checks failure of business transactions, not destructive rollback of received money.

## 3. Constraints and indexes

- UNIQUE billiard_tables(venue_id,code); UNIQUE billiard_tables(id,venue_id), composite session(table_id,venue_id) FK prevents venue spoofing.
- Partial UNIQUE table_sessions(table_id) WHERE state IN ('PENDING_PAYMENT','ACTIVE'): one table owner including countdown0 ACTIVE.
- Partial UNIQUE table_sessions(customer_profile_id) WHERE state='PENDING_PAYMENT': one online customer hold across venues; PAYMENT non-null. No partial predicate depends on now().
- UNIQUE table_sessions(request_actor_profile_id,request_key); payload digest server-derived from canonical table/method/beneficiary/reason/quote-version, never client-authoritative hash.
- UNIQUE payments(session_id), payments(reference); corresponding session must use PAYMENT.
- UNIQUE payment_receipts(provider,recipient_scope,external_event_id); partial UNIQUE(provider,recipient_scope,external_transaction_id) WHERE kind='CREDIT'. Same transfer/different delivery IDs returns original receipt if all immutable financial fields match; does not create another CREDIT. Conflicting identity/digest rejects with rollback; restricted diagnostic, no overwrite/rebind. Reversal notices dedupe by event, no CREDIT.
- Index tables(venue_id,status), sessions(venue_id,state), sessions(customer_profile_id,created_at), sessions(expires_at) WHERE PENDING, payments(state,created_at), receipts(payment_id), audit(venue_id,created_at) existing.
- Contact length<=500 plain text/null; no HTML/link executable rendering. bigint sum computed as numeric, reject overflow before bigint response/cast. No floating/fee/tax rounding.
- Receipts UPDATE/DELETE denied by grants and immutable trigger; reject direct unauthorized mutable-column writes and audit modifications. All FKs RESTRICT for business history; privileged test TRUNCATE only in fixtures.

## 4. RPC/helper inventory and responsibility

Public functions all SECURITY DEFINER only where needed, owned by minimum volume_core, fixed empty search_path, schema-qualified references, PUBLIC/anon execute revoked by default, explicit live caller checks. Public anonymous grants only the safe published projection. No public ingestion RPC.

| Function | Exact responsibility / inputs |
|---|---|
| public.sprint2_access(p_venue uuid NULL) | Current live role/scope fixed Sprint2 actions; manual extra never finance/scope bypass. Preserve old current_access output/signature. |
| public.public_tables(p_venue uuid NULL) | Enabled/published service tables, price/version/derived occupancy/server_now/contact; no occupant, private ID or money. |
| public.own_table_sessions() | Live own request/session/initial timer plus own payment balances/reference/contact; NULL walk-in never own/public readable. |
| public.table_operations(p_venue uuid NULL) | Staff scoped service/occupancy/initial timer only; authorized management adds minimum hold/session operational information. |
| public.opening_payments(p_venue uuid NULL) | ADMIN/CEO global or MANAGER assigned financial projection, unresolved/excess/notices; no raw provider/recipient/auth/bank information. |
| public.acquire_table(p_table uuid,p_expected_table_version bigint,p_request_key uuid) | Live customer authoritative price/CAS, lazy expiry, unique hold, snapshot, reference, payment/session/audit creation. Does not accept amount/owner/start/success. |
| public.cancel_table_hold(p_session uuid,p_expected_session_version bigint,p_expected_payment_version bigint) | Live owner pending-only cancel; zero CANCELLED or positive resolution; release/audit atomically. Missing/stale CAS rejects. |
| public.manual_open_preview(p_table uuid,p_customer uuid NULL) | Authorized scoped caller only: table eligibility/version/price and selected real beneficiary minimum id/display_name/account status. No search/directory/contact/Auth read. |
| public.open_table_manual(p_table uuid,p_customer uuid NULL,p_expected_table_version bigint,p_request_key uuid,p_reason text) | Re-authorize live actor/scope/beneficiary, table CAS and occupancy, audited MANUAL ACTIVE; no fake payment. |
| public.create_billiard_table(p_venue uuid,p_code text,p_label text,p_hourly_price_vnd bigint,p_reason text) | ADMIN TABLE_DEFINITIONS_MANAGE only, current enabled/configured venue, safe business audit. |
| public.update_billiard_table(p_table uuid,p_expected_version bigint,p_label text,p_status text,p_hourly_price_vnd bigint,p_reason text) | ADMIN only preview/diff/reason/CAS; service invalidation pending-only; snapshot unaffected. No-op NO_CHANGE. |
| public.set_venue_management_contact(p_venue uuid,p_expected_version bigint,p_contact text NULL,p_reason text) | Existing ADMIN VENUES_MANAGE authority, venue version/CAS/audit; cannot modify other venue/security fields. |
| private.sprint2_clock() | Actual database clock only; no public input/GUC/test mode. Controlled boundary DB tests temporarily replace this private helper inside a rollback-only privileged fixture transaction; production definition always clock_timestamp. |
| private.sprint2_lock() | Shared advisory transaction barrier at existing key (20261006,1), then live authority; no replacement of frozen writer/session helpers. |
| private.sprint2_can_manual(p_venue uuid) | Fixed role/default or active membership extra, active venue scope/live session; no directory/finance implicit grants. |
| private.sprint2_balances(p_payment uuid) | Sum unique CREDIT safely; derive required/received/remaining/excess, no duplicate authority. Non-exposed core only. |
| private.sprint2_expire_locked(p_session uuid,p_now timestamptz,p_cause text) | Caller already holds ordered affected locks; pending-only terminalization, preserve finance/audit, actual authoritative clock. Internal timestamp never browser parameter. |
| private.sprint2_invalidate_pending() | Trigger on account DISABLED/venue disabled/table unserviceable; durable cancellation/resolution, not ACTIVE closing. |
| private.sprint2_audit(...) | Fixed action/target/source/payload allowlist; live actor for customer/management, trusted SYSTEM only provider/expiry/invalidation. No arbitrary caller-authored audit. |
| private.ingest_payment_event(p_event jsonb) | Trusted normalized evidence only; strict fields/type/identity/recipient/ref checks, ordered locks, dedupe, immutable CREDIT/NOTICE, safe sum/threshold/late resolution/version/audit atomic. Server received_at supplied only through trusted adapter boundary; processed/success_at actual DB clock. |
| private.fail_payment_attempt(p_reference text,p_cause text) | Trusted QR preparation failure; cancel pending0 or positive resolution, never close ACTIVE. |
| private.expire_table_holds(p_limit integer) | Bounded housekeeping sweep with ordered locks; correctness remains in projections/acquire/ingest/invalidation without worker. |
| private.sprint2_receipt_immutable() | Reject runtime UPDATE/DELETE, immutable append-only ledger. |
| private.sprint2_validate_payment_session() | Deferred constraint trigger enforcing PAYMENT/SUCCESS/start/receipts and MANUAL/no-fake-payment relationship at commit; required by section1 cross-entity invariant. |

Technical gateway role `volume_payment_ingest` NOLOGIN/NOINHERIT, not business role/profile. EXECUTE only on private ingestion/failure/expiry; no business/Auth SELECT or direct writes. Trusted local integration server fixture may SET ROLE using operator DB credential; browser/anon/authenticated (including ADMIN) cannot assume it. No shipped provider endpoint/credential or generic service-role proxy. Core gets only required new business table permissions; existing Auth/session reader grants unchanged. Direct invocation DENY tests cover every private helper.

## 5. Fixed permissions

Role/action matrix remains the frozen business contract section8. Only TABLE_SESSION_OPEN_MANUAL extends membership extra CHECK, eligible MANAGER/STAFF and active venue; existing STAFF_DIRECTORY_READ/STAFF_MEMBERSHIP_STATUS_MANAGE unchanged. Other Sprint2 action names are fixed backend actions, not arbitrary extras: PUBLIC_TABLES_READ; OWN_TABLE_SESSION_CREATE; OWN_TABLE_SESSIONS_READ; OWN_OPENING_PAYMENTS_READ; OWN_TABLE_HOLD_CANCEL; TABLE_OPERATIONS_READ; OPENING_PAYMENTS_READ; TABLE_DEFINITIONS_MANAGE. Existing VENUES_MANAGE handles contact. CEO explicitly manual business write, not security/config write. No HR/Player role, no multi-role.

## 6. RLS/read projections

New tables FORCE ROW LEVEL SECURITY; runtime client receives no broad SELECT/INSERT/UPDATE/DELETE. volume_core narrow owner policies support only authorized safe functions. Restricted gateway executes only minimum helper. Public projection is explicit column allowlist; never to_jsonb(profile/receipt/Auth). Existing profile/membership/Auth permissions untouched.
Own private paths require frozen live_profile/session cutoff; role/membership/extra changes invalidate old JWT and old refresh sessions exactly as Sprint1. Disabled accounts cannot use own finance; management/contact safe public channel is not an account bypass. Manager all internal reads/writes scoped; inactive membership no scope; STAFF operation fields exclude customer name/contact/amount/reference/receipt; manual extra target preview excludes directory. Own disabled-venue financial case may display intended public business contact. CEO operations/finance global but no ADMIN writes.

## 7. Audit contract

Fixed BUSINESS actions: TABLE_CREATED, TABLE_UPDATED, VENUE_MANAGEMENT_CONTACT_UPDATED, TABLE_OPENING_REQUESTED, TABLE_HOLD_CANCELLED, TABLE_OPENING_EXPIRED, TABLE_HOLD_INVALIDATED, PAYMENT_ATTEMPT_FAILED, PAYMENT_RECEIPT_RECORDED, PAYMENT_SUCCEEDED, PAYMENT_RESOLUTION_REQUIRED, PAYMENT_RECONCILIATION_FLAGGED, TABLE_SESSION_OPENED, TABLE_SESSION_OPENED_MANUAL.
Targets only existing types plus billiard_tables/table_sessions/payments/payment_receipts. Source CUSTOMER_WEB/CONTROL_CENTER requires current actor/profile-role; SYSTEM only fixed receipt/payment/open/expiry/invalidation/failure/reconciliation actions with null actor (trigger-caused invalidation records triggering actor when available). No SECURITY action/source rule weakened.
Payload allowlist IDs/venue/state/method/required/received/remaining/excess/deadline/start/versions/reason; no raw provider IDs/recipient/bank/credentials/customer contact. Existing audit_feed returns full audit row, so newly written BUSINESS payload must already be safe for assigned management. Manual actor/customer distinction explicit. Audit failure rolls back receipt/state/version/start. Duplicates no successful transition audit. No mutable audit.

## 8. Provider-neutral adapter boundary

`supabase/functions/_shared/payment-adapter.ts` is an unconfigured server-only contract/validation module, not a deployed function/provider integration. Methods preparePayment(reference,amountVnd), verifyEvent(rawInput), ingestVerifiedEvent(normalized), failAttempt(reference,cause); opaque QR artifact only from a configured provider. Provider-neutral normalized events contain immutable provider/recipient/event/transfer/ref/type/VND amount/provider timestamp/evidence digest, received_at from trusted server clock, never browser JSON.
No production bank QR synthesized without recipient/provider. UI can show waiting/reference/balances only after actual preparation succeeds; provider unavailable/unconfigured causes safe attempt failure/release, not a fake usable QR. Automated tests inject adapter through server-side fixture with explicit normalized evidence and test-only opaque QR artifact; no runtime demo branch, browser success button or client capability. Actual-provider QR/signature/finality/replay/live transfer cases remain provider-dependent NOT RUN, separate from neutral-core PASS.
TS module must not be imported by client/shared client bundle. No new npm dependencies needed initially. If a QR library becomes necessary after provider selection, justify/pin separately; no hand-written equivalent standard QR encoder.

## 9. UI routes/screens

Customer: preserve /profile and /recovery; add /tables (venue/table choice), /table-session?session=<uuid> (own payment/partial/full/resolution/initial timer). One screen changes by authoritative state; amounts/deadline/cancel/retry/contact in plain Vietnamese. No client-success transition or internal technical jargon. Anonymous published-table browsing may reuse /tables, login before acquire. QR artifact must be trusted/configured; failed preparation releases lock with clear retry.
Control Center: preserve existing routes; add /tables (scoped operational table grid and reason/CAS/manual preview-confirm drawer), /opening-payments (management only balances/resolution/excess, no refund/settlement buttons). ADMIN table configuration/contact in existing venue/table surfaces; manual extra STAFF sees manual action only in assigned venue, no finance navigation. CEO distinct sessions/received/excess/unresolved operational counters; no revenue/profit/final-bill claim. No fake future menu.
Sensitive manual/config/contact: preview → explicit diff/summary → reason → confirm; backend rechecks authority and versions. Manual beneficiary input exact existing profile id or walk-in, no new directory/search/CRM. Table current version is quote/confirmation token, started_at never client-supplied. Countdown0 remains occupied ACTIVE and says initial prepaid period ended.

## 10. Concurrency, expiry and recovery

Every Sprint2 mutation first acquires SHARED transaction advisory lock at (20261006,1). Frozen private.writer acquires EXCLUSIVE same key before security mutations; this serializes against role/account/scope changes while independent Sprint2 customers/tables may proceed concurrently. Do not alter writer/live_profile/session_valid. Then lock involved profile rows deterministic UUID order; venue/table rows deterministic order; sessions; payments. Callback uses beneficiary profile then table/session/payment. Acquire includes customer's old pending table and target table in sorted lock set before lazy terminalization. Re-check live authorization/eligibility and actual clock after waits.
Invalidation called from frozen account/venue writer already holds EXCLUSIVE barrier; table config holds SHARED and affected table lock. Trigger must not acquire a customer profile lock after a table lock; no security/helper rewrite. Privileged fixtures/operators modifying account/venue outside supported RPC must obtain EXCLUSIVE barrier before updates. Regression tests exercise race/deadlock and rollback with actual independent DB connections.
Unique partial indexes guard residual races. At exact expiry equality, payment receipt/serialized processing <= expires_at eligible if still pending; cleanup terminalizes only clock>expires_at so it cannot defeat inclusive callback equality. Projections treat hold as stale beyond deadline and recompute server time; no arbitrary grace. Full opening requires current account/venue/table eligibility, held ownership and both trusted received and actual processing time <= deadline. Time sampled after serialization, not transaction-start now(). Success timestamp is actual atomic threshold transition, never bank timestamp.
No background worker required for correctness; private bounded sweep may be exercised by local/CI housekeeping only. Own read must report logically expired/resolution accurately even if sweep stopped; next mutation materializes terminal state. Disable→re-enable leaves terminal row unchanged. Late credit preserves financial case and cannot affect newer ownership. Network retry uses same actor/key or receipt identity, bounded retry only retryable SQL/network failures; stale CAS remains conflict, read authoritative state instead. No automated refund/reversal/close.

## 11. Exact implementation allowlist

The following are the only paths permitted on checkpoint-2 (no directory globs). New paths may be created; existing paths only minimum changes described. Legacy and all unlisted paths forbidden.

```text
README.md
docs/sprints/SPRINT_2_BUSINESS_CONTRACT.md
docs/sprints/SPRINT_2_IMPLEMENTATION_PLAN.md
docs/sprints/SPRINT_2_RESULTS.md
.github/workflows/sprint1a.yml
.github/workflows/sprint1b.yml
.github/workflows/sprint2.yml
supabase/migrations/20261007000100_table_payment_contract.sql
supabase/migrations/20261007000200_table_payment_operations.sql
supabase/tests/sprint1_constraints.test.sql
supabase/tests/sprint2_constraints.test.sql
supabase/tests/sprint2_rls.test.sql
supabase/tests/sprint2_operations.test.sql
supabase/tests/sprint2_payments.test.sql
supabase/tests/sprint2_atomicity.test.sql
supabase/functions/_shared/payment-adapter.ts
supabase/functions/open-table-payment/index.ts
supabase/config.toml
supabase/functions/_shared/payment-adapter.test.ts
tests/integration/fixtures/payment.ts
tests/integration/sprint2-acquire.test.ts
tests/integration/sprint2-payments.test.ts
tests/integration/sprint2-security.test.ts
tests/integration/sprint2-concurrency.test.ts
tests/integration/sprint2-invalidation.test.ts
tests/e2e/fixtures/payment.ts
tests/e2e/sprint2-customer.spec.ts
tests/e2e/sprint2-operations.spec.ts
tests/e2e/sprint2-security.spec.ts
packages/shared/src/table-payment.ts
packages/shared/src/table-payment.test.ts
apps/customer/src/App.tsx
apps/customer/src/styles.css
apps/customer/src/features/tables/TablesPage.tsx
apps/customer/src/features/tables/TableSessionPage.tsx
apps/control-center/src/App.tsx
apps/control-center/src/components/Shell.tsx
apps/control-center/src/features/tables/TablesPage.tsx
apps/control-center/src/features/payments/OpeningPaymentsPage.tsx
apps/control-center/src/features/venues/VenuesPage.tsx
apps/control-center/src/features/people/PeoplePage.tsx
apps/control-center/src/styles.css
package.json
tsconfig.base.json
vitest.config.ts
```

45 exact paths. No package-lock dependency changes planned; supabase/config.toml may only enable local Edge Runtime and explicitly retain JWT verification for open-table-payment. No seed/Auth/helper/migration1 edits. New tests create isolated tables via privileged fixture setup only; all actual permission assertions use ordinary real JWT, never service-role proof. PeoplePage minimum fixed manual-extra choice, no permission builder. README/result scope/evidence only; no rewriting frozen Blueprint or Sprint1 contracts. Package scripts include server-only unit/lint/type paths; versions/dependencies unchanged.

## 12. Exact CI changes

Keep Supabase CLI 2.119.0 and all pinned dependency versions. Ubuntu GitHub Actions with real local Supabase, clean reset and minimum session reader operator bootstrap as frozen.
- Existing sprint1a.yml/sprint1b.yml: scope-scanner additive approved Sprint2 phase on checkpoint-2/main/PR into main using pinned frozen base and exact45 paths. Retain prior phase checks and every runtime/security step, ordinary JWT tests, no checkout of old snapshot. Permit only listed new migrations and minimal described constraint-test maintenance; hash-check the three frozen migrations and unchanged Auth/security helper sources. No disabling required jobs/tests/failing audit or relaxing secret scan. Prior CI semantics continue on older phase branches.
- sprint2.yml: triggers push checkpoint-2/main and PR main; candidate checkout; exact allowlist, immutable core/Legacy diff, forbidden-module scan, secret scan; npm ci; dependency audit; typecheck; lint; unit (shared+server adapter); production customer/control builds; start real Supabase; clean reset; all database tests; all API integrations; browser install; all Playwright desktop/mobile projects. Safe artifacts only redacted reports; no token/QR-secret/network payload traces. Stop-stack always cleanup.
- Required green main after any later approved merge remains freeze prerequisite; current owner resume instruction authorizes merge only after full candidate/PR checks and scope review. Branch CI can establish reviewable Sprint2 evidence, not main CLOSED claim. Actual provider integration explicitly excluded/non-blocking.
- Scope validation checks exact eight business tables, no future schemas, no service-role client secret, no browser import of server module. New CI tests current candidate; no mock Supabase or excluded failed security group.

## 13. Test mapping and acceptance

All 90 contract IDs map below to concrete files. IDs are requirements, not claimed executed-test counts. DB tests real pgtap; API tests real Auth/JWT/PostgreSQL connections; unit tests deterministic adapter/timer/permission pure logic; E2E real local backend with trusted server fixture evidence, not browser-forged payment. No old test rerun until changed schema/CI requires full regression, then full regression mandatory.

Fixture exact-boundary proof: real PostgreSQL rollback-only fixture transaction temporarily replaces private.sprint2_clock with a fixed server timestamp, runs the actual ingestion/threshold/session/audit transaction at exact expires_at, and rolls back to the immutable runtime definition. No public clock input/GUC, browser clock or production test mode; owner/EXECUTE restrictions tested. This is controlled DB-clock fixture evidence, not actual-provider/HTTP microsecond scheduling evidence. API/Edge tests use unchanged actual clock and separately exercise before/after/queued-processing boundaries and persisted outcomes.

Mapping follows; DB/API/E2E identifiers refer to the exact filename groups listed after the table. Provider-specific portions T29/T34/T35/T64/T68 remain separately NOT RUN until selected; their neutral reject/dedupe/no-automation behavior is still required now.

| Contract ID | DB/API coverage file keys | Unit/E2E supplement |
|---|---|---|
| T01 | D3; A4 | — |
| T02 | D3; A4 | — |
| T03 | D3; A4 | — |
| T04 | D3; A1 | E1 |
| T05 | D3; A1 | — |
| T06 | D3; A1 | — |
| T07 | D3; A1 | E1 |
| T08 | D4; A2 | E1 |
| T09 | D4; A2 | E1 |
| T10 | D4; A2 | U1; E1 |
| T11 | D3; A1 | U1; E1 |
| T12 | D4; A2 | U2 |
| T13 | D4; A2 | U2 |
| T14 | D4; A2 | U2 |
| T15 | D4; A2 | — |
| T16 | D4; A2 | — |
| T17 | D4; A2 | — |
| T18 | D4; A2 | — |
| T19 | D3; A4 | — |
| T20 | D4; A2 | — |
| T21 | D4; A2 | — |
| T22 | D4; A2 | — |
| T23 | D4; A2 | E1 |
| T24 | D4; A2 | — |
| T25 | D4; A2 | — |
| T26 | D4; A2 | — |
| T27 | D4; A2 | — |
| T28 | D4; A2 | — |
| T29 | D4; A2 | U1/U2 |
| T30 | D3; A1 | U1; E1 |
| T31 | D3; A1 | — |
| T32 | D2; A3 | — |
| T33 | D2; A3 | — |
| T34 | D2; A3 | U2 |
| T35 | D2; A3 | U2 |
| T36 | D4; A2 | — |
| T37 | D3; A4 | — |
| T38 | D4; A2 | — |
| T39 | D3; A1 | E1 |
| T40 | D3; A1 | — |
| T41 | D3; A1 | — |
| T42 | D3; A1 | — |
| T43 | D4; A2 | — |
| T44 | D5; A2 | — |
| T45 | D5; A2 | — |
| T46 | D3; A4 | — |
| T47 | D2; A3 | E2 |
| T48 | D2; A3 | E3 |
| T49 | D2; A3 | E3 |
| T50 | D2; A3 | — |
| T51 | D2; A3 | — |
| T52 | D2; A3 | E3 |
| T53 | D3; A4 | — |
| T54 | D3; A1 | — |
| T55 | D3; A1 | E2 |
| T56 | D3; A1 | — |
| T57 | D3/D5; A5 | — |
| T58 | D2; A3 | E3 |
| T59 | D2; A3 | — |
| T60 | D1/D4; A2 | U1 |
| T61 | D3; A1 | U1; E1 |
| T62 | D3; A1 | U1; E1 |
| T63 | D3; A1 | U1; E1 |
| T64 | D4; A2 | U2 |
| T65 | all frozen Sprint1; all frozen Sprint1 | all 54 frozen browser cases; 3 frozen unit cases |
| T66 | CI scope/secret/audit/type/lint/build | — |
| T67 | D2/D4; A3 | E2 |
| T68 | D4; A2 | U2 |
| T69 | D3; A1 | — |
| T70 | D4; A2 | U1/U2 |
| T71 | D3; A1 | E1 |
| T72 | D3; A1 | E1 |
| T73 | D3; A4 | — |
| T74 | D4; A2 | — |
| T75 | D3; A4 | — |
| T76 | D3; A4 | — |
| T77 | D3; A4 | E1 |
| T78 | D3; A1 | E2 |
| T79 | D3; A1 | E2 |
| T80 | D2; A3 | E3 |
| T81 | D3; A1 | U2; E1 |
| T82 | D3; A1 | U2 |
| T83 | D4; A2 | U2 |
| T84 | D4; A2 | U2 |
| T85 | static forbidden-module check | E1 |
| T86 | D3; A1 | U1 |
| T87 | D3; A1 | E1 |
| T88 | D3/D5; A5 | — |
| T89 | D3/D5; A5 | — |
| T90 | D2; A3 | E3 |

File keys (all exact allowlisted):
- D1 supabase/tests/sprint2_constraints.test.sql; D2 sprint2_rls.test.sql; D3 sprint2_operations.test.sql; D4 sprint2_payments.test.sql; D5 sprint2_atomicity.test.sql (same supabase/tests folder).
- A1 tests/integration/sprint2-acquire.test.ts; A2 sprint2-payments.test.ts; A3 sprint2-security.test.ts; A4 sprint2-concurrency.test.ts; A5 sprint2-invalidation.test.ts (same tests/integration folder).
- U1 packages/shared/src/table-payment.test.ts; U2 supabase/functions/_shared/payment-adapter.test.ts.
- E1 tests/e2e/sprint2-customer.spec.ts; E2 sprint2-operations.spec.ts; E3 sprint2-security.spec.ts (same tests/e2e folder); existing browser matrix retained.

Acceptance: all 36 invariants/90 neutral-core requirements proven by specified groups; 78 frozen DB assertions remain or expand intentionally, 27 API /3 unit /54 Playwright regression retained; exact8 business-table check; unknown-extra/DENY/Auth-direct-access/revocation/cross-scope/no-secret intact. All required CI checks green on candidate, results contain counts/run/SHA/files/dependencies/findings/limits; no NOT RUN called PASS. Actual-provider-specific guarantees remain deferred, not part of neutral-core completion claim. New material blocker or allowlist need -> stop that part and report before creating file.

## 14. Exact minimal frozen Sprint1 maintenance

| Existing surface | Minimum additive change | Required regression |
|---|---|---|
| venues | ADD COLUMN management_contact nullable plain business text, length<=500; separate Sprint2 contact RPC/projection. No old public_venues/current_access/update_venue signature/output change. | ADMIN contact CAS/reason/audit; CEO/Manager/Staff/User writes DENY; old venue queries intact; scoped contact/disabled-account privacy; own resolution on disabled venue only intended contact. |
| staff_memberships extras CHECK | Replace existing CHECK in new migration to allow exactly old two extras plus TABLE_SESSION_OPEN_MANUAL, preserve duplicate/null/unknown rejection and role eligibility. Existing update_access/cutoff/audit RPC unchanged. | Old whitelist assertions retained; HR/USER invalid; extra venue bound; revocation old JWT/refresh DENY; manual-extra does not grant directory/finance. |
| audit_events fixed CHECKs | Add only listed target types/BUSINESS actions and narrow SYSTEM actions. Preserve all old SECURITY/actor/source rules; no arbitrary source/actor/action. | Forged audit/direct modification DENY; old audit tests; safe management payload/venue scope; fault-trigger audit rollback. |
| profile/venue change dependencies | Add pending-only invalidation triggers; no identity/role/Auth/cutoff/RPC rewrite; old EXCLUSIVE writer barrier unchanged. | Disabled/reactivated no hold resurrection, ACTIVE untouched, old security audit/cutoff atomically persists, concurrent callback vs disabling, failure rolls back whole command. |
| sprint1_constraints.test.sql | Existing exactly4 assertion becomes exactly4 FOUNDATION names; add new exact8 global business entity assertion in D1. Remaining 77 old assertions retained. | Real full clean reset+pgtap; no weakening of role/membership/version/FK tests. |
| old CI scope guards | Exact additive Sprint2 phase allowance only; old runtime/security jobs never skipped or test old snapshots. | Run complete current candidate old+new security/browser suites; immutable old migration/security files hash checked; unknown file rejection. |

These are authorized minimal operational extensions, not material identity/security architecture broadening. No direct Auth/client grants, no old security RPC changes, no broad table SELECT. If implementation reveals shared-barrier/invalidation cannot preserve old concurrency/security without rewriting frozen core, STOP/BLOCKED before that change.

## Preflight outcome / checkpoint

Business blockers: none outstanding. Provider-dependent P1–P3 non-blocking for neutral-core; real QR/provider integration separately authorized. Sprint3+ S1–S4 deferred. Architectural compatibility is a planned test obligation, not runtime PASS. Frozen business semantics cannot drift.
This plan authorizes only its exact paths under owner's conditional instruction. Contract/plan publication is the preflight checkpoint; no migration/RPC/UI/provider code exists at this checkpoint. Implementation begins only after this plan is committed, on checkpoint-2 from the verified main. CI reports remain NOT RUN until implementation exists and real Actions executes. Merge is conditional on current owner instructions and green checks; no production, real provider or Sprint3.

## Owner-approved exact two-path extension — CLOSED

Owner authorizes exactly these two additional paths; no other expansion:
- `supabase/functions/open-table-payment/index.ts`: authenticated server orchestration invokes approved customer RPCs using ordinary user JWT, neutral adapter preparation, safe returned projection and trusted narrow QR-failure operation. No direct protected-table writes, client price/success/ownership/start authority, real provider/webhook/refund/overtime/Sprint3, client secrets or security bypass. Any narrow elevated database credential remains server-only, SET LOCAL ROLE volume_payment_ingest, and never replaces database invariants.
- `supabase/config.toml`: only enable local [edge_runtime] and define [functions.open-table-payment] verify_jwt=true. All existing Auth/API/security settings remain identical. Never disable JWT verification or pass --no-verify-jwt; no provider webhook boundary authorized.

Why necessary: main disables Edge runtime and exposes only public database schema. An adapter module cannot serve an authenticated HTTP request or invoke non-exposed failure processing. Browser-only release cannot guarantee safe preparation failure handling. Use existing Supabase functions architecture; no separate API server.

Gate CLOSED by owner; exact list now45 paths. Frozen business semantics unchanged. No material frozen Sprint1 security change authorized. Implementation/test results are tracked separately; no runtime PASS until full real CI.
