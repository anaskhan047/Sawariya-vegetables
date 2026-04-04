import { getMessaging, getToken, isSupported, Messaging, onMessage } from "firebase/messaging";
import { getFirebaseClientApp } from "@/app/lib/firebase/client";

let messagingInstance: Messaging | null = null;
let checkedSupport = false;
let isMessagingSupported = false;
let cachedVapidKey: string | null = null;

function getEnvVapidKey() {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    ""
  ).trim();
}

async function resolvePublicVapidKey() {
  const envKey = getEnvVapidKey();
  if (envKey) return envKey;
  if (cachedVapidKey) return cachedVapidKey;

  try {
    const res = await fetch("/api/push/public-key", { cache: "no-store" });
    if (!res.ok) return "";
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; key?: string };
    const key = (data?.success && typeof data.key === "string" ? data.key : "").trim();
    if (!key) return "";
    cachedVapidKey = key;
    return key;
  } catch {
    return "";
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

function fcmDebug(message: string, extra?: unknown) {
  if (process.env.NEXT_PUBLIC_FCM_DEBUG === "true") {
    if (extra === undefined) {
      console.info(`[FCM] ${message}`);
    } else {
      console.info(`[FCM] ${message}`, extra);
    }
  }
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

  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
    fcmDebug("Messaging instance created.");
  }

  return messagingInstance;
}

export async function getFcmToken(): Promise<string | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const isSecureContextSupported =
    window.location.protocol === "https:" || window.location.hostname === "localhost";
  if (!isSecureContextSupported) {
    fcmDebug("Secure context required for FCM.");
    return null;
  }

  const isLocalhost = window.location.hostname === "localhost";
  // Default allow on localhost unless explicitly disabled.
  const allowOnLocalhost = process.env.NEXT_PUBLIC_ALLOW_FCM_ON_LOCALHOST !== "false";
  if (isLocalhost && !allowOnLocalhost) {
    fcmDebug("Localhost FCM disabled by env.");
    return null;
  }

  const registration = await registerMessagingServiceWorker();
  fcmDebug("Service worker registered for messaging.");

  try {
    fcmDebug("getToken started (single path, service-worker based).");
    const vapidKey = await resolvePublicVapidKey();
    const token = await getToken(messaging, vapidKey
      ? {
          serviceWorkerRegistration: registration,
          vapidKey,
        }
      : {
          serviceWorkerRegistration: registration,
        });
    if (!token) {
      fcmDebug("getToken returned empty token.");
      return null;
    }

    if (!vapidKey) {
      fcmDebug("VAPID key missing on client env. Background delivery may be unreliable.");
    }

    fcmDebug("getToken success.");
    return token;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    fcmDebug("getToken failed.", msg);
    if (msg.includes("token-subscribe-failed") || msg.includes("401")) {
      fcmDebug(
        "Detected FCM registration auth failure. Check Firebase API key restrictions, FCM API enablement, and project match."
      );
    }
    return null;
  }
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
