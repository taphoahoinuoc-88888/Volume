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
No old Auth/API/security setting change; only local Edge runtime enabled and JWT-verified function declared. No broad client SELECT, Auth exposure, real provider endpoint, generic permission builder, duplicated occupancy or synthetic walk-in profile. New gateway is technical NOLOGIN capability, never a business role. Full security invariants require CI; no static reasoning substituted for PASS. Main/Legacy unchanged. No deployment, production SMTP/domain, real provider, refund/final billing/overtime, Sprint3 or future modules. No main merge authorized or performed.

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
