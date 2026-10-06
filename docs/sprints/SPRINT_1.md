# Sprint 1 — Bốn entity, hai checkpoint độc lập

Trạng thái: **1A AUTHORIZED / CLOSED / FROZEN; 1B PLANNED / NOT AUTHORIZED**. Sprint0 owner approved; G1 CLOSED_OWNER_AUTHORIZED_1A; G2 CLOSED. Data/Auth/Security Core đã được kiểm thử bằng local Supabase trên CI; chưa UI hoặc production deployment. 1A PASS không authorize 1B.

## Business scope không đổi
profiles, venues, staff_memberships, audit_events. Supabase-managed auth.users/auth.sessions không business entity mới; không expose Auth schema. Năm role/matrix giữ nguyên. Auth mọi role Email + Password, recovery email. Không phone/SMS/social/Telegram/passkey/MFA; không schema chuẩn bị provider.

## Checkpoint 1A — Data/Auth/Security Core
Local Supabase config; schema/constraints/grants/RLS/safe views/helpers/RPC; identity/profile bootstrap defaults USER/ACTIVE/version1; server admin provisioning chỉ khi test cần; session cutoff/revocation; audit; seed; DB/API/security tests. Không Customer UI/Control Center business UI/Refine/UI dependency. Test infrastructure headless tối thiểu, không screen/menu placeholder.

### Exact file allowlist 1A
Chỉ tên file dưới đây được tạo/sửa sau authorize 1A; không wildcard folder permission. Config/SQL/TS dưới đây chỉ là tên kế hoạch, CHƯA TẠO. Optional provisioning file không cần thì bỏ. Chỉ deps cần test/Core được thêm với justification; no Refine/React/shadcn/Playwright installation in 1A.

- `package.json`
- `package-lock.json`
- `tsconfig.base.json`
- `.gitignore`
- `.env.example`
- `.github/workflows/sprint1a.yml`
- `vitest.config.ts`
- `supabase/config.toml`
- `supabase/migrations/20261006000100_identity_scope.sql`
- `supabase/migrations/20261006000200_permissions_rpc_audit.sql`
- `supabase/seed.sql`
- `supabase/tests/sprint1_constraints.test.sql`
- `supabase/tests/sprint1_rls.test.sql`
- `supabase/tests/sprint1_rpc_audit.test.sql`
- `supabase/tests/sprint1_revocation.test.sql`
- `supabase/tests/sprint1_versions.test.sql`
- `supabase/tests/sprint1_concurrency.test.sql`
- `supabase/tests/sprint1_auth_bootstrap.test.sql`
- `supabase/functions/admin-auth/index.ts`
- `supabase/functions/_shared/authorize.ts`
- `tests/integration/fixtures/auth.ts`
- `tests/integration/sprint1-api.test.ts`
- `tests/integration/sprint1-revocation.test.ts`
- `tests/integration/sprint1-concurrency.test.ts`
- `tests/integration/sprint1-versions.test.ts`
- `tests/integration/sprint1-auth-recovery.test.ts`
- `README.md`
- `docs/sprints/SPRINT_1.md`
- `docs/sprints/SPRINT_1A_RESULTS.md`
- `docs/OPEN_QUESTIONS.md`

No app/package shared/UI folders ở 1A. Generated node_modules/cache/test reports ignored, không source deliverable; test evidence paths ghi trong result, không future module. Không đổi Blueprint/ADR/permissions/architecture/AGENTS frozen nếu chưa report deviation và được owner duyệt. OPEN_QUESTIONS chỉ ghi status/decision có evidence owner, không tự chốt G3–G14. README và Sprint1 chỉ progress/test result, không thay architecture.

### Forbidden 1A và toàn Sprint1
Customer/Control Center business UI ở 1A; Player, Match, Table, Table Session, Payment, Task, Tournament, Shop/Order/Product, Video/Media, Telegram, CRM, AI, invitation module, animation mới. Không future schema, fake menu, real credentials/data import, production deploy. 1B cũng không các business module này.

## Schema contract
Canonical blueprint.yaml.database.schema_plan. updated_at giữ timestamptz cho thời gian. Các entity mutable có version bigint NOT NULL DEFAULT 1; audit append-only không version.

### profiles

- `id`: uuid PK FK auth.users.id; restrict deletion to approved future maintenance
- `display_name`: text nonempty <=100; self editable
- `role`: text one of five roles; default USER; privileged write only
- `account_status`: text ACTIVE|DISABLED; default ACTIVE
- `sessions_revoked_before`: timestamptz nullable; DB server write
- `created_at`: timestamptz server immutable
- `updated_at`: timestamptz NOT NULL; server update time only; NOT a concurrency token
- `version`: bigint NOT NULL DEFAULT 1; positive; atomically increment once per successful persisted row mutation

### venues

- `id`: uuid PK server generated
- `code`: text unique nonempty <=32
- `name`: text nonempty <=150
- `public_address`: text nullable <=500; public information only
- `timezone`: text validated IANA identifier; no assumed global default
- `is_public`: boolean default false
- `is_enabled`: boolean default true
- `created_at`: timestamptz server immutable
- `updated_at`: timestamptz NOT NULL; server update time only; NOT a concurrency token
- `version`: bigint NOT NULL DEFAULT 1; positive; atomically increment once per successful persisted row mutation

### staff_memberships

- `id`: uuid PK server generated
- `profile_id`: uuid FK profiles.id
- `venue_id`: uuid FK venues.id
- `status`: text ACTIVE|INACTIVE; default ACTIVE
- `extra_permissions`: text[] default empty; fixed whitelist, no duplicates
- `created_at`: timestamptz server immutable
- `updated_at`: timestamptz NOT NULL; server update time only; NOT a concurrency token
- `version`: bigint NOT NULL DEFAULT 1; positive; atomically increment once per successful persisted row mutation

### audit_events

- `id`: uuid PK server generated
- `actor_id`: uuid FK profiles.id nullable only trusted SYSTEM event
- `actor_role`: text snapshot from DB; null for SYSTEM
- `source`: text CUSTOMER_WEB|CONTROL_CENTER|SYSTEM; trusted entrypoint
- `category`: text SECURITY|BUSINESS
- `action`: text fixed Sprint1 action vocabulary
- `target_type`: text profiles|venues|staff_memberships|auth_user
- `target_id`: uuid; typed target correlation, historical record not generic entity system
- `venue_id`: uuid FK venues.id nullable for global events
- `reason`: text required for sensitive change <=500
- `before_data`: jsonb redacted allowlist
- `after_data`: jsonb redacted allowlist
- `correlation_id`: uuid server generated; tracing not generic idempotency store
- `created_at`: timestamptz server immutable

### Version/mutation requirements
Create version1. Update RPC requires expected_version for target and explicit versions for every related row mutated (including profile cutoff on membership change). Compare under row locks; mismatch/missing VERSION_CONFLICT, no timestamp equality. Each changed row increments once atomically with updated_at/cutoff/audit; same row changed several fields increments once. Client cannot override version; stale identical payload retry still rejected; no-op with current version reports NO_CHANGE, no mutation/increment/audit. Audit/constraint failure rolls back all data/version. Own profile update_own_profile RPC only, display_name editable; no direct client table writes.

### Acceptance 1A
A1A01: clean DB reset/migrations/seed PASS; exactly four business entities, no forbidden module.
A1A02: full permission/grants/RLS row+column matrix PASS; proper view/RPC boundaries.
A1A03: cross-venue denial for Manager/Staff and USER isolation PASS.
A1A04: privilege escalation metadata/body/ID/unknown extra/self grant/provision attempts DENY.
A1A05: session/account/membership revocation with real tokens+refresh PASS; provider failure after cutoff still denies old app session.
A1A06: version+1, missing/stale rejection, simultaneous CAS and multi-row rollback PASS; updated_at not concurrency token.
A1A07: last ACTIVE Admin concurrent demote/disable protection PASS.
A1A08: audit actor/category/redaction/append-only/atomicity PASS.
A1A09: Auth email/password five roles, identity bootstrap defaults/profile recovery path headless PASS.
A1A10: service-role absent client/source surfaces; only server/isolated fixture provisioning; no UI at 1A.

## Database/RLS matrix
Thực thi từng row trong supabase/tests; SELECT DENY có thể là 0 rows theo RLS, không bắt buộc HTTP 403. Mutation DENY là no data change/no success audit; error contract nhất quán. Kiểm tra anon/authenticated role với claims phù hợp, không owner/service-role làm role tests.

| Case | Actor/action | Expected |
|---|---|---|
| DB01 | anon/public venues enabled+published | ALLOW safe projection only |
| DB02 | anon/profiles/membership/audit/internal venues | DENY |
| DB03 | USER1 self profile read/display_name update | ALLOW |
| DB04 | USER1 USER2 profile SELECT/update | DENY |
| DB05 | USER1 role/account/cutoff/extra update | DENY |
| DB06 | Admin directory/access A/B | ALLOW appropriate projection |
| DB07 | CEO business reads A/B | ALLOW |
| DB08 | CEO privileged writes/security audit | DENY |
| DB09 | Manager A read A/read B | ALLOW/DENY |
| DB10 | Manager AB scope A/B + USER role with old membership | ALLOW A/B; USER internal DENY |
| DB11 | Staff A own membership/minimal venue | ALLOW |
| DB12 | Staff A others membership/roster/security audit | DENY |
| DB13 | Staff HR directory extra A/roster B | ALLOW A; DENY B |
| DB14 | HR status extra -> another STAFF A | ALLOW status only |
| DB15 | HR status extra -> self, MANAGER, STAFF B, scope/role/extra change | DENY |
| DB16 | Inactive membership + active account | DENY old internal scope; self Customer ALLOW with new session |
| DB17 | Disabled account all private/internal | DENY; public still public |
| DB18 | Direct audit INSERT/UPDATE/DELETE all clients | DENY |
| DB19 | Invalid FK/duplicate membership/unknown role/status/extra | DENY atomically |
| DB20 | Audit feed BUSINESS scope + SECURITY leakage | Correct scoped rows, no security payload |
| DB21 | old session missing or created before cutoff; refreshed old JWT | DENY private/internal |
| DB22 | new session after cutoff | ALLOW only current permissions |
| DB23 | privileged RPC EXECUTE anonymous/wrong role | DENY |
| DB24 | stale/missing bigint expected_version | DENY, unchanged data |
| DB25 | audit insert failure injected in rollback-only test | Business mutation rolled back |
| DB26 | attempt disable/demote last Admin | DENY |
| DB27 | public/internal views vs underlying protected tables | No field/row leakage or bypass |
| DB28 | role/scope mutation revocation cutoff/audit atomic | Same commit or all rollback |


### Version/Auth bổ sung cho 1A

| Case | Actor/action | Expected |
|---|---|---|
| DB29 | Successful update profiles/venues/membership | version+1 exactly once; updated_at remains timestamp |
| DB30 | Same updated_at, different version | Stale expected_version DENY |
| DB31 | Client sets/resets version, missing expected_version, timestamp supplied instead | DENY |
| DB32 | Concurrent writes same expected_version | One mutation; one VERSION_CONFLICT |
| DB33 | Multi-row access/membership+profile cutoff, one stale version | Full rollback; no partial increments/audit |
| DB34 | Audit failure/constraint failure/no-op/retry | Failure no increment; valid no-op none; stale retry DENY |
| DB35 | Auth bootstrap defaults USER/ACTIVE/version1; metadata escalation | Correct defaults; no forged role |
| DB36 | G2 email/password Auth and email recovery data path | Correct Auth identity; no extra provider schema |
## API integration tests
API01: real Auth test login/signup mapping; fabricated token/session mismatch/missing session DENY.
API02: Data API direct queries/updates and RPC using real Admin/CEO/Manager A/B/Staff/User1/User2 tokens; match DB matrix including response field redaction.
API03: public signup metadata role=ADMIN/unknown extra cannot escalate. auth.users contact data cannot read via app endpoint.
API04: revoke with cached token, old refresh, new login, inactive/reactivated account; validate contract against installed Supabase version and auth.sessions access privileges.
API05: simulate Auth signout API failure AFTER DB cutoff commit: old app access still DENY; log/retry procedure documented; no false atomic claim.
API06: Auth provisioning failure/profile hook error/retry reconcile; no duplicate profile or unintended elevated role, audit final result.
API07: simultaneous two Admin demotions/disables cannot leave zero active Admin; simultaneous target grant/disable RPC cannot write using stale authority after locked re-check.
API08: API preview stale expected_version, stale retry identical payload rejected, cross-venue IDs and malicious payload actor/source/before_data ignored/rejected.
API09: direct grants to all four tables and functions reviewed; service-role absent client bundle. Service-role only fixture setup/server tests, never deny-path proof.
API10: timestamp boundary controlled: session created_at == cutoff denied; strictly newer session accepted. Request already begun before commit explicitly outside instant revoke promise.


API11: mutable version+1, missing/stale expected_version rejection, same timestamps not authoritative, direct version manipulation DENY.
API12: concurrent CAS + multi-row version transaction rollback; no double audit; overflow reject safe.
API13: email/password all five roles; email password recovery via local email capture/real Auth API, expired/reused recovery token denied and password changed only for target. This is headless API verification, not recovery UI. Production SMTP/provider excluded.
## Fixtures
ADMIN1/ADMIN2; CEO; MANAGER_A/MANAGER_B/MANAGER_AB; STAFF_A/STAFF_B; STAFF_HR_A; USER1/USER2; disabled account; inactive membership; unpublished/disabled venue; venue A/B; old/new Auth sessions. Fictional non-production data. Không Player fixture/table. Session creation/provisioning uses actual local Auth API where supported.


Fixture profile/venue/membership version starts 1; old/new expected_version, same timestamp with different versions, local recovery mail. No Customer/Control Center UI fixture in 1A.

## Freeze 1A
Required database/API/security tests thực PASS; no NOT RUN/BLOCKED required check. Review grants/definer/current session access and clean migration. Secret/client scan+forbidden entity/module scan+legacy unchanged. Record versions/commands/results/risk/file delta in SPRINT_1A_RESULTS.md; commit/tag 1A checkpoint; DỪNG. Không chạy/build UI/Refine/Playwright hoặc bắt đầu 1B khi chưa authorize. UI/browser tests chưa chạy ở 1A không ngăn freeze 1A, nhưng không gọi Sprint1 toàn bộ DONE.

## Checkpoint 1B — Product Surfaces (planned)
Entry: owner authorize 1B riêng, 1A PASS+freeze. Customer email/password Auth/Profile/recovery UI; Control Center shell; Refine auth/data/access provider; role-aware navigation; venue/access/people/audit đúng permission; preview diff+reason+expected_version confirm; Playwright desktop/mobile. CEO chỉ branch/access overview, không fake revenue/occupancy. Staff minimal scope, USER không internal. Reuse unchanged 1A RPC/schema/security; no database migration/config/function changes in 1B unless deviation reported/approved first.

### Planned exact file allowlist 1B
Danh sách dưới chỉ kế hoạch; không cho phép implement bây giờ. Chốt lại khi owner authorize 1B; không tự mở rộng scope.

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

## Playwright
PW01: customer login/logout/expired session/recovery Email + Password và email recovery (G2 đã chốt); own profile form, invalid data giữ input.
PW02: each role routes/navigation; direct internal URL USER/Staff/Manager-cross-scope blocked safely; no fake module.
PW03: Admin venue/access preview diff+reason+expected_version+confirm; persisted state + audit; stale dialog refuses and reloads.
PW04: Manager branch selector only assigned venues; Staff minimal access page; CEO all branches overview, no fake revenue.
PW05: old open tab after revoke next protected request denied, cache cleared/auth recovery; cannot confirm stale privileges.
PW06: HR extra grant/revoke updates navigation/actions; old session blocked; relogin roster safe projection, target limits.
PW07: desktop 1440 and mobile 390/320px: readable, keyboard focus/tab, no horizontal overflow, action/error clarity. Capture real browser screenshot evidence.
Chromium + WebKit automated E2E; local browser simulation not certification of real Safari/iPhone/macOS. Actual devices remain reported separately if not tested.


### Acceptance/freeze 1B
B1B01: Customer login/logout/email recovery/Profile thật và dễ hiểu; validation giữ input.
B1B02: role-aware routes/nav/surfaces dùng matrix; direct URL/body vẫn DB enforce; không fake menu.
B1B03: preview/confirm dùng expected_version; stale conflict yêu cầu tải lại; không timestamp CAS.
B1B04: Chromium/WebKit desktop 1440/mobile 390/320px screenshots/tests PASS; không overflow, focus/keyboard rõ.
B1B05: 1A DB/API/security regression vẫn PASS mà không sửa contract; cache/old tab revoke xử lý đúng.
Record evidence/file delta in SPRINT_1B_RESULTS.md; checkpoint/tag and STOP. Only after 1B PASS can Sprint1 be called DONE. No next Sprint until owner authorization; payment still gated before Sprint2.

## Historical preflight — superseded by final CI below
Đã thực hiện runtime preflight; chưa chạy local stack hoặc matrix DB/API. Kết quả và các bước còn lại ghi SPRINT_1A_RESULTS.md. Không thay allowlist/scope/schema/test contract. Không freeze 1A.

## Checkpoint 1A — PASS / frozen / STOP
Real complete GitHub Actions https://github.com/HAD10202/Volume/actions/runs/37445694355 PASS at2db65c8d0e5a0c4155b1357a25ef991d8dd1d603:57 database assertions and22 real API/security/concurrency/recovery tests. Final report commit repeats full CI. See docs/sprints/SPRINT_1A_RESULTS.md for evidence, versions, exact file delta, narrow reader privilege bootstrap and owner-accepted provider limitation.
volume_core has no Auth grants; private boolean validator has a dedicated NOLOGIN three-column reader. Old provider sessions/refresh cannot bypass database cutoff; provider revoke-all-by-other-user-id is not implemented or required by owner decision.
Branch checkpoint-1a; draft PR1 unmerged; main unchanged. No production deployment.1B NOT AUTHORIZED; STOP. Production signup/email/SMTP settings and future payment/business gates remain undecided. Frozen Sprint0 documents outside the1A allowlist are historical snapshots; current owner authorization prevails.

## Owner closure — 2026-10-06
**Checkpoint 1A CLOSED / FROZEN.** Owner authorized final review and merge; PR #1 merged into main. Merge/main implementation commit: `7cc481f5f2c58d2d5b04108b14fefd2720920939`.
Final review:28 changed files, all within exact1A allowlist; no Legacy edits/secrets/1B. Compared with approved88ad708: implementation/tests unchanged; only existing allowlisted CI file adds main to push trigger. Pre-merge full run https://github.com/HAD10202/Volume/actions/runs/37449532177 SUCCESS.
Post-merge main full run https://github.com/HAD10202/Volume/actions/runs/37449817588 **SUCCESS** on merge commit. Required core covers real startup/reset,57 database assertions,22 API/security/concurrency/recovery tests, scope/secret checks and dependency audit. Main tree equals the pre-merge tested PR head5248f5e; no merge-introduced code change. Legacy235-file byte comparison:zero differences.
This closure-record commit changes only four allowlisted status/result documents and runs the same full CI on main. The final closure-record SHA and its CI run are recorded in PR #1 after SUCCESS; a failure reopens closure and must be reported. Earlier unmerged/pending-review/preflight statements are historical, superseded by this owner closure.
No new business implementation, deployment, migration changes or Checkpoint1B. **STOP;1B still NOT AUTHORIZED.**

## Authorized Checkpoint1A read maintenance — 2026-10-06
Owner authorized a separate maintenance branch from frozen main1910394 for minimum read contract only. Existing migrations/writes/RLS/Auth helpers, four entities, role vocabulary, fixed extras, audit and CAS remain immutable. No1B app work here.
### Exact maintenance file allowlist
- `supabase/migrations/20261006000300_access_read_projections.sql`
- `supabase/tests/sprint1_projections.test.sql`
- `tests/integration/sprint1-projections.test.ts`
- `.github/workflows/sprint1a.yml`
- `docs/sprints/SPRINT_1.md`
- `docs/sprints/SPRINT_1A_RESULTS.md`
### Maintenance read contract
account_access(profile_id optional): live ACTIVE Admin only; id/display_name/role/account_status/version and complete minimum membership scopes/status/fixed extras/version for account/access preview. Includes accounts without membership and disabled targets; no Auth contacts/cutoff/timestamps.
membership_mutation_targets(venue): live MANAGER/STAFF with ACTIVE membership and STAFF_MEMBERSHIP_STATUS_MANAGE at this venue; only other STAFF target memberships at this venue, including INACTIVE for reactivation. Returns target id/name, venue/membership id, account/membership status, membership.version and profile.version; no other roles, other venues, extras or directory grant. Admin uses account_access and existing ACCESS_MANAGE path. No change to existing staff directory read fields.
Read RPCs use minimum volume_core owner, empty search_path, restricted EXECUTE and live session/cutoff. No broad SELECT grants, schema/table or generic permission builder. Existing57 DB assertions and22 integration tests must PASS plus new projection/negative/CAS/revocation tests. Merge maintenance only after real CI PASS; freeze new main, update1B base, then resume1B. No Sprint2.
