# Product completion — authorized 2026-10-12
Base: e25296877b84e9a233b3fda2f37afcd8003e0924; exact Git tree 3d231546c6aeebeda73b24a7cb82bb919e460602.
Repository: taphoahoinuoc-88888/Volume (PRIVATE after ownership transfer).
Branch: product-completion; owner authorizes push, draft PR13 and CI/fixes; no merge/deploy.
Owner attachment authorizes additive shop/inventory, rank, feedback/support, Telegram linking, local startup.
Earlier Sprint prohibitions apply to their historical scope; no old migration or identity/security helper will be edited.

## Contract
- Shop uses VND integer, venue-bound products/SKUs with category and variant labels. No marketplace/buyback.
- A cart belongs to one venue. Checkout locks SKU rows in deterministic order; validates catalog version, price and available stock; snapshots names/prices; request UUID binds exact canonical cart.
- Unpaid orders reserve stock for 900 seconds, recovered from legacy config/store. Effective expiry is evaluated by database, never browser. Stock reservation is derived from live unpaid holds or paid/unfulfilled orders; no duplicate reserved counter.
- Customer cancels only unpaid orders. Authorized shop staff records actual CASH once with reason/CAS; then reservation survives expiry. Fulfillment deducts stock once and writes immutable movement evidence in the same audited transaction. No bank success/automatic refund/shipping provider.
- Orders: PENDING → PAID → FULFILLED; PENDING → CANCELLED/EXPIRED. Expired orders cannot receive CASH. A paid-order refund is a separate future business decision, not a cancel shortcut.
- Rank definitions venue-bound; player_profiles shares profiles.id; venue player rank assignment/history, no computed competition rank. Deactivate rather than delete referenced records.
- Feedback venue, category/message, optional own order/session, NEW/IN_PROGRESS/RESOLVED, public replies vs private notes. Assignment only active staff of the same venue. No outbound forwarding.
- Venue support setting stores only a public Telegram username; no private staff contacts. ADMIN/CEO or the assigned MANAGER configures the venue contact.
- Telegram is a transport, not login provider: logged-in Web requests random expiring proof → private account redeems → same Web user reviews actual Telegram identity and confirms. No replacement without unlink. The link binds the initiating Auth session and cutoff; private reads validate that session/live account each time. No client execution of trusted transport helpers. No arbitrary JWT/role impersonation endpoint.
- Table/session/billing RPC behavior unchanged. Floor presentation may only use existing configured labels until explicit floor metadata exists; do not fabricate floor numbers.
- CEO and ADMIN can read/write the explicitly approved product domains globally; existing table/finance/security rules remain unchanged. MANAGER can read/write in assigned venues, STAFF only via fixed SHOP_MANAGE/RANK_MANAGE/FEEDBACK_MANAGE extras; USER owns only orders/profile/tickets/link. Public venue support configuration: ADMIN/CEO globally, MANAGER only assigned venues; STAFF/USER denied. Global security/configuration, demo seeding and floor configuration remain ADMIN-only. No HR role.
- All sensitive mutable records use bigint CAS, current authority under existing security serialization lock, reason and atomic audit; no-op does not increment version. Public reads safe only; no broad table SELECT or auth schema client grants.
- Preserve 7 historical migrations and all old tests/workflows; new CI runs old+new regressions. No dependency changes planned.
- Production provider/domain/SMTP, real bank payments, live bot acceptance and physical Windows acceptance remain separate evidence.

## Exact implementation allowlist (51 paths)
```text
docs/product/IMPLEMENTATION_PLAN.md
docs/product/RECOVERY_MATRIX.md
docs/product/RESULTS.md
docs/product/CATALOG_SOURCES.md
docs/product/frozen-files.json
supabase/migrations/20261012000100_product_contract.sql
supabase/migrations/20261012000200_product_operations.sql
supabase/migrations/20261012000300_telegram_link.sql
supabase/migrations/20261013000100_product_management_permissions.sql
supabase/tests/product_security.test.sql
supabase/tests/sprint2_constraints.test.sql
supabase/tests/sprint3_security.test.sql
tests/integration/product.test.ts
tests/integration/telegram-link.test.ts
tests/e2e/product.spec.ts
packages/shared/src/product.ts
packages/shared/src/product.test.ts
packages/shared/src/ProductViews.tsx
apps/customer/src/App.tsx
apps/customer/src/features/auth/AuthPage.tsx
apps/customer/src/features/product/ShopPage.tsx
apps/customer/src/features/product/OrdersPage.tsx
apps/customer/src/features/product/PlayerPage.tsx
apps/customer/src/features/product/FeedbackPage.tsx
apps/customer/src/features/product/TelegramPage.tsx
apps/customer/src/styles.css
apps/customer/src/showroom.ts
apps/control-center/src/App.tsx
apps/control-center/src/components/Shell.tsx
apps/control-center/src/features/product/ProductOperations.tsx
integrations/telegram/bot.mjs
integrations/telegram/private-data.mjs
integrations/telegram/legacy-navigation.json
integrations/telegram/README.md
integrations/telegram/.env.example
scripts/local-demo-admin.mjs
scripts/telegram-setup.ps1
scripts/telegram-setup.mjs
scripts/product-demo.mjs
scripts/check-product-scope.py
scripts/check-sprint3-scope.py
START_TELEGRAM.bat
README_DEMO.md
tests/local-demo/product-startup.test.mjs
tests/local-demo/product-telegram.test.mjs
.github/workflows/product.yml
packages/shared/src/permissions.ts
apps/control-center/src/styles.css
apps/customer/src/features/tables/TablesPage.tsx
packages/shared/src/table-payment.ts
UPDATE_VOLUME.bat
```
Each new path is limited to this contract. Frozen files manifest records original Git blob hashes for migrations, old tests/workflows, Auth helpers and launcher supervisor. Launcher edit only BOM parsing and explicit additive upgrade/setup integration, no Docker/WSL lifecycle broadening.

## Feature-to-test matrix
| Journey / invariant | DB/API | Unit/transport | Browser / operational |
|---|---|---|---|
| Shop browse/cart/order/history/CASH/fulfillment | product.test.ts; product_security.test.sql | product.test.ts money/cart validation | product.spec.ts desktop/mobile |
| No oversell; duplicate/CAS; 900s expiry; preview reprice | product.test.ts concurrency/price/cancel | cart identity/quantity | stale preview message |
| Rank definitions/assignment/deactivation/history | product.test.ts roles/venue/own-only | labels | management → own rank |
| Feedback association/reply/assignment/private note | product.test.ts ownership/scopes | labels/link validation | customer → reply; no note leak |
| Telegram proof expiry/replay/replacement/unlink/cutoff | telegram-link.test.ts; direct helper deny | product-telegram.test.mjs private-chat boundary | TelegramPage confirm; live Telegram separately NOT RUN without token |
| Existing tables/billing/CASH | unchanged Sprint 1–3 DB/API suites | existing unit suites | existing E2E suites |
| BOM/local-loopback/supervisor/data retention | unchanged launcher real-stack suite | product-startup.test.mjs + existing launcher tests | physical Windows separately NOT RUN |
| Security/scope/secrets/deps | check-product-scope.py + frozen hashes | npm audit/typecheck/lint/build | product.yml (not executed remotely without push authorization) |

## Execution and evidence
Fresh checkout reconstructed through authenticated GitHub read connector because shell clone has no credential; every tracked blob and root tree verified, signed commit reconstructed byte-for-byte; shallow main preserves the actual base SHA. Old workspace untouched.
No Docker, psql or PowerShell detected in this sandbox. Real stack tests must not be called PASS here without executing them. Continue implementation and all executable validation; report unexecuted groups explicitly.


### Documented in-scope extension before edits
Four paths are necessary: shared permission labels expose the three fixed extras through the existing Admin selector; control styles make confirmation readable/mobile; customer table screen and its shared type expose configured floor metadata without changing any frozen opening/closing RPC. No new business role or security authority.

UPDATE_VOLUME.bat is an explicit, owner-triggered additive upgrade entrypoint for an existing local database. START retains its fingerprint fail-closed behavior. Upgrade verifies owned resources, copies no differing historical migration, makes a private database backup, runs only pending additive migrations, and retains all data. No Docker restart/reset/prune.

## Owner continuation 2026-10-12 / reviewed maintenance boundary
Recovered draft checkpoint: eb7535df9addc9f5e45a4c196802364f4dc79cd1. This is preservation, not acceptance.
The owner now explicitly authorizes this product scope and minimal documented allowlist extensions; no push/merge/deployment.
Added exact path `scripts/check-sprint3-scope.py`: only an early product-phase dispatch to the dedicated guard. Existing historical guard body remains byte-identical. Existing five workflows and tests remain unchanged and still run on the actual candidate. The product guard verifies every changed path against this list and all immutable baseline files; it must not test a checkout of old code instead of the candidate.
No new runtime dependency. `scripts/product-demo.mjs` remains reserved but is unnecessary: explicit audited demo seeding is provided in Admin UI.
Signup UI uses existing Supabase email/password signup and frozen USER bootstrap; no Auth settings or provider changes.
Upgrade must compare transformed runtime configuration, seed and functions before replacing the saved fingerprint. Bot setup rejects pre-existing unexpected role memberships/privileges. Telegram links never store Auth JWTs; all private reads check the original session and current cutoff.
Environment evidence: current sandbox Node can read stat/cmdline but readlink(`/proc/<pid>/exe`) fails EACCES (earlier execution reported ENOENT); do not relax D13/D14.

## Final test mapping and implementation notes
- Existing DB/API/browser regression files are unchanged and collected together with new coverage, on the actual candidate. New DB guard has 22 assertions (planned aggregate 231); product API P01–P20 plus Telegram TG01–TG10 add 30 cases (aggregate 166). These counts are NOT passes without runtime execution.
- Eight product browser journeys across the existing six projects add 48 cases (aggregate 228). They cover checkout/CASH/fulfillment, persistent request and cancellation, stale quote, public reply vs internal note, player/rank, management route denial and Web link/unlink. Supabase is real; only Telegram transport identity in that browser fixture is supplied by the trusted test transport, not a live Telegram claim.
- Product unit cases cover bigint/cart validation, same-venue isolation, safe redirect/contact, malformed local storage and quantity handling. Existing unit cases remain intact.
- Upgrade/input/transport tests preserve the unchanged D13/D14 assertion, verify BOM handling, reject non-loopback local-test URLs, deny mismatched private sender, bind SQL parameters and check config/seed/function drift. Hosted native Windows and real local-stack jobs remain required.
- No new package/version/lock changes. Existing Radix Dialog handles product confirmation focus/escape behavior.
- The product workflow uses pinned existing Actions and Supabase CLI 2.119.0, actual clean reset, all DB/API/security cases, build and all Chromium/WebKit projects. Existing workflows are untouched; their guard dispatches into the exact product guard without bypassing candidate test suites. No remote run was triggered.

## Owner correction 2026-10-13
Starting clean local HEAD 872577337a21eb1b8a597fc2e29d6301febbe8c1; remote main independently unchanged e25296877b84e9a233b3fda2f37afcd8003e0924.
Add exact path `supabase/migrations/20261013000100_product_management_permissions.sql` before implementation: replace only product permission helper and safe access/contact RPCs. Explicit CEO writes are owner-authorized; no global security/configuration grant. All ten earlier migrations are now hash-frozen; no assumed knowledge of owner DB application state, no history rewriting.
Venue human-support contact is operational, not global security: ADMIN/CEO global; MANAGER assigned venue; STAFF (including product extras)/USER denied. UI must distinguish operational support from ADMIN-only sample seeding/floor settings.
Local updater accepts this specific fourth product migration; no reset or lifecycle broadening. Existing source tests denying CEO product writes are corrected to the new owner contract, with positive CEO and negative scope/security cases, not skipped.

## Real CI compatibility maintenance, documented before edits (2026-10-13)
Actual Product run 38368082969 attempt2: Linux launcher/D13/D14 PASS, Windows product PASS, real Supabase/Edge starts; 227/231 DB assertions PASS. Four failures are schema-inventory test assumptions, not observed permission bypasses.
Add exactly two paths: `supabase/tests/sprint2_constraints.test.sql` and `supabase/tests/sprint3_security.test.sql`. Purpose: scope the six immutable baseline bigint-version checks to their six named Sprint1–3 entities and make full-schema inventory an exact 21-name list including the 11 explicitly authorized product entities. Do not drop/skip any assertion or change any runtime grant/RLS/function/schema. Existing deny/atomicity/billing assertions remain byte-identical; keep 16 and 12 assertions respectively. Manifest re-freezes these narrowly reviewed test changes; other frozen hashes unchanged.
Product test misconception: Sprint1 deliberately grants authenticated schema USAGE for RLS helpers. USAGE does not expose a schema via PostgREST or grant table/function access. Replace the incorrect no-USAGE expectation with explicit no-CREATE and no direct read/write of both private Telegram tables; retain helper EXECUTE denial checks and add exact product mutable-version inventory. Preserve frozen schema grant, never revoke it to force a test PASS.
Capture successful product browser pages for actual screenshot review (existing allowed product.spec.ts), with fixture data only and link proofs redacted. No dependency or architecture change.
