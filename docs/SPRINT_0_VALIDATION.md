# Sprint 0 — Kết quả kiểm tra tài liệu

Ngày: 2026-10-06. Kết quả: **DOCUMENT VALIDATION PASS**. Sprint1 vẫn NOT AUTHORIZED.

Đã parse YAML, kiểm tra role/entity/status/vocabulary và từng dòng permission matrix, exact allowlist 69 file, schema field/test ID coverage, README references, gates và hash input. Đã đối chiếu toàn bộ 235 file legacy với bytes trong ZIP gốc. Không sửa input/legacy. Không app, migration, dependency, Auth implementation hoặc Supabase deployment.

Đây là kiểm tra contract và artifact; **không phải database/RLS/API/Playwright runtime PASS**. Chi tiết kỹ thuật mới ở Sprint0 vẫn chờ duyệt. Bộ test Sprint1 hiện là acceptance plan, không test đã thực thi.

## Các kiểm tra PASS
- YAML parse + document-only authorization
- Đúng năm role; role chỉ profiles
- Đúng bốn entity Sprint1
- Status account/membership nhất quán
- Role defaults và extra đều thuộc vocabulary
- Extra chỉ HR scoped, không security/global
- CEO không quyền ghi nội bộ/security
- USER chỉ self/public
- Permission document đủ vocabulary và matrix
- Matrix OWN_PROFILE_READ
- Matrix OWN_PROFILE_UPDATE
- Matrix PUBLIC_VENUES_READ
- Matrix INTERNAL_VENUES_READ
- Matrix MEMBERSHIPS_READ
- Matrix STAFF_DIRECTORY_READ
- Matrix BUSINESS_AUDIT_READ
- Matrix SECURITY_AUDIT_READ
- Matrix VENUES_MANAGE
- Matrix ACCESS_MANAGE
- Matrix ACCOUNT_STATUS_MANAGE
- Matrix AUTH_ACCOUNTS_PROVISION
- Matrix OWN_SESSIONS_REVOKE
- Matrix STAFF_MEMBERSHIP_STATUS_MANAGE
- 69 exact paths unique + reflected in Sprint1
- Schema columns đều ghi tại Sprint1
- AC/DB/API/PW test contracts đầy đủ
- Public profile deny, role absence membership, append-only audit
- Payment chưa chốt, occupancy derived
- Cutoff session creation, không refresh iat authority
- Business audit và mutation atomic
- Open gates đều tồn tại
- Document README.md
- Document AGENTS.md
- Document docs/blueprint.yaml
- Document docs/permissions.md
- Document docs/architecture.md
- Document docs/decisions/README.md
- Document docs/decisions/ADR-001-identity-role-scope.md
- Document docs/decisions/ADR-002-enforcement-revocation-audit.md
- Document docs/decisions/ADR-003-repository-sprint-gates.md
- Document docs/sprints/SPRINT_0.md
- Document docs/sprints/SPRINT_1.md
- Document docs/OPEN_QUESTIONS.md
- Document docs/LEGACY_REFERENCE.md
- README reference docs/blueprint.yaml
- README reference docs/architecture.md
- README reference docs/permissions.md
- README reference docs/sprints/SPRINT_0.md
- README reference docs/sprints/SPRINT_1.md
- README reference docs/OPEN_QUESTIONS.md
- README reference docs/LEGACY_REFERENCE.md
- README reference AGENTS.md
- README reference docs/OPEN_QUESTIONS.md
- Input unchanged VOLUME_F6_1_MACOS(1).zip
- Input unchanged VOLUME_F6_1_AUDIT_V2_PLAN.md
- Input unchanged VOLUME_V2_BLUEPRINT_DRAFT.yaml
- 235 legacy files byte-identical to original ZIP
- Không app/SQL/config/dependency trong project

## Freeze và bàn giao
15 file tài liệu, trong đó FREEZE_MANIFEST.json chứa SHA-256 của 14 file còn lại và ba input. Manifest không self-hash; không dùng tên "freeze" để cho phép Sprint1. ZIP bàn giao chứa đúng 15 file dưới volume-v2/; không legacy, credentials, .git hoặc code. Kiểm tra CRC và hash bytes từng file ZIP với manifest/project sau đóng gói.

## Không chạy
Database, API integration, unit app, Playwright, browser screenshots, Supabase deployment: NOT RUN / NOT IMPLEMENTED theo phạm vi Sprint0. Không làm Sprint1.
