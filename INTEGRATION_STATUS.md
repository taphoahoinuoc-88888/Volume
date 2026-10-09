# VOLUME integration — merged product, partial end-to-end evidence

Verified main baseline: `54904e7e6419a6c5678cbbbb326a9246db2e06ee` (PR #10 merged).
The cinematic F6.1 integration and Windows fixes are already shipped; the old blocked CI notes are superseded.

## Verified PR #10 evidence

Candidate `99901a1aa470f6f676083626439830edad17cfe7`: all five required workflows PASS.
Merged main `54904e7e6419a6c5678cbbbb326a9246db2e06ee`: all five PASS on that exact SHA:

- Checkpoint 1A: https://github.com/HAD10202/Volume/actions/runs/37793634433
- Checkpoint 1B: https://github.com/HAD10202/Volume/actions/runs/37793634527
- Sprint 2: https://github.com/HAD10202/Volume/actions/runs/37793634434
- Sprint 3: https://github.com/HAD10202/Volume/actions/runs/37793634494
- Local Demo: https://github.com/HAD10202/Volume/actions/runs/37793634450

136/136 integration tests; all three browser workflows 180/180; native Windows launcher 23/23,
Linux launcher 23/23. Real isolated ADMIN provisioning/login/recovery and stop/restart passed.
Actual Chromium/WebKit desktop, 390px and 320px screenshots were reviewed. Candidate browser report:
180 expected, zero skipped, unexpected or flaky. PR #10 fixture maintenance was explicitly approved;
real Auth requests, assertions, timeouts and frozen application contracts remained intact.

## Preserved product

- F6.1 3D showroom, branding, typography, physics, gallery assets, reduced motion and mobile navigation.
- Existing V2 Auth, Control Center, tables, sessions, billing, RLS and audits. No migrations changed.
- Showroom reads `public_tables`; booking and private status use authenticated V2 routes.
- Windows SID/icacls and PowerShell 5.1 UTF-8 ADMIN fixes. START/STOP retain data and act only on owned resources.
- No public deployment, owner database access/reset, Docker-volume deletion or Pi Node action.

## Additive Telegram delivery

The server-side adapter in `integrations/telegram` reuses recovered F6.1 menu labels and intents.
It reads current availability/prices and public venue information from V2's existing anon RPCs.
Only projected public fields are sent to chat; callbacks/start parameters grant no identity or permissions.
Private booking creation and actual session status stay in V2 behind existing login/RLS, reached via a button.
This is **not** an in-chat private-account synchronization or a new identity mapping.
Shop discovery is retained; legacy shop transactions, rankings, registrations and order data are not
ported from SQLite. Their supplied source/data remain untouched, and unsupported menus say so.
No additional bot identity, privileged credential, database schema or dependency was introduced.

The new tests cover adapter transport/navigation/security boundaries and real isolated V2 RPCs.
Current candidate and post-merge results must be read from the delivery PR; PR #10's green status
alone does not validate this additive change. Do not merge it with failing required checks.

## Source provenance

Library search identified F6.1 as the newest supplied legacy website bundle (newer V2 ZIPs were core/preflight artifacts).
Both attached ZIPs were opened from their supplied local copies; originals were not modified.
Both contain 89 web files, 83 byte-identical. Their graphics/physics/gallery files are identical;
six changes concern index, ecosystem/API and old administration. F6.1 is the integration source.

SHA256:
- VOLUME_F6_1_MACOS.zip: `f0b0cf8372b1a127a30362bd1a584bb0c1e8a4d3346de6f3113cfdb4d007837b`
- VOLUME_MACOS_CHECKPOINT.zip: `9cb071b3407398086d2f5fffd1f57d6b377107c70e4d3a28c7c49083e8408758`

## Owner launch and evidence boundaries

Use the safe working-tree inspection/update instructions in README_DEMO.md before updating the existing
`C:\Users\Admin\Downloads\Volume-V2` installation, especially its locally modified
`scripts/local-demo-admin.mjs`. No blind overwrite, reset or relocation. Then double-click START_VOLUME.bat;
STOP_VOLUME.bat stops only the launcher-owned demo. Customer port 3000, Control Center port 3001.

NOT RUN: direct inspection of the owner's Windows working tree, full physical Windows Docker Desktop
stack, physical iPhone/macOS, live Telegram credentials/client responses, production data and live bank provider.
Native Windows CI is evidence for entrypoints/SID ACL/process lifecycle, not a physical Windows Docker test.
The remaining live Telegram check needs the existing token and an already approved reachable HTTPS V2 site;
no public deployment is implied. See integrations/telegram/README.md for that exact verification step.
Do not declare FULL END-TO-END FINAL while these physical/live-provider checks are missing.
