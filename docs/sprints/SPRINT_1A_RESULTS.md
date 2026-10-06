# Checkpoint 1A — CLOSED / FROZEN — CHECKPOINT 1A ONLY

Scope: Data/Auth/Security Core only. Owner authorized Checkpoint 1A and real Supabase on GitHub Actions ubuntu-latest. Base/main: `375379a72ee49a644bb58301a99eb7ebaf4e80e2`. Branch `checkpoint-1a`; draft PR https://github.com/HAD10202/Volume/pull/1. Owner has now authorized merge/closure; Checkpoint1B remains unauthorized.

## Runtime and dependencies
Real stack: Supabase CLI **2.119.0**, PostgreSQL image **17.11.0.002**, GoTrue **v2.197.0**, PostgREST **v16.4**, Mailpit **v1.31.3**; Ubuntu 24.04.5, Node 22.23.3, npm 10.9.9. Local sandbox does not run Docker; required runtime evidence comes from GitHub Actions, not mocks or static inspection.
Development/test dependencies only, exactly pinned and locked: `pg` 8.16.3 (SQL fixtures, observations, independent transaction connections), `@types/pg` 8.15.5 and `@types/node` 22.18.6 (typing), TypeScript 5.9.3 (typecheck), Vitest 5.0.3 (headless API/security integration). No new dependencies for the session helper. Older Vitest 3.2.4 was upgraded before full execution; npm audit reports zero vulnerabilities. Actual Auth/Data APIs use native Node fetch with anon key and real user JWTs.

## Migrations, RPCs and transaction contract
Migrations: `20261006000100_identity_scope.sql`, `20261006000200_permissions_rpc_audit.sql`. Exactly four business entities: profiles, venues, staff_memberships, audit_events. Supabase-managed Auth tables are not business entities.
RPCs: public_venues, current_access, staff_directory, membership_directory, audit_feed, update_own_profile, update_venue, update_access, set_account_status, set_staff_membership_status, revoke_own_sessions. Private helpers validate live profiles, sessions, authority, scope, fixed permissions, expected versions and audit payloads.
Mutable entities use positive bigint version, updated_at only for time. Mutations serialize through one transaction advisory lock, lock caller/target, recheck live authority, compare expected versions, update/version+1/cutoff/audit atomically. Multirow changes require every existing row version. Current-version no-op returns NO_CHANGE without version increase or success audit. Stale/missing version is VERSION_CONFLICT. Audit failure rolls back data, version and cutoff. Bigint versions return decimal strings for exact values beyond JavaScript safe integer. Global mutation serialization favors simple V1 correctness and limits write throughput.

## Session validation security boundary
Application role `volume_core` has **no USAGE on auth and no SELECT on auth.sessions**. Business helper/RPC owner volume_core is NOLOGIN, non-superuser and non-BYPASSRLS.
`private.session_valid(cutoff)` returns only a boolean. User/session identifiers come from verified PostgREST request claims, not a caller-selected user argument. Objects are schema-qualified, search_path is empty, no dynamic SQL. Private schema is not exposed. PUBLIC/anon/authenticated/service_role cannot execute the helper; only volume_core can. Clients cannot read Auth schema through the Data API.
Owner is dedicated technical role `volume_session_reader`, NOLOGIN/NOINHERIT, not superuser. It has Auth schema USAGE and SELECT only on auth.sessions(id,user_id,created_at), no other session columns, Auth users or business table access/write. No application role inherits it. Managed auth.sessions RLS requires BYPASSRLS for this reader, but object/column grants limit its effective surface. Trusted local CI operator initializes only those explicit privileges after clean reset using the stock supabase_admin connection; no embedded operator credential, Auth service-role inheritance or production deployment. Managed Auth lifecycle strips arbitrary Auth schema grants, so this explicit local bootstrap is required and tested.
Protected Auth-role ownership transfer failed in run37444275577. Automatic approval review rejected staging a postgres-owned definer as too broad; that design was never pushed. The narrow reader is the approved safer alternative. These are historical failed attempts, not acceptance evidence.

## Provider revocation limitation accepted by owner
Pinned Supabase has no Admin API to revoke all sessions of another user by user_id alone. We do not store target JWTs, write/delete production auth.sessions or ban accounts to force logout. Provider-side administrative revoke is not claimed implemented.
Database live rows and cutoff remain authoritative. Role/scope/extra/membership/account changes advance cutoff. Old sessions and refreshed JWTs from those sessions cannot access VOLUME private/internal data after commit. Re-login creates a new session using current rights. Tests deliberately leave old provider sessions alive; application denial must hold even if refresh succeeds. Session created_at must be strictly after cutoff. Test-only Auth-row fault injection verifies missing/wrong-user session denial and does not create a production session-write path.

## Tests and evidence
Tested implementation commit **`2db65c8d0e5a0c4155b1357a25ef991d8dd1d603`**. Real complete workflow **https://github.com/HAD10202/Volume/actions/runs/37445694355**, job112209851447: **SUCCESS**. Final report commit reruns the same complete workflow; no implementation changes after this tested SHA. Branch is the review checkpoint; no tag/main merge required.

| Required group | Actual result |
| --- | --- |
| Supabase startup; clean migration/reset | PASS |
| Exactly four entities; constraints; bootstrap USER/ACTIVE/version1 | PASS |
| RLS allow/deny; cross-venue; USER isolation; CEO security denial | PASS |
| Unknown permissions; escalation; direct audit modification denial | PASS |
| Narrow reader grants; private helper/direct Auth access denial | PASS |
| Session/role/scope/extra/membership/account cutoff; old refresh denied; new login | PASS |
| Missing/wrong-user session and exact cutoff boundary | PASS |
| Bigint CAS; stale/missing version; no-op; overflow; multirow rollback | PASS |
| Concurrent CAS; last active Admin; locked authority recheck | PASS |
| Audit atomicity; injected audit failure rollback | PASS |
| Actual API/security integration | PASS |
| Headless email recovery; replay/expiry; target-only password update | PASS |
| Allowlist/frozen documents; forbidden surfaces; secret scan | PASS |
| Typecheck; npm dependency audit | PASS; zero vulnerabilities |
| Legacy ZIP/extracted byte comparison | PASS;235 files, zero mismatches |

**57 database assertions across seven files PASS;22 integration tests across five files PASS.** No required group SKIPPED/BLOCKED/NOT RUN. All allow/deny evidence uses actual Supabase, not service-role bypass or mocks.
Historical run37445004705 had53 DB assertions PASS and five API failures from ambiguous PL/pgSQL alias. The alias was fixed; four reader privilege assertions and direct Data API denial test were added. The complete rerun above supersedes those failures. Earlier runtime/provider blocker runs do not count as acceptance evidence; owner resolved provider contract explicitly.

Database suites cover exactly four entities/constraints, bootstrap USER/ACTIVE/version1, grants/RLS, venue/customer isolation, privilege escalation, fixed permissions, direct audit denial, CEO security denial, live cutoff, version CAS/no-op and audit atomicity. API suites additionally use real signed tokens, old refresh/new login, boundary/wrong-user/missing sessions, injected audit/bootstrap failure rollback, exact bigint/overflow, multirow constraints, parallel CAS/last Admin/authority recheck and email recovery. Privileged SQL is confined to isolated fixtures/fault injection/observations; RLS allow/deny never uses service-role.

## Security and limits
No public/client service-role key; generated local startup credentials are not logged. No production secrets or user data. Optional admin provisioning Edge Function omitted: test-only real signup plus trusted fixture bootstrap/reconciliation audit is sufficient. No custom Auth or generic privileged API proxy. Production SMTP, email verification/public signup policy, password/redirect settings remain owner decisions before live use; local settings are isolated test settings.
Frozen architecture/permissions/Blueprint/AGENTS/ADR and Legacy remain unchanged. Legacy ZIP SHA256 `f0b0cf8372b1a127a30362bd1a584bb0c1e8a4d3346de6f3113cfdb4d007837b`; final extracted235-file byte comparison: zero mismatches.

## Not implemented
No Customer/Control Center UI, Refine/React/shadcn/Playwright, Player/Match/Table/Session/Payment/Task/Tournament/Shop/Media/Telegram/CRM/AI/invitation schema/module/menu, animation, production deployment, main merge or Checkpoint 1B.

## Exact file delta against375379a
- `.env.example`
- `.github/workflows/sprint1a.yml`
- `.gitignore`
- `README.md`
- `docs/OPEN_QUESTIONS.md`
- `docs/sprints/SPRINT_1.md`
- `docs/sprints/SPRINT_1A_RESULTS.md`
- `package-lock.json`
- `package.json`
- `supabase/config.toml`
- `supabase/migrations/20261006000100_identity_scope.sql`
- `supabase/migrations/20261006000200_permissions_rpc_audit.sql`
- `supabase/seed.sql`
- `supabase/tests/sprint1_auth_bootstrap.test.sql`
- `supabase/tests/sprint1_concurrency.test.sql`
- `supabase/tests/sprint1_constraints.test.sql`
- `supabase/tests/sprint1_revocation.test.sql`
- `supabase/tests/sprint1_rls.test.sql`
- `supabase/tests/sprint1_rpc_audit.test.sql`
- `supabase/tests/sprint1_versions.test.sql`
- `tests/integration/fixtures/auth.ts`
- `tests/integration/sprint1-api.test.ts`
- `tests/integration/sprint1-auth-recovery.test.ts`
- `tests/integration/sprint1-concurrency.test.ts`
- `tests/integration/sprint1-revocation.test.ts`
- `tests/integration/sprint1-versions.test.ts`
- `tsconfig.base.json`
- `vitest.config.ts`

28 files, all in exact1A allowlist. Optional provisioning Edge Function files omitted.


## Freeze and handoff
Checkpoint1A implementation is frozen at the tested commit above. Results/status documentation is the only subsequent delta and triggers a final complete CI rerun. Any failed final rerun reopens the checkpoint; no owner-facing completion claim before final branch-head CI succeeds. Preserve both migrations/contracts in future checkpoints. Draft PR1 remains unmerged and main375379a unchanged. STOP; owner review and separate authorization required for1B.

## Owner closure — 2026-10-06
**Checkpoint 1A CLOSED / FROZEN.** Owner authorized final review and merge; PR #1 merged into main. Merge/main implementation commit: `7cc481f5f2c58d2d5b04108b14fefd2720920939`.
Final review:28 changed files, all within exact1A allowlist; no Legacy edits/secrets/1B. Compared with approved88ad708: implementation/tests unchanged; only existing allowlisted CI file adds main to push trigger. Pre-merge full run https://github.com/HAD10202/Volume/actions/runs/37449532177 SUCCESS.
Post-merge main full run https://github.com/HAD10202/Volume/actions/runs/37449817588 **SUCCESS** on merge commit. Required core covers real startup/reset,57 database assertions,22 API/security/concurrency/recovery tests, scope/secret checks and dependency audit. Main tree equals the pre-merge tested PR head5248f5e; no merge-introduced code change. Legacy235-file byte comparison:zero differences.
This closure-record commit changes only four allowlisted status/result documents and runs the same full CI on main. The final closure-record SHA and its CI run are recorded in PR #1 after SUCCESS; a failure reopens closure and must be reported. Earlier unmerged/pending-review/preflight statements are historical, superseded by this owner closure.
No new business implementation, deployment, migration changes or Checkpoint1B. **STOP;1B still NOT AUTHORIZED.**

## Owner-authorized read maintenance — IN PROGRESS / NOT FROZEN
Base1910394; branch maintenance-1a-read, separate from1B. Exact six-file allowlist in Sprint1. Two minimum read RPCs: Admin account_access and HR membership_mutation_targets. No old migration/RLS/write/session/audit/CAS changes or dependency changes. Tests intentionally expand57 DB assertions by21 and22 real integrations by5. Full real CI pending; no PASS/merge claim before execution. Owner authorizes merge/freeze/update1B base after complete PASS. No1B application or Sprint2 here.

### Read maintenance real execution — PASS
Implementation commit c048316318bb1ca4c77cab9e93a20ea8829a101e; complete real Supabase CI https://github.com/HAD10202/Volume/actions/runs/37453006173 SUCCESS.78 database assertions across8 files and27 integration tests across6 files PASS. Includes unchanged57/22 baseline plus21/5 additions. Clean reset, RLS/role/venue denial, independently granted HR status permission, exact fields, real CAS with versions obtained from API, target disabled vs membership inactive, refreshed old session denial/new login, old audit/concurrency/recovery regression, exact maintenance allowlist, secret scan/typecheck/audit all PASS. No dependency changes; same pinned CLI/stack as1A.
Six changed files only; old two migrations, all existing tests/fixtures, RLS and write contracts byte-identical. Owner authorizes merge after PASS; merge/main CI must also SUCCESS before maintenance CLOSED/FROZEN. Final new main SHA/CI and closure are recorded in maintenance PR after verification. Update1B from that verified base, then continue; no Sprint2.
