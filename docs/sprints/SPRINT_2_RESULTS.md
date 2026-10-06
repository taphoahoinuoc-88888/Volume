# Sprint 2 — implementation progress, not completion

Status: IN PROGRESS / BLOCKED — server orchestration exact-file scope. No implementation PASS/freeze.
Frozen main: 2b47f0a619f494a811c94e41697f7d09dcb19e3a.
Frozen business contract: fd3400aa93f2c365d422b2a50b2a66ee039621dd; APPROVED / FROZEN FOR IMPLEMENTATION; 36 invariants /90 cases.
Implementation branch: checkpoint-2. Preflight commit: 7adfafe261eb97a331c5c3f85368afe557d1cf60.

## Completed work
- Reverified GitHub main, contract and implementation branch HEAD directly. main unchanged.
- Built separate implementation workspace from91 Git blobs, exact byte hashes verified; did not overwrite old workspace or Legacy.
- Drafted only two approved additive migrations: 20261007000100_table_payment_contract.sql and20261007000200_table_payment_operations.sql.
- First draft defines four additional entities, pending/table/customer unique guards, nullable MANUAL customer FK, integer VND/snapshot/version constraints, public venue contact, fixed manual extra and narrow audit vocabulary extensions, RLS/grants and append-only receipt trigger.
- Second draft defines safe read/RPC paths, shared security-write barrier, authoritative acquisition/cancellation/manual opening, trusted non-exposed receipt ingestion/deduplication, atomic threshold start, late-money resolution, durable pending invalidation, bounded housekeeping and deferred session/payment consistency trigger.
- All foundation migration files, existing Auth configuration, old security/session RPCs and previous tests remain byte-identical to main.

These are drafts, not verified working features. No statements here constitute DB/security/RPC/concurrency PASS.

## File delta
- Added supabase/migrations/20261007000100_table_payment_contract.sql (draft).
- Added supabase/migrations/20261007000200_table_payment_operations.sql (draft).
- Updated docs/sprints/SPRINT_2_IMPLEMENTATION_PLAN.md: include required cross-entity constraint trigger inventory and report server entrypoint/config missing from43-path allowlist. Did not expand implementation allowlist.
- Added docs/sprints/SPRINT_2_RESULTS.md (this report).
- Existing branch already contained two preflight documents; business contract file unchanged in this progress commit.

## Dependencies and versions
No new dependencies installed or changed. Existing locked dependencies and Supabase CLI2.119.0 plan unchanged. No actual Sprint2 Supabase runtime started/version evidence produced.

## Tests/evidence
| Group | Status |
|---|---|
| Frozen main91-file source reconstruction/hash verification | PASS (source evidence only) |
| Preflight document36/90/43 count validation | PASS (document evidence only) |
| Changed-path allowlist / frozen tracked source hash comparison | PASS (static only;43-path allowlist,91 frozen main files unchanged, no secret-pattern matches in added files; no runtime claim) |
| Clean migration/reset, new constraints/RLS/RPC | NOT RUN |
| All previous78 DB assertions /27 integrations /3 unit /54 Playwright regression | NOT RUN for new migrations |
| New90-case DB/API/unit/E2E requirements | NOT RUN |
| New concurrency/revocation/payment expiry/exact boundary/audit rollback | NOT RUN |
| Typecheck/lint/build/dependency audit/full GitHub Actions | NOT RUN for Sprint2 candidate |
| Actual provider/signature/QR/finality/live money | NOT RUN; separately authorized provider-dependent scope |

Do not treat previous Sprint1 green evidence or static SQL review as Sprint2 PASS. No tests removed, skipped or weakened; no test/schema change in frozen files yet.

## Blocker and exact proposed scope
Existing config disables Edge runtime; exposed database API includes only public schema. A TypeScript adapter module cannot itself receive an authenticated prepare request or invoke restricted private ingestion/failure functions from product UI. Reliable server-side QR failure/release needs an executable server path. Browser-only cancellation is not sufficient.

Need to add to exact allowlist BEFORE creating/changing:
1. supabase/functions/open-table-payment/index.ts — minimum Supabase server entrypoint, ordinary user JWT/RPC authority and restricted server capability; provider-neutral/unconfigured failure handling, no real provider or client confirmation.
2. supabase/config.toml — local edge_runtime.enabled only; all Auth/API schema/security fields unchanged.

Existing allowed files cannot implement a Supabase HTTP entrypoint or enable currently-disabled runtime. No separate API server/CRM/new identity/security architecture proposed. This is a reported operational preflight gap; owner scope resolution required before these two file changes. The current43 paths remain the only allowed paths.

## Security findings / limits
No client/public code, secrets, provider credentials or broad client business/Auth grants introduced. New gateway NOLOGIN is a technical capability, not a profile role. New migration/privilege/trigger/concurrency logic is unverified; full real CI remains mandatory. Deferred constraint trigger inventory added to technical plan because its cross-entity invariant was already required in section1; no business-semantic change.

No main merge, production deployment, SMTP/domain, provider integration, UI implementation, real QR, final billing/closing/refund/extension, Player/Match/Shop/Video/Telegram/CRM/AI or Sprint3. Legacy untouched. Server/payment UI portion paused at exact-file gate. Checkpoint is NOT CLOSED/FROZEN.

Commit SHA and GitHub evidence: this progress report travels in the draft implementation commit; exact SHA is supplied in owner handoff. No new workflow run claimed.
