# Sprint 3 — Technical design

Status: INTERNALLY REVIEWED — Gate 2 complete under owner one-shot authorization.
Base/Gate 1 main: `69b680da06ae3194f8dcc2bbfffce4eddf30be32`.
Branch: `checkpoint-3`. Approved business SPEC: `813d41c86f937e8407f6080baaa599b669b62eff`; frozen metadata: `0c2b43a5cc1607b4d7829c5cea16ac318310ad87`; SPEC blob: `58796a2bbd0e581b4672e1f42b9adfa5ea545a18`.
Gate 1 PR: #5. Exact-main regression SUCCESS: [1A](https://github.com/HAD10202/Volume/actions/runs/37645374334), [1B](https://github.com/HAD10202/Volume/actions/runs/37645374365), [Sprint 2](https://github.com/HAD10202/Volume/actions/runs/37645374256).

## 1. Minimal representation and compatibility

The existing `table_sessions` row remains the session and ownership authority. `required_amount_vnd` remains the immutable original hourly/opening snapshot, NOT an invoice. `payments` remains the unique opening intent. PAYMENT SUCCESS remains historically true after CLOSED; MANUAL still has no opening payment. No new busy flag, mutable balance, payment intent, role engine, worker or external service.

Two additive migrations add closing facts, immutable CASH and conflict evidence, and narrow functions. The five existing migrations are byte-frozen. Only three session CHECK definitions and the deferred payment/session validator need additive replacement: allow CLOSED with valid final facts, allow MANUAL ACTIVE/CLOSED, and extend successful played PAYMENT validation from ACTIVE to ACTIVE/CLOSED. All original pending/cancelled/opening checks remain. Existing owner and customer-hold unique indexes remain unchanged.

### Session additions

All new fields are NULL until CLOSED, except none are needed for ACTIVE accrual:

| Field | Type / constraint |
|---|---|
| ended_at | timestamptz, finite, >= original started_at |
| duration_microseconds | bigint >= 0, exactly elapsed timestamp interval in microseconds |
| billable_minutes | bigint >= 60, exact started-minute formula |
| final_charge_vnd | bigint > 0, exact original snapshot formula |
| closed_by | uuid FK profiles, non-null on CLOSED |
| closed_actor_role | existing five-role text snapshot |
| close_source | CUSTOMER_WEB or CONTROL_CENTER, trusted entrypoint |
| close_reason | text, trimmed length 1..500 |
| close_correlation_id | uuid, server generated, audit correlation |
| closure_received_vnd | bigint >= 0, validated total at close |
| closure_bank_received_vnd | bigint >= 0, <= closure_received_vnd |
| closure_issues | text[] of fixed anomaly reasons at close |

Closure applied/due/excess/status are derived from frozen C, closure V and closure issues. This preserves the closure-time financial result without a second mutable ledger. Current balances derive from receipts and can differ from that historical snapshot. A BEFORE UPDATE/DELETE trigger protects all CLOSED session facts; only version/updated_at may change for later audited settlement. Old opening data is never reinterpreted. Normal roles have no direct writes, including to ACTIVE start or snapshot.

### New immutable evidence

`session_cash_receipts`: `id uuid PK` is the economic command identity; `session_id uuid NOT NULL FK table_sessions ON DELETE RESTRICT`; `amount_vnd bigint NOT NULL CHECK >0`; `actor_id uuid NOT NULL FK profiles`; `actor_role text` restricted to ADMIN/CEO/MANAGER/STAFF; `reason text` 1..500; `correlation_id uuid NOT NULL`; `created_at timestamptz NOT NULL` DB time. Index `(session_id,created_at,id)`. Venue derives through the immutable session relationship; no independently client-writable venue copy. UPDATE/DELETE always rejected. No version on append-only evidence.

`session_financial_issues`: immutable provider-conflict evidence only, not a generic workflow. Fields `id uuid PK`, `payment_id uuid NOT NULL FK payments`, `receipt_id uuid NOT NULL FK payment_receipts`, `fingerprint text NOT NULL`, `kind text CHECK = 'PROVIDER_CONFLICT'`, `created_at timestamptz NOT NULL`; UNIQUE `(receipt_id,fingerprint)` and index `(payment_id)`. The issue binds to the original immutable receipt's payment, never the conflicting requested session. Fingerprint is a DB digest of normalized conflicting financial facts used for dedupe, not authentication. Store no raw provider payload, credentials or personal contact fields. Existing immutable non-credit receipt notices already represent reversal/reconciliation issues and need no new entity. No issue resolution mutation exists.

### Grants and RLS

Both new tables ENABLE/FORCE RLS. Revoke all from PUBLIC/anon/authenticated/service_role/volume_payment_ingest. Grant volume_core SELECT/INSERT only; explicit core SELECT/INSERT policies, no UPDATE/DELETE policies or privileges. New functions have fixed empty search_path, schema-qualified references, owner volume_core, default EXECUTE revoked. Authenticated gets only explicit public RPCs. Trusted neutral ingest gets only its explicit private entrypoint. No new Auth reader, BYPASSRLS role or client secret.

## 2. Exact billing and close cutoff

Private `sprint3_bill(H bigint,D numeric)` accepts exact integer microseconds. Reject NULL/nonpositive H, NULL/negative/nonintegral D, nonfinite/out-of-range results. Compute with PostgreSQL exact numeric intermediates:

`M = greatest(60, div(D + 59999999, 60000000))`

`C = div(H::numeric * M + 59, 60)`

Validate D/M/C fit nonnegative signed bigint before casting. No float, pre-rounded per-minute rate, timestamp millisecond truncation, wrap or cap. Duration comes from `extract(epoch from (cutoff-started_at))*1000000`, preserving PostgreSQL microseconds. Date/timezone/display/DST changes cannot affect elapsed instants. No active timer writes, expiry or duration limit. The helper is private, not a client-selectable final-price RPC.

Close samples `clock_timestamp()` only AFTER acquiring ownership/financial locks and rechecking live authority, all expected versions and state. It uses the original start and snapshot. The sample is the database close transition's linearization time, persisted only if the entire transaction commits; it is never transaction-start, preview, provider, client or request-arrival time. All queue/network/lock delay before this transition is billable. PostgreSQL does not expose its future physical WAL commit timestamp inside an uncommitted transaction: the stored authoritative ended_at is the successfully committed transition time, not a claim of measuring a later network ACK or WAL flush instant. The same interpretation underlies the frozen Sprint 2 committed opening transition. Failed audit/constraint/commit discards the sample and every closing effect; retry samples anew. No post-commit job patches end/charge.

A successful close atomically writes end/D/M/C, closure financial facts, trusted actor/source/reason/correlation, CLOSED and version+1, and inserts the exact BUSINESS audit. The existing partial unique owner index automatically releases ownership when this transaction commits. Due/excess/anomaly never delays release. Closing never writes table status/price/version or venue enablement. New acquisition may proceed after release, never before commit. An old close cannot UPDATE the table or a new session.

## 3. Financial derivation

`sprint3_funds(session)` sums existing immutable CREDIT amounts for that session's unique opening payment plus immutable CASH amounts for that exact session, in exact numeric arithmetic. Notices and conflict issues are not credits or automatic debits. Validate combined received total <= bigint max; a new receipt's constraint trigger enforces this even when bank ingress uses the retained Sprint 2 entrypoint. Overflow rolls back receipt/audit/version and the entire operation.

For current estimate (ACTIVE) or frozen C (CLOSED), derive A=min(V,C), DUE=C-A, X=V-A. A/V/C/DUE/X are decimal strings in JSON. Never store mutable copies. Issues are fixed codes: EXCESS when current X>0; LATE_BANK when CLOSED bank credit sum exceeds frozen closure_bank_received_vnd; PROVIDER_NOTICE when a same-payment noncredit notice exists; PROVIDER_CONFLICT when an immutable issue exists. The bank-total comparison does not depend on equal timestamp ordering. CASH after close is ordinary collection unless surplus/independent issue exists.

Status precedence: any issue => NEEDS_RESOLUTION; otherwise due=0 => PAID; applied>0 => PARTIAL; otherwise UNPAID. Always include exact due and reasons even with an anomaly. ACTIVE result explicitly says estimate and uses current server time. Overtime can absorb an excess-only flag without deleting evidence; independent notices/conflicts/late bank remain. Freeze closure_issues separately at close. No refund, correction or fake resolve button.

The provider remains UNCONFIGURED. New private `sprint3_ingest_payment_event(jsonb)` accepts only the already frozen neutral normalized contract through the existing trusted capability. It calls the unchanged Sprint 2 ingress. Its subtransaction catches only PAYMENT_IDENTITY_CONFLICT, records a deduplicated issue against the original bound receipt after ordered locks, and returns REJECTED_CONFLICT (zero new credit), not bank SUCCESS. Other errors roll back. Old entrypoint and error behavior remain for frozen callers/tests; new Sprint 3 neutral ingress is the designated contract for conflict visibility. Unknown/unmatched evidence cannot be bound by guessing a beneficiary. No provider-specific fields, webhook, credentials, QR settlement flow or live readiness claim.

## 4. Authorization and transactions

Every private read and write calls unchanged `private.live_profile()`; writes repeat after locks. It retains real Auth session existence, account ACTIVE, session_id/user binding, current role and cutoff checks. Reuse unchanged `private.can_venue()` for operators; it correctly does not treat venue disable as membership revocation.

Self read: exact non-null customer equals actor, any role using its own customer surface. Self close additionally PAYMENT and ACTIVE. Operator read/close/CASH: ADMIN/CEO global; MANAGER/STAFF ACTIVE membership at exact session venue. USER never operator. Walk-in NULL is never self. No extras required or expanded. Disabled account or inactive membership/cutoff denies; disabled table/venue alone does not. Actor/source/snapshot/end/validated amounts cannot be supplied by client.

Lock order: frozen shared advisory barrier `(20261006,1)`; economic identity advisory lock for CASH/provider commands if any; actor/beneficiary profile rows sorted UUID; table row; exact session row; unique payment row if present. Frozen security/service writers use the exclusive barrier. All new paths use this order; no network under locks. Provider locks use the frozen identity derivation before rows. Close has no per-request identity lock: session row is the one close identity. Unrelated tables can progress subject to shared actors/profiles, without a global exclusive close lock.

Preview returns session/payment/table/venue bigint versions as strings (payment NULL only for MANUAL). Writes require all applicable versions. Null expected versions fail; MANUAL must send null payment version, not fabricate a payment. Time alone does not bump versions. CASH and new conflict issue increment session version once; bank ingress retains payment version increments. Close increments session once, leaves opening payment and table versions unchanged. CAS compares under locks; current authorization is rechecked before idempotent lookup/output.

Close repeat with stale version rejects. Current-version terminal close rejects ALREADY_CLOSED. Recovery reads the existing final result; no second close success/audit under another request key. CASH takes a stable receipt UUID created before preview/confirm, preserved across unknown outcomes. Check CAS then existing identity: exact actor/session/amount/reason match returns NO_CHANGE without evidence/audit/version; mismatch rejects CASH_IDENTITY_CONFLICT. Stale duplicate still rejects under frozen CAS. A read-only receipt-result RPC recovers a committed receipt without mutation. Distinct UUIDs denote distinct real cash events; equal amounts are not deduped. UI must not mint a new UUID to retry an uncertain receipt.

## 5. Exact public RPC responsibilities

All return JSONB with decimal strings for bigint/money. No arbitrary client timestamp, actor, provider state or price parameter.

| RPC | Inputs / responsibility |
|---|---|
| own_session_financial | p_session uuid; own safe ACTIVE/CLOSED estimate/final record |
| session_financial | p_session uuid; authorized operator safe record |
| session_financial_operations | p_venue uuid nullable; operator scoped ACTIVE/CLOSED records, including unavailable service; no public projection |
| close_own_table_session | p_session uuid; p_expected_session_version, p_expected_payment_version, p_expected_table_version, p_expected_venue_version bigint; trusted customer reason/source |
| close_table_session | same versions plus p_reason text; operator close |
| record_session_cash | same session/versions plus p_receipt_id uuid, p_amount_vnd text, p_reason text; strict positive decimal integer syntax, range, operator-only |
| session_cash_result | p_session uuid, p_receipt_id uuid; scoped operator lookup of safe immutable receipt or null; no bank evidence/raw audit |

Shared private helpers: sprint3_bill; sprint3_funds; sprint3_financial (derived A/DUE/X/status); sprint3_authorize; sprint3_lock_session; sprint3_check_versions; sprint3_project; sprint3_close; sprint3_audit; sprint3_evidence_immutable; sprint3_closed_immutable; sprint3_validate_closed; sprint3_credit_bound; sprint3_ingest_payment_event. Exact signatures are fixed by migrations in the implementation plan. Helpers are not exposed to clients.

Safe projection includes session/table/venue IDs and labels, opening method, allowed customer ID/display name, original start, server_now, ended_at, duration microseconds, billable minutes, hourly snapshot, estimated or final charge, V/A/DUE/X, status/reasons, ACTIVE/CLOSED and released boolean, current versions needed to confirm, can_close/can_record_cash booleans, original closing actor role/correlation and authorized operator actor ID, closure-time financial result. Own view omits unrelated actor/customer directory information, operator reason/private receipt metadata and raw audit/provider/Auth fields. CASH result shows exact receipt/session/amount/time/correlation and collector role; operator may see collector ID. No PUBLIC/anon access.

## 6. Audit and constraints

Extend only BUSINESS action/target whitelists additively: TABLE_SESSION_CLOSED, SESSION_CASH_RECORDED, SESSION_FINANCIAL_CONFLICT; targets session_cash_receipts/session_financial_issues where needed. SYSTEM allowed only for the fixed conflict action, actor null; interactive close/cash actor and role from live DB. New sprint3_audit enforces fixed redacted keys, reuses existing reason rules and writes same-transaction immutable audit. Closing payload records session/table, final amounts, versions, end and correlation; cash records receipt/session/amount/version; conflict only IDs and fixed reason, not raw evidence. Existing audit feed permissions unchanged.

Constraints enforce complete CLOSED shape and arithmetic, no closing data in other states, minimum/positive amounts, no CANCELLED played session, FK binding and append-only receipts/issues. Deferred validator still enforces initial PAYMENT SUCCESS/start/full opening funds for ACTIVE/CLOSED and no MANUAL opening intent. Combined-credit constraint covers both bank and CASH insertion. Closed immutable trigger prevents reopen, changed start/H/end/C/closer/closure snapshot/deletion. A late receipt cannot create ownership or edit final facts.

## 7. UI and recovery

Customer existing `/table-session?session=…` retains pending/QR/cancel behavior and initial countdown. ACTIVE/CLOSED use a shared financial panel: Đang chơi, Xem tiền hiện tại, estimated amount/billing-continues notice, Đóng bàn confirmation, then committed Đã đóng and exact paid/due/management status. Own MANUAL may read but has no close button. Timer only presents initial/overtime status; refreshed DB summary is billing authority. No bank collection promise.

Control Center adds `/sessions` and a Phiên & thu tiền navigation entry for scoped operators; select an existing session from venue records, show safe summary, close or separate CASH flow. Existing `/opening-payments` and Staff limitations remain. STAFF can find disabled-service sessions without MANUAL-open extras. Reuse existing card/row/balances responsive styles, no dependencies or app shell refactor.

Shared panel keeps confirmation's captured versions separate from polling refreshes. No silent stale resubmission. CASH positive integer input => review amount/reason/session => confirm => receipt. Preserve pending economic ID/input across reload via actor/session-specific sessionStorage; these are untrusted command drafts, never evidence. After transport error, read committed close/receipt; if read also fails show unknown outcome and explicit reload, never optimistic success. An ACTIVE read after a failed close means billing continues. Disable confirm while unresolved. A changed actual version requires fresh preview and explicit reconfirm; time-only charge growth accepts the final backend amount. Auth loss uses existing logout/cutoff handling. UI errors are Vietnamese, no CAS/RPC/RLS/lock jargon.

No recovery worker is needed: durable session/receipt reads are sufficient. No retry creates new cash identity or rewrites close cutoff. Deadlock/serialization failures rollback and return recoverable failure; no unbounded automatic mutation retry.

## 8. Traceability and internal review

The implementation plan provides one row for every T01–T62 scenario and exact file/test mapping. This design maps mechanisms as follows:

| Mechanism | Requirements / invariants | Scenarios / oracle |
|---|---|---|
| Exact clock/snapshot/billing | R01–R03/R09; I02–I04/I13 | T02–T05/T08/T35–T36/T42–T44/T49–T50; all 19 duration rows and extra boundaries |
| Funds/immutable evidence/status | R04–R06/R10/R11; I05/I06/I14/I15/I19/I20 | T06–T13/T30–T34/T51/T53–T54/T56/T58–T62; N01–N19 |
| Atomic close/ownership | R02/R07/R12/R14; I01/I07–I09/I12 | T19–T28/T37/T46/T52/T60 |
| Live scope/security/service | R08/R09/R14; I10/I11/I16/I17/I21 | T01/T14–T18/T24/T29/T39–T40/T45/T55/T57 |
| Safe UI/recovery | R10/R12/R13; I15/I18 | T04/T18/T20/T25/T27/T32–T36/T38–T41/T49/T51–T53/T56/T59/T61–T62 |
| Regression/exact scope | R11/R14; I17 | T01/T43/T45/T47–T48; unchanged historical suites plus additive tests |

Internal review: no new business choices, no actual provider/production, no future modules, no material frozen Auth/RLS/cutoff/CAS/audit/opening semantic change. Additive CLOSED validator change preserves rather than erases successful opening evidence. Source authority decision remains only in SPEC. Implementation may proceed after exact Gate 3 plan is committed under current owner authorization. Tests must prove every claim; this document does not claim runtime PASS.
