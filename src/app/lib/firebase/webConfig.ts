/**
 * Single source of truth for Firebase **Web** SDK config (client + messaging SW).
 * Keep this in sync with the Web app entry in Firebase Console → Project settings.
 */

export const FALLBACK_FIREBASE_WEB_CONFIG = {
  apiKey: "AIzaSyD9hppcBYI550csqNpISvpRFu-O17vRVxQ",
  authDomain: "shri-sawariya-mart.firebaseapp.com",
  projectId: "shri-sawariya-mart",
  storageBucket: "shri-sawariya-mart.firebasestorage.app",
  messagingSenderId: "400592809243",
  appId: "1:400592809243:web:d66c767e3240550ff3b7be",
  measurementId: "G-MM60NTPP4F",
} as const;

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
};

let warnedForceFallbackWebKey = false;
let warnedSessionEmbeddedFallback = false;

/** Session flag: after FCM token-subscribe-failed (bad env Web key), client sets this and retries with embedded `apiKey`. Clears when the tab closes. */
const SESSION_FORCE_EMBEDDED_WEB_API_KEY = "ssm_fcm_force_embedded_web_api_key";

export function isSessionEmbeddedWebApiKeyFallback(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_FORCE_EMBEDDED_WEB_API_KEY) === "1";
  } catch {
    return false;
  }
}

/** Call from the browser after a failed FCM subscribe so the next `getFirebaseWebConfig()` uses the embedded Web key. */
export function activateSessionEmbeddedWebApiKeyFallback(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_FORCE_EMBEDDED_WEB_API_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * When `NEXT_PUBLIC_FIREBASE_API_KEY` points at a Google-restricted key, FCM registration returns 401.
 * Set `NEXT_PUBLIC_FIREBASE_FORCE_FALLBACK_WEB_KEY=true` to use the embedded Web `apiKey` from this repo
 * (same project) until you fix API key restrictions in Google Cloud — then remove the flag and restart.
 */
export function isForceFallbackWebApiKey(): boolean {
  return process.env.NEXT_PUBLIC_FIREBASE_FORCE_FALLBACK_WEB_KEY === "true";
}

function useEmbeddedWebApiKey(): boolean {
  return isForceFallbackWebApiKey() || isSessionEmbeddedWebApiKeyFallback();
}

export function getFirebaseWebConfig(): FirebaseWebConfig {
  const f = FALLBACK_FIREBASE_WEB_CONFIG;
  const envKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim();
  const forceEnv = isForceFallbackWebApiKey();
  const forceSession = isSessionEmbeddedWebApiKeyFallback();
  const forceFallback = forceEnv || forceSession;
  const apiKey = forceFallback ? f.apiKey : envKey || f.apiKey;

  if (forceEnv && !warnedForceFallbackWebKey) {
    warnedForceFallbackWebKey = true;
    console.warn(
      "[FCM] NEXT_PUBLIC_FIREBASE_FORCE_FALLBACK_WEB_KEY=true → using embedded Web apiKey. " +
        "Remove this env after fixing Google Cloud API restrictions on your real browser key."
    );
  }
  if (forceSession && !forceEnv && !warnedSessionEmbeddedFallback) {
    warnedSessionEmbeddedFallback = true;
    console.warn(
      "[FCM] Using embedded Web apiKey for this tab (session fallback after FCM rejected NEXT_PUBLIC_FIREBASE_API_KEY). " +
        "Fix the Browser key in Google Cloud or remove that env var — this session clears when the tab closes."
    );
  }

  return {
    apiKey,
    authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "").trim() || f.authDomain,
    projectId: (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim() || f.projectId,
    storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "").trim() || f.storageBucket,
    messagingSenderId:
      (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "").trim() || f.messagingSenderId,
    appId: (process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "").trim() || f.appId,
    measurementId: (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "").trim() || f.measurementId,
  };
}

/** Safe snapshot for logs / diagnostics (no full secrets). */
export function getFirebaseWebConfigSnapshot() {
  const c = getFirebaseWebConfig();
  const envKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim();
  const forcedEnv = isForceFallbackWebApiKey();
  const sessionEmb = isSessionEmbeddedWebApiKeyFallback();
  const webApiKeySource = forcedEnv
    ? "FORCE_FALLBACK_WEB_KEY (embedded apiKey)"
    : sessionEmb
      ? "SESSION_EMBEDDED_FALLBACK (embedded apiKey)"
      : envKey
        ? "NEXT_PUBLIC_FIREBASE_API_KEY"
        : "FALLBACK_FIREBASE_WEB_CONFIG";

  return {
    projectId: c.projectId,
    messagingSenderId: c.messagingSenderId,
    authDomain: c.authDomain,
    webApiKeySource,
    nextPublicFirebaseApiKeySet: Boolean(envKey),
    forceFallbackWebKey: forcedEnv,
    sessionEmbeddedWebApiKeyFallback: sessionEmb,
    /** Firebase Web API keys normally start with AIza and are ~39 chars */
    webApiKeyLooksValid:
      typeof c.apiKey === "string" && c.apiKey.startsWith("AIza") && c.apiKey.length >= 35,
    appIdSuffix: typeof c.appId === "string" ? c.appId.split(":").pop() : "",
  };
}
