# Checkpoint 1A — BLOCKED_PROVIDER_REVOKE_CONTRACT / NOT FROZEN

Owner authorized GitHub Actions ubuntu-latest as the real Supabase execution environment. Base: 375379a72ee49a644bb58301a99eb7ebaf4e80e2; working branch checkpoint-1a; draft PR https://github.com/HAD10202/Volume/pull/1. No merge or 1B authorization.

## Real runtime compatibility evidence
Preflight commit 2a1c8a2777522520df0166592236071d63ef373c; workflow https://github.com/HAD10202/Volume/actions/runs/37439354568; job112188957380 PASS. Startup/reset and actual email/password signup/login/refresh/re-login PASS. Refresh preserves session_id and auth.sessions.created_at; re-login creates distinct session. This preflight does NOT prove the complete 1A matrix.
Actual stack: Supabase CLI2.119.0; PostgreSQL image17.11.0.002; GoTruev2.197.0; PostgRESTv16.4; Mailpitv1.31.3. Runner Ubuntu24.04.5/Node22.23.3. Initial ECR rate limits recovered automatically. CLI npm global install is supported by this verified version despite older documentation; no production deploy.

## Dependencies
All development/test only: pg8.16.3 for PostgreSQL fixture setup, observations and independent transaction connections; @types/pg8.15.5 and @types/node22.18.6 for static typing; TypeScript5.9.3 for test typechecking; Vitest5.0.3 for headless integration suites. Initial3.2.4 audit reported vulnerabilities, upgraded to5.0.3 before full CI; npm audit reports zero vulnerabilities. Exact package-lock required. Auth tests call real Supabase HTTP endpoints with Node fetch; no custom Auth implementation or mocked provider.

## Implementation under test
Two migrations: 20261006000100_identity_scope.sql and 20261006000200_permissions_rpc_audit.sql. Four business tables only. Non-login/non-superuser/non-BYPASSRLS volume_core owner; private helpers, restricted grants and RLS. RPCs: public_venues, current_access, staff_directory, membership_directory, audit_feed, update_own_profile, update_venue, update_access, set_account_status, set_staff_membership_status, revoke_own_sessions. Fixed search_path and schema-qualified references; private functions revoked by default. Versions return decimal strings for exact bigint values beyond JavaScript safe integer.
Sensitive mutations serialize using one transaction advisory lock, lock caller/target and recheck live session/authority. Multirow change-sets include each expected version; non-staff role transition requires explicit inactivation versions for existing memberships. Account/membership/role/scope/extra changes set cutoff. Self revoke audits before its own cutoff inside the same transaction. Audit failure rolls back domain data/version/cutoff.

## Tests and status
Local typecheck PASS; YAML parsing/allowlist checks PASS. Full GitHub Actions matrix ran partially and FAILS. Latest tested implementation commit240e1595f2f22da66017ae517787cecb3e878482, run37442226921, job112198489719. Database suite FAIL; API suite SKIPPED / NOT RUN because database step failed. No freeze/completion claim. Required tests are not replaced by static checks or preflight.
Database files cover constraints, grants/RLS, RPC/audit, revocation, versions, last-Admin invariant and bootstrap. Integration suites cover actual tokens, full role/scope matrix, metadata forgery, HR limits, direct audit denial, old refresh/new session/cutoff boundaries, injected bootstrap/audit faults, bigint exactness/overflow/multirow rollback, concurrent CAS/Admin protection/authority recheck, and captured email recovery/replay/expiry.
Privileged SQL is confined to isolated local fixture setup, fault injection and observations; allow/deny requests always use anon key and real user JWTs. Provider revoke failure is modeled by deliberately leaving real old Auth sessions alive after DB cutoff, proving application denial independent of provider success.

## Security / limits
No full security acceptance: database suite FAIL and API suite NOT RUN.1A is incomplete; no freeze/tag. No Auth schema exposure; no service-role key used by allow/deny clients. Startup logs suppressed to avoid CLI printing local generated keys. No production credentials. Provisioning Edge Function is optional and not implemented: test operator uses real signup plus controlled SQL fixture bootstrap/reconciliation audit; no generic privileged API proxy.
No architectural deviation applied. Global mutation serialization is intentionally simple for V1 and may limit write throughput; no extra entity/service. No production SMTP/signup policy decision is implied by local auto-confirm/rate-limit settings.

## File delta / checkpoint
Source changes must remain within the frozen exact allowlist. Final file list, commit SHA and all group results will be recorded after actual CI. Frozen documents/Legacy unchanged. Do not label this checkpoint PASS or create freeze tag before all required tests pass.

## Not implemented
No Customer/Control Center UI, Refine/React/shadcn/Playwright, future business module/schema/menu, invitation module, production deployment, main merge or Checkpoint1B.

## Architectural blocker — reported, not silently changed
Pinned GoTruev2.197.0 source routes expose /logout with authenticated target-user JWT; no Admin revoke-all-by-user-id endpoint. Admin signOut SDK also takes target JWT. After Admin changes another profile role/membership/account, the server has the Admin caller JWT, not the target user's JWT. Four-entity/minimum-Auth-read contract does not authorize storing target tokens, minting impersonation JWTs or deleting managed Auth session rows. Ban/delete/temporary ban is not equivalent to membership disabling and may block new login. Therefore automatic post-commit provider revoke for all administrative changes cannot be claimed implemented under this exact contract.
Database cutoff/session lifecycle itself was verified compatible. This blocker is specifically the provider-call orchestration, not auth.sessions.created_at. Do not weaken database cutoff or reopen role/scope rules. Required CI includes an explicit failing compatibility gate; no green workflow may be used to claim complete1A while this decision remains unresolved. Further implementation of the affected provider step stops pending owner decision.
Owner decision needed: clarify provider revoke as best-effort only when a supported target JWT is available (self revoke), while administrative changes always enforce DB cutoff; or authorize a specific supported privileged provider/session mechanism and its exact files/grants. No alternative applied.
Primary pinned sources: https://github.com/supabase/auth/blob/v2.197.0/internal/api/api.go and https://github.com/supabase/auth/blob/v2.197.0/internal/api/logout.go; SDK https://supabase.com/docs/reference/javascript/auth-admin-signout.

## Actual CI outcomes / stop reason
- Run37439040918 (b65751d): runtime startup/reset/session-column preflight PASS only.
- Run37439354568 (2a1c8a2): real Auth session lifecycle preflight PASS only.
- Run37441213252 (385812c): startup FAIL; DB/API skipped; first run suppressed credential-bearing startup logs.
- Run37441459062 (f1227d3): redacted diagnostics revealed migration ownership failure: must be able to SET ROLE volume_core.
- Run37441754525 (5dd2f77): fixed migration operator membership and temporary schema CREATE (revoked at migration end); startup and clean reset PASS; DB suite FAIL; API skipped.
- Run37442226921 (240e159): startup/reset, allowlist/frozen docs/secret scan, typecheck and npm audit PASS; Auth privilege diagnostics PASS as an observation; DB suite FAIL; API skipped.

Diagnostics on actual runner AFTER reset: volume_core Auth schema USAGE=false; SELECT privileges on auth.sessions(id,user_id,created_at)=true; live_self/writer/live_profile owner=volume_core and SECURITY DEFINER=true; auth.sessions RLS=true, FORCE=false. Protected calls fail42501 permission denied for schema auth. Merely documenting grants or assuming managed-Auth accessibility is insufficient. Schema bootstrap/defaults, constraints/exactly-four entities and static minimum-owner/last-Admin guard files PASS. RLS/revocation/version/RPC-audit files FAIL; last-Admin/CAS concurrency via real APIs, audit failure rollback, recovery and Auth Admin404 probe remain NOT RUN.

Second compatibility blocker: the least-privilege reader as currently implemented cannot access managed Auth after actual lifecycle/reset. Before applying an alternative privileged reader, managed-schema policy, BYPASSRLS role, broad Auth-role inheritance or post-start regrant workaround, stop and request owner review. None of those alternatives has been applied. The session lifecycle itself preserves created_at; do not claim that all Supabase versions inherently cannot implement cutoff. Required acceptance A1A02–A1A09 remains FAIL/BLOCKED/NOT RUN; completeA1A01 includes startup/reset/four-table checks PASS, but that does not make the checkpoint complete.

Owner must resolve (1) supported minimum-privilege Auth session reader under actual managed schema/RLS lifecycle and (2) administrative post-commit provider revocation without possessing target JWT. Database authority/cutoff must remain; no frontend logout substitute, token storage, impersonation, ban/delete or new business entity implemented.

## Legacy / checkpoint limits
Legacy ZIP SHA256=f0b0cf8372b1a127a30362bd1a584bb0c1e8a4d3346de6f3113cfdb4d007837b; extracted235-file byte comparison:0 mismatches. Frozen Sprint0 source documents remain unchanged; only four progress/result documents changed within allowlist. No PASS/freeze tag. Draft PR1 remains unmerged; main375379a unchanged. Code is draft, not a security-certified deliverable. Provider compatibility gate deliberately cannot PASS until contract resolution; actual probe has not executed yet.

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

## Owner resolution — resume1A (2026-10-06)
Owner authorizes narrow private session-validation helper instead of broad Auth access for volume_core. Application core has no Auth schema USAGE or session SELECT. private.session_valid(cutoff) returns only boolean, binds user/session to verified PostgREST claims, fixed empty search_path, schema-qualified objects, no client EXECUTE. Helper owner is existing managed auth.sessions table owner supabase_auth_admin; only this read-only adapter uses that native Auth owner; business RPC owners remain volume_core (non-superuser/non-BYPASSRLS). No new Auth schema, Auth role inheritance, token store, Auth writes or provider prepared schema. Supabase Auth owner naturally holds managed-schema privileges; adapter code is the narrow boundary, not a new broad role granted to application code.
Provider limit accepted: no Admin revoke-all-by-user-id; no target JWT storage, Auth-session writes or account ban to force logout. Database live profile/cutoff + real session-created-at remains mandatory authority. Old provider refresh may succeed but old VOLUME private/internal requests must deny; new login uses current rights. Removed obsolete intentionally failing provider gate; no success claim before new complete CI. Prior failures above are historical evidence, not current acceptance.1A IN PROGRESS, not frozen;1B remains unauthorized.
