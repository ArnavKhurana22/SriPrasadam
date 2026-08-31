# SriPrasadam

Puja and prasadam booking for Gurugram. A visitor chooses a deity, picks a chadawa slab
(₹101 / ₹251 / ₹501 / ₹1100), gives their name and gotra, pays through Razorpay, and receives a
video of the puja followed by delivery of the blessed prasadam within 4–5 days.

- **Frontend** — React 19 + TypeScript + Vite, plain CSS modules, mobile-first.
- **Backend** — Node + Express 5 + SQLite (better-sqlite3), Razorpay orders and signature
  verification, mobile-OTP sessions, and a password-protected admin panel.

## Getting started

```bash
npm install
cp .env.example .env      # then fill in the values below
npm run dev               # Vite on :5173, API on :5174 (Vite proxies /api)
```

Open http://localhost:5173. The API creates `server/data/app.db` on first run.

### Viewing on your phone and other devices

Both machines must be on the same Wi-Fi.

**While developing** — the easiest option, since the OTP still appears on screen:

```bash
npm run dev:host
```

Vite prints a `Network:` line such as `http://192.168.1.5:5173/`. Open that on the phone. The API
stays on localhost; Vite forwards `/api` for you, so only the one port matters.

**Production build** — one port serves the site and the API together:

```bash
npm run serve      # builds, then starts
```

Set `COOKIE_SECURE=false` in `.env` first. Session cookies are marked `secure` in production, and a
browser will not store those over a plain `http://192.168.x.x` address, so sign-in silently fails
without it. Turn it back on (or remove the line) once the site is behind HTTPS.

The server prints its LAN address on startup. Note that in production the login OTP is no longer
shown on screen — until an SMS provider is connected it only appears in the terminal running the
server.

If the phone cannot reach the address, allow Node through the firewall — on Windows, tick **Private
networks** when the prompt appears, or run in an elevated PowerShell:

```powershell
New-NetFirewallRule -DisplayName "SriPrasadam" -Direction Inbound -LocalPort 5173,5174 -Protocol TCP -Action Allow -Profile Private
```

### Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default `5174`) |
| `JWT_SECRET` | Signs the customer and admin session cookies. Use a long random string. |
| `ADMIN_PASSWORD` | Password for `/admin`. Required for the admin panel to work. |
| `DB_PATH` | SQLite file location (default `server/data/app.db`) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Merchant keys. Leave blank for offline mode. |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies the `payment.captured` webhook. |
| `VITE_RAZORPAY_KEY_ID` | Same key id, exposed to the browser by Vite. |
| `COOKIE_SECURE` | `false` when serving over plain HTTP (LAN testing). Defaults to on in production. |
| `HOST` | Interface the API binds to. Defaults to `0.0.0.0` so other devices can reach it. |

**Offline mode.** With no Razorpay keys, the site still works end to end: bookings are recorded as
confirmed with `payment_status = offline`, and the confirmation page tells the customer the team
will call to take payment. This lets the whole journey be used before the merchant account is live.

## Razorpay

1. Put the test **Key ID** and **Key Secret** from the Razorpay dashboard into `.env`
   (`VITE_RAZORPAY_KEY_ID` gets the same value as `RAZORPAY_KEY_ID`) and restart `npm run dev`.
2. Book an offering and pay with the test card `4111 1111 1111 1111`, any future expiry, any CVV.
3. For webhooks, add `https://<your-domain>/api/payments/webhook` in the dashboard, subscribe to
   `payment.captured`, and set the same secret as `RAZORPAY_WEBHOOK_SECRET`.

Prices are never taken from the browser — the client sends a slab id and the server looks the amount
up in `server/src/catalog.ts`. Payments are only marked paid after the `order_id|payment_id`
HMAC-SHA256 signature checks out.

## SMS / WhatsApp

Not connected yet. Every outbound message goes through `sendMessage()` in `server/src/notify.ts`,
which currently prints to the server console — including the login OTP, which is also shown on
screen outside production. Drop a provider call (MSG91, Twilio, WhatsApp Cloud API) into that one
function and OTPs, booking confirmations and status updates all start sending.

## Content to replace

| What | Where |
| --- | --- |
| Deity names and blessings | `DEITIES` in `server/src/catalog.ts` |
| Deity photographs | `public/deities/<id>.svg` — currently placeholder artwork; drop in real images and update `deityImage()` in `src/lib/format.ts` if you switch to `.jpg` |
| Slab contents and prices | `SLABS` in `server/src/catalog.ts` |
| Festival calendar | `EVENTS` in `server/src/catalog.ts` — dates follow the panchang and need confirming each year |
| Phone number and hours | `src/lib/format.ts` |
| Delivery area | `GURUGRAM_PINCODE` in `server/src/routes/bookings.ts` and the matching check in `src/pages/BookingPage.tsx` |

## Admin

Go to `/admin` and sign in with `ADMIN_PASSWORD`. From there you can filter and search bookings,
move each through **Booked → Puja performed → Dispatched → Delivered**, and paste the puja video
link, which then appears on the customer's booking card. Status changes queue a message to the
customer through `notify.ts`.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page — mission, how it works, deities, slabs, upcoming pujas |
| `/pooja` | Searchable deity grid; choosing one opens the chadawa chooser |
| `/book` | Booking form (name, gotra, mobile, address, puja date) and payment |
| `/events` | Festival calendar; each entry books with that deity and date pre-filled |
| `/my-bookings` | Mobile + OTP sign-in, booking cards with a status timeline and video link |
| `/track` | Look up one booking by reference plus the mobile number it was made with |
| `/contact` | Phone, hours, service area, and a message form |
| `/admin` | Password-protected booking management |

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Vite and the API together, on localhost |
| `npm run dev:host` | The same, but reachable from other devices on your network |
| `npm run build` | Typecheck and build the frontend to `dist/` |
| `npm run build:check` | Typecheck the frontend and the server |
| `npm run lint` | ESLint over `src/` and `server/` |
| `npm start` | Production mode — serves `dist/` from the API on one port |
| `npm run serve` | `build` followed by `start` |

## Deploying

`npm run build`, then run `npm start` behind a reverse proxy with TLS. In production the API serves
the built frontend from the same origin, so no proxy configuration is needed and session cookies are
issued with the `secure` flag. Back up `server/data/app.db` — it holds every booking.
