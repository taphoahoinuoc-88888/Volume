# VOLUME — demo Windows một lần bấm

## Sửa lỗi worker thoát sau START trên Windows

Owner đã ghi nhận backend/Auth 200 nhưng cổng 3000/3001/55325 mất và PID supervisor chết.
CI trước đây chưa kiểm tra ranh giới launcher thoát, nên không chứng minh máy owner chạy được.
Bản sửa tách supervisor khỏi console/pipe của launcher, giữ Windows Job Object cho đúng các tiến trình
VOLUME, kiểm tra PID/IPC/HTTP và kiểm tra lại bằng helper riêng trước khi mở trình duyệt.
Không thay Auth/RLS/billing/bootstrap transaction hay xóa pending ADMIN.

Cập nhật tại **đúng thư mục hiện có**, theo mục kiểm tra Git bên dưới. Nếu còn sửa đổi local,
sao lưu và hợp nhất diff trước; không chép đè hay reset. Sau khi cập nhật, chạy START_VOLUME.bat.
Nếu đang tạo ADMIN dở, nhập lại đúng email/mật khẩu đã chọn; không tạo database mới.
Sau khi cửa sổ launcher thoát, chạy trong CMD tại thư mục repo:

```bat
node scripts/local-demo-admin.mjs check
curl -s -o NUL -w "CUSTOMER=%{http_code}\n" http://127.0.0.1:3000/
curl -s -o NUL -w "ADMIN=%{http_code}\n" http://127.0.0.1:3001/
```

Trong CMD gõ trực tiếp, dùng `%{http_code}` (hai dấu `%` chỉ khi lưu trong file `.bat`).
`check` phải trả `ready:true`; hai HTTP phải 200. Sau đó thử đăng nhập ADMIN, STOP rồi START lại,
và xác nhận dữ liệu còn nguyên. Chỉ kết luận máy owner đã sửa khi các bước này PASS trên máy đó.

Lỗi được phân loại bằng mã, ví dụ `ADMIN_LOGIN:UND_ERR_SOCKET`, `ADMIN_BOOTSTRAP:42501`,
`ADMIN_INPUT:INVALID_JSON`, `WORKER_DEAD`, `SUPERVISOR:WIN32_<mã>` hoặc `WEB_CUSTOMER`.
File `worker-status.json` trong runtime chỉ chứa attempt ID, thời gian, bước và mã lỗi; không chứa
credentials/token/config. Không gửi `worker.json`, `state.json`, `.env` hay output Supabase status.
Gửi dòng lỗi VOLUME và kết quả `check` đã che thông tin riêng nếu cần chẩn đoán tiếp.
Không restart Docker/WSL, dừng testnet2 hoặc xóa volumes để xử lý lỗi này.

## Máy đã có VOLUME: cập nhật an toàn tại đúng thư mục

PR #10 đã merge vào `54904e7e6419a6c5678cbbbb326a9246db2e06ee`, cả năm workflow hậu merge PASS.
Đã sửa SID/icacls và nhập ADMIN UTF-8 trên PowerShell 5.1. Không cần áp dụng lại bản vá thủ công.
Máy owner `C:\Users\Admin\Downloads\Volume-V2` từng sửa `scripts/local-demo-admin.mjs`;
**chưa được truy cập trực tiếp trong phiên này**, nên phải kiểm tra local trước khi cập nhật.

Mở PowerShell tại thư mục đó, chạy từng dòng:

```powershell
Set-Location 'C:\Users\Admin\Downloads\Volume-V2'
git status --short
git diff --stat
git diff --cached --stat
git branch --show-current
```

Nếu có thay đổi hoặc file chưa theo dõi: **dừng cập nhật**, giữ nguyên file. Sao lưu riêng file đã sửa
và đối chiếu với bản mới trước khi merge. Không chạy `reset --hard`, `clean`, chép ZIP đè, hoặc đổi
thư mục để né lỗi. Không gửi file cấu hình/token lên Git hay chat. `git fetch origin` chỉ tải lịch sử,
không ghi đè working tree; `git diff HEAD origin/main -- scripts/local-demo-admin.mjs` giúp xem khác biệt.
Việc hợp nhất bản sửa local cần đọc diff thực tế trên máy, không thể xác nhận từ CI.

Chỉ khi working tree sạch và branch hiện tại là `main`:

```powershell
git fetch origin
if ($LASTEXITCODE -ne 0) { throw 'Chua tai duoc main; khong cap nhat.' }
git merge --ff-only origin/main
if ($LASTEXITCODE -ne 0) { throw 'Nhanh local khac main; giu nguyen de doi chieu.' }
```

Sau cập nhật, **nhấp đúp START_VOLUME.bat**. Nếu ADMIN đã có, dùng tài khoản cũ; không tạo lại
hoặc sửa role trực tiếp. Kiểm tra: showroom → Chọn bàn → đăng nhập; Control Center → bàn/phiên;
STOP → START lại → tài khoản và dữ liệu vẫn còn. Với local chưa cấu hình ngân hàng, không coi lỗi
provider hoặc chưa thanh toán là đã mở bàn thành công. Luồng MANUAL/CASH dùng đúng quyền hiện có.
Kiểm tra Pi Node `testnet2` vẫn hoạt động; không dừng/restart Docker Desktop để thử STOP của VOLUME.

Telegram adapter là tùy chọn server-side riêng, không tự bật khi START; xem
[`integrations/telegram/README.md`](integrations/telegram/README.md). Chỉ public table/venue được đọc
trong bot; tạo yêu cầu và xem phiên riêng vẫn đăng nhập V2 trên website.

**Trạng thái: đã triển khai; native Windows launcher và real Linux Docker/Auth/browser đã PASS.**
Sprint 3 vẫn CLOSED / FROZEN. Full Windows Docker Desktop end-to-end **NOT RUN** trên hosted runner;
không coi kiểm thử Linux hay backend mô phỏng là bằng chứng full Windows stack.

## Mở và tắt demo

1. Cài **Node.js 22.12+ (nhánh 22) hoặc 24**, và **Docker Desktop**. Mở Docker Desktop ở chế độ Linux containers.
   Lần đầu cần mạng để tải dependency và Docker images; launcher báo rõ nếu thiếu công cụ.
   Không cần Git, PowerShell 7, Supabase CLI cài sẵn, hay tự sửa file cấu hình.
2. Tải ZIP repository, giải nén vào thư mục cố định, bấm đúp **START_VOLUME.bat**.
   Chờ thông báo trong cửa sổ; lần đầu tải backend có thể mất vài phút.
3. Lần đầu nhập email ADMIN, mật khẩu 12–256 ký tự và xác nhận mật khẩu (nhập ẩn).
   Đây là tài khoản local do bạn chọn, không phải tài khoản production. Không có mật khẩu mặc định.
4. Launcher tự mở trang khách **http://127.0.0.1:3000** và quản trị **http://127.0.0.1:3001**.
   Đăng nhập bằng tài khoản vừa tạo. Dùng các chức năng venue/bàn, mở MANUAL, ghi CASH và đóng phiên đã có.
   Thanh toán ngân hàng thật vẫn chưa cấu hình; launcher không tạo giao dịch giả.
5. Những lần sau bấm START, nhấn Enter để mở web. Quên mật khẩu: chọn **R**, nhập email ADMIN;
   hộp thư local **http://127.0.0.1:55324** tự mở. Mở email và chọn mật khẩu mới qua màn hình recovery.
6. Bấm đúp **STOP_VOLUME.bat** để tắt riêng demo. Bấm lại START/STOP an toàn, không reset dữ liệu.

Nếu lỗi, cửa sổ giữ thông báo tiếng Việt. Kiểm tra Node, Docker đang chạy, mạng và dung lượng rồi thử lại.
Nếu port bị chiếm hoặc ownership không rõ, launcher dừng an toàn; **không tắt Pi Node/testnet2 hay reset Docker để xử lý**.
Port demo: 3000, 3001, 55320, 55321, 55322, 55324, 55325, 55326.
Backend khác phiên bản sẽ bị chặn để tránh tự nâng cấp/reset dữ liệu.

Dữ liệu quản lý nằm trong `%LOCALAPPDATA%\VolumeDemo\<mã thư mục>` và Docker volumes riêng của project.
Giữ nguyên thư mục giải nén: chuyển thư mục tạo định danh demo khác, không tự di chuyển/xóa dữ liệu cũ.
Không xóa thư mục runtime hay Docker volumes nếu muốn giữ dữ liệu. Launcher không tự sửa ADMIN bị vô hiệu hóa.
Mật khẩu không lưu trong file cấu hình, command line hoặc browser public config.
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

## Quyết định maintenance đã được duyệt

**RESOLVED — owner explicitly approved the narrow guard maintenance and eight demo paths.**
Cả bốn workflow đang gọi `scripts/check-sprint3-scope.py`.
Guard so diff từ Gate 1 SHA `69b680da06ae3194f8dcc2bbfffce4eddf30be32`
với exact 31-path Sprint 3 allowlist; các path demo mới đều không nằm trong danh sách.
Do đó chỉ thêm ba file owner yêu cầu cũng làm required CI fail.
Không sửa lịch sử SPEC/plan/results Sprint 3 để giả rằng demo thuộc Sprint 3.

Phạm vi owner đã duyệt:
- Modify duy nhất frozen guard `scripts/check-sprint3-scope.py`: nhận diện gói maintenance demo với exact path list riêng;
  giữ mọi frozen comparison, secret/forbidden-scope assertion và full actual-HEAD regression.
- Create `START_VOLUME.bat`, `STOP_VOLUME.bat`, `README_DEMO.md`.
- Create `scripts/local-demo.ps1`, `scripts/local-demo-admin.mjs`.
- Create `tests/local-demo/launcher.Tests.ps1`, `tests/local-demo/admin.test.mjs`.
- Create `.github/workflows/local-demo.yml` cho Windows orchestration và verification phù hợp.
- Design/implementation plan và evidence maintenance đặt trong README_DEMO.md sau Gate 1 approval, không sửa contract lịch sử.
- Không modify file frozen nào khác. Nếu thật sự cần thêm path hoặc đổi security semantics: báo trước.

Owner đã duyệt SPEC, narrow guard và execution end-to-end trong exact scope này. Không còn yêu cầu duyệt thường lệ.
PROVIDER/ENVIRONMENT DEPENDENT: Docker Desktop/Linux containers và tài nguyên máy Windows;
real provider vẫn ngoài scope. FUTURE SPRINT: duy trì launcher cùng từng Sprint được owner authorize.

## Lịch sử Gate 1

2026-10-08: xác minh GitHub main đúng baseline nêu trên; đọc AGENTS, scope guard, bốn workflow,
frozen local bootstrap/recovery và contract liên quan. Chỉ README này được tạo trên branch maintenance.
Tại Gate 1: START/STOP/Windows/Supabase demo tests NOT RUN vì chưa triển khai. Evidence mới ở cuối tài liệu.


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
A local supervisor runs the actual two Vite apps. Reuse the owned healthy JWT-verified Edge runtime;
only start the pinned Edge serve command if its handler health probe fails. Health gates precede browser opening.
On Windows a suspended Node child is assigned to a kill-on-close Job Object before execution; the supervisor
frees its own console so closing the launcher window does not stop the demo. Exact process creation identity
and an authenticated loopback IPC endpoint protect shutdown. Worker journal contains only public config
and an owner-private IPC token; it never contains ADMIN credentials or service-role keys.
Pinned CLI 2.119.0 installs its platform executable under @supabase/cli-windows-<arch>/bin (Linux equivalent in CI).
Existing containers resume using exact saved IDs, not a second CLI start that could replace a running stack.
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


## Verification ledger / phạm vi bằng chứng

Approved SPEC: `98fb962895ef130dd6f8c9b66bc3d47b407ac757`.
Design/Plan recorded before implementation: `e89852780f0f12d977ca4ac64bbc21a92e27ad69`.
Maintenance PR: [#9](https://github.com/HAD10202/Volume/pull/9).
Verified implementation checkpoint: `63e5774965d23b1457ea9fc49c4e829dafd52a9d`.
[Local Demo run 37735955862](https://github.com/HAD10202/Volume/actions/runs/37735955862): **SUCCESS**.
Native Windows job 113175394003: **19 tests PASS, 0 failed/skipped**, plus native batch/PowerShell entrypoint checks.
Real Linux stack job 113175394234: **19 tests PASS, 0 failed/skipped**, real Docker, Auth, migrations,
ADMIN audit rollback/retry, two logged-in browser surfaces, recovery email/password change, stop/restart persistence.
Counts overlap shared safety tests; they are not 38 distinct acceptance scenarios.
Final candidate and merged-main CI evidence is recorded in PR #9 to avoid a self-referential commit/SHA loop.

| Case | Executable evidence / boundary |
|---|---|
| D01 | Native .bat in Unicode/space/& path, missing Node; Node/version/path unit tests; real Linux fresh stack. Full Windows Docker in such a path NOT RUN. |
| D02 | Native missing dependency message; remote Docker rejection before mutation; no engine restart commands. Exhaustive missing-dependency installations NOT RUN. |
| D03 | Endpoint spoof/remote/credentials/query rejection and local Docker context checks. |
| D04 | Real isolated Linux sentinel named testnet2 retains ID/state/config; mocked exact-ID ownership cases on both OSes. This sentinel is not a real Pi Node deployment. |
| D05 | Wrong ID/name/label and unknown-container deny tests; occupied UI port preserved without worker creation. |
| D06 | Public-only config and service-role deny tests; real browser HTML secret check; env file loading disabled. No privileged browser configuration. |
| D07 | Real Auth identity, owner-selected password, ADMIN profile/version, exactly one bootstrap audit. |
| D08 | Real injected audit failure rolls back promotion; same identity retry; concurrent bootstrap has one effect; kernel command serialization. |
| D09 | Repeated real start, preserved profile/role/status/version/cutoff across stop/start; real password recovery. |
| D10 | Disabled ADMIN recovery denied and account remains disabled; frozen workflows verify revoked-session behavior. |
| D11 | Native Windows real Vite/Chromium pages with simulated Edge; Linux real backend and two authenticated pages. |
| D12 | Injected audit failure, unknown ownership, occupied port, command timeout and corrupt journal failures. Exhaustive fault injection at every OS/download/startup instruction NOT RUN. |
| D13 | Real kernel lock exclusion, repeat start/stop, process creation identity and stale-PID mismatch tests. |
| D14 | Corrupt/edited journal deny tests; native Windows supervisor crash kills only Job descendants and supports restart. Physical machine reboot NOT RUN. |
| D15 | Real Linux stop twice/start preserves data and sentinel; native Windows worker stop preserves unrelated process. |
| D16 | Four frozen actual-candidate workflows retain MANUAL/CASH/close/provider-unconfigured checks; no fake receipt in launcher. |
| D17 | Source fingerprint and read-only migration mismatch rejection; real fresh migrations and existing data restart. |
| D18 | Destructive fault injection only in ephemeral CI project; no integration reset/fixture invoked by launcher. |
| D19 | Windows native vs simulated containers vs Linux real stack explicitly separated above and in CI output. |
| D20 | Unmodified four frozen workflows on actual PR/main; exact scope guard retains all old assertions. Final run URLs in PR. |
| D21 | Bounded command timeout, redacted failure output, invalid input, native dependency error; real npm/tool/image installation. |
| D22 | Literal metacharacters in process arguments/password/path; real Auth password includes metacharacters; parameterized SQL. |

All 22 IDs are traced; this table does **not** claim every possible environmental variant has run.
The hosted Windows runner cannot execute the full Docker Desktop Linux-container stack; real Windows full-stack
hands-on acceptance remains **NOT RUN**, not silently PASS. No production deployment or real payment-provider integration is claimed.
No frozen application, migration, Auth/RLS/CAS/audit/billing change; only the explicitly approved guard gains
an additional exact maintenance allowlist. No extra path or Sprint 4 scope was introduced.

### Historical failures (retained, not counted as PASS)

Runs 37733153961 / 37733525237 failed resolving the pinned CLI executable after its platform-package layout changed.
37734101279 / 37734475919 exposed Windows supervisor launch and Edge/container replacement issues.
37734905681 / 37735221249 exposed browser-test navigation timing after login; waits now use the actual destination.
37735645965: Linux real stack SUCCESS, Windows supervisor FAILED; Windows detached spawning was corrected
by starting the supervisor normally and detaching only its own console. Run 37735955862 then passed both jobs.
The transient authoring runtime cannot read /proc process identity: its isolated local unit invocation had one
process-identity failure, not a PASS. The unchanged assertion passed on real GitHub Windows and Linux runners.


## PR #9 — separate frozen fixture maintenance approval

Owner explicitly approved this additional scope after the navigation-race blocker:
`tests/e2e/fixtures/auth.ts` gains exactly one final-login-URL wait immediately after the existing disabled-account early return.
The URL is `/profile` for customer login and `/overview` for control login.
All existing assertions, Auth behavior, authorization checks, timeouts and load checks remain intact.
`scripts/check-sprint3-scope.py` permits only that insertion by byte-for-byte comparison with the frozen baseline;
its original security, scope, secret, regression and historical checks remain enforced for every other path.
This supersedes the earlier nine-path inventory only by adding this one specifically authorized fixture path (ten total).
No other frozen file modification is authorized. No application/business/security implementation changes.

Evidence motivating the change: Sprint 2 run 37738855961 attempt 2 on `0f9d2bbb16e95d2f72f9f2eccdba658af960bc3b`
FAILED: 95 browser tests passed, 1 failed, 72 not run. WebKit's navigation to `/table-session` was interrupted by
an unfinished login redirect to `/profile`. The helper previously waited for a greeting/current-document load,
which could precede the final redirect. The approved wait synchronizes that existing redirect; it does not retry or suppress failures.
Earlier WebKit internal navigation errors remain historical failures, not retrospectively PASS.

At that same candidate, Local Demo run 37738855973 was SUCCESS: native Windows 21/21 and real Linux stack 21/21,
zero failed/skipped. Full Windows Docker Desktop end-to-end remains NOT RUN. The new candidate and post-merge
five-workflow evidence will be recorded in PR #9; merge requires all five workflows green on the actual candidate.

## Product completion — bản local chưa nghiệm thu backend/E2E

Bản này bổ sung shop/kho, hạng cơ thủ, phản ánh và liên kết Telegram. Xem `docs/product/RESULTS.md` trước khi dùng. Không thay bản đang chạy trên PC bằng thao tác reset/clean hoặc chép đè file riêng.

### Cách chạy Windows sau khi bản cập nhật được kiểm thử trên môi trường phù hợp
- Cài mới: chạy `START_VOLUME.bat`, làm theo hướng dẫn ADMIN hiện có. Khách truy cập `http://127.0.0.1:3000`; nhân sự `http://127.0.0.1:3001`.
- Bản cũ có dữ liệu: giữ nguyên thư mục/cấu hình riêng, dừng bot bằng Ctrl+C; khi database VOLUME vẫn chạy, dùng `UPDATE_VOLUME.bat`. Công cụ xác minh resource thuộc VOLUME, so cấu hình/seed/function/migration cũ, tạo bản sao lưu riêng rồi chỉ áp dụng bốn migration product đã duyệt. Nếu từ chối, dừng và gửi mã lỗi; không reset database. Sau đó dùng START lại. Luồng upgrade thực tế vẫn cần nghiệm thu, chưa được gọi PASS tại sandbox này.
- `ADMIN_INPUT` chấp nhận UTF-8 BOM. Owner đã báo website khởi động được sau bản sửa BOM; đó chưa phải nghiệm thu tất cả luồng Windows/ADMIN.
- ADMIN → Sản phẩm & kho → “Tạo danh mục minh họa để thử” nếu toàn bộ catalogue còn trống. Giá, tồn và ảnh đều DEMO; không phải dữ liệu bán hàng thật. Không tự ghi đè catalogue đang có.
- Nhân sự được cấp quyền nhập/xuất kho bằng số lượng tăng/giảm và lý do. Khách đặt giỏ giữ hàng 15 phút; tại quầy ghi nhận đủ CASH thực tế rồi giao hàng/xuất kho. Chưa tích hợp thanh toán ngân hàng cho shop.
- Cơ thủ tự tạo hồ sơ → gửi mã cơ thủ cho quản lý → quản lý xác nhận hạng theo quy định CLB. Không tự tính hạng.
- ADMIN/CEO cấu hình tài khoản Telegram hỗ trợ công khai cho từng chi nhánh; MANAGER chỉ cấu hình chi nhánh được giao. Khách gửi phản ánh hoặc mở liên hệ này tại mục Hỗ trợ.
- Telegram: chạy `START_TELEGRAM.bat`, lần đầu gõ S và dán token vào ô ẩn; lần sau Enter. Giữ cửa sổ mở. Không cần mua domain để polling. Link localhost chỉ hoạt động trên chính PC; xem `integrations/telegram/README.md`.

Không công cụ nào được phép restart Docker/WSL, prune, xóa volume hay can thiệp Pi Node/testnet2. Các file riêng và backup ở runtime phải giữ ngoài Git, không gửi token/mật khẩu vào chat.

## Bản product-completion sau chuyển chủ (chưa merge main)
Repository PRIVATE: https://github.com/taphoahoinuoc-88888/Volume — PR #13.
Không dùng `git pull main` để lấy bản này. Không chạy bản trong thư mục mới nếu muốn tiếp tục database cũ: launcher gắn danh tính dữ liệu với đường dẫn cài đặt.

Nếu thư mục VOLUME hiện tại là Git checkout, mở PowerShell ngay tại đó:
```powershell
git status --short
```
Nếu có file đã sửa: giữ nguyên, sao lưu và gửi **tên file** để review; không `reset`, `clean`, `stash` mù hoặc ghi đè. Nếu sạch:
```powershell
git remote set-url origin https://github.com/taphoahoinuoc-88888/Volume.git
git fetch origin product-completion
git switch product-completion
git pull --ff-only origin product-completion
```
Nếu `git switch` báo branch chưa tồn tại, dùng `git switch --track origin/product-completion` rồi tiếp tục. Đăng nhập GitHub bằng trình duyệt/Git Credential Manager của máy; không dán token vào chat.
Nếu bản đang dùng là ZIP không có Git: tải ZIP của **branch product-completion** từ repo PRIVATE vào thư mục tạm để đối chiếu. Không tự chạy bản ở đường dẫn mới hoặc chép đè các file đã sửa/cấu hình riêng; cần bàn giao cập nhật đã review vào đúng đường dẫn cũ để giữ danh tính runtime.

Sau khi đúng candidate được kiểm chứng và các file đã đồng bộ: dừng bot bằng Ctrl+C; database VOLUME cũ vẫn chạy; nhấp `UPDATE_VOLUME.bat` để xác minh lịch sử và tạo backup riêng trước migration. Nếu công cụ từ chối: giữ nguyên và gửi mã lỗi, không reset. Tiếp theo nhấp `START_VOLUME.bat`; dùng tài khoản cũ. Khách http://127.0.0.1:3000, nhân sự http://127.0.0.1:3001.
Telegram: `START_TELEGRAM.bat` → S → nhập token ẩn; đăng nhập Web → Telegram → tạo mã → gửi riêng cho bot → quay lại Web kiểm tra đúng danh tính và xác nhận. Polling không cần domain; nút localhost chỉ mở được Web trên máy chạy VOLUME.

Checklist nghiệm thu riêng trên máy owner: đăng nhập Admin/CEO/Manager đúng scope; đặt đơn/CASH/giao hàng và tồn chỉ trừ một lần; phản ánh có trả lời nhưng không lộ ghi chú; hạng và lịch sử; Web và bot cùng đơn/phiên; unlink chặn đọc; STOP/START giữ dữ liệu. Theo dõi Pi Node/testnet2 vẫn như trước. Không restart Docker/WSL, không xóa volume hoặc database.
