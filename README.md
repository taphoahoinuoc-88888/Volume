# VOLUME V2 — Sprint 0

Trạng thái: **Sprint 0 đã được owner chấp thuận. Checkpoint 1A AUTHORIZED / BLOCKED_AUTH_COMPATIBILITY; 1B chưa được phép bắt đầu.**

Project mới hoàn toàn. F6.1 chỉ là LEGACY / REFERENCE; không sửa, không import runtime, không chuyển dữ liệu/credentials tự động.

## Đọc theo thứ tự
1. `docs/blueprint.yaml`: contract kỹ thuật canonical của V2.
2. `docs/architecture.md`: cách tổ chức core và ranh giới bảo mật.
3. `docs/permissions.md`: vocabulary quyền, scope và dữ liệu được phép xem.
4. `docs/decisions/`: các quyết định và lý do.
5. `docs/sprints/SPRINT_0.md`: phạm vi, kiểm tra và freeze tài liệu.
6. `docs/sprints/SPRINT_1.md`: allowlist riêng 1A/1B, schema bigint version, acceptance và test.
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
G2 đã chốt Email + Password mọi role và email recovery, không provider khác hoặc prep schema ở Sprint1. G1 đã đóng: owner authorize Checkpoint 1A ngày 2026-10-06. 1A đang BLOCKED, chưa hoàn thành/freeze. 1A PASS+freeze phải DỪNG; 1B cần authorization riêng. G1–G14 có definition/status trong `docs/OPEN_QUESTIONS.md`. Không tự chạy checkpoint/Sprint tiếp theo. Payment/open-table chưa có business rule; phải chốt trước Sprint 2.

## Final correction đã ghi nhận
updated_at chỉ thời gian. Mutable profiles/venues/staff_memberships có version bigint + expected_version. ADR-004 ghi Auth policy, version và checkpoint split. ZIP final chứa toàn repository volume-v2 gồm 16 tài liệu tracked và lịch sử Git docs-only; không runtime/app/dependency/legacy.

## Trạng thái thực thi 1A — 2026-10-06
Đã đọc contract/allowlist và chạy runtime preflight. Supabase CLI 2.119.0 chạy được, nhưng local stack chưa khởi động: Docker/Podman không có; native CLI gặp DNS timeout tải artifact, và sandbox chỉ map UID0 nên không chuyển sang tài khoản PostgreSQL non-root được. Chưa tạo migration/core/tests/dependency project trước khi có môi trường kiểm chứng session lifecycle thật. Xem `docs/sprints/SPRINT_1A_RESULTS.md`. Đây là blocker môi trường, không kết luận auth.sessions không hỗ trợ contract. Không freeze 1A hoặc chuyển 1B. Authorization 1A giữ nguyên; không cần authorize lại để tiếp tục trong môi trường phù hợp.

Blueprint/AGENTS/ADR và FREEZE_MANIFEST của Sprint0 giữ nguyên snapshot lịch sử vì ngoài allowlist sửa 1A. Authorization hiện tại ở owner instruction và G1 OPEN_QUESTIONS; không lấy flag authorization cũ trong snapshot để phủ định quyết định owner. FREEZE_MANIFEST chỉ mô tả snapshot Sprint0, không là manifest của working tree 1A.

## Execution update — GitHub Actions
Owner authorized real Supabase on ubuntu-latest CI. Branch checkpoint-1a from375379a; runtime/session preflight PASS at2a1c8a2, run37439354568. Core/matrix implementation under test; not complete/frozen. Original sandbox blocker is superseded by CI execution; previous notes retain historical evidence. No contract/allowlist change, no main merge, no1B. See SPRINT_1A_RESULTS.md.

## STOP — actual CI compatibility findings
Latest tested implementation240e159; workflow37442226921: startup/reset PASS, DB security suite FAIL (Auth schema USAGE missing for private definer owner; auth.sessions RLS enabled), API/security suite NOT RUN. Provider revoke-by-user-id also needs owner contract decision. See docs/sprints/SPRINT_1A_RESULTS.md (from repository root). No privilege escalation workaround applied.1A not complete/frozen; main unmerged;1B not authorized.
