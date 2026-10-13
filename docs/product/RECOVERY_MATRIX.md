# Recovery and authorized continuation

Remote frozen base: `taphoahoinuoc-88888/Volume` main `e25296877b84e9a233b3fda2f37afcd8003e0924` (PR12 merged).
Actual work branch: `product-completion`, published to PRIVATE transferred repository; draft PR13. Owner authorizes push/CI/fixes, not merge/deploy. See RESULTS.md and PR13 for exact current-candidate evidence.
Recovered document commit: `6cbb7ee02efbc04b0e6afd739c2aee74a76d01fb`.
Reviewed preservation checkpoint: `eb7535df9addc9f5e45a4c196802364f4dc79cd1` (36 recovered dirty files).
The owner explicitly resolved the dirty-worktree stop and authorized continuation; recovery inventory is not implementation acceptance.

Old `/workspace/scratch/87c3e51f4cdf/volume-v2` remains untouched at `20f3ae7ee944b606ce4af51a391633dc4e7cb10b` with its ten old dirty files. It is not the current product baseline. No reset, clean, history rewrite, force push or legacy source edit was performed.

| Area | GitHub base | Product candidate |
|---|---|---|
| Sprint1 identity/roles/scopes/audit/Auth UI | DONE, frozen CI | Preserved; new permission vocabulary additive; rerun regression required |
| Sprint2 holds/open/payment-neutral adapter | DONE, frozen CI | Preserved; optional presentation-only floor metadata |
| Sprint3 close/CASH/billing | DONE, frozen CI | Preserved; no rule change |
| Windows supervisor/ADMIN | PR12 merged, CI green | BOM retained; physical owner startup reported successful, not full acceptance |
| Shop/orders/inventory | Not implemented retail backend in base | PARTIAL acceptance: source/UI/tests present, real backend PASS on8082159; full browser matrix pending |
| Player/ranks/history | Not implemented in base | PARTIAL acceptance: source/UI/tests present, real API PASS on8082159; browser pending |
| Feedback/human support | Not implemented in base | PARTIAL acceptance: source/UI/tests present, real API PASS on8082159; browser pending |
| Telegram public navigation | Implemented, adapter tests | Preserved, extended useful product menus |
| Telegram private linking | Not implemented in base | PARTIAL acceptance: DB/transport/Web source and tests present; live NOT RUN |
| Real bank provider/production | NOT STARTED | NOT STARTED; not authorized |

## Independently checked historical evidence — not candidate acceptance
Five exact-main workflows succeeded: 37898198045 (1A), 37898198075 (1B), 37898198366 (S2), 37898198122 (S3), 37898198029 (Local Demo).
S3 log: 209 DB assertions, 136 integration tests, 38 unit tests, 180 browser tests.
Local Demo: native Windows 26, Linux launcher 25, Telegram transport 9.
These do not validate changes made after that main SHA.

## Security review of additive design
- 11 new public tables for catalogue, orders/items, stock movements, rank definitions/profiles/current assignment/history, feedback/ticket messages and public venue support. Two private Telegram link/proof tables. No alternative auth identity/database. Player profile uses existing profile ID.
- Four additive product migrations; the first three are now immutable. Seven frozen Sprint1–3 migrations, existing Auth/API config, five workflows, cinematic assets remain byte-preserved; three named inventory/fixture tests have reviewed additive compatibility changes documented in IMPLEMENTATION_PLAN.md. Other old tests are unchanged, except the scope guard's explicitly documented early product dispatch (historical guard body preserved).
- `volume_core` remains a non-client function-owner capability. Client table privileges are revoked on new entities; FORCE RLS; only explicit fixed-search-path RPC projections expose data. Evidence tables lack UPDATE/DELETE grants for the application role. New permission names are fixed, venue-bound SHOP_MANAGE/RANK_MANAGE/FEEDBACK_MANAGE.
- Current account/session/cutoff is checked through the existing live-profile helper. Customer owns its own orders/ranks/tickets. Management receives only authorized venue projections; CEO explicitly authorized for global product operations by the 2026-10-13 owner decision. Scoped support settings are operational; global security remains ADMIN-only. New product writes acquire the existing security advisory lock, check authority/CAS/reason and write audit atomically.
- Stock reservations derive from unpaid unexpired orders plus paid unfulfilled orders; expiry does not require a worker. Transaction serialization plus product row locks prevent oversell. Canonical cart/request key is immutable; stale price/quantity/version is rejected. Fulfillment movement is unique per order/product.
- No payment-provider success is invented. Shop CASH is explicit authorized actual-cash recording; unpaid cancellation only. Product seed explicitly DEMO and refuses non-empty catalogue.
- Telegram proof is hashed at rest, single-use and five-minute bounded; original Web Auth session confirms. Private transport verifies Telegram chat/from, maps confirmed identity, takes shared security lock and uses the existing live session/cutoff check. No JWT stored. Private `SECURITY DEFINER` helpers have locked empty search_path and no PUBLIC/anon/authenticated execute. Runtime login has no direct data/Auth rights and no superuser/BYPASSRLS.
- The new transport's ability to select only confirmed-link projections is a reviewed new trusted boundary, not proof that frozen files alone preserve security. Actual Supabase integration remains mandatory and passed in candidate8082159 real integration suite; any newer candidate must rerun.
- Upgrade is explicit, resource-owned, preflight compares migration/config/seed/Edge bytes, backup precedes migration; no reset/prune/volume deletion/Docker restart. Failure preserves state/data for inspection; do not automatically retry destructive recovery.

## Remaining business decisions (not filled with assumptions)
Actual catalogue/images/prices/stock and club rank definitions; paid-order refunds/returns; supplier accounting beyond quantity receipts/issues; reassignment of a Telegram identity across Volume profiles (currently denied); production provider/deployment and notifications. These are not silently implemented.
