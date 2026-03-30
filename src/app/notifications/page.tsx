"use client";

import { useEffect, useState } from "react";

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  meta?: Record<string, unknown>;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UserNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      notifications?: NotificationItem[];
    };
    if (data.success && Array.isArray(data.notifications)) {
      setItems(data.notifications);
    }
  };

  const markRead = async (id?: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(id ? { id } : {}),
    });
    await fetchNotifications();
  };

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      await fetchNotifications();
      if (mounted) setLoading(false);
    };
    boot();
    const interval = window.setInterval(fetchNotifications, 8000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 py-16 sm:py-20">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg sm:text-2xl font-semibold text-slate-900">My Notifications</h1>
          <button
            onClick={() => markRead()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm hover:bg-slate-900 hover:text-white"
          >
            Mark all read
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 mt-4">Loading notifications...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500 mt-4">No notifications yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((n) => (
              <div
                key={n._id}
                onClick={() => {
                  const url = typeof n.meta?.url === "string" ? n.meta.url : "";
                  if (url) window.location.href = url;
                }}
                className={`rounded-xl border p-3 sm:p-4 ${
                  n.read ? "border-slate-200 bg-slate-50" : "border-indigo-200 bg-indigo-50"
                } ${typeof n.meta?.url === "string" ? "cursor-pointer" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold text-slate-900">{n.title}</h2>
                    <p className="text-xs sm:text-sm text-slate-700 mt-1">{n.message}</p>
                    <p className="text-[11px] text-slate-500 mt-2">{formatTime(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markRead(n._id)}
                      className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-[11px] hover:bg-slate-900 hover:text-white"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
