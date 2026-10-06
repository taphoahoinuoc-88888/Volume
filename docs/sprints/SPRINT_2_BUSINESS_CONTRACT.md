# VOLUME V2 — Sprint 2 Business Contract
Version: DRAFT 1 — OWNER REVIEW REQUIRED  
Date: 2026-10-06 (Asia/Bangkok)  
Frozen base: main `2b47f0a619f494a811c94e41697f7d09dcb19e3a`  
Status: DOCUMENT ONLY. Sprint 1 CLOSED/FROZEN. Sprint 2 implementation NOT AUTHORIZED.

## 1. Authority, scope và cách đọc

Nguồn quyết định: chỉ dẫn owner hiện tại → AGENTS → Blueprint → permissions → architecture → ADR → Sprint contract. Đã đọc các tài liệu trên frozen main. Header Sprint0/authorization cũ trong tài liệu freeze là historical snapshot, không thay chỉ dẫn owner hiện tại. Không sửa chúng trong tác vụ này.

Đây là đề xuất contract, không là migration/schema/RPC/UI triển khai. Các mục **OWNER DECIDED** đã chốt; **PROPOSED** cần owner duyệt cùng contract; **OPEN** chưa có quyết định và không được thay bằng giả định khi implement. Tên entity/state/permission dưới đây là đề xuất tối thiểu; chưa thêm vào database hoặc Blueprint.

Exact DOCUMENT-ONLY file allowlist của tác vụ: `docs/sprints/SPRINT_2_BUSINESS_CONTRACT.md`. Không sửa file Sprint1, AGENTS, Blueprint, permissions, architecture, ADR, CI, dependency, source hoặc Legacy. Không merge document branch vào main trong tác vụ này.

### Included khi owner authorize implementation sau này
Định nghĩa bàn và trạng thái phục vụ; suy availability từ phiên; mở yêu cầu thanh toán giữ bàn 5 phút; QR phần còn thiếu; tích lũy khoản tiền đã nhận; tự ACTIVE sau đủ tiền; started_at theo sự kiện tiền thành công; countdown 60 phút; read operational scoped và manual-open nếu owner chốt exception đủ rõ.

### Excluded
Đóng phiên, tính/chốt hóa đơn, tiền giờ thêm, gia hạn thời gian chơi, tự trả bàn khi 60 phút hết, receipt cuối, auto refund/complex refund, Player/Match/Video/Tournament/Shop/Telegram/CRM/AI, invitation, sản phẩm Sprint3+. Không chọn/tích hợp provider, không deploy production/SMTP/domain trong tác vụ DOCUMENT-ONLY này.

## 2. Business rules — OWNER DECIDED

| Rule | Contract |
|---|---|
| Minimum | Trả trước 100% tiền tối thiểu, tương ứng 60 phút. Rate100.000 VND/giờ → required100.000 VND. Không coi đây là tiền cọc. |
| Acquire | Khách chọn AVAILABLE và bắt đầu payment flow: database nhận quyền giữ bàn, thời hạn đúng5 phút từ thời điểm acquire thành công trên DB. Chỉ xem/chạm vào thẻ bàn không tự tạo hold. |
| Exclusivity | Chỉ một pending request/payment intent giữ một bàn. Không booking/order khác được acquire trong window. Backend enforce cạnh tranh. |
| Full payment | Cumulative verified received >= required: payment SUCCESS, session ACTIVE tự động, không nhân viên/admin xác nhận; timer bắt đầu ngay từ authoritative success-event timestamp. |
| Time | started_at không phải created_at của QR, không phải thời điểm khách đến/check-in. Minimum prepaid duration60 phút. |
| Zero expiry | Đến hạn nhận0: cancel pending request/intent, trả lock, available trở lại. |
| Partial | Hiện required/received/remaining. QR amount=remaining; giữ deadline ban đầu, không kéo dài do partial. |
| Partial expiry | Nhận>0 nhưng thiếu: không ACTIVE; trả bàn ngay; payment NEEDS_RESOLUTION độc lập, giữ đủ lịch sử nhận tiền; hướng dẫn liên hệ quản lý. |
| Separation | Tình trạng bàn và tình trạng thanh toán là hai khái niệm khác nhau. Unresolved payment không giữ bàn. |
| Manual | STAFF không có mặc định. ADMIN/CEO/MANAGER và người được cấp fixed permission phù hợp mới có thể mở thủ công. HR không là role. |
| Authority | Không tin giá/amount/success/started_at/ownership/availability do client gửi. Price server-derived và snapshot; callback verified, idempotent; một tiền nhận không dùng cho nhiều order/bàn. |
| Sprint boundary | Không giải quyết đóng phiên, overtime hoặc tự gia hạn trong Sprint2. |

## 3. Luồng khách và UX contract

1. Khách xem bàn theo venue được công bố: nhãn bàn, giá tối thiểu60 phút, availability. Public projection không có khách đang chơi, profile/session IDs, payment details.
2. Bấm “Thanh toán để mở bàn”. Backend atomically kiểm tra quyền, service, current rate, availability và acquire. Khi thành công mới hiển thị QR/deadline.
3. Trang chờ hiển thị: “Cần thanh toán”, “Đã nhận”, “Còn thiếu”, “Bàn được giữ đến…”, countdown còn lại. Ví dụ100.000/70.000/30.000. Reload/tab khác lấy cùng order và deadline; không acquire lại.
4. Nhận partial: updated QR chỉ30.000; QR cũ có thể đã được ngân hàng xử lý nên không giả định nó bị vô hiệu. Không đổi reference của payment đang chờ.
5. Đủ tiền trong window hợp lệ: tự chuyển “Bàn đã mở”, hiển thị bắt đầu và countdown60 phút. Không có nút “Tôi đã chuyển tiền” đánh dấu success.
6. Hết hạn0: “Hết thời gian giữ bàn. Bàn đã được trả lại.” Không tự retry acquire; chọn lại là một request mới.
7. Hết hạn partial/late/unresolved: “Bàn chưa được mở. Đã nhận X, cần liên hệ quản lý để xử lý khoản thanh toán.” Ghi rõ bàn đã được trả lại; financial reference vẫn xem được ở own history.
8. Network/provider delay: “Đang kiểm tra khoản thanh toán” khác “Đã nhận”/“Thất bại”. Không dạy khách trả thêm khi chưa đối soát trạng thái hiện tại; client không suy success từ QR app return URL.
9. Staff chỉ bảng trạng thái vận hành trong venue: bàn chờ/mở/không phục vụ và thời điểm timer cần thiết. Không mặc định thấy khách khác, contact, số tiền hoặc bank transaction.
10. Manager chỉ venue scope; CEO global business overview. Chỉ hiển thị metrics được định nghĩa, không gọi tiền nhận là doanh thu.

## 4. Proposed minimal entities — design only

**PROPOSED: 3 business entities + 1 immutable financial receipt ledger.** Không tạo riêng reservation + booking + order + intent + pending_session + financial_case cùng giữ một việc.

| Entity | Responsibility / proposed data | Không được giữ |
|---|---|---|
| billiard_tables | venue_id, code/label, status ACTIVE/MAINTENANCE/DISABLED (service state only); current hourly rate_vnd; created_at/updated_at; version bigint NOT NULL DEFAULT1, positive. Unique venue/code; DB-generated id. | Busy/free/pending state, current customer, duplicated lock flag/counter. |
| table_sessions | Đồng thời là open-table request/order khi PENDING_PAYMENT; trở thành cùng session khi ACTIVE. id, venue_id/table_id, owner_profile_id, state, acquired_at, expires_at, required_amount_vnd/rate snapshot, prepaid_minutes=60, started_at nullable, cancelled_at/reason, opening_source PAYMENT/MANUAL, actor/reason cho manual; request_actor_profile_id/request_key/command_digest cho retry; version. | Tách booking/order chứa lại ownership/deadline/rate; started_at do client; CLOSED/overtime/bill logic Sprint3. |
| payments | Một initial payment intent cho session PAYMENT; unique session_id, server payment_reference, required_amount_vnd snapshot hoặc authoritative session snapshot reference, state WAITING/SUCCESS/CANCELLED/NEEDS_RESOLUTION, success_at nullable, resolution reason/flag, version. Sống lâu hơn lock; cancelled session không xóa payment. | Table ownership/lock, “payment confirmed by Staff”, completed refund/billing/settlement engine. |
| payment_receipts | Append-only accepted money receipts: provider/merchant key, immutable transfer identity, exact order/payment reference, payment_id nullable khi unmatched, integer amount/currency, settled_at, verified receipt/event digest, ingestion_at. Unique financial transfer across toàn hệ thống. | Auth credentials, full bank statement/raw callback mặc định, user-editable credits, generic event bus/inbox engine. |

Đề xuất required amount có **một snapshot authority** tại table_sessions; payments tham chiếu session snapshot thay vì duy trì một required amount có thể lệch. Nếu provider cần amount trong intent request, đó là derived outgoing payload, không một giá mới. Trong bảng trên trường payment required snapshot là lựa chọn storage cần chốt technical contract, ưu tiên FK tới snapshot.

Received là tổng receipt CREDIT đã được verify và gắn đúng payment; remaining=max(required-received,0); excess=max(received-required,0). Ưu tiên tính từ ledger, không một cột received có thể client cập nhật. Query performance cache nếu thật sự cần phải được chứng minh và nằm trong approval sau, không mặc định thêm.

Session retains rate/minimum snapshot even if current table rate changes. proposed VND integer bigint, không floating point, không currency conversion/discount/tax/pricing-band engine. Giá100.000 chỉ example, không seed/rate mặc định. Bàn chưa có giá hợp lệ không được bán; VND-only/positive rate cần owner duyệt ở O05.

No new identity, no role ở session/payment, no player profile. profiles.id remains auth.users.id. Immutable receipt/audit không cần version; mutable table/session/payment dùng version bigint NOT NULL DEFAULT1, positive; updated_at chỉ timestamp. Hủy là terminal cho opening request; cùng payment/session đã hết hạn không được tái dùng để giữ bàn mới.

### Blueprint fit và additive proposals cần duyệt
- Giữ billiard_tables.status chỉ là khả năng phục vụ; occupancy luôn derived từ table_sessions.
- Dùng chính PENDING_PAYMENT session làm order/hold tránh thêm orders/reservations/locks table; payment vẫn independent.
- Blueprint chưa có approved Sprint2 state/schema. Duyệt contract này trước schema.
- New fixed permissions/audit actions/extra whitelist chỉ là design. Existing frozen whitelist có2 extras, chưa chứa TABLE_SESSION_OPEN_MANUAL: cần **explicit approved additive permission extension** trong implementation contract, không chỉnh old migration hoặc sửa 1A âm thầm.
- Callback secret adapter ở Supabase Edge Function + dedicated narrow DB ingestion, cùng core, không API server/microservice/database khác.
- Chưa duyệt thêm floor entity, dynamic tariff, multiple simultaneous initial intents, hoặc generic financial resolution module.

## 5. State machines — PROPOSED, bám owner rules

### 5.1 Table service và derived occupancy

Service: ACTIVE ↔ MAINTENANCE/DISABLED theo authorized management action; không dùng service state để biểu diễn bận/rảnh.

Derived occupancy:
- PLAYING: tồn tại ACTIVE session.
- PENDING: không có ACTIVE và có PENDING_PAYMENT session còn hold hợp lệ.
- AVAILABLE: không ACTIVE, không pending hold còn hợp lệ, service ACTIVE và venue bán được.
- UNAVAILABLE_FOR_SERVICE: service/venue không bán được; **không xóa/che việc vẫn có occupancy**.

Expose service_status (safe alias của billiard_tables.status) và occupancy riêng; không lưu thêm service/occupancy copy. Một bàn có thể MAINTENANCE nhưng vẫn có historical/active session; availability không cho acquire thêm. User-safe projection không cần private identifiers.

| From → to | Trigger | Condition |
|---|---|---|
| AVAILABLE → PENDING | acquire committed | Exactly one winner; new5-min DB deadline |
| PENDING → PLAYING | full verified eligible payment | Auto-activate single session atomically |
| PENDING → AVAILABLE | deadline reached | Partial/zero đều mất lock, financial state độc lập |
| AVAILABLE → PLAYING | authorized manual open | Chỉ sau O04 được chốt; không preempt another hold |
| PLAYING → … | Không có transition release trong Sprint2 | Đóng/trả bàn thuộc Sprint3; timer0 không release |
| AVAILABLE → UNAVAILABLE_FOR_SERVICE | approved service/venue change | Không acquire |
| UNAVAILABLE_FOR_SERVICE → AVAILABLE | service ready and no live occupancy | Không khôi phục hold cũ |

### 5.2 Booking/open-table order = table_sessions

Only3 Sprint2 states: PENDING_PAYMENT, ACTIVE, CANCELLED. Không thêm DRAFT/QR_GENERATED/PAYING/PARTIAL/EXPIRED như persisted session states; QR/errors/partial là projections.

| Transition | Effect |
|---|---|
| Create PENDING_PAYMENT | Snapshot rate/required, owner=auth.uid, acquire/deadline; started_at NULL |
| PENDING_PAYMENT → ACTIVE | PAYMENT only: verified sufficient eligible credits; set started_at once; payment SUCCESS |
| PENDING_PAYMENT → CANCELLED | Expiry; cancelled effective_at=expires_at, không started_at; release hold |
| Create ACTIVE via manual | Only approved exception; reason, actor, funding semantics O04; no fake receipt/SUCCESS |
| CANCELLED → ACTIVE | NEVER; late credit does not revive cancelled request |
| ACTIVE → another state | Sprint3, not Sprint2 |
| ACTIVE → ACTIVE retry | Return existing outcome, no second session, no reset timer |

Expired partial is CANCELLED session + NEEDS_RESOLUTION payment, not a new “financial session state”.

### 5.3 Payment

WAITING covers0 or partial before deadline. PARTIAL là received projection, không additional stored state.

| Transition | Condition / effect |
|---|---|
| Create WAITING | Initial intent; one stable reference; not yet paid |
| WAITING → SUCCESS | Eligible cumulative threshold reached; same DB transaction opens session |
| WAITING → CANCELLED | Expiry and0 received |
| WAITING → NEEDS_RESOLUTION | Expiry with0<received<required; release session |
| CANCELLED → NEEDS_RESOLUTION | Valid late money reaches ended request; retain receipt; no opening |
| NEEDS_RESOLUTION → NEEDS_RESOLUTION | More late valid credits; accumulate history, no lock/reopen |
| SUCCESS → SUCCESS | Duplicate or additional actual credit; never reset/start second session |
| NEEDS_RESOLUTION → RESOLVED/REFUNDED | Not in Sprint2; authorized later workflow not designed/implemented here |

**PROPOSED overpayment:** received>=required pays initial minimum exactly once; excess recorded as amount needing management resolution independent of session. Keep payment SUCCESS for the valid opening; expose resolution_required/excess derived fields, not SUCCESS→NEEDS_RESOLUTION reopening/reset. Excess does not purchase extra minutes, future orders or entitlement. O06 must approve.

SUCCESS is never assigned from forged client/manual intent. Provider delivery/verification failure is not payment “FAILED”: received money may still exist. No automatic permanent FAILED state merely because webhook unavailable.

## 6. Time contract và expiry boundary

OWNER DECIDED: hold exactly300 seconds, prepaid3600 seconds. Timestamps server-authoritative UTC timestamptz; venue timezone chỉ display.

PROPOSED pending interval: [acquired_at, expires_at), with expires_at=acquired_at+300 seconds. At exactly expires_at, expiry wins; partial never changes these values. “Before expiry” means strict<, not <=. Owner approve O01.

Use DB decision_time sampled **after lock acquisition**, not client clock, not transaction-start timestamp sampled before a long lock wait. Define decision point once within short serialized transaction. No provider network call while holding table/authorization locks.

PROPOSED auto-open eligibility requires:
1. Current session still PENDING_PAYMENT and holds this table.
2. decision_time < expires_at.
3. Verified credit(s) settled at eligible provider timestamps < expires_at, correct payment/currency/recipient.
4. Cumulative eligible credits >= required.
5. Service/venue/owner safety checks chosen in O07 remain satisfied.
6. Atomic receipt/threshold/session/payment/audit commit.

If decision wins before deadline but commit completes slightly after it, its lock serializes contenders; exact semantics is DB decision-point ordering. No promise that a client observes response before deadline. Keep transaction short; crash before commit means no winner.

**OPEN — critical:** provider may say money settled before deadline but deliver callback after expiry/release/reassignment. Owner has not chosen this case. Recommendation: record valid funds as NEEDS_RESOLUTION, **never revive old session or preempt new owner**. This prioritizes exact5-min release and current ownership; it means timely bank settlement alone does not guarantee opening if receipt arrives too late. If owner wants settlement time alone to decide, a separately approved bounded provider verification/grace policy is necessary and would conflict with unconditional exact5-min lock. Do not silently introduce grace/extend lock. O02 blocks callback implementation.

### Authoritative started_at / out-of-order timestamps

Proposed authoritative success-event timestamp is the timestamp of the **unique settled transfer that makes cumulative eligible credits cross required**, not adapter HTTP receipt time/QR/client time.

For an authoritative ordered receipt set, sort by (settled_at, provider_sequence or stable transfer identity tie-break), find first cumulative crossing and use that settled_at. Store success_at/started_at together once. Provider must guarantee stable settled timestamps, transfer IDs and an adequate completeness/order policy. Event callbacks can arrive out of order; semantic proof must include:
- reordered already-known credits: same eligible sum and threshold result;
- late earlier credit after SUCCESS: no reset or re-open;
- if a delayed earlier receipt would imply a different threshold timestamp: do not silently rewrite started_at; flag reconciliation and apply owner-approved O03 policy.

Cannot guarantee both “open immediately on first locally sufficient callbacks” AND “started_at equals globally earliest threshold using receipts not yet delivered” without a provider completeness/order guarantee. This is an explicit product/provider decision, not assumed solved by sorting. O03 blocks authoritative timestamp implementation.

Countdown=max(0,3600 - elapsed_from_started_at), display60:00 at start then59:59 after1 second, never award an extra60 minutes per refresh/late callback. If callback arrives after settled_at but before expiry, initial display may already be59:xx. Accurate event time wins over forcing a fresh59:59; UI explains paid/start time. Browser skew/reload/sleep cannot alter backend started_at. Display rounding/tick policy proposed; no bill rounding here.

At00:00: prepaid display reaches0; do not extend/purchase/charge extra or CLOSE/release automatically. Retain ACTIVE occupancy until Sprint3 closing exists. Physical operational handling at60min remains O10. Sprint2 alone is not approved for production operation of a full session lifecycle.

## 7. Exact invariants

All below require automated proof at implementation; design review does not certify runtime.

| ID | Invariant |
|---|---|
| I01 | Per table, at most one live hold or ACTIVE session; they cannot overlap, including manual vs payment. |
| I02 | Database claims, not client availability display, decide the winner. |
| I03 | Deadline immutable acquired_at+300s; QR refresh/partial/retry never extend it. |
| I04 | No active hold after logical deadline; cleanup/scheduler failure cannot retain table ownership. |
| I05 | Customer-owned session created by authenticated live identity; client owner/profile/venue/price overrides rejected. |
| I06 | Service state is not busy/free; availability derived only from service/venue and session occupancy. |
| I07 | Snapshot required=server-derived60-minute minimum; current rate change cannot silently mutate existing intent. |
| I08 | Payment receipt counted only after signature/authenticity, recipient, currency, immutable transfer identity, exact reference and status checks. |
| I09 | Each real transfer globally credited at most once, to at most one payment; multiple event IDs for one transfer are not multiple credits. |
| I10 | Payment SUCCESS eligible only at sufficient cumulative verified amount; no Staff/Admin confirmation/client return URL. |
| I11 | Full-payment transition: receipt inclusion + paymentSUCCESS + sessionACTIVE + started_at + audit atomic; failed audit rolls back all DB effects. |
| I12 | Each opening request has at most one initial payment intent and exactly one stable payment reference; retries return it. |
| I13 | Successful event opens at most one session; repeated callbacks never reset started_at or buy extra time. |
| I14 | Pending started_at NULL; ACTIVE from payment uses approved authoritative threshold timestamp, once. |
| I15 | Expired partial session not ACTIVE; payment stays independently unresolved; new customer may acquire table. |
| I16 | Zero-expiry cancel does not delete history; late credit is retained without reviving cancelled session. |
| I17 | Received/remaining/excess derived from immutable credits, integer arithmetic, no floating point or negative remaining. |
| I18 | Financial unresolved case never owns a table; success excess does not extend session. |
| I19 | Staff no default manual-open; HR label irrelevant; eligible fixed extra is scoped, live and revoked by existing cutoff contract. |
| I20 | Manager cannot act/read across venues; CEO manual write is only this explicitly approved action, no security/config authority inference. |
| I21 | DISABLED account and INACTIVE membership retain distinct effects; no callback ban/direct Auth session edits. |
| I22 | Sensitive operator writes require fresh preview/diff/reason/confirm and bigint expected_version; stale/missing rejects, no success audit. |
| I23 | Internal automatic events serialize under locks/constraints; not client CAS version, no service-role proof of RLS. |
| I24 | All successful mutable row changes increment version atomically; append-only receipts/audit immutable; duplicate/no-change does not increase versions/audit. |
| I25 | No direct client table/session/payment/receipt/audit mutations; no broad Auth SELECT/client secret. |
| I26 | Unknown extra/actions, malicious metadata and forged SYSTEM actor never grant access. |
| I27 | Timer0 neither closes/releases nor creates overtime billing in Sprint2. |
| I28 | No hard-delete of financial receipts/order/session history; no money transferred/reallocated/refunded automatically. |

## 8. Fixed permissions — PROPOSED

G=global, V=active assigned venue, S=self on customer path, P=public, E(V)=explicit eligible extra in active venue, -=deny. Every private/internal action requires live session/account ACTIVE. Public still safe for anonymous/disabled identities. S applies to any authenticated role using own customer flow, not internal privilege.

| Permission | ADMIN | CEO | MANAGER | STAFF | USER |
|---|---|---|---|---|---|
| PUBLIC_TABLES_READ | P | P | P | P | P |
| OWN_TABLE_SESSION_CREATE | S | S | S | S | S |
| OWN_TABLE_SESSIONS_READ | S | S | S | S | S |
| OWN_OPENING_PAYMENTS_READ | S | S | S | S | S |
| TABLE_OPERATIONS_READ | G | G | V | V(minimal) | - |
| OPENING_PAYMENTS_READ | G | G | V(safe financial projection) | - | - |
| TABLE_DEFINITIONS_MANAGE | G | - | - | - | - |
| TABLE_SESSION_OPEN_MANUAL | G | G(explicit action only) | V | E(V) | - |

No manual permission from STAFF_DIRECTORY_READ or STAFF_MEMBERSHIP_STATUS_MANAGE. New explicit extra TABLE_SESSION_OPEN_MANUAL for STAFF/MANAGER only, preserving existing eligible role model. USER, CEO, ADMIN do not gain arbitrary venue extras; defaults for manual follow owner's explicit decision. If “users explicitly granted” is intended to include ordinary USER, owner must approve a security-model change first; this proposal interprets it as existing eligible staff-membership users (O09).

Only ADMIN via current ACCESS_MANAGE can grant/revoke extra; recipient cannot self-grant. Grant/revoke updates cutoff/audit atomically, old open tab cannot execute manual-open, refresh of old session cannot bypass, relogin current rights. Permission grants require additive whitelist/RPC/constraint/UI vocabulary approval, not generic builder. CEO does not acquire ACCESS_MANAGE/ACCOUNT_STATUS_MANAGE/TABLE_DEFINITIONS_MANAGE/security audit by owning manual-open.

OPENING_PAYMENTS_READ does not authorize refunds or manual success. Provider ingest is **not** a role/default/extra permission a browser account can receive. Dedicated server trust path calls narrowly scoped ingestion; ADMIN browser cannot forge receipt.

Field boundaries:
- Public: table label/id/venue, public quoted minimum and availability; no hold owner/private timing IDs.
- Own: own request/deadline/price, amounts and resolution message; normalized receipt amount/time if needed, never raw bank payload or other customers.
- Staff operational: table state/own venue/session timer; no customer's profile/name/contact/payment/reference/financial history by default.
- Extra-manual Staff: only fields needed to perform approved opening/preview, not branch-wide finance/customer-directory grant.
- Manager: scoped operational and approved minimum payment/resolution projection; no Auth contacts/full ledger payload/security audit.
- CEO: global business projection/aggregates as approved; no raw bank credentials/unredacted payload.
- Admin: safe management projection; no direct client Auth schema access.

Manual prerequisites: service ready + no hold/active + live permission/venue + server price/context + preview/diff/reason/confirm + expected table.version + request idempotency. Manual action cannot convert someone else's partial payment into SUCCESS, steal5-minute hold or erase debt. Funding and beneficiary rules in O04 must be approved before any manual executable endpoint.

## 9. Concurrency / transaction strategy — design only

1. **Single table row lock** serializes acquire, manual-open, expiry and payment activation. Existing authorization rows are rechecked under established core discipline. Define a global consistent lock order in technical contract: actor authority rows (when interactive) → table → session → payment; automatic ingestion table → session → payment and permitted safety checks. All paths including service config must follow compatible order; no network calls inside.
2. Partial unique constraint for table_sessions in PENDING_PAYMENT/ACTIVE provides backstop against two rows owning same table. Do NOT use now() in a partial-index predicate; expiry is dynamic. Expired pending row is transitioned CANCELLED under table lock before inserting next pending row.
3. Availability projection treats deadline elapsed as not held **even if sweeper has not materialized CANCELLED**. Acquire/ingest lazily materialize expiry atomically. Database allows the next buyer after deadline without depending on scheduled job.
4. Acquire validates authoritative current service/venue/rate/identity and new request key. Create session/payment reference once, audit, commit. Two callers: first wins; second TABLE_UNAVAILABLE, no orphan payment/QR/success audit.
5. Snapshot accept strategy proposed: backend-issued quote/expected table.version can detect displayed price changed; re-show new price, no debit/hold at stale price. Never accept client amount as price. Same quote-current version still requires occupancy lock/constraint.
6. Ingest: authenticate server/provider; resolve immutable exact payment ref; lock its table/session/payment; recheck expiry/current ownership; dedupe financial transfer; validate/insert receipt; sum; eligible full transition or resolution; versions+audit; commit. Receipt persistence and state changes share transaction.
7. Expire under same lock: cancel session, cancel0 or unresolvedpartial payment; immutable effective expires_at; audit; releases uniqueness. Never wait for user action to release logical lock.
8. A competing service config update must lock table and use CAS; table status/rate change handling during hold needs O07. Price change never affects snapshot.
9. Interactive updates require expected_version for affected existing mutable targets; no stale timestamp CAS. New acquire has no session version; request key+constraints handles create concurrency. Provider/SYSTEM expiry commands use current locked DB state; do not trust externally supplied version/reason/actor.
10. Deadlock/serialization failure rolls transaction back; bounded retry same key/receipt identity. Never “retry” with a new key automatically. Race tests must prove at most one committed opening/audit.

Unique guard alone cannot implement expiration; sweeper alone cannot enforce exact deadline; UI timer cannot authorize new owner.

## 10. Idempotency and provider contract — design only

### Customer/manual command
Client generates opaque per-command request key; DB ties it to authenticated command actor, command and immutable payload digest. Store request_actor_profile_id/request_key on session, not a generic idempotency table. Unique actor/key; manual beneficiary may differ from actor, never use beneficiary as caller authority. Same key/same table/payload returns existing current result; same key/different table/payload rejects IDEMPOTENCY_CONFLICT. Lost response after commit does not create new hold/payment; expired same key returns ended result, no reacquire. Deliberate new attempt needs explicit new key and new reference.

Manual duplicate must return same opening/audit, no second active or timer reset. Different user cannot retrieve result by guessed key; ownership/live auth checked on retry.

### Financial identity
Deduplication needs **bank/provider financial transfer ID**, scoped to provider+merchant/recipient account, unique across all orders, not merely webhook event ID. Provider callbacks for one transfer can have distinct delivery/event IDs. Validate immutable normalized transfer fields/digest. Duplicate identical transfer → ACK existing result; different amount/reference/currency for same ID → reject/quarantine conflict, no recalculate/no second credit.

Exact reference generated server-side, unguessable/high-entropy, unique and never recycled, passed to remaining-amount QR unchanged. Resolve using verified provider transaction/reference/recipient, not untrusted callback order_id or approximate amount/name. Same transfer cannot rebind from orderA to orderB. Paid wrong table attempt never opens another order, even if amounts match.

Adapter acceptance requires documented provider:
- authenticated signed webhook or server-to-bank verification;
- immutable final settled transfer ID/timestamp and money units;
- incoming settled CREDIT semantics vs pending/failed/reversal events;
- recipient/account/reference preservation, callback retries and history query/replay capability;
- ordering/completeness policy sufficient for O03;
- out-of-order/late callback and possible future timestamp behavior.

No provider selected or capability asserted here. Verify official provider docs/test sandbox at later approved integration, no invented protocol. Receiving bank funds and V2 DB commit are not a distributed transaction.

Valid but unmatched transfer: retain normalized restricted receipt with no credited payment; trusted alert/reconciliation queue projection, no auto-open/guess/reassignment. Signed but mismatched recipient/currency/amount-units/nonfinal events: do not credit. Reject forged callback before trusted receipt insertion. Reversal/chargeback must not close/reopen automatically; policy O08, resolution later. Accepted receipt vs untrusted HTTP security log are distinct; no full raw payload/PII stored by default.

Do not expose provider key, webhook secret, JWT/service-role to browsers. No generic server DB proxy. Dedicated provider DB identity cannot edit Auth, roles or unrestricted finance; helper minimal grants, fixed empty search_path/schema qualification, revoked PUBLIC/anon EXECUTE, direct-invocation tests.

## 11. Expiry, failures, retries and recovery

| Situation | Required/proposed behavior |
|---|---|
| Exact deadline | Logical hold ends without customer action. Read projection/next acquire sees available if service allows; expiry materialization under transaction. O01 boundary rule. |
| Sweeper down | Ownership still expires at DB deadline; next acquire/verified event materializes end. Recovery sweeps remaining rows once, no deadline extension/duplicate audit. |
| Partial at expiry | Cancel session, payment NEEDS_RESOLUTION; retain receipts; release regardless resolution process. |
| QR generation failure | Never open. Retry same intent/reference with original deadline. Whether cancel/release earlier is O11; no reset5-minute clock. |
| Acquire response lost | Read/retry same actor/request key returns existing hold/QR/state; no new key automatic. |
| Callback DB/audit failure | Entire DB transaction rollback, non-success retry response; no ACK-as-applied. Provider retry same transfer, no double credit. Money at bank remains real; reconciliation needed. |
| Callback accepted, ACK lost | Duplicate returns previous committed outcome; no increment/new success audit/reset started_at. |
| Provider unavailable | UI says pending verification; deadline still applies. No manual confirm shortcut. Durable provider replay/reconcile capability required, O08/O12. |
| Client offline/reload | Authoritative read of own same session; provider processing independent of tab; public acquire checks actual deadline. |
| Callback after zero/partial cancellation | Preserve valid money; financial resolution only under recommended O02; no revive/new hold. |
| Partial70k, callback30k before deadline | Total100k; one SUCCESS/ACTIVE; QR remaining0; start based on approved authoritative threshold timestamp. |
| More real money after SUCCESS | Keep distinct receipt; financial excess case, no second session/no timer extension. O06/O08. |
| Incorrect request ownership/reference | Deny/quarantine; never redirect money or lock based on caller claims. |
| Authority revoked while confirmation open | Old session denied at backend; no mutation/success audit; UI must relogin/reload. |
| Lock timeout/deadlock | Retryable technical error with same key; don't report business SUCCESS until commit. |
| Reconciliation discovers missing credits | Re-ingest same verified financial identities through same core; never broad UPDATE/“mark paid” endpoint. No provider integration implemented yet. |

Expiry automation mechanism/SLA needs technical contract O12. A finite job interval cannot guarantee a stored state flips at exactly the deadline under outages; **logical ownership must end exactly at deadline** even when cleanup is late. UI clock/read projection does not become a new authority.

Audit proposed BUSINESS actions: TABLE_CREATED, TABLE_UPDATED, TABLE_OPENING_REQUESTED, PAYMENT_RECEIPT_RECORDED, PAYMENT_SUCCEEDED, TABLE_SESSION_OPENED, TABLE_OPENING_EXPIRED, PAYMENT_RESOLUTION_REQUIRED, TABLE_SESSION_OPENED_MANUAL. Exact list/payload approved with technical contract; no generic action engine. Duplicate replay creates no duplicate transition audit. SYSTEM actor only trusted ingest/expiry; manual actor current DB role/identity. Before/after allowlist: IDs/venue/service/state/amounts/deadline/started_at/versions/reason; no bank account/contact/raw payload/secret. Client cannot append audit. Audit failure rolls back related mutations. Existing BUSINESS audit role/scope rules unchanged; Staff/User have separate own/operations projections, not audit feed.

## 12. CEO metrics — proposed minimum, not accounting

For authorized venue sets:
- AVAILABLE/PENDING/PLAYING counts are current derived operational counts; specify service-excluded totals.
- Initial sessions opened: count distinct ACTIVE activations, not number of payment callbacks.
- Verified received amount: sum unique attributed receipts; separate required/initial prepaid/excess/unresolved; **not revenue/profit/final bill**.
- No business-day revenue chart unless G7 timezone/window definitions approved.
- No total customer financial history exposure to Staff.
O13 decides which metrics/UI are actually in Sprint2. Read-only CEO minimum operational overview is feasible without defining accounting revenue.

## 13. Full implementation test matrix — NOT RUN in this document task

All matrix cases are requirements, not claimed PASS. Layer DB=real PostgreSQL constraints/RLS/RPC/race; API=real Supabase Auth/backend/provider adapter contract tests; E2E=Playwright Chromium/WebKit with real V2 backend. Provider fixtures can prove adapter idempotency logic, not bank production integration; actual selected-provider sandbox verification is a separate explicitly labelled test. Never call provider mock/synthetic events live-bank PASS.

| ID | Scenario / layer | Exact expected evidence |
|---|---|---|
| T01 | Two customers same AVAILABLE table simultaneously — DB/API | One committed PENDING/intent/reference; loser unavailable; no loser hold/receipt/success audit. |
| T02 | Many contenders stress acquire — DB/API | At most one winner per table; no orphan payment; retries stable. |
| T03 | Different tables simultaneously — DB/API | Independent winners; no unnecessary global serialization. |
| T04 | Existing ACTIVE session acquire — DB/API/E2E | DENY even after initial countdown0; no duplicate session. |
| T05 | Existing live pending acquire — DB/API | DENY all other customers/another own key until exact deadline. |
| T06 | Expired pending, sweeper stopped — DB/API | Next acquire can expire old row and acquire atomically; financial case not blocker. |
| T07 | No payment at exactly deadline — DB/API/E2E | CANCELLED session/payment, public availability released,0 received, no start. |
| T08 | Partial70k at expiry — DB/API/E2E | SessionCANCELLED/paymentNEEDS_RESOLUTION, ledger70k retained, management instruction, new customer can hold. |
| T09 |70k then30k before expiry — DB/API/E2E | required100k/received100k/remaining0; one SUCCESS/ACTIVE; start threshold timestamp. |
| T10 |70k partial QR — API/E2E | QR30k, same reference/deadline; amounts clear; not QR100k. |
| T11 | Many partial/reload/QR refresh — DB/API/E2E | expires_at unchanged, no additional300s; timer uses original deadline. |
| T12 | Same settled callback duplicate — DB/API | One receipt/credit, one activation/audit, ACK retry; unchanged versions/start. |
| T13 | Different webhook IDs same bank transfer — API | Still one financial credit; semantic transfer dedupe. |
| T14 | Duplicate transfer changed amount/ref — API | Conflict/quarantine, no overwrite/rebinding/second credit. |
| T15 | Callback wins just before expiry — DB/API | Approved decision/settlement policy; one opening; contender cannot take table. |
| T16 | Callback exactly expires_at — DB/API | O01 approved strict boundary: expired, no auto-open; preserve money unresolved. |
| T17 | Callback just after expiry — DB/API | No ACTIVE; correct financial resolution/availability. |
| T18 | Payment handler waits on lock across deadline — DB/API | Sample decision clock after lock; stale transaction-start time cannot permit open. |
| T19 | Expiry and full callback concurrently — DB/API | One linearized outcome, no cancelled+active inconsistency, no held financial-only case. |
| T20 | Valid pre-deadline bank timestamp delivered after expiry — API | O02 approved policy proven; recommended unresolved/no revival. |
| T21 | Late full callback after another customer acquires — DB/API | Original money retained, no preemption/second active/wrong-order credit. |
| T22 | Cancelled0 then late money — API | CANCELLED→NEEDS_RESOLUTION, no start, preserve receipt. |
| T23 |100k+20k before completion — DB/API/E2E | One minimum opening; excess20k tracked under O06, no extra minutes. |
| T24 | More true transfer after SUCCESS — DB/API | Additional unique receipt/excess, no new session/reset timer. |
| T25 | SUCCESS followed repeated callbacks — DB/API | Same original started_at, one activation/success audit; duplicate NO_CHANGE. |
| T26 | Callback out of order, e.g.30k(t2) before70k(t1) — API | Sum correct, no loss; threshold under approved O03; one opening. |
| T27 | Earlier missing transfer delivered after SUCCESS — API | No silent timer rewrite; exact O03 reconciliation/completeness behavior. |
| T28 | Equal settled_at timestamps — API | Stable provider tie-break, repeatable crossing; no delivery-order accident. |
| T29 | Future/invalid settled timestamp or fractional/negative amount — API | Reject/quarantine according provider units/skew policy; no opening. |
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
| T47 | ADMIN/CEO/MANAGER manual-open — DB/API/E2E | Only O04-approved action, reason/CAS, Manager assigned venue; no fake payment. |
| T48 | STAFF without extra/USER/HR label only manual — API/E2E | DENY; no role inference/grant/default write. |
| T49 | STAFF granted fixed manual extra — API/E2E | Allowed assigned ACTIVE venue only; no finance/directory/security privilege implied. |
| T50 | MANAGER/extra STAFF cross-venue manual — API | DENY even with known table/profile IDs; no target leak. |
| T51 | AccountDISABLED/membershipINACTIVE/revoked old session manual — API | DENY using frozen cutoff; new relogin current rights; refresh old session no bypass. |
| T52 | Permission revoked between preview and confirm — API/E2E | DB denial, no opening/success audit; clear protected UI. |
| T53 | Manual vs acquire/full payment concurrently — DB/API | Same table serialization, at most one owner; no preempt pending hold. |
| T54 | Missing/stale bigint expected_version manual/table config — DB/API | VERSION_CONFLICT; no mutation/version/success audit; timestamp equality irrelevant. |
| T55 | Manual network retry/same command — API/E2E | Same session/actor/reason/outcome; no second audit/start. |
| T56 | ServiceMAINTENANCE/DISABLED/venue disabled acquire — API | DENY; operational occupancy separate; state-change-during-hold O07 tested. |
| T57 | Account/venue/table disabled before full callback — DB/API | Funds preserved; approved O07 resolution/no-open rule, no old-auth workaround. |
| T58 | Public/own/internal projections — DB/API/E2E | No other customer's sessions/payments/contacts; Staff minimum; Manager venue; CEO safe business. |
| T59 | Direct writes/receipt delete/audit forge/definer direct call — DB/API | DENY incl authenticated Admin where not authorized; no broad auth access. |
| T60 | Integer overflow/high amount/no floating arithmetic — DB/API | Safe reject/rollback; no wrapped price/sum/remaining; preserve event diagnostic. |
| T61 | Reload/time skew/background sleep/check-in — API/E2E | Same started_at; countdown recomputed from authority; no60min reset. |
| T62 | Initial60min reaches0 — DB/API/E2E | No extension/billing/CLOSED/release; no Sprint3 logic; O10 operation policy documented. |
| T63 | UI actual60:00→59:59 and partial balances — E2E | Clear labels, accessible mobile320/390 desktop1440, no overflow; started late callback displays true elapsed. |
| T64 | Provider replay/reconcile after downtime — API/provider sandbox | Same verified identities, complete retained receipts, no “mark paid” shortcut; O02/O03/O08 cases. |
| T65 | Full frozen Sprint1 regression — real CI |78 DB/27 API/3 unit/54 existing Playwright retained or intentionally expanded, all required PASS. |
| T66 | Scope/secrets/dependency/type/lint/build — CI | Exact approved Sprint2 implementation allowlist (not yet created), secret scan/audit/typecheck/lint/build PASS; frozen core/Legacy review. |
| T67 | CEO counters vs received amounts — DB/API/E2E | Distinct sessions/receipts, unresolved/excess separate; no misleading revenue. |
| T68 | Bank reversal/chargeback after ACTIVE — API | No automatic close/reopen/refund; approved O08 resolution classification. |
| T69 | Unauthorized reset/reacquire expired financial case — API | No pending-table recovery from NEEDS_RESOLUTION and no use previous credit for new order. |
| T70 | Provider timestamp tampering/order_id mismatch — API | Client cannot define success time; signed correlation inconsistent rejects/quarantines. |

Clock-boundary tests must include just-before/exact/just-after with controlled real DB timestamp semantics; not flaky browser sleeps or trusting fake browser clock. Race tests use independent transactions/users. RLS allow/deny must use ordinary real Auth sessions, never service-role as proof. DB failure-injection must validate persisted rows/versions/audit, not only HTTP codes.

## 14. Unresolved owner decisions — complete register for this contract

These are not new symbolic gates; each OPEN has a definition, recommendation and required-before. G3–G7 status mapping follows below. Closing some decisions does not authorize implementation automatically.

| ID | OPEN decision | Recommendation / alternatives | Required before |
|---|---|---|---|
| O01 | Deadline inclusivity/linearization | [acquire,expiry), exact expiry loses; DB decision clock after locks. Approve commit-after-decision semantics. | Acquisition/expiry/callback core |
| O02 | Bank settled before deadline, callback after release; timely money during downtime | No resurrection/preemption; funds NEEDS_RESOLUTION. If owner wants bank-time priority, explicitly reconcile conflict with exact5-min release; no silent grace. | Callback core |
| O03 | Authoritative threshold timestamp with out-of-order/missing receipts | Provider stable timestamps/transfer sequence/completeness; define fallback/reconciliation of earlier missing credit. No silent started_at rewrite. | Provider choice and success/timer |
| O04 | What manual-open financially means; beneficiary and prepaid time | Define complimentary/credit/externally verified funding exception, required reason and eligible target; never pretend received or paid. Option: defer executable manual until later, keep permission design now. | Manual endpoint/UI |
| O05 | Currency, valid rate, minimum includes tax/fees, quote acceptance | Propose VND integer, positive rate, required60-min rate only, no added fee/discount; stale quote requires reconfirm. Owner defines actual rates; no100k default. | Price/schema/acquire |
| O06 | Overpayment/excess policy | Open once when eligible>=required; excess flagged for management, no extra minutes/automatic refund/carry-forward. Decide minimum customer message and liability record. | Payment state design |
| O07 | Account/table/venue disabled or service changed during hold/credit | Proposed deny new activation and preserve money unresolved; existing price snapshot unchanged. Choose whether service-disable is rejected while held/ACTIVE vs accepted with visible occupancy; never force-close here. | Service writes/auto-open |
| O08 | Provider delivery, finality, reversals, reconciliation, unmatched/ambiguous receipts | Select provider/bank/account and signed verification, reliable history replay, timestamp units/skew and reference support; classify reversal/ambiguity for management, no auto-refund/close. | Provider technical contract/live integration |
| O09 | Who may receive manual extra; target/self rules | Preserve MANAGER/STAFF eligible extras. Ordinary USER not eligible. Decide self-beneficiary/manual-open-for-customer and target lookup minimum fields; HR label alone irrelevant. | Permission extension/manual flow |
| O10 | Operational behavior at end of initial60 minutes | Timer0, no further charge/extension/automatic release in Sprint2; physical service needs owner procedure, full close/bill belongs Sprint3. No production full lifecycle before Sprint3. | Product acceptance/operations |
| O11 | Customer cancellation/abandonment; QR failure early release; pending count per user | Minimum scope: no early cancel endpoint, one active hold/table; decide per-user cap, early cancel and received-funds treatment if wanted. No cancellation engine default. | Acquisition/UX contract |
| O12 | Expiry/recovery execution cadence and notification/polling | Logical release exact DB deadline; scheduled/lazy cleanup for stored state; define worker cadence, alert threshold, recovery/reconcile SLA; no Redis/event bus. | Technical implementation/acceptance |
| O13 | CEO metrics/public availability and projection fields | Public no occupants; Staff operational only; Manager minimum scoped finance; CEO operational counts, amounts labelled received not revenue. Approve exact fields/metric scope and business-day/timezone if needed. | Read contracts/UI |
| O14 | New entities/state/permissions/audit vocabulary and implementation file allowlist | Approve minimal3 entities+receipt ledger, same session as request, proposed state machines, additive fixed extra/audit extension; later exact implementation allowlist/checkpoints before code. | Any Sprint2 implementation |
| O15 | QR method/provider fee, QR expiry semantics/payment reference limits | Remaining-only requested amount, stable reference, oldQR not assumed void; decide bank dynamic/static QR capability, payer fees/net credited amount, refund contact route. | QR/payment contract |
| O16 | Security/rate limits/abuse limits for public availability/holds | Decide narrowly scoped per-user/request throttling and public exposure granularity; no unauthenticated acquire and no generic risk engine; cancellation cannot recycle unlimited holds silently. | Customer acquire exposure |

### Existing gate mapping — do not silently rewrite frozen files

| Gate | What owner decided now | Still open |
|---|---|---|
| G3 payment meaning | Prepaid100% minimum60 minutes, not deposit/manual confirmation | Manual funding exception O04 |
| G4 amount/method/authority | Required60-min server rate; cumulative bank/provider money; auto success, no Staff/Admin confirm | Currency/rates/fees/provider/QR specifics O05/O08/O15 |
| G5 hold lifecycle | Exactly5min; partial no extension;0 cancel; partial release + financial resolution | Exact boundary/late event, early cancel, recovery cadence O01/O02/O11/O12 |
| G6 snapshot/time | DB/server-derived price snapshot; started_at authoritative success-event, notQR/arrival | Threshold/out-of-order completeness, quote timing/tick O03/O05 |
| G7 CEO metrics | None newly mandated | O13; operational counts can be proposed, revenue not inferred |
| G8 closing/billing | Explicitly outside Sprint2 | Sprint3 owner contract; no implementation now |
| G9–G14 | Unchanged/deferred | Future relevant module/production decisions only |

## 15. Contract review / findings / next authorization

Document review completed:
- Owner100%/60min/5min/partial release rules mapped to separate session/payment machines and test cases.
- Pending opening request represented by same table_sessions row: no duplicated reservation/order/lock entity.
- Financial evidence independent of table ownership; no partial indefinite hold, late reuse or timer reset.
- Explicitly surfaced two hard timing conflicts: delayed callback vs5min release, globally earliest threshold vs immediate opening with out-of-order delivery. They remain OPEN, not hidden assumptions.
- Manual permission scope proposed without HR role/generic builder; financial exception/USER eligibility still owner decisions.
- Countdown0 deliberately contains no Sprint3 transition. No auto-refund/overtime/settlement/provider assumptions.
- Frozen Sprint1 identity/role/scope/revocation/bigintCAS/audit protections preserved as requirements; additive extra/action vocabulary requires approval before implementation.
-70 test scenarios specified, **all NOT RUN** because no implementation permitted. Only document consistency review performed; no CI/runtime PASS claim for Sprint2.

Ready for owner review, **not implementation-ready** until blocking business choices and proposed contract are approved. Before code, define exact implementation allowlist/checkpoint scope and separately authorize; retain old migrations/frozen tests/Legacy. If necessary frozen1A changes are discovered, report maintenance/deviation before editing. No automatic transition to another checkpoint/Sprint.

End of DOCUMENT-ONLY deliverable. STOP.
