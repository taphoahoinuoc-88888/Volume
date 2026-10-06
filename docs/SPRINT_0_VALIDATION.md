# Sprint 0 final — Kiểm tra tài liệu

Ngày: 2026-10-06. **DOCUMENT VALIDATION PASS**. Architecture cơ bản approved; G2 CLOSED; Checkpoint 1A/1B NOT AUTHORIZED. Không runtime test execution.

Đã chạy 74 kiểm tra nhất quán: G1–G14 definitions/status, bigint version/expected_version, schema bốn entity, permission matrix, 1A exact allowlist 30 file, 1B planned list 56 file, acceptance/test contracts, agent rules, links và hash input. Đối chiếu 235 file legacy byte-identical ZIP.

## PASS evidence
- No implementation authorization
- Five roles, four business entities
- Role exclusively at profiles
- Auth G2 owner decided
- Eight excluded Auth providers/features, no prep schema
- G1 remains explicit 1A authorization pending
- All fourteen gates fully defined
- G1 definition/status matches gate document
- G2 definition/status matches gate document
- G3 definition/status matches gate document
- G4 definition/status matches gate document
- G5 definition/status matches gate document
- G6 definition/status matches gate document
- G7 definition/status matches gate document
- G8 definition/status matches gate document
- G9 definition/status matches gate document
- G10 definition/status matches gate document
- G11 definition/status matches gate document
- G12 definition/status matches gate document
- G13 definition/status matches gate document
- G14 definition/status matches gate document
- profiles bigint version and timestamp time only
- venues bigint version and timestamp time only
- staff_memberships bigint version and timestamp time only
- Append-only audit no version
- Version lock/atomic/no-op/stale contract complete
- Own edit RPC, no direct version writes
- 1A exact unique thirty files
- 1B planned unique fifty-six files
- 1A has no apps/shared UI/Playwright paths
- 1B no supabase/DB mutation allowlist
- 1A markdown exact list matches YAML
- 1B markdown exact list matches YAML
- Every schema field documented
- 1A full test matrix documented
- 1B browser and UX criteria documented
- 1A independent STOP; 1B separate authorization
- Fixed permission vocabulary unchanged fourteen
- Permission matrix OWN_PROFILE_READ
- Permission matrix OWN_PROFILE_UPDATE
- Permission matrix PUBLIC_VENUES_READ
- Permission matrix INTERNAL_VENUES_READ
- Permission matrix MEMBERSHIPS_READ
- Permission matrix STAFF_DIRECTORY_READ
- Permission matrix BUSINESS_AUDIT_READ
- Permission matrix SECURITY_AUDIT_READ
- Permission matrix VENUES_MANAGE
- Permission matrix ACCESS_MANAGE
- Permission matrix ACCOUNT_STATUS_MANAGE
- Permission matrix AUTH_ACCOUNTS_PROVISION
- Permission matrix OWN_SESSIONS_REVOKE
- Permission matrix STAFF_MEMBERSHIP_STATUS_MANAGE
- Nine required agent controls
- README.md no timestamp CAS/undefined gate
- AGENTS.md no timestamp CAS/undefined gate
- docs/architecture.md no timestamp CAS/undefined gate
- docs/blueprint.yaml no timestamp CAS/undefined gate
- docs/permissions.md no timestamp CAS/undefined gate
- docs/sprints/SPRINT_1.md no timestamp CAS/undefined gate
- docs/OPEN_QUESTIONS.md no timestamp CAS/undefined gate
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
- All 235 legacy files unchanged
- Document-only repo working files

## Artifact freeze
16 tracked documents. FREEZE_MANIFEST.json hashes 15 other documents + three inputs; excludes itself and dynamic Git metadata. Final ZIP contains entire volume-v2 directory including Git history docs-only. Packaging verification after commit: ZIP CRC, all entries byte-identical, tracked files/hash manifest, git fsck/status/head/tag on archive extraction. No credentials, app implementation, dependency, migrations or forbidden module in current working tree.

## Không chạy
Database/migrations/API security/Playwright chưa implementation ở Sprint0: NOT RUN. 1A tests là kế hoạch; 1B browser tests chỉ sau authorization riêng. Không gọi document PASS là security core PASS.
