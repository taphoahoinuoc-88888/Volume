# VOLUME V2 — Sprint 2 Business Contract
Version: FINAL — owner decisions incorporated; APPROVED / FROZEN FOR IMPLEMENTATION
Date: 2026-10-07 (Asia/Bangkok)
Frozen Sprint1 base: main `2b47f0a619f494a811c94e41697f7d09dcb19e3a`
Previous contract: `3afc4fe898a1a51487cb821b127f80745dbe7fb9`
Status: APPROVED / FROZEN FOR IMPLEMENTATION. Sprint1 CLOSED/FROZEN. Implementation conditionally authorized after exact preflight plan; no material Sprint1 architecture/security change authorized.

## 1. Authority, scope và trạng thái review

16 quyết định owner hiện tại thay các đề xuất DRAFT1: deadline inclusive thay strict-<; server transition timestamp thay provider threshold timestamp; MANUAL là override đã chốt; cho phép hủy hold; bắt buộc một hold mỗi customer. Không giữ quy tắc cũ như lựa chọn còn mở.

Nguồn luật: owner hiện tại → AGENTS → Blueprint → permissions/architecture/ADR → Sprint contract. Header lịch sử Sprint0 không thay authorization hiện tại. Không sửa frozen migrations/Auth/RLS/security RPC/Legacy. Chỉ các extension additive tối thiểu đã được owner cho phép và CI scope chính xác trong preflight plan; mọi security guarantee Sprint1 vẫn bắt buộc.

Exact DOCUMENT-ONLY allowlist: `docs/sprints/SPRINT_2_BUSINESS_CONTRACT.md`, trên branch `sprint2-contract`; không merge main. Đây không phải implementation allowlist.

OWNER DECIDED = quy tắc nghiệp vụ đã chốt. TECHNICAL PLAN = cách biểu diễn kỹ thuật phải xác định chính xác trước code; owner đã authorize implementation nếu không material broadening Sprint1. Section14 phân loại những điểm thực sự còn mở; không tiếp tục coi 16 quyết định owner đã trả lời là business blockers.

Sprint2 gồm định nghĩa bàn/service, availability derived, online opening request/payment, hold5 phút, một hold/customer và/table, QR/partial/full, cancellation/expiry/recovery, auto-open60 phút, MANUAL và operational reads đúng quyền.
Không gồm final closing/billing, overtime/extension, final receipt/refund/settlement automation, automated reversal/chargeback, Player/Match/Video/Tournament/Shop/Telegram/CRM/AI hoặc production deployment/SMTP/domain. Provider integration cần authorization riêng.

## 2. Owner decisions — binding business contract

| Owner item | Binding decision | Coverage |
|---|---|---|
|1 deadline | Trusted provider_callback_received_at <= expires_at; validated acceptance and backend processing no later than deadline; exact equality accepted, no client clock. | I03/I04/I36; T15–T19/T83 |
|2 late callback | Money transferred early but confirmed after expiry never revives hold/preempts newer owner. Preserve money, PAYMENT_NEEDS_RESOLUTION. | I15/I16/I18; T20–T22/T69 |
|3 success time | payment_success_at is server time of first atomic enough-validated-funds transition; started_at equals it. Provider timestamps immutable reconciliation evidence, never backdating. | I14/I36; T09/T26–T28/T84 |
|4 manual | Explicit authorized override; opening_method=MANUAL, bypass online prepay, actor/reason/audit,60min immediate server start; never fakeSUCCESS. | I12/I19/I33; T47–T55/T78–T79 |
|5 money | VND integer only,60-minute authoritative hourly-price snapshot at acquire; no separate fee/tax model; laterprice does not alterhold. | I07/I17/I35; T30–T31/T60/T86 |
|6 excess | Full amount opens once if otherwiseeligible; excess recorded/flagged, no extra time/session/auto-refund. | I13/I18; T23–T25 |
|7 unavailable | AccountDISABLED/tableMAINTENANCE-orDISABLED/venue disabled before success prevents opening; cancel/release;0 cancel, positive/late moneyresolution. | I21; T56–T57/T88–T89 |
|8 provider | Provider-neutral contract only; immutable external identity/idempotency; no assumed bank payload or automated reversal/refund. Provider separatelychosen/authorized. | I08/I09; T12–T14/T34–T38/T64/T68 |
|9 manual target | GlobalADMIN/CEO, assignedManager, venue-boundextra; authenticated customer or management/walk-in support without changingAuthidentity. | I05/I20/I32; T48–T51/T78–T79 |
|10 countdown0 | No invented charge/auto-financialclose; retain state forSprint3; show initial periodended. | I27; T04/T62 |
|11 cancellation/QR/limit | Owncancel0 releases; positive moneyretained/resolution if cancelled; QRfailure0 releases; one live hold/customer and/table. | I29–I31; T71–T77/T81–T82/T87 |
|12 recovery/messages | DBdeadline/stale rejection independent of browser/worker; worker maymaterialize; web/appnotifications only. | I04/I23; T06/T18/T45/T76/T85 |
|13 reads | Managementoperations/holds/sessions/payment balances/resolution/times; Managerassigned venue, safe fields, no raw Auth/provider/privatebank. | I20/I25; T58/T67/T90 |
|14 structure | Fourminimal entities approved; occupancyderived; fixedmanualpermission; exactimplementationallowlist/CIscope beforecode, frozensecuritypreserved. | I01/I06/I19/I25; T53/T59/T65–T66 |
|15 QR/contact | Unique server reference/attempt; QRfull thenremaining; no arbitrarytransferfee; business contact fromvenue/businessconfig, minimalmissingprojectiondocumented. | I12/I34/I35; T10/T36/T80/T86 |
|16 abuse | Onehold/customer and/table, exactly5min, partial never extends, repeatedrequests no parallelholds; no complexban/scoring. | I03/I29; T01/T05/T11/T75–T77 |

“Exactly5minutes” means expires_at=acquired_at+300seconds, never renewed. Inclusive acceptance at the timestamp is not a grace period after it.

## 3. Customer và management UX

1. Public table list chỉ có nhãn bàn/venue, giá60 phút, service và availability; không có occupant, hold owner, private IDs hoặc payment details.
2. “Thanh toán để mở bàn” mới gọi acquire. Chỉ winner đã commit thấy QR/deadline; xem bàn không tạo hold.
3. Hiện required/received/remaining, deadline gốc và “Hủy giữ bàn”. Ví dụ100.000/70.000/30.000; QR phần còn thiếu30.000, cùng reference/deadline.
4. Reload/tab/retry đọc cùng request; không tạo parallel hold hoặc tự bắt đầu thêm5 phút.
5. Backend đủ tiền tự ACTIVE, countdown60:00→59:59 từ server start; không “Tôi đã chuyển tiền” hoặc Staff confirm.
6. Cancel0/expiry0/QR failure0 trả bàn ngay, nêu rõ nguyên nhân. Khách chủ động tạo attempt mới nếu muốn.
7. Cancel sau partial/partial expiry/late payment/unavailable có tiền: request kết thúc, financial case riêng, thông báo số tiền đã nhận và liên hệ quản lý bằng business contact cấu hình.
8. ACTIVE không được đóng qua endpoint hủy pending hold; chưa có Sprint3 close control.
9. MANUAL ghi rõ override, target là customer đã xác minh hoặc walk-in; preview/diff/reason/confirm. Không ghi “đã thanh toán” nếu không có chứng cứ tiền thật.
10. Timer MANUAL là “thời gian ban đầu60 phút”, không mặc nhiên “đã trả trước”.
11. Khi00:00, hiện initial period ended; giữ ACTIVE/occupancy và dữ liệu cho Sprint3. Không tự charge/extend/settle/close/release.
12. Staff mặc định chỉ operations cần thiết tại assigned venues; management xem safe financial cases đúng scope.
13. Pending verification khác received; bank-app return URL không là success. Chỉ web/app messaging, không Telegram/external production notification.
14. Account DISABLED vẫn bị DENY private/own access theo Sprint1. Không giữ private cache hoặc thêm finance bypass. Public business contact được công bố hợp lệ và authorized management vẫn hỗ trợ xử lý.

## 4. Minimal entities và additive proposals — design only

Bốn entity đã được owner chấp thuận: billiard_tables, table_sessions, payments, payment_receipts. Giữ profiles/venues/staff_memberships/audit_events hiện tại. Không thêm reservation/order/lock/financial_case trùng dữ liệu.

| Entity | Trách nhiệm / proposed fields |
|---|---|
| billiard_tables | id, venue_id, code/label, status ACTIVE/MAINTENANCE/DISABLED chỉ khả năng phục vụ; hourly_price_vnd; timestamps/version bigint NOT NULL DEFAULT1, positive. Không busy/free/lock copy. |
| table_sessions | Cùng row là opening request PENDING_PAYMENT rồi session ACTIVE; table/venue, customer_profile_id, opening_method PAYMENT/MANUAL, state PENDING_PAYMENT/ACTIVE/CANCELLED, acquired_at/expires_at, authoritative rate/required60-minute snapshot, started_at, cancellation cause/time, opened_by/reason, request_actor_profile_id/request_key/digest, timestamps/version. |
| payments | Unique initial intent/session cho PAYMENT, unique server reference, state WAITING/SUCCESS/CANCELLED/PAYMENT_NEEDS_RESOLUTION, payment_success_at và resolution cause; timestamps/version. Tham chiếu authoritative required snapshot tại session, không duy trì giá thứ hai. |
| payment_receipts | Append-only normalized validated evidence, immutable external event/transaction identity và provider/recipient scope, exact reference/payment_id, integer amountVND, immutable provider timestamps, trusted callback_received_at và processing metadata/digest. Unique real transfer toàn hệ thống; unmatched trusted receipt có thể NULL payment_id. Không raw bank/PII mặc định. |

Money là integer VND bigint, kiểm tra credit hợp lệ và overflow; không float/currency conversion/discount/tax/service/transfer fee hoặc default100k.
received=sum unique validated CREDIT receipts của payment; remaining=max(required-received,0); excess=max(received-required,0). Không có client-paid amount hoặc independent balance authority.
Provider nonfinal/reversal notice không là thêm CREDIT hoặc automatic netting/refund/close; giữ evidence/flag cho xử lý sau.
Reference không tái sử dụng giữa attempts. Partial/QR refresh giữ cùng reference.
Receipts/audit append-only không version. Mutable rows dùng bigint version; interactive existing-row writes có expected_version, updated_at chỉ thời gian. Mỗi changed row tăng một lần/command; replay/no-change không mutation/success audit.

### Manual ownership CLOSED — không đổi identity

- PAYMENT: customer_profile_id NOT NULL từ auth.uid(), live ACTIVE; client không chọn owner khác.
- MANUAL authenticated customer: tham chiếu profile hiện có sau targeted validation; actor tách beneficiary.
- MANUAL walk-in: customer_profile_id=NULL; bắt buộc authenticated authorized opened_by, venue/table/reason/server timestamp/audit. Không auth.users/profiles giả, guest role hoặc anonymous identity mới.
- NULL không cấp public/anonymous/own access. Management vẫn venue-bound; chưa có claim/linking/invitation module.
- Manual preview chỉ trả minimum target id/display_name/account status khi cần, không bulk customer directory/Auth contacts.
- Nếu implementation cần fake profiles/new Auth/roles/linking, STOP và report material identity deviation trước.

### Minimal venue business contact

Frozen venues chưa có contact. Owner cho phép minimal venue-level extension; xác minh source hiện tại không có field phù hợp. Chọn một `venues.management_contact` nullable plain text business-support value, tối đa500 ký tự, safe validation/rendering, không HTML/secret; Admin cấu hình theo VENUES_MANAGE và venue.version.
Chỉ đưa vào Sprint2 public projection của published enabled venue/table, own payment-case projection và authorized scoped operations. Không broad SELECT/Auth contact duplication. Own case có thể hiện business contact của venue đã disabled; account DISABLED vẫn không đọc private case.
Additive migration/write/read paths phải nằm trong exact preflight allowlist, có regression tests. Không sửa old migration/security RPC/public projection; không generic configuration entity. Thiếu contact chỉ hướng dẫn liên hệ quản lý tại chi nhánh, không bịa/hard-code số cá nhân.

### Durable pre-success invalidation

Account/table/venue unavailable phải kết thúc pending hold vĩnh viễn; re-enable không khôi phục hold cũ.
Chọn narrow additive Sprint2 DB hook/dependency khi DISABLED/service transition: cancel PENDING, preserve money/resolution và BUSINESS audit atomically, giữ nguyên Sprint1 account/scope/cutoff/audit. Không auto-close ACTIVE.
Trước code phải chứng minh lock compatibility với frozen profile/venue mutations. Không tự thay Auth/security RPC để làm hook. Nếu cần sửa frozen contract thực sự, STOP/report narrow maintenance scope.
Projection/acquire/ingest cũng kiểm tra authority/service hiện tại; không phụ thuộc worker để ngăn mở bàn không hợp lệ.

## 5. State machines độc lập

### Table service và derived occupancy

billiard_tables.status chỉ khả năng phục vụ. service_status là safe alias, occupancy derived riêng:
- PLAYING: ACTIVE session, kể cả countdown0.
- PENDING: valid PENDING_PAYMENT hold, owner/service/venue còn hợp lệ, deadline theo inclusive processing boundary.
- AVAILABLE: service/venue sẵn sàng, không ACTIVE/live hold.
- UNAVAILABLE_FOR_SERVICE: không sẵn sàng; vẫn giữ/hiện occupancy nếu có, không xóa facts của ACTIVE.

| Transition | Effect |
|---|---|
| AVAILABLE→PENDING | Atomic acquire; một customer/table winner, snapshot giá và deadline |
| PENDING→PLAYING | Full validated funds, receipt và processing đúng hạn, current hold hợp lệ; automatic |
| PENDING→AVAILABLE | Expiry/cancel/QR failure nếu service cho phép; financial case độc lập |
| PENDING→UNAVAILABLE_FOR_SERVICE | Invalidation; terminal cancel, tiền giữ nguyên |
| AVAILABLE→PLAYING | Scoped audited MANUAL override; không fake payment |
| PLAYING→released/closed | Ngoài Sprint2, thuộc Sprint3 |

### Opening request/session

PENDING_PAYMENT→ACTIVE khi online payment hợp lệ.
PENDING_PAYMENT→CANCELLED khi expiry/self cancel/QR failure/unavailability.
MANUAL tạo ACTIVE trực tiếp.
CANCELLED không trở lại PENDING/ACTIVE. ACTIVE replay trả outcome hiện tại, không reset start.
Không thêm DRAFT/PARTIAL/QR_GENERATED/EXPIRED persisted states: chúng là projection/context/cancellation cause.

### Payment

| Transition | Effect |
|---|---|
| Create WAITING | Unique initial intent/reference |
| WAITING→SUCCESS | Đủ validated credit và activation đúng hạn; atomic với session |
| WAITING→CANCELLED | Pending request kết thúc, received0 |
| WAITING→PAYMENT_NEEDS_RESOLUTION | Pending request kết thúc, có tiền, không mở bàn |
| CANCELLED→PAYMENT_NEEDS_RESOLUTION | Late true credit được giữ, không revive hold |
| PAYMENT_NEEDS_RESOLUTION→same | Thêm credits/history, không lock/reopen |
| SUCCESS→same | Duplicate no-op; true extra credits/excess giữ lại, không reset session |
| Refund/reversal/resolution completion | Ngoài Sprint2, cần authorization sau |

Opening hợp lệ có excess: giữ SUCCESS, expose excess/resolution_required; không extra session/time. MANUAL không tạo fake SUCCESS; không tự thiết kế future financial settlement cho manual.

## 6. Deadline, server success time và out-of-order

Authoritative backend timestamps là UTC timestamptz; không dùng browser/provider clock làm opening authority. Venue timezone chỉ display.
expires_at=acquired_at+300 seconds, immutable; partial/QR refresh/retry không gia hạn.

**Binding predicate: `provider_callback_received_at <= expires_at`.**
- Timestamp receipt do trusted backend ghi khi nhận, không đọc client/provider body/header.
- Event phải được validate và xử lý đến atomic serialized decision point **no later than expires_at**. Raw arrival đúng hạn nhưng chờ verification/lock quá hạn không giữ chỗ.
- DB kiểm tra current time sau lock/authority check; không timestamp transaction-start cũ hoặc backdate processing.
- Receipt và processing đều inclusive <=. Tại đúng expires_at, full validated event còn sở hữu valid PENDING hold được chấp nhận.
- Expiry/sweeper/acquire phải giữ inclusive equality; không cancel/reassign eligible hold ở cùng timestamp trước khi boundary được xét. Sau deadline không được mở; không grace period dương.
- Serialize expiry/acquire/callback/manual/cancel trên cùng ownership rows. Hold đã terminal/reassigned không được mở dù caller đưa timestamp receipt cũ.
- Linearization time là timestamp tại atomic DB transition đã commit cùng audit. Physical commit/response delivery không làm một start time thứ hai; rollback không có success. Không network call khi giữ ownership locks.
- Bank transferred trước hạn nhưng backend nhận/xử lý sau hạn: giữ tiền, PAYMENT_NEEDS_RESOLUTION, không retro-open/preempt.

**payment_success_at** là server/DB timestamp tại first atomic transition xác lập cumulative validated receipts>=required cho request còn hợp lệ. **started_at=payment_success_at**.
Provider occurrence/settlement timestamps là immutable reconciliation evidence, không backdate instruction.
Out-of-order receipts được dedupe và sum dưới lock. Khi known validated sum lần đầu đủ, mở tại server transition time; không đợi globally ordered bank history. Late earlier timestamp/previously missing credit không sửa start về quá khứ, reset timer hoặc mở thêm session.
MANUAL started_at là server timestamp của successful atomic manual transition;60 phút bắt đầu ngay, không fake payment.

Countdown=max(0,3600-elapsed_since_started_at);60:00→59:59 sau1 giây. Response đến UI muộn hiển thị elapsed thật; reload/check-in/duplicates không reset.
At0 giữ ACTIVE/occupancy cho Sprint3; không additional charge/extension/financial close/auto-release.

## 7. Invariants —36 required runtime proofs

Original28 retained with explicitowner corrections, not dropped. I04/I05/I08/I12/I14/I21 corrected forinclusiveboundary,manual/walk-in,provider-neutral validation/server start/unavailability. I29–I36 add customerholdlimit/cancel/QR/manual identity/contact/VND/timelyprocessing guarantees. “Preserve” does not preserve superseded strict-< orbank timestamp behavior.

| ID | Invariant |
|---|---|
| I01 | Per table, at most one live hold or ACTIVE session; they cannot overlap, including manual vs payment. |
| I02 | Database claims, not client availability display, decide the winner. |
| I03 | Deadline immutable acquired_at+300s; QR refresh/partial/retry never extend it. |
| I04 | No active hold after expires_at; inclusive exact-boundary validated processing remains eligible. Cleanup timing cannot prolong ownership past the deadline. |
| I05 | Online-payment session owner is the live authenticated customer, derived server-side; manual owner may be a verified existing customer or NULL walk-in with mandatory authenticated actor. Client cannot override identity/venue/price. |
| I06 | Service state is not busy/free; availability derived only from service/venue and session occupancy. |
| I07 | Snapshot required=server-derived60-minute minimum; current rate change cannot silently mutate existing intent. |
| I08 | Receipt counted only after provider-neutral authenticity/finality, recipient/reference/currency, immutable event/transaction identity and integer amount validation; no assumed bank-specific fields. |
| I09 | Each real transfer globally credited at most once, to at most one payment; multiple event IDs for one transfer are not multiple credits. |
| I10 | Payment SUCCESS eligible only at sufficient cumulative verified amount; no Staff/Admin confirmation/client return URL. |
| I11 | Full-payment transition: receipt inclusion + paymentSUCCESS + sessionACTIVE + started_at + audit atomic; failed audit rolls back all DB effects. |
| I12 | Each PAYMENT opening request has at most one initial payment intent and one server-generated immutable reference; retries return it. MANUAL creates no fake payment intent/receipt/SUCCESS. |
| I13 | Successful event opens at most one session; repeated callbacks never reset started_at or buy extra time. |
| I14 | Pending started_at NULL; payment ACTIVE uses started_at = payment_success_at = authoritative server timestamp of the first committed atomic enough-funds transition. Provider timestamps are reconciliation-only, never backdating. |
| I15 | Expired partial session not ACTIVE; payment stays independently unresolved; new customer may acquire table. |
| I16 | Zero-expiry cancel does not delete history; late credit is retained without reviving cancelled session. |
| I17 | Received/remaining/excess derived from immutable credits, integer arithmetic, no floating point or negative remaining. |
| I18 | Financial unresolved case never owns a table; success excess does not extend session. |
| I19 | Staff no default manual-open; HR label irrelevant; eligible fixed extra is scoped, live and revoked by existing cutoff contract. |
| I20 | Manager cannot act/read across venues; CEO manual write is only this explicitly approved action, no security/config authority inference. |
| I21 | DISABLED account prevents new activation and invalidates pending hold; INACTIVE staff membership removes venue authority, not customer identity. Preserve existing frozen cutoff; no Auth ban/session edits. |
| I22 | Sensitive operator writes require fresh preview/diff/reason/confirm and bigint expected_version; stale/missing rejects, no success audit. |
| I23 | Internal automatic events serialize under locks/constraints; not client CAS version, no service-role proof of RLS. |
| I24 | All successful mutable row changes increment version atomically; append-only receipts/audit immutable; duplicate/no-change does not increase versions/audit. |
| I25 | No direct client table/session/payment/receipt/audit mutations; no broad Auth SELECT/client secret. |
| I26 | Unknown extra/actions, malicious metadata and forged SYSTEM actor never grant access. |
| I27 | Timer0 neither closes/releases nor creates overtime billing in Sprint2. |
| I28 | No hard-delete of financial receipts/order/session history; no money transferred/reallocated/refunded automatically. |
| I29 | At most one live table-payment hold per customer globally and one per table; different tables/different keys cannot bypass this under concurrency. |
| I30 | Own pending cancellation releases ownership;0 received cancels normally, any received money is preserved as PAYMENT_NEEDS_RESOLUTION. ACTIVE sessions cannot be self-cancelled through Sprint2 hold cancellation. |
| I31 | QR failure before payment cancels/releases the broken attempt; concurrent/late credits are preserved and handled by current terminal state, never discarded or applied to a new attempt. |
| I32 | Walk-in is a MANUAL session with customer_profile_id NULL, mandatory actor/venue/reason/audit. No dummy auth.users/profiles/new role/anonymous access or implicit later claim. |
| I33 | MANUAL bypasses online prepayment only; authorized transaction starts60min immediately, never fabricates payment SUCCESS or extra play time. |
| I34 | Customer management-contact presentation comes from authorized venue/business configuration, not hard-coded personal information; published/own/internal projection boundaries remain explicit. |
| I35 | VND-only integer required initial amount equals snapshotted authoritative hourly rate for60min; no added tax/service/transfer fee; existing hold retains price, new hold uses new price. |
| I36 | Opening requires trusted provider_callback_received_at <= expires_at AND validated serialized processing/transition no later than expires_at, still-owned PENDING hold and eligible account/table/venue; late received or late processed event never retro-opens. |

## 8. Fixed permissions và security scope

G=global business; V=active assigned venue; S=own customer path; P=safe public; E(V)=explicit fixed extra tại active authorized venue; -=DENY. Private/internal luôn cần live ACTIVE account/session theo frozen revocation. S cho mọi role khi dùng customer path của mình, không cấp internal privilege.

| Permission | ADMIN | CEO | MANAGER | STAFF | USER |
|---|---|---|---|---|---|
| PUBLIC_TABLES_READ | P | P | P | P | P |
| OWN_TABLE_SESSION_CREATE | S | S | S | S | S |
| OWN_TABLE_SESSIONS_READ | S | S | S | S | S |
| OWN_OPENING_PAYMENTS_READ | S | S | S | S | S |
| OWN_TABLE_HOLD_CANCEL | S | S | S | S | S |
| TABLE_OPERATIONS_READ | G | G | V | V(minimal) | - |
| OPENING_PAYMENTS_READ | G | G | V(safe) | - | - |
| TABLE_DEFINITIONS_MANAGE | G | - | - | - | - |
| TABLE_SESSION_OPEN_MANUAL | G | G(explicit owner action) | V | E(V) | - |

TABLE_SESSION_OPEN_MANUAL và role defaults đã owner chốt. Các fixed action names khác là minimum Sprint2 action contract, chưa runtime grant; không mở rộng extra whitelist ngoài TABLE_SESSION_OPEN_MANUAL.
OPENING_PAYMENTS_READ gồm unresolved financial cases/balances/timestamps; không cần generic builder. Nếu cần tách quyền đọc resolution sau này, phải đề xuất fixed permission cụ thể trước.
STAFF/USER mặc định không manual. HR designation không là role/quyền. Eligible MANAGER/STAFF có thể nhận manual extra qua existing mechanism do ADMIN cấp, vẫn venue-bound. USER không nhận extra theo frozen role model; không global bypass.
Manual extra không grant finance/customer directory/security writes. CEO manual không suy ra ACCESS_MANAGE/account/config/security writes. Grant/revoke extra+cutoff+audit atomic; old session/old refreshed JWT DENY, relogin current rights.
Existing two-extra whitelist chỉ additive thêm TABLE_SESSION_OPEN_MANUAL theo owner approval; không old migration edit hoặc RBAC builder. Provider ingestion không là browser permission để ADMIN tự grant/forge money.

Projection:
- Public: published enabled venue/table, giá và availability; không occupant/private finance.
- Own: own request/deadline/snapshot/balances/state/resolution/safe contact; không customer khác/raw bank/Auth.
- Staff: assigned table service/occupancy/timer cần cho việc; không customer name/contact/payment amount mặc định.
- Manual preview: minimum selected target/context, không directory/finance grant.
- Management: holds/sessions/balances/unresolved/timestamps đúng scope; Manager assigned venue, CEO/Admin safe global.
- Không provider credentials/raw Auth/unnecessary bank PII. BUSINESS audit vẫn Admin/CEO/Manager scope; Staff/User không audit feed.

## 9. Concurrency/transactions — design only

1. Hai unique guards: mỗi table tối đa một PENDING_PAYMENT/ACTIVE owner; mỗi non-null customer tối đa một PENDING_PAYMENT online hold toàn hệ thống. Không now() partial index. Terminalize expired/invalid pending dưới lock trước khi claim mới.
2. Per-customer serialization cộng table lock: cùng customer, hai tables không thể win cả hai. Dùng existing central profile/compatible lock order; không lock entity/database/cache mới. Các customer/tables độc lập không bị global serialize.
3. Trước implementation phải chọn compatible order: affected authority/customer profile và memberships deterministic → affected tables deterministic → sessions → payments. Callback/expiry/invalidation/manual cùng discipline; actor khác beneficiary khi manual. Kiểm chứng với frozen1A mutations, không giả định hoặc rewrite core helper.
4. Acquire kiểm tra live session/account, eligible venue/service, authoritative price/quote version, customer hold và table occupancy; lazy expire nếu cần; snapshot/reference/key/create/audit/commit. Loser không orphan intent/QR/success audit.
5. Acquire tableB có thể cần terminalize customer old hold ởA: lock customer trước và affected tables theo order nhất quán. New key không bypass limit; cancellation/callback cũng tuân guard.
6. Callback sau trusted validation: lock owner/service/session/payment, receipt và processing <= deadline, binding/state; dedupe/insert credit/sum; atomic SUCCESS+ACTIVE+server start hoặc financial resolution; versions+audit.
7. Own cancellation dùng dedicated RPC/expected versions. Partial cancel trả bàn và financial resolution; full transition thắng race thì ACTIVE, hold-cancel denied. Stale cancel không báo new success; mất response đọc authoritative state.
8. QR failure là trusted attempt failure hoặc authorized own cancellation, không client grant để hủy người khác. Dưới lock0 cancel, positive resolution; delayed error không close ACTIVE.
9. Account/table/venue invalidation terminally ends PENDING, giữ tiền. Re-enable không revive. Safe additive durable hook phải được xác định trong exact preflight trước code; không dựa chỉ worker hoặc boolean có thể bật lại.
10. Projections và writes kiểm tra deadline/current authority cả khi worker down. Lazy expiry/worker materialize rows, không kéo deadline; unresolved payment không giữ bàn.
11. Sensitive writes có preview/diff/reason/confirm+bigint CAS. Provider/expiry dùng locked live state, không client actor/version. No provider network inside DB locks; bounded same-identity retry.
12. Mỗi unique attributed credit cập nhật payment.version/updated_at một lần để invalidate financial preview, kể cả state còn WAITING; không lưu duplicate amount authority. Nếu cùng command chuyển SUCCESS cũng chỉ tăng row version một lần. Duplicate không bump version. Receipt/payment/session/start/audit atomic rollback; money ở bank không phải DB transaction. Replay/reconcile giữ true money, không fake cross-service rollback.
13. Tests chứng minh inclusive equality, queued processing, profile/table concurrency và cancel/manual races; không UI-only locking, worker-only correctness hoặc arbitrary grace.

## 10. Idempotency và provider-neutral interface

Create customer/manual: opaque command key + authenticated actor + immutable payload digest trên session; unique actor/key. Manual beneficiary không là actor authority.
Same key/payload trả existing current outcome; changed table/payload conflicts. Expired same key không acquire lại; live authorization vẫn check, không exposedata qua guessed key.
Different keys vẫn một customer hold. Attempt mới dùng reference mới, không chuyển credit cũ. Manual replay không new session/start/audit.

Normalized concepts là contract, không fieldnames của một bank cụ thể:
| Concept | Requirement |
|---|---|
| External event identity | Immutable scoped identity, replay detection |
| Financial transaction identity | Immutable money movement; delivery/event IDs khác nhau không thành thêm credit |
| Authenticity/finality | Verified origin/recipient/final incoming credit; mechanism chọn theo provider sau |
| Correlation | Exact server reference/recipient/currency, không approximate amount/client order hint |
| Amount | Validated integer VND, không fee/client balance |
| Provider timestamp | Immutable evidence để reconcile |
| Backend received time | Trusted server stamp, không body/header override |
| Processing/success time | Actual atomic DB transition, không backdate |

Dedup cả event và semantic transfer. One transfer/multiple delivery IDs chỉ count một lần; same ID đổi amount/ref/currency reject/quarantine, không overwrite/rebind.
Reversal/chargeback/reconcile notices có thể giữ evidence/flag, không auto refund/netting/close. Valid unmatched money restricted, không đoán allocation.
Provider/QR protocol/replay/finality/auth fields chọn và verify sau, integration separately authorized. Fixture receipt tests không là live bank PASS.

Browser không ghi SUCCESS/receipts/callback timestamps/ownership/price. Adapter secret server-only, narrow DB ingestion, không generic proxy/client service-role.
Definer nếu cần: private/non-exposed, minimum owner, empty safe search_path, schema-qualified, revoke PUBLIC/anon EXECUTE, explicit trusted caller và direct invocation DENY tests.

## 11. Expiry, cancellation, failures và audit

| Situation | Binding outcome |
|---|---|
| Fixed deadline | DB authority; callback receipt và processing <= inclusive, sau hạn DENY; không browser/worker extension |
| Zero expiry | Request/payment CANCELLED, release nếu service cho phép |
| Partial expiry | Request CANCELLED, payment PAYMENT_NEEDS_RESOLUTION, preserve funds/contact; table independent |
| Own cancel0 | Cancel/release ngay, chỉ live owner |
| Own cancel partial | Cancel/release, preserve receipts/resolution; không discard money |
| QR failure trước payment | Cancel/release broken attempt; không lock5 phút vô ích; old key không revive |
| Late credit sau terminal request | Giữ tiền/resolution, không open hoặc preempt new owner |
| Account/table/venue unavailable | Terminal cancel pending;0 cancel, positive/late resolution; re-enable cần new request |
| Callback/audit failure trước commit | All DB effects rollback, retry same external identity; không ACK như đã commit |
| Commit thành công, ACK/response mất | Read/replay existing outcome, không double credit/hold/session/audit |
| Cancel response mất | Read own state; stale retry vẫn VERSION_CONFLICT, không fake success |
| Client offline | Provider processing độc lập tab, reload same authoritative state/deadline |
| Worker down | Stale hold vẫn hết quyền, next write terminalize; invalidated hold không revive |
| Overpayment/additional true credits | Excess/flag được giữ;60 phút một lần, không auto extension/refund |
| Provider unavailable | Pending verification, vẫn deadline gốc; không Staff confirm fallback; late money resolution |
| Countdown0 | Giữ ACTIVE facts, initial period ended; không Sprint3 logic |

Proposed fixed BUSINESS actions: TABLE_CREATED, TABLE_UPDATED, TABLE_OPENING_REQUESTED, TABLE_HOLD_CANCELLED, TABLE_OPENING_EXPIRED, TABLE_HOLD_INVALIDATED, PAYMENT_ATTEMPT_FAILED, PAYMENT_RECEIPT_RECORDED, PAYMENT_SUCCEEDED, PAYMENT_RESOLUTION_REQUIRED, TABLE_SESSION_OPENED, TABLE_SESSION_OPENED_MANUAL.
Exact vocabulary/payload cần technical contract approval; không generic engine.
Manual actor từ auth.uid/current DB role, reason required; SYSTEM chỉ trusted expiry/provider/invalidation. Safe before/after IDs/venue/state/amount/deadline/start/version/reason, không credentials/contact/raw bank payload.
Audit failure rollback business effects. Duplicate replay không new transition audit. Frozen SECURITY audit/grants/cutoff giữ nguyên; rejection không success audit.

## 12. Management visibility và module boundaries

Management được đọc table availability, current holds, ACTIVE sessions, payment state/required/received/remaining/excess/unresolved, operational timestamps và safe contact. Manager chỉ assigned venue; CEO/Admin safe global business. Staff default chỉ operations tối thiểu.
OPENING_PAYMENTS_READ gồm unresolved cases; manual extra không cấp finance read. Own read không customer khác. Không provider secrets/raw Auth/unnecessary bank/private fields.
Count distinct requests/sessions; sum unique credits. Nhãn “đã nhận/tiền vượt/khoản cần xử lý”, không final revenue/profit/bill. Accounting business-day policy không chặn minimum operational read.
Initial60 phút kết thúc không charge/close/extend/release; dữ liệu giữ cho Sprint3. Contact/schema/projection/invalidation hook là additive implementation requirements trong preflight; chưa có code.
Notifications chỉ web/app, Telegram Sprint8 và production external channels không required. Future cooldown/rate limit có thể gate acquire trước core transaction, không đổi ownership/payment model; không invent ban/scoring.

## 13. Test matrix —90 implementation requirements, NOT RUN

Giữ70 test IDs cũ, cập nhật expected outcomes theo owner: inclusive deadline, server start, manual override, cancellation và invalidation. Thêm T71–T90.
DB = real PostgreSQL constraints/RLS/RPC/concurrency; API = real Supabase Auth/backend và provider-neutral adapter fixtures; E2E = Playwright Chromium/WebKit với backend thật. Actual provider sandbox/live tests cần authorization riêng; synthetic receipts không là real bank PASS.

| ID | Scenario / layer | Exact expected evidence |
|---|---|---|
| T01 | Two customers same AVAILABLE table simultaneously — DB/API | One committed PENDING/intent/reference; loser unavailable; no loser hold/receipt/success audit. |
| T02 | Many contenders stress acquire — DB/API | At most one winner per table; no orphan payment; retries stable. |
| T03 | Different customers/different tables simultaneously — DB/API | Independent winners; one-hold/customer rule must not become global lock for unrelated customers. |
| T04 | Existing ACTIVE session acquire — DB/API/E2E | DENY even after initial countdown0; no duplicate session. |
| T05 | Existing live pending acquire — DB/API | DENY all other customers/another own key until exact deadline. |
| T06 | Expired pending, sweeper stopped — DB/API | Next acquire can expire old row and acquire atomically; financial case not blocker. |
| T07 | Zero payment expiry with exact-boundary exception — DB/API/E2E | No callback: hold ends at deadline; cleanup after boundary cancels0. Exact-boundary full validated transition stays eligible per T16; expiry must not discard it. |
| T08 | Partial70k at expiry — DB/API/E2E | SessionCANCELLED/paymentPAYMENT_NEEDS_RESOLUTION, ledger70k retained, management instruction, new customer can hold. |
| T09 | 70k then30k before/equal expiry — DB/API/E2E | required100k/received100k/remaining0; one SUCCESS/ACTIVE; started_at is server payment_success_at, not either provider timestamp. |
| T10 |70k partial QR — API/E2E | QR30k, same reference/deadline; amounts clear; not QR100k. |
| T11 | Many partial/reload/QR refresh — DB/API/E2E | expires_at unchanged, no additional300s; timer uses original deadline. |
| T12 | Same settled callback duplicate — DB/API | One receipt/credit, one activation/audit, ACK retry; unchanged versions/start. |
| T13 | Different webhook IDs same bank transfer — API | Still one financial credit; semantic transfer dedupe. |
| T14 | Duplicate transfer changed amount/ref — API | Conflict/quarantine, no overwrite/rebinding/second credit. |
| T15 | Validated full callback processed just before expires_at — DB/API | received_at and serialized transition <= expires_at; one opening, server success timestamp, competitor denied. |
| T16 | Validated full callback received and processed exactly expires_at — DB/API | <= inclusive accepted if hold still owned/PENDING and service/account valid; paymentSUCCESS/sessionACTIVE once. No old strict-< rejection. |
| T17 | Callback just after expiry — DB/API | No ACTIVE; correct financial resolution/availability. |
| T18 | Timely reception but validation/lock processing crosses deadline — DB/API | received_at<= is not a queue reservation; late processing DENY opening, preserve funds/resolution, no stale transaction-start clock. |
| T19 | Expiry/reacquire vs exact-boundary full callback — DB/API | Inclusive equality respected; one serialized outcome; no cancelled+ACTIVE/new-owner overlap and no retro-open. |
| T20 | Bank transfer timestamp before expiry, backend callback received after — API | PAYMENT_NEEDS_RESOLUTION; no open/backdating, preserve funds; bank timestamp cannot bypass received_at deadline. |
| T21 | Late full callback after another customer acquires — DB/API | Original money retained, no preemption/second active/wrong-order credit. |
| T22 | Cancelled0 then late money — API | CANCELLED→PAYMENT_NEEDS_RESOLUTION, no start, preserve receipt. |
| T23 | 120k for100k requirement — DB/API/E2E | Open once if timely/eligible; excess20k retained/flagged for management,60min only, no auto-refund. |
| T24 | More true transfer after SUCCESS — DB/API | Additional unique receipt/excess, no new session/reset timer. |
| T25 | SUCCESS followed repeated callbacks — DB/API | Same original started_at, one activation/success audit; duplicate NO_CHANGE. |
| T26 | 30k(t2) callback before70k(t1) — API | Validated sum100k; start at server first enough-funds transition, not sorted bank threshold time; retain both immutable provider timestamps. |
| T27 | Earlier provider receipt delivered after SUCCESS — API | Add unique true money as applicable; never move started_at backwards, no reset/reopen; reconcile excess without automatic refund. |
| T28 | Same provider timestamp and out-of-order events — API | Provider ordering/tie-break irrelevant to start; same financial identities dedupe, first committed server threshold transition opens once. |
| T29 | Invalid/nonfinal money or inconsistent provider metadata — API | Fractional/negative/non-VND/nonfinal credit not counted; malformed metadata quarantined. Provider time never becomes session start; concrete validation selected separately. |
| T30 | Stale client displayed price — DB/API/E2E | Server snapshot correct; proposed quote version conflict/reconfirm, never trust body amount. |
| T31 | Price changes after successful acquire — DB/API | Pending snapshot100k unchanged; payments use it, not new rate. |
| T32 | Client sends0 amount, SUCCESS, started_at or owner override — API | Ignored/rejected as unauthorized; no open/no wrong owner. |
| T33 | Client forges availability/service/venue — API | Current DB rejects; cross-venue/private table cannot be acquired. |
| T34 | Forged/unsigned callback/browser calls ingest — API | DENY; no trusted receipt/session/audit; no provider secret in client. |
| T35 | Signed wrong recipient/currency/nonfinal status — API | No credit/activation; secure recorded diagnostic as applicable. |
| T36 | Paid event credited to wrong order attempt — DB/API | Exact immutable ref binding; transfer cannot satisfy different order/table. |
| T37 | Same transfer assigned twice across orders — DB/API race | Unique transfer constraint gives at most one linked credit; no second opening. |
| T38 | Unknown reference valid incoming money — API | Restricted unmatched receipt preserved; no approximate allocation/opening. |
| T39 | Acquire commit succeeds, response lost — API/E2E | Retry same key yields same session/deadline/reference; exactly one request. |
| T40 | Acquire fails before commit, retry — DB/API | No orphan rows/audit; same key can create once. |
| T41 | Same key changed payload/cross-owner guessed key — API | IDEMPOTENCY_CONFLICT/authorizationDENY; no data exposure. |
| T42 | Retry same key after expiry — API | Returns terminal old result; never reset/reuse hold/reference; deliberate new request separate. |
| T43 | Callback commit succeeds, ACK lost — API | Replay accepted once, no new amount/session/audit. |
| T44 | Callback DB/audit failure — DB/API | Entire receipt/payment/session/version transaction rolled back; retry can succeed once. |
| T45 | Expiry audit failure, scheduler outage — DB/API | No partial persisted expiry mutation; logical hold still ended, next acquire safely retries transaction. |
| T46 | Deadlock/serialization/connection failure — DB/API | Bounded same-key retry; no double commit/financial credit; no false success. |
| T47 | ADMIN/CEO/MANAGER manual override — DB/API/E2E | Reason/preview/CAS/audit, scoped Manager; opening_methodMANUAL, start server transition,60min immediately; no paymentSUCCESS/receipt. |
| T48 | STAFF without extra/USER/HR label only manual — API/E2E | DENY; no role inference/grant/default write. |
| T49 | STAFF granted fixed manual extra — API/E2E | Allowed assigned ACTIVE venue only; no finance/directory/security privilege implied. |
| T50 | MANAGER/extra STAFF cross-venue manual — API | DENY even with known table/profile IDs; no target leak. |
| T51 | AccountDISABLED/membershipINACTIVE/revoked old session manual — API | DENY using frozen cutoff; new relogin current rights; refresh old session no bypass. |
| T52 | Permission revoked between preview and confirm — API/E2E | DB denial, no opening/success audit; clear protected UI. |
| T53 | Manual vs acquire/full payment concurrently — DB/API | Same table serialization, at most one owner; no preempt pending hold. |
| T54 | Missing/stale bigint expected_version manual/table config — DB/API | VERSION_CONFLICT; no mutation/version/success audit; timestamp equality irrelevant. |
| T55 | Manual network retry/same command — API/E2E | Same session/actor/reason/outcome; no second audit/start. |
| T56 | Table/venue service disabled acquire — API | DENY; occupancy separate; pending invalidation releases hold without closing existingACTIVE. |
| T57 | Account/venue/table unavailable before full transition — DB/API | 0 normal cancellation; partial/late money preserved PAYMENT_NEEDS_RESOLUTION; no opening; frozen identity/cutoff unchanged. |
| T58 | Public/own/internal projections — DB/API/E2E | No other customer's sessions/payments/contacts; Staff minimum; Manager venue; CEO safe business. |
| T59 | Direct writes/receipt delete/audit forge/definer direct call — DB/API | DENY incl authenticated Admin where not authorized; no broad auth access. |
| T60 | Integer overflow/high amount/no floating arithmetic — DB/API | Safe reject/rollback; no wrapped price/sum/remaining; preserve event diagnostic. |
| T61 | Reload/time skew/background sleep/check-in — API/E2E | Same started_at; countdown recomputed from authority; no60min reset. |
| T62 | Initial60min reaches0 — DB/API/E2E | Show initial period ended; retainACTIVE/occupancy forSprint3, no extra charge/extend/settle/close/release. |
| T63 | Countdown60:00→59:59 and partial balances — E2E | First committed server start only; readable320/390/1440px; UI delivery delay reflects elapsed server time, not reset/backdate. |
| T64 | Provider replay/reconcile after downtime — API/provider sandbox later | Stable external identities, retained receipts; after-expiry no retro-open; no mark-paid shortcut. Synthetic adapter tests are not actual-provider PASS. |
| T65 | Full frozen Sprint1 regression — real CI |78 DB/27 API/3 unit/54 existing Playwright retained or intentionally expanded, all required PASS. |
| T66 | Scope/secrets/dependency/type/lint/build — CI | Exact approved Sprint2 preflight implementation allowlist, secret scan/audit/typecheck/lint/build PASS; frozen core/Legacy review. |
| T67 | CEO counters vs received amounts — DB/API/E2E | Distinct sessions/receipts, unresolved/excess separate; no misleading revenue. |
| T68 | Reversal/chargeback notice afterACTIVE — API/design boundary | Retain normalized evidence/flag for authorized management; no automated reversal/refund/close/reopen inSprint2. |
| T69 | Reusing cancelled/resolution money for new request — API | No revived hold or transfer rebind; new attempt has new reference and no borrowed prior credit. |
| T70 | Client/provider timestamp tampering or wrong order hint — API | Client cannot define callback_received_at/payment_success_at/started_at; trusted exact ref resolves identity, wrong hint/reference conflict rejected/quarantined. |
| T71 | Own cancel before any credit — DB/API/E2E | CANCELLED request/payment, immediate release, no start; authenticated owner only. |
| T72 | Own cancel after partial credit — DB/API/E2E | Release/cancel request; PAYMENT_NEEDS_RESOLUTION, receipts retained and configured management contact shown. |
| T73 | Cancel racing full payment — DB/API | One serialized result: cancellation wins→resolution/no-open; full transition wins→ACTIVE, cancel-pending endpoint denied, no Sprint3 close. |
| T74 | Cancellation followed by late/duplicate callback — API | Unique money retained independently; no revival/double credit/new customer preemption. |
| T75 | Same customer acquires two different tables concurrently — DB/API | Exactly one global live hold/customer; second denied; per-customer unique/serialization proof. |
| T76 | Expired old hold on tableA, same customer requests tableB — DB/API | Lazy expire old hold, acquire new once, immutable separate references; no expired-row unique-index permanent block. |
| T77 | Same customer repeated keys/tabs/requests — DB/API/E2E | No parallel live holds; same-key replay returns existing; different keys do not bypass limit. |
| T78 | MANUAL walk-in opening — DB/API/E2E | NULL customer FK only forMANUAL, actor/reason/venue mandatory/audited, no syntheticAuth/profile, no public/anonymous own access. |
| T79 | MANUAL authenticated customer target — DB/API/E2E | Existing profile safely verified; actor distinct from beneficiary; own/customer and management scope correct, no full customer-directory exposure. |
| T80 | Management contact configuration/projection — DB/API/E2E | Safe configured business contact, no personal hardcode/HTML injection/private leak; own unresolvedcase and venue scope work, frozen disabled-account DENY intact. |
| T81 | QR generation fails before0-payment hold — DB/API/E2E | Cancel/releases immediately, no stalled5min; retry old key never recreateshold, new attempt separate. |
| T82 | QR failure races partial/full credit — DB/API | Preserve true receipts; failed/cancelled pending→resolution; committedACTIVE never closed/overwritten by delayed QR error. |
| T83 | Raw timely HTTP arrival, verification finishes after expiry — API | No opening based on early unverified arrival; validatedprocessing<= required, money preserved if later verified. |
| T84 | Out-of-order very old provider timestamp — API | started_at always server threshold time; later old metadata cannot reduce start/reset60min. |
| T85 | Notification scope — E2E/static review | Web/app statuses/messages only; no Telegram or required external production notification dependency. |
| T86 | VND snapshot/fees and price change — DB/API | Integer60minrate, no added tax/service/transfer fees, same holdoldprice/newholdnewprice; nevertrustclient money. |
| T87 | Cancel missing/stale expected_version — DB/API/E2E | Reject/rollback, including a new partial receipt after preview: payment version changes, reload balances. Lost response uses authoritative read; no fake success/duplicate audit. |
| T88 | Account/table/venue invalidation0 and partial — DB/API | Durable cancel/release, partialfinancial case retained; callback honors current invalidation; audit atomicity and no old1Asecurity relaxation. |
| T89 | Disable then re-enable before worker runs — DB/API | Previously invalidated hold never resurrects; only new request/reference may acquire; existingACTIVE notauto-closed. |
| T90 | Unresolved management read across roles/venues — DB/API/E2E | ADMIN/CEO global safe business; Manager assigned only; STAFF default/USER otherdataDENY; manual-extra does not grant fullfinance/provider/raw Auth. |


Boundary tests: just-before/exact/just-after với real DB timestamp semantics được kiểm soát, receipt khác processing, queued verification/lock wait và new ownership; không fake browser clock hoặc flaky sleeps.
Race tests dùng independent transactions/users: một customer/hai tables, hai customer/một table, cancel/expiry/full/manual/unavailability. Chứng minh persisted rows/versions/receipt binding/audit, không chỉ HTTP code. RLS allow/deny dùng real ordinary user JWT, không service-role.
Full Sprint1 security regression giữ hoặc intentionally expand/scope dưới approved CI contract; không bỏ assertion để lấy PASS. “Exactly4” là Sprint1 baseline, không tự bỏ hoặc mặc định cấm thêm approved Sprint2 entities mãi mãi. Provider tests NOT RUN được báo riêng.

## 14. Những quyết định đã đóng và phần thực sự còn mở

### Original16 questions — owner resolution

| Old ID | Status after review | Remaining classification |
|---|---|---|
| O01 deadline | CLOSED: <= inclusive, timely validated processing | Không business question |
| O02 late callback | CLOSED: no retro-open, preserve resolution | Không business question |
| O03 timestamp/order | CLOSED: server atomic transition, provider time evidence | Không completeness/backdating blocker |
| O04 manual funding | CLOSED: authorized audited override, no fake paid | Later settlement Sprint3+ |
| O05 money/price | CLOSED: integer VND, hourly60-minute snapshot, no added fee | Không business question |
| O06 overpay | CLOSED: excess retained/flagged, no extra time/refund | Refund action Sprint3+ |
| O07 unavailable | CLOSED: cancel/release/preserve money, no open | Safe additive implementation B3 |
| O08 provider | Neutral interface DECIDED; specific provider NOT SELECTED | P1–P3 non-blocking neutral core |
| O09 manual scope/target | CLOSED: venue-bound existing customer/walk-in support | CLOSED B2: nullable MANUAL customer ownership, không identity change |
| O10 countdown0 | CLOSED: preserve facts, no charges/auto-close | Billing Sprint3+ |
| O11 cancel/QR/limits | CLOSED: cancel, safe QR failure, one hold/customer | Không business question |
| O12 recovery/messages | CLOSED: DB correctness independent worker, web/app | Cadence/tuning technical detail |
| O13 visibility | CLOSED: operational management projections/scoped Manager | Final revenue/business-day Sprint3+ |
| O14 entities/permission/CI | Four entities/manual fixed permission DECIDED | CLOSED B1: exact preflight required, conditional authorization granted |
| O15 QR/contact | CLOSED: stable reference, remaining QR, config contact, no fee | CLOSED B2: minimal venue business contact; provider format P2 |
| O16 abuse | CLOSED: one customer/table hold,5min, no extension | Future cooldown later approval |

### A. Implementation blockers — CLOSED by owner, subject to technical preflight

| ID | Status | Binding resolution |
|---|---|---|
| B1 | CLOSED | Owner approves contract and conditionally authorizes a new implementation branch from current main after exact plan/allowlist/CI/test mapping. No real provider, production or Sprint3. |
| B2 | CLOSED | MANUAL customer_profile_id may be NULL for walk-in; opened_by/reason/venue/table/server time/audit mandatory. No synthetic profile/Auth/CRM. Existing venue projections inspected: public_address is not business contact; minimal nullable public venues.management_contact plus separate safe Sprint2 projections and Sprint1 regression permitted. |
| B3 | CLOSED | Database exclusive hold/customer/session guards, deterministic row locks, live authoritative expiry checks and durable pending invalidation. No occupancy flags or worker/browser correctness dependency. Exact compatible locking and additive hooks must be defined in preflight. |

No remaining business implementation blocker. A material change to frozen Sprint1 identity/auth/security/RPC authority discovered during preflight or implementation remains a STOP condition; this is not permission to rewrite security.

### B. Provider-dependent, không chặn contract/neutral core

| ID | Chưa chốt | Boundary |
|---|---|---|
| P1 | Provider/bank/merchant account, authentication/finality/immutable IDs/replay/recipient-reference capabilities | Verify official capabilities trước integration riêng; không invent webhook fields. |
| P2 | QR format/generation/reference encoding/limits, old QR behavior và provider fee metadata | Full/remaining/no-added-fee đã fixed; actual adapter chọn sau. |
| P3 | Actual provider sandbox/production credentials, delivery/replay SLA và reversal evidence | Neutral fixtures không live bank PASS; live integration/payment/production claim cần approval/tests riêng. |

Provider ordering/completeness không còn chặn session start; server transition là authority. Provider outage không kéo dài hold.

### C. Sprint3+ — không phải Sprint2 blockers

| ID | Decision deferred |
|---|---|
| S1 | Continuation/extension/overtime, close authority/rounding/final bill/receipt và manual override settlement |
| S2 | Refund/excess resolution, financial case close, allocation/correction, reversal/chargeback automation |
| S3 | Accounting revenue/business-day reporting, audit retention/production operations và physical end-of-period procedure trước full production lifecycle |
| S4 | Optional cooldown/rate limits; Telegram/external notifications và modules tương lai theo Sprint riêng |

Không thêm USER manual-extra/HR role/guest Auth identity/free-tier pricing. Future business rules cần owner quyết định riêng.

### Existing gates

G3 prepaid CLOSED; G4 amount/currency/authority CLOSED, provider choice riêng; G5 duration/cancel/late/boundary CLOSED; G6 snapshot/server start CLOSED; G7 minimum operations visibility CLOSED, accounting deferred. G8 billing Sprint3; G9–G14 unchanged future modules/production. Không sửa frozen Blueprint/OPEN_QUESTIONS snapshots trong tác vụ này.

## 15. Validation, freeze và implementation boundary

- 15 numbered sections; 36 unique consecutive invariants; original 28 retained/owner-corrected.
- 90 unique consecutive contract test cases; provider-specific live evidence explicitly deferred, never represented as neutral-fixture PASS.
- All 16 original owner decisions and latest walk-in/contact/durable-lock decisions incorporated. B1–B3 CLOSED; P1–P3 non-blocking provider-dependent; S1–S4 deferred.
- customer_profile_id NULL allowed only MANUAL; mandatory opened_by/reason/server start/audit; no fake identity or CRM.
- Minimum public venue contact extension, fixed manual permission, safe additive invalidation and exact CI scope must be documented before code. Frozen Auth/session cutoff/role/scope/audit/CAS guarantees remain mandatory.
- Document checks are not runtime evidence. All 90 runtime cases remain NOT RUN at this freeze.
- Approved business semantics cannot be changed during implementation without owner authorization. No real provider integration, production deployment or Sprint3.

**APPROVED / FROZEN FOR IMPLEMENTATION.** Owner conditionally authorizes implementation after exact preflight only if no material broadening of frozen Sprint1 architecture/security is needed. Otherwise STOP / BLOCKED and report the exact change.
