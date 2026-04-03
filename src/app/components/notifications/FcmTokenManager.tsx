"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { listenForegroundMessages } from "@/app/lib/firebase/messaging";
import { registerFcmTokenClient } from "@/app/lib/notifications/registerFcmTokenClient";
import { usePathname } from "next/navigation";

type SavedState = {
  userId: string;
  token: string;
};

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

export default function FcmTokenManager() {
  const { user, token, isLoggedIn } = useAuth();
  const pathname = usePathname();
  const savedStateRef = useRef<SavedState | null>(null);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const lastAdminSoundAtRef = useRef<number>(0);

  const playAdminOrderNotificationSound = (payload: {
    type?: string;
    status?: string;
    title?: string;
    message?: string;
  }) => {
    if (user?.role !== "admin" || typeof window === "undefined") return;

    const type = (payload.type || "").toLowerCase();
    const status = (payload.status || "").toLowerCase();
    const text = `${payload.title || ""} ${payload.message || ""}`.toLowerCase();
    const isOrderNotification =
      type.includes("order") || text.includes("order");
    if (!isOrderNotification) return;

    const isCancelled =
      status === "cancelled" ||
      type.includes("cancel") ||
      text.includes("cancel");

    // Avoid duplicate bell sound bursts for the same event.
    const now = Date.now();
    if (now - lastAdminSoundAtRef.current < 1200) return;
    lastAdminSoundAtRef.current = now;

    const src = isCancelled ? "/sound%203.mp3" : "/sound%202.mp3";
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.play().catch(() => {
      // Browser autoplay policies may block audio until user interaction.
    });
  };

  useEffect(() => {
    if (!isLoggedIn) {
      savedStateRef.current = null;
      localStorage.removeItem("fcm_token");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    let mounted = true;

    const registerToken = async () => {
      if (!isLoggedIn || !user?.id) return;
      if (!navigator.onLine) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      fcmDebug("Starting token registration flow.", { userId: user.id, isLoggedIn });
      const authToken = token || localStorage.getItem("token");
      if (!authToken) return;
      const result = await registerFcmTokenClient(authToken);
      if (!mounted || !result.ok) return;

      const savedToken = localStorage.getItem("fcm_token");
      if (savedToken) {
        savedStateRef.current = { userId: user.id, token: savedToken };
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

      const url = payload.data?.url;
      const title = payload.notification?.title || "Shri Sawariya Mart";
      const body = payload.notification?.body || "";
      playAdminOrderNotificationSound({
        type: payload.data?.type,
        status: payload.data?.status,
        title,
        message: body,
      });

      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(title, {
          body,
          data: { url },
          icon: "/logo/android-launchericon-192-192.png",
        });
        notification.onclick = () => {
          if (url) window.location.href = url;
          window.focus();
          notification.close();
        };
      }
    })
      .then((stop) => {
        unsubscribe = stop;
      })
      .catch(() => {
        // Intentionally silent on unsupported/blocked environments.
      });

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; url?: string } | undefined;
      if (data?.type === "FCM_NAVIGATE" && data.url) {
        window.location.href = data.url;
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, [user?.role]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    let cancelled = false;
    const endpoint =
      user.role === "admin" || user.role === "delivery"
        ? "/api/admin/notifications?unread=true"
        : "/api/notifications?unread=true";
    const shouldPoll =
      user.role === "admin"
        ? pathname.startsWith("/admin")
        : user.role === "delivery"
        ? pathname.startsWith("/deliveryBoy") || pathname.startsWith("/admin")
        : true;
    if (!shouldPoll) return;

    const fetchUnreadAndNotify = async () => {
      if (document.visibilityState !== "visible") return;
      const authToken = token || localStorage.getItem("token");
      if (!authToken) return;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        notifications?: ApiNotification[];
      };
      if (!data.success || !Array.isArray(data.notifications) || cancelled) return;

      // Oldest -> newest for natural notification order
      const items = [...data.notifications].reverse();
      items.forEach((item) => {
        if (!item?._id) return;
        if (seenNotificationIdsRef.current.has(item._id)) return;
        seenNotificationIdsRef.current.add(item._id);

        const url = typeof item.meta?.url === "string" ? item.meta.url : "";
        playAdminOrderNotificationSound({
          type: typeof item.meta?.type === "string" ? item.meta.type : "",
          status: typeof item.meta?.status === "string" ? item.meta.status : "",
          title: item.title,
          message: item.message,
        });
        const notification = new Notification(item.title || "Shri Sawariya Mart", {
          body: item.message || "",
          data: { url },
          icon: "/logo/android-launchericon-192-192.png",
        });
        notification.onclick = () => {
          if (url) window.location.href = url;
          window.focus();
          notification.close();
        };
      });
    };

    fetchUnreadAndNotify().catch(() => undefined);
    const onVisibilityOrFocus = () => {
      fetchUnreadAndNotify().catch(() => undefined);
    };
    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    const interval = window.setInterval(() => {
      fetchUnreadAndNotify().catch(() => undefined);
    }, 45000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      window.clearInterval(interval);
    };
  }, [isLoggedIn, pathname, token, user?.id, user?.role]);

  return null;
}
