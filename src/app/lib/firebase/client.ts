import type { FirebaseApp } from "firebase/app";
import { deleteApp, getApp, getApps, initializeApp, setLogLevel } from "firebase/app";
import { getFirebaseWebConfig, getFirebaseWebConfigSnapshot } from "@/app/lib/firebase/webConfig";

function maskValue(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function getFirebaseClientApp(): FirebaseApp | null {
  const debugFcm = process.env.NEXT_PUBLIC_FCM_DEBUG === "true";
  setLogLevel(debugFcm && process.env.NODE_ENV === "development" ? "debug" : "silent");

  const firebaseConfig = getFirebaseWebConfig();
  const snap = getFirebaseWebConfigSnapshot();

  if (debugFcm) {
    console.info("[FCM] Firebase web config snapshot", {
      ...snap,
      apiKeyMasked: maskValue(firebaseConfig.apiKey),
      appIdMasked: maskValue(firebaseConfig.appId),
    });
  }

  if (!snap.webApiKeyLooksValid) {
    console.warn(
      "[FCM] Web API key format looks invalid. Use the Web app API key from Firebase Console → Project settings (starts with AIza…)."
    );
  }

  if (!firebaseConfig.projectId || !firebaseConfig.appId || !firebaseConfig.messagingSenderId) {
    console.warn("[FCM] Firebase client config missing projectId, appId, or messagingSenderId.");
    return null;
  }

  if (getApps().length > 0) {
    const existing = getApp();
    const existingKey = String((existing.options as { apiKey?: string }).apiKey || "");
    if (existingKey && existingKey !== firebaseConfig.apiKey) {
      try {
        deleteApp(existing);
        console.info("[FCM] Removed stale Firebase default app (Web apiKey changed). Re-initializing.");
      } catch (e) {
        console.warn(
          "[FCM] deleteApp failed — do a full browser refresh after changing NEXT_PUBLIC_FIREBASE_* keys.",
          e
        );
        return existing;
      }
    } else {
      return existing;
    }
  }

  return initializeApp(firebaseConfig);
}

export { getFirebaseWebConfigSnapshot } from "@/app/lib/firebase/webConfig";
