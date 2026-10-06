# Checkpoint 1B — BLOCKED BEFORE APPLICATION IMPLEMENTATION

Date:2026-10-06. Owner conditionally authorized1B after direct GitHub preflight. Branch checkpoint-1b starts exactly at frozen main `1910394b2c446c031109da6f170ead83169ff015`. Checkpoint1A CLOSED/FROZEN remains unchanged. No1B application code, dependencies or CI configuration created.

## Direct GitHub preflight — PASS
Fresh reads from GitHub, not prior conclusion: main HEAD equals expected1910394; PR1 state closed/merged=true, target main, merge7cc481f5f2c58d2d5b04108b14fefd2720920939. Compare88ad708 to frozen main: only existing workflow trigger and four status/result documents differ; migrations/helpers/RPC/tests are unchanged.
Main workflow https://github.com/HAD10202/Volume/actions/runs/37450151247 completed SUCCESS on expected SHA. Actual job112224490278 logs contain57 DB assertions across7 files PASS and22 integration tests across5 files PASS. DB RLS/revocation/RPC-audit/version/bootstrap/constraints/concurrency files all ok; API/security, version, revocation, concurrent transactions and actual recovery suites all PASS. Allowlist/secret scan/typecheck/npm audit steps PASS;zero vulnerabilities.
Freshly fetched all41 tracked blobs at expected SHA: secret-pattern scan clean, no apps/packages or future module implementations. Source tree contains only four business entities. No full security certification is inferred from pattern scanning alone. Original Legacy ZIP SHA256 f0b0cf8372b1a127a30362bd1a584bb0c1e8a4d3346de6f3113cfdb4d007837b;235 extracted files compared byte-for-byte:zero mismatches. No Legacy code/config/data changed.

## Contract review
Read frozen AGENTS, Blueprint, architecture, permissions, Sprint1 and related ADRs from GitHub. Owner current authorization supersedes historical Sprint0 authorization flags. Planned exact1B allowlist contains56 paths. This sole new report is explicitly allowed; no allowlist expansion. Frozen migrations/RLS/RPC/security/config/1A tests are outside1B mutation scope.

## Blocker — missing authorized access-management read projections
Source at frozen SHA: supabase/migrations/20261006000200_permissions_rpc_audit.sql.
1. private.live_self (line24) compares caller profile.id only; authenticated SELECT profiles policy(line220) is self-only, including Admin. current_access(line74) returns only caller profile. staff_directory(line86)/membership_directory(line94) start from memberships at a supplied venue. Therefore Admin cannot list/select/read a USER or ADMIN/CEO without a membership, or load that target's current role/account state/version for safe access/account management preview. Write RPCs exist, but a manually entered UUID/guessed version is not a usable or authoritative preview.
2. Both staff_directory and Admin membership_directory omit target account_status. A membership ACTIVE is not proof account ACTIVE. UI must not label a disabled account enabled or invent the before-state for account status diff. Audit history is not a current-state read authority and may not cover every seeded/imported account.
3. HR fixed extra STAFF_MEMBERSHIP_STATUS_MANAGE may be granted independently of STAFF_DIRECTORY_READ. A STAFF caller with status-only extra can write another STAFF membership with expected membership/profile versions, but current read paths expose only own membership, and can_directory requires separate directory permission. set_staff_membership_status(line193/200) requires both target versions. There is no authorized target/edit projection for this valid permission combination. Tests presently obtain those target versions through isolated fixture SQL, not a browser-readable authorized projection.

These gaps block required people/access/account-state UI and preview/version UX. Authentication UI could be implemented alone, but owner explicitly requires STOP before changing frozen1A contract; no partial product implementation started.

## Owner decision required — proposal only, NOT applied
Authorize a separate1A maintenance scope before resuming1B: minimum Admin-only account/access read projection for eligible targets, including id/display_name/role/account_status/profile.version and necessary membership ids/scopes/status/fixed extras/versions; and an action-specific HR target projection limited to other STAFF at authorized venues with both versions, without implicitly granting directory permission. Reuse existing four entities, live session/cutoff authority and fixed permission vocabulary. No Auth contacts/session cutoff exposure, generic permission builder, service-role proxy or broad profile SELECT grant proposed.
Exact new migration/test paths and maintenance allowlist must be owner-approved first. No new RPC/schema/RLS grant created, no frozen migration edited. This is an integration-contract proposal, not an approved architecture change.

## Tests / handoff status
1A preflight evidence PASS;1B typecheck/lint/build/unit/route/Playwright/backend browser integration/CI NOT RUN because implementation is stopped at contract blocker.1B is BLOCKED, never PASS/frozen.
Changed file: docs/sprints/SPRINT_1B_RESULTS.md only. No dependency/version delta, no1B app/CI/tests, no main/history rewrite, no1A maintenance implementation, no Sprint2 or future module. Do not proceed until owner resolves maintenance scope. STOP.
