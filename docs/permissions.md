# Permission contract V1

Canonical source: `blueprint.yaml`. Quyền dưới đây áp dụng Sprint 1, không suy ra action các module chưa tồn tại.

Scope: G=global; V=active venue membership; S=self; P=public; O=own membership only; -=deny; E=extra HR whitelist; E không là mặc định.

| Permission | ADMIN | CEO | MANAGER | STAFF | USER |
|---|---|---|---|---|---|
| OWN_PROFILE_READ | S | S | S | S | S |
| OWN_PROFILE_UPDATE | S | S | S | S | S |
| PUBLIC_VENUES_READ | P | P | P | P | P |
| INTERNAL_VENUES_READ | G | G | V | V | - |
| MEMBERSHIPS_READ | G | G | V | O | - |
| STAFF_DIRECTORY_READ | G | G | V | E (V) | - |
| BUSINESS_AUDIT_READ | G | G | V | - | - |
| SECURITY_AUDIT_READ | G | - | - | - | - |
| VENUES_MANAGE | G | - | - | - | - |
| ACCESS_MANAGE | G | - | - | - | - |
| ACCOUNT_STATUS_MANAGE | G | - | - | - | - |
| AUTH_ACCOUNTS_PROVISION | G | - | - | - | - |
| OWN_SESSIONS_REVOKE | S | S | S | S | S |
| STAFF_MEMBERSHIP_STATUS_MANAGE | - | - | E (V) | E (V) | - |

ADMIN không union mọi permission string: STAFF_MEMBERSHIP_STATUS_MANAGE là HR extra cho MANAGER/STAFF; Admin quản lý status/scope qua ACCESS_MANAGE. CEO không write default ngoài own profile/session. MANAGER không HR status write mặc định.

## Fixed vocabulary

| Permission | Scope | Ý nghĩa |
|---|---|---|
| OWN_PROFILE_READ | self | Read own profile; sensitive field projection excluded |
| OWN_PROFILE_UPDATE | self | Update own display_name only through RPC + expected_version |
| PUBLIC_VENUES_READ | public | Published enabled venue safe projection |
| INTERNAL_VENUES_READ | global_or_venue | Internal venue fields in authorized scope |
| MEMBERSHIPS_READ | global_or_venue_or_self | Admin full; CEO/Manager roster; Staff own only |
| STAFF_DIRECTORY_READ | global_or_venue | Safe staff projection only; no Auth/session fields |
| BUSINESS_AUDIT_READ | global_or_venue | Redacted BUSINESS audit only |
| SECURITY_AUDIT_READ | global | SECURITY audit Admin only |
| VENUES_MANAGE | global | Create/update/disable venue; no hard delete |
| ACCESS_MANAGE | global | Manage another profile role, membership scope, extra permission |
| ACCOUNT_STATUS_MANAGE | global | Disable/reactivate another account |
| AUTH_ACCOUNTS_PROVISION | global | Server Auth provisioning; default USER |
| OWN_SESSIONS_REVOKE | self | Revoke own sessions, audit and DB cutoff |
| STAFF_MEMBERSHIP_STATUS_MANAGE | venue | HR extra: toggle other STAFF membership only; no grants/scope/role change |

## Authorization order
1. Xác minh Auth JWT và session theo revocation contract.
2. Account ACTIVE; lấy role hiện tại từ profiles.
3. Xác định action nằm vocabulary cố định.
4. Global Admin/CEO hoặc membership ACTIVE đúng venue; USER chỉ self/public.
5. Role default hoặc extra whitelist còn hiệu lực; kiểm tra target/column/business invariant.
6. Read projection/redaction; write lock+recheck+audit transaction.

## Target/field rules
- Self profile read không trả session cutoff; self update chỉ display_name qua RPC có expected_version.
- Own membership read trả id/profile_id/venue_id/status/extra_permissions của chính mình; không danh sách đồng nghiệp.
- Manager/CEO staff directory/membership projection chỉ id, display_name, role, venue_id, membership id/status; không extra của người khác hoặc auth contact.
- Admin đọc internal profile/access fields qua authorized RPC, không client Auth schema.
- Staff INTERNAL_VENUES_READ chỉ id/code/name/timezone/is_enabled của venue được phân công; không configuration/finance/customer fields.
- Extra STAFF_DIRECTORY_READ: safe roster cùng venue; không profile full SELECT.
- Extra STAFF_MEMBERSHIP_STATUS_MANAGE: status ACTIVE/INACTIVE của STAFF khác cùng venue; không tự đổi, không target MANAGER/CEO/ADMIN, không đổi role/scope/extra.
- Unknown extra bị từ chối tại write và không bao giờ grant khi read; không privilege inference từ label/menu.
- Tồn tại membership cũ không cấp quyền nội bộ cho USER/CEO/ADMIN; profile role authoritative.
- Security audit Admin-only; business audit scoped. Manager roster read không kéo audit role/security toàn hệ thống theo.

## Public/private/internal
Public chỉ venue is_public=true và is_enabled=true, các cột public đã liệt kê. Không public profile/customer list/membership/audit. User đọc profile mình, membership mình nếu hợp lệ, thông tin public; không scan internal venues. Tài khoản DISABLED không truy cập private/internal, kể cả self, nhưng public vẫn public.

## No direct privilege writes
Role/scope/account/membership/extra/audit không có direct client INSERT/UPDATE/DELETE. RPC rechecks database authority, bigint expected_version, reason và target; updated_at chỉ timestamp. All mutable updates, gồm own display_name, dùng authorized RPC; client không ghi version. Frontend navigation dùng cùng vocabulary, nhưng thay request hoặc bỏ qua UI vẫn bị backend chặn.

## Optimistic concurrency
profiles/venues/staff_memberships có version bigint NOT NULL DEFAULT 1. update_own_profile và các RPC mutable khác yêu cầu expected_version; stale/missing version DENY, transaction rollback không tăng version/audit. Audit append-only không version. Direct write mutable tables không granted cho client; self name edit là dedicated RPC, không generic command engine. Multi-row action kiểm tra version từng row; cutoff tại profile cũng là mutation cần tăng profile.version.

Authorized edit projection trả version cần thiết: self profile.version; Admin venue.version; membership.version và target profile.version cho HR status preview có quyền. Read-only public không cần concurrency field. Before/after audit của mutable entity gồm version để truy vết mutation.
