# Telegram → VOLUME V2

This is a small server-side adapter for the existing bot identity, not a new business backend.
It reuses labels and intent routes from supplied F6.1 `bot/navigation.py` (`PRIMARY`/`CUSTOMER`)
and `bot/app.py`. The original ZIP/source remains untouched. `legacy-navigation.json` contains
only those presentation labels/routes. No legacy Store, SQLite, credentials, payment simulation,
staff identity or role assignment is imported. No new dependencies are needed: use the launcher-supported Node 22/24.

## What actually works

- `/start`, existing showroom intents, navigation buttons, `/tables`, `/booking`, `/status`, `/visit`.
- Availability and hourly price: fresh `public_tables` RPC on each click, with pagination.
- Venue name/address: `public_venues`; contact: the same venue's public table projection.
- Booking and status: button opens the existing authenticated V2 `/tables` page. V2 performs
  creation, version/idempotency checks and displays actual private session/payment state.
  **This is an authenticated website handoff, not private-session synchronization into Telegram chat.**
- Shop discovery opens the preserved showroom. Rank/tournament/order menus explicitly state that
  their legacy transactions are not synchronized; no invented rankings, orders or payment success.

The old shop/ranking/tournament services require the legacy SQLite authority and cannot safely be
imported as V2 services in this scope. Their source/data is preserved, but this adapter does not run
those transactions. Do not switch an actively used legacy bot to this adapter expecting its old
orders/registrations to appear. Existing legacy records remain in their original installation.

## Private configuration and startup

1. Reuse the existing bot token, privately. Do not create another bot or run two pollers for one token.
   Stop the old bot process normally only when ready to test this adapter; do not delete its data.
2. Copy `.env.example` to a private file **outside the checkout**, e.g.
   `%LOCALAPPDATA%\VolumeTelegram\server.env`. Fill the token, exact bot username, existing V2
   API URL/anon key, and owner-approved HTTPS customer website origin. Do not use service-role keys,
   user tokens, URL credentials, or a phone's `localhost` as the customer website.
   Keep `VITE_TELEGRAM_BOT_USERNAME` on the website consistent with `VOLUME_TELEGRAM_USERNAME`.
3. From the repository, PowerShell:

```powershell
node --env-file="$env:LOCALAPPDATA\VolumeTelegram\server.env" integrations/telegram/bot.mjs --check
node --env-file="$env:LOCALAPPDATA\VolumeTelegram\server.env" integrations/telegram/bot.mjs
```

`--check` verifies bot identity, checks for an existing webhook, and reads V2 public data. It sends no
messages and never removes webhooks or pending updates. A webhook causes an explicit safe stop;
do not disable an existing deployment blindly. `TELEGRAM_HTTP_409` means a conflicting poller or
webhook must be resolved. Connection/configuration failures stop with a sanitized code; no raw API
response, message content, token or full request URL is logged. Correct the connection and restart.
Ctrl+C stops this process only, after the current long poll (up to 40 seconds). START/STOP_VOLUME
does not start or stop the bot. No public deployment is performed by these commands.

Telegram callbacks and start payloads are navigation selections only. The adapter makes only two
anon RPC calls; no private token, chat→profile identity map, admin endpoint or database connection.
Private booking/status stays behind existing V2 login and RLS. Adding in-chat private status or
booking would require a separately reviewed account-linking contract; it is not silently enabled.

## Verification

`node --test tests/local-demo/telegram.test.mjs` checks transport, field projections, route validation,
pagination, spoofed/group updates and credential-safe errors. The existing Local Demo real-stack CI
also checks this adapter against real V2 RPCs, data changes, hidden/disabled venue filtering and
anon denial of private sessions. Telegram transport is mocked in CI; no real message is sent.

**Remaining live step:** with the existing bot token and an already approved reachable HTTPS V2
website, run `--check`, then test `/start`, table refresh, venue info, booking through V2 login,
and `/status` handoff on a real Telegram client. Verify the same session in Control Center.
Bank-provider success is not available in the local demo without a configured provider; do not
simulate payment or call it paid. Live Telegram is NOT RUN without those credentials/endpoints.
