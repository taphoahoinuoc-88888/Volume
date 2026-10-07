# VOLUME V2 — Sprint 3 SPEC

Status: **OWNER DECISIONS Q01–Q16 INCORPORATED — GATE 1 ONLY — THREE NARROW CLARIFICATIONS REMAIN**
Revision: 2 — owner decision update; SPEC approval still pending
Date: 2026-10-07
Repository: `HAD10202/Volume`
Verified frozen base: `1b6f713a990aabb4f705d5f0735856442a59b7db`
Document-only branch: `sprint3-spec`
Exact change allowlist: **update `docs/sprints/SPRINT_3_SPEC.md` only**.

This revision incorporates the owner's explicit Q01–Q16 business decisions. It is not yet an owner-approved/frozen SPEC, technical design, implementation plan or authorization to code. Decided behavior is binding; only B01–B03 in §12.1 remain unresolved. Do not invent their answers. Finish Gate 1 clarification and obtain explicit SPEC approval before Gate 2. No production or executable test files are authorized.

## 1. Owner authority decision and process boundary

**OD-01 — Owner confirmed 2026-10-07:** the following order supersedes older source-order statements only where they conflict:

1. Current explicit owner instructions and owner-approved decisions.
2. `AGENTS.md` procedural/security guardrails.
3. Owner-approved/frozen SPEC or Sprint contract for the currently active Sprint.
4. `docs/blueprint.yaml`.
5. Permissions / architecture / ADR documents.
6. Frozen contracts from earlier Sprints.
7. Legacy/F6.1 as reference only.

This resolves authority ordering only. It does **not** reopen, weaken, or alter frozen Sprint 1/2 business or security behavior. Auth, RLS, session revocation, CAS, audit, permission and venue/self scope remain binding. A Sprint 3 approval cannot silently override earlier frozen architecture/security. Q16 authorizes a compatibility review and requires Gate 2 to identify exact additive changes after SPEC approval. A material prior-behavior change still requires a separately scoped maintenance/deviation approval before implementation; review authorization is not permission to weaken a frozen guarantee. Report any further unresolved conflict and stop; do not choose silently.

OD-01 is recorded only in this document. Historical `AGENTS.md`, Blueprint, ADRs and Sprint contracts remain untouched. Their chronological Sprint 0/1/pre-merge status snapshots are interpreted using the verified subsequent closure evidence, not rewritten. The Sprint 2 contract itself identifies G3–G6 and minimum operational G7 as closed; G8 closing/billing remains open.

**OD-02 — Current authorization:** Gate 1 only; update this existing file with the Q01–Q16 decisions, complete the oracle and all dependent requirements/tests, preserve a GitHub handoff, and stop for owner review. No implementation, migrations, RPCs, UI, dependencies, CI implementation, technical-design document, implementation-plan document, Sprint 4 work, merge or deployment is authorized by this task. Tests are written as cases in this SPEC; executable tests are not created in Gate 1.

**OD-03 — Sprint 3 owner decisions:** the current owner message resolves Q01–Q16 as recorded in §5. These explicit decisions authorize the new business behavior for specification, not implementation or an automatic SPEC freeze. The former 16-question list is replaced by the decision ledger and only three genuinely narrower clarifications in §12.1. No old question is reopened.

After blockers are resolved, owner must approve the completed SPEC before Gate 2. Gate 2 must define exact technical contracts; Gate 3 must define branch/base, exact paths/purposes, dependencies, migrations, functions, UI, CI and requirement-to-code-to-test mapping; Gate 4 must authorize implementation. Approval of a draft, branch publication or earlier Sprint does not pass those gates.

## 2. Independently verified baseline and evidence

GitHub was read directly, including `branches/main`, repository tree, PR metadata, closure ledger, Actions run metadata, Sprint 2 job steps and decoded job logs. For this revision, main was rechecked and still matches the expected SHA; `sprint3-spec` was verified at prior document commit `65562f1c9f3adc0001b1c089ceeed858696e283c` before editing. Repository tree has one root `AGENTS.md` and no existing `SPRINT_3_SPEC.md` at this base.

| Evidence | Verified result / source |
|---|---|
| Main | `1b6f713a990aabb4f705d5f0735856442a59b7db`; tree `396a3175c9437c478634f5670a61ee566a03ef81` |
| Sprint 1A | [PR #1](https://github.com/HAD10202/Volume/pull/1) merged, closure recorded; final closure main `1910394b2c446c031109da6f170ead83169ff015`; later read maintenance incorporated before 1B |
| Sprint 1B | [PR #3](https://github.com/HAD10202/Volume/pull/3) merged, CLOSED/FROZEN; frozen main `2b47f0a619f494a811c94e41697f7d09dcb19e3a` |
| Sprint 2 | [PR #4](https://github.com/HAD10202/Volume/pull/4) merged to the expected main; reviewed implementation `e82989cdaa2590b1a63594cbde9c963715aa8fbb`; 45 changed files |
| Sprint 2 frozen contract | `fd3400aa93f2c365d422b2a50b2a66ee039621dd`, as recorded in implementation plan/results; 36 invariants / 90 contract cases |
| Sprint 2 closure | [Closure ledger](https://github.com/HAD10202/Volume/pull/4#issuecomment-6035524115) explicitly supersedes the pre-merge status in `SPRINT_2_RESULTS.md` |
| Sprint 2 post-merge CI | [37602673872](https://github.com/HAD10202/Volume/actions/runs/37602673872), push on exact expected main, completed SUCCESS |
| Checkpoint 1A regression | [37602673930](https://github.com/HAD10202/Volume/actions/runs/37602673930), push on exact expected main, completed SUCCESS |
| Checkpoint 1B regression | [37602673967](https://github.com/HAD10202/Volume/actions/runs/37602673967), push on exact expected main, completed SUCCESS |

Sprint 2 job `112730582567` logs independently confirm **136 DB assertions / 13 files; 80 integration tests / 11 files; 27 unit tests / 3 files; 114 Playwright tests**, all passed. Job steps confirm allowlist/secret checks, dependency audit (0 vulnerabilities), typecheck, lint, clean stack/reset, JWT-verified Edge readiness and production build success. Chromium/WebKit widths are 1440/390/320. The failure-only diagnostic step was conditionally skipped because the job succeeded; this is not a skipped required test.

These are historical baseline results, **not Sprint 3 execution evidence**. No runtime suite is run or claimed PASS for this document. Real bank/provider integration, production deployment and physical iPhone/Safari certification are not implied by baseline CI.

### Sources read at the frozen SHA

- `AGENTS.md`; `docs/blueprint.yaml`; `docs/permissions.md`; `docs/architecture.md`; `docs/OPEN_QUESTIONS.md`.
- `docs/decisions/ADR-001-identity-role-scope.md`, `ADR-002-enforcement-revocation-audit.md`, `ADR-003-repository-sprint-gates.md`, `ADR-004-auth-version-checkpoints.md`.
- `docs/sprints/SPRINT_1.md`, `SPRINT_1A_RESULTS.md`, `SPRINT_1B_RESULTS.md`, `SPRINT_2_BUSINESS_CONTRACT.md`, `SPRINT_2_IMPLEMENTATION_PLAN.md`, `SPRINT_2_RESULTS.md`.
- `supabase/migrations/20261007000100_table_payment_contract.sql`, `20261007000200_table_payment_operations.sql`; `packages/shared/src/table-payment.ts`; Sprint 2 workflow and closure evidence above.

Source paths here resolve against the frozen base, not a moving branch. Legacy rules were not used to fill missing decisions.

## 3. Product objective, users and scope

**Problem:** Sprint 2 safely opens a table and records the initial payment or MANUAL override, but cannot yet end play, determine the final bill or return an occupied table to service. Staff and customers need a clear, recoverable way to finish a session without losing money, charging twice or releasing the wrong table.

**Users:** the authenticated customer; authorized venue operators; ADMIN/CEO for permitted business oversight; MANAGER within assigned venues. STAFF may close and record CASH within the approved venue scope; USER may close only their own authenticated PAYMENT session. The disabled-venue operator edge is B03. Walk-ins have no fabricated account or anonymous private access.

**Success:** an authorized close freezes the end and exact charge, creates the financial result and releases the table in one committed transaction, even when unpaid. The charge is reproducible, money is conserved and later settlement cannot reopen or reclaim the table. Concurrent/retried requests cannot duplicate charges, receipts, closure or release. A non-technical user can tell whether play continues, whether a result is merely an estimate, what is owed, and whether the action actually completed.

### IN SCOPE for this specification

- Continuation after the initial 60 minutes and the event that ends billable time.
- Closing PAYMENT and MANUAL sessions, including existing active sessions and nullable-customer walk-ins.
- Final session charge, treatment of the initial payment and additional money, safe release, and resulting session/financial record.
- Current-state reads, actor/scope rules, failures, races, retries, audit and acceptance tests for this lifecycle.
- CASH as immutable, audited, operator-recorded financial evidence; partial settlement; truthful provider capability visibility.
- Only remaining clarifications B01–B03; compatibility review boundary for the later Gate 2.

### OUT OF SCOPE for this task

- All production implementation and executable test files; Gate 2/3 artifacts; any edits outside this exact file.
- Rewriting Auth/RLS/cutoff/CAS/audit, old migrations, historical contracts, Legacy or existing CI to accommodate the draft.
- Real bank/provider integration, webhook deployment, secrets, production hosting/SMTP/domain or live money operations.
- New architectures, permission engines, event buses, Redis, microservices, duplicate occupancy/balance stores, speculative modules.

### DEFERRED / EXCLUDED — owner confirmed Q12–Q15

- Player/Match/Video/Tournament/Shop/Telegram/CRM/AI; physical lighting/table hardware control; invitations/identity linking.
- Accounting revenue/profit dashboards, business-day aggregates, fiscal/tax invoice integration, exports and production retention/backup policy.
- Discounts, promotions, tax/service fees, pause/resume, table or beneficiary transfer, split bills, reopen, backdate, debt waiver, arbitrary invoice correction, refund execution and reversal/chargeback resolution. No schema/UI preparation for these.

Deferring a refund *action* must not discard an excess credit or hide an unresolved obligation. Deferring a report does not remove the requirement to show the individual session's financial outcome. Continuation and charging are explicitly resolved by Q01–Q06 below.

## 4. Known inherited facts — binding, not proposals

| ID | Frozen fact | Source anchor | Regression case |
|---|---|---|---|
| F01 | One Auth identity/profile; five roles; live account/session/cutoff authority; role/scope/extras read from DB. Disabled accounts cannot use private/own finance. | Sprint 1 contract, ADR-004, 1A results/session boundary | T01, T14–T18 |
| F02 | Global ADMIN/CEO business scope; MANAGER/STAFF active venue membership; USER self/public only. Extras never widen venue scope. | Permissions; Sprint 2 §8 | T14–T18 |
| F03 | Eight existing business entities: four foundation entities plus tables, sessions, payments, receipts. Occupancy is derived, never a table busy/free authority. | Sprint 2 plan §1–3; migrations | T01, T23–T25 |
| F04 | One live hold or ACTIVE owner per table; one PENDING_PAYMENT hold per customer globally. This does not assert one ACTIVE session per customer. | Sprint 2 I01/I29; unique indexes | T01, T23, T46 |
| F05 | Online opening requires the initial 60-minute amount equal to the authoritative hourly-price snapshot at acquire; integer VND, no added fees/taxes. Later table price does not mutate that snapshot. | Sprint 2 owner item 5, I07/I35 | T02, T05, T08 |
| F06 | PAYMENT start equals first committed server enough-validated-funds transition; provider time is evidence only. Hold deadline is acquired_at +300s; receipt and serialized processing both <= deadline, with no resurrection after cancellation. | Sprint 2 §6, I14/I36 | T01, T02, T12, T32 |
| F07 | MANUAL starts immediately at server time for the initial 60-minute period, bypasses online prepay, has actor/reason/audit, and creates no fake payment/receipt/SUCCESS. Its stored prepaid_minutes=60 is not proof of payment. | Sprint 2 §4, I32/I33; migrations | T06, T07 |
| F08 | MANUAL beneficiary is an existing validated customer or NULL walk-in; actor is distinct from beneficiary. NULL is not public/self ownership or future account linking. | Sprint 2 §4/§8 | T07, T16 |
| F09 | At countdown zero the current implementation keeps ACTIVE and occupancy; no extra charge, extension, settlement, auto-close or release. Closing is explicitly deferred to Sprint 3. | Sprint 2 owner item 10; §3/§6; T62 | T02, T03 |
| F10 | Opening payment SUCCESS proves initial opening payment only. Unique append-only CREDIT receipts determine received funds; non-credit notices are not money. Excess is retained/flagged, with no automatic extension/refund/reallocation. | Sprint 2 §4/§5/§10, I08–I18 | T09–T12, T30–T32 |
| F11 | Cancel/expiry/QR failure affect pending holds, not ACTIVE play. Unresolved cancelled-attempt money never owns a table or funds a new attempt automatically. | Sprint 2 I15/I18/I30/I31; cancellation RPC | T01, T12, T25 |
| F12 | Account/venue/table invalidation terminalizes pending holds, preserves money, and does not auto-close ACTIVE. Re-enable never resurrects the old hold. | Sprint 2 §4/§11; invalidation trigger | T24, T29 |
| F13 | Existing-row interactive writes require bigint expected versions, live authorization under lock, atomic audit and version increments; stale retries reject. Create-command replay and provider dedupe are distinct from stale mutable-command success. | AGENTS version contract; Sprint 2 §9–11 | T19–T22, T26–T28 |
| F14 | No direct client mutable-table/receipt/audit writes, no client service-role, no public/private Auth fields. Own, Staff-minimal, management and audit projections remain distinct. | Sprint 2 §8; RLS/grants/definers | T13–T18, T39, T40 |
| F15 | Provider is neutral/unconfigured. JWT-verified Edge preparation fails safely and releases a pending attempt; actual bank QR/signature/finality/replay not certified. | Sprint 2 results and closure limits | T33, T34, T41 |
| F16 | Shared Sprint 2 barrier interoperates with frozen security writer's exclusive barrier; ordered row locking and unique constraints protect ownership. Correctness does not depend on UI/worker availability. | Sprint 2 plan §10; operations migration | T22–T29, T35–T37 |

F01–F16 describe the frozen baseline. New Sprint 3 continuation/closing/settlement and Staff operational reads are explicit current owner additions, not inferred changes to existing Sprint 2 endpoints or evidence. F09 remains the historical Sprint 2 limit; Q01–Q06 now specify the approved new overtime behavior. MANUAL is still not prepaid; opening SUCCESS still is not final settlement. Any conflict uncovered in the additive design invokes Q16/M01.

## 5. Owner decision ledger and business requirements

### 5.1 Q01–Q16 — decisions received, not open questions

| ID | Owner decision incorporated | Coverage |
|---|---|---|
| Q01 | Continue automatically beyond the initial 60 minutes. No renewal button, grace, automatic stop or business maximum duration. Show initial period ended and overtime active. Browser timers/notifications never enforce correctness. Exactly 60:00 has no extra charge; any positive fraction beyond it starts minute 61. | R01; T02–T03/T35/T50 |
| Q02 | Stop billing only through a successful committed authorized backend/database close. ended_at is authoritative server/database time. Preview is an estimate and does not stop time. Confirmation recalculates at current authoritative time; time-only increases are accepted as the committed result, never backdated to preview. Network/queue delay before commit is billable. Lost response recovers by reading the committed result. | R02/R12/R13; T04/T19–T22/T27/T49 |
| Q03 | Every opened session has a 60-minute minimum. Early PAYMENT close charges the full initial snapshot; unused minutes are not automatically refunded. Excess remains visible; no refund execution. | R03; T02/T09/T11 |
| Q04 | Entire session uses its original authoritative hourly snapshot: PAYMENT at acquire; MANUAL at opening. No later price/time-of-day/day/venue change reprices it. Do not recapture a different PAYMENT price when payment later activates. | R03; T05/T43–T44 |
| Q05 | Started-minute rule: billable_minutes=max(60,ceil(duration_seconds/60)); charge=ceil(hourly_snapshot_vnd*billable_minutes/60). Integer VND; no authoritative floating point. No grace or maximum duration business rule. | R03; oracle §5.3; T08/T42/T50 |
| Q06 | MANUAL/walk-in uses the same minimum/snapshot/rounding/overtime. MANUAL is not prepaid and creates no fake opening payment or SUCCESS receipt. Collect/settle its actual final charge independently. | R04; T06–T07/T51 |
| Q07 | Only validated immutable funds bound to the exact same session/payment relationship offset its charge. Initial PAYMENT money and its excess offset same-session overtime. Applied never exceeds charge; surplus remains unresolved_excess. Valid late funds after CLOSED may reduce same-session due but never change start/end/charge/ownership or reopen. No borrowing/rebinding. | R05; §5.4; T09–T12/T30–T32/T53–T54 |
| Q08 | Two allowed settlement methods: verified provider/bank credits when a real adapter exists, and CASH recorded by an authorized operator. No false online availability. CASH is DB-authorized, integer VND, actor/venue-scoped, preview/confirm, audited and immutable evidence; never fake bank SUCCESS. Partial settlement allowed; no automatic refund/reversal. Cash timing clarification B02 remains. | R06; T10/T13/T30–T34/T51–T56 |
| Q09 | Settlement is NOT a close/release prerequisite. One committed close freezes ended_at/final charge, records finances, sets played session CLOSED and releases ownership immediately. Unpaid/partial CLOSED sessions never hold the table. Financial status separately uses PAID/PARTIAL/UNPAID/NEEDS_RESOLUTION; exact exception precedence is B01. New acquire only after close commit. | R07; T21–T25/T52/T58 |
| Q10 | USER own safe reads/preview and close of own authenticated PAYMENT only, no cash/other/walk-in access. STAFF assigned active venue operational finance reads/close/CASH, no price/waiver/refund powers. MANAGER equivalent operations and full operational venue visibility; CEO/ADMIN explicit global close/CASH/business visibility. Nobody edits protected time/snapshot/bank/receipt evidence. No generic permissions builder. | R08; §8; T14–T18/T29/T39–T40/T55–T57 |
| Q11 | Disabling account/venue/table changes neither historical start nor debt and does not auto-close ACTIVE. Disabled customer has no private self-service; authorized management can still close existing sessions. Abandoned/overnight/forgotten sessions bill until actual authorized close. Downtime adds no free time. Optional long-session warning is not close authority. Disabled-venue Staff/CASH edge is B03. | R09; T24/T29/T35–T36/T57 |
| Q12 | Approve minimum final record in §8.2 and scoped visibility. USER own safe summary; STAFF/MANAGER venue operational projection; CEO/ADMIN business projection; public none. No fiscal integration, downloadable accounting document or revenue dashboard required. | R10; T38–T41 |
| Q13 | Defer reopen/backdate/waive/discount/refund execution/reversal or chargeback resolution/arbitrary corrections. Preserve visible debt/excess; no fake resolution-completed button. | R11; T31–T32/T45/T58 |
| Q14 | Defer pause/resume, table transfer, beneficiary transfer and split bill. No speculative schema/UI. | R11; T43/T48 |
| Q15 | Table-time billing, VND only. No tax/service fee/promotions/discount/revenue/profit/business-day/fiscal features. Frozen Sprint 2 opening amount unchanged. | R03/R11; T43/T48 |
| Q16 | Compatibility review authorized; after SPEC approval Gate 2 identifies exact additive ending/billing changes. No blanket change to frozen foundations/opening semantics/history. If material change required, STOP for separately scoped maintenance/deviation approval before implementation. Never edit frozen migrations. | R14; §13; T47–T48 |

Q01–Q16 above are recorded decisions, not approval of this complete revised SPEC. B01–B03 do not reopen the decided formula, minimum, start, cutoff policy, allowed payment methods, base role powers or release-before-settlement rule.

### 5.2 Requirement register

| ID | Binding Sprint 3 requirement | Source / remaining dependency | Acceptance/tests |
|---|---|---|---|
| R01 | ACTIVE play continues without renewal; derive initial/overtime presentation from server time and original start. No clock-boundary automatic mutation, grace or maximum play duration. | Q01 | A01; T02–T03/T35/T50 |
| R02 | Commit-authoritative end; preview never freezes time. Confirmation uses current server cutoff and formula; temporal price increase alone does not require a second preview/confirmation. No client/preview backdate. | Q02 | A01–A02/A06; T02/T04/T20/T35–T36/T49 |
| R03 | Uniform 60-minute minimum and original hourly snapshot, started-minute duration rounding followed by whole-VND ceiling; exact arithmetic with safe overflow failure, never a hidden duration cap. | Q03–Q05/Q15 | A02; T02/T05/T08/T42–T44/T50 |
| R04 | Apply R03 equally to PAYMENT, MANUAL and NULL-beneficiary walk-in; MANUAL amount received starts at zero absent real financial evidence. | Q06 | A02–A03; T06–T07/T51 |
| R05 | Conserved same-session funds, derived application/due/excess; immutable financial identities/bindings, no double counting. Post-close receipt affects only financial settlement. | Q07; B01 status mapping only | A03; T09–T12/T30–T32/T53–T54 |
| R06 | Audited immutable CASH recording by authorized roles; partial settlement; verified bank credit only through configured trusted provider. No fake bank state or unavailable online offering. | Q08; B02 cash lifecycle; B03 unavailable venue CASH | A03/A05/A07; T10/T13/T30–T34/T51–T57 |
| R07 | ACTIVE→CLOSED atomically freezes end/charge, records financial snapshot, releases ownership independent of due/excess/status. No collect-first or later separate release action. | Q09 | A04; T21–T25/T26/T34/T52/T58 |
| R08 | Enforce explicit role/self/venue action matrix under current Auth/cutoff, not UI or opening permission. USER self-close PAYMENT only; Staff close/CASH are role defaults within approved scope, not manual-open extras. | Q10; B03 exception scope | A05; T14–T18/T29/T39–T40/T55–T57 |
| R09 | Disabled/abandoned/overnight/downtime cases keep historical start and bill through authorized close; management assistance without disabled-user bypass. | Q11; B03 narrow operator edge | A01/A05/A07; T24/T29/T35–T36/T57 |
| R10 | Durable final session facts and closure-time financial result plus current settlement view with safe audit/correlation. Approved minimum fields, separate immutable charge vs later financial updates, no fiscal/reporting expansion. | Q12; B01 exact status enum projection | A03/A06; T09–T12/T38–T40/T53/T58 |
| R11 | Deferred operations remain absent/denied for every role; unresolved funds/debt remain visible and never falsely cleared. | Q13–Q15 | A06/A08; T31–T32/T43/T45/T48/T58 |
| R12 | Atomic close/CASH/audit/version effects; at-most-once close and receipt effects; live auth and stale-CAS rejection, same-identity recovery. No fictitious atomic transaction with a bank. | Q02/Q08–Q09/Q16 | A04/A07; T19–T30/T34/T37/T54–T56 |
| R13 | One understandable flow: estimate and billing-continues notice → authorized confirm → committed actual result; cash amount confirmation separate; unknown outcome is not success. | Q02/Q09/Q12 | A06–A07; T04/T18/T20/T33/T38–T41/T49 |
| R14 | Additive, explicitly reviewed compatibility; no frozen migration edit, no weakened opening/security/history invariant or speculative module. Test old opening + new end + old callback/new owner together. | Q16 | A08; T01/T12/T23–T25/T32/T46–T48 |

### 5.3 Exact time and charge oracle

Let H be the original hourly snapshot in integer VND; D be the exact nonnegative duration between authoritative ended_at and original started_at. Do not truncate fractional seconds before rounding.

- M = max(60, ceil(D / 60 seconds)).
- C = ceil(H × M / 60), in VND.
- Round duration first, then the total charge; do not round a per-minute price and multiply.
- Exact nonnegative integer form for the charge: (H × M + 59) div 60. Intermediate arithmetic must not overflow before final range validation.
- Example integer duration evaluation at microsecond precision: M=max(60,(duration_microseconds+59,999,999) div 60,000,000). This is an exact mathematical illustration, not a selected schema/runtime clock design.
- Negative duration, malformed numbers, zero/negative rate or amount overflow fail atomically. Representational bounds are not a business maximum-duration rule and cannot silently clip time or money.
- Q02 means only a successful committed close creates a final ended_at/charge. Gate 2 must explain and prove the DB cutoff/commit semantics, including lock waits; it cannot silently substitute browser receipt time, preview time, transaction-start time or a failed attempt's time. No implementation has been chosen here.

All inputs below use H=100,001 VND. Each row applies equally to PAYMENT and MANUAL/walk-in.

| Duration D | M, billable minutes | C, final charge VND |
|---|---|---|
| 0s | 60 | 100,001 |
| 1s | 60 | 100,001 |
| 59:59 | 60 | 100,001 |
| 59:59.999999 | 60 | 100,001 |
| 60:00 | 60 | 100,001 |
| 60:00.000001 | 61 | 101,668 |
| 60:00.001 | 61 | 101,668 |
| 60:01 | 61 | 101,668 |
| 60:59.999999 | 61 | 101,668 |
| 61:00 | 61 | 101,668 |
| 61:00.000001 | 62 | 103,335 |
| 89:59.999999 | 90 | 150,002 |
| 90:00 | 90 | 150,002 |
| 90:00.000001 | 91 | 151,669 |
| 119:59.999999 | 120 | 200,002 |
| 120:00 | 120 | 200,002 |
| 120:00.000001 | 121 | 201,669 |
| 24 hours | 1,440 | 2,400,024 |
| 30 days | 43,200 | 72,000,720 |

The eight owner-supplied examples are retained exactly. Additional rows are arithmetic consequences, not new pricing decisions. At exactly 60 minutes the initial period has ended but overtime charge is zero; the first positive fraction after that boundary bills minute 61.

Further deterministic cases:

| Scenario | Required numerical outcome |
|---|---|
| Preview at 60:00, committed close at 60:00.001, H=100,001 | Estimate 100,001; committed M=61 and C=101,668; no preview backdate or automatic reconfirm loop solely for elapsed time |
| Failed close at 60:00; successful retry at 61:00.000001 | Failed attempt stores no end/bill/release; successful close M=62, C=103,335 |
| PAYMENT acquire snapshot 100,001, table edited to 120,000 before/after activation; close at 90:00 | C=150,002, using original acquired snapshot; initial opening amount unchanged |
| MANUAL opens at snapshot 100,001; table edited later; close at 90:00 | C=150,002, zero prepaid credit absent actual evidence |
| 23:30 start → 01:00 next day, same timezone with no offset transition, H=100,001 | Actual D=90min, M=90, C=150,002 |
| Display timezone changes while same UTC instants remain | Same D/M/C; no repricing or business-day reset |
| UTC elapsed 120 minutes despite local daylight-saving display jump | M=120, C=200,002; actual elapsed instants govern |
| Browser sleeps or server is down for part of a 120-minute session | M=120, C=200,002; no downtime deduction |
| H=1 VND, 60:01 | M=61, C=2; no zero-priced overtime from truncation |
| H=100,000 VND, 60:01 | M=61, C=101,667 |
| H=9223372036854775807 VND, M=60, where existing rate domain permits | Mathematical C=9223372036854775807; intermediate multiplication must not wrap |
| Same H, M=61 | Mathematical C=9377094904135688738, beyond signed bigint; safe range failure if using that bound, no cap/wrapped bill/partial close |

### 5.4 Funds, application and financial oracle

Define V as total unique validated same-session credits: trusted provider credits plus committed authorized CASH evidence. A CASH receipt is not a bank/provider receipt. No duplicate economic event counts twice. Pending/unverified bank notices and screenshots are not V. A reversal/chargeback notice does not subtract previously recorded credit automatically; preserve evidence and display the unresolved issue.

For a final charge C:
- applied_amount A=min(V,C).
- remaining_due DUE=C−A.
- unresolved_excess X=V−A.
- A,C,V,DUE,X are nonnegative integer VND, with A≤C.
- Conservation: V=A+X and C=A+DUE.
- Pre-close monetary reads use the same formula against an explicitly labelled current **estimate** only. They never claim a final charge/settlement freeze.
- After CLOSED, C/start/end/M/H/closing actor/ownership outcome are immutable. New valid same-session receipts change V/A/DUE/X and current settlement only; preserve the financial snapshot originally recorded at close as historical evidence.
- Exact primary settlement-status treatment of X or notice flags remains B01; numeric amounts do not depend on that label choice.

All rows below use H=100,001. Every successful close releases ownership immediately, including due/excess/review cases; AVAILABLE still requires service eligibility.

| Case | Method; duration | C | Validated V | Applied A | DUE | Excess X | Required outcome |
|---|---|---|---|---|---|---|---|
| N01 | PAYMENT; 0s, 1s, 59:59 or 60:00 | 100,001 | 100,001 | 100,001 | 0 | 0 | PAID, CLOSED/released; unused minutes not refunded |
| N02 | PAYMENT; 60:00.001 or 60:01 | 101,668 | 100,001 | 100,001 | 1,667 | 0 | PARTIAL, CLOSED/released |
| N03 | PAYMENT; 90:00 | 150,002 | 100,001 | 100,001 | 50,001 | 0 | PARTIAL, CLOSED/released |
| N04 | PAYMENT; 90:00; initial excess funds | 150,002 | 120,000 | 120,000 | 30,002 | 0 | Same-session excess offsets overtime, PARTIAL |
| N05 | PAYMENT; 90:00 | 150,002 | 160,000 | 150,002 | 0 | 9,998 | CLOSED/released; X visible; primary label B01 |
| N06 | PAYMENT; 1s; overpaid initial | 100,001 | 120,000 | 100,001 | 0 | 19,999 | No refund or extra time; X visible; label B01 |
| N07 | MANUAL/walk-in; 1s or 60:00; no actual receipts | 100,001 | 0 | 0 | 100,001 | 0 | UNPAID, CLOSED/released; never prepaid |
| N08 | MANUAL/walk-in; 90:00; no actual receipts | 150,002 | 0 | 0 | 150,002 | 0 | UNPAID, CLOSED/released |
| N09 | N08 after committed CASH 50,000 | 150,002 | 50,000 | 50,000 | 100,002 | 0 | PARTIAL; same closed session, no occupancy |
| N10 | N09 after a separate committed CASH 100,002 | 150,002 | 150,002 | 150,002 | 0 | 0 | PAID; two immutable receipt facts |
| N11 | N09 duplicate delivery of its original CASH command | 150,002 | 50,000 | 50,000 | 100,002 | 0 | No new receipt/audit/credit; stale mutable retry still rejects |
| N12 | N03 after same-session late validated bank CREDIT 30,000 | 150,002 | 130,001 | 130,001 | 20,001 | 0 | PARTIAL; frozen end/charge/new table owner untouched |
| N13 | N12 after new late CREDIT 20,001 | 150,002 | 150,002 | 150,002 | 0 | 0 | PAID; no reopening |
| N14 | N13 after additional true CREDIT 1 | 150,002 | 150,003 | 150,002 | 0 | 1 | X=1 retained; primary label B01; no refund |
| N15 | N03 receives 50,001 bound to another session | 150,002 | 100,001 | 100,001 | 50,001 | 0 | Other session's money never applied here |
| N16 | N10 receives reversal notice, not a credited movement | 150,002 | 150,002 | 150,002 | 0 | 0 | Evidence/notice visible, no automatic debit; primary label B01 |
| N17 | N02 after committed CASH 1,667 | 101,668 | 101,668 | 101,668 | 0 | 0 | PAID; provider opening evidence remains unmodified |
| N18 | N03 after CASH 50,001 and different valid bank CREDIT 50,001 both commit | 150,002 | 200,003 | 150,002 | 0 | 50,001 | Both real receipts retained, no discarded money; label B01 |
| N19 | N03, unverified “paid” screenshot/return URL for 50,001 | 150,002 | 100,001 | 100,001 | 50,001 | 0 | Still PARTIAL; client claim not evidence |

N09–N11/N17–N18 are post-close CASH examples, unambiguously within final settlement. B02 asks whether the additional pre-close CASH path is included. N18 does not authorize overriding stale CAS: a loser with a stale financial preview must refresh/reconfirm; both distinct funds are reflected only if both are legitimately committed. Physical receipt of cash and its DB recording are not the same event; a failed record must not silently lose track of the operator's need to retry/reconcile.

## 6. State machines — business contract, no schema design

### 6.1 Session lifecycle

Business states: inherited PENDING_PAYMENT/ACTIVE/CANCELLED plus owner-decided CLOSED. OVERTIME is a derived display/billing phase of ACTIVE, not a second session or an extra persisted authority. No CLOSING, payment-wait ownership or separate release state is needed by Q09.

| From → to | Actor / trigger | Exact effect | Invalid / timeout / recovery |
|---|---|---|---|
| PENDING_PAYMENT → ACTIVE/CANCELLED | Frozen Sprint 2 processing | Existing opening/hold rules unchanged | 300s inclusive hold boundary retained; never close a never-played hold |
| ACTIVE → ACTIVE at 60:00 | Authoritative elapsed time | Initial period ends; M still 60; occupancy retained | No automatic stop/close/charge receipt/renewal action |
| ACTIVE → ACTIVE at positive time beyond 60:00 | Authoritative elapsed time | Overtime estimate uses M≥61, same start/snapshot | No grace or maximum-duration transition; no browser authority |
| ACTIVE → ACTIVE on preview | Authorized own/operator reader | Return current estimate and server time; billing continues | Abandoned preview/offline browser does not stop time |
| ACTIVE → CLOSED | Authorized close under §8, committed DB operation | Set authoritative end; freeze duration/M/H/C; record financial result and closing evidence; release ownership together regardless of settlement status | Unpaid/partial/excess/provider outage not a reason to retain ownership; CAS/auth/constraint failures roll back all effects |
| ACTIVE → ACTIVE on failed/rolled-back close | Failed transaction | No final end, bill, close audit or release persists | Continue billing through later successful close; old attempted cutoff never reused |
| CLOSED → CLOSED on receipt/read/retry | Authorized financial actor/trusted evidence/reader | Financial balances/status may update; original close/start/end/charge stays unchanged | No second close/release; stale close mutation rejects, read-back recovers original result |
| CLOSED → ACTIVE; ACTIVE → CANCELLED via hold cancellation; CANCELLED → ACTIVE/CLOSED | Unsupported attempt | DENY | No reopen, cancellation of played history, backdate or revival |

Timeout policy: no active-session duration cap and no automatic close. Preview has no power to reserve an amount/cutoff; stale state rejects, passage of time alone is not stale CAS. Clock crossing does not increment a financial version merely to force reconfirmation. Gate 2 must preserve this distinction without creating a timer-write loop.

Restart before commit leaves ACTIVE and billing continues; restart after commit recovers CLOSED and the same end/charge. Closing twice under any command key cannot create a second closing result.

### 6.2 Service and occupancy

Service remains ACTIVE/MAINTENANCE/DISABLED with venue enabled/disabled separately. Only inherited valid pending holds and ACTIVE played sessions own capacity.

| Transition | Actor/condition | Required effect |
|---|---|---|
| PLAYING → unoccupied | Same committed ACTIVE→CLOSED transaction | Release exactly once, irrespective of PAID/PARTIAL/UNPAID/NEEDS_RESOLUTION |
| Unoccupied → AVAILABLE | Derived if table/venue service eligible | No bill, receipt or user click separately toggles availability |
| Unoccupied while venue disabled/table maintenance or disabled | Existing service state | Remain unavailable for new use; close does not enable service |
| AVAILABLE → PENDING/PLAYING | Existing acquire/MANUAL paths | New ownership only after old close commits; existing unique-owner guarantees |
| Late old credit/CASH/close retry after new owner | Old session reference | Update only permitted old-session finances; never release/preempt/reset the new owner |

An unpaid closed session has no ownership timeout because it holds no capacity at all. Debt is not erased by release or elapsed time. No worker/cache/busy flag becomes ownership authority.

### 6.3 Financial settlement lifecycle

Opening payment states and immutable bank receipt semantics remain separate from final settlement. For ordinary, unflagged **closed** bills:
- UNPAID: V=0, DUE=C>0.
- PARTIAL: 0<V<C, 0<DUE<C.
- PAID: V=C, DUE=0, X=0.
- NEEDS_RESOLUTION is required by Q09/Q13; its exact trigger/priority with positive X, notices and the above states awaits B01. It is not an action that can mark a case resolved.

| Transition | Actor/trigger | Exact money/ownership behavior |
|---|---|---|
| No final charge → final financial result | Authorized close | Freeze C and closure snapshot, derive balances, release regardless of result |
| UNPAID → PARTIAL | Committed valid same-session credit smaller than C | Update V/A/DUE once; closed session stays released |
| UNPAID/PARTIAL → PAID in ordinary exact-payment case | Valid same-session credits reach exactly C, no issue flags | DUE becomes zero; no new close/ownership effect |
| Any → excess/review case | New true credit makes V>C, or reconciliation/reversal evidence | Preserve all immutable evidence and derived X; exact primary status B01 |
| Any → same on duplicate financial identity | Replayed bank/CASH recording | No second monetary effect, receipt or success audit |
| Closed financial result after new valid late funds | Same session binding | Reduce due/apply up to C, retain surplus; never change start/end/C/ownership |
| Claimed refund, manual “resolve”, debt waiver or correction | Any role | Unsupported/DENY; do not mutate historic facts or make a fake completion |

CASH evidence is a new authorized type of financial fact, not a reinterpretation of Sprint 2 provider receipt state. Exact storage/functions/idempotency representation belong to Gate 2. Pre-close CASH timing is B02; do not design that path before the answer.

Payment/network timeout does not imply paid, erase debt, add a receipt or postpone an otherwise valid close. No new bank-intent TTL, online payment-order module or QR acquisition workflow is approved by “bank credits when adapter exists.” Existing opening QR/hold rules stay frozen; actual provider-specific retries/transport remain separately gated P01/P02.

## 7. Invariants

Inherited guarantees remain binding; new guarantees below follow the current owner decisions. B01–B03 affect specified edges only, not these conservation/closure/security requirements.

| ID | Always true | Requirements / tests |
|---|---|---|
| I01 | One authoritative session/ownership history; at most one table owner. CLOSED never owns capacity, regardless of financial status. | R07/R14; T23–T25/T46/T52 |
| I02 | Historical opening identity/method/start/initial snapshot/reference/receipt binding is preserved. End/charge frozen once on close; later receipts cannot rewrite it. | R02/R04/R05; T01/T05–T07/T12/T32/T53 |
| I03 | C is exactly ceil(H×max(60,ceil(D/60s))/60) from original H and authoritative committed close cutoff. Client/provider/preview time or later price never overrides it. | R02/R03; T02/T04–T05/T08/T13/T42–T44/T49–T50 |
| I04 | Integer VND and exact fractional-time rounding; safe intermediate arithmetic, no float/truncation/negative/wrapped amounts. Overflow fails atomically, not as a hidden duration cap. | R03/R06; T08/T13/T26/T42 |
| I05 | V=A+X and C=A+DUE, A=min(V,C), A≤C. Only validated unique same-session money counts; MANUAL bypass is not money; notices are not automatic debit. | R04–R06; T06/T09–T12/T30–T32/T51/T54/T58 |
| I06 | One economic bank/CASH recording is counted at most once under duplicate delivery or retry. Distinct real receipts are not discarded merely because the bill is already paid; no cross-session borrowing/rebinding. | R05/R06/R12; T12/T30–T32/T54–T56 |
| I07 | One committed close per session; no second charge/closing audit/release or stop/start reset from a new request key or replay. | R07/R12; T19–T23/T25/T27–T28 |
| I08 | Committed end/final charge/closure snapshot/ownership release/version/success audit are atomic. Each CASH financial mutation and its evidence/audit/version are atomic. External money is not a DB transaction. | R06/R07/R12; T26–T28/T34/T37/T56 |
| I09 | Stale/missing CAS cannot mutate. Each changed mutable row increments once per command; duplicates/no-op do not add success effects. Time advancement alone is not a versioned business mutation. | R02/R12; T04/T19–T22/T26–T30/T49 |
| I10 | Every private action/read/retry uses live account/session/cutoff, current role, exact action and venue/self scope; UI is not authority. Disabled customer has no private bypass. | R08/R09; T14–T18/T29/T39–T40/T55/T57 |
| I11 | New Staff close/CASH defaults do not imply MANUAL-open, security, pricing, refund or global powers. Unknown extras/HR/menu labels do not grant authority; no extra widens venue scope. | R08; T14–T18/T29/T55 |
| I12 | Close releases the exact old session only, does not enable service and cannot touch a newer owner. Financial issues after close never reclaim physical capacity. | R07/R14; T12/T23–T25/T32/T52 |
| I13 | Overtime, downtime, abandoned/overnight session and disabled service continue time accrual until authorized close. No automatic stop, grace, maximum duration, free outage time or client backdate. | R01/R02/R09; T03–T04/T24/T33–T37/T44/T50 |
| I14 | Bank/CASH financial evidence and audit are immutable, attributable and redacted. Failure/denial creates no success audit; no edit/delete/reversal shortcut repairs mistakes. | R06/R10–R12; T13/T26/T30–T32/T40/T45/T56 |
| I15 | Play/close/release, final charge and current settlement are separate truths. Opening SUCCESS and MANUAL 60-minute timer never imply final payment; outstanding due/excess remain visible. | R04/R07/R10; T06–T11/T32/T38/T51–T53/T58 |
| I16 | Disabling an account/venue/table or losing a response never deletes history or creates a fake identity. Management assistance does not grant disabled customer access. | R04/R09/R14; T07/T24/T29/T35–T36/T57 |
| I17 | Frozen Auth/RLS/cutoff/CAS/audit/opening semantics and history remain intact. Additive compatibility review is not permission for material deviation, old migration edits or future modules. | R14; T01/T47–T48/T55 |
| I18 | Preview is explicitly an estimate with billing continuing; committed result may be higher due to time. UI accepts the authoritative result, distinguishes uncertainty from success, and does not reuse a stale version or claim cash recorded before commit. | R02/R12/R13; T04/T18–T20/T33/T38–T41/T49/T56 |

## 8. Permissions, scope and final record

### 8.1 Action matrix

G=global business; V=active assigned membership/approved venue scope; S=own authenticated customer session. All private/internal actors need ACTIVE account and a valid current Auth session. Anonymous/public financial access is DENY. Fixed permission vocabulary is a minimal Gate 2 proposal, not a new permission engine.

The USER customer self-service contract applies to any role using its own authenticated customer session, as inherited from Sprint 2. Operator authority remains separate; an internal role need not pretend to be the beneficiary to close through its operator scope.

| Action | ADMIN | CEO | MANAGER | STAFF | USER |
|---|---|---|---|---|---|
| Read/preview own safe active/final financial summary | S | S | S | S | S; no other's/walk-in |
| Self-close own authenticated PAYMENT | S | S | S | S | S |
| Self-close MANUAL even with own beneficiary | No self-service grant; use authorized operator path | Same | Same | Same | DENY |
| Read operational session/financial summary for service | G | G | V, full required operational view | V, required service summary only | DENY internal |
| Preview/close PAYMENT or MANUAL/walk-in as operator | G | G | V | V, assigned active venue | DENY |
| Preview/confirm CASH recording | G | G | V | V, assigned active venue | DENY |
| Read final safe business record | G | G | V | V, operational projection | S only |
| Close existing ACTIVE with disabled beneficiary or unserviceable table at otherwise eligible venue | G | G | V | V under Q10 scope | Disabled USER DENY; active own PAYMENT remains self-service eligible |
| Close existing ACTIVE at disabled venue | G, explicit Q11 management exception | G, explicit Q11 management exception | Assigned management scope, Q11 | B03 clarification; no inferred grant | Live ACTIVE USER: S, own PAYMENT only under Q10; disabled USER DENY |
| CASH at disabled venue | B03 clarify operational exception | B03 | B03 | B03 | DENY |
| BUSINESS audit feed | G | G | V | DENY; may receive safe action-specific evidence only | DENY; safe own correlation only |
| SECURITY audit feed | G | DENY | DENY | DENY | DENY |
| Refund/reopen/backdate/waive/discount/correct/reassign/split | DENY | DENY | DENY | DENY | DENY |
| Override snapshot/start/arbitrary end/bank evidence/immutable receipt | DENY | DENY | DENY | DENY | DENY |

CASH permission is decided; only its lifecycle timing B02 and disabled-venue edge B03 remain. No cash is a payment-provider ADMIN confirmation. Staff close/CASH are approved role-default actions, not conditional on TABLE_SESSION_OPEN_MANUAL; that frozen manual-open permission continues to have its original meaning and scope. No new extras are required by the business decisions.

Q11 authorizes management closure of existing sessions even when service becomes unavailable; active membership/account/session checks are never bypassed. B03 asks only for exact Staff/CASH exception eligibility; it does not question management's decided right to close or create a reason to re-enable a venue/account.

### 8.2 Required final record and projections

| Required information | Authority / visibility |
|---|---|
| Session ID, venue/table, opening method | Existing session relationship; private authorized summary only |
| Beneficiary/customer when allowed | Own identity or necessary scoped service field; NULL walk-in stays NULL, no directory/identity linking |
| started_at, ended_at, actual duration, billable minutes | Original start and committed authoritative close; no client-editable cutoff |
| Hourly snapshot, final charge | Original H and exact §5.3 formula; immutable final C |
| Validated received V, applied A, remaining DUE, excess X | Derived from immutable same-session money; current financial view can evolve after close |
| Settlement status | PAID/PARTIAL/UNPAID/NEEDS_RESOLUTION; B01 exact exception precedence |
| Close/release status and closing actor when applicable | Committed close fact, safe role-aware projection; closing actor cannot be overwritten by later collector |
| Safe audit/correlation evidence | Trusted attribution/trace sufficient for that action; no permission to browse the audit feed or Auth/provider internals |

Record closure-time financial facts as part of the committed closing outcome, and distinguish that historical result from current settlement after later receipts. This is a record requirement, not a second authoritative balance store or selected ledger schema.

USER receives own safe summary; no other customer's data or walk-in/private operator records. STAFF/MANAGER receive authorized venue operations fields; Staff gets enough to close/collect safely but no broader directory, bank payload or audit-feed privilege. CEO/ADMIN receive authorized business projections. Public/anonymous receives none of this final record. Existing public availability remains safe.

No raw bank/recipient detail, Auth contacts/session data, credentials or unnecessary customer PII. No downloadable accounting document, tax invoice, revenue/profit/business-day dashboard.

## 9. Security, trust, audit and UX boundaries

Trusted DB facts: current profile/role/account/membership/session cutoff; session/venue/table ownership/service; original H/start; current exact server time; immutable validated financial evidence; versions and committed audit outcome.

Untrusted client data includes IDs, versions, request keys, reason/amount entry, timestamp, displayed estimate, “paid” claim, screenshot/return URL, chosen role/actor/source/beneficiary/venue. A CASH amount is an operator's proposed recording input, validated and committed by an authorized server action; it is never an unauthenticated bank-success shortcut. Reject nonpositive/fractional/non-VND CASH and overflow; derive actor/venue/binding on the trusted path. No arbitrary timestamp or original price accepted.

All secrets/provider verification/database capabilities stay server-only. No client service-role, raw table writes, generic database proxy or broader Auth reader. Existing RLS/grants plus narrow authorized RPC boundaries remain mandatory. Exact tables/fields/functions/owners/EXECUTE/audit vocabulary belong to Gate 2 after approval, not this document.

Close and CASH require explicit summary/preview and confirmation with fresh versions; sensitive operator action records a reason and trusted actor. Close confirmation must explain that the estimate can grow until actual close and that the resulting server charge is final. **Only passage of time** may change the computed amount without a second preview, as expressly accepted by Q02. A new receipt, service or authority mutation that makes required persisted versions stale still conflicts. Never auto-fetch a fresh version and silently resubmit a user's stale financial operation.

Audit end/charge/release and CASH effects in the same respective transaction. Retain exact session/table/venue/actor/correlation, safe money/version before/after and fixed actions; no arbitrary client-defined audit payload. BUSINESS visibility stays scoped, SECURITY stays ADMIN-only. No audit deletion or fake “resolved” action.

Concurrency design must interoperate with the frozen shared/exclusive writer barrier, ordered ownership locks and unique guards. No network call while holding DB ownership locks. Closing does not wait for a payment provider. Specific compatibility changes, lock strategies and idempotency records are Gate 2 work, not authorized now.

Suggested plain user wording consistent with the decisions: “Ước tính — tiền giờ tiếp tục tính đến khi đóng bàn thành công”; “Đã đóng bàn — còn phải thu …”; “Chưa xác định kết quả, đang tải lại phiên”. These labels reflect authoritative outcomes; no optimistic CLOSED/PAID/receipt display before commit.

## 10. Failure, edge and recovery requirements

| Situation | Required outcome | Tests |
|---|---|---|
| Early/end-of-hour/subsecond close | Exact 60-minute minimum and started-minute ceiling; at 60:00 no overtime, after it minute 61 | T02/T08/T42/T50 |
| Preview abandoned or delay before close commits | Continue billing; committed time/charge wins; no backdate or time-only reconfirm loop | T04/T49 |
| Close insufficiently paid/unpaid/excess/review | Still freeze C/end and release atomically; retain financial truth | T10/T21/T52/T58 |
| Cash before close | B02: lifecycle eligibility not silently selected | T51 |
| CASH after CLOSED or late verified bank credit | Recompute same-session finances, immutable close/charge/ownership; dedupe | T32/T51/T53–T54 |
| Negative/fractional cash, forged paid status/time/price | Reject; no receipt or partial data/audit/version mutation | T08/T13/T56 |
| Stale preview due to actual receipt/authority change | Deny stale CAS, reload/reconfirm; elapsed time alone is not this conflict | T18–T19/T30/T49 |
| Lost request/response before vs after commit | Before: no durable outcome; after: read one committed outcome; no duplicate closing/receipt | T20/T26–T28/T56 |
| Two closers or closer vs acquire/MANUAL | One close; new ownership after commit only; stale old close cannot touch new owner | T21–T25 |
| Cash vs cash or cash vs bank | Unique receipts counted once; both distinct valid funds retained if committed; due/excess recomputed without overwrite | T30/T54–T56 |
| Close vs account/venue/table/membership change | Frozen auth serialization and scope intact; no history erased or service re-enabled | T24/T29/T57 |
| Unconfigured/down provider | Online bank settlement not advertised as working, no fabricated credit. CASH remains according to approved scope; close/release independent | T33–T34 |
| Bank/cash physically received but DB recording fails | No claim external money rolled back. Recover/reconcile using same evidence/command identity; no false receipt success | T26/T34/T56 |
| DB/audit/constraint failure or crash | Entire attempted DB mutation rolls back; no frozen end/release without closing record or cash evidence without audit | T26–T28/T37/T56 |
| Worker/server restart, overnight/abandoned/forgotten session | Time continues from same start, no cap/free period/automatic close; recover existing committed result | T03/T35–T36/T44 |
| Reversal/chargeback/refund/correction requested | Preserve notice/debt/excess; no netting, edited receipt, reopen or completion button; status priority B01 | T31–T32/T45/T58 |

## 11. Acceptance criteria and revised test matrix

### 11.1 Acceptance criteria

| ID | Objective evidence required |
|---|---|
| A01 | Automatic continuation with no grace/cap/stop; committed authoritative cutoff, downtime/abandonment and exceptional close preserve original start and service/security rules. |
| A02 | Every §5.3 oracle exact for PAYMENT/MANUAL/walk-in; duration rounded first, final VND rounded once, no float/overflow/late-rate repricing. |
| A03 | All §5.4 balances reconcile, bank/CASH identities dedupe, final money status follows completed B01, late credit updates only current finances; debt/excess visible. |
| A04 | One atomic close/end/charge/record/release even unpaid; independent later settlement; no double close or new-owner interference under races/retry/rollback. |
| A05 | Every §8 allow/deny cell enforced with real ordinary Auth, default Staff role rights, venue/self scope, revocation, disabled-user denial and B03 exception scope. |
| A06 | Required safe record and clear estimate/committed/due/excess/unknown labels, no unsupported action; actual Chromium/WebKit 1440/390/320 evidence. |
| A07 | CASH and close failure/recovery are atomic and at-most-once; correct stale CAS vs time progression; provider failure cannot fake money or hold a closed table. |
| A08 | Reviewed exact approved scope, additive frozen compatibility, real regressions/static checks, no unexpected FAIL/NOT RUN/SKIPPED/FLAKY; eventual separately authorized merge and exact-main CI before freeze. |

### 11.2 Test execution rules

All cases are **NOT RUN — specification cases only**, not automated test counts. D=real PostgreSQL constraints/RLS/transaction tests; A=real local Supabase/Auth/API; U=deterministic arithmetic supplement; B=real Playwright/backend; S=static/diff/CI review. No executable test file is created now.

Permissions use real ordinary-user tokens, not service-role proof. Independent connections exercise race schedules and persisted state/versions/audit. Privileged fixtures may arrange data or faults only. Exact-clock tests cannot ship a production client clock override or weaken assertions. Frozen baseline tests remain, with explicitly reviewed additive coverage for new behavior; don't rewrite old failures to green. Gate 3 assigns exact test paths.

T01–T48 retain their IDs with revised outcomes. T49–T58 add the important owner-decision interactions. Only B01–B03-tagged outcomes remain unresolved; all other questions have been answered. Gate 1 must finish these narrow oracles before SPEC approval.

| ID | Scenario and required assertions | Layer | Mapping / unresolved edge |
|---|---|---|---|
| T01 | Frozen Auth/opening/payment/hold regression unchanged, including 300s inclusive expiry, cancelled-attempt money, MANUAL no fake prepay. New close denies PENDING/CANCELLED and adds ending only for played ACTIVE. Frozen no-overtime Sprint 2 surface is distinguished from explicitly added Sprint 3 behavior, not silently weakened. | D/A/B | R14; F01/F03–F04/F06/F11; I02/I17; A08 |
| T02 | Both opening methods at 0s/1s/59:59/60:00/60:00.001/60:01 produce §5.3 exact M/C and no start change. Early PAYMENT minimum preserved. | D/A/U/B | R01–R04; I02–I04; A01/A02 |
| T03 | Browser disconnected/worker stopped across hour boundary: ACTIVE retains ownership, estimate accrues overtime from trusted time; no renewal/auto-stop/auto-receipt. | D/A/B | R01; I13; A01 |
| T04 | Abandoned preview/two tabs/lock wait crosses boundary; preview is read-only, time advances; confirm computes actual result without preview backdate or time-only CAS failure. | D/A/B | R02/R13; I03/I09/I18; A01/A06 |
| T05 | Table/venue price edits before activation but after PAYMENT acquire, or during either method's session: original H and initial amount preserved; 90min at H=100001 charges 150002. | D/A/U | R03; I02/I03; A02 |
| T06 | MANUAL closes with zero evidence: 60-minute minimum, full due UNPAID, CLOSED/released, no opening payment/receipt/SUCCESS. | D/A/B | R04/R07; I05/I15; A02–A04 |
| T07 | MANUAL real beneficiary vs NULL walk-in, actor distinct: correct charge, no dummy identity/public claim. Beneficiary self-read allowed when own; USER self-close MANUAL denied, operator close scoped. | D/A/B | R04/R08; I02/I10/I16; A03/A05 |
| T08 | Non-divisible rate, subsecond and minute boundaries, long sessions and bigint limits: exact duration-first/VND-second ceilings or atomic overflow error, no clip or hidden cap. | D/A/U | R03; I03/I04; A02 |
| T09 | Exact initial credit offsets early/minimum and overtime final bill once: N01–N03 numbers and independent close/release correct. | D/A/B | R05/R07/R10; I05/I15; A03/A04 |
| T10 | Partial final settlement before/during/after close: authorized post-close partial updates DUE exactly, no retention of table. Test financial-version conflict separately; pre-close CASH eligibility B02. | D/A/B | R05–R07; I05/I09/I12; A03/A04; B02 |
| T11 | Initial excess offsets later same-session overtime (N04); N05/N06 retain exact X with no refund/free time. Label exactness B01 only. | D/A/B | R05/R10; I05/I15; A03; B01 |
| T12 | Cancelled/unmatched/different-session credits cannot be borrowed or rebound; old reference cannot fund/release new owner's session even on same table/venue. | D/A | R05/R14; I02/I05/I06/I12; A03/A04 |
| T13 | Forged time/rate/amount/paid/actor/role/venue, malformed input, nonpositive/fractional cash, direct table/receipt/audit mutation and private helper execution: deny/no leakage/partial effects. | D/A | R03/R06/R08; I03/I04/I10/I14; A02/A05 |
| T14 | Every §8 five-role action cell: allowed operations succeed; denied operations fail server-side even via direct URL/body. USER self-close only own PAYMENT; no cash/walk-in/other action. | D/A/B | R08; I10/I11; A05; B03 exception rows |
| T15 | MANAGER A/AB and default STAFF A, active/inactive memberships and other venue IDs: only authorized scope; default Staff close/CASH works without manual-open extra; no global read/write. | D/A/B | R08; I10/I11; A05 |
| T16 | Own financial summary for all customer-path roles vs other customer/walk-in/public/internal: minimal allowed reads only; no anonymous/private operator records or identity leakage. | D/A/B | R08/R10; I10/I16; A05 |
| T17 | Disabled account, missing/wrong-user Auth session, old JWT/old refreshed session after cutoff denied; fresh valid login gets current rights only. | D/A/B | R08/R09; I10; A05 |
| T18 | Scope/role/membership revoked between preview and confirmation: frozen serialization/cutoff denies mutation, no success audit, UI clears protected cached data. | D/A/B | R08/R12/R13; I10/I11/I18; A05/A07 |
| T19 | Missing/stale multi-row versions, identical updated_at with different version, versions beyond JS safe integer: exact conflict/no mutation/audit; new receipt invalidates financial preview. | D/A/B | R12; I09/I18; A04/A07 |
| T20 | Close lost response vs pre-commit failure: authoritative read returns one committed result or ACTIVE; stale mutation retry not new success; billable delay until successful commit. | D/A/B | R02/R12/R13; I07/I09/I18; A07 |
| T21 | Two operators close same session/version simultaneously: exactly one end/C/financial result/close audit/release; loser conflict, no second bill. | D/A | R07/R12; I07/I09; A04 |
| T22 | USER own PAYMENT vs operator close, delayed stale confirmation behind lock: one authoritative committed cutoff, no client timestamp/duplicate close. | D/A | R02/R08/R12; I07/I09/I10; A04/A05 |
| T23 | Close races two new acquire/MANUAL contenders: old ACTIVE blocks before close commit, at most one new owner afterward, no premature ownership gap. | D/A | R07/R14; I01/I12; A04 |
| T24 | Close vs maintenance/table disable/venue disable/customer disable: preserve service/start/charge, no re-enable or forgiveness. Management can close existing unavailable session; Staff exception B03. | D/A | R07/R09; I12/I16; A04/A05; B03 |
| T25 | Old close retry after new owner: new session/start/money untouched; old result read only by authorized reader. New key cannot reclose. | D/A/B | R07/R12/R14; I01/I07/I12; A04 |
| T26 | Inject audit/constraint/related-row/overflow failure during closing or cash: full record/state/version/release rollback, no success event; no externally received money falsely declared refunded. | D/A | R06/R12; I04/I08/I09/I14; A07 |
| T27 | Crash/connection loss before commit vs after commit before response: zero or one durable close and exact end/C; restart/retry cannot reuse failed cutoff or create orphan bill. | D/A | R02/R12; I07–I09; A07 |
| T28 | Repeated close, changed payload with same identity, guessed command identity, current-version terminal close: no double effect/unauthorized disclosure/reopen/reclose. | D/A | R12; I07/I09/I10; A04/A07 |
| T29 | Close/CASH concurrent with role/scope/account/membership/security mutation: frozen barrier/cutoff guarantees preserved, current authorized actor only, no helper rewrite for convenience. | D/A | R08/R09/R14; I10/I11/I16/I17; A05/A08; B03 only unavailable venue eligibility |
| T30 | Duplicate transfer under same/new event IDs and distinct receipt races close: exact unique identity/binding, one credit per transfer, persisted money version invalidation, no duplicate audit/settlement. | D/A | R05/R06/R12; I05/I06/I14; A03/A04 |
| T31 | Conflicting event/transfer payload, nonfinal or reversal notice: no overwrite/rebind/new credit/automatic debit/refund; preserve permitted notice and issue visibility. Primary status B01. | D/A | R05/R06/R11; I05/I06/I14; A03; B01 |
| T32 | Valid late true credits after CLOSED and table reacquire: N12–N14, due reduced at most to zero, excess retained, old start/end/H/M/C and new ownership unchanged. | D/A/B | R05/R10/R14; I02/I05/I06/I12/I16; A03/A04; B01 surplus label |
| T33 | Provider unconfigured/down: no working-bank-QR/paid claims; CASH within permitted scope remains available and an otherwise valid close succeeds regardless of provider. | A/B | R06/R07/R13; I13/I18; A07 |
| T34 | Transfer processing/ACK timeout or DB failure with 0/partial/full money: no invented receipt/refund, stable evidence recovery; close/release independent of external verification. No new payment-intent expiry policy invented. | D/A | R06/R07/R12; I05/I08/I13; A03/A07 |
| T35 | Restart/browser sleep/worker stop spanning hour or close: same start, no free outage, exact elapsed charge; already CLOSED stays frozen. | D/A/B | R01/R02/R09/R12; I13/I16; A01/A07 |
| T36 | Abandoned/forgotten/overnight session bills until actual authorized close; disabled user denied, management assisted close no fake relogin or backdate. | D/A/B | R02/R09; I13/I16; A01/A05 |
| T37 | Forced deadlock/serialization/connection failure: bounded safe same-identity recovery, rollback or one commit, no new cash/receipt/close effect per retry. | D/A | R12; I08/I09/I13; A07 |
| T38 | Full PAYMENT/MANUAL/walk-in flow: estimate with ongoing-billing notice, confirm, actual closed/released result while unpaid/partial/paid; then cash settlement without reclose. | B | R04/R07/R10/R13; I15/I18; A06; B01 flagged status only |
| T39 | All required final fields under own/Staff/Manager/CEO/Admin projections; no public/private leak/raw bank/Auth/directory. Staff new service finance read does not widen frozen opening endpoints arbitrarily. | D/A/B | R08/R10/R14; I10/I14/I17; A05/A06 |
| T40 | BUSINESS vs SECURITY feed, trusted closing/collecting actors, safe correlation, redacted new payload, append-only audit, denied/failed actions no success event. | D/A | R10/R12; I10/I14; A05/A07 |
| T41 | Chromium/WebKit 1440/390/320: readable minute/charge/due/excess, focus/keyboard/no overflow, direct-route denial, offline/unknown/recovery/revocation messages. | B | R13; I18; A06/A07 |
| T42 | Every §5.3 numeric row and N01–N19 finance oracle: exact integer DB/API/unit results; no pre-rounded per-minute rate or fractional-time truncation. | D/A/U | R03–R06; I03–I06; A02/A03; B01 labels only |
| T43 | No repricing at time-of-day/venue/date edits, no tax/fees/promotion/discount/pause/transfer/split-bill mechanics; frozen initial amount unchanged. | D/A/U/B | R03/R11; I02/I03/I17; A02/A08 |
| T44 | UTC duration across midnight/timezone/DST, subsecond and long downtime: exact elapsed M/C, no business-day reset/display-clock authority or hidden maximum duration. | D/A/U/B | R02/R03/R09; I03/I13; A01/A02 |
| T45 | All roles including ADMIN/CEO attempt reopen/backdate/refund/waive/correct/delete evidence: denied/absent; debt/excess/notice not falsely resolved. | D/A/B | R11; I14/I16/I17; A08 |
| T46 | Independent tables close concurrently; same customer with several legitimate ACTIVE sessions closes exact target only; no new one-ACTIVE-session/customer restriction. | D/A | R07/R14; I01/I12; A04 |
| T47 | Clean reset plus retained and additive DB/API/unit/browser regressions on candidate; new CLOSED/late-credit/MANUAL cash support proves frozen Auth/RLS/cutoff/CAS/audit/opening evidence compatibility. | D/A/U/B/S | R14; I17; A08 |
| T48 | Exact approved paths/diff, no secrets/Legacy/future module; dependency audit/type/lint/build, approved PR/merge and exact-main CI before eventual freeze. No CI workaround/old migration edit. | S | R11/R14; I17; A08; later Gates 3–6 |
| T49 | Preview at 60:00 → confirm commits 60:00.001: 100001 estimate becomes 101668 committed charge without extra confirmation solely for time. Separate actual receipt/version change still gives stale conflict. | D/A/B | R02/R12/R13; I03/I09/I18; A01/A06/A07 |
| T50 | 60:00.000001 and 61:00.000001 exact ceilings; 24h/30day sessions remain billable without auto-close/cap; initial-ended and overtime-active UI reflect boundary correctly. | D/A/U/B | R01/R03; I03/I04/I13; A01/A02 |
| T51 | CASH lifecycle eligibility on ACTIVE and CLOSED MANUAL/PAYMENT; after-close N09/N10/N17 succeeds under permission, no fake opening payment. Pending/cancelled hold is not a played-session settlement. Pre-close eligibility awaits B02. | D/A/B | R04/R06; I02/I05/I14/I15; A03/A05; B02 |
| T52 | Close UNPAID/PARTIAL while provider unavailable: one immediate CLOSED/release, another customer can acquire after commit, collection later does not reacquire or block table. | D/A/B | R07; I01/I08/I12/I15; A04/A07 |
| T53 | Late bank credit or post-close CASH: end/start/H/M/C/closer/closure-time snapshot unchanged, current V/A/DUE/X progresses exactly; new collector attribution separate. | D/A/B | R05/R06/R10; I02/I05/I12/I15; A03/A06 |
| T54 | Distinct CASH and bank credit (N18) serialize/reconfirm under CAS; if both genuinely commit, retain both and surplus. Same economic identity cannot enter twice or become another session's credit. | D/A | R05/R06/R12; I05/I06/I09; A03/A07; B01 surplus label |
| T55 | Staff with no extras can close/CASH/read service finances in scope; MANUAL-open/HR extras do not confer new cross-venue/security/price/refund powers. CEO explicit global CASH/close does not imply ACCESS_MANAGE. | D/A/B | R08; I10/I11/I17; A05 |
| T56 | CASH preview/confirm, reason/actor attribution, lost ACK, same-key replay, changed-key duplicate attempt handling, audit fault and malicious amount: immutable exact evidence once, no edited bank state or fake success. Gate 2 must define at-most-once identity without guessing identical amounts mean same cash event. | D/A/B | R06/R12; I04/I06/I08/I09/I14/I18; A03/A07 |
| T57 | Disabled venue vs merely disabled table vs disabled customer vs inactive operator membership, each role's read/close/CASH path: decided management close allowed, frozen account/cutoff/scope still enforced. Complete precise Staff/CASH disabled-venue oracle from B03. | D/A/B | R08/R09; I10/I12/I16; A05/A07; B03 |
| T58 | Excess only, notice only, both, outstanding due plus notice, excess absorbed by later active overtime: V/A/DUE/X conserved and issues visible, close/release independent, exact primary settlement status/automatic label changes from B01; no fake resolve action. | D/A/B | R05/R07/R10/R11; I05/I12/I14/I15; A03/A06; B01 |

Coverage: R01–R14, F01–F16 and I01–I18 retain test links; every owner Q decision maps to tests. No case is removed to accommodate a new decision. The number of future executable tests will exceed/expand these scenario IDs where numerical rows, role cells and race schedules require it.

## 12. Only genuinely unresolved questions

### 12.1 IMPLEMENTATION BLOCKERS — three narrow clarifications

The original Q01–Q16 are incorporated in §5.1. Do not ask the owner to repeat them. Three remaining edges change observable business behavior/permissions, so they cannot be silently chosen as technical details. Core arithmetic and release policy are fully decided.

| ID | Exact clarification needed | Why necessary / affected cases |
|---|---|---|
| B01 | When does primary settlement status become NEEDS_RESOLUTION, and does it take precedence over PAID/PARTIAL/UNPAID? Specifically: (a) X>0 only; (b) reversal/reconciliation notice with due=0; (c) due>0 plus a notice; (d) active-session excess later fully absorbed by overtime. Should issue status clear automatically when X reaches zero with no other issue, while immutable evidence remains? | Q09 names four statuses and Q13 requires visible unresolved issues but gives no precedence/exit predicate. Amounts are already exact; choosing the label or automatic clearance would invent business behavior. T11/T31/T32/T38/T42/T54/T58. |
| B02 | May authorized CASH be recorded while an opened session is still ACTIVE as well as after CLOSED, or only after CLOSED? | Q08/Q10 grant recording “for sessions” and Q06 requires independent settlement, but don't specify this lifecycle edge. Both interpretations produce different state/permission acceptance cases. Post-close collection is decided; pending/cancelled opening-hold handling remains frozen. T10/T51. |
| B03 | At a disabled venue, does the management close exception include STAFF with an ACTIVE assigned membership, or only MANAGER/CEO/ADMIN? Is CASH recording for an existing session also allowed there, and for which of those roles? | Q10 says STAFF at an assigned active venue; Q11 explicitly allows management close of existing sessions after disable, but does not enumerate STAFF or CASH for that exception. Do not silently re-enable venue, widen scope or block the expressly approved management close. T14/T24/T29/T57. |

No default answer is implemented or asserted for B01–B03. Filling them must update the dependent state/status/permission rows and exact test outcomes before owner SPEC approval. All useful decided work is already recorded above; no Gate 2 design is started while waiting.

The document cannot yet carry **OWNER-DECISION COMPLETE — READY FOR OWNER SPEC APPROVAL** because these three oracles remain open. Once answered, that exact status may be applied to the completed revision, followed by a stop for explicit SPEC approval; it is not implementation authorization.

### 12.2 PROVIDER / ENVIRONMENT DEPENDENT BUT NON-BLOCKING FOR THE CURRENT SPEC

| ID | Item | Boundary |
|---|---|---|
| P01 | Real provider/bank/merchant, authenticity/finality/immutable IDs/exact reference/replay capabilities | Provider-neutral guarantees plus authorized CASH are current scope. No real online settlement available until separately integrated and verified; availability never fabricated. |
| P02 | Provider sandbox/credentials, QR/reference limits, webhook/reconcile transport | No new provider-specific schema/intent flow chosen now; live integration needs separate authorization/evidence. Neutral receipt fixtures never certify a bank. |
| P03 | Production hosting/SMTP/monitoring/time operations, physical device certification | Later environment gates; no production or physical-device claim from local DB/browser-engine tests. |

No provider choice, SLA or webhook payload is an excuse to weaken same-session credit, cutoff, audit, replay or release correctness.

### 12.3 FUTURE SPRINT — already deferred

| ID | Area |
|---|---|
| U01 | Player/Match/Video/Tournament/Shop/Telegram/CRM/AI, invitations and identity linking; no new module work. |
| U02 | Revenue/profit/business-day accounting, fiscal/tax integrations, downloadable accounting documents and exports. |
| U03 | Reopen/backdate/correction/waiver/discount/refund/reversal resolution and pause/transfer/split-bill. Debt/excess visibility and immutable evidence remain required now. |
| U04 | Production retention/privacy, backup/restore SLA, historical import, real bank deployment, physical hardware controls. |

## 13. Additive compatibility review authorization and findings

Q16 explicitly authorizes compatibility review. **Gate 2 remains unstarted and requires prior SPEC approval.** At that later gate, identify exact additive changes and proof obligations, not generic permission to replace frozen constraints/functions.

| Frozen surface | Existing boundary | Required later review obligation |
|---|---|---|
| Session CHECKs in 20261007000100_table_payment_contract.sql | State whitelist has no CLOSED; MANUAL currently requires ACTIVE; timestamp shape supports pending/active/cancelled only | Propose additive CLOSED/end/charge support preserving all original creation/opening cases. Never edit frozen migration or overload CANCELLED for played sessions. |
| private.sprint2_validate_payment_session in 20261007000200_table_payment_operations.sql | MANUAL forbids initial payment row; initial PAYMENT SUCCESS requires ACTIVE under current ending-free scope | Prove historical paid opening remains true after CLOSED; support separate actual MANUAL settlement without fake opening intent/SUCCESS or bypassed validation. Exact change requires review. |
| payments.session_id UNIQUE, opening balances/reference/required snapshot | Represents initial opening intent, not a mutable final invoice | Preserve initial amount/binding; identify minimum additive bank/CASH settlement representation after decisions, not relaxing uniqueness or repurposing required amount. No table/function design chosen now. |
| table_single_owner, existing occupancy/read projections | Pending/ACTIVE own capacity | CLOSED must release immediately regardless of due; preserve pending/active invariants and prove old callback/new owner compatibility. No second busy flag. |
| Existing Staff-minimal projections and audit/security boundaries | Old Staff opening-finance and audit-feed limitations | Q10 authorizes new necessary Sprint 3 operational finance projection, not wholesale expansion of old endpoints/Auth/receipt access. No audit-feed/price/security escalation. |
| Frozen barrier/Auth/cutoff/CAS/audit checks | Live authorization, transaction atomicity, fixed vocabularies | Preserve all guarantees; identify exact minimal new action vocabulary and audited projections. No generic permission builder. |
| Existing CI exact allowlists | Sprint 3 paths outside old implementation allowlists | Gate 3 must name exact approved additions before implementation/PR checks. No workflow edit or old-snapshot testing workaround now. |

**M01 — STOP:** if the proposed implementation would materially alter frozen Auth/RLS/session cutoff/CAS/audit/opening-payment semantics or historical evidence, submit separately scoped maintenance/deviation for explicit owner approval **before implementation**. No approval of this SPEC or Q16 is blanket deviation permission. Do not turn expected additive ending support into a request to edit old migrations.

Gate 2 later must address the precise committed DB cutoff/time semantics, same-session MONEY conservation/idempotency for CASH and provider events, clock precision/range, compatibility locking, exact immutable record representation and safe projections. These are technical proof/design obligations, not new owner business questions or work performed in this revision.

## 14. Checkpoint, validation and handoff

- Single allowed artifact: update docs/sprints/SPRINT_3_SPEC.md on sprint3-spec from prior document commit 65562f1c9f3adc0001b1c089ceeed858696e283c; frozen main stays 1b6f713a990aabb4f705d5f0735856442a59b7db.
- Q01–Q16 decisions are incorporated; 16 inherited facts, 14 requirements, 18 invariants, 8 acceptance groups, revised original 48 tests plus 10 added cases (58 total), 19 duration examples, additional boundary scenarios and 19 financial oracle cases.
- Only B01–B03 remain business clarification blockers; P01–P03 are capability/environment boundaries and U01–U04 future scope. Exact technical choices belong to later Gate 2.
- Documentation validation: check identifiers/mappings, exact arithmetic, decision consistency, no stale tentative formula/settle-before-release rules and one-file remote diff. Numeric computation is document validation, not an executable test artifact or Sprint 3 runtime PASS.
- All Sprint 3 runtime tests remain NOT RUN. Baseline CI evidence in §2 is historical and unchanged; no workflow/dependency/source/test file touched, no PR/merge/deployment.
- Publish this document checkpoint to GitHub and verify remote content/diff. Its own commit SHA is in Git history and the owner handoff; do not create another progress file or embed a self-referential SHA.
- Next agent: read this document and current owner answers, recheck main/branch, resolve only B01–B03, then request explicit approval of the completed SPEC. Never treat business answers or review authorization as Gate 2/implementation approval.
- Eventual implementation still requires approved SPEC → technical design → exact implementation plan/allowlist → owner implementation approval → vertical-slice tests → complete review/green PR → separately authorized merge → exact-main CI and immutable closure ledger → STOP.

**Current endpoint: Gate 1 decision update saved for owner review; B01–B03 unresolved. Do not begin Gate 2.**
