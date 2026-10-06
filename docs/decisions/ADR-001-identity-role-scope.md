# ADR-001 — Identity, role, scope và privacy

Ngày: 2026-10-06. Trạng thái: Sprint 0 snapshot, chờ duyệt bộ tài liệu để triển khai.

## Căn cứ đã duyệt
Một auth.users + một profiles; role ở profiles; chỉ ADMIN/CEO/MANAGER/STAFF/USER; không multi-role theo venue; HR/Player không là role; membership và Player cùng identity.

## Contract cụ thể hóa
profiles ACTIVE/DISABLED; staff_memberships ACTIVE/INACTIVE. MANAGER/STAFF cần active membership để truy cập nội bộ venue. ADMIN/CEO scope global không tạo membership wildcard. USER không quyền nội bộ. Không cộng role cũ từ membership. Không tự tạo scope nếu thiếu venue.

Extra permission là array whitelist HR trên membership, không bảng permission/role động. V1 whitelist STAFF_DIRECTORY_READ và STAFF_MEMBERSHIP_STATUS_MANAGE; chỉ MANAGER/STAFF, venue-bound. ADMIN cấp và thu hồi; không self grant. CEO V1 chỉ có permission đọc đã liệt kê, không permission ghi nghiệp vụ được suy đoán.

Ngừng membership giữ account/customer/player; khóa account chặn private/internal toàn hệ thống. Public info vẫn truy cập được như khách chưa đăng nhập. Roster projection không trả thông tin Auth/session; người dùng không công khai mặc định.

## Hệ quả
Không STAFF_PROFILE entity mới. Một cặp profile/venue duy nhất; nhiều venue được phép nhưng một role. Thay đổi sang USER làm membership INACTIVE cùng transaction, giữ lịch sử. Không hard-delete records qua Sprint 1 UI.

## Lựa chọn loại bỏ
Role tại membership + profile (duplicate authority); HR role; multi-role theo venue; DB theo client; generic permission builder. Chi tiết whitelist/status/projection trong ADR này là contract trình duyệt Sprint 0, không tự nhận đã được user duyệt riêng.
