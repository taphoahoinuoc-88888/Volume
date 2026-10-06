# Quy tắc AI agent — VOLUME V2

## Trạng thái hiện tại
Sprint 0 DOCUMENT-ONLY. DỪNG sau bàn giao. Chưa có authorization Checkpoint 1A hoặc 1B. Không tạo ứng dụng, migration, dependency, Auth implementation hoặc triển khai Supabase trong Sprint 0.

## Thứ tự nguồn quy tắc
1. Chỉ dẫn hiện tại và quyết định được chủ dự án duyệt.
2. `docs/blueprint.yaml` đã được duyệt — canonical technical contract.
3. `docs/permissions.md`, `docs/architecture.md` và ADR tương ứng.
4. Contract Sprint được duyệt.
5. F6.1 chỉ reference; không phải kiến trúc hay luật nghiệp vụ mặc định.

Nếu tài liệu xung đột: báo vị trí, tác động và đề xuất; không tự sửa Blueprint âm thầm. Không làm thay đổi nằm ngoài authorization.

## Trước mỗi Sprint
- Đọc toàn bộ contract Sprint, Blueprint, permission và ADR liên quan.
- Kiểm tra baseline/workspace, không reset hay ghi đè thay đổi mới.
- Khóa exact file allowlist theo checkpoint; folder chưa có tên file được duyệt không cho phép tạo tùy ý.
- Xác nhận gate đã được giải quyết. Không thay thiếu business rule bằng giả định.
- One checkpoint at a time: một checkpoint/module/vertical slice tại một thời điểm; không tạo module tương lai để lấp màn hình.

## Ranh giới bắt buộc
- Không sửa source/config/data/credentials legacy; không import code runtime legacy.
- Không multi-role; role chỉ ở profiles. Player/HR không là role.
- Không database theo client, generic RBAC/approval engine, microservice, Redis, event bus hay API server riêng ở giai đoạn đầu.
- Không AI trong business core; không runtime demo/real forks.
- No dependency added without justification: dependency cần lý do, kiểm tra khả năng dùng thư viện hiện có và đúng scope checkpoint được authorize; không cài Refine/UI ở 1A. Kiểm tra thư viện ổn định trước khi tự xây chức năng tương đương; nếu không phù hợp ghi lý do.
- Không service-role/secret trong client. UI authorization không thay database enforcement.
- Không client ghi audit, role, extra_permissions hay payment confirmation trực tiếp.
- Không đổi migration đã freeze; Sprint sau dùng migration mới khi được duyệt.
- Không thực hiện action qua communications hoặc publish/deploy nếu chưa được task cho phép.

## Kiểm thử và bàn giao
Theo checkpoint: 1A Database/RLS allow+deny và API/security với token thực; 1B thêm Playwright desktop+mobile và chạy lại regression 1A. Sprint0 chỉ document validation. Không dùng service-role để chứng minh RLS. Mock/DOM không được gọi là browser E2E thật. NOT RUN/BLOCKED không là PASS.

Chỉ mở rộng allowlist khi có lý do cụ thể, danh sách file, tác động module freeze và cập nhật scope được duyệt. Nếu phát hiện lỗi module freeze: báo và mở maintenance scope; không vá âm thầm trong feature Sprint.

Bàn giao: scope, file tạo/sửa, test đã chạy+kết quả, giới hạn, câu hỏi, checkpoint. Tests before freeze. Freeze xong DỪNG; never continue automatically to next checkpoint/sprint. 1A PASS không authorize 1B. Tiến độ đo bằng luồng đúng, đơn giản, test được và UX; không đo số dòng code.

## Dữ liệu và bảo mật
Fixture riêng local/test; không lấy credentials/dữ liệu production làm seed. Không log access/refresh token, secret, mật khẩu hoặc toàn bộ payload nhạy cảm. Audit chỉ giữ field allowlist. Không xóa audit để sửa lỗi; thêm sự kiện sửa chữa có actor/reason.

## Sprint 1 theo hai checkpoint
1A: Data/Auth/Security Core only. Không Customer UI/Control Center business UI; tests DB/API/security thực PASS trước freeze. 1B: product surfaces và Playwright sau owner authorize riêng. Không thay database contract 1A nếu chưa report architectural deviation và nhận approval. Không future schema/module hoặc fake menu.

## Version contract
updated_at chỉ thời gian; mutable entity dùng version bigint + expected_version. Agent không đổi lại timestamp equality. RPC stale-write tests gồm identical timestamps/different versions, race, rollback và multi-row atomicity.
