# VOLUME integration — PARTIAL, not FINAL

Base: main `310965e0bb6e61c0ed6b8b11dd161ac0a12ba353` (merged PR #9).

## Implemented

- Customer `/` opens the existing F6.1 cinematic presentation at `/showroom.html`.
- Preserved local Three.js, billiards physics, lazy 3D scenes, reduced-motion handling,
  native touch scrolling, desktop Lenis, brand assets and real venue/cafe/champion galleries.
- Booking preview calls existing `public_tables` with the same V2 client. It performs no writes.
  `/tables`, `/table-session`, `/login`, `/profile`, `/recovery` retain the existing V2 app.
- Removed legacy fake QR/payment success and sample player statistics from the integrated HTML.
  Shop is a clearly labeled collection; player and tournament sections link to Telegram information.
  No claim that V2 has a shop, tournament or ranking backend.
- Telegram intent links reuse supported legacy routes (home/shop/rank/tournament/feedback/club_owner).
  Default public username `Volumestation_bot` comes from supplied `bot/config.example.json`.
  `VITE_TELEGRAM_BOT_USERNAME` can override it for normal builds. Bot availability/ownership is not live verified.
  Links do not transfer V2 identity, payments, selected tables or sessions to the SQLite bot.
- Windows numeric SID grant now uses the required `*` prefix. No ACL policy broadening.
- PowerShell subprocess stdin explicitly uses UTF-8, preserving Unicode ADMIN credentials.
  Auth bootstrap, role grants, audit transaction and first-ADMIN safeguards are unchanged.
- Added a native runtime-permission regression to the existing launcher test suite.

## Design refinement

Read Anthropic frontend-design SKILL.md and UI/UX Pro Max SKILL.md + quick-reference directly from their requested repositories. Applied advisory guidance directly; no external scripts/packages installed. Existing VolumeDisplay typography, colors, 3D and photo galleries remain authoritative. Added keyboard-contained mobile navigation, inert closed menu, 44px touch targets, safe-area spacing, readable mobile body copy and reserved status space. Added showroom coverage to the existing six-project Playwright suite (no new framework).

## Source provenance

Library search identified F6.1 as the newest supplied legacy website bundle (newer V2 ZIPs were core/preflight artifacts).
Both attached ZIPs were opened from their supplied local copies; originals were not modified.
Both contain 89 web files, 83 byte-identical. Their graphics/physics/gallery files are identical;
six changes concern index, ecosystem/API and old administration. F6.1 is the integration source.

SHA256:
- VOLUME_F6_1_MACOS.zip: `f0b0cf8372b1a127a30362bd1a584bb0c1e8a4d3346de6f3113cfdb4d007837b`
- VOLUME_MACOS_CHECKPOINT.zip: `9cb071b3407398086d2f5fffd1f57d6b377107c70e4d3a28c7c49083e8408758`

Legacy Python runtime, SQLite state, configuration and credentials were not imported.
No migrations, Auth/RLS, dependencies, lockfile or frozen test assertions changed.
No Docker/database commands were run during this integration; no Pi Node resources touched.

## Local verification

- Typecheck: PASS.
- Build, Customer + Control Center: PASS (existing large-chunk/dependency directive warnings remain).
- Lint: PASS.
- Core unit tests: 38/38 PASS.
- Launcher suite after recovery and diagnostic regression: 21/22 PASS, 1 FAIL. Existing process-identity test cannot read `/proc/<pid>`
  in this execution environment (stat/cmdline/exe each return ENOENT). Test remains unchanged.
- HTML asset references: no missing local assets; 31 images. No unbound buttons in integrated HTML.
- Browser visual/performance tests: BLOCKED. Browser binary download failed; remote browser could not reach
  local preview. A Vite preview startup also failed with unavailable network-interface enumeration;
  loopback attempt printed a URL but was not reachable. These attempts are not browser PASS evidence.
- GitHub Actions on candidate d873bfe: real isolated backend launch, ADMIN provisioning/login/recovery,
  UI, stop/restart and frozen core Auth/RLS/security regression: PASS.
- Native Windows job on 34c8521: PASS, including numeric SID ACL regression, real Vite/Job Object
  start/stop and Windows PowerShell 5.1 entrypoints. Docker ownership cases on Windows are simulated.
- Full Windows Docker Desktop START/STOP, physical iPhone/macOS and live Telegram response: NOT RUN.
- Required browser matrix and latest-candidate CI remain pending; earlier desktop Chromium/WebKit
  showroom cases passed before superseded runs were cancelled. No full visual acceptance claimed.

## Existing CI scope

The existing scope checker now includes the owner-authorized exact integration file list,
pinned to the main base above. Copied binary assets are SHA-pinned and scanned as bytes for the
same ASCII secret patterns. All previous frozen-file, security, migration and historical checks remain.
No frozen business/Auth/RLS/payment/permission contract is changed.

Do not merge until required candidate CI passes and owner-required native runtime evidence exists.

## Try the candidate

Use this branch's normal `START_VOLUME.bat` on the existing Windows checkout after preserving its path.
It still starts the customer on port 3000 and Control Center on port 3001, keeping existing owned data.
Customer opens the showroom; choose CHỌN BÀN for the existing authenticated booking flow.
Use `STOP_VOLUME.bat` to stop only resources owned by this launcher.
Do not copy `.env`, runtime state or credentials into Git. Do not reset a database to make this candidate run.
