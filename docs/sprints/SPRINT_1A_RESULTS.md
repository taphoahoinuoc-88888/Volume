# Checkpoint 1A — RESULTS / BLOCKED_RUNTIME_PREFLIGHT

Ngày: 2026-10-06. Owner đã AUTHORIZE 1A và chấp thuận Sprint0. **1A CHƯA HOÀN THÀNH, CHƯA FREEZE. Không triển khai 1B.**

## Kết luận
Runtime preflight không cung cấp được PostgreSQL + Supabase Auth + Data API thật. Vì session contract cần integration spike trước triển khai rộng, dừng ở prerequisite để không bàn giao core chưa kiểm chứng. Chưa kết luận auth.sessions lifecycle/version không hỗ trợ contract; chưa chạy được provider để đánh giá. Không thay contract bằng logout frontend, mock Auth hay Postgres substitute.

## Files tạo/sửa (tất cả thuộc exact allowlist)
- README.md — authorization + status preflight.
- docs/OPEN_QUESTIONS.md — G1 CLOSED_OWNER_AUTHORIZED_1A + môi trường blocker; G2–G14 giữ quyết định.
- docs/sprints/SPRINT_1.md — execution status; scope/allowlist/matrix giữ nguyên.
- docs/sprints/SPRINT_1A_RESULTS.md — file mới này.
Không sửa Blueprint/architecture/permission/AGENTS/ADR/Sprint0 manifest hay legacy. Snapshot authorization cũ chỉ lịch sử; owner instruction hiện tại ưu tiên. Không bổ sung file implementation ngoài allowlist.

## Dependencies và phiên bản
Không thêm dependency trong project, không package.json/package-lock.json/node_modules project. Runtime preflight dùng pinned npm cache command `npx --yes --package=supabase@2.119.0 supabase --version`; kết quả **2.119.0**, exit0. CLI candidate cần để kiểm tra runtime, chưa pin thành dependency project vì stack compatibility chưa chứng minh.
Node v24.19.0; npm 11.9.0; Linux x86_64/glibc2.39. Supabase local/Auth/PostgreSQL RUNNING VERSION: **NOT AVAILABLE**. Artifact CLI cố tải postgres-17.11.0.002-r0; không gọi đó là bản database đã chạy/test.

## Runtime preflight đã chạy
| Probe | Kết quả |
|---|---|
| Git baseline | d476c30, working tree sạch trước lượt này |
| Supabase CLI pinned version/help | PASS tooling probe; version2.119.0 hỗ trợ experimental native stack |
| docker/podman executable + daemon sockets | Không có; Docker path BLOCKED |
| Linux architecture/glibc | Phù hợp platform native theo docs; chưa bảo đảm quyền chạy |
| runuser -u oai -- id / nobody | Exit1: cannot set groups: Operation not permitted |
| /proc/self/uid_map | Chỉ `0 0 1`; không UID non-root mapped |
| os.setuid(1001) trong process thử riêng | OSError Errno22 Invalid argument; không switch được non-root |
| Native CLI start với SUPABASE_NATIVE_POSTGRES_USER=oai | Exit1 ExperimentalStackStartError: artifact download DNS getaddrinfo ETIMEOUT |
| Native thử dùng NODE_USE_ENV_PROXY=1 | Cùng lỗi download, exit1; không sửa network policy |
| curl official S3 artifact manifest qua network sẵn có | HTTP200; khác transport CLI, không đủ chứng minh CLI download/stack PASS |

Command native được chạy ở directory preflight tạm ngoài repository (không tạo project source/config placeholder):
`SUPABASE_EXPERIMENTAL_STACK=1 SUPABASE_NATIVE_POSTGRES_USER=oai npx --yes --package=supabase@2.119.0 supabase start --runtime native --preparation on-demand`

Hai endpoint CLI báo lỗi DNS: github.com release manifest và supabase-cli-artifacts.s3.us-east-1.amazonaws.com mirror manifest. Không bypass restrictions hoặc dùng credential production. CLI cache/logs chỉ transient diagnostics, không source/deliverable. Root-only UID là blocker native độc lập cần xử lý ngay cả khi download được.

## Migration / RPC / helpers / seed
Migration: NOT IMPLEMENTED / NOT RUN. RPC/helper: NOT IMPLEMENTED / NOT RUN. RLS/grants/constraints/audit/bootstrap/seed: NOT IMPLEMENTED / NOT RUN. Không đặt SQL giả hoặc mô phỏng Auth nhằm đánh dấu hoàn thành. Admin provisioning server path chưa tạo vì chưa có local Auth để test.

## Required acceptance status
| Acceptance | Status / evidence |
|---|---|
| A1A01 clean reset/migration + four entities | BLOCKED / NOT RUN; chưa DB |
| A1A02 permissions/grants/RLS/projections | BLOCKED / NOT RUN |
| A1A03 Manager/Staff cross-venue + USER isolation | BLOCKED / NOT RUN |
| A1A04 privilege escalation/unknown permissions | BLOCKED / NOT RUN |
| A1A05 session cutoff/old refresh/new session/provider failure | BLOCKED / NOT RUN; chưa kiểm chứng auth.sessions lifecycle |
| A1A06 bigint CAS/stale/no-op/concurrent/multi-row rollback | BLOCKED / NOT RUN |
| A1A07 last-active-Admin concurrency | BLOCKED / NOT RUN |
| A1A08 audit append-only/redaction/atomicity/failure rollback | BLOCKED / NOT RUN |
| A1A09 bootstrap USER/ACTIVE/version1 + email/password/recovery | BLOCKED / NOT RUN |
| A1A10 service-role absence / no UI / scope scan | Static repo checks PASS only; không là runtime security PASS |

DB01–DB36: **BLOCKED / NOT RUN**, không database test runner. API01–API13: **BLOCKED / NOT RUN**, không Auth/Data API endpoint. Không chọn subset PASS để thay toàn matrix. Không dùng service-role/token giả chứng minh RLS.

## Security findings / limits / deviations
- Không runtime security finding đã chứng minh; không đủ môi trường kiểm tra.
- Không architectural deviation đã áp dụng; đây là blocker runtime/environment.
- Không dùng metadata role, schema riêng provider hay giải pháp session yếu hơn.
- Chưa migration/reset, chưa cài dependency business/UI, chưa local config/core; không thể claim exactly-four runtime entities.
- No secret được thêm source; không gọi production credential/service.
- Bốn file changes phải kiểm tra allowlist, frozen file hashes và legacy bytes trước commit.
- Không global install/upgrade Docker, không tác động máy Mac/PC/Pi node của owner.

## Điều kiện tiếp tục
Cần execution environment có Docker/Podman engine hoạt động, hoặc native CLI với user non-root hợp lệ và download artifacts thành công. Không cần owner authorize lại 1A: authorization giữ nguyên. Sau khắc phục, resume theo đúng allowlist, chứng minh local Auth session cutoff trước triển khai rộng, rồi triển khai và chạy toàn DB/API matrix. Nếu lifecycle thực tế incompatible, DỪNG report deviation trước alternative.

## Checkpoint
Git commit/tag sẽ là **preflight-blocked**, không freeze/pass tag. Kết quả toàn 1A chưa PASS nên không freeze. 1B vẫn NOT AUTHORIZED.

## Những gì KHÔNG làm
Không Customer/Control Center UI; không Refine/shadcn/React/Playwright; không future business module/schema; không sửa legacy; không deploy Supabase/cloud; không sửa contract hoặc mở allowlist; không mock test thay evidence.

## Primary sources dùng cho preflight
- https://supabase.com/docs/guides/local-development/docker-and-native-runtimes — native/root/download prerequisites.
- https://supabase.com/docs/guides/local-development/running-multiple-local-projects — CLI2.119.0, experimental stack, no-config scratch mode.
- https://supabase.com/docs/guides/auth/sessions — auth.sessions/session_id mechanism; đây là documentation, chưa runtime verification.
