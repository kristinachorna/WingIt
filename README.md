# WingIt

A minimal, private, camera-first photo messaging app. No feed, no algorithm, no likes, no ads, no public metrics —
just: open the app, take a photo, send it to a friend.

> This is a personal/portfolio project built to learn full-stack mobile development
> (React Native + Expo, Node/Express, PostgreSQL) — not a production app. See
> **Known Gaps / Next Steps** below for what's intentionally left unfinished.

## Project Structure

```
project/
├── mobile/     React Native + Expo client
├── backend/    Node.js + Express API
├── database/   SQL migrations
```

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a hosted instance)
- Expo Go app on your phone (for testing the mobile client)
- VS Code, with the Expo Tools extension recommended

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in real values — never commit .env
```

Create the database and run the migration:

```bash
createdb camera_app
psql camera_app -f ../database/migrations/001_init.sql
```

Start the dev server:

```bash
npm run dev
```

Visit `http://localhost:3000/health` — you should see `{"status":"ok"}`.

## Mobile Setup

The Expo project itself is scaffolded on your machine (needs network access), then
the app code already in `mobile/src/` and `mobile/App.js` runs on top of it:

```bash
cd mobile
npx create-expo-app@latest . --template blank
```

This will ask to overwrite `App.js` and `package.json` — say **no** to `App.js`
(ours is already written) and keep the scaffolded `package.json`, then merge in
the dependencies listed in this repo's `mobile/package.json` under `dependencies`:

```bash
npx expo install expo-camera expo-secure-store @react-navigation/native \
  @react-navigation/native-stack @react-navigation/bottom-tabs \
  react-native-screens react-native-safe-area-context
npm install axios
```

If you're testing on a physical phone, edit `mobile/src/api/client.js` and change
`API_BASE_URL` from `localhost` to your computer's LAN IP (e.g. `http://192.168.1.23:3000`) —
your phone can't reach "localhost" meaning itself.

Start the app:

```bash
npx expo start
```

Scan the QR code with Expo Go. First-run flow: Register → Camera opens automatically →
add a friend from the Friends tab (search their username) → they accept → take a photo,
select them, Send → they'll see it in Messages with a status dot, tap to open, it
counts down and disappears.

## Environment Variables

See `backend/.env.example` for the full list. Never commit `.env` — it's already
covered by `.gitignore`.

## What's Implemented

- **Auth**: register, login, JWT-protected `/auth/me`, bcrypt password hashing, password reset (dev-mode token, see note below)
- **Friends**: search by username, send/accept/decline requests, remove, block, unread-status dot, caterpillar 🐛 → butterfly 🦋 → social butterfly 🦋✨ friendship streaks
- **Camera**: live camera, front/back flip, capture, preview/retake, optional text caption, optional freehand drawing overlay, friend picker, send
- **Photo messaging**: upload via multipart form, conversation list, per-friend thread, captions/drawings shown when viewing
- **Expiring photos**: recipient opens → timer starts server-side → image bytes served via a
  short-lived signed token → a background job deletes the actual file once expired
- **Push notifications**: backend sends via Expo's push service on new friend requests and new photos — see note below on testing this

## Known Gaps / Next Steps

- Photo storage is **local disk** (`backend/uploads/`) for dev — swap `backend/src/services/storage.js`
  for a real S3/R2 client before shipping; the function signatures are already shaped for that swap.
- **Password reset has no real email delivery.** `POST /auth/forgot-password` returns the reset token
  directly in the response (and logs it) since no email service is configured. Before shipping, replace
  this with an actual email send (e.g. via Resend, SendGrid) and remove the `dev_token` field.
- **Push notifications need a custom dev build to test.** Expo Go on recent SDKs no longer supports
  remote push notifications — `registerForPushNotifications()` will silently no-op there. To actually
  test delivery, build a development client via `eas build --profile development`.
- Captions and drawings are stored as separate metadata (text + SVG path data), not burned into the
  photo's actual pixels — simpler to implement, displays identically in-app, but means the overlay only
  renders inside this app, not if the raw image were ever viewed elsewhere.
- Not yet security-reviewed end-to-end (Step 9 in the original plan) or deployed (Step 10).

## Security Notes

- Passwords are hashed with bcrypt, never stored in plain text.
- Photos are stored in object storage, not the database, and served via short-lived
  signed URLs — never public.
- "Disappearing" photos are a UX convention, not a security guarantee: a recipient
  can still screenshot or photograph the screen with another device. The app makes
  this limitation explicit to users.
