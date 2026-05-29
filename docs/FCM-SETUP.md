# FCM (Web) setup — fix `401` on `fcmregistrations.googleapis.com`

When the browser logs:

> Request is missing required authentication credential…  
> `fcmregistrations.googleapis.com` … **401**

the **Firebase Web API key** is being rejected by Google for that HTTP call. This is **not** your app JWT and not your MongoDB. Fix it in **Google Cloud + Firebase Console**.

## 1) Enable required APIs (same GCP project as Firebase)

In [Google Cloud Console](https://console.cloud.google.com/) pick the project linked to Firebase (`shri-sawariya-mart` or yours).

**APIs & Services → Library** — enable:

- **Firebase Installations API**
- **Firebase Cloud Messaging API** (sometimes listed as FCM)

## 2) Fix the Browser API key restrictions

**APIs & Services → Credentials** → open the **Browser** key whose value matches **Firebase → Project settings → Your apps → Web app → `apiKey`** (starts with `AIza…`).

### Application restrictions

- Either **None** (easiest for local testing), **or**
- **HTTP referrers** including at least:
  - `http://localhost:*/*`
  - `http://127.0.0.1:*/*`
  - Your production origins, e.g. `https://www.shrisawariyamart.com/*`

### API restrictions

- Either **Don’t restrict key** (dev), **or**
- **Restrict key** and explicitly allow at least:
  - Firebase Installations API
  - Firebase Cloud Messaging API  
  (Add any other APIs you intentionally use with this same key.)

Using a **Maps / Places / other restricted key** as `NEXT_PUBLIC_FIREBASE_API_KEY` will commonly produce **401** on FCM registration.

## Quick dev unblock (without Google Cloud yet)

If you only need local FCM working **right now**:

1. **Option A — remove bad override:** delete or comment out `NEXT_PUBLIC_FIREBASE_API_KEY` in `.env.local`, restart `npm run dev`, hard-refresh the browser (the app falls back to the embedded Web key in `webConfig.ts`).

2. **Option B — force embedded Web key:** in `.env.local` set:

   ```bash
   NEXT_PUBLIC_FIREBASE_FORCE_FALLBACK_WEB_KEY=true
   ```

   Restart the dev server and **hard-refresh** the browser. The bundled Web `apiKey` is used even if `NEXT_PUBLIC_FIREBASE_API_KEY` is set. Remove this flag after you fix the real key in Google Cloud (production should not rely on this).

3. **Option C — automatic (current tab only):** If the env Web key triggers `messaging/token-subscribe-failed`, the app **retries once** with the embedded Web `apiKey` for that browser tab (session storage). You’ll see `[FCM] Retrying FCM token once with embedded Web apiKey` in the console. Fix Google Cloud or remove the bad env key for a permanent fix.

If **both** the env key **and** the embedded key still return **401**, the problem is almost always **project-wide in Google Cloud**: enable **Firebase Installations API** and **Firebase Cloud Messaging API** for the whole GCP project (not only “one” key). Referrer / API restrictions on the Browser key must still allow your site origin.

After changing any `NEXT_PUBLIC_*` Firebase variable, do a **full restart + hard refresh** so the default Firebase app is recreated (the client deletes stale instances when the Web apiKey changes).

## 3) Match Firebase Web app config

In **Firebase Console → Project settings → General → Your apps → Web**:

- `apiKey`, `authDomain`, `projectId`, `messagingSenderId`, `appId`, `storageBucket` must match what the app loads (`src/app/lib/firebase/webConfig.ts` + env overrides).

Prefer setting these via env in production:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)

## 4) Web Push / VAPID (required for reliable `getToken` in this project)

1. Firebase Console → **Build → Cloud Messaging → Web Push certificates**  
   Generate / copy the **Key pair** public key.

2. Server `.env`:

   ```bash
   VAPID_PUBLIC_KEY=<paste public key here>
   ```

   Optional client override:

   ```bash
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=<same public key>
   ```

The app reads the public key from `/api/push/public-key` when the client env is not set.

## 5) Authorized domains

Firebase Console → **Authentication → Settings → Authorized domains**  
Include `localhost` and your production domain.

## 6) Debug logging

```bash
NEXT_PUBLIC_FCM_DEBUG=true
```

Then reload, log in as admin, and watch the console + Network tab for `fcmregistrations` / `getToken`.

## 7) Server push (admin order alerts)

Admin push uses **Firebase Admin** (service account). Separate from Web `401`:

- `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` **or**
- `FIREBASE_ADMIN_PROJECT_ID` + `FIREBASE_ADMIN_CLIENT_EMAIL` + `FIREBASE_ADMIN_PRIVATE_KEY`

`GET /api/push/fcm-health` returns booleans only (no secrets) to confirm VAPID + admin env presence.
