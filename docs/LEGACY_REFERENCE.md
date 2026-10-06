# Legacy/reference và baseline

## File đầu vào (giữ nguyên)
| File | SHA-256 |
|---|---|
| VOLUME_F6_1_MACOS(1).zip | f0b0cf8372b1a127a30362bd1a584bb0c1e8a4d3346de6f3113cfdb4d007837b |
| VOLUME_F6_1_AUDIT_V2_PLAN.md | daf72ad056f6d96e760134ec763ae609804dd8f202763f32c7183144ddeef1f4 |
| VOLUME_V2_BLUEPRINT_DRAFT.yaml | d1180b3baadb7dce76b871de4c8b846f8c977d59467a571f05a329eac4c18c2b |

ZIP gốc là checkpoint bất biến. Source đã giải nén để nghiên cứu ở reference/VOLUME_F6_1_MACOS, ngoài repo V2; không sửa hoặc đưa vào dependency. ZIP legacy không đóng kèm bản bàn giao docs V2, không sao chép credentials/data. Blueprint draft không sửa đè; V2 có contract mới docs/blueprint.yaml.

## Requirement/test/UX reference
| Reference | Giá trị | V2 dùng thế nào |
|---|---|---|
| core.py / policy.py / web_auth.py | Auth quyền trong transaction, scopes, revoke, invite, audit | Requirement và deny/revoke tests; không port implementation/custom WebAuth |
| session_service.py / store.py book/pay/session_end | Race, price snapshot, server time, retry, freeze receipt | Candidate requirements và test cases cho Sprint 2/3 sau chốt rule |
| competition_service.py | VERIFIED mới tác động thống kê | Match Core requirement; bỏ live_players/player_links/match_posts duplicate model |
| shop_service.py / real_core.py | Inventory hold/idempotency | Reference Shop sau này |
| handoff.py / handoff-service.js | Context chỉ selection, không tự khai quyền/identity | Security/UX reference Telegram sau |
| presentation.py và F6.1 UX | Lỗi rõ ràng, giữ dữ liệu form, preview-confirm | Copywriting/interaction reference, không port toàn màn |
| tests/test_f2_sessions.py | Hai khách tranh bàn, rate snapshot, retry, scope | Chuyển intent sang database/API/E2E V2 |
| tests core/workforce/competition/handoff | Chặn cross-scope, stale/replay, deactivate | Regression requirement, không chạy lại mock để chứng nhận V2 |
| web/assets, logo/font/ảnh/license | Thương hiệu | Chọn lọc asset phù hợp sau review license; không copy trong Sprint 0 |

Không giữ SQLite schema 67 bảng, ThreadingHTTPServer, app.py/store.py/real_core.py runtime, quanly.js, flag legacy/core/real/demo. Không tự áp luật một pending/user, ceil-minute, half-up, branch-bound Player, thứ tự draw/bracket hay remote billing timing.

## Giới hạn bằng chứng
Audit xác nhận hướng rewrite sạch. Báo cáo F6.1 tự ghi một số browser/device/live-provider NOT RUN và quy tắc PARTIAL/BLOCKED. Sprint 0 không chạy ứng dụng/test legacy, không tuyên bố UX production hoặc tất cả regression PASS. Không dùng số dòng code để đánh giá tiến độ.
