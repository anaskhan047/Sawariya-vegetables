import { App, applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import { getMessaging } from "firebase-admin/messaging";

type FirebaseAdminConfig = {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
};

function getAdminConfig(): FirebaseAdminConfig {
  const serviceAccountPath =
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    try {
      const fileContent = fs.readFileSync(serviceAccountPath, "utf8");
      const parsed = JSON.parse(fileContent) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key?.replace(/\\n/g, "\n"),
      };
    } catch (error) {
      console.warn("Invalid Firebase service-account file:", error);
    }
  }

  const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key?.replace(/\\n/g, "\n"),
      };
    } catch (error) {
      console.warn("Invalid FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON:", error);
    }
  }

  return {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

export function getFirebaseAdminApp(): App | null {
  const config = getAdminConfig();

  if (getApps().length > 0) {
    return getApp();
  }

  if (!config.projectId || !config.clientEmail || !config.privateKey) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH) {
      try {
        return initializeApp({
          credential: applicationDefault(),
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      } catch (error) {
        console.warn("Firebase Admin ADC initialization failed:", error);
      }
    }

    console.warn("Firebase Admin credentials are missing. FCM send is disabled.");
    return null;
  }

  return initializeApp({
    credential: cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    }),
  });
}

export function getFirebaseAdminMessaging() {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getMessaging(app);
}

export function getFirebaseAdminAuth() {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getAuth(app);
}
