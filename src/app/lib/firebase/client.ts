import { FirebaseApp, getApp, getApps, initializeApp, setLogLevel } from "firebase/app";

const fallbackFirebaseConfig = {
  apiKey: "AIzaSyD9hppcBYI550csqNpISvpRFu-O17vRVxQ",
  authDomain: "shri-sawariya-mart.firebaseapp.com",
  projectId: "shri-sawariya-mart",
  storageBucket: "shri-sawariya-mart.firebasestorage.app",
  messagingSenderId: "400592809243",
  appId: "1:400592809243:web:d66c767e3240550ff3b7be",
  measurementId: "G-MM60NTPP4F",
};

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || fallbackFirebaseConfig.apiKey,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || fallbackFirebaseConfig.authDomain,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || fallbackFirebaseConfig.projectId,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || fallbackFirebaseConfig.storageBucket,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      fallbackFirebaseConfig.messagingSenderId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || fallbackFirebaseConfig.appId,
    measurementId:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || fallbackFirebaseConfig.measurementId,
  };
}

function maskValue(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function getFirebaseClientApp(): FirebaseApp | null {
  setLogLevel("silent");

  const firebaseConfig = getFirebaseConfig();
  if (process.env.NEXT_PUBLIC_FCM_DEBUG === "true") {
    console.info("[FCM] Firebase app config loaded", {
      projectId: firebaseConfig.projectId,
      messagingSenderId: firebaseConfig.messagingSenderId,
      apiKeyMasked: maskValue(firebaseConfig.apiKey),
      appIdMasked: maskValue(firebaseConfig.appId),
    });
  }

  if (!firebaseConfig.projectId || !firebaseConfig.appId || !firebaseConfig.messagingSenderId) {
    console.warn("Firebase client config missing required values.");
    return null;
  }

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
}
