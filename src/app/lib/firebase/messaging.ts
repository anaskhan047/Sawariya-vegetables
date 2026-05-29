import { getMessaging, getToken, isSupported, Messaging, onMessage } from "firebase/messaging";
import { deleteApp, getApp, getApps } from "firebase/app";
import { getFirebaseClientApp } from "@/app/lib/firebase/client";
import {
  activateSessionEmbeddedWebApiKeyFallback,
  getFirebaseWebConfig,
  getFirebaseWebConfigSnapshot,
  isForceFallbackWebApiKey,
  isSessionEmbeddedWebApiKeyFallback,
} from "@/app/lib/firebase/webConfig";

let messagingInstance: Messaging | null = null;
let messagingBoundToWebApiKey: string | null = null;
let checkedSupport = false;
let isMessagingSupported = false;
let cachedVapidKey: string | null = null;

export type GetFcmTokenResult = {
  token: string | null;
  errorCode?:
    | "unsupported"
    | "no-app"
    | "no-vapid"
    | "not-secure-context"
    | "localhost-disabled"
    | "registration-failed"
    | "unknown";
  message?: string;
};

function getEnvVapidKey() {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    ""
  ).trim();
}

async function resolvePublicVapidKey(): Promise<{ key: string; source: "env" | "api" | "none" }> {
  const envKey = getEnvVapidKey();
  if (envKey) return { key: envKey, source: "env" };
  if (cachedVapidKey) return { key: cachedVapidKey, source: "api" };

  try {
    const res = await fetch("/api/push/public-key", { cache: "no-store" });
    if (!res.ok) {
      console.error(
        "[FCM] /api/push/public-key failed. Set VAPID_PUBLIC_KEY on the server (same value as Firebase Console → Project settings → Cloud Messaging → Web Push certificates → Key pair → Public key)."
      );
      return { key: "", source: "none" };
    }
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; key?: string };
    const key = (data?.success && typeof data.key === "string" ? data.key : "").trim();
    if (!key) return { key: "", source: "none" };
    cachedVapidKey = key;
    return { key, source: "api" };
  } catch {
    return { key: "", source: "none" };
  }
}

async function registerMessagingServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/firebase-cloud-messaging-push-scope/",
    });
    await registration.update().catch(() => undefined);
    return registration;
  } catch (error) {
    fcmDebug("Scoped SW registration failed, trying default scope.", error);
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await registration.update().catch(() => undefined);
    return registration;
  }
}

/** Same SW as FCM `getToken` — use for `showNotification` so Chrome notification center matches push pipeline. */
export async function registerFirebaseMessagingServiceWorker(): Promise<ServiceWorkerRegistration> {
  return registerMessagingServiceWorker();
}

function fcmDebug(message: string, extra?: unknown) {
  if (process.env.NEXT_PUBLIC_FCM_DEBUG === "true") {
    if (extra === undefined) {
      console.info(`[FCM] ${message}`);
    } else {
      console.info(`[FCM] ${message}`, extra);
    }
  }
}

function logFcm401RecoveryHints() {
  const snap = getFirebaseWebConfigSnapshot();
  const quickFix =
    snap.nextPublicFirebaseApiKeySet && !snap.forceFallbackWebKey && !snap.sessionEmbeddedWebApiKeyFallback
      ? [
          "",
          "Quick local unblock (pick one, then restart `npm run dev` and hard-refresh the browser):",
          "• This build will auto-retry once with the embedded Web apiKey when you see token-subscribe-failed (this tab only), OR",
          "• Remove or comment out NEXT_PUBLIC_FIREBASE_API_KEY in .env.local so the bundled Web key is used, OR",
          "• Set NEXT_PUBLIC_FIREBASE_FORCE_FALLBACK_WEB_KEY=true in .env.local to force the bundled Web apiKey until Google Cloud is fixed.",
        ]
      : snap.sessionEmbeddedWebApiKeyFallback
        ? [
            "",
            "This tab is already on the embedded Web apiKey (session fallback) but Google still returns 401.",
            "Enable for the whole GCP project (not per-key): Firebase Installations API + Firebase Cloud Messaging API.",
            "Then check Browser key HTTP referrer restrictions include your origin (e.g. http://localhost:3000/*) or use None while testing.",
          ]
        : snap.forceFallbackWebKey
          ? [
              "",
              "NEXT_PUBLIC_FIREBASE_FORCE_FALLBACK_WEB_KEY is active — using embedded Web apiKey. Fix Google Cloud on your real key, then remove this flag.",
            ]
          : [];

  console.warn(
    [
      "[FCM] Registration returned 401 (missing auth credential). This is almost always a Google Cloud API key issue — not your JWT or backend.",
      "",
      "Fix checklist:",
      "1) Google Cloud Console → APIs & Services → Enabled APIs — enable:",
      "   • Firebase Installations API",
      "   • Firebase Cloud Messaging API (FCM)",
      "2) APIs & Services → Credentials → your Browser key (same Web API key as Firebase):",
      "   • Application restrictions: add http://localhost:* and your production origins; or test with “None”.",
      "   • API restrictions: either “Don’t restrict key” (dev) OR include at least Firebase Installations + FCM APIs.",
      "3) Firebase Console → Project settings → Your apps → Web — confirm apiKey / appId / messagingSenderId match this build.",
      "4) If you set NEXT_PUBLIC_FIREBASE_API_KEY in .env, ensure it is the Web key above — a restricted Maps/Server key will 401 on fcmregistrations.googleapis.com.",
      ...quickFix,
      "",
      `Snapshot: projectId=${snap.projectId} | webApiKeySource=${snap.webApiKeySource} | forceEnvFallback=${snap.forceFallbackWebKey} | sessionEmbedded=${snap.sessionEmbeddedWebApiKeyFallback}`,
    ].join("\n")
  );
}

const FCM_401_FULL_HINTS_SESSION_KEY = "ssm_fcm_401_full_hints_logged";

/** Prints the long Google Cloud checklist at most once per browser tab session. */
function logFcm401RecoveryHintsMaybe() {
  if (typeof window === "undefined") {
    logFcm401RecoveryHints();
    return;
  }
  try {
    if (sessionStorage.getItem(FCM_401_FULL_HINTS_SESSION_KEY) === "1") {
      console.info(
        "[FCM] FCM registration still failing with 401 — full checklist was already printed once in this tab; see docs/FCM-SETUP.md"
      );
      return;
    }
    sessionStorage.setItem(FCM_401_FULL_HINTS_SESSION_KEY, "1");
  } catch {
    /* private mode / quota */
  }
  logFcm401RecoveryHints();
}

async function ensureMessagingSupport() {
  if (checkedSupport) return isMessagingSupported;
  isMessagingSupported = await isSupported();
  checkedSupport = true;
  fcmDebug("Messaging support checked", { supported: isMessagingSupported });
  return isMessagingSupported;
}

async function getMessagingInstance(): Promise<Messaging | null> {
  if (!(await ensureMessagingSupport())) {
    return null;
  }

  const app = getFirebaseClientApp();
  if (!app) {
    fcmDebug("Firebase app not initialized.");
    return null;
  }

  const desiredApiKey = getFirebaseWebConfig().apiKey;
  if (messagingInstance && messagingBoundToWebApiKey !== desiredApiKey) {
    messagingInstance = null;
    messagingBoundToWebApiKey = null;
    fcmDebug("Web apiKey changed — recreating Messaging instance.");
  }

  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
    messagingBoundToWebApiKey = desiredApiKey;
    fcmDebug("Messaging instance created.");
  }

  return messagingInstance;
}

export async function getFcmTokenWithResult(): Promise<GetFcmTokenResult> {
  const isSecureContextSupported =
    window.location.protocol === "https:" || window.location.hostname === "localhost";
  if (!isSecureContextSupported) {
    return {
      token: null,
      errorCode: "not-secure-context",
      message: "Notifications require HTTPS (or localhost).",
    };
  }

  const isLocalhost = window.location.hostname === "localhost";
  const allowOnLocalhost = process.env.NEXT_PUBLIC_ALLOW_FCM_ON_LOCALHOST !== "false";
  if (isLocalhost && !allowOnLocalhost) {
    return {
      token: null,
      errorCode: "localhost-disabled",
      message: "FCM on localhost disabled via NEXT_PUBLIC_ALLOW_FCM_ON_LOCALHOST.",
    };
  }

  const registration = await registerMessagingServiceWorker();
  fcmDebug("Service worker registered for messaging.");

  const { key: vapidKey, source: vapidSource } = await resolvePublicVapidKey();
  if (!vapidKey) {
    const msg =
      "Missing Web Push VAPID public key. Set VAPID_PUBLIC_KEY in server .env (Firebase Console → Cloud Messaging → Web Push certificates), or set NEXT_PUBLIC_FIREBASE_VAPID_KEY on the client.";
    console.error("[FCM]", msg);
    return { token: null, errorCode: "no-vapid", message: msg };
  }
  fcmDebug("VAPID key resolved", { source: vapidSource });

  for (let attempt = 0; attempt < 2; attempt++) {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      const supported = await ensureMessagingSupport();
      return {
        token: null,
        errorCode: supported ? "no-app" : "unsupported",
        message: supported
          ? "Firebase Web app failed to initialize. Check NEXT_PUBLIC_FIREBASE_* env and Firebase Console Web app config."
          : "This browser does not support FCM.",
      };
    }

    try {
      fcmDebug("getToken started (service-worker + VAPID).", { attempt });
      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey,
      });
      if (typeof token !== "string" || !token.trim()) {
        return {
          token: null,
          errorCode: "registration-failed",
          message: `getToken returned invalid value (${token === null ? "null" : token === undefined ? "undefined" : typeof token}).`,
        };
      }
      fcmDebug("getToken success.");
      return { token };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      fcmDebug("getToken failed.", msg);

      const is401 =
        msg.includes("401") ||
        msg.includes("authentication credential") ||
        msg.includes("token-subscribe-failed");

      const canRetryEmbedded =
        attempt === 0 &&
        is401 &&
        typeof window !== "undefined" &&
        (() => {
          const snap = getFirebaseWebConfigSnapshot();
          return (
            snap.nextPublicFirebaseApiKeySet &&
            !isForceFallbackWebApiKey() &&
            !isSessionEmbeddedWebApiKeyFallback()
          );
        })();

      if (canRetryEmbedded) {
        activateSessionEmbeddedWebApiKeyFallback();
        try {
          if (getApps().length > 0) {
            deleteApp(getApp());
          }
        } catch {
          /* ignore */
        }
        messagingInstance = null;
        messagingBoundToWebApiKey = null;
        console.warn(
          "[FCM] Retrying FCM token once with embedded Web apiKey (NEXT_PUBLIC_FIREBASE_API_KEY was rejected by Google). Session fallback clears when this tab closes."
        );
        continue;
      }

      if (is401) {
        logFcm401RecoveryHintsMaybe();
      }
      return {
        token: null,
        errorCode: "registration-failed",
        message: msg,
      };
    }
  }

  return {
    token: null,
    errorCode: "registration-failed",
    message: "FCM getToken retry exhausted.",
  };
}

export async function getFcmToken(): Promise<string | null> {
  const r = await getFcmTokenWithResult();
  return r.token;
}

export async function listenForegroundMessages(
  handler: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void
) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    fcmDebug("Foreground message received.", payload);
    const data = payload.data as Record<string, string> | undefined;
    const safePayload = {
      notification: {
        title: payload.notification?.title || data?.title,
        body: payload.notification?.body || data?.body,
      },
      data,
    };
    handler(safePayload);
  });
}

export async function canUseFcmInBrowser() {
  return ensureMessagingSupport();
}
