import { NextResponse } from "next/server";
import { getFirebaseWebConfigSnapshot } from "@/app/lib/firebase/webConfig";

export const dynamic = "force-dynamic";

/**
 * Non-secret diagnostics for FCM Web registration (401) debugging.
 * Safe to call from the browser after a failed getToken().
 */
export async function GET() {
  const vapidConfigured = Boolean(process.env.VAPID_PUBLIC_KEY?.trim());
  const adminLikely =
    Boolean(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON?.trim()) ||
    Boolean(
      process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() &&
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim() &&
        process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim()
    );

  const web = getFirebaseWebConfigSnapshot();

  return NextResponse.json({
    success: true,
    web,
    server: {
      vapidPublicKeyConfigured: vapidConfigured,
      firebaseAdminMessagingLikelyConfigured: adminLikely,
    },
    hints: [
      "401 on fcmregistrations.googleapis.com = Browser Web API key blocked or wrong APIs enabled for that key in Google Cloud.",
      "Enable APIs: Firebase Installations API + Firebase Cloud Messaging API for the same GCP project as Firebase.",
      "Credentials → Browser key: allow your origins (http://localhost:3000, production URL) OR set Application restrictions to None while testing.",
      "If NEXT_PUBLIC_FIREBASE_API_KEY is set in .env, it must be the Web API key from Firebase Console (not Android/iOS and not a Maps-only key).",
      "VAPID_PUBLIC_KEY on the server must match Firebase Console → Cloud Messaging → Web Push certificates key pair.",
      "Dev unblock: NEXT_PUBLIC_FIREBASE_FORCE_FALLBACK_WEB_KEY=true uses the repo embedded Web apiKey; or remove a bad NEXT_PUBLIC_FIREBASE_API_KEY — then restart dev + hard-refresh.",
      "After token-subscribe-failed, this app may auto-switch this tab to the embedded Web apiKey once (session only; see webApiKeySource=SESSION_EMBEDDED_FALLBACK in /api/push/fcm-health).",
    ],
  });
}
