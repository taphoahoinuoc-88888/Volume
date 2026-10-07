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
