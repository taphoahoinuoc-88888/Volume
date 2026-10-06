# Contract kiến trúc V2

Snapshot Sprint 0, chờ duyệt để triển khai. `blueprint.yaml` canonical; đây là giải thích, không thêm entity/state ngoài Blueprint.

## Identity và scope
`auth.users.id = profiles.id`. Một identity Auth có đúng một profile nghiệp vụ. Auth quản lý credentials/provider/session; profile giữ display_name, một role và trạng thái tài khoản. Không lưu email/phone Auth thành bản sao mặc định trong profiles.

`staff_memberships(profile_id, venue_id)` là quan hệ nhân sự và chi nhánh, duy nhất mỗi cặp. Một MANAGER/STAFF có thể có nhiều membership nhưng role giống nhau tại mọi chi nhánh. ADMIN/CEO không cần membership để có phạm vi toàn hệ thống. USER không có quyền nội bộ kể cả tồn tại membership cũ; role transition sang USER giữ lịch sử nhưng vô hiệu membership trong transaction. Player Profile sau này dùng cùng profiles.id, không role riêng.

Account ACTIVE/DISABLED. Membership ACTIVE/INACTIVE. Khóa account chặn toàn bộ dữ liệu/action riêng và nội bộ; dữ liệu public vẫn là public. Ngừng membership chỉ cắt truy cập nội bộ venue đó, không khóa identity, không mất dữ liệu khách/Player, không xóa lịch sử. Không xóa cứng profile/venue/membership từ UI Sprint 1.

## Các lớp
| Lớp | Trách nhiệm | Không được giữ |
|---|---|---|
| Customer Web | Auth, profile và luồng khách | Luật quyền/tiền độc lập |
| Control Center | Một app Refine/shadcn, dữ liệu theo role+scope | App riêng cho từng role, menu giả |
| Data API | Đọc/ghi cột thông thường theo grants+RLS | Bypass quyền qua client filter |
| PostgreSQL RPC | Transaction, validate, privilege boundary, audit | Tin actor/role/venue từ client |
| Edge Functions | Auth Admin API, tích hợp cần secret | Một business core thứ hai |
| Telegram sau này | Adapter tới cùng core | DB/identity/permission riêng |

React/TypeScript; workspace đơn giản, một lockfile. Không cài stack trong Sprint 0. Version cụ thể khóa ở Sprint 1 sau kiểm tra tương thích. Không tự thêm ORM/backend server để bọc lại Data API.

## Database enforcement
Deny-by-default; explicit grants và RLS cho từng operation. USING và WITH CHECK cho đúng loại action; constraint/FK/unique để bảo đảm consistency. Không dùng metadata người dùng tự sửa làm role. JWT chỉ chứng minh identity/session, không là bản authority role/scope.

profiles chứa cột nhạy cảm nên self update chỉ allow display_name qua dedicated RPC có expected_version. Không grant SELECT toàn bộ profiles cho Staff/Manager. Danh sách nhân sự qua projection/RPC trả id, display_name, role, membership status tại venue được phép; không Auth email, phone, session cutoff hoặc extra_permissions của người khác.

Public venue projection chỉ id, code, name, public_address, timezone của venue is_public=true và is_enabled=true. Không publish toàn profiles/roster/audit. View public phải chỉ chứa cột public và kiểm tra predicate tại database; kiểm thử riêng, không mặc nhiên cho rằng mọi view thừa hưởng RLS. View nội bộ dùng security_invoker khi phù hợp; nếu privileged RPC/view cần quyền cao, review và test boundary cụ thể.

SECURITY DEFINER chỉ khi cần, function owner tối thiểu, search_path cố định an toàn, tham chiếu schema rõ, revoke EXECUTE mặc định PUBLIC/anon; grants cho caller đúng. Helper quyền đặt schema không exposed, không tạo business database/entity mới. Tránh RLS recursion bằng helper đã review. Credential service-role chỉ ở server; route dùng nó phải tự kiểm tra Auth/role/scope hiện tại trước từng action và không expose generic database proxy.

## Permission và revocation
Vocabulary và matrix ở permissions.md/blueprint.yaml. Role defaults cố định; extra chỉ trên active membership của MANAGER/STAFF, whitelist HR cố định, scope duy nhất venue đó, không grants security/global. ACTIVE account là tiền điều kiện cho private/internal access.

Đổi role/scope/extra hoặc trạng thái membership cập nhật sessions_revoked_before và audit trong cùng transaction. Từ request bắt đầu sau commit, session cũ bị từ chối ở mọi đường private/internal của V2, dù JWT chưa hết hạn. Kiểm tra session_id có user đúng, session còn tồn tại và auth.sessions.created_at lớn hơn cutoff. JWT iat mới của refresh session cũ không đủ vượt cutoff. Backend revoke Auth session sau commit qua Auth API; nếu provider lỗi, database cutoff vẫn chặn. Không hứa cross-service transaction; ghi server error không secret, retry vận hành. Session mới từ đăng nhập lại hợp lệ lấy quyền hiện tại. Ngừng membership không ban Auth account; sau login lại vẫn dùng Customer Web.

Request đã bắt đầu trước commit có thể hoàn tất đọc theo snapshot cũ; không hứa xóa dữ liệu đã xem/download. Mutating RPC role/scope nhạy cảm khóa các authorization row cần thiết và re-check trước write. Mọi action đổi quyền ADMIN dùng một serialization lock để ngăn race gỡ Admin cuối cùng; technical locking được kiểm thử, không là entity mới.

auth.sessions là bảng do Supabase quản lý, chỉ helper đặc quyền được đọc field tối thiểu để validate; không expose hay chỉnh trực tiếp từ client. Cần integration spike Sprint 1 chứng minh grant/session lifecycle trên version được chọn. Nếu không thực hiện được contract, báo trước và cập nhật quyết định được duyệt; không thay bằng logout frontend.

## Quản trị và transaction
Admin provision qua Auth Admin API; credentials luôn thuộc Auth. Auth creation và profile creation không phải distributed transaction: secure profile hook chỉ defaults USER/ACTIVE, idempotent; nếu provisioning lỗi phải reconcile/cleanup Auth test account theo procedure có audit, không rollback giả. Bootstrap Admin đầu tiên qua procedure server/operator có kiểm soát, không public signup parameter.

Mutable profiles/venues/staff_memberships có version bigint NOT NULL DEFAULT 1. updated_at timestamptz chỉ thời gian cập nhật, không token concurrency. RPC update bắt buộc expected_version; database kiểm tra version dưới row lock và từ chối VERSION_CONFLICT nếu khác hoặc thiếu. Client không được đặt version. Mỗi successful persisted row mutation tăng version atomically đúng một lần/command, cùng updated_at/cutoff/audit; rollback không tăng. Create bắt đầu 1, unique guard; no-op không mutation và không tăng nhưng vẫn kiểm tra expected_version trước. Retry version cũ luôn reject, không báo success chỉ vì payload trùng. Multi-row preview mang expected_version từng existing row liên quan (kể cả profile thay cutoff), sai một row rollback toàn command. Sensitive UI preview diff+reason+confirm ở 1B; 1A chứng minh contract bằng API. Không timestamp equality hay whole-database snapshot.

Không tự cấp/quản lý quyền mình từ giao diện; user chỉ own profile và revoke own sessions. Không cho xóa/disable/demote Admin ACTIVE cuối cùng, kể cả hai request cạnh tranh. Auth provisioning không tự tạo role ADMIN. Không exposed account DELETE Sprint 1.

V1 STAFF_MEMBERSHIP_STATUS_MANAGE chỉ đổi ACTIVE/INACTIVE của target role STAFF tại venue actor có membership ACTIVE; không tự đổi, không đổi role/scope/extra, không tạo membership. Manager/Staff được Admin cấp permission này mới dùng. MANAGER không có permission này mặc định. Thay membership target revoke session toàn target vì phiên Auth không riêng theo venue; account vẫn ACTIVE. Reactivate không khôi phục session cũ.

## Audit
Append-only bằng trigger/RPC trusted; actor từ auth.uid(), source do trusted entrypoint đặt. Actor role tại thời điểm hành động do DB lấy; target/reason/before/after field allowlist. AUDIT ghi cùng transaction dữ liệu quản trị. Audit insert lỗi => rollback dữ liệu. AUTH provider events không được gọi là audit nghiệp vụ V2.

SECURITY events (role/scope/account/HR status/provisioning) chỉ Admin đọc. BUSINESS events scoped venue (ví dụ thay thông tin public venue) CEO đọc toàn hệ thống, Manager chỉ venue được phân công. Staff/User không đọc audit feed. Không expose unredacted security payload qua business audit. Rejected action không tạo success audit; security denial dùng log server tối thiểu, không nhét vào transaction bị rollback.

## Mở rộng sau Sprint 1
Chưa tạo schema Table/Payment/Task/Player/Match/Tournament/Shop/Media/Telegram. Table phục vụ ACTIVE/MAINTENANCE/DISABLED; occupancy suy từ sessions. Sprint 2 đợi business rule payment. Transaction tạo session/pending, xác nhận/activate, idempotency và concurrency phải được contract riêng trước implement. Không tự tính revenue từ thao tác DEMO số tiền 0 legacy.

## Repository dự kiến
apps/customer; apps/control-center; packages/shared; supabase/migrations; supabase/tests; supabase/functions; tests/e2e; docs/decisions; docs/sprints. Chỉ docs hiện tồn tại. Legacy bên ngoài repo V2. Không tạo future-module skeleton. Exact allowlist riêng 1A và kế hoạch 1B nằm trong SPRINT_1.md và blueprint.yaml. 1A data/Auth/security only; 1B product surfaces sau authorization riêng, không đổi DB 1A âm thầm.

## Auth Policy và checkpoint entry
G2 CLOSED: Email + Password cho ADMIN/CEO/MANAGER/STAFF/USER; recovery qua email. Không phone/SMS/social/Telegram/passkey/MFA, không chuẩn bị provider schema. G1 vẫn PENDING authorization 1A. 1A không Customer/Control Center business UI hoặc Refine; local mail/Auth API tests không cần UI. PASS+freeze xong DỪNG. 1B Customer/Control Center/Refine/Playwright chỉ sau owner authorization riêng.

Version phải xuất hiện trong projection riêng được dùng cho edit/preview: self profile.version; venue.version cho Admin edit; membership.version và target profile.version khi HR đổi status/cutoff. Version không là permission grant và không expose session cutoff. Public venue projection không cần version nếu không có edit action.
