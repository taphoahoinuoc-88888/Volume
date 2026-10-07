# VOLUME V2

Sprint1 **CLOSED / FROZEN** tại main `2b47f0a619f494a811c94e41697f7d09dcb19e3a` (78 DB/27 API/3 unit/54 browser tests). Sprint2 implementation đang trên `checkpoint-2`, theo contract frozen `fd3400aa93f2c365d422b2a50b2a66ee039621dd`, exact allowlist45 paths. Sprint2 chưa PASS/freeze; kết quả và CI được ghi trong `docs/sprints/SPRINT_2_RESULTS.md`. Không production deployment, real provider hoặc Sprint3.

Project mới; F6.1 chỉ LEGACY / REFERENCE. Không sửa hoặc import runtime legacy. Một Supabase Auth identity, `profiles.id = auth.users.id`; một role tại profiles; memberships giữ phạm vi chi nhánh và fixed extra permissions. PostgreSQL/RLS/RPC là authority. UI chỉ phản ánh quyền hiện tại.

## Contract và bàn giao

Đọc chỉ dẫn owner hiện tại, `AGENTS.md`, `docs/blueprint.yaml`, `docs/permissions.md`, `docs/architecture.md`, ADR và `docs/sprints/SPRINT_1.md`. Exact allowlist theo checkpoint; không tự mở rộng. Báo deviation trước khi thay contract freeze. Không tự chuyển checkpoint/Sprint.

- `docs/sprints/SPRINT_1A_RESULTS.md`: full core + minimum read maintenance evidence.
- `docs/sprints/SPRINT_1B_RESULTS.md`: product scope, versions, file delta và CI.
- `docs/OPEN_QUESTIONS.md`: G1–G14 và production/business decisions còn mở.
- `docs/LEGACY_REFERENCE.md`: baseline reference, không là business rule mặc định.
- `docs/sprints/SPRINT_2_BUSINESS_CONTRACT.md`:36 invariants/90 cases đã freeze.
- `docs/sprints/SPRINT_2_IMPLEMENTATION_PLAN.md`:schema/RPC/security/UI/test mapping và exact45 paths.
- `docs/sprints/SPRINT_2_RESULTS.md`:candidate evidence, failures và giới hạn.

## Product surfaces 1B

Customer Web: Email + Password, đăng xuất, khôi phục email, tên hiển thị và đăng xuất các phiên của mình. Control Center dùng Refine: tổng quan phạm vi, chi nhánh, nhân sự/truy cập, nhật ký theo quyền. USER không vào nội bộ; STAFF chỉ thấy việc/phạm vi được phép. Không tạo màn hình nghiệp vụ chưa tồn tại.

Thay đổi nhạy cảm: xem trước → diff → lý do → xác nhận, gửi bigint expected_version cho RPC. Account DISABLED khác membership INACTIVE. Không generic permission builder, Auth contact/session data hoặc service-role trong client. Không public signup UI/production SMTP trước quyết định owner.

## Chạy và kiểm thử local

Node 22, `npm ci`. Local Supabase dùng CLI 2.119.0; setup/reset và narrow session-reader bootstrap theo workflow/core result đã freeze. Docker cần trên máy chạy backend; GitHub Actions ubuntu-latest là môi trường integration được sử dụng.

Điền **public** URL/anon key theo `.env.example` vào `apps/customer/.env` và `apps/control-center/.env`; không thêm secret/service-role. Customer chạy `npm run dev -w @volume/customer` tại 127.0.0.1:3000, Control Center `npm run dev -w @volume/control-center` tại 127.0.0.1:3001. Dùng tài khoản local/test đã provision; không commit credentials. Recovery local redirect là customer `/recovery` đã được Auth allowlist.

Lệnh: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`; database: `supabase test db`. Browser cần `npx playwright install --with-deps chromium webkit`.

CI 1B chạy full frozen 1A regression và browser/backend thực, không mock. Screenshots/report là Actions artifacts; network traces và video tắt để tránh giữ token. Linux WebKit không chứng nhận physical Safari/iPhone/macOS. NOT RUN/BLOCKED không PASS.

Sprint2 mở bàn: Customer `/tables` và `/table-session`; Control Center `/tables` và `/opening-payments`. Price60 phút/VND, hold300s, một hold/table/customer, partial/expiry/resolution, automatic threshold opening và scoped MANUAL override. Walk-in không có fake profile. Trạng thái bàn suy ra từ sessions; countdown0 không tự close/bill. Public contact do ADMIN cấu hình theo venue, không contact nhân viên riêng.

Provider chưa được chọn: adapter mặc định **không tạo QR ngân hàng hoặc tiền giả**. Khi chưa cấu hình, yêu cầu tạo QR thất bại an toàn và trả bàn. Backend payment/activation tests dùng normalized trusted server fixtures trên Supabase thật; không phải actual-provider evidence. Local orchestration dùng `supabase functions serve open-table-payment`; JWT verification giữ TRUE. Không dùng `--no-verify-jwt`. Server DB credential chỉ trong Edge Runtime; không đưa vào app env/client.

Hai migration mới additive; frozen Auth/RLS/security RPC và các migration Sprint1 giữ nguyên. CI Sprint2 kiểm tra toàn bộ frozen regression cùng test mới, không mock Supabase. Player/Match/Shop/Video/Telegram/CRM/AI, refund/overtime/final billing/Sprint3 không có implementation. Khi đủ required checks mới ghi PASS để owner review; không merge/deploy/tự chuyển Sprint.
