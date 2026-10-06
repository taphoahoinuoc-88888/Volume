# ADR-004 — Owner correction: Auth Policy, bigint version và checkpoint 1A/1B

Ngày: 2026-10-06. Trạng thái: quyết định owner đã chốt cho tài liệu; implementation 1A/1B CHƯA AUTHORIZE.

## Thay đổi có authorization
G2: Email + Password cho internal và USER, email password recovery, Supabase Auth duy nhất. Chưa phone OTP/SMS/social/Telegram/passkey/MFA; không schema chuẩn bị provider. G1–G14 được định nghĩa/status rõ ở OPEN_QUESTIONS và Blueprint.

updated_at giữ timestamptz, chỉ thời gian. profiles/venues/staff_memberships thêm version bigint NOT NULL DEFAULT 1; update expected_version required, stale rejected, mỗi persisted row mutation version+1 atomic. audit_events append-only không version. No-op không mutation nhưng stale token vẫn reject. Multi-row compares all affected versions and rolls back as one unit.

Để enforce missing/stale version cả self edit, own display_name update chuyển từ direct column PATCH sang dedicated update_own_profile RPC. Đây là contract adjustment được báo rõ trong Sprint0 revision, không thêm entity/permission hoặc generic API. Actor quyền lấy DB; client không sửa version. Snapshot timestamp semantics ADR-002 bản trước được thay thế; Git giữ lịch sử.

Sprint1 không đổi business scope: 1A config/schema/constraints/grants/RLS/views/helpers/RPC/Auth bootstrap/revoke/audit/seed/DB+API tests; 1B UI/Refine/confirmation/navigation/Playwright desktop+mobile. PASS một checkpoint không authorize checkpoint kế tiếp. DB 1A frozen; deviation phải báo/approve trước đổi.

## Còn cần kiểm chứng
Auth session cutoff/provider lifecycle tại 1A; Auth email confirmation/signup/recovery operational settings không được giả định thành business rule. Không implementation ở Sprint0.
