# VOLUME V2

Checkpoint 1A + read maintenance **CLOSED / FROZEN** trên main `68541f8a71a0ae10ac22d819a79f78982cf37abb`. Checkpoint 1B implementation **PASS** (full run37459331909), freeze có hiệu lực sau final checkpoint CI SUCCESS trên branch `checkpoint-1b`; chưa merge hoặc triển khai production. Sprint 2 chưa được phép bắt đầu.

Project mới; F6.1 chỉ LEGACY / REFERENCE. Không sửa hoặc import runtime legacy. Một Supabase Auth identity, `profiles.id = auth.users.id`; một role tại profiles; memberships giữ phạm vi chi nhánh và fixed extra permissions. PostgreSQL/RLS/RPC là authority. UI chỉ phản ánh quyền hiện tại.

## Contract và bàn giao

Đọc chỉ dẫn owner hiện tại, `AGENTS.md`, `docs/blueprint.yaml`, `docs/permissions.md`, `docs/architecture.md`, ADR và `docs/sprints/SPRINT_1.md`. Exact allowlist theo checkpoint; không tự mở rộng. Báo deviation trước khi thay contract freeze. Không tự chuyển checkpoint/Sprint.

- `docs/sprints/SPRINT_1A_RESULTS.md`: full core + minimum read maintenance evidence.
- `docs/sprints/SPRINT_1B_RESULTS.md`: product scope, versions, file delta và CI.
- `docs/OPEN_QUESTIONS.md`: G1–G14 và production/business decisions còn mở.
- `docs/LEGACY_REFERENCE.md`: baseline reference, không là business rule mặc định.

## Product surfaces 1B

Customer Web: Email + Password, đăng xuất, khôi phục email, tên hiển thị và đăng xuất các phiên của mình. Control Center dùng Refine: tổng quan phạm vi, chi nhánh, nhân sự/truy cập, nhật ký theo quyền. USER không vào nội bộ; STAFF chỉ thấy việc/phạm vi được phép. Không tạo màn hình nghiệp vụ chưa tồn tại.

Thay đổi nhạy cảm: xem trước → diff → lý do → xác nhận, gửi bigint expected_version cho RPC. Account DISABLED khác membership INACTIVE. Không generic permission builder, Auth contact/session data hoặc service-role trong client. Không public signup UI/production SMTP trước quyết định owner.

## Chạy và kiểm thử local

Node 22, `npm ci`. Local Supabase dùng CLI 2.119.0; setup/reset và narrow session-reader bootstrap theo workflow/core result đã freeze. Docker cần trên máy chạy backend; GitHub Actions ubuntu-latest là môi trường integration được sử dụng.

Điền **public** URL/anon key theo `.env.example` vào `apps/customer/.env` và `apps/control-center/.env`; không thêm secret/service-role. Customer chạy `npm run dev -w @volume/customer` tại 127.0.0.1:3000, Control Center `npm run dev -w @volume/control-center` tại 127.0.0.1:3001. Dùng tài khoản local/test đã provision; không commit credentials. Recovery local redirect là customer `/recovery` đã được Auth allowlist.

Lệnh: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`; database: `supabase test db`. Browser cần `npx playwright install --with-deps chromium webkit`.

CI 1B chạy full frozen 1A regression và browser/backend thực, không mock. Screenshots/report là Actions artifacts; network traces và video tắt để tránh giữ token. Linux WebKit không chứng nhận physical Safari/iPhone/macOS. NOT RUN/BLOCKED không PASS.

Supabase migrations/RLS/RPC/Auth config/core tests không sửa trong 1B. Player/Table/Payment/Shop/Telegram/CRM/AI và các module Sprint 2+ không có implementation. Payment/open-table vẫn cần chốt G3–G7 trước Sprint 2. Khi đủ required tests mới freeze, rồi DỪNG chờ owner.
