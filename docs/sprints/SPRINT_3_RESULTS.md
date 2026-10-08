# Sprint 3 — CLOSED / FROZEN

Prepared final closure status: **CLOSED / FROZEN**. Implementation-main evidence below was independently reverified on 2026-10-08. Formal closure is declared only after this documentation PR is merged and all four required workflows succeed on its exact resulting main SHA. The closure PR conversation records that final SHA and its run IDs, avoiding a self-referential commit hash. No Sprint 4 work follows.

## Frozen identifiers

| Evidence | Exact identifier |
|---|---|
| Owner-approved SPEC candidate | `813d41c86f937e8407f6080baaa599b669b62eff` |
| Frozen SPEC metadata commit | `0c2b43a5cc1607b4d7829c5cea16ac318310ad87` |
| Frozen SPEC blob | `58796a2bbd0e581b4672e1f42b9adfa5ea545a18` |
| Gate 1 frozen main / implementation base | `69b680da06ae3194f8dcc2bbfffce4eddf30be32` |
| Technical-design commit | `0b408997cb61bceddbce235c979b6993e4daa497` |
| Initial implementation-plan commit | `582b7790294f35d12c857d4489ebe2fc3d152286` |
| Documented narrow plan/fixture addition | `27c99f4b65a5a778eb226b724953b1d478f39b41` |
| Final implementation HEAD | `27c99f4b65a5a778eb226b724953b1d478f39b41` |
| Implementation PR | [#7](https://github.com/HAD10202/Volume/pull/7), merged 2026-10-07T18:29:08Z |
| Final implementation merge SHA / documentation closure base | `b6fbcbcd449dd79889dfd1365cb96f0dc521de4c` |
| Verified implementation/main tree | `e96680e5f470e3f4f6629f3ebe62752738cfb392` |

The implementation merge has exactly Gate 1 main and final implementation HEAD as its parents; its tree equals the green implementation tree. The documentation-only closure PR uses `sprint3-closure`, based on that verified main, and changes only `docs/sprints/SPRINT_3_RESULTS.md`. All non-document runtime files remain identical. Its final PR/merge/main SHA and fresh CI evidence are recorded in the closure PR's final attestation and linked from implementation PR #7.

## Verified results

| Suite | Retained baseline | Added | Final required result |
|---|---:|---:|---|
| Database assertions | 136 | 73 | **209 PASS**, 16 SQL files |
| Real Supabase/Auth integration | 80 | 56 | **136 PASS**, 14 files |
| Unit | 27 | 11 | **38 PASS**, 4 files |
| Playwright | 114 | 54 | **168 PASS**, six projects |

Each browser project passed 28 tests: Chromium and WebKit at desktop 1440px, mobile 390px and small 320px. Test retries remain zero. The successful complete post-merge runs contain no failed, skipped, flaky or not-run required tests. Conditional failure-only diagnostics skipped on success are not skipped tests.

Allowlist/forbidden-scope/secret scan, dependency audit, typecheck, lint, production build, clean database reset, migration compatibility, constraints/grants/RLS, real Auth/cutoff/role/venue checks, bigint CAS, concurrency, audit/constraint rollback, financial conservation, exact numeric oracles, overflow, close/release/CASH races, old-owner safety and actual PostgreSQL restart/recovery all PASS. No frozen snapshot checkout was used to bypass candidate testing.

### Verified implementation-main runs (before documentation closure)

| Workflow | Run | Attempt | Result |
|---|---|---:|---|
| Checkpoint 1A | [37667190643](https://github.com/HAD10202/Volume/actions/runs/37667190643) | 1 | SUCCESS |
| Sprint 2 | [37667190498](https://github.com/HAD10202/Volume/actions/runs/37667190498) | 1 | SUCCESS |
| Sprint 3 | [37667190381](https://github.com/HAD10202/Volume/actions/runs/37667190381) | 1 | SUCCESS |
| Checkpoint 1B | [37667190589](https://github.com/HAD10202/Volume/actions/runs/37667190589) | 1 | SUCCESS |

Verified jobs: Sprint 3 `112949319023`; Sprint 2 `112949319536`; Checkpoint 1B `112949318941`; Checkpoint 1A `112949360825`. Logs were independently read for actual counts; all four runs target implementation main `b6fbcbcd449dd79889dfd1365cb96f0dc521de4c`. Closure-PR and closure-main checks are verified separately before the final attestation.

### Final implementation/PR evidence

| Workflow | Run | Successful attempt |
|---|---|---:|
| Sprint 3 branch | [37663716524](https://github.com/HAD10202/Volume/actions/runs/37663716524) | 1 |
| Sprint 3 PR | [37663722704](https://github.com/HAD10202/Volume/actions/runs/37663722704) | 1 |
| Checkpoint 1A PR | [37663722710](https://github.com/HAD10202/Volume/actions/runs/37663722710) | 1 |
| Checkpoint 1B PR | [37663722767](https://github.com/HAD10202/Volume/actions/runs/37663722767) | 1 |
| Sprint 2 PR | [37663722715](https://github.com/HAD10202/Volume/actions/runs/37663722715/attempts/2) | 2 |

All target final implementation `27c99f4b65a5a778eb226b724953b1d478f39b41`. All full successful suites report 209/136/38/168. Gate 1 post-merge prerequisite runs were 37645374334 (1A), 37645374365 (1B), 37645374256 (Sprint 2), all SUCCESS. Sprint 2 frozen base remains historically `1b6f713a990aabb4f705d5f0735856442a59b7db`, PR #4; Gate 1 SPEC PR #5 and separately reviewed CI bootstrap PR #6 precede this implementation.

## Exact changed files

Implementation PR versus Gate 1 base: **31 paths — 21 added, 10 modified**. No deleted files. Closure publication additionally changes only this same results document on its documentation branch; it is not another runtime change.

| Path | Action |
|---|---|
| `.github/workflows/sprint1a.yml` | modified |
| `.github/workflows/sprint1b.yml` | modified |
| `.github/workflows/sprint2.yml` | modified |
| `.github/workflows/sprint3.yml` | added |
| `apps/control-center/src/App.tsx` | modified |
| `apps/control-center/src/components/Shell.tsx` | modified |
| `apps/control-center/src/features/sessions/SessionsPage.tsx` | added |
| `apps/customer/src/features/tables/TableSessionPage.tsx` | modified |
| `docs/sprints/SPRINT_3_IMPLEMENTATION_PLAN.md` | added |
| `docs/sprints/SPRINT_3_RESULTS.md` | added |
| `docs/sprints/SPRINT_3_TECHNICAL_DESIGN.md` | added |
| `packages/shared/src/SessionFinancePanel.tsx` | added |
| `packages/shared/src/session-finance.test.ts` | added |
| `packages/shared/src/session-finance.ts` | added |
| `packages/shared/src/table-payment.ts` | modified |
| `scripts/check-sprint3-scope.py` | added |
| `supabase/migrations/20261007000300_session_closing_contract.sql` | added |
| `supabase/migrations/20261007000400_session_closing_operations.sql` | added |
| `supabase/tests/sprint2_constraints.test.sql` | modified |
| `supabase/tests/sprint3_atomicity.test.sql` | added |
| `supabase/tests/sprint3_billing.test.sql` | added |
| `supabase/tests/sprint3_security.test.sql` | added |
| `tests/e2e/fixtures/session-finance.ts` | added |
| `tests/e2e/sprint3-customer.spec.ts` | added |
| `tests/e2e/sprint3-operations.spec.ts` | added |
| `tests/integration/fixtures/auth.ts` | modified |
| `tests/integration/fixtures/payment.ts` | modified |
| `tests/integration/fixtures/session-finance.ts` | added |
| `tests/integration/sprint3-concurrency.test.ts` | added |
| `tests/integration/sprint3-finance.test.ts` | added |
| `tests/integration/sprint3-security.test.ts` | added |

## Exact migration and function inventory

Additive migrations only:

- `supabase/migrations/20261007000300_session_closing_contract.sql`
- `supabase/migrations/20261007000400_session_closing_operations.sql`

Existing table_sessions gains immutable closure facts and CLOSED-compatible checks. New append-only evidence tables are session_cash_receipts and session_financial_issues, with FORCE RLS, exact session/payment binding, immutable guards and indexes cash_session_created / financial_issues_payment. Existing ownership indexes, opening-payment uniqueness/required amount and immutable receipt meaning remain intact; no duplicated table busy flag.

New functions (7 public RPCs, 14 private helpers/trigger functions):

```text
private.sprint3_bill(p_rate bigint,p_duration numeric)
private.sprint3_financial(p_charge bigint,p_received bigint,p_issues text[])
private.sprint3_evidence_immutable()
private.sprint3_closed_immutable()
private.sprint3_validate_closed()
private.sprint3_funds(p_session uuid)
private.sprint3_authorize(p_session uuid,p_own boolean,p_close boolean)
private.sprint3_lock_session(p_session uuid)
private.sprint3_check_versions(p_session uuid,p_session_version bigint,p_payment_version bigint,p_table_version bigint,p_venue_version bigint)
private.sprint3_project(p_session uuid,p_own boolean)
public.own_session_financial(p_session uuid)
public.session_financial(p_session uuid)
public.session_financial_operations(p_venue uuid default null)
private.sprint3_audit(p_action text,p_target_type text,p_target uuid,p_venue uuid,p_reason text,p_before jsonb,p_after jsonb,p_source text,p_correlation uuid)
private.sprint3_close(p_session uuid,p_expected_session_version bigint,p_expected_payment_version bigint,p_expected_table_version bigint,p_expected_venue_version bigint,p_reason text,p_own boolean)
public.close_own_table_session(p_session uuid,p_expected_session_version bigint,p_expected_payment_version bigint,p_expected_table_version bigint,p_expected_venue_version bigint)
public.close_table_session(p_session uuid,p_expected_session_version bigint,p_expected_payment_version bigint,p_expected_table_version bigint,p_expected_venue_version bigint,p_reason text)
public.session_cash_result(p_session uuid,p_receipt_id uuid)
public.record_session_cash(p_session uuid,p_expected_session_version bigint,p_expected_payment_version bigint,p_expected_table_version bigint,p_expected_venue_version bigint,p_receipt_id uuid,p_amount_vnd text,p_reason text)
private.sprint3_credit_bound()
private.sprint3_ingest_payment_event(p_event jsonb)
```

Existing private.sprint2_validate_payment_session() receives only additive ACTIVE/CLOSED compatibility in the new migration. Opening-payment SUCCESS remains historical truth after close. No frozen migration is edited.

New BUSINESS audit actions: TABLE_SESSION_CLOSED, SESSION_CASH_RECORDED, SESSION_FINANCIAL_CONFLICT. Trusted actor/source, fixed safe payloads and atomic audit remain binding. Public UI uses safe own/venue/global projections and database authorization, not browser authority.

## Scope and final security review

Approved SPEC requirements, invariants, all 62 scenario IDs and numeric oracles map through the design/plan to executable DB/API/unit/browser coverage. Close freezes original-rate integer billing and server cutoff atomically with audit and derived table release, independently of debt. Immutable same-session CASH/validated credits conserve charge and money, permit partial settlement, preserve exact debt/excess/anomalies and cannot reopen or reclaim a table. CASH while ACTIVE never stops billing. Current account/session cutoff/role/membership/venue authorization and bigint CAS remain authoritative, including disabled-service handling.

Complete branch and PR diffs reviewed against exact Gate 1 main. No Auth/RLS/cutoff/CAS/audit/role-scope or frozen opening-payment security weakening; no dependency, Legacy, Sprint 4+, speculative business module, real provider implementation or production deployment. No material frozen-security deviation or unresolved implementation blocker.

## Documented narrow changes and failed-run history

- Initial exact allowlist had 30 files. Before modification, the plan documented one owner-authorized narrow addition: tests/integration/fixtures/auth.ts. Only its real Auth POST fixture helper adds Connection: close, preventing reuse of an idle closed HTTP socket; the scope guard compares all other file bytes to Gate 1. No token fabrication, authorization change, request retries, timeout increase or assertion weakening.
- Existing Sprint 2 DB assertion retains its exact eight named frozen tables; new assertions require exactly ten total. Isolated payment fixture reset includes the two new FK children. All original 136/80/27/114 coverage is retained.
- Earlier development failures and fixes remain in the historical appendix below; failed/not-run attempts were never Sprint PASS.
- Historical b76f78b branch run 37657643895 attempt 1 had a WebKit navigation timeout (54 browser PASS / 1 FAIL / 113 NOT RUN); unchanged attempt 2 passed 168. Historical PR 1A 37660994191 and Sprint 2 37660994403 passed; 1B 37660994262 attempts 1/2 failed fixture Auth socket transport in different tests (82/1/85 and 12/1/155), motivating the exact connection-header fix. Old Sprint 3 PR run 37660994417 was superseded/cancelled and is not counted PASS.
- Final-head PR Sprint 2 run 37663722715 attempt 1 reported WebKit internal navigation error before CASH (108 browser PASS / 1 FAIL / 59 NOT RUN). Full attempt 2 passed unchanged HEAD; test retries/assertions/timeouts were not changed. The failed attempt remains disclosed, not relabeled PASS.
- All four exact-main post-merge workflows passed on attempt 1. No failed or pending required post-merge workflow remains.

## Known limitations and stop boundary

**No real bank/payment provider integration or production deployment is claimed.** Provider-neutral validated evidence is tested against real local Supabase/Auth; production provider integration remains separately gated. No fiscal invoice/export, refund/reversal execution, reopen, backdate, waiver, discount, pause, transfer, split bill, tax/service fee or future modules. Known debt/excess/anomalies remain visible; no fake resolution or settlement action. No maximum business duration is added; representational overflow fails atomically.

Closure records verified main without rewriting frozen historical documents or business rules. **Sprint 3 CLOSED / FROZEN. STOP. Sprint 4 not started.**

## Historical progress appendix

The following entries are preserved historical checkpoints. Their IN PROGRESS/NOT CLOSED statements describe their earlier candidates and are superseded by the verified closure above.

### Archived progress snapshot — IN PROGRESS at that checkpoint

Not CLOSED/FROZEN. No production deployment or real payment provider integration is claimed.

## Immutable milestones

- Approved SPEC candidate: `813d41c86f937e8407f6080baaa599b669b62eff`.
- Frozen SPEC metadata commit: `0c2b43a5cc1607b4d7829c5cea16ac318310ad87`.
- Gate 1 PR #5 merged; exact base/main: `69b680da06ae3194f8dcc2bbfffce4eddf30be32`.
- Exact Gate 1 post-merge checks SUCCESS: 37645374334 (1A), 37645374365 (1B), 37645374256 (Sprint 2).
- Design: `0b408997cb61bceddbce235c979b6993e4daa497`.
- Exact implementation plan: `582b7790294f35d12c857d4489ebe2fc3d152286`.
- Database slice: `1bacf33d46b6e64af3963f8837e32d254b5a983d`.
- Real API/security/concurrency tests: `04e0dd9bb91ed9b54984cf0bc0fdab5605a9c85f`.

## Verification history

[Run 37650110277](https://github.com/HAD10202/Volume/actions/runs/37650110277), exact API-test commit above: **FAILED**, not a Sprint PASS.

- Clean database suite: **207 assertions PASS**, including retained 136 Sprint 2 assertions.
- API: **120 PASS / 10 FAIL** of 130. All 80 frozen API tests passed. Ten new failures traced to the fixture copying dynamic table getters before reset, producing empty UUIDs. Fix preserves live getters; no assertions weakened.
- Unit: 27 retained tests PASS on that commit.
- Build/browser after failed API gate: NOT RUN.

Next slice adds customer/operator Vietnamese UI, stable CASH unknown-result recovery, eleven unit tests and nine browser scenarios across the existing six projects. Local typecheck, lint, 38 unit tests and production build passed before push; full candidate CI remains required. Non-boundary 90-minute fixtures use 89:30 rather than 89:59 to avoid unintentionally crossing minute 91 during browser login. Explicit boundary oracles remain unchanged.

## Remaining release gates

Full actual-candidate CI, all prior regressions, complete scope/security review, PR CI, merge and exact post-merge green main. Final counts, changed files, migration/function inventory, CI URLs and limitations will be recorded only from verified results.

## Coverage review additions before release

Within the original 30 paths: add actual PostgreSQL container restart/reconnect proof (real Auth tokens retained); missing PAYMENT CAS; bigint CAS above JS safe range with unchanged timestamps; two acquisition contenders after close; rejection of PENDING/CANCELLED close/CASH; atomic close overflow; UTC midnight/DST microsecond oracles. These address explicit T01/T19/T23/T27/T36/T42/T44/T50/T51 requirements, not additional business scope.

The CASH UI now requires its actor/session draft-storage identity to be established before preparing a cash command, preventing a reload recovery gap during initial account loading. Shared active summary explicitly identifies overtime from authoritative duration. Scope guard also checks frozen workflow header authority and duplicate allowlist entries. No allowlist addition, dependency, old migration or frozen security change. Runtime results for these additions remain pending.

## UI candidate verification

Candidate `bb5125dbc5ffea6a122f890cc7e7ae2928fa3205`, [run 37651907159](https://github.com/HAD10202/Volume/actions/runs/37651907159): **FAILED**. Static/type/lint/audit/build, 38 unit, 207 DB, 130 real API tests PASS. Browser **107 PASS / 1 FAIL / 60 NOT RUN**. Failure is the new operator no-horizontal-overflow assertion on WebKit 390px, after close and two CASH settlements succeeded. Fix constrains session selector grid labels to available width; retains the assertion and adds structural width diagnostics. No retry, skipped test, frozen fixture or timeout change. Full rerun required.

Candidate `3ffdf53254f6c56590655c255f9354de9b75427c`, [run 37653890176](https://github.com/HAD10202/Volume/actions/runs/37653890176): **FAILED**. 209 DB assertions and 38 unit tests PASS. All 18 concurrency cases, including real PostgreSQL restart and subsequent authorized reads/close, passed. Total API 29 PASS / 107 NOT RUN because later fixture setup calls correctly rejected Docker health status `starting` even though SQL/API had recovered. Restart test now waits for the actual container health check to become healthy before releasing the stack to other suites; no frozen fixture, assertion, timeout or security rule changed. Build/browser NOT RUN in this run.

Review also found that the operator selector retained its initial status after a successful close/CASH refresh. It now receives the same authorized financial result as the panel; a browser assertion requires its selected entry to show the committed closed/paid status. No separate mutable business state is introduced.

Candidate `7c7002c8691afad67e1f6b8875ac418545d8c8af`, [run 37654825959](https://github.com/HAD10202/Volume/actions/runs/37654825959): **FAILED** only at WebKit mobile overflow: 107 browser PASS / 1 FAIL / 60 NOT RUN. 209 DB, 136 API (including restart and overflow rollback), 38 unit and static/build checks PASS. Geometry showed all element border boxes within the viewport, but document scroll width 526 vs 390. Selector labels now contain their native control's internal overflow and truncate long selected text, with full session details still available in the financial panel. No page-level overflow hiding or test relaxation.

Candidate `10633c4fcc2b101122d366c6b8099199df42606c`, [run 37655580854](https://github.com/HAD10202/Volume/actions/runs/37655580854): **FAILED**. Backend/static checks passed; browser 80 PASS / 1 FAIL / 87 NOT RUN. New failure exposed the CASH account-loading race: a user could click review before the actor-scoped draft key was ready, receiving a safe rejection but no confirmation. Review is now disabled until identity loading finishes; the real browser test deliberately delays the Auth user read and verifies the disabled state before releasing the real request. No mocked money/Auth authorization or relaxed assertion. WebKit mobile overflow still requires the full rerun to confirm.

## PR transport maintenance

Implementation `b76f78b5aad41cc390f27cff5c8652ff4bf30842` passed full branch run 37657643895 attempt 2: **209 DB / 136 integration / 38 unit / 168 browser**. Attempt 1 failed one WebKit navigation timeout and was not PASS. PR #7 Checkpoint 1A 37660994191 and Sprint 2 37660994403 passed; the latter independently passed all 168 browser tests.

Checkpoint 1B 37660994262 attempt 1: 82 browser PASS / 1 fixture socket FAIL / 85 NOT RUN. Attempt 2: 12 PASS / 1 identical fixture socket FAIL / 155 NOT RUN, in a different frozen test. Both failed Auth POST transport before scenario assertions. Plan records one narrow pre-edit addition (`tests/integration/fixtures/auth.ts`, total31 paths): disable connection reuse only for fixture Auth POST. No automatic retries, skipped tests, changed credentials/authorization/assertions/timeouts or production change. Exact-byte scope guard permits only this header insertion. Full candidate checks required again. Sprint 3 PR run 37660994417 was still in browser installation before this replacement candidate; not counted PASS.

