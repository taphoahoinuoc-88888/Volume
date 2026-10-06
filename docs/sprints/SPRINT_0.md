# Sprint 0 — Contract và freeze reference

Trạng thái: DOCUMENTATION COMPLETE; chờ owner review. Next Sprint NOT AUTHORIZED.

## Scope
Tạo project V2 và chỉ tài liệu/contract. Không application/migration/Auth/dependency/Supabase deploy. Input files và legacy source giữ nguyên. Role/Profile/Scope/Branch/permission/audit/revocation contracts; exact Sprint1 schema/files/test plan; ADR và open gates.

## Được sửa
README.md, AGENTS.md, docs/blueprint.yaml, docs/permissions.md, docs/architecture.md, docs/decisions/README.md, docs/decisions/ADR-001-identity-role-scope.md, docs/decisions/ADR-002-enforcement-revocation-audit.md, docs/decisions/ADR-003-repository-sprint-gates.md, docs/sprints/SPRINT_0.md, docs/sprints/SPRINT_1.md, docs/OPEN_QUESTIONS.md, docs/LEGACY_REFERENCE.md, docs/SPRINT_0_VALIDATION.md, docs/FREEZE_MANIFEST.json. Delivery ZIP ngoài project chỉ chứa các tài liệu này; Git metadata nếu có không đưa vào ZIP.

## Không được sửa/tạo
Ba file input; reference legacy; app implementation; migration/SQL; package/lockfile/dependency; Auth module; Supabase config/deployment; Player/Match/Table Session/Payment/Task/Tournament/Shop/Media/Telegram/AI/CRM/animation modules.

## Acceptance
A01: Project mới, không dependency legacy và không đổi hash input/source.
A02: Blueprint parse được, có identity/role/scope/status/permissions/matrix/privacy/revocation/audit/transaction/repo/agent contract.
A03: Role chỉ profiles; entity Sprint1 đúng bốn; HR/Player không role; CEO không security/write defaults; scope đúng membership.
A04: Permission vocabulary/matrix/extra whitelist nhất quán, bảo vệ hàng và cột.
A05: Disable account vs membership rõ; cutoff không dựa JWT iat refresh; test thực Sprint1 trước claim.
A06: Sprint1 exact file allowlist/schema/AC/DB/API/Playwright/freeze đủ; forbidden modules không schema/menu giả.
A07: Payment/billing/future module gates không có business rule tự đặt.
A08: Relative links hợp lệ; ADR/reference/open questions đầy đủ; file manifest và hashes kiểm tra.
A09: Hoàn thành document checks, bàn giao exact files/frozen decisions/open questions; dừng.

## Test Sprint 0
Parse YAML; role/entity/permission allowlist consistency; match generated markdown matrix/schema/file allowlist; link/path checks; no code/migrations/config/deps present; verify untouched inputs and extracted legacy hashes; document freeze manifest; ZIP content/hash match. Đây là document validation, không DB/API/Playwright runtime PASS.

## Freeze
Tài liệu snapshot đóng băng khi bàn giao, hashes trong FREEZE_MANIFEST.json (không self-hash). Chủ dự án vẫn cần duyệt để chuyển sang implementation. Những chi tiết contract được trình duyệt không được gắn nhãn user-approved nếu user chưa duyệt bộ này. Bất kỳ thay đổi sau review phải cập nhật contract/ADR/hash rõ ràng. Không bắt đầu Sprint1 tự động.
