# VOLUME — demo Windows một lần bấm

**Trạng thái: SPEC APPROVED; Gate 1 CLOSED. Design/Plan approved by owner end-to-end authorization; implementation pending verification.**
Không dùng tài liệu này như bằng chứng demo đã PASS. Sprint 3 vẫn CLOSED / FROZEN.
Baseline đã xác minh: `06dbaa8526824952e8269ca35a81cc6e7c39e33c` (closure PR #8).

## Yêu cầu owner và quy trình

Yêu cầu owner hiện tại là nguồn nghiệp vụ cho gói demo này và các Sprint tương lai:
mỗi Sprint phải kèm START_VOLUME.bat, STOP_VOLUME.bat, README_DEMO.md được bảo trì.
Chưa đủ điều kiện owner hands-on acceptance nếu phải tự cấu hình kỹ thuật để mở/tắt demo.
Đây là maintenance đóng gói local riêng, không phải Sprint 4, không mở lại nghiệp vụ Sprint 1/2/3.
Thứ tự nguồn: owner → AGENTS.md procedural/security → SPEC active → blueprint →
permissions/architecture/ADR → các contract frozen trước → Legacy reference.
Giữ quy trình Spec-Driven; owner đã duyệt SPEC và 22 cases tại 98fb962895ef130dd6f8c9b66bc3d47b407ac757, cho phép tự hoàn tất các Gate trong exact scope bên dưới.

## Mục tiêu và phạm vi

Owner tải repository, bấm START_VOLUME.bat, chọn thông tin ADMIN local ở lần đầu,
được mở trang khách và quản trị, đăng nhập và kiểm tra tính năng đã có.
Lần tiếp theo mở lại không mất dữ liệu. STOP_VOLUME.bat chỉ dừng tài nguyên demo thuộc quyền quản lý của launcher.

IN SCOPE: dependency preflight; orchestration Windows; local Auth bootstrap/recovery;
public browser configuration; mở hai UI; lỗi tiếng Việt; process/container ownership;
kiểm thử launcher; hướng dẫn thao tác ngắn gọn; evidence và giới hạn thực tế.
OUT OF SCOPE: nghiệp vụ mới, sửa Auth/RLS/CAS/audit/billing, sửa migration, đổi dependency ứng dụng,
production, provider thật, fake bank SUCCESS, Legacy, Sprint 4.
DEFERRED: toàn bộ các module và tính năng đã deferred trong Sprint 3.

## Quy tắc có thể kiểm thử

R01. START được double-click từ đường dẫn có dấu/khoảng trắng; không cần chỉnh file env hay gõ lệnh.
R02. Kiểm tra Windows/runtime, Node tương thích lockfile, npm, Docker CLI và Docker engine.
Thiếu dependency thì chỉ rõ tên và bước cài/mở bằng tiếng Việt; không tự restart Docker/WSL.
Supabase CLI dùng đúng phiên bản đã freeze, không tự nâng dependency.
R03. Mọi kết nối demo chỉ tới endpoint loopback local đã kiểm chứng; không dùng config linked remote.
Tên container đơn thuần không đủ chứng minh ownership: cần project/root/metadata phù hợp.
R04. Chỉ start/manage tài nguyên VOLUME cần thiết. Không có stop-all, prune, system restart,
volume deletion, database reset hoặc can thiệp container không thuộc demo, đặc biệt testnet2.
R05. Phân biệt stack/process do launcher tạo và tài nguyên đang có sẵn. Tài nguyên pre-existing không tự nhận
quyền sở hữu chỉ vì dùng đúng port/tên. Collision hoặc ownership mơ hồ phải dừng an toàn.
R06. Config UI chỉ có URL/public anon key và customer URL. Không có DB password/service-role/admin password/token.
Không ghi credential vào git, log, command line hoặc báo lỗi. Không ghi đè cấu hình remote/người dùng không rõ nguồn gốc.
R07. Lần đầu owner chọn email và mật khẩu ADMIN (nhập ẩn và xác nhận, theo password policy frozen).
Tạo qua Supabase Auth thật; bootstrap ADMIN chỉ trong database local đã kiểm chứng, có audit nguyên tử
và bảo vệ chạy đồng thời. Không sửa trực tiếp Auth schema hoặc chế tạo identity/token.
R08. Chạy lại không tạo thêm ADMIN, không reset mật khẩu, không đổi role/status/scope/cutoff.
Khôi phục dùng cơ chế Supabase Auth/recovery hiện có; không tự nâng USER thành ADMIN hoặc enable tài khoản bị disable.
Không lưu mật khẩu để tự đăng nhập. Nếu bước provisioning mất response, đọc lại identity/profile/audit trước retry.
R09. Dùng app và backend thật hiện có; chuẩn bị local runtime cần thiết, chờ healthcheck rồi mở hai browser URL.
Bootstrap session-reader chỉ được tái sử dụng đúng narrow local grant đã freeze, không mở rộng quyền.
R10. Lỗi dependency/port/startup/timeout/network/permission phải giữ cửa sổ và hướng dẫn tiếng Việt.
Không hiện stack trace chứa secret. Lỗi một phần chỉ thu hồi tài nguyên đã chứng minh do chính lần chạy tạo.
R11. Repeated/concurrent START không tạo nhiều tiến trình hay reset dữ liệu. STOP lặp lại an toàn.
Sau crash/reboot, kiểm chứng PID + thời điểm tạo + command/path và container identity trước khi xử lý,
không kill theo tên node/docker hoặc PID cũ đơn lẻ.
R12. STOP bảo toàn database/volume/dữ liệu; không dùng stop --no-backup hoặc cơ chế xóa storage.
Không dừng tiến trình hay stack pre-existing không thuộc quyền launcher.
R13. Tính năng chưa có provider thật vẫn báo chưa cấu hình theo implementation frozen; không giả QR/tiền.
Owner có thể thử nghiệp vụ MANUAL/CASH/close đã có bằng quyền đúng; không seed payment SUCCESS.
R14. Fresh setup có thể chạy migration/seed frozen vào database VOLUME mới do launcher tạo.
Database tồn tại phải kiểm tra tương thích; không reset/re-seed/rollback hoặc tự sửa lịch sử migration.
R15. Không gọi bộ integration fixture/reset trên database demo chứa dữ liệu owner.
Tất cả test phá hủy/fault injection chỉ trên môi trường test tách biệt.
R16. Chỉ gọi demo là sẵn sàng sau khi ghi rõ loại kiểm thử Windows đã chạy, kết quả và giới hạn.
Mocks chỉ chứng minh orchestration, không thay bằng chứng real Supabase/Auth/browser.

## State machines

Launcher: STOPPED → CHECKING → STARTING → READY → STOPPING → STOPPED.
Actor: owner double-click; trigger nội bộ: dependency/health/ownership checks.
CHECKING lỗi → FAILED (không mutation); STARTING timeout/lỗi → FAILED (cleanup chỉ phần tự tạo).
READY + START → xác minh health rồi mở URL, không tạo service trùng.
START/STOP đồng thời → serialize bằng khóa local; không chen ngang lifecycle đang chạy.
STOPPED + STOP → thông báo đã tắt. Ownership không rõ → BLOCKED, không kill/stop.
Crash/reboot → RECOVERING → READY/STOPPED/BLOCKED sau xác minh thực tế; không tin journal đơn độc.
Không có timeout tự reset/delete/restart Docker. READY không được công bố trước healthcheck cả hai UI/backend.

ADMIN setup: ABSENT → AUTH_CREATED → BOOTSTRAPPED → READY.
Owner chọn credentials; bootstrap phải có audited result. Partial/lost-response → RECOVERING bằng đọc trạng thái.
Existing ADMIN → READY/login hoặc RECOVERY_REQUESTED → recovery Auth hiện có → READY.
Invalid input → giữ state, cho nhập lại; concurrency → một bootstrap authoritative.
Không transition từ USER/disabled account thành active ADMIN bằng nút recovery.
Không recovery bằng backdoor bypass RLS/session cutoff.

## Invariants

I01. testnet2 và mọi tài nguyên Docker ngoài ownership của VOLUME không bị mutation bởi launcher.
I02. Dữ liệu local tồn tại luôn được bảo toàn khi start/stop/retry/failure/reboot.
I03. Không kết nối hoặc thay đổi production/remote infrastructure.
I04. Mỗi resource có ownership đã kiểm chứng; PID/port/name không đủ chứng minh riêng lẻ.
I05. Không secret trong browser, git, log, process arguments hoặc evidence.
I06. Một local ADMIN bootstrap authoritative, có immutable audit; retry không nhân bản.
I07. Auth/RLS/current session/cutoff/CAS/role/scope/audit/billing frozen giữ nguyên.
I08. Không fake bank/provider/payment evidence và không production-readiness claim.
I09. START/STOP serialize; partial cleanup không tác động tài nguyên có trước.
I10. NOT RUN/SKIP/FAIL hoặc mô phỏng không được gọi là Windows real-stack PASS.

## Quyền và trust boundaries

Người vận hành Windows local có quyền quản lý Docker của chính máy là actor chạy launcher.
Quyền này không trở thành API/browser privilege. ADMIN/CEO/MANAGER/STAFF/USER trong app
tiếp tục dùng đúng ma trận scope và quyền frozen; launcher không thêm quyền vào UI.
Secret/operator capability chỉ ở tiến trình local có endpoint/project verification.
Input email/password/path/port và journal trên disk phải được kiểm tra; không ghép vào shell/SQL.
Auth identity, quyền, timestamps, CAS, audit và tiền vẫn do server/database hiện có quyết định.
Không log password/access-refresh tokens. Không thêm generic privileged API hoặc runtime demo fork.

## Acceptance và test matrix (viết trước implementation)

| Case | Quy tắc / invariant | Kết quả cần chứng minh |
|---|---|---|
| D01 | R01/R02 | Double-click trong đường dẫn có dấu/khoảng trắng; dependency đầy đủ và thiếu từng loại |
| D02 | R02/I01 | Docker chưa chạy: hướng dẫn rõ; không restart engine/WSL/Pi Node |
| D03 | R03/I03 | Remote/linked/malformed URL hoặc project mismatch bị chặn trước mutation |
| D04 | R04/I01 | Docker sentinel testnet2 và container khác giữ ID/status/config/start time trước/sau |
| D05 | R05/I04 | Port bị app khác chiếm hoặc container giả tên: không kill/adopt |
| D06 | R06/I05 | Chỉ public keys trong env/bundle; logs/args/error/evidence không có secret |
| D07 | R07/I06 | ADMIN owner-chosen được tạo qua Auth, đúng profile và một audit |
| D08 | R07/R08/I06 | Hai START/bootstrap đồng thời, partial Auth/profile và lost-response retry |
| D09 | R08/I07 | Repeated start không đổi mật khẩu/role/status/cutoff; recovery không nâng USER |
| D10 | R08/I07 | Disabled ADMIN/account và revoked session không được launcher tự mở lại |
| D11 | R09 | Backend + customer + management health và hai browser URL thật |
| D12 | R10/I09 | Lỗi lần lượt mỗi bước startup; rollback chỉ tài nguyên tự tạo |
| D13 | R11/I04/I09 | START lặp/concurrent, START vs STOP, stale PID được tiến trình khác tái sử dụng |
| D14 | R11 | Crash/reboot/journal thiếu hoặc hỏng: phục hồi an toàn, không kill nhầm |
| D15 | R12/I02 | STOP hai lần; start lại giữ dữ liệu; stack pre-existing được bảo toàn |
| D16 | R13/I08 | Provider unconfigured giữ fail-safe; MANUAL/CASH/close đúng nghiệp vụ hiện có |
| D17 | R14/I02 | Fresh local setup vs database cũ/migration mismatch; không reset/re-seed |
| D18 | R15/I02 | Test database tách biệt; launcher không gọi destructive integration fixtures |
| D19 | R16/I10 | Native Windows orchestration tests và real backend tests được phân biệt rõ |
| D20 | I07 | Bốn frozen CI chạy candidate HEAD; constraints/RLS/Auth/CAS/audit không suy yếu |
| D21 | R10 | Network/npm download/health timeout/input invalid cho lỗi Việt và retry an toàn |
| D22 | I05 | Shell metacharacters trong email/password/path không thành shell/SQL execution |

Mỗi case phải có executable evidence hoặc ghi NOT RUN/BLOCKED chính xác.
Windows runner không hỗ trợ Linux Docker/WSL không được nhận là full Windows Docker proof.
Kiểm thử native Windows và real Supabase Linux có thể bổ sung cho nhau; giới hạn phải ghi rõ.

## Blocker thực tế và maintenance xin duyệt

**RESOLVED — owner explicitly approved the narrow guard maintenance and eight demo paths.**
Cả bốn workflow đang gọi `scripts/check-sprint3-scope.py`.
Guard so diff từ Gate 1 SHA `69b680da06ae3194f8dcc2bbfffce4eddf30be32`
với exact 31-path Sprint 3 allowlist; các path demo mới đều không nằm trong danh sách.
Do đó chỉ thêm ba file owner yêu cầu cũng làm required CI fail.
Không sửa lịch sử SPEC/plan/results Sprint 3 để giả rằng demo thuộc Sprint 3.

Phạm vi đề xuất để duyệt:
- Modify duy nhất frozen guard `scripts/check-sprint3-scope.py`: nhận diện gói maintenance demo với exact path list riêng;
  giữ mọi frozen comparison, secret/forbidden-scope assertion và full actual-HEAD regression.
- Create `START_VOLUME.bat`, `STOP_VOLUME.bat`, `README_DEMO.md`.
- Create `scripts/local-demo.ps1`, `scripts/local-demo-admin.mjs`.
- Create `tests/local-demo/launcher.Tests.ps1`, `tests/local-demo/admin.test.mjs`.
- Create `.github/workflows/local-demo.yml` cho Windows orchestration và verification phù hợp.
- Design/implementation plan và evidence maintenance đặt trong README_DEMO.md sau Gate 1 approval, không sửa contract lịch sử.
- Không modify file frozen nào khác. Nếu thật sự cần thêm path hoặc đổi security semantics: báo trước.

Đề nghị approval gồm SPEC trên và maintenance guard tối thiểu này; sau đó tiếp tục Gate 2/3/implementation/testing
trong exact scope đã duyệt. Chưa có quyết định nghiệp vụ mới cần owner trả lời.
PROVIDER/ENVIRONMENT DEPENDENT: Docker Desktop/Linux containers và tài nguyên máy Windows;
real provider vẫn ngoài scope. FUTURE SPRINT: duy trì launcher cùng từng Sprint được owner authorize.

## Evidence hiện tại

2026-10-08: xác minh GitHub main đúng baseline nêu trên; đọc AGENTS, scope guard, bốn workflow,
frozen local bootstrap/recovery và contract liên quan. Chỉ README này được tạo trên branch maintenance.
START/STOP/Windows/Supabase demo tests: **NOT RUN — implementation chưa bắt đầu**.


## Gate 2 — Technical design (reviewed before implementation)

No schema/migration/RPC/role/business UI changes. Local orchestration is implemented in the two approved scripts.
Batch entrypoints locate their own directory, invoke the PowerShell wrapper and keep failures visible.
PowerShell checks Windows/Node and offers masked owner credential input over stdin; no password in arguments.
Node helper owns orchestration, fixed commands without shell interpolation, Auth bootstrap/recovery, and a local UI supervisor.
Runtime state/config/tool installation lives outside the repository in the owner local application-data directory.
Its path is derived from the canonical checkout path; a unique project id prevents adopting the old volume-v2 stack.
Only a generated copy of frozen Supabase config changes project id and local ports; copied migration/seed/function bytes remain identical.
Demo API/DB/mail use 55321/55322/55324; customer/control use frozen 3000/3001 recovery origins.
A kernel-held local lock serializes START/STOP/bootstrap. Worker ownership uses an authenticated local IPC endpoint;
never kill by name, port or a stale PID. Containers must match saved exact ids and project labels; unknown resources fail closed.
Only specifically owned container ids can be stopped; volumes are retained. No Docker-wide lifecycle commands.
Failed startup retains owned data and records recoverable state; cleanup never resets or deletes a database.
Generated config compatibility is fingerprinted; an old database with different migration inventory is blocked without reset.
Privileged local status values stay in process memory. Vite receives only public URL/anon key through runtime defines, never secret env files.
A local supervisor runs the actual two Vite apps and JWT-verified Edge serve command; health gates precede opening the browser.
Pre-existing unrelated processes/ports are never killed. Corrupt or missing ownership evidence blocks destructive actions.

First ADMIN: real Auth signup (default USER), then local operator transaction using the frozen security advisory lock,
exact untouched candidate profile/version, no existing ADMIN, and atomic BOOTSTRAP_ADMIN_CREATED audit.
An existing USER cannot be promoted through recovery. A persisted local setup identity/correlation allows only recovery of this first bootstrap;
no duplicate effect on retry. Auth HTTP happens outside the SQL transaction. Existing ADMIN remains unchanged.
Recovery sends the existing Auth recovery email and opens the local inbox; owner chooses the new password in the frozen recovery UI.
Disabled accounts and lost role are not silently repaired. Auth/session-reader bootstrap reproduces exactly the already frozen local grants.
No bank confirmation or payment fixture is introduced. MANUAL/CASH/session closing use existing app flows.

## Gate 3 — Exact implementation plan (internally approved)

Branch: local-demo-spec. Base: 06dbaa8526824952e8269ca35a81cc6e7c39e33c.
Approved SPEC commit: 98fb962895ef130dd6f8c9b66bc3d47b407ac757.
Exact nine-path delta, no wildcard:

| Path | Change | Purpose / traceability |
|---|---|---|
| START_VOLUME.bat | create | D01/D02/D11/D21 start entrypoint |
| STOP_VOLUME.bat | create | D04/D13/D15 stop entrypoint |
| README_DEMO.md | create/maintain | Approved SPEC, design, plan, usage and D01–D22 evidence |
| scripts/local-demo.ps1 | create | Windows dependency checks, masked credentials, simple Vietnamese UX |
| scripts/local-demo-admin.mjs | create | Resource lifecycle, safe local Auth bootstrap/recovery, public UI supervisor; D01–D22 mechanisms |
| tests/local-demo/launcher.Tests.ps1 | create | Native Windows entrypoint/lifecycle/ownership tests; explicit simulation boundary |
| tests/local-demo/admin.test.mjs | create | Node safety and real isolated Supabase/Auth cases, 22-case mapping |
| .github/workflows/local-demo.yml | create | Native Windows and real Linux stack evidence, no frozen workflow edits |
| scripts/check-sprint3-scope.py | modify | Separate exact demo allowlist, freeze all other main bytes; preserve every prior check |

No application dependency/lockfile changes. Supabase tooling stays pinned at 2.119.0 outside the app tree.
No migration/RPC additions. No modified historical SPEC/plan/results. No production deployment.
Implement tests before or alongside each lifecycle/Auth slice. Run native Windows checks, isolated Linux real stack,
and all four existing actual-candidate regressions. Compare exact PR diff; merge only with required checks green;
verify final main and record immutable evidence in PR plus this README without a self-referential hash loop.
Internal Gate 2/3 review: additive packaging only; approved narrow guard change; frozen semantics unchanged.
