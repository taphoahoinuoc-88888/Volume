# Checkpoint 1B — product PASS; closure requires PR and post-merge main CI SUCCESS

Date: 2026-10-06. Branch: `checkpoint-1b`. Owner authorized product surfaces after direct GitHub preflight and a separate, narrowly scoped 1A read maintenance. Owner now authorizes narrowly scoped CI maintenance, PR review/merge and post-merge verification. CLOSED/FROZEN applies only after both required workflows succeed on final main; final branch/main SHAs and run links are recorded in the merged PR closure record. No production deployment. Sprint 2 has not started.

## Frozen base and maintenance closure

Original expected main `1910394b2c446c031109da6f170ead83169ff015` was freshly verified: PR #1 merged; full main Actions run [37450151247](https://github.com/HAD10202/Volume/actions/runs/37450151247) SUCCESS, 57 database assertions / 22 real API tests. Compared with approved88ad708: core implementation/tests unchanged. Legacy235 reference files were rechecked byte-for-byte against the original ZIP; zero differences. ZIP SHA256: `f0b0cf8372b1a127a30362bd1a584bb0c1e8a4d3346de6f3113cfdb4d007837b`.

1B preflight identified three missing reads: Admin targets without memberships; authorized target account_status; independent HR mutation target versions without directory access. Owner authorized separate1A maintenance. [PR #2](https://github.com/HAD10202/Volume/pull/2) merged; **maintenance CLOSED / FROZEN**. New frozen main:
`68541f8a71a0ae10ac22d819a79f78982cf37abb`.
Post-merge main [run37453711509](https://github.com/HAD10202/Volume/actions/runs/37453711509), job112236091294: **SUCCESS;78 DB assertions /27 API tests**. Previous57/22 preserved and expanded, not replaced.

Maintenance delta exactly six approved paths: new `supabase/migrations/20261006000300_access_read_projections.sql`, `supabase/tests/sprint1_projections.test.sql`, `tests/integration/sprint1-projections.test.ts`, existing `.github/workflows/sprint1a.yml`, `docs/sprints/SPRINT_1.md`, `docs/sprints/SPRINT_1A_RESULTS.md`. No old migration/write contract, role model, Auth grant, entity, dependency or broad client SELECT changed.

New `account_access` is live Admin-only, safe account/access fields including no-membership and disabled targets. `membership_mutation_targets` is action-specific, other STAFF only at the caller's authorized venue, both bigint versions/account status, including INACTIVE for reactivation; no independent directory grant, extras, unrelated staff or Auth data. Negative/cross-role/cross-venue/direct-field/CAS/revocation tests PASS. Provider revoke-all of another user by user_id remains unsupported and not implemented; DB cutoff remains mandatory authority.

1B history updated by merge `e745f6d3609c7b64f5ee00d19dd17d455a0453f1`, retaining main history. All frozen Supabase config/migrations/helpers/RLS/RPC, core integration/SQL tests, AGENTS, Blueprint, permissions, architecture and ADR files remain unchanged in1B.

## Product behavior

- Customer: email/password login, local logout, real email recovery/new password, own display name with validation and bigint CAS; own session cutoff action.
- Control Center: Refine Auth/data/access providers, role-aware overview, venue, people/access, audit. USER cannot access internal surfaces. STAFF has only its authorized routes/data; Manager venue choices are assigned venues; CEO has global read surfaces without security writes.
- Admin can manage accounts with no membership. Account DISABLED and membership INACTIVE have distinct text and effects. HR status-only extra uses the new action projection, not a directory grant.
- Sensitive writes freeze the preview snapshot, show before/after, require reason, then call the existing RPC with expected_version(s). Stale writes are rejected without success audit; user reloads before confirming again.
- Unknown resources/actions default deny. UI helpers are not a security boundary. No direct profile/role/audit client writes, service-role, Auth contacts/session rows, generic permissions builder or future menu.
- Denied live access clears cached protected UI/session. Network/aborted navigation failures are distinguished from database authority denial. Browser Auth/session/recovery use Supabase SDK; no custom token engine.

## Dependencies and compatibility

All pins in the single lockfile. Existing core pins unchanged: TypeScript5.9.3, Vitest5.0.3, pg8.16.3, @types/pg8.15.5, @types/node22.18.6.

| New dependency | Pin | Reason |
|---|---|---|
| react / react-dom | 19.3.0 | Two product surfaces |
| @types/react / @types/react-dom | 19.3.0 | React typecheck |
| @supabase/supabase-js | 2.117.2 | Official Auth/recovery/Data API client; Node22+ |
| @refinedev/core | 5.0.12 | Approved Control Center Auth/data/access integration |
| @tanstack/react-query | 5.104.1 | Refine query cache/provider |
| @radix-ui/react-dialog | 1.2.0 | Accessible confirmation/focus handling |
| vite | 8.3.3 | App dev/build tooling |
| @playwright/test | 1.63.0 | Real Chromium/WebKit E2E |
| eslint | 10.12.0 | Lint |
| @typescript-eslint/parser | 8.71.1 | TypeScript/TSX lint parser |

Compatibility checked via npm metadata/peers and actual Node22 install/typecheck/build. Small shadcn-style local button/input/table primitives and official Radix Dialog use semantic CSS rather than an added Tailwind/CVA/generator build stack. This UI composition choice is explicit; not a new security/business architecture. No complex widget/state engine is rewritten. No Refine/Shadcn/React/Playwright was added to the maintenance branch.

Supabase CLI remains pinned2.119.0; same frozen local config/reader bootstrap. Last frozen runtime evidence: PostgreSQL17.11.0.002, GoTruev2.197.0, PostgRESTv16.4, Mailpitv1.31.3. Runner is ubuntu-latest; no sandbox Docker requirement or mocked integration.

## Verification and evidence

Verified implementation: `84d31472e0b2435ac21a949d6692c86c9d3be990`,
[run37459331909](https://github.com/HAD10202/Volume/actions/runs/37459331909), job112254686884: **completed/SUCCESS**. Actual logs:78 database assertions across8 files;27 API tests across6 files;3 unit tests;54 Playwright tests. JSON report:54 expected,0 skipped,0 unexpected,0 flaky. Browser artifact11411631606 contains12 screenshot attachments; SHA25684d1cc37606faa1bd7f8f7365180e0bc1821acfb815f3ab1150447f9826db924. Downloaded/decoded and visually checked WebKit320px login/scoped venues and desktop; no overflow, legible fields/actions/focus. Text artifact scan contains no fixture password/JWT/secret pattern.

Verified final product/documentation head9ba95b1d9f7372168051c2311d242ec799afc033: run37460504275 SUCCESS with78 DB/27 API/3 unit/54 Playwright. Owner-authorized closure maintenance changes CI and existing status documents only. Product files, dependencies, tests and all frozen core paths are unchanged from9ba. Both workflows must test the actual PR/main candidate HEAD. Final branch/main SHAs and immutable run links belong to the PR closure record to avoid a self-referential documentation commit. FAIL/BLOCKED/NOT RUN prevents closure.

| Required group | Current status |
|---|---|
| Clean Supabase startup/reset and 78 DB assertions | PASS — run37459331909; repeat on final checkpoint |
| 27 real API/security/concurrency/recovery tests | PASS — run37459331909; repeat on final checkpoint |
| Typecheck / lint / production builds | PASS local + run37459331909; repeat on final checkpoint |
| 3 permission unit tests | PASS local + run37459331909; repeat on final checkpoint |
| 54 browser/backend cases | PASS54/54 — run37459331909; repeat on final checkpoint |
| Allowlist / frozen core / secrets / dependency audit | PASS — run37459331909; repeat on final checkpoint |

54 cases =9 flows across Chromium/WebKit desktop1440, mobile390, small320. Tests cover real login/recovery/old password denial and link replay; profile validation/CAS/logout/disabled account; old open tab after cutoff; all5 roles/routes and scope; direct cross-role/cross-venue backend denials; HR independent status extra, both CAS versions, no manager/other-venue roster leak, extra revoke/old-tab/new-login; Admin no-membership access/state changes and audit; preview/reason/stale confirmation; changing editor targets without retaining another person's draft; narrow-screen confirmation overflow; keyboard and screenshots.

Tests use anon key plus real user JWT/browser email/password. SQL operator access is isolated fixture setup/reset and observations, not RLS proof. No service-role establishes allow/deny. Worker fixtures use unique real Auth accounts and automatic per-test business reset. Playwright fails fast on failure; remaining cases then NOT RUN, never PASS.

Earlier CI diagnosis: cancelled runs37455946374/37456502418;31ee4e6 compile failure corrected in a6cfe0c;37456885116 found imported reset-hook isolation;37457590421 passed9 Chromium desktop cases but found WebKit login/navigation race. Label association, automatic per-test reset and network-vs-authority error handling corrected. An initial local environment-file suspicion was disproved by the actual GitHub workflow/browser evidence; it is not reported as a backend failure. Run37458477800 then passed17 cases including WebKit Auth/recovery; HR revocation cleared UI before a test attempted to click the old reload button. Test now triggers a protected live refresh without assuming that button survives revocation, and checks that negative requests use a valid current session before grant revocation. No assertion removed or permission relaxed to obtain a pass.

## Security findings and limits

Full source patterns/client configuration checks found no committed secret/service-role. Narrow projection tests remain in complete frozen regression. No private/Auth fields added to product read contracts. Before final artifacts are uploaded, fixture passwords/JWT/recovery token values are redacted from textual reports. Network traces/video are disabled. Earlier diagnostic artifacts could contain ephemeral local test credentials in automatic failure context; no production credentials were used, and those stopped isolated stacks are not final evidence.

CI is Linux Chromium/WebKit browser-engine verification, not physical Safari/macOS/iPhone testing. Physical-device certification, production SMTP/domains/signup/email confirmation/operations (G14) remain NOT RUN/undecided. Local password/redirect policy remains the frozen1A config; no production policy inferred. Build has nonblocking dependency "use client" warnings and a Control Center bundle-size warning; not a server component app. No deployment or performance certification.

## Authorized PR/main CI maintenance and closure

Owner explicitly authorizes CI maintenance and PR merge, followed by full main verification. Existing sprint1a workflow runtime/security steps remain byte-identical outside its scope scanner. Its scanner retains original 1A-only behavior for the core stage; product-stage ancestry uses the approved9ba commit, the immutable approved56-path allowlist plus the single owner-authorized sprint1a workflow path, and strict comparisons with frozen main68541f8. All schema/RLS/RPC/Auth/core tests/AGENTS/Blueprint/permissions/architecture/ADRs remain unchanged. Application/dependency/test changes after approved9ba are rejected.

sprint1b runs on checkpoint-1b, PRs into main and main pushes: allowlist, secrets, dependency audit, typecheck, lint, production build, real Supabase DB/security/API regressions, unit and Playwright tests. It also verifies that all original1A workflow steps outside the scope scanner remain unchanged. Both workflows check the candidate HEAD; no old-snapshot checkout substitutes for current-main verification.

Closure sequence: branch CI SUCCESS → open PR → full57-file scope/secret/frozen-core/Legacy/no-Sprint2 review → both PR workflows SUCCESS → merge exact reviewed head → both main workflows SUCCESS → record final SHAs/runs/counts in merged PR → CLOSED/FROZEN and STOP. Post-merge failure means not CLOSED.

## Exact 1B changed files

The original56 product paths remain the approved1B allowlist. Closure adds only owner-authorized `.github/workflows/sprint1a.yml`, making57 changed files against frozen main. No business/security-contract expansion:

- `package.json`
- `package-lock.json`
- `tsconfig.base.json`
- `.gitignore`
- `.env.example`
- `.github/workflows/sprint1b.yml`
- `vitest.config.ts`
- `apps/customer/package.json`
- `apps/customer/tsconfig.json`
- `apps/customer/vite.config.ts`
- `apps/customer/index.html`
- `apps/customer/src/main.tsx`
- `apps/customer/src/App.tsx`
- `apps/customer/src/styles.css`
- `apps/customer/src/lib/supabase.ts`
- `apps/customer/src/features/auth/AuthPage.tsx`
- `apps/customer/src/features/profile/ProfilePage.tsx`
- `apps/control-center/package.json`
- `apps/control-center/tsconfig.json`
- `apps/control-center/vite.config.ts`
- `apps/control-center/index.html`
- `apps/control-center/src/main.tsx`
- `apps/control-center/src/App.tsx`
- `apps/control-center/src/styles.css`
- `apps/control-center/src/providers/auth-provider.ts`
- `apps/control-center/src/providers/data-provider.ts`
- `apps/control-center/src/providers/access-control-provider.ts`
- `apps/control-center/src/components/Shell.tsx`
- `apps/control-center/src/components/ConfirmChange.tsx`
- `apps/control-center/src/components/ui/button.tsx`
- `apps/control-center/src/components/ui/input.tsx`
- `apps/control-center/src/components/ui/dialog.tsx`
- `apps/control-center/src/components/ui/table.tsx`
- `apps/control-center/src/lib/utils.ts`
- `apps/control-center/src/features/auth/AuthPage.tsx`
- `apps/control-center/src/features/overview/AccessOverviewPage.tsx`
- `apps/control-center/src/features/venues/VenuesPage.tsx`
- `apps/control-center/src/features/people/PeoplePage.tsx`
- `apps/control-center/src/features/audit/AuditPage.tsx`
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`
- `packages/shared/src/database.types.ts`
- `packages/shared/src/permissions.ts`
- `packages/shared/src/supabase-client.ts`
- `packages/shared/src/permissions.test.ts`
- `playwright.config.ts`
- `tests/e2e/fixtures/auth.ts`
- `tests/e2e/sprint1-auth.spec.ts`
- `tests/e2e/sprint1-permissions.spec.ts`
- `tests/e2e/sprint1-admin.spec.ts`
- `tests/e2e/sprint1-mobile.spec.ts`
- `README.md`
- `docs/sprints/SPRINT_1.md`
- `docs/sprints/SPRINT_1B_RESULTS.md`
- `docs/OPEN_QUESTIONS.md`

## Stop boundary

Maintenance1A CLOSED/FROZEN on main68541f8. Product1B implementation PASS; closure is conditional on successful PR and post-merge main CI, recorded in the merged PR. Authorized CI scope adaptation is the only closure deviation; no architectural/security/business deviation. No production deployment/SMTP/domain configuration. No Table/Payment/Player/Match/Media/Tournament/Shop/Telegram/CRM/AI/invitation implementation. **Sprint2 has not started.** After successful main verification mark CLOSED/FROZEN, then STOP.
