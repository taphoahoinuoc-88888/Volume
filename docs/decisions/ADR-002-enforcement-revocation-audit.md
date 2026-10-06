# ADR-002 — Database enforcement, revoke session và audit

Ngày: 2026-10-06. Trạng thái: Sprint 0 snapshot, chờ duyệt để triển khai.

## Căn cứ đã duyệt
Database/backend enforce; frontend phản ánh. Grants/RLS/views/RPC/transactions/constraints được phép; thu hồi quyền đúng; audit quản trị cơ bản.

## Quyết định contract
Role/scope luôn đọc authority hiện tại tại database. Mọi request private/internal phải kiểm tra profile ACTIVE và session validity. Không dựa JWT role hoặc UI filter. Self update dùng dedicated RPC + expected_version, theo chỉnh sửa owner tại ADR-004.

sessions_revoked_before tại profiles là cutoff server. Session cũ bị từ chối sau commit nếu auth.sessions không còn tồn tại hoặc created_at <= cutoff. Kiểm tra session_id/user; không tin client claim khác JWT verified. Refresh iat mới không làm session cũ sống lại. Auth revoke là bước sau commit; thất bại không mở lại DB access. Relogin tạo session mới theo quyền hiện tại. Chưa tuyên bố triển khai khả thi trước integration spike ở Sprint 1.

Đổi role/scope/extra/account/membership status, cutoff và audit atomic. Không transaction giả giữa PostgreSQL và external Auth API. Provisioning mặc định USER trước; gán quyền qua Admin RPC đã audit. Profile hook failure/reconcile phải được API test.

Audit có category SECURITY/BUSINESS. Security chỉ Admin; business CEO global, Manager scoped. Client không INSERT/UPDATE/DELETE audit. Before/after redacted field allowlist. Failure audit rollback action. Không xóa hoặc sửa lịch sử.

Last-active-Admin invariant kiểm tra dưới serialization lock; stale expected version bị reject; không self role change. No-op có expected_version đúng không sinh mutation/audit/version increment; expected_version cũ luôn VERSION_CONFLICT kể cả payload trùng. updated_at không là concurrency token; mỗi persisted mutation tăng bigint version atomically. Chi tiết được owner sửa tại ADR-004.

## Lựa chọn loại bỏ
Chỉ logout UI; chờ JWT hết hạn; JWT chứa quyền là authority; service-role làm client proxy; preview whole DB; audit sau commit kiểu best-effort.
