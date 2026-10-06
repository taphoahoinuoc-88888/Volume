# ADR-002 — Database enforcement, revoke session và audit

Ngày: 2026-10-06. Trạng thái: Sprint 0 snapshot, chờ duyệt để triển khai.

## Căn cứ đã duyệt
Database/backend enforce; frontend phản ánh. Grants/RLS/views/RPC/transactions/constraints được phép; thu hồi quyền đúng; audit quản trị cơ bản.

## Quyết định contract
Role/scope luôn đọc authority hiện tại tại database. Mọi request private/internal phải kiểm tra profile ACTIVE và session validity. Không dựa JWT role hoặc UI filter. Self update dùng grants cột + RLS.

sessions_revoked_before tại profiles là cutoff server. Session cũ bị từ chối sau commit nếu auth.sessions không còn tồn tại hoặc created_at <= cutoff. Kiểm tra session_id/user; không tin client claim khác JWT verified. Refresh iat mới không làm session cũ sống lại. Auth revoke là bước sau commit; thất bại không mở lại DB access. Relogin tạo session mới theo quyền hiện tại. Chưa tuyên bố triển khai khả thi trước integration spike ở Sprint 1.

Đổi role/scope/extra/account/membership status, cutoff và audit atomic. Không transaction giả giữa PostgreSQL và external Auth API. Provisioning mặc định USER trước; gán quyền qua Admin RPC đã audit. Profile hook failure/reconcile phải được API test.

Audit có category SECURITY/BUSINESS. Security chỉ Admin; business CEO global, Manager scoped. Client không INSERT/UPDATE/DELETE audit. Before/after redacted field allowlist. Failure audit rollback action. Không xóa hoặc sửa lịch sử.

Last-active-Admin invariant kiểm tra dưới serialization lock; stale expected version bị reject; không self role change. Repeated identical successful admin update không sinh thêm mutation hoặc success audit nếu không có thay đổi; retry stale trả trạng thái đã hiện tại/reload, không ghi đè thay đổi khác.

## Lựa chọn loại bỏ
Chỉ logout UI; chờ JWT hết hạn; JWT chứa quyền là authority; service-role làm client proxy; preview whole DB; audit sau commit kiểu best-effort.
