# Sprint 3 verification ledger — IN PROGRESS

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
