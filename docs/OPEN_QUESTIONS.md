# Gate definitions và status — Sprint 0 cuối cùng

G2 đã được owner chốt; architecture cơ bản được chấp thuận. **Checkpoint 1A đã authorize, runtime preflight BLOCKED; 1B chưa authorize.** Gate là điều kiện trước công việc tương ứng, không cho phép tạo schema/module tương lai.

| Gate | Definition | Status | Phải giải quyết trước | Điều kiện đóng |
|---|---|---|---|---|
| G1 | Owner reviews final Sprint0 contract and explicitly authorizes Checkpoint 1A; basic architecture approval alone is insufficient | CLOSED_OWNER_AUTHORIZED_1A | Checkpoint 1A | Owner authorize 1A ngày 2026-10-06; không authorize 1B |
| G2 | V1 internal ADMIN/CEO/MANAGER/STAFF and customer USER authenticate email+password; email password recovery; Supabase Auth only; no phone/SMS/social/Telegram/passkey/MFA or prep schema in Sprint1 | CLOSED_OWNER_DECIDED | Checkpoint 1A | Owner decided 2026-10-06; operational email/signup settings separately documented, not an undecided provider gate |
| G3 | Meaning of open-table payment: deposit, prepaid amount or operational confirmation | OPEN | Sprint 2 | Owner-approved payment business meaning |
| G4 | Amount/currency, payment method, who may confirm and confirmation responsibility | OPEN | Sprint 2 | Owner-approved amount/method/authority rules |
| G5 | Pending table hold duration, expiry/cancellation, late confirmation and retry handling | OPEN | Sprint 2 | Owner-approved pending lifecycle |
| G6 | When hourly rate snapshots and playing time start; check-in effect if any | OPEN | Sprint 2 | Owner-approved pricing/time start semantics |
| G7 | CEO metric definitions: sessions/occupancy vs collected revenue; business day/timezone | OPEN | Sprint 2 | Owner-approved aggregate metrics |
| G8 | Close-session rounding/minimum charge, final amount, close authority, corrections, settlement/refund | OPEN | Sprint 3 | Owner-approved closing/billing rules |
| G9 | Player public visibility/rank/achievement, verified results/draws/disputes/corrections and Match Media privacy | DEFERRED | Player Sprint4; media privacy before Sprint5 | Approve each relevant Player/Media rule before module work |
| G10 | Tournament formats/eligibility/fees and suitability/storage adapter for brackets-manager.js using same Match Core | DEFERRED | Sprint 6 | Approved tournament contract and justified library choice |
| G11 | Shop stock hold/expiry, fulfillment/refund and reuse of central payments | DEFERRED | Sprint 7 | Approved commerce flow/constraints |
| G12 | Telegram identity linking/login/handoff security and same data-core adapter | DEFERRED_EXCLUDED_SPRINT1 | Sprint 8 | Provider capability verification and approved adapter/linking contract |
| G13 | HR onboarding invitation one-time use/expiry/revoke and authorized scope | DEFERRED_EXCLUDED_SPRINT1 | Any future HR invitation implementation | Owner authorizes invitation scope; no invitation/token schema now |
| G14 | Production audit retention/privacy, backup/restore SLA, historical import, deployment region/domain/SMTP and operational recovery | DEFERRED | Production deployment/import/cleanup; local test mail setup not blocked | Approved production operations and data handling policies |

## G2 Auth Policy — đã chốt
- Internal ADMIN/CEO/MANAGER/STAFF: Email + Password.
- Customer USER: Email + Password trong Sprint1.
- Recovery: Email password recovery.
- Supabase Auth là identity authentication duy nhất; profiles.id = auth.users.id.
- Sprint1 không Phone OTP, SMS, Google/Apple/Facebook/Telegram login, Passkey hoặc MFA. Không thêm schema riêng chuẩn bị provider.
- Provider sau này có thể bổ sung mà không thay business identity.

## Các cấu hình vận hành còn cần xác định
G2 đã đóng cho phương thức Auth/recovery. Việc mở public customer signup, yêu cầu xác minh email, password policy cụ thể, recovery redirect allowlist/SMTP và thời hạn token là cấu hình cần được ghi rõ trước test/live flow liên quan; không tự gọi chúng là provider chưa chốt. 1A có thể dùng Auth provisioning fixture và local mail capture; không mở production signup hoặc giả định SMTP thật. Customer signup nếu được mở luôn USER, không role tự khai. Các cấu hình không được quyết định âm thầm như business rule.

## Technical verification tại 1A
Version Supabase/dependency và local Docker môi trường phải được kiểm tra và lock sau authorize. Auth session cutoff phải chạy integration tests với auth.sessions/provider lifecycle; chưa chứng nhận chỉ từ tài liệu. Không khả thi phải report architectural deviation trước alternative. NOT RUN/BLOCKED không PASS.

## Gate giữa 1A và 1B
1A PASS + ghi kết quả + freeze + DỪNG. Owner authorize 1B riêng; không tạo thêm gate ký hiệu chưa định nghĩa. 1B không sửa contract database 1A nếu chưa báo deviation và được duyệt.

## Các việc chưa có write action được duyệt
CEO V1 không có quyền ghi nội bộ mặc định. Mỗi write action tương lai cần yêu cầu/scope/audit/tests cụ thể. F6.1 business rules không tự áp dụng. G3–G14 chỉ chốt trước công việc liên quan; không cần giải quyết toàn bộ để làm Auth Core.

## Runtime blocker sau authorization 1A
G1 đã đóng; không reopen gate kiến trúc. Local runtime chưa chạy: không Docker/Podman; Supabase CLI 2.119.0 native lỗi download artifact getaddrinfo ETIMEOUT; curl tới official S3 manifest trả HTTP200, nên không kết luận domain hoàn toàn không truy cập được. Native PostgreSQL còn cần non-root; uid_map chỉ UID0, runuser và os.setuid(1001) bị từ chối. Cần môi trường có Docker hoạt động hoặc native runtime có non-root hợp lệ và artifact downloads được CLI hỗ trợ. Không thay đổi schema/provider/session contract.

## Execution update — GitHub Actions
Owner authorized real Supabase on ubuntu-latest CI. Branch checkpoint-1a from375379a; runtime/session preflight PASS at2a1c8a2, run37439354568. Core/matrix implementation under test; not complete/frozen. Original sandbox blocker is superseded by CI execution; previous notes retain historical evidence. No contract/allowlist change, no main merge, no1B. See SPRINT_1A_RESULTS.md.

## 1A blocker needing owner decision
Administrative post-commit Auth provider revoke needs target JWT in GoTruev2.197.0. No revoke-by-user-id Admin route in pinned source. Database cutoff remains unchanged; session lifecycle spike PASS. Proposed clarification/alternative is NOT applied. See SPRINT_1A_RESULTS.md.1A cannot freeze until owner resolves this provider-orchestration contract. This is not a new symbolic gate.

## STOP — actual CI compatibility findings
Latest tested implementation240e159; workflow37442226921: startup/reset PASS, DB security suite FAIL (Auth schema USAGE missing for private definer owner; auth.sessions RLS enabled), API/security suite NOT RUN. Provider revoke-by-user-id also needs owner contract decision. See docs/sprints/SPRINT_1A_RESULTS.md (from repository root). No privilege escalation workaround applied.1A not complete/frozen; main unmerged;1B not authorized.
