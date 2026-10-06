# ADR-003 — Project mới và gate theo Sprint

Ngày: 2026-10-06. Trạng thái: Sprint 0 snapshot, chờ duyệt.

## Căn cứ đã duyệt
F6.1 legacy không sửa. V2 project mới. Sprint 0 chỉ docs. Sprint 1 chỉ profiles/venues/staff_memberships/audit_events. Không migration/app/dependency/Auth/Supabase deployment ở Sprint 0.

## Quyết định
Workspace đơn giản: hai React/TS app, shared tối thiểu, một Supabase core. Chỉ tạo folder/file khi Sprint cần. Refine/shadcn Control Center không tạo menu chưa tồn tại. Thư viện chuyên biệt kiểm tra và dùng khi đến module; không cài sớm.

Sprint 1 gồm Auth + permission shell thật, không Tasks/Tables giả. Sprint 2 mở bàn tới ACTIVE sau chốt payment. Sprint 3 kết thúc tính tiền/giờ tới CLOSED và trả bàn. Chỉ sau E2E hai slice PASS tới Player Core.

Thứ tự tiếp: 4 Player; 5 Match Media; 6 Tournament; 7 Shop; 8 Telegram adapter; 9 production integrations/operations. Permission tests/CI bắt đầu Sprint 1, không đợi production sprint.

Freeze là checkpoint có evidence. NOT RUN/BLOCKED không PASS. Next Sprint luôn cần owner authorization. Phát hiện lỗi module freeze mở maintenance scope, không sửa ngoài allowlist. Agent bàn giao và dừng.

## Hệ quả
Legacy business rule là requirement candidate/reference, không tự trở thành luật V2. Không migrate dữ liệu/credentials hay preserve status semantics bằng compatibility runtime. Kế hoạch production/historical import cần contract riêng.
