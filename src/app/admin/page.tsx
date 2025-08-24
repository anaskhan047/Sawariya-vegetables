"use client";
import React from "react";
import StatsCard from "../components/admin/dashboard/StatsCard";
import RevenueChart from "../components/admin/dashboard/RevenueChart";
import RecentOrdersTable from "../components/admin/dashboard/RecentOrdersTable";

export default function Dashboard() {
  return (
    <main className="container mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard title="Total Orders Today" value={125} icon="orders" />
        <StatsCard title="Total Users" value="5,230" icon="users" />
        <StatsCard title="Active Subscriptions" value={87} icon="subscriptions" />
        <StatsCard title="Pending Orders" value={18} icon="pending" />
      </div>

      {/* Revenue Chart */}
      <RevenueChart />

      {/* Recent Orders */}
      <RecentOrdersTable />
    </main>
  );
}
