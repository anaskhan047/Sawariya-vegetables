"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import type { Payload } from "recharts/types/component/DefaultTooltipContent";

type RevenueData = {
  month: string;
  revenue: number;
};
type OrdersPerMonthData = {
  month: string;
  orders: number;
};
type DailyData = {
  dayLabel: string;
  orders: number;
  revenue: number;
};

type Order = {
  createdAt: string;
  date?: string;
  status: string;
  total?: number;
  amount?: number;
};

export default function RevenueChart() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [ordersData, setOrdersData] = useState<OrdersPerMonthData[]>([]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | "All">(
    "All"
  ); // 0..11 or "All"
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [monthSummary, setMonthSummary] = useState<{ orders: number; revenue: number }>({ orders: 0, revenue: 0 });
  const [fetchedOrdersForYear, setFetchedOrdersForYear] = useState<Order[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(false);

  const yearsToShow = 5; // show current year and previous (yearsToShow-1) years
  const currentYear = new Date().getFullYear();

  const monthsList = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        new Date(0, i).toLocaleString("default", { month: "long" })
      ),
    []
  );

  const yearsList = useMemo(
    () => Array.from({ length: yearsToShow }, (_, i) => currentYear - i),
    [currentYear]
  );

  // fetch orders for selectedYear and build monthly datasets
  useEffect(() => {
    const fetchForYear = async (year: number) => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin/orders", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const resJson = await res.json();
        const allOrders: Order[] = Array.isArray(resJson)
          ? resJson
          : resJson.orders || [];

        // Filter and keep only orders for the selected year
        const ordersForYear = allOrders.filter((order) => {
          const rawDate = order.createdAt ?? order.date;
          if (!rawDate) return false;
          const d = new Date(rawDate);
          if (isNaN(d.getTime())) return false;
          return d.getFullYear() === year;
        });

        setFetchedOrdersForYear(ordersForYear);

        // Initialize months data
        const monthsRev: RevenueData[] = Array.from({ length: 12 }, (_, i) => ({
          month: new Date(0, i).toLocaleString("default", { month: "short" }),
          revenue: 0,
        }));
        const monthsOrders: OrdersPerMonthData[] = Array.from({ length: 12 }, (_, i) => ({
          month: new Date(0, i).toLocaleString("default", { month: "short" }),
          orders: 0,
        }));

        ordersForYear.forEach((order) => {
          const rawDate = order.createdAt ?? order.date;
          if (!rawDate) return;
          const orderDate = new Date(rawDate);
          if (isNaN(orderDate.getTime())) return;

          const status = (order.status || "").toLowerCase();
          if (["cancelled", "refunded"].includes(status)) return; // ignore these

          if (status === "delivered") {
            const monthIndex = orderDate.getMonth();
            const revenueValue = Number(order.total ?? order.amount ?? 0) || 0;
            monthsRev[monthIndex].revenue += revenueValue;
            monthsOrders[monthIndex].orders += 1;
          }
        });

        setRevenueData(monthsRev);
        setOrdersData(monthsOrders);
        setSelectedMonthIndex("All"); // reset month selection when year changes
      } catch (err) {
        console.error("Failed to fetch orders for year:", err);
        setFetchedOrdersForYear([]);
        setRevenueData([]);
        setOrdersData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchForYear(selectedYear);
  }, [selectedYear]);

  // When a month is selected, compute daily breakdown for that month and selectedYear
  useEffect(() => {
    if (selectedMonthIndex === "All") {
      setDailyData([]);
      setMonthSummary({ orders: 0, revenue: 0 });
      return;
    }

    const monthIndex = Number(selectedMonthIndex);
    const year = selectedYear;
    const orders = fetchedOrdersForYear;

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const daysArr: DailyData[] = Array.from({ length: daysInMonth }, (_, i) => ({
      dayLabel: String(i + 1),
      orders: 0,
      revenue: 0,
    }));

    let totalOrders = 0;
    let totalRevenue = 0;

    orders.forEach((order) => {
      const rawDate = order.createdAt ?? order.date;
      if (!rawDate) return;
      const orderDate = new Date(rawDate);
      if (isNaN(orderDate.getTime())) return;

      if (orderDate.getFullYear() !== year) return;
      if (orderDate.getMonth() !== monthIndex) return;

      const status = (order.status || "").toLowerCase();
      if (["cancelled", "refunded"].includes(status)) return;
      if (status !== "delivered") return;

      const day = orderDate.getDate(); // 1..daysInMonth
      const revenueValue = Number(order.total ?? order.amount ?? 0) || 0;

      daysArr[day - 1].orders += 1;
      daysArr[day - 1].revenue += revenueValue;

      totalOrders += 1;
      totalRevenue += revenueValue;
    });

    setDailyData(daysArr);
    setMonthSummary({ orders: totalOrders, revenue: totalRevenue });
  }, [selectedMonthIndex, fetchedOrdersForYear, selectedYear]);

  // small helper
  const formatINR = (value: number) => {
    try {
      return "₹" + value.toFixed(2);
    } catch {
      return "₹0.00";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center flex-wrapnpm  justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Revenue & Orders</h3>
          <p className="text-sm text-[var(--text-light)]">Choose year and optionally a month to see daily details</p>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-xs text-[var(--text-light)]">Year</label>
          <select
            className="rounded border px-2 py-1 text-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {yearsList.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <label className="text-xs text-[var(--text-light)]">Month</label>
          <select
            className="rounded border px-2 py-1 text-sm"
            value={selectedMonthIndex}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "All") setSelectedMonthIndex("All");
              else setSelectedMonthIndex(Number(val));
            }}
          >
            <option value="All">All Months</option>
            {monthsList.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Performance (monthly) */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-[var(--border-color)]">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-lg font-semibold">Revenue Performance — {selectedYear}</h4>
              <p className="text-sm text-[var(--text-light)]">Monthly revenue for the selected year</p>
            </div>

            <div className="text-right text-sm text-[var(--text-light)]">
              <div>Total revenue:</div>
              <div className="font-medium">{formatINR(revenueData.reduce((s, r) => s + r.revenue, 0))}</div>
            </div>
          </div>

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip formatter={(value: number) => `₹${Number(value).toFixed(2)}`} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary-color)"
                  strokeWidth={3}
                  dot={{ fill: "var(--primary-color)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders per month (bar) */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-[var(--border-color)]">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-lg font-semibold">Orders / Month — {selectedYear}</h4>
              <p className="text-sm text-[var(--text-light)]">Total delivered orders per month</p>
            </div>
            <div className="text-right text-sm text-[var(--text-light)]">
              <div>Total delivered orders this year:</div>
              <div className="font-medium">{ordersData.reduce((s, r) => s + r.orders, 0)}</div>
            </div>
          </div>

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip formatter={(value: number) => `${value} orders`} />
                <Bar dataKey="orders" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* If a particular month selected, show daily breakdown */}
      {selectedMonthIndex !== "All" && (
        <div className="bg-white rounded-xl shadow-md p-5 border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Daily Orders — {monthsList[Number(selectedMonthIndex)]} {selectedYear}</h3>
              <p className="text-sm text-[var(--text-light)]">Delivered orders and revenue per day</p>
            </div>

            <div className="text-right">
              <div className="text-sm text-[var(--text-light)]">Total Orders</div>
              <div className="font-medium text-lg">{monthSummary.orders}</div>
              <div className="text-xs text-[var(--text-light)] mt-1">Revenue: <span className="font-medium">{formatINR(monthSummary.revenue)}</span></div>
            </div>
          </div>

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="dayLabel" stroke="#6B7280" />
                <Tooltip
                  formatter={(value: number | string, name: string, props: Payload<string | number, string>) => {
                    const key = props?.dataKey;
                    if (key === "revenue") {
                      return [`₹${Number(value).toFixed(2)}`, "Revenue"];
                    }
                    return [`${value}`, "Orders"];
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="var(--primary-color)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>

          </div>
        </div>
      )}

      {loading && (
        <div className="text-sm text-[var(--text-light)]">Loading data...</div>
      )}
    </div>
  );
}
