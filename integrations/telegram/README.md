# Telegram transport for the existing VOLUME backend

Product draft — real Telegram and final Supabase integration acceptance NOT RUN here.
No bot token is included. This is not a Telegram Auth provider and creates no alternative business database.

## Windows: start without a domain
1. Start VOLUME with `START_VOLUME.bat`. Existing installations need the reviewed additive upgrade described in `README_DEMO.md`; no database reset.
2. Stop the old bot poller if this same bot is already running elsewhere. Do not delete its webhook automatically.
3. Double-click `START_TELEGRAM.bat`; type `S` on the first run. Paste the existing bot token in the hidden prompt. This configures the existing bot; it does not create another bot.
4. Later runs: double-click and press Enter. Keep the bot window open. Ctrl+C stops polling only.

Polling uses outbound Telegram HTTPS; no purchased domain or public inbound webhook is necessary. Localhost/127.0.0.1 web buttons open the website **only on the host PC**. Phone Telegram can receive the bot's text while that PC runs; a localhost button on the phone cannot reach the PC. Public hosting is not configured or implied.

Setup uses the already-owned local Supabase connection only to provision a dedicated non-superuser/noinherit login. It grants membership solely in `volume_telegram_transport`; that role has only the two private read/redeem helper capabilities, not direct Auth/profile/payment/table access. A pre-existing login with unexpected privilege/ownership/membership is rejected. The server validates local resource identity before this operation. Password and token stay in ACL-protected runtime `telegram-private.json`, outside the repository. No token appears on process arguments. Setup refuses an existing webhook. One local kernel lock covers setup and every polling entrypoint. Another machine's poller cannot be controlled; Telegram conflict causes a safe stop.

## Link and test
1. Sign into the customer website → Telegram → create a five-minute code.
2. Copy the `/start link_…` command to the bot's **private** chat.
3. Return to the website, refresh link status, verify the displayed Telegram identity, and confirm.
4. In bot menus inspect own orders, own rank, own feedback and own table sessions. Management menus only provide URLs for scopes/actions returned by the shared backend; the website independently reauthorizes.
5. Unlink on Web; private bot reads must be denied. Account/permission cutoff also denies the old link; log in again, unlink and relink explicitly.

Proofs are random, hashed at rest, expire in five minutes and redeem once. Web confirmation is bound to the initiating real Supabase session. Bot transport accepts only a matching private chat/from identity. The DB maps it to a confirmed link and checks that original Auth session plus live account/cutoff on every private read. No target JWT is stored. Existing confirmed identities cannot be silently replaced; a Telegram identity previously linked to another Volume profile is conservatively rejected even after revocation pending a future reviewed transfer policy.

Human support is separate from the bot: ADMIN/CEO (all venues) or MANAGER (assigned venues only) configures a public venue support username in Control Center → Liên hệ hỗ trợ. Customer Feedback presents that link; private staff contacts are never used automatically.

## Evidence boundaries
`node --test tests/local-demo/telegram.test.mjs tests/local-demo/product-telegram.test.mjs tests/local-demo/product-startup.test.mjs` exercises transport/input boundaries with test doubles, not live Telegram. `tests/integration/telegram-link.test.ts` exercises real Auth/database ownership, replay, cutoff and rollback when local Supabase is available. `tests/e2e/product.spec.ts` covers Web confirmation using the trusted test transport, not Telegram servers. No live-chat success is claimed without owner testing with private credentials.
