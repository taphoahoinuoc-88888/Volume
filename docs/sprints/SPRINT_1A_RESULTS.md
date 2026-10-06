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
Local typecheck PASS; YAML parsing/allowlist checks PASS. Full GitHub Actions DB/API/security matrix: NOT RUN at this report revision. No freeze/completion claim. Required tests are not replaced by static checks or preflight.
Database files cover constraints, grants/RLS, RPC/audit, revocation, versions, last-Admin invariant and bootstrap. Integration suites cover actual tokens, full role/scope matrix, metadata forgery, HR limits, direct audit denial, old refresh/new session/cutoff boundaries, injected bootstrap/audit faults, bigint exactness/overflow/multirow rollback, concurrent CAS/Admin protection/authority recheck, and captured email recovery/replay/expiry.
Privileged SQL is confined to isolated local fixture setup, fault injection and observations; allow/deny requests always use anon key and real user JWTs. Provider revoke failure is modeled by deliberately leaving real old Auth sessions alive after DB cutoff, proving application denial independent of provider success.

## Security / limits
No security acceptance yet: full CI must pass. No Auth schema exposure; no service-role key used by allow/deny clients. Startup logs suppressed to avoid CLI printing local generated keys. No production credentials. Provisioning Edge Function is optional and not implemented: test operator uses real signup plus controlled SQL fixture bootstrap/reconciliation audit; no generic privileged API proxy.
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
