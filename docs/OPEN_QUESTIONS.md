# Câu hỏi và gate chưa chốt

## Gate trước Sprint 1
| ID | Nội dung | Tác động / cách xử lý |
|---|---|---|
| G1 | Chủ dự án duyệt bộ contract Sprint 0: status, permission vocabulary/matrix, HR whitelist, schema và cutoff/session validation | Là gate triển khai; không bắt đầu code chỉ vì architecture tổng quát đã duyệt |
| G2 | Login provider, chính sách signup và recovery cho bản đầu | Đề xuất email/password + verified email theo Supabase; chưa coi là đã chốt. Auth schema adapter không thay identity. Phải chốt trước làm màn/Auth tests |

Version dependency, môi trường local Supabase/Docker và browser là lựa chọn triển khai có kiểm tra; agent được chọn version tương thích và lock sau authorization Sprint 1. Nếu không chạy được phải ghi BLOCKED, không substitute mock PASS. Contract auth.sessions cutoff phải được integration spike trước triển khai rộng; failure cần báo và duyệt alternative.

## Gate trước Sprint 2
| ID | Nội dung |
|---|---|
| G3 | Payment mở bàn là cọc, trả trước hay xác nhận vận hành? |
| G4 | Số tiền, currency, quyền/phương thức xác nhận, người chịu trách nhiệm |
| G5 | Thời gian giữ bàn, pending expiry, cancel, xác nhận muộn và retry |
| G6 | Giá snapshot thời điểm nào; giờ chơi bắt đầu lúc nào; có check-in ảnh hưởng tính giờ không |
| G7 | CEO metric: occupancy/session count hay revenue đã thu; định nghĩa ngày kinh doanh/timezone |

## Gate trước Sprint 3
G8: làm tròn thời gian/tiền, mức tối thiểu, giá thay đổi, người được kết thúc, sửa bill, thanh toán cuối/hoàn tiền. Không tự kế thừa ceil-minute/half-up/bắt đầu trước khách tới của legacy.

## Gate các module sau
G9: public Player visibility, rank, achievement, kết quả hòa/tranh chấp/sửa VERIFIED, xác minh và privacy Media.
G10: thể thức giải, eligibility, fee và tính phù hợp brackets-manager.js.
G11: Shop hold/expiry/fulfillment/refund; quan hệ payment chung.
G12: Telegram login/link identity/handoff security theo khả năng provider được kiểm chứng.
G13: invitation one-time expiry/revoke cho HR onboarding; chưa entity/token module trong Sprint 1.
G14: retention audit/legal/privacy, backup SLA, import dữ liệu cũ và deployment region/domain — trước production; chưa chạy tự động cleanup/hard delete.

CEO write actions chưa được yêu cầu cụ thể: V1 không có write defaults. Khi có yêu cầu, bổ sung từng action, scope, audit và tests; không cấp toàn bộ write bằng role CEO.
