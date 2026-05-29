"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { listenForegroundMessages, registerFirebaseMessagingServiceWorker } from "@/app/lib/firebase/messaging";
import { registerFcmTokenClient } from "@/app/lib/notifications/registerFcmTokenClient";
import { registerAdminPush } from "@/app/lib/registerPush";

type ApiNotification = {
  _id: string;
  title: string;
  message: string;
  meta?: Record<string, unknown>;
};

function fcmDebug(message: string, extra?: unknown) {
  if (process.env.NEXT_PUBLIC_FCM_DEBUG === "true") {
    if (extra === undefined) {
      console.info(`[FCM] ${message}`);
    } else {
      console.info(`[FCM] ${message}`, extra);
    }
  }
}

function resolveClientNotificationUrl(url: string | undefined): string {
  if (typeof window === "undefined") return url?.trim() || "/";
  const u = (url || "/").trim() || "/";
  if (/^https?:\/\//i.test(u)) return u;
  try {
    return new URL(u, window.location.origin).href;
  } catch {
    return `${window.location.origin}${u.startsWith("/") ? u : `/${u}`}`;
  }
}

export default function FcmTokenManager() {
  const { user, token, isLoggedIn } = useAuth();
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  /** After first successful poll, existing unread IDs are ignored (no sound / OS spam on login). */
  const pollPrimedRef = useRef(false);
  const lastAdminSoundAtRef = useRef<number>(0);

  const getAdminOrderSoundType = (payload: {
    type?: string;
    status?: string;
    title?: string;
    message?: string;
  }): "new" | "cancel" | null => {
    if (user?.role !== "admin" || typeof window === "undefined") return null;

    const type = (payload.type || "").toLowerCase();
    const status = (payload.status || "").toLowerCase();
    const text = `${payload.title || ""} ${payload.message || ""}`.toLowerCase();
    const isOrderNotification = type.includes("order") || text.includes("order");
    if (!isOrderNotification) return null;

    if (type === "order_cancelled") return "cancel";
    if (type === "order_created") return "new";
    if (status === "cancelled" && type.includes("order")) return "cancel";
    if (type.includes("order")) return "new";
    return null;
  };

  const playAdminOrderNotificationSound = (soundType: "new" | "cancel" | null) => {
    if (soundType === null || user?.role !== "admin" || typeof window === "undefined") return;

    const now = Date.now();
    if (now - lastAdminSoundAtRef.current < 1200) return;
    lastAdminSoundAtRef.current = now;

    const src = soundType === "cancel" ? "/sound%203.mp3" : "/sound%202.mp3";
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.play().catch(() => {
      // Browser autoplay policies may block audio until user interaction.
    });
  };

  /**
   * Chrome / OS notification tray only (no in-page toast).
   * Prefer service worker showNotification (same pipeline as FCM background).
   */
  const showSystemNotification = useCallback(
    async (payload: { title: string; body: string; url?: string; tag?: string }) => {
      if (typeof window === "undefined") return false;
      if (!("Notification" in window) || Notification.permission !== "granted") return false;

      const title = payload.title || "Shri Sawariya Mart";
      const body = payload.body || "";
      const clickUrl = resolveClientNotificationUrl(payload.url || "/");
      const icon = "/logo/android-launchericon-192-192.png";
      const tag = payload.tag ?? `ssm-${Date.now()}`;

      const swOptions: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
        body,
        data: { url: clickUrl },
        icon,
        badge: icon,
        tag,
        requireInteraction: true,
        silent: false,
        renotify: true,
        vibrate: [160, 80, 160],
      };

      if ("serviceWorker" in navigator) {
        try {
          const swRegistration = await registerFirebaseMessagingServiceWorker().catch(() => null);
          const reg =
            swRegistration ||
            (await navigator.serviceWorker.getRegistration("/firebase-cloud-messaging-push-scope")) ||
            (await navigator.serviceWorker.getRegistration()) ||
            (await navigator.serviceWorker.ready);

          if (reg) {
            await reg.showNotification(title, swOptions);
            return true;
          }
        } catch (err) {
          console.warn("[FCM] serviceWorker.showNotification failed, trying window.Notification", err);
        }
      }

      try {
        const notification = new Notification(title, {
          body,
          data: { url: clickUrl },
          icon,
          tag,
          requireInteraction: true,
          silent: false,
        });
        notification.onclick = () => {
          window.location.href = clickUrl;
          window.focus();
          notification.close();
        };
        return true;
      } catch (err) {
        fcmDebug("native Notification() failed", err);
      }

      return false;
    },
    []
  );

  const isAdminOrderAlert = useCallback(
    (metaType: string, title: string, message: string) => {
      if (user?.role !== "admin") return false;
      const t = metaType.toUpperCase();
      if (t === "ORDER_CREATED" || t === "ORDER_CANCELLED") return true;
      const blob = `${title} ${message}`.toLowerCase();
      return blob.includes("new order") || blob.includes("order cancelled");
    },
    [user?.role]
  );

  useEffect(() => {
    if (!isLoggedIn) {
      seenNotificationIdsRef.current.clear();
      pollPrimedRef.current = false;
      localStorage.removeItem("fcm_token");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    let mounted = true;

    const registerToken = async () => {
      if (!isLoggedIn || !user?.id) return;
      if (!navigator.onLine) return;
      fcmDebug("Starting token registration flow.", { userId: user.id, isLoggedIn });
      const authToken = token || localStorage.getItem("token");
      const result = await registerFcmTokenClient(authToken);
      if (!mounted) return;
      if (user.role === "admin") {
        await registerAdminPush(user.id, authToken);
      }
    };

    const runRegistration = () =>
      registerToken().catch((error) => {
        fcmDebug("Token registration flow threw an exception.", error);
      });

    runRegistration();

    const intervalId = window.setInterval(runRegistration, 30 * 60 * 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runRegistration();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isLoggedIn, token, user?.id]);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    listenForegroundMessages((payload) => {
      if (!mounted || typeof window === "undefined") return;

      void (async () => {
        const url = payload.data?.url;
        const title = payload.notification?.title || "Shri Sawariya Mart";
        const body = payload.notification?.body || "";
        const metaType = (payload.data?.type || "").toString();
        const tag =
          payload.data?.type && payload.data?.orderId
            ? `${payload.data.type}:${payload.data.orderId}`
            : undefined;

        const shown = await showSystemNotification({ title, body, url, tag });
        if (!shown && Notification.permission === "granted") {
          fcmDebug(
            "System notification did not appear. Check Windows Focus Assist / Do Not Disturb, and Chrome → Site settings → Notifications for this site."
          );
        }
        const soundType = getAdminOrderSoundType({
          type: payload.data?.type,
          status: payload.data?.status,
          title,
          message: body,
        });
        if (soundType && shown && isAdminOrderAlert(metaType, title, body)) {
          playAdminOrderNotificationSound(soundType);
        }
      })();
    })
      .then((stop) => {
        unsubscribe = stop;
      })
      .catch((err) => {
        console.warn("[FCM] Foreground messaging unavailable (unsupported or blocked).", err);
      });

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; url?: string } | undefined;
      if (data?.type === "FCM_NAVIGATE" && data.url) {
        window.location.href = resolveClientNotificationUrl(data.url);
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, [user?.role, showSystemNotification, isAdminOrderAlert]);

  /** Fallback when FCM token is missing: only on focus/visibility — no interval (avoids server log spam). */
  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    let cancelled = false;
    const endpoint =
      user.role === "admin" || user.role === "delivery"
        ? "/api/admin/notifications?unread=true"
        : "/api/notifications?unread=true";

    const fetchUnreadAndNotify = async () => {
      if (document.visibilityState !== "visible") return;

      const authToken = token || localStorage.getItem("token");

      const res = await fetch(endpoint, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        notifications?: ApiNotification[];
      };
      if (!data.success || !Array.isArray(data.notifications) || cancelled) return;

      const items = [...data.notifications].reverse();

      if (!pollPrimedRef.current) {
        pollPrimedRef.current = true;
        for (const item of items) {
          if (item?._id) seenNotificationIdsRef.current.add(item._id);
        }
        fcmDebug("Notification poll primed — existing unread skipped (no login sound).");
        return;
      }

      items.forEach((item) => {
        if (!item?._id) return;
        if (seenNotificationIdsRef.current.has(item._id)) return;
        seenNotificationIdsRef.current.add(item._id);

        const url = typeof item.meta?.url === "string" ? item.meta.url : "";
        const metaType = typeof item.meta?.type === "string" ? item.meta.type : "";
        const metaStatus = typeof item.meta?.status === "string" ? item.meta.status : "";
        const orderId = typeof item.meta?.orderId === "string" ? item.meta.orderId : "";
        const tag = metaType && orderId ? `${metaType}:${orderId}` : undefined;

        void (async () => {
          const title = item.title || "Shri Sawariya Mart";
          const body = item.message || "";

          const shown = await showSystemNotification({ title, body, url, tag });
          if (!shown && Notification.permission === "granted") {
            fcmDebug(
              "System notification did not appear. Check Windows Focus Assist / Do Not Disturb, and Chrome → Site settings → Notifications for this site."
            );
          }
          const soundType = getAdminOrderSoundType({
            type: metaType,
            status: metaStatus,
            title: item.title,
            message: item.message,
          });
          if (soundType && shown && isAdminOrderAlert(metaType, title, body)) {
            playAdminOrderNotificationSound(soundType);
          }
        })();
      });
    };

    fetchUnreadAndNotify().catch(() => undefined);
    const onVisibilityOrFocus = () => {
      fetchUnreadAndNotify().catch(() => undefined);
    };
    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
    };
  }, [isLoggedIn, token, user?.id, user?.role, showSystemNotification, isAdminOrderAlert]);

  return null;
}
