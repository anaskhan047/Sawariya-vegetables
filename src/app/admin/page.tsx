"use client";

import { useEffect, useState } from "react";
import StatsCard from "../components/admin/dashboard/StatsCard";
import RevenueChart from "../components/admin/dashboard/RevenueChart";
import axios from "axios";
import RecentOrdersTable from "../components/admin/dashboard/RecentOrdersTable";
import { User } from "../lib/types";

type Order = {
  _id: string;
  user: string;
  total: number;
  status: string;
  isCancelled: boolean;
  isRefunded: boolean;
  createdAt: string;
};

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalOrdersToday: 0,
    monthlyOrders: 0,
    pendingOrdersCount: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchData = async () => {
      try {
        // Fetch users
        const usersRes = await axios.get("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (usersRes.data.success) setUsers(usersRes.data.users || []);

        // Fetch orders
        const ordersRes = await axios.get("/api/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ordersData: Order[] = ordersRes.data.success
          ? ordersRes.data.orders || []
          : [];
        setOrders(ordersData);

        // Dates
        const today = new Date().toISOString().split("T")[0];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // Delivered orders (exclude cancelled/refunded)
        const deliveredOrders = ordersData.filter(
          (o) => o.status === "delivered" && !o.isCancelled && !o.isRefunded
        );

        // Stats calculations
        const totalOrdersToday = deliveredOrders.filter(
          (o) => o.createdAt.split("T")[0] === today
        ).length;

        const monthlyOrders = deliveredOrders.filter(
          (o) =>
            new Date(o.createdAt).getMonth() === currentMonth &&
            new Date(o.createdAt).getFullYear() === currentYear
        ).length;

        const pendingOrdersCount = ordersData.filter(
          (o) =>
            o.status !== "delivered" && o.status !== "cancelled" && o.status !== "refunded"
        ).length;

        setStats({ totalOrdersToday, monthlyOrders, pendingOrdersCount });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };

    fetchData();

    // fetch unread notifications count with lightweight polling
    let cancelled = false;
    async function fetchUnread() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/admin/notifications?unread=true", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled && data?.success) {
          setUnreadCount(Array.isArray(data.notifications) ? data.notifications.length : 0);
        }
      } catch (e) {
        console.warn("Failed to fetch unread notifications", e);
      }
    }
    fetchUnread();
    const onFocus = () => {
      fetchUnread().catch(() => undefined);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const iv = setInterval(fetchUnread, 60_000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      clearInterval(iv);
    };
  }, []);

  return (
    <main className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <div className="relative">
          <button
            onClick={() => window.location.href = "/admin/notifications"}
            className="px-3 py-2 rounded-lg border"
            style={{ borderColor: "var(--border-color)" }}
            title="Notifications"
          >
            🔔
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-xs px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard title="Total Orders Today" value={stats.totalOrdersToday} icon="orders" />
        <StatsCard title="Monthly Orders" value={stats.monthlyOrders} icon="orders" />
        <StatsCard title="Pending Orders" value={stats.pendingOrdersCount} icon="pending" />
        <StatsCard title="Total Users" value={users.length} icon="users" />
      </div>

      <RevenueChart />
      <RecentOrdersTable />
    </main>
  );
}
