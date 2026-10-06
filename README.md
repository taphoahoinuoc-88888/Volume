# VOLUME V2 — Sprint 0

Trạng thái: **Sprint 0 hoàn tất tài liệu; chờ chủ dự án duyệt. Sprint 1 chưa được phép bắt đầu.**

Project mới hoàn toàn. F6.1 chỉ là LEGACY / REFERENCE; không sửa, không import runtime, không chuyển dữ liệu/credentials tự động.

## Đọc theo thứ tự
1. `docs/blueprint.yaml`: contract kỹ thuật canonical của V2.
2. `docs/architecture.md`: cách tổ chức core và ranh giới bảo mật.
3. `docs/permissions.md`: vocabulary quyền, scope và dữ liệu được phép xem.
4. `docs/decisions/`: các quyết định và lý do.
5. `docs/sprints/SPRINT_0.md`: phạm vi, kiểm tra và freeze tài liệu.
6. `docs/sprints/SPRINT_1.md`: allowlist, schema dự kiến, acceptance và test.
7. `docs/OPEN_QUESTIONS.md`: các mục chưa được chốt và gate tương ứng.
8. `docs/LEGACY_REFERENCE.md`: nguồn tham khảo, baseline và giới hạn bằng chứng.
9. `AGENTS.md`: quy tắc bắt buộc cho AI tiếp quản.

## Hệ thống dự kiến
Customer Web và một Control Center dùng chung PostgreSQL/Supabase. Supabase Auth quản lý đăng nhập; `profiles` là identity nghiệp vụ. Một role/profile; `staff_memberships` giữ scope chi nhánh và permission bổ sung giới hạn. Player Profile sau này dùng cùng `profile_id`.

Stack: React/TypeScript, Refine + shadcn/ui cho Control Center, Supabase Auth/PostgreSQL/RLS, Playwright. Đọc qua grants/RLS; thao tác quản trị/nghiệp vụ quan trọng qua RPC/transaction. Edge Functions chỉ cho tích hợp cần secret/Auth Admin API.

**Hiện chưa có ứng dụng, migration, dependency, Supabase deployment hoặc chức năng Auth.** Không có lệnh chạy app/test runtime ở Sprint 0. Kiểm tra tài liệu không đồng nghĩa test hệ thống PASS.

## Quyền thay đổi contract
20 quyết định chủ dự án duyệt ngày 2026-10-06 là căn cứ. Chi tiết kỹ thuật được cụ thể hóa trong bộ Sprint 0 này để duyệt; không diễn giải rằng mọi chi tiết mới đã được chủ dự án phê chuẩn riêng. Sau duyệt, đổi role/entity/state/quyền ngoài contract phải báo lý do và cập nhật quyết định trước khi code.

## Gate tiếp theo
Chỉ bắt đầu Sprint 1 khi chủ dự án duyệt bộ tài liệu này và giải quyết gate G1/G2 ở `docs/OPEN_QUESTIONS.md`. Không tự chạy Sprint tiếp theo. Payment/open-table chưa có business rule; phải chốt trước Sprint 2.
