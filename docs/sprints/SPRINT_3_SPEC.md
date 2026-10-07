# VOLUME V2 — Sprint 3 SPEC

Status: **DRAFT FOR OWNER REVIEW — GATE 1 ONLY — IMPLEMENTATION BLOCKED**
Date: 2026-10-07
Repository: `HAD10202/Volume`
Verified frozen base: `1b6f713a990aabb4f705d5f0735856442a59b7db`
Document-only branch: `sprint3-spec`
Exact change allowlist: **create `docs/sprints/SPRINT_3_SPEC.md` only**.

This is a specification proposal and decision register, not an approved Sprint contract, technical design, implementation plan, or authorization to code. All new Sprint 3 behavior below is proposed or explicitly unresolved. No financial formula, new permission, timeout, settlement method, or state transition is approved by implication. Unresolved implementation blockers prevent Gate 2 as well as implementation.

## 1. Owner authority decision and process boundary

**OD-01 — Owner confirmed 2026-10-07:** the following order supersedes older source-order statements only where they conflict:

1. Current explicit owner instructions and owner-approved decisions.
2. `AGENTS.md` procedural/security guardrails.
3. Owner-approved/frozen SPEC or Sprint contract for the currently active Sprint.
4. `docs/blueprint.yaml`.
5. Permissions / architecture / ADR documents.
6. Frozen contracts from earlier Sprints.
7. Legacy/F6.1 as reference only.

This resolves authority ordering only. It does **not** reopen, weaken, or alter frozen Sprint 1/2 business or security behavior. Auth, RLS, session revocation, CAS, audit, permission and venue/self scope remain binding. A Sprint 3 approval cannot silently override earlier frozen architecture/security. Any material prior-behavior change needs an explicit, separately scoped maintenance/deviation approval before design or implementation of that change. Report any further unresolved conflict and stop; do not choose silently.

OD-01 is recorded only in this document. Historical `AGENTS.md`, Blueprint, ADRs and Sprint contracts remain untouched. Their chronological Sprint 0/1/pre-merge status snapshots are interpreted using the verified subsequent closure evidence, not rewritten. The Sprint 2 contract itself identifies G3–G6 and minimum operational G7 as closed; G8 closing/billing remains open.

**OD-02 — Current authorization:** Gate 1 only; create this file, preserve a GitHub handoff, stop for owner review. No implementation, migrations, RPCs, UI, dependencies, CI implementation, technical-design document, implementation-plan document, Sprint 4 work, merge or deployment is authorized by this task. Proposed tests are written as cases in this SPEC; executable tests are not created in Gate 1.

After blockers are resolved, owner must approve the completed SPEC before Gate 2. Gate 2 must define exact technical contracts; Gate 3 must define branch/base, exact paths/purposes, dependencies, migrations, functions, UI, CI and requirement-to-code-to-test mapping; Gate 4 must authorize implementation. Approval of a draft, branch publication or earlier Sprint does not pass those gates.

## 2. Independently verified baseline and evidence

GitHub was read directly, including `branches/main`, repository tree, PR metadata, closure ledger, Actions run metadata, Sprint 2 job steps and decoded job logs. Main was rechecked after OD-01 and still matches the expected SHA. Repository tree has one root `AGENTS.md` and no existing `SPRINT_3_SPEC.md` at this base.

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

**Users:** the authenticated customer; authorized venue operators; ADMIN/CEO for permitted business oversight; MANAGER within assigned venues. STAFF closing/payment powers and USER self-close powers are undecided. Walk-ins have no fabricated account or anonymous private access.

**Success:** under an owner-approved formula and authority matrix, an eligible active session can reach one final recorded closing outcome, the amount is explainable and reproducible, validated money is conserved, and table ownership is released exactly once under the approved release condition. Concurrent/retried requests cannot duplicate charges, receipts, closure or release. A non-technical user can tell whether play continues, whether a result is merely an estimate, what is owed, and whether the action actually completed.

### IN SCOPE for this specification

- Continuation after the initial 60 minutes and the event that ends billable time.
- Closing PAYMENT and MANUAL sessions, including existing active sessions and nullable-customer walk-ins.
- Final session charge, treatment of the initial payment and additional money, safe release, and resulting session/financial record.
- Current-state reads, actor/scope rules, failures, races, retries, audit and acceptance tests for this lifecycle.
- Explicit decisions needed before the scope becomes implementable; compatibility review of frozen constraints.

### OUT OF SCOPE for this task

- All production implementation and executable test files; Gate 2/3 artifacts; any edits outside this exact file.
- Rewriting Auth/RLS/cutoff/CAS/audit, old migrations, historical contracts, Legacy or existing CI to accommodate the draft.
- Real bank/provider integration, webhook deployment, secrets, production hosting/SMTP/domain or live money operations.
- New architectures, permission engines, event buses, Redis, microservices, duplicate occupancy/balance stores, speculative modules.

### Proposed DEFERRED scope, subject to owner confirmation

- Player/Match/Video/Tournament/Shop/Telegram/CRM/AI; physical lighting/table hardware control; invitations/identity linking.
- Accounting revenue/profit dashboards, business-day aggregates, fiscal/tax invoice integration, exports and production retention/backup policy.
- Discounts, promotions, taxes/fees, pause/resume, table transfer, customer split bills, reopen/backdate/corrections, refunds and automated reversal/chargeback resolution **unless expressly brought into Sprint 3 by Q13–Q15**.

Deferring a refund *action* must not discard an excess credit or hide an unresolved obligation. Deferring a report does not remove the requirement to show the individual session's financial outcome. Deferring continuation features cannot silently choose a charge formula.

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

New overtime behavior is not inferred from F05 or F09. This SPEC preserves opening facts; it cannot relabel a MANUAL start as prepaid or an opening payment as full final settlement.

## 5. Business requirement register — proposal pending decisions

Every row is a proposed Sprint 3 requirement. “Blocked” means the owner answer and exact numerical/permission oracle must be inserted before approval; it is not permission to select a convenient implementation default.

| ID | Required behavior / missing decision | Owner blocker | Acceptance/tests |
|---|---|---|---|
| R01 | Specify whether play continues automatically after 60 minutes, requires an explicit extension, or must stop; define any grace/maximum duration and notifications. No timer-side mutation authority. | Q01 | A01; T02–T03, T35 |
| R02 | Specify the authoritative event/time that stops billing, preview-vs-confirm behavior and treatment of delay/offline requests. Preserve original start. | Q02 | A01–A02; T02, T04, T20, T35–T36 |
| R03 | Define complete VND charge formula: initial minimum/early end, overtime rate/snapshot, unit and rounding order, boundary equality, zero/long duration and limits. | Q03–Q05 | A02; T02, T05, T08, T42–T44 |
| R04 | Define MANUAL/walk-in initial and overtime liability separately from payment evidence; never count bypass as money. | Q06 | A02–A03; T06–T07 |
| R05 | Specify which existing verified funds may offset this bill; retain immutable receipt binding and separately account for unused/extra/late funds. | Q07 | A03; T09–T12, T30–T32 |
| R06 | Define settlement methods and what counts as received, partial, pending or paid. No browser bank-success button or forged opening SUCCESS. Any new cash-recording capability needs explicit authorization. | Q08 | A03, A07; T10, T13, T30–T34, T38 |
| R07 | Define the relationship among stop play, finalize bill, collect funds, close session and release ownership, including unpaid/partial/uncertain payment and service-unavailable tables. | Q09 | A04; T04, T10, T23–T25, T34 |
| R08 | Approve each role/action/read scope and any fixed extra; opening MANUAL permission does not imply close/collect authority. Specify self-close and system automation explicitly. | Q10 | A05; T14–T18, T29, T39–T40 |
| R09 | Define exceptional ending for disabled customer, disabled venue/table, absent customer and forgotten/open overnight session without relaxing Auth or rewriting time history. | Q11 | A01, A05, A07; T24, T29, T35–T36 |
| R10 | Define minimum final session/financial record and its visibility, including separate charges, validated receipts, allocations, remaining due and unresolved excess. | Q12 | A03, A06; T09–T12, T38–T40 |
| R11 | Decide whether corrections/reopen/refund/excess resolution, pause/transfer, discounts/fees/taxes and fiscal documents are excluded or separately scoped. | Q13–Q15 | A06, A08; T31–T32, T45, T48 |
| R12 | Make close and related writes atomic and at-most-once in effect; stale/missing CAS cannot mutate; retries read the committed outcome without reporting a new success. | Q09, Q16 | A04, A07; T19–T28, T30, T37 |
| R13 | Provide a short, clear user flow: authoritative estimate/summary, authorized confirmation, explicit committed result; show failure/unknown status honestly and recover by reload. | Q02, Q09–Q12 | A06–A07; T04, T18, T20, T33, T38–T41 |
| R14 | Preserve frozen foundations and opening semantics; prove old and new lifecycles together, including receipt delivery after close and reacquisition. | Q16 | A08; T01, T12, T23–T25, T32, T46–T48 |

### Numerical oracle required before Gate 1 approval

Do not fill a formula from legacy, guess “per minute,” or assume 60 minutes is the final minimum for MANUAL. Required owner-approved examples must give **exact charged VND, applied funds, remaining due, unresolved excess and release outcome** for:

- PAYMENT and MANUAL at 0s, 1s, 59:59, 60:00 and 60:01.
- Immediately before/at/after each approved rounding boundary; fractional-second cutoff and non-divisible hourly rate (e.g. 100,001 VND/hour).
- 90 minutes and multi-hour play; price change during play; overnight and timezone display changes.
- Exact prepayment, excess prepayment, partial final payment, no payment for MANUAL, extra receipt after closing.
- Preview before a billing boundary, confirmation after it; close request queued behind locks; server downtime across a boundary.

The listed amounts/times are test inputs only, not selected prices, rounding units or policy. Gate 1 remains blocked until their outputs follow unambiguously from Q01–Q09/Q11 answers.

## 6. Proposed state machines — conceptual only

No new persisted enum/table/field is selected here. Existing states below are facts; candidate states describe business outcomes for owner review. If answers require intermediate stopping/collection states, revise and reapprove this SPEC before technical design. Do not implement both alternatives or add speculative lifecycle entities.

### 6.1 Session lifecycle

Existing states: `PENDING_PAYMENT`, `ACTIVE`, `CANCELLED`. Candidate added outcome: `CLOSED` meaning play has ended, the approved closing record exists and the approved ownership-release condition has been met. Whether this also requires full payment is **Q09**, not implied by the name.

| From → to | Actor / trigger | Proposed guard/effect | Invalid/timeout/recovery behavior |
|---|---|---|---|
| PENDING_PAYMENT → ACTIVE/CANCELLED | Existing trusted payment or hold lifecycle | Frozen Sprint 2 only | No Sprint 3 closing of a never-opened request; original 300s rules preserved |
| ACTIVE → ACTIVE at 60 minutes | Server time crossing initial period | Frozen behavior remains until Q01 defines Sprint 3 continuation | No browser auto-release/paid flag; no new start on refresh/restart |
| ACTIVE → ACTIVE for preview | Approved reader, Q10 | Estimate only, unless owner explicitly approves a separate stop action under Q02 | Reading/abandoning preview does not silently close, reserve a price or settle |
| ACTIVE → CLOSED (candidate) | Explicit authorized close actor, Q10; system only if separately approved | Approved cutoff/formula/funds/release predicate; one atomic recorded outcome | Missing permission/stale versions/invalid input reject; duplicate cannot close again; ambiguity requires read-back |
| ACTIVE remains ACTIVE after failed close | Failed pre-commit operation | No partial record, release, version or success audit | Retry only with fresh authorized state; duration treatment follows Q02/Q11, not an invented freeze |
| CLOSED → CLOSED | Authorized read, duplicate command or late financial event | Original close/start/charge history retained; new money evidence cannot reopen play | Stale mutable retry rejects; independent late money policy Q07/Q13; never release a newer owner's table |
| CLOSED → ACTIVE; CANCELLED → ACTIVE/CLOSED | Reopen/revive attempt | Not authorized by this draft | Reject; Q13 would require explicit rescope and compatibility review |

Timeouts: only the existing pending-hold timeout is currently approved. No active-session maximum, preview lifetime, payment timeout or automatic close is selected. Q01/Q02/Q08/Q11 must specify either an exact rule or explicit “no automatic transition.” Server restart must recover from durable committed state, never from a browser timer or lost in-memory command.

### 6.2 Table service and occupancy

Service stays `ACTIVE / MAINTENANCE / DISABLED`. Occupancy remains derived from the authoritative owning session, including any later approved intermediate state that still owns the table.

| Transition | Actor / condition | Invalid/timeout/recovery behavior |
|---|---|---|
| PLAYING → unoccupied | Approved session close/release decision | One atomic ownership change; never set a second busy/free flag |
| Unoccupied → AVAILABLE | Derived only if venue/service eligible | Closed session does not enable a disabled venue or maintenance table |
| Unoccupied → unavailable for service | Venue disabled or table not serviceable | Financial completion does not override service status |
| AVAILABLE → PENDING/PLAYING | Existing acquire/MANUAL opening | Must serialize with close; no two owners |
| Old CLOSED-session retry/late callback while new owner exists | Old request/event | Preserve old record; cannot release, reset, transfer or preempt new ownership |

No timeout can make a financially unresolved *cancelled opening* own a table again. Whether an unpaid **ended active session** continues to own capacity is unresolved Q09 and must not be inferred from cancelled-hold behavior. Restart recomputes occupancy from durable state; no worker-only release safety.

### 6.3 Financial outcome and settlement

Frozen opening payment states remain `WAITING / SUCCESS / CANCELLED / PAYMENT_NEEDS_RESOLUTION`. They are not renamed to final bill status. Receipts remain immutable CREDIT/REVERSAL_NOTICE/RECONCILIATION_NOTICE evidence; notice is not an automatic debit/refund.

Candidate final-bill outcome labels, not table/enum design: **DUE**, **SETTLED**, **NEEDS_REVIEW**. Their exact persisted or derived representation and allowed combinations are deferred to Gate 2 after decisions. An excess/reconciliation flag may coexist with a paid bill; it must not hide a liability or undo an opening fact.

| Outcome change | Trigger / actor | Required safety / unresolved rule |
|---|---|---|
| No final bill → DUE/SETTLED/NEEDS_REVIEW | Authorized finalization | Compute approved charge and application of validated funds, Q03–Q09; record once |
| DUE → DUE | Verified partial settlement if approved | Unique money counted once; remaining derived; no fake paid flag |
| DUE → SETTLED | Enough eligible validated funds under Q07/Q08 | Check exact approved predicate, audit and financial effects atomically |
| Any → review flag/outcome | Conflicting/late/excess/reversal evidence | Keep immutable evidence; Q07/Q13 decide allocation/resolution; never automatically reopen/release |
| SETTLED → same | Duplicate evidence or read/retry | No second credit, charge or settlement |
| Review → resolved / SETTLED → corrected | Human resolution, refund or correction | Not authorized; Q13 must explicitly include or defer with a safe retained unresolved case |

Partial or external operation timeout never means “paid.” No automatic write-off, refund or cancellation of debt. Timeout/cancel semantics for any new payment attempt remain Q08; provider outage cannot erase receipts. Recovery replays stable financial identities through an approved boundary; it cannot synthesize receipt evidence or pretend the bank operation rolled back with the DB.

## 7. Proposed invariants

All are acceptance obligations for a future approved Sprint 3; inherited guarantees remain binding now. Numbering is local to Sprint 3.

| ID | Condition that must always hold | Requirements / tests |
|---|---|---|
| I01 | One authoritative session/ownership history; at most one owner per table, including close/reacquire races and any approved intermediate phase. | R07/R14; T23–T25, T46 |
| I02 | Opening identity, method, start, initial amount/reference and receipt bindings retain their historical meaning; closing never rewrites them to make billing convenient. | R02/R04/R05/R14; T01–T02, T06–T07, T12, T32 |
| I03 | Client time, price, claimed amount, paid status, actor or role never becomes authority. Approved charge is reproducible from authoritative facts and the approved policy. | R02/R03; T04–T05, T08, T13, T42–T44 |
| I04 | Integer VND arithmetic is exact; intermediate/final overflow, invalid negative/fractional values or malformed inputs fail without partial effects. | R03/R06; T08, T13, T26 |
| I05 | Money is conserved and traceable: counted funds have evidence; no duplicate allocation or hidden disappearance; unused/excess/unresolved funds remain visible. MANUAL is not payment. | R04–R06/R10; T06, T09–T12, T30–T32 |
| I06 | One real money movement is counted at most once, even across event IDs, finalization retries and any approved settlement channel. No receipt rebinding to a new session. | R05/R06/R12; T12, T30–T32 |
| I07 | One accepted closing outcome per session; duplicate close cannot generate another bill/charge/release or reset a stop/start time. | R07/R12; T19–T23, T27–T28 |
| I08 | The approved DB close outcome, financial record/application, ownership change, versions and success audit commit together or none do. External money is not part of a fictitious distributed transaction. | R07/R12; T26–T28, T34, T37 |
| I09 | Stale/missing CAS never mutates; every changed mutable row increments once per command; no-op/duplicate creates no new success audit. Read-back of previous success is not fresh mutation success. | R12; T19–T22, T26–T28 |
| I10 | Live Auth/account/session/cutoff, role and action-specific venue/self scope govern every private read/write, including recovery and retries. UI is never authority. | R08/R09; T14–T18, T29, T39–T40 |
| I11 | Close/collect/review permission cannot be inferred from MANUAL-open, HR, global read or a menu. Unknown extras grant nothing; extras never widen venue scope or bypass revocation. | R08; T14–T18, T29 |
| I12 | Release cannot enable service or touch another session's ownership. A financial problem after release cannot reclaim a table from a newer session. | R07/R14; T12, T23–T25, T32 |
| I13 | Time passing, client disconnect, provider outage or worker/server restart causes only approved transitions; it cannot create payment evidence, silently forgive debt or invent a closing timestamp. | R01/R02/R09/R12; T03–T04, T33–T37, T44 |
| I14 | Audit and receipts remain append-only, redacted and scope-protected; denied/rolled-back operations have no success audit. Correction, if approved later, is attributable new evidence. | R10–R12; T13, T26, T30–T32, T39–T40, T45 |
| I15 | Final record states play/charge/payment/release separately and honestly. Initial payment SUCCESS or a MANUAL 60-minute timer never falsely means final bill paid. | R04/R07/R10/R13; T06–T07, T09–T11, T38 |
| I16 | Opening/financial/session facts survive cancellation, account/venue changes, retries and restart; no historical deletion, fake identity or undocumented reallocation. | R05/R09/R14; T07, T12, T24, T29, T32, T35–T36 |
| I17 | Prior frozen security/opening contracts and tests remain intact; any necessary material deviation is explicitly approved first. No future module is introduced. | R14; T01, T47–T48 |
| I18 | Estimates, unknown results and committed outcomes are distinguishable; reconfirmation cannot silently accept a changed amount or stale authority. | R02/R12/R13; T04, T18–T20, T33, T38–T41 |

## 8. Permissions and scope

Notation: G=global business; V=active assigned venue; S=own customer session for any role; E(V)=explicit fixed venue extra. All private paths require live ACTIVE account/session. “Proposed” is not a grant. “UNDECIDED” remains denied/not exposed until approved, rather than becoming an implementation default.

### Frozen reads retained

| Existing action | ADMIN | CEO | MANAGER | STAFF | USER |
|---|---|---|---|---|---|
| Own sessions/opening payment | S | S | S | S | S |
| Table operations | G | G | V | V, minimal operational fields | DENY |
| Opening financial cases | G | G | V, safe projection | DENY | DENY |
| BUSINESS audit | G | G | V | DENY | DENY |
| SECURITY audit | G | DENY | DENY | DENY | DENY |

### New Sprint 3 action decisions — Q10 must close every row

| Action | ADMIN | CEO | MANAGER | STAFF | USER | Scope / guard |
|---|---|---|---|---|---|---|
| Read own estimate/final record | Proposed S | Proposed S | Proposed S | Proposed S | Proposed S | No other customer's money; no NULL walk-in claim |
| Read operational ended/closed status | Proposed G | Proposed G | Proposed V | Proposed V, no finance expansion | DENY internal | Status does not imply financial authority |
| Read management final financial record | Proposed G | Proposed G | Proposed V | DENY proposed; exception requires explicit limited fields/extra | DENY internal | Safe business data, no raw bank/Auth |
| Request end as customer, if distinct from close | UNDECIDED S | UNDECIDED S | UNDECIDED S | UNDECIDED S | UNDECIDED S | Q02/Q09 decide if this action even exists |
| Preview/confirm operator close | UNDECIDED G | UNDECIDED G | UNDECIDED V | UNDECIDED V or E(V) | DENY internal; self-close separately undecided | No role inferred from opening powers |
| Confirm customer self-close | UNDECIDED S | UNDECIDED S | UNDECIDED S | UNDECIDED S | UNDECIDED S | Existing owner only, not anonymous walk-in |
| Record non-provider cash/other settlement, if included | UNDECIDED G | UNDECIDED G | UNDECIDED V | UNDECIDED V or E(V) | DENY recording internal receipt | Explicit evidence/reason/confirmation rule required |
| Release with unpaid/uncertain balance, if included | UNDECIDED G | UNDECIDED G | UNDECIDED V | UNDECIDED V or E(V) | UNDECIDED S | Q09 must define whether separate action is needed |
| Correct/reopen/waive/refund/reallocate | Not authorized | Not authorized | Not authorized | Not authorized | Not authorized | Proposed deferred; Q13 explicit scope required |
| Grant/revoke new approved fixed extra | Existing ADMIN mechanism only | DENY | DENY | DENY | DENY | No new generic grant API; preserves cutoff/audit |

No extra permission name is selected prematurely. Q10 must either approve no extras or name each fixed action, eligible role, scope and minimum projection. Grant/revoke must use frozen authority, atomic cutoff/audit and old-session denial. A new Staff close action must not inherit full financial/customer-directory/audit visibility. Decide exactly what the operator needs to see to confirm safely.

Trusted SYSTEM/provider automation is outside these five role grants: only a narrowly authorized event may invoke it, never a browser-supplied SYSTEM actor. Timer auto-close is not approved. Provider ingestion is not an ADMIN permission to fabricate bank payments.

## 9. Security, trust and audit boundaries

**Trusted authority:** current DB identity/role/account/membership/cutoff; table/session ownership and service; immutable opening snapshot/start; validated immutable money evidence; approved server-side pricing/cutoff rule; persisted versions and audited transaction outcomes. A server-calculated estimate is still only an estimate until the approved closing event occurs.

**Untrusted inputs:** table/session/venue IDs, request keys, expected versions, beneficiary hints, reason text, timestamps, displayed price, claimed elapsed duration, totals, payment screenshots/return URLs, event bodies, role/actor/source flags. IDs/versions identify/check authorized targets; they grant no rights. Validate length/type/range and escape text; never use a free-text reason to alter monetary facts.

**Server-only:** provider credentials, signature material, operator/database credentials and trusted ingestion capabilities. No service-role in a browser/shared client bundle; no generic DB proxy; no direct protected-table writes. RLS/grants plus narrow authorized RPCs remain authoritative; any definer requires minimum owner, safe fixed search_path, explicit EXECUTE and denial tests. No widening Auth/session reader access.

**Audit requirement proposal:** closing, release and any included financial settlement/correction must record trusted actor/source, session/table/venue correlation, approved reason, relevant before/after outcomes, exact VND amounts and versions in the same DB transaction. Exact fixed action names and field allowlist await Gate 2, not an arbitrary audit payload API. BUSINESS visibility stays scoped; SECURITY visibility remains ADMIN-only. No raw bank payload, unnecessary customer contact, credentials or tokens. No audit/receipt deletion to repair mistakes.

**Concurrency boundary:** closing must coexist with the frozen security writer, opening/callback/invalidation locks and ownership constraints. Gate 2 must prove compatible ordering; it cannot replace the barrier or accept stale authority to avoid a deadlock. No external network call while holding ownership locks. Independent sessions must not become a new global serialized business queue without approval.

## 10. Closing, failure, retry and concurrency cases

These outcomes are proposed safety obligations; policy-dependent monetary/release results remain blocked, never guessed.

| Situation | Required safe handling / unresolved decision | Tests |
|---|---|---|
| Close before/at/after 60 minutes or rounding boundary | Exact Q01–Q05 oracle, original start preserved; no undocumented free minute or minimum | T02, T05, T08 |
| Preview then wait, leave screen or change tab | No implicit close/frozen bill; Q02 decides confirm-time price/cutoff and reconfirmation | T04, T38 |
| Request queued behind lock | Authoritative cutoff follows Q02, not client timestamp or stale transaction start | T04, T22, T44 |
| Close wrong state or another owner's session | Deny, no bill/release/success audit; own pending cancellation remains separate | T01, T14–T16 |
| Network lost before commit | No partial effects; retain input, fetch current authorized state before retry | T20, T26–T27 |
| Commit succeeded, response lost | UI says result uncertain, then reads committed record; stale mutable retry cannot report another success | T19–T20, T27–T28 |
| Two operators/customer and operator close together | One outcome; loser conflict/current outcome, no second charge/release/audit | T21–T22 |
| Close races new acquire/MANUAL open | New owner only after approved release commits; old retry never acts on new owner | T23, T25 |
| Close races price/service change | Original initial snapshot preserved; overtime policy explicit; service state not overwritten | T05, T24 |
| Close races role/extra/account/membership revocation | Frozen authorization serialization and cutoff hold; forbidden post-change write denied | T18, T29 |
| Partial or extra receipt during preview/close | Safe dedupe; financial snapshot/version invalidated; no silently different confirmation | T10, T19, T30 |
| Old reference receives money after close/reacquire | Keep immutable original binding/evidence; Q07/Q13 handling; no reopening or crediting new session | T12, T32 |
| Duplicate callback, changed payload with same identity | Duplicate at-most-once; conflicting identity rejected/flagged without overwrite | T30–T32 |
| Provider/QR unavailable or settlement times out | Never paid-by-assumption; retain evidence; retry/reference/timeout policy Q08; release Q09 | T33–T34 |
| External money moved, DB transaction fails | DB rollback is not bank rollback; reconcile/replay stable evidence, no false ACK of committed result | T26, T34, T37 |
| DB constraint/audit failure; process dies mid-command | All DB effects roll back; replay/read-back produces at most one committed outcome | T26–T28, T37 |
| Server/worker restart or browser offline overnight | Durable state survives; no new start, client-backdated end or invented write-off; downtime charge Q11 | T35–T36, T44 |
| Table/venue unavailable or customer disabled while ACTIVE | No automatic frozen-flow close; authorized exception Q11; disabled customer gets no private bypass | T24, T29 |
| Invalid money/version/reason/ID or amount overflow | Reject safely; no truncated/wrapped VND, partial effects or leaked private target | T08, T13, T19 |
| Reversal, correction/refund request or abandoned unpaid bill | Preserve facts and unresolved obligations; only approved action Q13, no automatic netting/reopen | T31–T32, T45 |

Retry is not a new business decision. Interactive updates retain frozen stale-CAS rejection; provider messages use immutable event/transfer identities. A fresh version does not authorize a second closure of a terminal session. Any durable close-command identity/recovery representation is a Gate 2 choice constrained by I07–I09, not a generic command store authorized here.

## 11. Acceptance criteria and full draft test matrix

### Acceptance criteria

| ID | Objectively required evidence |
|---|---|
| A01 | Approved continuation/cutoff/exception state transitions have exact positive, negative and boundary outcomes; frozen initial period facts remain unchanged. |
| A02 | Every approved monetary example produces exact expected integer VND for both PAYMENT and MANUAL; time/rate tampering and overflow fail. |
| A03 | Per-session charge, received evidence, applied funds, remaining due and unresolved excess reconcile exactly without duplicate counting, false paid labels or erased receipts. |
| A04 | Closing/release happens once and atomically under two-actor races, acquire races, rollback, lost response and replay; a new table owner remains unaffected. |
| A05 | Every approved permission row is tested allow/deny with real ordinary-user Auth, own/other/venue scope, old JWT/refresh and preview-to-confirm revocation. |
| A06 | Final record/estimate/status/confirmation/errors are readable and truthful in Chromium/WebKit at 1440/390/320; no forbidden field, route or action exposure. |
| A07 | Network/provider/DB/server failure and recovery preserve state/money/audit; unknown outcome is not success; no silent retries of stale financial consent. |
| A08 | Exact approved scope and frozen compatibility review, all required static/DB/integration/browser regressions, no unexpected FAIL/NOT RUN/SKIPPED/FLAKY, then approved merge and exact-main CI before eventual CLOSED/FROZEN. |

### Test execution contract

All cases below are **NOT RUN / SPECIFICATION ONLY**. Blocker column names the missing oracle; rows without a question still await approved implementation. A case with a conditional policy is not objectively complete until the owner choice and exact expected outcome are written here. No Gate 1 approval while a blocker remains.

D=real DB constraints/RLS/transactions; A=real local Supabase/Auth/API integration; U=deterministic calculation supplement; B=real Playwright with backend; S=static/diff/CI review. Privileged fixture setup/fault injection may arrange state but cannot replace ordinary-user allow/deny assertions. Race cases use independent connections and observe persisted outcomes/audit/versions, not just HTTP responses. Controlled boundary tests must not add a production clock override or rely on flaky sleeps. Exact test files/code mapping belongs to Gate 3.

| ID | Scenario and required assertion | Layer | Maps to | Blocker |
|---|---|---|---|---|
| T01 | Entire frozen opening/security regression: pending cancellation/expiry, inclusive 300s boundary, full/partial/late payment, MANUAL, initial timer and old Auth/CAS rules unchanged; close rejects PENDING/CANCELLED. | D/A/B | F01/F03–F04/F06/F11; R14; I02/I17; A08 | Q16 |
| T02 | PAYMENT/MANUAL at 0, 1s, 59:59, 60:00, 60:01: exact charge/cutoff/continuation outcome; original started_at unchanged. | D/A/U/B | R01–R04; I02/I03; A01/A02 | Q01–Q06 |
| T03 | Initial period ends with browser disconnected/worker stopped; only approved continuation transition occurs, no client release or fake payment. | D/A/B | R01; I13; A01 | Q01 |
| T04 | Preview abandoned, two tabs, delayed confirmation/lock wait crossing price boundary; read does not silently stop time; approved cutoff/changed-total confirmation exact. | D/A/B | R02/R07/R13; I03/I18; A01/A06 | Q02/Q09 |
| T05 | Price changed before/after acquisition and during play: initial snapshot fixed; overtime uses exactly approved rate/time policy. | D/A/U | R03; I02/I03; A02 | Q04 |
| T06 | MANUAL without any payment evidence: exact initial/final liability; no fake opening payment/SUCCESS/receipt or “prepaid” display. | D/A/B | R04; I02/I05/I15; A02/A03 | Q06 |
| T07 | MANUAL known beneficiary vs NULL walk-in: actor distinct; no synthetic Auth/profile; walk-in record management-only under approved scope. | D/A/B | R04/R08; I02/I10/I16; A03/A05 | Q06/Q10 |
| T08 | Non-divisible rate, before/at/after rounding unit, fractional second, very long duration, max bigint: exact approved rounding order or safe overflow rejection. | D/A/U | R03; I03/I04; A02 | Q03–Q05 |
| T09 | Initial CREDIT evidence offsets final charge exactly as approved, applied at most once; received vs charge vs balance shown separately. | D/A/B | R05/R10; I05/I15; A03 | Q07/Q12 |
| T10 | Partial final receipt before/during/after closing: correct due/settled/release predicate, fresh consent and no double application. | D/A/B | R05–R07; I05/I07/I18; A03/A04 | Q07–Q09 |
| T11 | Excess initial amount at short/long session: exact allocation and retained surplus; no implicit extra time/refund. | D/A/B | R05/R10; I05/I15; A03 | Q03/Q07/Q12 |
| T12 | Money from cancelled/unmatched/different session or venue cannot be borrowed/rebound; old reference after reacquire never funds/releases new session. | D/A | R05/R14; I02/I05/I06/I12; A03/A04 | Q07 |
| T13 | Forge client amount/rate/start/end/paid/actor/role/venue; invalid UUID/reason/type, direct mutable/receipt/audit write, private helper call: denial/no leaked target/no partial effect. | D/A | R03/R06/R08; I03/I04/I10/I14; A02/A05 | Q08/Q10 |
| T14 | Each of five roles exercises every §8 new action: approved allow rows succeed, deny rows fail at API/DB even with direct URL or altered body. | D/A/B | R08; I10/I11; A05 | Q10 |
| T15 | MANAGER A/AB, STAFF A/default/extra, inactive membership, cross-venue IDs: exact assigned scope only; extra grants no global/finance leakage. | D/A/B | R08; I10/I11; A05 | Q10 |
| T16 | USER own vs other's record; internal role as own customer; NULL walk-in; anonymous/public list: no implicit self/finance access. | D/A/B | R08/R10; I10/I16; A05 | Q10/Q12 |
| T17 | Disabled account, absent/wrong-user session, old JWT and refreshed old session after cutoff denied; fresh login limited to current authority. | D/A/B | R08/R09; I10; A05 | — |
| T18 | Permission/account/membership revoked between preview and confirm: frozen serialization, denied next action and cleared protected UI, no success audit. | D/A/B | R08/R12/R13; I10/I11/I18; A05/A07 | Q10 |
| T19 | Missing/stale versions, equal updated_at with different versions, versions beyond JS safe integer, related financial version changed: reject without mutation/audit. | D/A/B | R12; I09/I18; A04/A07 | — |
| T20 | Close commit response lost vs request failed before commit: distinguish by authorized read-back; stale retry not new success; retain one/no outcome respectively. | D/A/B | R02/R12/R13; I07/I09/I18; A07 | Q02/Q09 |
| T21 | Two operators confirm same session/version simultaneously; exactly one outcome, one close audit and one release, loser cannot create second bill. | D/A | R12; I07/I09; A04 | Q09/Q10 |
| T22 | Customer-vs-operator close and delayed stale confirmation with independent transactions; approved authority/time boundary respected, no double effect. | D/A | R02/R08/R12; I07/I09/I10; A04/A05 | Q02/Q10 |
| T23 | Close races two new customers' acquire/MANUAL requests: before release no new owner; after commit at most one new owner, no occupancy gap inconsistent with close result. | D/A | R07/R14; I01/I07/I12; A04 | Q09/Q16 |
| T24 | Close vs table maintenance/disabled venue/customer disable: service remains authoritative, old active facts retained, approved exceptional close only. | D/A | R07/R09; I12/I16; A04/A05 | Q09/Q11 |
| T25 | Old close replay after new owner acquired/opened: new owner and timer/payment untouched; old record returned only to authorized reader. | D/A/B | R07/R12/R14; I01/I07/I12; A04 | Q09 |
| T26 | Inject audit, constraint, overflow and related-row failure at closing/settlement: full state/record/version/release rollback, no success audit. | D/A | R12; I04/I08/I09/I14; A07 | Q09 |
| T27 | Stop process/connection before commit, after commit before response, and during retry: recover one/no durable result correctly; no orphan bill. | D/A | R12; I07/I08/I09; A07 | Q09 |
| T28 | Repeated same close attempt and changed payload/guessed command identity: no double effect or disclosure; current-version terminal request does not reopen/reclose. | D/A | R12; I07/I09/I10; A04/A07 | Q09 |
| T29 | Close/settlement races role/scope/extra/account mutation: frozen writer barrier/cutoff guarantees and current authorization preserved without helper rewrite. | D/A | R08/R09/R14; I10/I11/I16/I17; A05/A08 | Q10/Q11/Q16 |
| T30 | Duplicate transfer delivered under same/new event IDs races close and another receipt: count once, exact binding, safe version invalidation, no duplicate settlement/audit. | D/A | R05/R06/R12; I05/I06/I14; A03/A04 | Q07/Q08 |
| T31 | Same event/transfer ID with changed amount/reference/currency; nonfinal/reversal notice: no overwritten/rebound/extra CREDIT or automatic debit/refund. | D/A | R05/R06/R11; I05/I06/I14; A03 | Q07/Q13 |
| T32 | Unique true late CREDIT after CLOSED, including reopened table for another customer: preserve evidence/approved unresolved outcome; original charge/start/end and new owner unchanged. | D/A/B | R05/R10/R14; I02/I05/I06/I12/I16; A03/A04 | Q07/Q13/Q16 |
| T33 | Provider unconfigured/down, QR preparation error, unknown confirmation: no fake paid/success button; clear recovery instruction under approved settlement policy. | A/B | R06/R13; I13/I18; A07 | Q08 |
| T34 | Final payment timeout/cancel with 0/partial/full money, bank transfer succeeded but DB/ACK failed: exact approved attempt/release policy and replayable evidence. | D/A | R06/R07/R12; I05/I08/I13; A03/A07 | Q08/Q09 |
| T35 | Server/worker restarts across 60-minute/cutoff boundary; same persisted start and committed end/bill, approved charging for downtime, no timer-reset/release shortcut. | D/A/B | R01/R02/R09/R12; I13/I16; A01/A07 | Q01/Q02/Q11 |
| T36 | Offline/abandoned/overnight session and disabled customer seeking assistance: no client backdate or private bypass; approved operator procedure only. | D/A/B | R02/R09; I13/I16; A01/A05 | Q02/Q11 |
| T37 | Forced deadlock/serialization failure/retry under real locks: bounded recoverable error, atomic rollback or one commit, no new identity/credit on retry. | D/A | R12; I08/I09/I13; A07 | — |
| T38 | End-to-end estimate → authorized confirmation → result for PAYMENT, MANUAL, zero-due, partial/unresolved cases; truthful distinct charge/payment/release labels and preserved input. | B | R04/R07/R10/R13; I15/I18; A06 | Q06/Q09/Q10/Q12 |
| T39 | Final record projections for every role/scope/public path; no raw provider/Auth/contact/other-customer fields; Staff gets only specifically approved fields. | D/A/B | R08/R10; I10/I14; A05/A06 | Q10/Q12 |
| T40 | BUSINESS vs SECURITY audit, trusted actor/reason/source, direct audit modification denied, failed operation no success audit; new payload redaction intact. | D/A | R10/R12; I10/I14; A05/A07 | Q10/Q12 |
| T41 | Chromium/WebKit 1440/390/320: keyboard/focus, no horizontal overflow, readable money/status, direct-route denial, offline/unknown/retry/revocation messages. | B | R13; I18; A06/A07 | Q10/Q12 |
| T42 | Complete owner-approved numeric oracle set in §5, both opening methods, no float or implicit legacy rule; DB/API/unit outputs agree. | D/A/U | R03/R04; I03/I04; A02 | Q03–Q06 |
| T43 | Initial snapshot unchanged; no unapproved taxes/fees/discounts/pause/transfer or split-bill charge; excluded action denied/absent. | D/A/U/B | R03/R11; I02/I03/I17; A02/A08 | Q14/Q15 |
| T44 | UTC duration across local midnight/timezone/DST display changes, subsecond and very long sessions; approved billing semantics reproducible independent of client clock. | D/A/U/B | R02/R03/R09; I03/I13; A01/A02 | Q02/Q04/Q05/Q11 |
| T45 | Reopen/backdate/refund/waive/correct request: denied/absent if deferred; if included, replace with explicit approved attributable non-destructive correction cases before approval. | D/A/B | R11; I14/I16/I17; A08 | Q13 |
| T46 | Different customers/tables close independently; same customer with multiple legitimate ACTIVE sessions targets exact session, no accidental global active-session limit. | D/A | R07/R14; I01/I12; A04 | Q09 |
| T47 | Clean reset plus all retained DB/API/unit/browser regressions on actual candidate; additive compatibility tests preserve opening success/history/constraints and frozen Auth/RLS/cutoff/audit/CAS. | D/A/U/B/S | R14; I17; A08 | Q16 |
| T48 | Exact approved file delta, no secrets/future work/Legacy edits; dependency audit/typecheck/lint/build; final full review and exact-main CI after separately approved merge. | S | R11/R14; I17; A08 | Future Gates 3–6 |

All R01–R14, F01–F16 and I01–I18 have test mappings above. These 48 IDs are specification cases, not predicted automated test counts. Permission T14 expands to every matrix cell; races and numerical T42 expand to all approved examples. If an owner adds a behavior, add its explicit test/oracle before approving the SPEC; do not hide new scope in an implementation test.

## 12. Explicit owner questions

### 12.1 IMPLEMENTATION BLOCKER — all require an answer or explicit deferral

These are questions, not recommendations silently accepted as business rules. Scope deferral must leave a complete safe close/bill/release lifecycle; otherwise the blocker remains.

| ID | Câu hỏi owner cần chốt | Why it blocks / required decision |
|---|---|---|
| Q01 | Hết 60 phút: khách tự chơi tiếp rồi tính thêm, phải bấm gia hạn/trả thêm trước, hay phải dừng? Có thời gian miễn thêm hoặc giới hạn tối đa không? | Continuation and timeout transitions; specify exact grace/limit or none, and whether notification is required. No inherited overtime rule. |
| Q02 | Mốc dừng tính tiền là lúc khách bấm yêu cầu, nhân viên xác nhận, hay server chốt đóng? Xem trước hóa đơn có dừng đồng hồ không? Nếu chờ lâu/tổng thay đổi thì xác nhận lại thế nào? | Exact authoritative cutoff, preview behavior, lock/network delay and permitted backdating. Client time cannot be trusted. |
| Q03 | Khách PAYMENT nghỉ trước 60 phút: tính tối thiểu đủ 60 phút hay tính thực dùng? Phần trả dư giữ xử lý hay được hoàn? | Final minimum/early close economics; initial collection already frozen, final entitlement not decided. Refund execution is separate Q13. |
| Q04 | Sau 60 phút dùng giá đã chụp lúc mở hay giá khác? Đổi giá giữa phiên/qua khung giờ/qua ngày tính thế nào? | One complete pricing rule and moment it becomes fixed; cannot alter initial snapshot. |
| Q05 | Tính thêm theo giây, phút hay block? Làm tròn thời gian và VND theo thứ tự nào? 60:01, giá 100.001đ/giờ, phiên rất dài tính bao nhiêu? | Exact integer formula, rounding/equality and practical duration/amount limits; fill §5 oracles. |
| Q06 | Phiên MANUAL/walk-in chưa có tiền trả trước: thu toàn bộ thời gian thế nào, có tối thiểu 60 phút không, áp dụng cùng giá/làm tròn không? | Payment bypass does not mean prepaid/free; define initial and overtime liability without fake opening payment. |
| Q07 | Tiền mở bàn, tiền dư lúc mở và tiền về muộn được trừ vào hóa đơn này thế nào? Tiền về sau khi đóng giữ xử lý hay bù khoản còn thiếu? | Explicit fund-application and excess/late policy; immutable receipt binding and no cross-session borrowing remain mandatory. |
| Q08 | Sprint 3 thu phần còn thiếu bằng kênh nào: chuyển khoản được provider xác thực, tiền mặt do người có quyền ghi nhận, hay cách khác? Thanh toán từng phần, timeout, hủy yêu cầu thu xử lý ra sao? | Choose settlement business scope/evidence first. No actual provider chosen; cash needs explicit new permission/evidence and cannot forge Sprint 2 bank SUCCESS. |
| Q09 | Có phải thu đủ mới đóng/trả bàn? Hay dừng giờ/trả bàn trước, khoản thiếu xử lý riêng? Khi không rõ đã nhận tiền thì bàn ở trạng thái gì? | Defines meanings of CLOSED/settled/released, atomic boundary, ownership during collection and need for intermediate state. Revise §6 after answer. |
| Q10 | Ai được xem tiền, yêu cầu kết thúc, xem trước/chốt đóng, ghi tiền mặt, trả bàn khi còn nợ? Chốt từng ADMIN/CEO/MANAGER/STAFF/USER; Staff mặc định hay quyền bổ sung riêng? | Resolve every §8 cell, exact fixed extra names if any, self/global/venue scope and minimum operator fields; automatic SYSTEM action separately. |
| Q11 | Khách bị khóa, bàn/chi nhánh ngừng phục vụ, khách bỏ đi/quên đóng hoặc server mất kết nối lâu: ai kết thúc, lấy mốc giờ nào, tính khoảng gián đoạn thế nào? | Exceptional active-session policy; retain history and frozen disabled-account denial. No guessed maximum duration/auto-forgiveness. |
| Q12 | Bản ghi cuối cần hiển thị gì cho khách/nhân viên/quản lý? Chỉ chi tiết phiên hay cần bản in/tải? Hóa đơn tài chính/thuế có thuộc Sprint này không? | Approve record and projection scope. Proposed minimum: session/table/venue/method, start/end/duration, pricing basis, charge, validated received/applied/due/excess, close/release/settlement status and safe operator evidence; exact visibility needs approval. |
| Q13 | Sprint này có sửa hóa đơn, mở lại, miễn/giảm nợ, hoàn tiền hoặc xử lý dứt điểm khoản dư/đảo giao dịch không? Nếu chưa, xác nhận giữ khoản cần xử lý và không có nút thực hiện. | Define excluded actions and safe unresolved outcome. Any included correction/refund requires its own explicit rules/state/permissions/tests and compatibility review. |
| Q14 | Có tạm dừng giờ, chuyển bàn/chuyển người, chia hóa đơn trong Sprint 3 không? | Proposed deferred. If included, revise scope/rules before approval; no speculative support code. |
| Q15 | Xác nhận Sprint 3 chỉ tiền giờ VND, chưa thêm phí/thuế/khuyến mãi và dashboard doanh thu/ngày kinh doanh? | Proposed deferred/excluded. Any inclusion requires exact money/reporting definitions; frozen opening amount never silently changed. |
| Q16 | Có cho phép bước review tương thích riêng để bổ sung kết thúc phiên mà vẫn giữ sự thật payment mở bàn, ràng buộc tiền/quyền và lịch sử? | See §13: approval of this draft is not blanket permission to replace frozen constraints/functions. Exact maintenance/deviation, if material, needs separate approval before proceeding. |

### 12.2 PROVIDER/ENVIRONMENT DEPENDENT BUT NON-BLOCKING for drafting

| ID | Unresolved item | Boundary |
|---|---|---|
| P01 | Actual provider/bank/merchant, immutable identity/signature/finality/reference/replay capabilities | Not needed to ask/specify business decisions. If Q08 requires live online settlement for acceptance, provider readiness becomes a gate for that path; never label it non-blocking for live delivery. |
| P02 | Provider sandbox/live credentials, QR/reference limits, delivery/reconciliation behavior | Separately authorized integration; do not invent API fields, generate fake bank QR or claim fixture tests as live-bank evidence. |
| P03 | Production hosting/SMTP/clock operations/monitoring, physical device verification | Local real Supabase/Auth and browser-engine tests suffice only for their stated scope; production/device claims require later evidence. |

### 12.3 FUTURE SPRINT

| ID | Deferred area |
|---|---|
| U01 | Player/Match/Video/Tournament/Shop/Telegram/CRM/AI and identity linking; roadmap remains unchanged. |
| U02 | Revenue/profit/business-day accounting, fiscal integration and exports unless Q12/Q15 explicitly changes Sprint 3 scope. |
| U03 | Refund/correction/reversal execution and pause/transfer/split-bill only if owner explicitly defers them under Q13/Q14; handling and visibility of unresolved funds remain Sprint 3 decisions. |
| U04 | Production retention/privacy, backup/restore SLA, historical import, actual bank integration and physical hardware operations. |

## 13. Frozen compatibility findings — not authorization to change

Direct source inspection found concrete boundaries, not an existing implementation defect:

| Frozen surface | Finding | Gate consequence |
|---|---|---|
| `20261007000100_table_payment_contract.sql`: session CHECKs | Session state whitelist has no CLOSED; MANUAL shape currently requires ACTIVE; state/time checks describe pending/active/cancelled only. | New ending lifecycle needs an explicitly reviewed additive extension. Never edit the frozen migration or overload CANCELLED for played sessions. |
| `20261007000200_table_payment_operations.sql`: `private.sprint2_validate_payment_session` | MANUAL forbids an opening payment row; PAYMENT SUCCESS currently requires session ACTIVE. A naive ACTIVE→CLOSED would violate the deferred invariant. | Do not “fix” by changing SUCCESS to CANCELLED or disabling the constraint. Report exact compatibility maintenance proposal after business decisions; preserve proof of successful paid opening, including historical closed sessions. |
| `payments.session_id UNIQUE`, opening-specific balances/reference | Existing payment is the initial opening intent; its required amount derives from the initial session snapshot. | Do not reuse that amount/reference as a mutable final invoice or invent another payment row by bypassing uniqueness. Q07/Q08 then Gate 2 must determine a minimal approved extension. No extra ledger/payment entity selected here. |
| `table_single_owner` and existing projections | Ownership/reads currently recognize PENDING_PAYMENT and ACTIVE; no finalized session/bill projection exists. | Q09 must settle which phases own capacity. Prove release/reacquire and old-callback behavior with existing acquire/manual flows; no shadow occupancy flag. |
| Frozen Auth writer/barrier, version helpers, audit whitelist and new fixed permissions | New close/finance entrypoints must preserve existing enforcement and scoped redaction. | Explicit narrow compatibility scope and tests before any change; no global bypass, Auth grants or generic permissions engine. |
| Existing workflows' exact Sprint 2 allowlists | New document/path or later implementation is outside the old implementation contract. | No CI edits or assertions relaxed now. Gate 3 must seek exact CI-scope approval before future implementation/PR gates; absence of a docs-branch CI run is not Sprint 3 PASS. |

**STOP condition M01:** if adding the approved new ending behavior requires material change to a frozen prior behavior, security contract, invariant, RPC behavior or test expectation, first submit the exact maintenance/deviation scope and obtain explicit owner approval. Q16 identifies this compatibility gate; it does not pre-authorize any code or provide a design around it. Ordinary additive Sprint 3 behavior may be specified only while preserving prior opening/security meaning. No compatibility patch has been made.

This draft intentionally does not decide tables/fields/indexes/functions, final representation, migration SQL, exact permission additions, lock order changes or UI routes. Those are Gate 2 outputs only after the business SPEC is approved and any applicable maintenance boundary is resolved.

## 14. Document checkpoint, handoff and stop

- Deliverable: this single new file on `sprint3-spec`, based on verified frozen main `1b6f713a990aabb4f705d5f0735856442a59b7db`.
- Known facts, proposals and unresolved questions are separated; OD-01 changes authority order only.
- Review coverage: 16 inherited facts, 14 requirement groups, 18 proposed invariants, 8 acceptance groups, 48 draft test cases, 16 implementation-blocker question groups, 3 provider/environment items and 4 future items.
- Documentation validation checks identifier uniqueness, mapping references, required sections and one-file delta. Runtime tests are NOT RUN for Sprint 3; baseline CI is only the historical evidence in §2.
- Preserve the committed document on GitHub. Its commit SHA is available from branch history and the owner handoff; a commit cannot embed its own SHA. No separate progress/status file is authorized. No PR comment/message, merge or CI change is needed for this document checkpoint.
- The next agent resumes from this file plus the pinned source/closure links. Before further changes, recheck main and branch, obtain owner answers, update this SPEC within authorized scope, then stop for explicit SPEC approval. Do not infer approval from silence.
- Future implementation freeze must follow all owner gates: exact allowlist review, no secrets/future code, required real static/DB/security/integration/browser evidence, green PR, separately authorized merge, exact-main CI, immutable closure ledger (contract/implementation/main SHAs, PR/files/test counts/runs/deviations/limitations), then STOP.

**Current endpoint: GATE 1 draft prepared for review; unresolved blockers remain. No Gate 2, Gate 3 or implementation authorization. STOP and wait for owner.**
