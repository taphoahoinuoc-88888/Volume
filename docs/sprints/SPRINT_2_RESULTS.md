# Sprint 2 — implementation candidate, not completion

Status: IN PROGRESS. Owner-approved server-path gate CLOSED. Sprint 2 NOT PASS / NOT FROZEN.
Frozen main: `2b47f0a619f494a811c94e41697f7d09dcb19e3a`.
Frozen business contract: `fd3400aa93f2c365d422b2a50b2a66ee039621dd` (36 invariants / 90 contract cases).
Branch: `checkpoint-2`; preflight: `7adfafe261eb97a331c5c3f85368afe557d1cf60`.

## Scope and files
Exact plan allowlist is now 45 paths, expanded ONLY by owner-authorized `supabase/functions/open-table-payment/index.ts` and `supabase/config.toml`. Plan documents purposes and restrictions. New two additive migrations, five DB suites, five integration suites and payment fixture, shared money/timer code/tests, neutral adapter and authenticated Edge orchestration/tests, three browser suites/fixture, real Customer/Control Center operational surfaces, scoped contact editor and fixed manual-permission checkbox, CI guards/workflow and required test/compiler script configuration are candidate changes. Final changed-file count/SHA/real run evidence remain pending.

All three frozen foundation migrations, Auth/security RPCs/session reader, existing 27 integration tests, existing 54 browser cases, 3 foundation unit tests, seed, lockfile and architecture documents remain unchanged. The existing entity assertion checks exactly four FOUNDATION tables; a new assertion checks exactly eight total business tables. Other 77 frozen DB assertions retained.

## Server boundary
Edge gateway verification remains `verify_jwt = true`; no unverified webhook. Customer operations use the ordinary authenticated user token through approved RPCs, including live account/cutoff checks. No client price/success/owner/start authority. Unconfigured provider fails safely instead of generating fake payment evidence or bank QR. QR failure uses a server-only local database credential to SET LOCAL ROLE `volume_payment_ingest` and call only `private.fail_payment_attempt`; protected-table writes are never issued from this function. Narrow helper cannot close ACTIVE or discard money. No service-role credential in client or response.

Provider-neutral normalized receipts are exercised by trusted SQL fixture calls, NOT a deployed provider callback endpoint or real bank integration. Permission allow/deny tests use ordinary real Auth JWTs. No actual provider, signature, finality, live money or production QR PASS is claimed.

## Dependencies / versions
No added npm dependency or lockfile change. Existing pinned `pg@8.16.3` is reused by the server-only Deno npm import; no client driver import. Supabase CLI `2.119.0`, Node22 and all existing dependency pins retained in CI. Actual image/runtime versions and full compatibility evidence await real CI. Local clean `npm ci` completed.

## Evidence (candidate)
| Group | Status |
|---|---|
| Local typecheck / lint / production builds | PASS before final candidate edits; CI required on exact candidate |
| Unit suites | 25 PASS at dacdc3e (3 frozen +22 added); expanded candidate pending rerun |
| YAML and embedded Python workflow syntax | PASS |
| Exact file/hash/config/secret guard | Pending final candidate review and CI |
| Clean Supabase startup/reset and DB/security matrix | PASS at dacdc3e;135 assertions including78 frozen +57 added |
| Frozen78 DB /27 API regression | PASS at dacdc3e;54 frozen browser cases NOT RUN |
| New DB/API/security/concurrency/payment/invalidation/audit |57 DB PASS;44 new API PASS;2 Edge BOOT_ERROR failures at dacdc3e |
| New browser tests | NOT RUN |
| Dependency audit / full GitHub Actions | Audit PASS;full run FAIL, not completion |

Exact inclusive boundary uses the real ingestion function and rollback-only privileged DB clock fixture at precisely expires_at; production helper always returns database clock_timestamp, has no client override/GUC/test mode. API clock/lock-wait tests prove late serialized processing cannot use an earlier raw arrival. Fixture changes are rolled back and never shipped as runtime behavior.

## Security review and limits
No old Auth/API/security setting change; only local Edge runtime enabled and JWT-verified function declared. No broad client SELECT, Auth exposure, real provider endpoint, generic permission builder, duplicated occupancy or synthetic walk-in profile. New gateway is technical NOLOGIN capability, never a business role. Full security invariants require CI; no static reasoning substituted for PASS. Main/Legacy unchanged. No deployment, production SMTP/domain, real provider, refund/final billing/overtime, Sprint3 or future modules. Current owner instruction authorizes PR/merge only after complete candidate and PR checks pass, then post-merge main CI. No merge has occurred at this report commit.

## Freeze gate
Do not close/freeze Sprint2 until all required real CI checks and the 90-case coverage review pass on the final candidate. Any new file outside45 or material frozen security change must be reported before implementation. Pending SHA/run/test counts will be added from actual evidence; NOT RUN is not PASS.

## Real CI iteration 1
Candidate `dacdc3e721ca0a6a00e12091efdebc43aa8f24ac`; [run37516446963](https://github.com/HAD10202/Volume/actions/runs/37516446963): FAIL. Exact45 allowlist/frozen hashes/JWT/secret guard, typecheck/lint/25unit/dependency audit, Supabase start/clean reset,135 DB assertions PASS. Integration71 PASS /2 FAIL of73; all27 frozen API tests PASS. Failure is actual Edge worker BOOT_ERROR, not accepted QR-failure behavior; browser/build CI steps consequently NOT RUN. Fix candidate adds explicit JWT-verified function serving/readiness and redacted runtime diagnostics, bounded same-identity retry for SQL40P01/40001/network failures, neutral recipient/finality attestation tests and acquire/expiry audit rollback tests. No failed assertion weakened; rerun mandatory.

## Real CI iteration 2
Candidate `a239ee3f97fc119f374f1c3f9b56872da98bed47`; [run37517170309](https://github.com/HAD10202/Volume/actions/runs/37517170309): FAIL at actual function readiness. Guard/typecheck/lint/27unit/audit and clean Supabase reset PASS; DB/API/browser NOT RUN in this run due readiness failure. Redacted runtime logs identify Deno graph resolution of bare Node type import `pg`; candidate fixes this inside the approved Edge file with a narrow structural interface. Pinned runtime npm pg import unchanged; no dependency, allowlist or security expansion. JWT stays TRUE; no assertion skipped/weakened.

## Real CI iteration 3
Candidate `215f3e13d38727f4fc6de543a7175edf465514fe`; [run37517649527](https://github.com/HAD10202/Volume/actions/runs/37517649527): FAIL. Function graph/readiness now PASS with JWT TRUE, guard/type/lint/27unit/audit/clean reset/135 DB PASS. Integration77 PASS /2 FAIL of79; remaining failures require trusted QR-failure release to return PAYMENT_UNAVAILABLE, but runtime returns REQUEST_FAILED. No failure accepted as release PASS. Fix candidate makes pinned npm dependency statically discoverable by Deno graph and adds server code-only error classification (no payload, message, credentials or Auth data). Full CI rerun required; browser NOT RUN.

## Real CI iteration 4
Candidate `4534c41569fb85906278616f33ff3e01117405e4`; [run37518301929](https://github.com/HAD10202/Volume/actions/runs/37518301929): FAIL at browser fixture. All guards/type/lint/27unit/audit, actual JWT-verified Edge readiness, clean reset,136 DB assertions and79 API/integration tests PASS; production builds PASS. Browser10 PASS /1 FAIL /103 NOT RUN of114. Customer headless acquire token had been globally logged out by retained Sprint1 browser tests, correctly DENIED by real session validation. New Sprint2 browser fixture now performs actual Auth re-login for operator/customer/manager tokens before each case; frozen auth fixture/tests/security unchanged. No invalid-session allowance or assertion relaxation. Full rerun required.

## Real CI iteration 5
Candidate `1223e1b4d3a2399915affb9a6060378dba4f4db5`; [run37519275529](https://github.com/HAD10202/Volume/actions/runs/37519275529): FAIL at privileged timer-age fixture. All guards/type/lint/unit/audit/Edge/clean reset/136 DB/79 integration/build PASS. Browser10 PASS /1 FAIL /103 NOT RUN. Full-payment UI now opens/ticks correctly, but fixture aging only started_at violated started_at>=acquired_at. Fixture now coherently ages acquired_at/expires_at/start/payment timestamp in one transaction, with rollback on exception; no production backdate path or weakened constraint. Added actual-version-only CI output and real current-CAS NO_CHANGE/audit assertions. Browser matrix still required in full.

## Recovery and targeted validation
Recovered remote HEAD `117f3b85b1776056df9990b6370318228b90ee58`; [run37520132806](https://github.com/HAD10202/Volume/actions/runs/37520132806): guard/typecheck/lint/27 unit/audit, actual JWT-verified Edge readiness, clean reset/136 DB/80 integration/production build PASS. Browser26 PASS /1 FAIL /87 NOT RUN: frozen WebKit PW02 login navigation. Artifact records successful Auth/current_access followed by interrupted navigation and authenticated login-route denial. Keep the login surface mounted until the existing authenticated submit finishes navigation; no Auth/RLS/RPC/test timeout change. Targeted feature-branch CI explicitly runs both integration files covering Edge and this exact WebKit case; it cannot claim full completion. PR/main always retain the entire matrix. Old workspace edits remain untouched; no unpushed Sprint2 fix was found there.

## Final candidate validation and closure ledger
Targeted candidate `0bd68f3df98470ec5f5dd75ae474ee5e7b8666b2`; [run37596730149](https://github.com/HAD10202/Volume/actions/runs/37596730149): SUCCESS. Actual JWT-verified Edge readiness PASS, clean reset/136 DB assertions PASS, 26 targeted integration tests PASS (both acquisition/Edge and payment suites),27 unit PASS, WebKit-desktop frozen PW02 PASS (1 targeted case), typecheck/lint/build/guard/audit PASS. This is targeted evidence, not full browser/regression completion.

Actual runtime: Supabase CLI2.119.0, PostgreSQL17.11 image17.11.0.002, GoTruev2.197.0, EdgeRuntimev1.77.1, Node22. No added dependency/lockfile; server uses existing pinned pg8.16.3. Two additive migrations listed in the approved plan; 12 public read/command RPCs, private gateway restricted to receipt ingestion/failure/expiry. All45 changed paths are allowlisted, frozen security migrations/helpers and Legacy unchanged; service/financial checks still database-authoritative.

Final complete CI must prove136 database assertions (78 retained foundation +58 added),80 integration (27 retained +53 added),27 unit,114 Playwright (54 retained +60 added; Chromium/WebKit at1440/390/320). No unexpectedly skipped test is acceptable. The final report commit starts this full cycle without targeted mode. Full candidate run, PR check runs, merge SHA and post-merge runs will be recorded in the PR closure ledger and final owner report once available; never substitute expected counts for actual logs.

Full required coverage: RLS/auth cutoff/old refresh denial, bigint CAS/last Admin/concurrency, one hold/customer/table, exact expiry boundary, zero/partial expiry, full automatic opening, semantic transaction/event dedupe, wrong-order conflict, stale/forged prices/success, real Edge safe QR release/retry, pending invalidation, manual scope/walk-in, audit fault rollback, recovery, UI/browser regression, scope/secret/dependency/type/lint/build. The plan maps all90 neutral-core contract cases; actual-provider sandbox/signature/bank QR/live-money evidence is excluded pending separately authorized integration, not claimed PASS.

Deviations: no file/security/business scope expansion. Targeted CI is deliberately narrower, feature-branch-only; PR/main run all required tests. Login-route lifecycle repair is within the approved application entrypoint and does not change authentication authority, frozen Auth module, tests or timeouts. No production/deployment/SMTP/domain/provider secrets, actual provider/webhook, refund/final billing/overtime/automatic close, or Sprint3 work.

Closure gate: remain NOT CLOSED until complete final candidate, PR and post-merge main checks are SUCCESS. The immutable GitHub run/PR closure ledger records final candidate SHA, merged main SHA, actual test counts and45-file review. Stop after closure; do not begin Sprint3.

## PR runtime preflight blocker (not merged)
Final candidate `a171236304f8b792351e06852f19033f93494c60`; [full run37597372604](https://github.com/HAD10202/Volume/actions/runs/37597372604): SUCCESS with136 DB/80 integration/27 unit/114 browser PASS and all guards/build/audit PASS. PR4 opened after this full green evidence, exactly45 changed files. PR workflows1A/1B ran all80 integrations on current HEAD but lacked the explicit local functions-serve bootstrap used by the new workflow: both78 PASS/2 Edge release FAIL (runs37598777672 and37598777653). No merge or closure. Fix is confined to already-approved new API/browser payment fixtures: explicitly serve/wait for the real JWT-verified function when the workflow has not already done so, with scoped process cleanup. New workflow records readiness only after its actual405 boot check. Old workflow runtime/security bytes, frozen Auth/tests, assertions and product/security contract remain unchanged; no mocks, bypass or broader privileges. Targeted and complete required checks must now re-run on changed fixtures before merge.

## WebKit load-event diagnostic and production-surface validation
At `f3e0f5baf678352f8c1bcd5c899ee5697c4e2e1f`, PR1A run37599864723 SUCCESS with136 DB/80 integrations, including both previously failing Edge paths. Targeted runtime setup136 DB/26 API/27 unit passed; initial WebKit browser failed waiting for load on the second /login navigation before credentials, with correctly rendered login form. Manual same-job rerun succeeded without code/test/timeout changes. Full Sprint2 PR run37599864771 nevertheless failed frozen WebKit direct navigation waiting for load:26 browser PASS/1 FAIL/87 NOT RUN. No merge or completion claim.

Approved root E2E script now serves the actual built customer/control artifacts via existing pinned Vite preview, waits for both URLs, then uses unchanged Playwright projects/tests/config with existing-server reuse. CI is unset only in that browser subprocess to select the config's existing-server option; the frozen config has no other CI-dependent settings. workers1/retries0/maxFailures1/45s timeout/10s expectations and real backend remain identical; --forbid-only added. Both preview processes are cleaned up. No dependency, unlisted file, production deployment or security/schema change. Targeted production-surface validation precedes final full PR/main proof; dev-server load instability is not treated as authorization denial or accepted PASS.
