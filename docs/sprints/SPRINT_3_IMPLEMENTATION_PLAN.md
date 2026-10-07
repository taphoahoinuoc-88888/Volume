# Sprint 3 — Deterministic implementation plan

Status: INTERNALLY REVIEWED — Gates 3/4 complete under owner one-shot authorization; production implementation follows this commit.

- Exact base/Gate 1 main: `69b680da06ae3194f8dcc2bbfffce4eddf30be32`.
- Exact working branch: `checkpoint-3`.
- Technical-design commit: `0b408997cb61bceddbce235c979b6993e4daa497`.
- Approved business SPEC: `813d41c86f937e8407f6080baaa599b669b62eff`; frozen metadata commit `0c2b43a5cc1607b4d7829c5cea16ac318310ad87`.
- Gate 1 PR #5 merged; exact-main runs 37645374334/37645374365/37645374256 SUCCESS. Earlier CI bootstrap PR #6 has four reviewed paths and no runtime business/security change; Gate 1 diff against frozen Sprint 2 is those four plus SPEC only.

## 1. Exact file allowlist

No wildcard authorization. Paths not listed are immutable. No dependency, lockfile, Supabase Auth/Edge config, old migration, seed, Legacy or future-module change.

```text
docs/sprints/SPRINT_3_TECHNICAL_DESIGN.md
docs/sprints/SPRINT_3_IMPLEMENTATION_PLAN.md
docs/sprints/SPRINT_3_RESULTS.md
supabase/migrations/20261007000300_session_closing_contract.sql
supabase/migrations/20261007000400_session_closing_operations.sql
supabase/tests/sprint3_billing.test.sql
supabase/tests/sprint3_security.test.sql
supabase/tests/sprint3_atomicity.test.sql
supabase/tests/sprint2_constraints.test.sql
tests/integration/fixtures/payment.ts
tests/integration/fixtures/session-finance.ts
tests/integration/sprint3-finance.test.ts
tests/integration/sprint3-security.test.ts
tests/integration/sprint3-concurrency.test.ts
tests/e2e/fixtures/session-finance.ts
tests/e2e/sprint3-customer.spec.ts
tests/e2e/sprint3-operations.spec.ts
packages/shared/src/session-finance.ts
packages/shared/src/session-finance.test.ts
packages/shared/src/SessionFinancePanel.tsx
packages/shared/src/table-payment.ts
apps/customer/src/features/tables/TableSessionPage.tsx
apps/control-center/src/features/sessions/SessionsPage.tsx
apps/control-center/src/App.tsx
apps/control-center/src/components/Shell.tsx
scripts/check-sprint3-scope.py
.github/workflows/sprint3.yml
.github/workflows/sprint1a.yml
.github/workflows/sprint1b.yml
.github/workflows/sprint2.yml
```

| Path | Action | Purpose |
|---|---|---|
| docs/sprints/SPRINT_3_TECHNICAL_DESIGN.md | create | Exact additive design, compatibility, security and scenario mechanisms. |
| docs/sprints/SPRINT_3_IMPLEMENTATION_PLAN.md | create | Exact scope, sequence and complete traceability; additions recorded before modification. |
| docs/sprints/SPRINT_3_RESULTS.md | create | Candidate verification/final review and immutable closure ledger reference; never premature PASS. |
| supabase/migrations/20261007000300_session_closing_contract.sql | create | CLOSED fields, two immutable evidence tables, CHECKs/RLS/grants/indexes and immutable guards. |
| supabase/migrations/20261007000400_session_closing_operations.sql | create | Exact billing, funds/projections, close/CASH, neutral conflict recording, audit and compatibility validation. |
| supabase/tests/sprint3_billing.test.sql | create | Exact duration and money oracle, conservation, precision and overflow assertions. |
| supabase/tests/sprint3_security.test.sql | create | New RLS/grants/constraints/immutable records and approved entity scope. |
| supabase/tests/sprint3_atomicity.test.sql | create | Real SQL close/CASH atomicity, audit/constraint failure and closed-history guards. |
| supabase/tests/sprint2_constraints.test.sql | modify | Narrow existing eight-entity assertion to explicitly named frozen eight; new test asserts exactly ten total. Retain all 16 original assertions. |
| tests/integration/fixtures/payment.ts | modify | Include the two new FK evidence tables in isolated reset TRUNCATE; no assertion/authorization change. |
| tests/integration/fixtures/session-finance.ts | create | Real Auth/Supabase financial fixtures, safe isolated time setup and deterministic transaction scheduling. |
| tests/integration/sprint3-finance.test.ts | create | Real API continuation/close/billing/MANUAL/CASH/late evidence/status/oracle/recovery. |
| tests/integration/sprint3-security.test.ts | create | Real-token role/scope/revocation/disabled-service/private projection allow-deny matrix. |
| tests/integration/sprint3-concurrency.test.ts | create | Independent transaction close/CASH/ownership/security races, faults and committed-result recovery. |
| tests/e2e/fixtures/session-finance.ts | create | Reuse real backend browser fixtures, authenticate required actors and reset isolated financial cases. |
| tests/e2e/sprint3-customer.spec.ts | create | Actual customer estimate/close/overtime/final status/unknown-result and responsive UX. |
| tests/e2e/sprint3-operations.spec.ts | create | Actual scoped operator CASH/close/debt/excess/unavailable-service/stale/revocation UX. |
| packages/shared/src/session-finance.ts | create | Typed safe projection, input parsing, Vietnamese labels and exact display helpers; no client money authority. |
| packages/shared/src/session-finance.test.ts | create | Input precision, formatting, labels and recovery identity display unit tests. |
| packages/shared/src/SessionFinancePanel.tsx | create | Shared customer/operator estimate-confirm-result and immutable CASH receipt recovery UI. |
| packages/shared/src/table-payment.ts | modify | Add CLOSED to existing session type; retain opening amount/payment helpers. |
| apps/customer/src/features/tables/TableSessionPage.tsx | modify | Connect ACTIVE/CLOSED financial panel, retain pending opening/cancellation and countdown regression. |
| apps/control-center/src/features/sessions/SessionsPage.tsx | create | Scoped existing-session selection and operational financial panel, including disabled service. |
| apps/control-center/src/App.tsx | modify | Add /sessions route using existing live access shell. |
| apps/control-center/src/components/Shell.tsx | modify | Add minimal operator session/collection navigation, no security authority in UI. |
| scripts/check-sprint3-scope.py | create | Exact allowlist, immutable baseline/security/dependencies, secret/future-scope and scenario guard. |
| .github/workflows/sprint3.yml | create | Full candidate/main real Supabase/Auth/DB/API/unit/production-build/browser verification and evidence. |
| .github/workflows/sprint1a.yml | modify | Route scope validation through exact Sprint 3 guard; retain frozen runtime/security suite on candidate HEAD. |
| .github/workflows/sprint1b.yml | modify | Same exact additive scope guard, retained full browser/backend regression. |
| .github/workflows/sprint2.yml | modify | Same scope guard and accurate additive summary; retain full actual-head runtime suites. |

## 2. Exact changes and dependency order

No dependency additions. Reuse installed PostgreSQL/Supabase, React, shared UI styles, pg, Vitest and Playwright. No new infrastructure or real payment adapter.

1. Commit this plan before any implementation. Create executable billing/security/fault and real API scenario tests before their corresponding production slices. Red tests are expected evidence, not PASS.
2. Add contract migration `20261007000300_session_closing_contract.sql`: session closing fields and exact new evidence entities from design §1; replace only the three session CHECKs additively; append audit vocabulary; RLS/privileges/indexes/immutability. Preserve existing ownership indexes and opening payment uniqueness.
3. Add operations migration `20261007000400_session_closing_operations.sql`: private exact math/funds/auth/locking/projection/audit; close and cash RPCs; read recovery; combined-credit bound trigger; additive deferred PAYMENT ACTIVE/CLOSED compatibility; provider-neutral conflict entrypoint. No actual provider/network operation.
4. Implement shared projection/input/display helpers and unit coverage. Wire shared confirmation/recovery panel into customer ACTIVE/CLOSED path and operator /sessions. Add browser cases before each UI slice, preserve prior scenarios.
5. Scope guard names every file, compares against exact Gate 1 base, freezes SPEC and old migrations/security/config/dependencies and prior suites (only two explicitly reviewed test adaptations). CI runs candidate HEAD only. Add sprint3 workflow for checkpoint-3/main/PR main; no targeted mode in acceptance. Retain Chromium/WebKit 1440/390/320, one worker/retries zero, production preview, real local Auth and existing server-only fixture setup.
6. Commit/push meaningful slices; full branch CI. Fix actual defects without assertion weakening. Review complete base...HEAD diff. Open PR only after complete branch green; record exact implementation SHA. Required PR green => normal merge => exact-main full/regression green. Create immutable closure ledger in PR comment with final main SHA (avoids self-referential document hash); results document links that ledger. Any later documentation commit needs its own exact-main verification before closure.

### RPCs and private functions

Public JSONB: own_session_financial(uuid), session_financial(uuid), session_financial_operations(uuid default null); close_own_table_session(uuid,bigint,bigint,bigint,bigint); close_table_session(uuid,bigint,bigint,bigint,bigint,text); record_session_cash(uuid,bigint,bigint,bigint,bigint,uuid,text,text); session_cash_result(uuid,uuid).

Private helpers implement exactly design responsibilities: sprint3_bill(bigint,numeric); sprint3_funds(uuid); sprint3_financial(bigint,bigint,text[]); sprint3_authorize(uuid,boolean,boolean); sprint3_lock_session(uuid); sprint3_check_versions(uuid,bigint,bigint,bigint,bigint); sprint3_project(uuid,boolean); sprint3_close(uuid,bigint,bigint,bigint,bigint,text,boolean); sprint3_audit(text,text,uuid,uuid,text,jsonb,jsonb,text,uuid); sprint3_ingest_payment_event(jsonb); trigger functions sprint3_evidence_immutable(), sprint3_closed_immutable(), sprint3_validate_closed(), sprint3_credit_bound(). Existing private.sprint2_validate_payment_session() receives only ACTIVE/CLOSED compatibility extension in the new migration. Runtime signatures may be narrowed within these exact files if needed, documented before alteration and final review; no generic command engine.

### Narrow frozen-test adaptations (authorized before edits)

- `sprint2_constraints.test.sql`: the old exact total of eight tables describes Sprint 2 scope. Preserve its test as exactly the eight named foundation/Sprint 2 tables; new Sprint 3 test separately requires exactly ten total with both new append-only tables. Existing version count remains six. No behavior/assertion removed, all 136 prior DB assertions retained.
- `fixtures/payment.ts`: reset must truncate new immutable FK children in the same isolated reset transaction before existing parents. Change only that SQL list. Do not use CASCADE to broaden reset, alter Auth fixtures, weaken security or bypass runtime writes.
- Existing E2E login fixture is frozen to Gate 1 content, including the previously reviewed document-load wait. No tests skipped, timeout growth or retry count change.

## 3. Requirement → design → implementation → test families

| Requirements / invariants | Design | Implementation paths | Verification paths |
|---|---|---|---|
| R01–R03/R09; I02–I04/I13 | §2 exact bill/cutoff | both new migrations; session-finance.ts; SessionFinancePanel.tsx; TableSessionPage.tsx | sprint3_billing.test.sql; sprint3-finance.test.ts; sprint3-concurrency.test.ts; sprint3-customer.spec.ts |
| R04–R06/R10/R11; I05/I06/I14/I15/I19/I20 | §1/§3 evidence/conservation/status | both migrations; SessionFinancePanel.tsx; SessionsPage.tsx | sprint3_billing.test.sql; sprint3-finance.test.ts; sprint3-operations.spec.ts |
| R07/R12/R14; I01/I07–I09/I12 | §2/§4 atomic close/CAS/order | both migrations | sprint3_atomicity.test.sql; sprint3-concurrency.test.ts |
| R08/R09/R14; I10/I11/I16/I17/I21 | §4/§5 current authorization/projections | operations migration; App.tsx; Shell.tsx; SessionsPage.tsx | sprint3_security.test.sql; sprint3-security.test.ts; sprint3-operations.spec.ts |
| R10/R12/R13; I15/I18 | §5/§7 safe UI/recovery | session-finance.ts; SessionFinancePanel.tsx; customer/operations pages | shared unit; both Sprint 3 browser files; real finance/security API |
| R11/R14; I17 | §8 retained contracts/scope | scope script; four workflows; results document | complete prior suites + Sprint 3; exact diff/static guard |

## 4. Complete scenario traceability

D=the three new supabase/tests/sprint3_*.test.sql files named individually above (not file authorization); A=the three new API files named above; B=the two new browser files. Executable titles use S3-Txx to distinguish frozen Sprint 2 Txx IDs. A scenario may span multiple tests. Every numerical duration example (19 plus listed extra boundaries) and every N01–N19 financial row is explicitly enumerated in SQL/API tests, not substituted by a few samples. Existing suites prove inherited behavior on the actual new schema.

| SPEC scenario | Required behavior | Design mechanisms | Exact primary executable test file |
|---|---|---|---|
| T01 | Frozen Auth/opening/payment/hold regression unchanged, including 300s inclusive expiry, cancelled-attempt money, MANUAL no fake prepay. New close denies PENDING/CANCELLED and adds ending only for played ACTIVE. Frozen no-overtime Sprint 2 surface is distinguished from explicitly added Sprint 3 behavior, not silently weakened. | Design §§1–8; R14; F01/F03–F04/F06/F11; I02/I17; A08 | tests/integration/sprint3-finance.test.ts |
| T02 | Both opening methods at 0s/1s/59:59/60:00/60:00.001/60:01 produce §5.3 exact M/C and no start change. Early PAYMENT minimum preserved. | Design §§1–8; R01–R04; I02–I04; A01/A02 | tests/integration/sprint3-finance.test.ts |
| T03 | Browser disconnected/worker stopped across hour boundary: ACTIVE retains ownership, estimate accrues overtime from trusted time; no renewal/auto-stop/auto-receipt. | Design §§1–8; R01; I13; A01 | tests/integration/sprint3-finance.test.ts |
| T04 | Abandoned preview/two tabs/lock wait crosses boundary; preview is read-only, time advances; confirm computes actual result without preview backdate or time-only CAS failure. | Design §§1–8; R02/R13; I03/I09/I18; A01/A06 | tests/integration/sprint3-finance.test.ts |
| T05 | Table/venue price edits before activation but after PAYMENT acquire, or during either method's session: original H and initial amount preserved; 90min at H=100001 charges 150002. | Design §§1–8; R03; I02/I03; A02 | tests/integration/sprint3-finance.test.ts |
| T06 | MANUAL closes with zero evidence: 60-minute minimum, full due UNPAID, CLOSED/released, no opening payment/receipt/SUCCESS. | Design §§1–8; R04/R07; I05/I15; A02–A04 | tests/integration/sprint3-finance.test.ts |
| T07 | MANUAL real beneficiary vs NULL walk-in, actor distinct: correct charge, no dummy identity/public claim. Beneficiary self-read allowed when own; USER self-close MANUAL denied, operator close scoped. | Design §§1–8; R04/R08; I02/I10/I16; A03/A05 | tests/integration/sprint3-finance.test.ts |
| T08 | Non-divisible rate, subsecond and minute boundaries, long sessions and bigint limits: exact duration-first/VND-second ceilings or atomic overflow error, no clip or hidden cap. | Design §§1–8; R03; I03/I04; A02 | tests/integration/sprint3-finance.test.ts |
| T09 | Exact initial credit offsets early/minimum and overtime final bill once: N01–N03 numbers and independent close/release correct. | Design §§1–8; R05/R07/R10; I05/I15; A03/A04 | tests/integration/sprint3-finance.test.ts |
| T10 | Partial final settlement before/during/after close: authorized post-close partial updates DUE exactly, no retention of table. Test financial-version conflict separately; pre-close CASH permitted without stopping billing or changing ownership. | Design §§1–8; R05–R07; I05/I09/I12; A03/A04 | tests/integration/sprint3-finance.test.ts |
| T11 | Initial excess offsets later same-session overtime (N04); N05/N06 retain exact X with no refund/free time. Surplus means NEEDS_RESOLUTION; known debt alone does not. | Design §§1–8; R05/R10; I05/I15; A03 | tests/integration/sprint3-finance.test.ts |
| T12 | Cancelled/unmatched/different-session credits cannot be borrowed or rebound; old reference cannot fund/release new owner's session even on same table/venue. | Design §§1–8; R05/R14; I02/I05/I06/I12; A03/A04 | tests/integration/sprint3-finance.test.ts |
| T13 | Forged time/rate/amount/paid/actor/role/venue, malformed input, nonpositive/fractional cash, direct table/receipt/audit mutation and private helper execution: deny/no leakage/partial effects. | Design §§1–8; R03/R06/R08; I03/I04/I10/I14; A02/A05 | tests/integration/sprint3-finance.test.ts |
| T14 | Every §8 five-role action cell: allowed operations succeed; denied operations fail server-side even via direct URL/body. USER self-close only own PAYMENT; no cash/walk-in/other action. | Design §§1–8; R08; I10/I11; A05; confirmed disabled-service rows | tests/integration/sprint3-security.test.ts |
| T15 | MANAGER A/AB and default STAFF A, active/inactive memberships and other venue IDs: only authorized scope; default Staff close/CASH works without manual-open extra; no global read/write. | Design §§1–8; R08; I10/I11; A05 | tests/integration/sprint3-security.test.ts |
| T16 | Own financial summary for all customer-path roles vs other customer/walk-in/public/internal: minimal allowed reads only; no anonymous/private operator records or identity leakage. | Design §§1–8; R08/R10; I10/I16; A05 | tests/integration/sprint3-security.test.ts |
| T17 | Disabled account, missing/wrong-user Auth session, old JWT/old refreshed session after cutoff denied; fresh valid login gets current rights only. | Design §§1–8; R08/R09; I10; A05 | tests/integration/sprint3-security.test.ts |
| T18 | Scope/role/membership revoked between preview and confirmation: frozen serialization/cutoff denies mutation, no success audit, UI clears protected cached data. | Design §§1–8; R08/R12/R13; I10/I11/I18; A05/A07 | tests/integration/sprint3-security.test.ts |
| T19 | Missing/stale multi-row versions, identical updated_at with different version, versions beyond JS safe integer: exact conflict/no mutation/audit; new receipt invalidates financial preview. | Design §§1–8; R12; I09/I18; A04/A07 | tests/integration/sprint3-concurrency.test.ts |
| T20 | Close lost response vs pre-commit failure: authoritative read returns one committed result or ACTIVE; stale mutation retry not new success; billable delay until successful commit. | Design §§1–8; R02/R12/R13; I07/I09/I18; A07 | tests/integration/sprint3-concurrency.test.ts |
| T21 | Two operators close same session/version simultaneously: exactly one end/C/financial result/close audit/release; loser conflict, no second bill. | Design §§1–8; R07/R12; I07/I09; A04 | tests/integration/sprint3-concurrency.test.ts |
| T22 | USER own PAYMENT vs operator close, delayed stale confirmation behind lock: one authoritative committed cutoff, no client timestamp/duplicate close. | Design §§1–8; R02/R08/R12; I07/I09/I10; A04/A05 | tests/integration/sprint3-concurrency.test.ts |
| T23 | Close races two new acquire/MANUAL contenders: old ACTIVE blocks before close commit, at most one new owner afterward, no premature ownership gap. | Design §§1–8; R07/R14; I01/I12; A04 | tests/integration/sprint3-concurrency.test.ts |
| T24 | Close vs maintenance/table disable/venue disable/customer disable: preserve service/start/charge, no re-enable or forgiveness. Management can close existing unavailable session; STAFF with ACTIVE venue membership retains close/settlement authority. | Design §§1–8; R07/R09; I12/I16; A04/A05 | tests/integration/sprint3-concurrency.test.ts |
| T25 | Old close retry after new owner: new session/start/money untouched; old result read only by authorized reader. New key cannot reclose. | Design §§1–8; R07/R12/R14; I01/I07/I12; A04 | tests/integration/sprint3-concurrency.test.ts |
| T26 | Inject audit/constraint/related-row/overflow failure during closing or cash: full record/state/version/release rollback, no success event; no externally received money falsely declared refunded. | Design §§1–8; R06/R12; I04/I08/I09/I14; A07 | tests/integration/sprint3-concurrency.test.ts |
| T27 | Crash/connection loss before commit vs after commit before response: zero or one durable close and exact end/C; restart/retry cannot reuse failed cutoff or create orphan bill. | Design §§1–8; R02/R12; I07–I09; A07 | tests/integration/sprint3-concurrency.test.ts |
| T28 | Repeated close, changed payload with same identity, guessed command identity, current-version terminal close: no double effect/unauthorized disclosure/reopen/reclose. | Design §§1–8; R12; I07/I09/I10; A04/A07 | tests/integration/sprint3-concurrency.test.ts |
| T29 | Close/CASH concurrent with role/scope/account/membership/security mutation: frozen barrier/cutoff guarantees preserved, current authorized actor only, no helper rewrite for convenience. | Design §§1–8; R08/R09/R14; I10/I11/I16/I17; A05/A08; disabled service does not revoke authority | tests/integration/sprint3-security.test.ts |
| T30 | Duplicate transfer under same/new event IDs and distinct receipt races close: exact unique identity/binding, one credit per transfer, persisted money version invalidation, no duplicate audit/settlement. | Design §§1–8; R05/R06/R12; I05/I06/I14; A03/A04 | tests/integration/sprint3-concurrency.test.ts |
| T31 | Conflicting event/transfer payload, nonfinal or reversal notice: no overwrite/rebind/new credit/automatic debit/refund; preserve permitted notice and issue visibility. Unresolved conflicting/reversal/reconciliation evidence means NEEDS_RESOLUTION; unverified data never becomes credit. | Design §§1–8; R05/R06/R11; I05/I06/I14; A03 | tests/integration/sprint3-finance.test.ts |
| T32 | Valid late true credits after CLOSED and table reacquire: N12–N14, due reduced at most to zero, excess retained, old start/end/H/M/C and new ownership unchanged. | Design §§1–8; R05/R10/R14; I02/I05/I06/I12/I16; A03/A04; surplus means NEEDS_RESOLUTION | tests/integration/sprint3-finance.test.ts |
| T33 | Provider unconfigured/down: no working-bank-QR/paid claims; CASH within permitted scope remains available and an otherwise valid close succeeds regardless of provider. | Design §§1–8; R06/R07/R13; I13/I18; A07 | tests/integration/sprint3-finance.test.ts |
| T34 | Transfer processing/ACK timeout or DB failure with 0/partial/full money: no invented receipt/refund, stable evidence recovery; close/release independent of external verification. No new payment-intent expiry policy invented. | Design §§1–8; R06/R07/R12; I05/I08/I13; A03/A07 | tests/integration/sprint3-finance.test.ts |
| T35 | Restart/browser sleep/worker stop spanning hour or close: same start, no free outage, exact elapsed charge; already CLOSED stays frozen. | Design §§1–8; R01/R02/R09/R12; I13/I16; A01/A07 | tests/integration/sprint3-finance.test.ts |
| T36 | Abandoned/forgotten/overnight session bills until actual authorized close; disabled user denied, management assisted close no fake relogin or backdate. | Design §§1–8; R02/R09; I13/I16; A01/A05 | tests/integration/sprint3-finance.test.ts |
| T37 | Forced deadlock/serialization/connection failure: bounded safe same-identity recovery, rollback or one commit, no new cash/receipt/close effect per retry. | Design §§1–8; R12; I08/I09/I13; A07 | tests/integration/sprint3-concurrency.test.ts |
| T38 | Full PAYMENT/MANUAL/walk-in flow: estimate with ongoing-billing notice, confirm, actual closed/released result while unpaid/partial/paid; then cash settlement without reclose. | Design §§1–8; R04/R07/R10/R13; I15/I18; A06; §6.3 anomaly status | tests/e2e/sprint3-operations.spec.ts |
| T39 | All required final fields under own/Staff/Manager/CEO/Admin projections; no public/private leak/raw bank/Auth/directory. Staff new service finance read does not widen frozen opening endpoints arbitrarily. | Design §§1–8; R08/R10/R14; I10/I14/I17; A05/A06 | tests/integration/sprint3-security.test.ts |
| T40 | BUSINESS vs SECURITY feed, trusted closing/collecting actors, safe correlation, redacted new payload, append-only audit, denied/failed actions no success event. | Design §§1–8; R10/R12; I10/I14; A05/A07 | tests/integration/sprint3-security.test.ts |
| T41 | Chromium/WebKit 1440/390/320: readable minute/charge/due/excess, focus/keyboard/no overflow, direct-route denial, offline/unknown/recovery/revocation messages. | Design §§1–8; R13; I18; A06/A07 | tests/e2e/sprint3-operations.spec.ts |
| T42 | Every §5.3 numeric row and N01–N19 finance oracle: exact integer DB/API/unit results; no pre-rounded per-minute rate or fractional-time truncation. | Design §§1–8; R03–R06; I03–I06; A02/A03; §6.3 exact labels | tests/integration/sprint3-finance.test.ts |
| T43 | No repricing at time-of-day/venue/date edits, no tax/fees/promotion/discount/pause/transfer/split-bill mechanics; frozen initial amount unchanged. | Design §§1–8; R03/R11; I02/I03/I17; A02/A08 | tests/integration/sprint3-finance.test.ts |
| T44 | UTC duration across midnight/timezone/DST, subsecond and long downtime: exact elapsed M/C, no business-day reset/display-clock authority or hidden maximum duration. | Design §§1–8; R02/R03/R09; I03/I13; A01/A02 | tests/integration/sprint3-finance.test.ts |
| T45 | All roles including ADMIN/CEO attempt reopen/backdate/refund/waive/correct/delete evidence: denied/absent; debt/excess/notice not falsely resolved. | Design §§1–8; R11; I14/I16/I17; A08 | tests/integration/sprint3-security.test.ts |
| T46 | Independent tables close concurrently; same customer with several legitimate ACTIVE sessions closes exact target only; no new one-ACTIVE-session/customer restriction. | Design §§1–8; R07/R14; I01/I12; A04 | tests/integration/sprint3-concurrency.test.ts |
| T47 | Clean reset plus retained and additive DB/API/unit/browser regressions on candidate; new CLOSED/late-credit/MANUAL cash support proves frozen Auth/RLS/cutoff/CAS/audit/opening evidence compatibility. | Design §§1–8; R14; I17; A08 | tests/integration/sprint3-finance.test.ts |
| T48 | Exact approved paths/diff, no secrets/Legacy/future module; dependency audit/type/lint/build, approved PR/merge and exact-main CI before eventual freeze. No CI workaround/old migration edit. | Design §§1–8; R11/R14; I17; A08; later Gates 3–6 | scripts/check-sprint3-scope.py |
| T49 | Preview at 60:00 → confirm commits 60:00.001: 100001 estimate becomes 101668 committed charge without extra confirmation solely for time. Separate actual receipt/version change still gives stale conflict. | Design §§1–8; R02/R12/R13; I03/I09/I18; A01/A06/A07 | tests/integration/sprint3-finance.test.ts |
| T50 | 60:00.000001 and 61:00.000001 exact ceilings; 24h/30day sessions remain billable without auto-close/cap; initial-ended and overtime-active UI reflect boundary correctly. | Design §§1–8; R01/R03; I03/I04/I13; A01/A02 | tests/integration/sprint3-finance.test.ts |
| T51 | CASH lifecycle eligibility on ACTIVE and CLOSED MANUAL/PAYMENT; after-close N09/N10/N17 succeeds under permission, no fake opening payment. Pending/cancelled hold is not a played-session settlement. ACTIVE CASH succeeds under the same scope; leaves ACTIVE, started_at, ended_at and ownership unchanged and accrual continues. | Design §§1–8; R04/R06; I02/I05/I14/I15; A03/A05 | tests/integration/sprint3-finance.test.ts |
| T52 | Close UNPAID/PARTIAL while provider unavailable: one immediate CLOSED/release, another customer can acquire after commit, collection later does not reacquire or block table. | Design §§1–8; R07; I01/I08/I12/I15; A04/A07 | tests/integration/sprint3-finance.test.ts |
| T53 | Late bank credit or post-close CASH: end/start/H/M/C/closer/closure-time snapshot unchanged, current V/A/DUE/X progresses exactly; new collector attribution separate. | Design §§1–8; R05/R06/R10; I02/I05/I12/I15; A03/A06 | tests/integration/sprint3-finance.test.ts |
| T54 | Distinct CASH and bank credit (N18) serialize/reconfirm under CAS; if both genuinely commit, retain both and surplus. Same economic identity cannot enter twice or become another session's credit. | Design §§1–8; R05/R06/R12; I05/I06/I09; A03/A07; surplus means NEEDS_RESOLUTION | tests/integration/sprint3-concurrency.test.ts |
| T55 | Staff with no extras can close/CASH/read service finances in scope; MANUAL-open/HR extras do not confer new cross-venue/security/price/refund powers. CEO explicit global CASH/close does not imply ACCESS_MANAGE. | Design §§1–8; R08; I10/I11/I17; A05 | tests/integration/sprint3-security.test.ts |
| T56 | CASH preview/confirm, reason/actor attribution, lost ACK, same-key replay, changed-key duplicate attempt handling, audit fault and malicious amount: immutable exact evidence once, no edited bank state or fake success. Gate 2 must define at-most-once identity without guessing identical amounts mean same cash event. | Design §§1–8; R06/R12; I04/I06/I08/I09/I14/I18; A03/A07 | tests/integration/sprint3-finance.test.ts |
| T57 | Disabled venue vs merely disabled table vs disabled customer vs inactive operator membership, each role's read/close/CASH path: decided management close allowed, frozen account/cutoff/scope still enforced. STAFF ACTIVE membership permits close/CASH on existing sessions even when venue/table disabled; inactive membership/account/cutoff denies. New opening remains denied. | Design §§1–8; R08/R09; I10/I12/I16; A05/A07 | tests/integration/sprint3-security.test.ts |
| T58 | Excess only, notice only, both, outstanding due plus notice, excess absorbed by later active overtime: V/A/DUE/X conserved and issues visible, close/release independent, ordinary known debt UNPAID/PARTIAL; unresolved anomaly NEEDS_RESOLUTION even with debt; excess-only display follows current excess, independently unresolved evidence remains flagged; no fake resolve action. | Design §§1–8; R05/R07/R10/R11; I05/I12/I14/I15; A03/A06 | tests/integration/sprint3-finance.test.ts |
| T59 | ACTIVE PAYMENT and MANUAL receive CASH under each authorized role: exact immutable V increment, actor/venue/audit, provisional balances only; advance past minute boundary then close and verify full elapsed charge. started_at unchanged; no ended_at, release or frozen charge from CASH. Deny USER/cross-venue/inactive actor. | Design §§1–8; R06/R08/R12; I05/I08/I10/I20; A03/A05/A07 | tests/integration/sprint3-finance.test.ts |
| T60 | ACTIVE CASH races with close, service disable and replay: permitted serialized receipt appears once either before closure snapshot or in later current settlement; final cutoff only from close. Stale CAS fails/refreshes, rollback creates no receipt/audit; disabled service alone does not revoke actor. | Design §§1–8; R06–R09/R12; I08/I09/I12/I20/I21; A04/A05/A07 | tests/integration/sprint3-concurrency.test.ts |
| T61 | Ordinary closed bills V=0 and 0<V<C yield UNPAID/PARTIAL with exact remaining_due, never NEEDS_RESOLUTION solely for debt. Exact ordinary CASH yields PAID. Surplus, valid late provider money, conflicting evidence and unresolved reconciliation yield NEEDS_RESOLUTION with reason; debt stays visible when coexisting. | Design §§1–8; R05/R06/R10/R11; I05/I15/I19; A03/A06 | tests/integration/sprint3-finance.test.ts |
| T62 | ACTIVE excess-only issue is fully absorbed by overtime: current X=0 and no independent issue gives ordinary provisional label, preserving receipts. Repeat with unresolved provider conflict/late-money issue: NEEDS_RESOLUTION persists even at X=0. Duplicate valid evidence alone adds no anomaly; no deferred resolve/refund button exists. | Design §§1–8; R01/R05/R10/R11; I05/I06/I14/I19; A01/A03/A06 | tests/integration/sprint3-finance.test.ts |

## 5. Verification, risks and freeze

Required: allowlist/secret/future-scope guard; dependency audit; typecheck/lint/production build; clean reset; migration compatibility; DB constraints/grants/RLS/precision; real Auth/API role scope/cutoff/CAS; independent close/CASH/provider/security races; audit/constraint rollback; connection/unknown-result recovery; all six browser projects. No skipped/not-run/flaky/failing required test is PASS. Report actual counts, retaining at least historical 136 DB/80 integration/27 unit/114 browser coverage.

Test fixtures may construct historical ACTIVE timestamps coherently under isolated database owner setup, as existing regressions do. Never expose this ability in RPC/UI or disable production authorization to make an allow/deny test pass. Controlled SQL transactions test atomicity/lock schedules; real Auth HTTP tests separately prove identity and authorization. No mocks substitute for required real integration/browser outcomes.

Post-merge closure ledger records SPEC/Gate 1/design/plan/implementation/main SHAs, PR, exact changed files, migrations/functions, actual counts, CI URLs, deviations and limitations. Bank integration and production deployment explicitly NOT claimed. No Sprint 4. Final owner notification only after CLOSED/FROZEN or a genuine material blocker.

## 6. Allowlist additions

None at initial review. Record exact path/reason/required SPEC reference and frozen impact here BEFORE any necessary addition, then continue under owner-authorized narrow scope rules.

Internal review passed: all 62 scenario IDs mapped; initial exact 30-path scope, no dependencies/old migrations/Legacy/future modules; design proof obligations translated into tests; implementation authorized by current owner package. Runtime verification remains NOT RUN until recorded evidence exists.
