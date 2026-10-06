# Sprint 1 — Auth/Profile/Role/Scope/Branch/Permission/RLS/Audit

Trạng thái: **PLANNED / NOT AUTHORIZED**. Chỉ bắt đầu sau owner approval Sprint 0 và chốt G2 Auth policy. Không có migration/code/app hiện tại.

## Scope
Bốn entity nghiệp vụ profiles, venues, staff_memberships, audit_events. Supabase-managed auth.users/auth.sessions không là business entity mới; không expose auth schema. Customer Auth/Profile; Control Center Auth, access overview, venue/people/audit theo quyền. Không dashboard tài chính/occupancy giả.

Đăng nhập/logout/recovery theo G2; defaults signup USER/ACTIVE; secure profile hook idempotent. Admin provision account server-side; bootstrap Admin đầu qua operator procedure test-only/controlled, không client param. Revoke session/role/scope có hiệu lực database. Grants/RLS/RPC, audit, anti-escalation, stale confirmation và last-admin concurrency bắt buộc.

## Exact file allowlist
Chỉ tên file dưới đây được tạo/sửa; không có wildcard folder permission. Directory ancestors có thể tạo để chứa file; không thêm file tiện lợi ngoài danh sách. Build/test generated output ignored (node_modules, dist, reports, cache), không là source deliverable. Pin runtime/library versions vào lockfile sau compatible check. Không cần file optional nào thì không tạo.

- `package.json`
- `package-lock.json`
- `tsconfig.base.json`
- `.gitignore`
- `.env.example`
- `.github/workflows/sprint1.yml`
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
- `vitest.config.ts`
- `supabase/config.toml`
- `supabase/migrations/20261006000100_identity_scope.sql`
- `supabase/migrations/20261006000200_permissions_rpc_audit.sql`
- `supabase/seed.sql`
- `supabase/tests/sprint1_constraints.test.sql`
- `supabase/tests/sprint1_rls.test.sql`
- `supabase/tests/sprint1_rpc_audit.test.sql`
- `supabase/tests/sprint1_revocation.test.sql`
- `supabase/functions/admin-auth/index.ts`
- `supabase/functions/_shared/authorize.ts`
- `playwright.config.ts`
- `tests/e2e/fixtures/auth.ts`
- `tests/e2e/sprint1-auth.spec.ts`
- `tests/e2e/sprint1-permissions.spec.ts`
- `tests/e2e/sprint1-admin.spec.ts`
- `tests/e2e/sprint1-mobile.spec.ts`
- `tests/integration/sprint1-api.test.ts`
- `tests/integration/sprint1-revocation.test.ts`
- `tests/integration/sprint1-concurrency.test.ts`
- `README.md`
- `docs/sprints/SPRINT_1.md`
- `docs/sprints/SPRINT_1_RESULTS.md`
- `docs/OPEN_QUESTIONS.md`

Các file Blueprint/architecture/permissions/ADR/AGENTS đã freeze không nằm implementation allowlist. Thay đổi cần owner review trước code. docs/OPEN_QUESTIONS.md chỉ được đánh dấu gate đã chốt với quyết định user thực tế, không tự trả lời business rule. SPRINT_1.md chỉ cập nhật execution status/evidence, không đổi scope âm thầm.

## Folder giới hạn
apps/customer và apps/control-center chỉ features đã có tên trên. packages/shared không chứa duplicate business engine. supabase/migrations chỉ bốn business tables và SQL helper/view/RPC/trigger liên quan. supabase/functions chỉ admin-auth và authorize helper; không API server. Tests chỉ Sprint1; seed local/test, không production data. Không invitation token schema.

## Forbidden modules
player, match, table, table_session, payment, task, tournament, shop, order, product, media, video, telegram, crm, ai, new_animation, invitation_module. Không schema/menu/screen/fixture/API/action cho các module này. Legacy toàn bộ read-only; không .env/credentials production, không automatic import/deploy.

## Schema dự kiến
Canonical field types/constraints: blueprint.yaml.database.schema_plan. Không tạo SQL ở Sprint 0.

### profiles

- `id`: uuid PK FK auth.users.id; restrict deletion to approved future maintenance
- `display_name`: text nonempty <=100; self editable
- `role`: text one of five roles; default USER; privileged write only
- `account_status`: text ACTIVE|DISABLED; default ACTIVE
- `sessions_revoked_before`: timestamptz nullable; DB server write
- `created_at`: timestamptz server immutable
- `updated_at`: timestamptz server monotonic version for stale protection

### venues

- `id`: uuid PK server generated
- `code`: text unique nonempty <=32
- `name`: text nonempty <=150
- `public_address`: text nullable <=500; public information only
- `timezone`: text validated IANA identifier; no assumed global default
- `is_public`: boolean default false
- `is_enabled`: boolean default true
- `created_at`: timestamptz server immutable
- `updated_at`: timestamptz server monotonic

### staff_memberships

- `id`: uuid PK server generated
- `profile_id`: uuid FK profiles.id
- `venue_id`: uuid FK venues.id
- `status`: text ACTIVE|INACTIVE; default ACTIVE
- `extra_permissions`: text[] default empty; fixed whitelist, no duplicates
- `created_at`: timestamptz server immutable
- `updated_at`: timestamptz server monotonic

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

## Constraints và persistence
FK identity/venue; unique profile_id+venue_id; status/role checks; extra whitelist + duplicates reject; role eligibility enforcement tại trusted RPC/trigger; monotonic updated_at server để stale detection. Audit payload allowlist; source/category/action fixed. Không generic state/role/entity registry. Delete restrictions giữ lịch sử; không client hard delete. Reason bắt buộc create/change privilege, disable/reactivate và provision; self session revoke reason server đặt.

Index PK/unique và scope query thực cần: membership profile_id/venue_id; audit venue_id+created_at và actor_id+created_at. Không tạo index mọi cột để chứng minh tiến độ.

## Acceptance criteria
AC01: auth identity mapping đúng 1:1; public signup không đặt role/extra/account_status.
AC02: Admin đọc/quản trị toàn hệ thống theo matrix; không arbitrary SQL/skip invariant.
AC03: CEO đọc business toàn hệ thống; role/scope/security/account/provision/write venue phải DENY.
AC04: Manager A chỉ dữ liệu venue A; Manager B không truy cập A; Manager AB đọc A/B cùng role.
AC05: Staff A chỉ own membership/minimal venue; không roster/customer/finance/security ngoài permission. HR extra đúng whitelist/target/scope.
AC06: USER chỉ own safe profile/public venue; direct private/internal enumeration DENY.
AC07: Đổi role/scope/extra/membership/account cắt quyền request mới sau commit; token/session cũ DENY; old refresh iat không bypass; login lại đúng quyền hiện tại.
AC08: Membership INACTIVE không ban account; relogin vẫn Customer; account DISABLED chặn private/internal toàn hệ thống; reactivate không revive session cũ.
AC09: RLS/grants/RPC enforce dù bỏ UI hoặc sửa request; unknown permission/cross-venue/self escalation DENY.
AC10: Admin actions có audit đúng actor/role/target/scope/category/reason/redaction; audit fail rollback mutation.
AC11: Không sửa/xóa audit hoặc sensitive fields trực tiếp; security audit Admin-only.
AC12: Stale confirm DENY; retry cùng trạng thái không double mutation/audit; last-active-Admin protected dưới cạnh tranh.
AC13: Không screen/menu/schema/module forbidden; UX lỗi dễ hiểu, giữ form sau validation error, confirmation có diff+reason.
AC14: Database reset+migrations+seed trên local sạch; DB/API/Playwright thực PASS; secrets không nằm client/repo.

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
| DB24 | stale expected updated_at | DENY, unchanged data |
| DB25 | audit insert failure injected in rollback-only test | Business mutation rolled back |
| DB26 | attempt disable/demote last Admin | DENY |
| DB27 | public/internal views vs underlying protected tables | No field/row leakage or bypass |
| DB28 | role/scope mutation revocation cutoff/audit atomic | Same commit or all rollback |

## API integration tests
API01: real Auth test login/signup mapping; fabricated token/session mismatch/missing session DENY.
API02: Data API direct queries/updates and RPC using real Admin/CEO/Manager A/B/Staff/User1/User2 tokens; match DB matrix including response field redaction.
API03: public signup metadata role=ADMIN/unknown extra cannot escalate. auth.users contact data cannot read via app endpoint.
API04: revoke with cached token, old refresh, new login, inactive/reactivated account; validate contract against installed Supabase version and auth.sessions access privileges.
API05: simulate Auth signout API failure AFTER DB cutoff commit: old app access still DENY; log/retry procedure documented; no false atomic claim.
API06: Auth provisioning failure/profile hook error/retry reconcile; no duplicate profile or unintended elevated role, audit final result.
API07: simultaneous two Admin demotions/disables cannot leave zero active Admin; simultaneous target grant/disable RPC cannot write using stale authority after locked re-check.
API08: sensitive preview stale, retry identical success, cross-venue IDs and malicious payload actor/source/before_data ignored/rejected.
API09: direct grants to all four tables and functions reviewed; service-role absent client bundle. Service-role only fixture setup/server tests, never deny-path proof.
API10: timestamp boundary controlled: session created_at == cutoff denied; strictly newer session accepted. Request already begun before commit explicitly outside instant revoke promise.

## Fixtures
ADMIN1/ADMIN2; CEO; MANAGER_A/MANAGER_B/MANAGER_AB; STAFF_A/STAFF_B; STAFF_HR_A; USER1/USER2; disabled account; inactive membership; unpublished/disabled venue; venue A/B; old/new Auth sessions. Fictional non-production data. Không Player fixture/table. Session creation/provisioning uses actual local Auth API where supported.

## Playwright
PW01: customer login/logout/expired session/recovery theo G2; own profile form, invalid data giữ input.
PW02: each role routes/navigation; direct internal URL USER/Staff/Manager-cross-scope blocked safely; no fake module.
PW03: Admin venue/access preview diff+reason+confirm; persisted state + audit; stale dialog refuses and reloads.
PW04: Manager branch selector only assigned venues; Staff minimal access page; CEO all branches overview, no fake revenue.
PW05: old open tab after revoke next protected request denied, cache cleared/auth recovery; cannot confirm stale privileges.
PW06: HR extra grant/revoke updates navigation/actions; old session blocked; relogin roster safe projection, target limits.
PW07: desktop 1440 and mobile 390/320px: readable, keyboard focus/tab, no horizontal overflow, action/error clarity. Capture real browser screenshot evidence.
Chromium + WebKit automated E2E; local browser simulation not certification of real Safari/iPhone/macOS. Actual devices remain reported separately if not tested.

## Freeze criteria
Every AC linked to actual evidence; DB tests + API + unit shared permission projection + Playwright PASS. No NOT RUN/BLOCKED required check. Clean DB replay PASS; forbidden entity/menu check PASS; no legacy hash change. Review SQL definer/grants/column projections and client secret scan. No scope changes without approval. Record exact file delta, versions, commands/results, UX screenshots, limits in SPRINT_1_RESULTS.md, checkpoint/tag. No claim real payment/video/Telegram production ready. DỪNG trước Sprint 2; payment rules still gate.
