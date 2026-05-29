"use client";

import { canUseFcmInBrowser, getFcmTokenWithResult } from "@/app/lib/firebase/messaging";
import { getFirebaseWebConfigSnapshot } from "@/app/lib/firebase/webConfig";

type RegisterResult = {
  ok: boolean;
  reason?: string;
};

export async function registerFcmTokenClient(authToken?: string | null): Promise<RegisterResult> {
  try {
    if (typeof window === "undefined") {
      return { ok: false, reason: "not-in-browser" };
    }

    if (!(await canUseFcmInBrowser())) {
      console.info("[FCM] Browser does not support FCM.");
      return { ok: false, reason: "unsupported-browser" };
    }

    if (!("Notification" in window)) {
      console.info("[FCM] Notification API not available.");
      return { ok: false, reason: "notification-api-unavailable" };
    }

    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();

    if (permission !== "granted") {
      console.info("[FCM] Notification permission not granted:", permission);
      return { ok: false, reason: `permission-${permission}` };
    }

    console.info("[FCM] Notification permission granted.");

    const tokenResult = await getFcmTokenWithResult();
    const fcmToken = tokenResult.token;
    if (!fcmToken) {
      const code = tokenResult.errorCode ?? "unknown";
      const msg = tokenResult.message ?? "(no detail — enable NEXT_PUBLIC_FCM_DEBUG=true for verbose logs)";
      const snap = getFirebaseWebConfigSnapshot();
      console.warn(
        `[FCM] Token generation failed. errorCode=${code} message=${msg} projectId=${snap.projectId} webApiKeySource=${snap.webApiKeySource}`
      );
      if (typeof fetch !== "undefined" && typeof window !== "undefined") {
        try {
          if (sessionStorage.getItem("ssm_fcm_health_snapshot_fetched") !== "1") {
            sessionStorage.setItem("ssm_fcm_health_snapshot_fetched", "1");
            fetch("/api/push/fcm-health", { cache: "no-store" })
              .then((r) => r.json())
              .then((j) => console.info("[FCM] Server-side FCM health snapshot (once per tab):", j))
              .catch(() => undefined);
          }
        } catch {
          /* ignore */
        }
      }
      return { ok: false, reason: code !== "unknown" ? code : "token-null" };
    }

    console.info("[FCM] Token generated:", `${fcmToken.slice(0, 20)}...`);

    const res = await fetch("/api/fcm/token", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ token: fcmToken }),
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      console.info("[FCM] Save API failed:", { status: res.status, data });
      return { ok: false, reason: "save-api-failed" };
    }

    localStorage.setItem("fcm_token", fcmToken);
    console.info("[FCM] Token saved to DB successfully.");
    return { ok: true };
  } catch (error) {
    console.info("[FCM] registerFcmTokenClient exception:", error);
    return { ok: false, reason: "exception" };
  }
}
