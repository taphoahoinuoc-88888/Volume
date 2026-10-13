# Product completion — review candidate, not merged

Repository: **taphoahoinuoc-88888/Volume (PRIVATE)**. Branch: `product-completion`.
Draft PR: https://github.com/taphoahoinuoc-88888/Volume/pull/13
Frozen main base: `e25296877b84e9a233b3fda2f37afcd8003e0924`.
Owner authorizes branch publication, draft PR, CI and in-scope fixes. No merge, deployment, purchases, real bank activation or owner-PC data changes.
Preservation: `eb7535df9addc9f5e45a4c196802364f4dc79cd1`; prior local correction `0f9e9a4a74acb57fd17da52840b6209a26705c6e` remains in local history. Old volume-v2 and Legacy were not edited.

## Evidence policy and current results

Results below identify their **tested commit**. Newer changes require fresh required checks; green historical main is not candidate evidence. The PR description records the final exact published HEAD, workflow run links and all six conclusions after execution. This report does not predeclare a pending run successful.

Actual candidate `8082159f108c86d116a345711281df923150cfae`:

| Check | Actual result |
|---|---|
| Checkpoint 1A run38426187503 | SUCCESS: clean migration, **234 DB assertions**, **166 API/security integration tests** |
| Local Demo run38426186888 | SUCCESS: real Linux startup/admin/recovery/stop/restart and native Windows/BAT |
| Product run38426186319, Linux core | Scope/secrets/typecheck/lint/build/audit, **64 unit**, **44 launcher/transport tests**,234 DB,166 API PASS |
| Product retention job115396073621 | **5/5 PASS**, includes fresh disposable real-stack populated product data and Telegram link persistence across stop/start |
| Product Windows job115396074012 | PASS:26 native launcher +11 product input/transport; native BAT checked |
| D13/D14 process identity | PASS on suitable native Linux and Windows; original assertion and fail-closed identity algorithm preserved |
| Browser at that commit | **FAIL** PRODUCT04 exact-label selector timeout; first3 product journeys PASS; remaining NOT RUN due unchanged maxFailures=1 |
| Checkpoint 1B / Sprint2 / Sprint3 | FAIL at same PRODUCT04 selector; backend phases passed |

Subsequent candidate changes: accessible combobox selectors; management empty-order dead customer link removed; loading state; regression journey for both empty states; player-profile deactivation/reactivation history retention; post-restart Telegram feedback/rank equals Web. Planned final counts: **234 DB,166 integration,64 unit,240 browser** (180 retained +60 product across six projects). These are counts, not a claim that a pending candidate passed.

Hosted execution uses Node22, Supabase CLI2.119.0, actual local stack and JWT-verified Edge. Existing dependency lock unchanged (pg8.16.3, TypeScript5.9.3, Playwright1.63.0). No new dependency. Local sandbox lacks Docker/Supabase; real checks execute on disposable GitHub runners, never owner demo data.

## Feature acceptance inventory

| Feature | Status/evidence as of the tested commit above |
|---|---|
| Customer catalogue/cart/orders/cancellation | PARTIAL: real API and first browser journeys PASS; full browser matrix pending |
| Inventory receipts/issues, CASH, reservation/expiry/concurrency/fulfillment | PARTIAL: real transactional/security API PASS; full browser matrix pending |
| Existing tables/session/billing | PARTIAL candidate acceptance: DB/API regressions PASS; full browser regressions pending |
| Player, club ranks/history | PARTIAL: real API PASS; browser pending |
| Feedback/public replies/private notes/support | PARTIAL: API isolation PASS; browser selector failure repaired, rerun required |
| ADMIN/CEO/MANAGER operations and scoped Staff extras | PARTIAL: real allow/deny API PASS; full browser matrix pending |
| Web–Telegram linking and own data | PARTIAL:10 real DB/API integration cases PASS; live Telegram NOT RUN |
| Windows launcher/BOM/supervisor | DONE automated native verification; physical owner-PC acceptance NOT RUN |
| Populated stop/start persistence | DONE real disposable-runner test; owner existing installation acceptance NOT RUN |
| Sample catalogue | Clearly DEMO; actual catalogue/prices/stock/artwork not verified real offers |
| Production provider/deployment | NOT STARTED, outside authorization |

## Reviewed migrations and security changes

1. `20261012000100_product_contract.sql`: 11 business tables, indexes, least-privilege role policies, fixed permission whitelist extension, additive audit vocabulary, nullable presentation-only table floor label.
2. `20261012000200_product_operations.sql`: safe public catalogue/contact/floor projections; live-auth own and scoped management RPCs; canonical cart idempotency, authoritative quote/CAS, stock reservation/expiry/CASH/fulfillment, ranks/history, feedback/internal notes, audited settings and explicit sample seeding.
3. `20261012000300_telegram_link.sql`: two private FORCE-RLS link/proof tables; hashed one-use proof; Web confirmation; unlink; narrowly privileged transport role/helpers; original live Auth session/cutoff validation. No Auth schema grants to clients/transport, no JWT storage.

4. `20261013000100_product_management_permissions.sql`: explicit owner-approved CEO product writes; scoped operational support read/write; separate `admin_config` projection. No new tables, no Auth/RLS/cutoff change. Four replacements preserve `volume_core` ownership, empty search_path, caller checks, writer serialization/CAS/audit. Revoke unsafe execute; direct helper stays private. All ten earlier migrations are now hash-frozen. Local updater accepts only this named fourth product migration.

Review and test map: `RECOVERY_MATRIX.md` and `IMPLEMENTATION_PLAN.md`. Evidence rows (inventory, item snapshots, rank history, feedback messages) are append-only under the application capability. Existing global security advisory lock is reused for new writes; private Telegram reads take the shared lock. No generic permissions, new business roles, real bank API, refund automation, marketplace, competition, AI or CRM.

Changes discovered and repaired in continuation: cart request survives reload; malformed cart storage/quantity cannot crash bigint totals; floor choices remain selectable across venues; signup uses existing email/password authority; confirmations use existing Radix focus handling; reader-only feedback UI avoids writer helper calls; private link tables FORCE RLS; setup rejects unexpected role capabilities; every bot polling entrypoint shares a local lock; updater validates config/seed/Edge before accepting a new fingerprint.

One documented scope extension: `scripts/check-sprint3-scope.py` dispatches the product candidate to the dedicated allowlist/frozen/secret guard. Historical body is byte-preserved; workflows, security tests and backend contracts are not disabled or run on an old checkout instead of the candidate. Old `volume-v2` and Legacy source were not edited.


## CI-driven fixes and security review

- Old inventory assertions assumed only Sprint1–3 tables. Reviewed exact-name assertions now include the authorized product schema; original deny/billing/atomicity assertions retained. DB total expanded from231 to234 with direct private-table read/write denial and exact bigint inventory.
- Preserved frozen authenticated private-schema USAGE needed by existing RLS helpers. Tested lack of CREATE/direct data/helper execution instead of incorrectly treating schema USAGE as a read grant. No runtime privilege changed to make tests pass.
- Payment fixture explicitly clears feedback FK dependents in disposable tests. No CASCADE/constraint removal and no production reset.
- PRODUCT04 screenshot confirmed rendered feedback form and Venue A option; accessible role locator replaces label-text matching that includes option text. No security assertion removed.
- Product workflow adds fresh-runner retention verification and avoids duplicate PR+branch push execution; all five historical workflow files remain byte-identical.
- Exact allowlist52 paths; actual delta51;68 frozen hashes. Three documented historical test-fixture/inventory paths are re-frozen after narrow compatibility changes; other frozen runtime/security files untouched. No secret detected by scope/credential-pattern scan, not a mathematical guarantee.

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


## Required journey mapping

| Journey | Actual coverage |
|---|---|
| Purchase → management CASH/fulfill → stock once → same Telegram order | P01,TG09,PRODUCT01; real populated retention |
| Concurrent last item | P02, real API concurrency |
| Expiry releases unpaid stock; paid reservations persist | P05/P12 |
| Price/version invalidates confirmation | P04/P13,PRODUCT03 |
| Table request/action → Web/Telegram same session | Retained Sprint2/3 cases,TG10 |
| Rank changes/history after deactivation | P09/P18,TG09,PRODUCT05; extended own-profile deactivate/reactivate |
| Public reply visible/private note denied | P10/P14,PRODUCT04; retention Web/Telegram equality |
| Authenticated single-use link and explicit Web confirmation | TG01,PRODUCT07 |
| Expiry/replay/unlink/revocation | TG02–08 |
| Stop/start retains populated domains | Product retention job (fresh GITHUB_ACTIONS installation only) |

## Windows / Telegram: use the PR branch, not main

See README_DEMO.md “product-completion” instructions and integrations/telegram/README.md. Keep the existing installation path: moving it changes local resource identity. If Git has local modifications, preserve/review them before updating; never reset/clean to force an update. On a clean installation fetch/switch `product-completion`, fast-forward only, then run **UPDATE_VOLUME.bat** (backup and reviewed additive migrations), **START_VOLUME.bat**. Do not copy over private configuration/runtime data. ZIP installation guidance is in README_DEMO.md.

Start **START_TELEGRAM.bat**, choose **S** for hidden token setup or Enter for saved configuration. Polling needs no purchased domain. Localhost Web buttons work only on the host PC. Logged-in Web → Telegram page → create5-minute proof → send privately to bot → return to Web and confirm displayed identity. Never send a token as the linking proof.

Owner-only checklist: existing accounts/ADMIN work; shop purchase/CASH/fulfillment stock changes once; manager cannot change other venues; rank history and feedback reply/private-note separation; live bot shows same own orders/rank/feedback/session; unlink denies private reads; stop/start retains data; Pi Node/testnet2 unchanged. Physical owner-PC and live Telegram are **NOT RUN** here. Do not claim full acceptance without those observations.

## Remaining decisions and safe continuation

Actual catalogue/images/prices/stock and club rank definitions; paid-order refunds/returns; supplier accounting beyond quantity receipts/issues; moving a Telegram identity between profiles (currently denied); production provider/deployment. No invented rules fill these gaps.

Continue only product CI findings on the current branch; inspect actual logs and screenshots. Never merge/deploy automatically. Exact local/published SHA pair and six final CI run links belong in PR13 handoff; Git connector publication preserves the identical Git tree without rewriting local history. No owner data reset, Docker/WSL restart, prune, volume deletion or Pi Node operation.

## Exact changed paths against frozen main

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
- `supabase/tests/sprint2_constraints.test.sql`
- `supabase/tests/sprint3_security.test.sql`
- `tests/e2e/product.spec.ts`
- `tests/integration/fixtures/payment.ts`
- `tests/integration/product.test.ts`
- `tests/integration/telegram-link.test.ts`
- `tests/local-demo/product-startup.test.mjs`
- `tests/local-demo/product-telegram.test.mjs`

Showroom CI found product Web links still marked data-telegram and an obsolete Telegram catalog label. The already-allowed showroom adapter now uses data-product-route and truthful Web labels; the frozen Telegram-destination assertion is unchanged. PRODUCT10 clicks shop/player/feedback destinations against real backend, across all six browser projects. No cinematic asset or Auth contract changed.
