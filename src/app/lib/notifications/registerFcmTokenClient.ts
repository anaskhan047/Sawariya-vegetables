"use client";

import { canUseFcmInBrowser, getFcmToken } from "@/app/lib/firebase/messaging";

type RegisterResult = {
  ok: boolean;
  reason?: string;
};

export async function registerFcmTokenClient(authToken?: string | null): Promise<RegisterResult> {
  try {
    if (typeof window === "undefined") {
      return { ok: false, reason: "not-in-browser" };
    }

    if (!authToken) {
      return { ok: false, reason: "missing-auth-token" };
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

    const fcmToken = await getFcmToken();
    if (!fcmToken) {
      console.info("[FCM] Token generation failed (null token).");
      return { ok: false, reason: "token-null" };
    }

    console.info("[FCM] Token generated:", `${fcmToken.slice(0, 20)}...`);

    const res = await fetch("/api/fcm/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
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
