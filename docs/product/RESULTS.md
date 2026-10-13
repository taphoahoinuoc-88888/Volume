# Product completion — local delivery, NOT CLOSED / NOT FROZEN

Base: `e25296877b84e9a233b3fda2f37afcd8003e0924`.
Branch: `product-completion`, local only.
Current continuation started from clean local HEAD: `872577337a21eb1b8a597fc2e29d6301febbe8c1`.
Remote main rechecked on 2026-10-13 and unchanged from the base above.
Preservation checkpoint: `eb7535df9addc9f5e45a4c196802364f4dc79cd1`.
Final delivery commit is the commit containing this report; use `git log -1 --format=%H`. The exact SHA is also supplied in the handoff message to avoid a self-referential commit hash.

## Actual candidate results

| Check | Result | Evidence/limit |
|---|---|---|
| Explicit reviewed staging and secret-pattern scan | PASS | No detected key/token/private-key patterns; runtime/private config/dependencies excluded |
| Exact product scope / frozen hashes / JWT enabled | PASS | 49 allowed paths; 48 changed paths; 68 named immutable hashes plus all outside-allowlist files checked against base |
| Typecheck | PASS | TypeScript from locked dependencies, actual final sources |
| Lint | PASS | Existing lint command, no assertion relaxation |
| Customer + Control Center production build | PASS | Existing Vite build; nonfatal third-party `use client` directive/chunk warnings |
| Unit | **64/64 PASS** | Five files: retained 38 plus 26 product cases |
| Dependency audit | PASS | 0 vulnerabilities; no package/lock dependency changes |
| Launcher + Telegram/input/upgrade suite | **43 PASS / 1 FAIL** | 44 tests, zero skipped; unchanged D13/D14 process identity assertion fails |
| D13/D14 investigation | BLOCKED by execution environment | Fresh diagnostic: stat/cmdline readable, but readlink(`/proc/<pid>/exe`) returns EACCES; processIdentity therefore fails closed. Earlier sandbox execution returned ENOENT. No PID-only fallback and no assertion removed. Suitable Windows/Linux verification still required |
| Database assertions | **NOT RUN / BLOCKED** | CLI, Docker and psql still absent; no repeated known-failing execution this turn. 209 retained + 22 product assertions = 231 planned, not PASS |
| API/security integrations | **NOT RUN / BLOCKED** | Final candidate has 166 cases; prerequisites absent. Prior draft setup failed with supabase ENOENT; that is not this candidate execution |
| Product E2E execution | **NOT RUN / BLOCKED** | Real backend absent; no browser journey PASS claimed. Previous draft setup failure is historical, not final-tree evidence |
| Browser collection | PASS collection only | 228 discovered: retained 180 + 48 product; collecting is not executing |
| Remote product CI | **NOT RUN** | No push authorized. Dedicated workflow prepared, existing five workflows unchanged |
| Physical owner Windows/ADMIN | PARTIAL evidence | Owner reports successful website startup after BOM patch; full retained-data/ADMIN/upgrade/Pi Node coexistence acceptance not performed here |
| Live Telegram | **NOT RUN** | No real token used; transport tests are isolated doubles, not live client responses |

Environment: Node v24.19.0; no Docker, Supabase CLI, psql, PowerShell or pwsh. Planned CI Supabase CLI is exactly 2.119.0; no local installed Supabase version is claimed. Existing lock retains pg8.16.3, TypeScript5.9.3, Playwright1.63.0 and other existing versions unchanged.

## Implemented scope and acceptance status

| Feature | Implementation | Acceptance |
|---|---|---|
| Preserve existing Sprint1–3, cinematic assets | DONE source preservation | Candidate runtime regression BLOCKED; historical main green is separate |
| Product catalogue/detail/cart/own orders | DONE source and test cases | PARTIAL pending backend/browser execution |
| Inventory receipts/issues, CASH sales, fulfillment | DONE source with preview/reason/CAS/audit | PARTIAL pending concurrency/transaction tests |
| Self player profile, club-defined ranks/history | DONE source/UI/test cases | PARTIAL pending runtime; no automatic rank rules |
| Service feedback/internal notes/public reply/support link | DONE source/UI/test cases | PARTIAL pending real ownership/isolation/browser tests |
| Scoped Admin/CEO/Manager/extra-enabled Staff surfaces | DONE source and denial cases | PARTIAL pending real backend/browser tests |
| Secure Web–Telegram link and own data menus | DONE source/Web/transport/test cases | PARTIAL; private DB integration and live bot NOT RUN |
| Sample billiard catalogue | DONE explicit audited DEMO action | Real stock/prices/specifications NOT VERIFIED |
| Windows BOM + supervisor continuity | BOM tested; supervisor preserved | Physical full acceptance NOT RUN |
| Safe additive updater + hidden token setup | DONE source and input/drift tests | Actual Windows upgrade/setup BLOCKED here |

## Reviewed migrations and security changes

1. `20261012000100_product_contract.sql`: 11 business tables, indexes, least-privilege role policies, fixed permission whitelist extension, additive audit vocabulary, nullable presentation-only table floor label.
2. `20261012000200_product_operations.sql`: safe public catalogue/contact/floor projections; live-auth own and scoped management RPCs; canonical cart idempotency, authoritative quote/CAS, stock reservation/expiry/CASH/fulfillment, ranks/history, feedback/internal notes, audited settings and explicit sample seeding.
3. `20261012000300_telegram_link.sql`: two private FORCE-RLS link/proof tables; hashed one-use proof; Web confirmation; unlink; narrowly privileged transport role/helpers; original live Auth session/cutoff validation. No Auth schema grants to clients/transport, no JWT storage.

4. `20261013000100_product_management_permissions.sql`: explicit owner-approved CEO product writes; scoped operational support read/write; separate `admin_config` projection. No new tables, no Auth/RLS/cutoff change. Four replacements preserve `volume_core` ownership, empty search_path, caller checks, writer serialization/CAS/audit. Revoke unsafe execute; direct helper stays private. All ten earlier migrations are now hash-frozen. Local updater accepts only this named fourth product migration.

Review and test map: `RECOVERY_MATRIX.md` and `IMPLEMENTATION_PLAN.md`. Evidence rows (inventory, item snapshots, rank history, feedback messages) are append-only under the application capability. Existing global security advisory lock is reused for new writes; private Telegram reads take the shared lock. No generic permissions, new business roles, real bank API, refund automation, marketplace, competition, AI or CRM.

Changes discovered and repaired in continuation: cart request survives reload; malformed cart storage/quantity cannot crash bigint totals; floor choices remain selectable across venues; signup uses existing email/password authority; confirmations use existing Radix focus handling; reader-only feedback UI avoids writer helper calls; private link tables FORCE RLS; setup rejects unexpected role capabilities; every bot polling entrypoint shares a local lock; updater validates config/seed/Edge before accepting a new fingerprint.

One documented scope extension: `scripts/check-sprint3-scope.py` dispatches the product candidate to the dedicated allowlist/frozen/secret guard. Historical body is byte-preserved; workflows, security tests and backend contracts are not disabled or run on an old checkout instead of the candidate. Old `volume-v2` and Legacy source were not edited.

## Windows / Telegram handoff

See README_DEMO.md product section and integrations/telegram/README.md. Start Web using START_VOLUME.bat; existing databases require reviewed UPDATE_VOLUME.bat after successful suitable-environment verification. No blind overwrite of private files. Start bot using START_TELEGRAM.bat, S for hidden token setup, Enter for saved setup. Polling needs no domain; localhost buttons only work on host PC. No data reset, Docker/WSL restart, prune, volume deletion or Pi Node/testnet2 operations.

## Safe stopping point / next operator

Preserved local commits; no push, merge, deploy, domain purchase or production secret/payment activation. Do not call this CLOSED/FROZEN. Next authorized step is execute the prepared full candidate workflow in a suitable environment (remote requires separate push authorization), fix actual findings inside the documented product scope, then owner Windows/live Telegram acceptance. Do not rerun historical implementation from scratch or switch to the stale 1A workspace.

Genuine deferred decisions: approved real catalogue/stock/images; club rank definitions; paid-order returns/refunds; supplier accounting beyond quantity receipts/issues; transferring a Telegram identity between Volume profiles (currently denied); production provider and deployment. None silently filled with invented rules.

## Exact file delta against frozen main

- `.github/workflows/product.yml`
- `README_DEMO.md`
- `START_TELEGRAM.bat`
- `UPDATE_VOLUME.bat`
- `apps/control-center/src/App.tsx`
- `apps/control-center/src/components/Shell.tsx`
- `apps/control-center/src/features/product/ProductOperations.tsx`
- `apps/control-center/src/styles.css`
- `apps/customer/src/App.tsx`
- `apps/customer/src/features/auth/AuthPage.tsx`
- `apps/customer/src/features/product/FeedbackPage.tsx`
- `apps/customer/src/features/product/OrdersPage.tsx`
- `apps/customer/src/features/product/PlayerPage.tsx`
- `apps/customer/src/features/product/ShopPage.tsx`
- `apps/customer/src/features/product/TelegramPage.tsx`
- `apps/customer/src/features/tables/TablesPage.tsx`
- `apps/customer/src/showroom.ts`
- `apps/customer/src/styles.css`
- `docs/product/CATALOG_SOURCES.md`
- `docs/product/IMPLEMENTATION_PLAN.md`
- `docs/product/RECOVERY_MATRIX.md`
- `docs/product/RESULTS.md`
- `docs/product/frozen-files.json`
- `integrations/telegram/.env.example`
- `integrations/telegram/README.md`
- `integrations/telegram/bot.mjs`
- `integrations/telegram/legacy-navigation.json`
- `integrations/telegram/private-data.mjs`
- `packages/shared/src/ProductViews.tsx`
- `packages/shared/src/permissions.ts`
- `packages/shared/src/product.test.ts`
- `packages/shared/src/product.ts`
- `packages/shared/src/table-payment.ts`
- `scripts/check-product-scope.py`
- `scripts/check-sprint3-scope.py`
- `scripts/local-demo-admin.mjs`
- `scripts/telegram-setup.mjs`
- `scripts/telegram-setup.ps1`
- `supabase/migrations/20261012000100_product_contract.sql`
- `supabase/migrations/20261012000200_product_operations.sql`
- `supabase/migrations/20261012000300_telegram_link.sql`
- `supabase/migrations/20261013000100_product_management_permissions.sql`
- `supabase/tests/product_security.test.sql`
- `tests/e2e/product.spec.ts`
- `tests/integration/product.test.ts`
- `tests/integration/telegram-link.test.ts`
- `tests/local-demo/product-startup.test.mjs`
- `tests/local-demo/product-telegram.test.mjs`

## Final role/action/branch contract (owner correction 2026-10-13)

| Action | ADMIN | CEO | MANAGER | STAFF | USER |
|---|---|---|---|---|---|
| Catalogue edit, stock receipts/issues, CASH/fulfillment | All venues | All venues | Assigned active venues | Assigned active venue + SHOP_MANAGE | Denied |
| Rank definitions/assignment | All venues | All venues | Assigned active venues | Assigned active venue + RANK_MANAGE | Own profile only; no rank assignment |
| Feedback processing/public reply/internal notes | All venues | All venues | Assigned active venues | Assigned active venue + FEEDBACK_MANAGE | Own submission/public replies; no notes |
| Public human-support contact configuration | All venues | All venues | Assigned active venues | Denied, including product extras | Denied |
| DEMO seed, table-floor metadata | ADMIN only | Denied | Denied | Denied | Denied |
| Global security/role/account/scope settings | Frozen ADMIN contract | No new grant | No new grant | No new grant | Denied |
| Customer order/session/rank/feedback reads through Telegram | Linked own-data / scoped management URLs only; live session/cutoff checked for every role |||||

Backend RPCs remain authority. Telegram operational buttons link to the same authenticated website routes; fabricated callback strings do not execute operations or supply scope. Product navigation now considers authorized venues beyond the first venue; selected screen still rechecks its own permission. No new roles or dependencies.

## Required journey evidence and remaining execution

| Owner journey | Prepared coverage | Current acceptance |
|---|---|---|
| 1 Purchase → CASH/fulfill → stock once → same Telegram order | P01, TG09, PRODUCT01 | BLOCKED real backend/browser |
| 2 Concurrent last item | P02 | BLOCKED |
| 3 Expiry vs paid reservation | P05/P12 | BLOCKED |
| 4 Price/version stale confirmation | P04/P13, PRODUCT03 | BLOCKED |
| 5 Table request/cancel/manual action → Web/Telegram agree | Existing Sprint2/3 suites + TG10 | BLOCKED |
| 6 Rank change/history after deactivation | P09/P18, TG09, PRODUCT05 | BLOCKED |
| 7 Feedback reply/private notes | P10/P14, PRODUCT04 | BLOCKED |
| 8 Authenticated proof + explicit Web confirmation | TG01, PRODUCT07 | BLOCKED; isolated transport tests PASS is not live Telegram |
| 9 Expiry/replay/unlink/revocation | TG02–08 | BLOCKED |
| 10 Stop/start retains all product data and links | Existing launcher retains account test; full product-domain retention needs suitable environment acceptance below | NOT RUN; not covered by historical profile-only restart result |

### Exact blocked checks and safe next actions
Only on a disposable runner/test checkout, never against the owner's existing demo database:
- `.github/workflows/product.yml`, branch `product-completion`: Node22, locked npm dependencies, Supabase CLI2.119.0, Docker available; run its real startup/reset/session-reader provisioning and JWT-verified Edge setup, then `supabase test db`, `npm run test:integration`, public anon browser configuration/build and `npm run test:e2e`. No mocks or earlier main checkout replace these checks.
- Native process identity: `node --test tests/local-demo/admin.test.mjs tests/local-demo/telegram.test.mjs tests/local-demo/product-startup.test.mjs tests/local-demo/product-telegram.test.mjs`. Linux must permit reading its own proc exe; Windows must provide PowerShell/CIM. D13/D14 assertion and identity algorithm are unchanged. Product workflow Linux job runs it; frozen native Windows launcher suite also remains required.
- Physical Windows acceptance after safe reviewed update: create a labelled test order, stock movement, player/rank history, feedback/reply and confirmed Telegram link; record their IDs/quantities/status without credentials. STOP_VOLUME then START_VOLUME, log in using the same account, verify all IDs and values plus the linked Telegram own-data view persist. Confirm Pi Node/testnet2 untouched. Do not delete state, reset DB or restart Docker/WSL. This full multi-domain retained-data journey has NOT been performed here.
- Live bot: owner privately supplies token via hidden setup; confirm private chat linking, replay denial, same populated own-data views, unlink denial and staff route scoping. No token was requested, read or used during this work.

Remote CI remains NOT RUN because publishing is not authorized. Proposed next authorization is push only the reviewed local `product-completion` branch to run its prepared workflow (Linux required-product + native Windows product job and retained workflows); no merge or deployment. Any runtime findings must be fixed and rerun before acceptance.

### Current continuation review
Compared with 8725773, this correction changes the named new migration, product UI/access projection, Telegram operational menu, updater's migration whitelist, additive tests, product workflow labels and delivery docs. The full exact main-relative 48-path delta is above. No private/runtime/generated files staged. No credentials detected by the pattern scan; this is not a claim of mathematically exhaustive secret detection.
