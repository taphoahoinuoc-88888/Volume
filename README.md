# VOLUME V2

Trạng thái: **Sprint 0 đã được owner chấp thuận. Checkpoint 1A AUTHORIZED / CLOSED / FROZEN; 1B chưa được phép bắt đầu.**

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
G2 đã chốt Email + Password mọi role và email recovery, không provider khác hoặc prep schema ở Sprint1. G1 đã đóng: owner authorize Checkpoint 1A ngày 2026-10-06. 1A PASS/frozen; evidence ở docs/sprints/SPRINT_1A_RESULTS.md. 1A PASS+freeze phải DỪNG; 1B cần authorization riêng. G1–G14 có definition/status trong `docs/OPEN_QUESTIONS.md`. Không tự chạy checkpoint/Sprint tiếp theo. Payment/open-table chưa có business rule; phải chốt trước Sprint 2.

## Historical Sprint0 deliverable
updated_at chỉ thời gian. Mutable profiles/venues/staff_memberships có version bigint + expected_version. ADR-004 ghi Auth policy, version và checkpoint split. ZIP final chứa toàn repository volume-v2 gồm 16 tài liệu tracked và lịch sử Git docs-only; không runtime/app/dependency/legacy.

## Trạng thái thực thi 1A — 2026-10-06
Đã đọc contract/allowlist và chạy runtime preflight. Supabase CLI 2.119.0 chạy được, nhưng local stack chưa khởi động: Docker/Podman không có; native CLI gặp DNS timeout tải artifact, và sandbox chỉ map UID0 nên không chuyển sang tài khoản PostgreSQL non-root được. Chưa tạo migration/core/tests/dependency project trước khi có môi trường kiểm chứng session lifecycle thật. Xem `docs/sprints/SPRINT_1A_RESULTS.md`. Đây là blocker môi trường, không kết luận auth.sessions không hỗ trợ contract. Không freeze 1A hoặc chuyển 1B. Authorization 1A giữ nguyên; không cần authorize lại để tiếp tục trong môi trường phù hợp.

Blueprint/AGENTS/ADR và FREEZE_MANIFEST của Sprint0 giữ nguyên snapshot lịch sử vì ngoài allowlist sửa 1A. Authorization hiện tại ở owner instruction và G1 OPEN_QUESTIONS; không lấy flag authorization cũ trong snapshot để phủ định quyết định owner. FREEZE_MANIFEST chỉ mô tả snapshot Sprint0, không là manifest của working tree 1A.

## Checkpoint 1A — PASS / frozen / STOP
Real complete GitHub Actions https://github.com/HAD10202/Volume/actions/runs/37445694355 PASS at2db65c8d0e5a0c4155b1357a25ef991d8dd1d603:57 database assertions and22 real API/security/concurrency/recovery tests. Final report commit repeats full CI. See docs/sprints/SPRINT_1A_RESULTS.md for evidence, versions, exact file delta, narrow reader privilege bootstrap and owner-accepted provider limitation.
volume_core has no Auth grants; private boolean validator has a dedicated NOLOGIN three-column reader. Old provider sessions/refresh cannot bypass database cutoff; provider revoke-all-by-other-user-id is not implemented or required by owner decision.
Branch checkpoint-1a; draft PR1 unmerged; main unchanged. No production deployment.1B NOT AUTHORIZED; STOP. Production signup/email/SMTP settings and future payment/business gates remain undecided. Frozen Sprint0 documents outside the1A allowlist are historical snapshots; current owner authorization prevails.

## Owner closure — 2026-10-06
**Checkpoint 1A CLOSED / FROZEN.** Owner authorized final review and merge; PR #1 merged into main. Merge/main implementation commit: `7cc481f5f2c58d2d5b04108b14fefd2720920939`.
Final review:28 changed files, all within exact1A allowlist; no Legacy edits/secrets/1B. Compared with approved88ad708: implementation/tests unchanged; only existing allowlisted CI file adds main to push trigger. Pre-merge full run https://github.com/HAD10202/Volume/actions/runs/37449532177 SUCCESS.
Post-merge main full run https://github.com/HAD10202/Volume/actions/runs/37449817588 **SUCCESS** on merge commit. Required core covers real startup/reset,57 database assertions,22 API/security/concurrency/recovery tests, scope/secret checks and dependency audit. Main tree equals the pre-merge tested PR head5248f5e; no merge-introduced code change. Legacy235-file byte comparison:zero differences.
This closure-record commit changes only four allowlisted status/result documents and runs the same full CI on main. The final closure-record SHA and its CI run are recorded in PR #1 after SUCCESS; a failure reopens closure and must be reported. Earlier unmerged/pending-review/preflight statements are historical, superseded by this owner closure.
No new business implementation, deployment, migration changes or Checkpoint1B. **STOP;1B still NOT AUTHORIZED.**

## Checkpoint1B — owner authorized / in progress
Read maintenance1A CLOSED/FROZEN at68541f8a71a0ae10ac22d819a79f78982cf37abb, PR2 and full main CI37453711509 SUCCESS(78 DB/27 integration). Branch checkpoint-1b now derives from this base; old unauthorized/blocker notes above are historical. No1B merge/main deployment authorized or performed.
Customer Web: email/password login, email recovery and own name/profile. Control Center: role-aware overview, venue, people/access and audit; no future menu. Explicit confirmation diff/reason/CAS for management. Account disabling and membership inactivation have different labels/effects. Refine uses live Auth/data/access providers; database/RPC is authority.
Local authorized test environment only: npm ci; provide .env.example public values to apps/customer/.env and apps/control-center/.env; npm run dev -w @volume/customer (127.0.0.1:3000), npm run dev -w @volume/control-center (127.0.0.1:3001). Use existing authorized accounts; no credentials committed. Email recovery redirect uses approved local customer/recovery URL. Frozen Supabase local/bootstrap setup is the same as1A; CI sets up and checks everything automatically. No production signup/SMTP decision implied.
Verification: npm run typecheck; npm run lint; npm run build; npm run test:unit; npm run test:integration; npm run test:e2e. UI/backend certification uses real CI; NOT RUN is not PASS. Browser screenshots/reports are generated CI artifacts; no JWT network traces retained.
See docs/sprints/SPRINT_1B_RESULTS.md. STOP after1B tests/freeze; no Sprint2.
