"use client";
import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

const data = [
  { month: "Jan", revenue: 15000 },
  { month: "Feb", revenue: 17000 },
  { month: "Mar", revenue: 20000 },
  { month: "Apr", revenue: 18500 },
  { month: "May", revenue: 23000 },
  { month: "Jun", revenue: 26000 },
  { month: "Jul", revenue: 29000 },
  { month: "Aug", revenue: 27500 },
];

export default function RevenueChart() {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-[var(--border-color)]">
      <h3 className="text-lg font-semibold mb-3">Revenue Performance</h3>
      <p className="text-sm text-[var(--text-light)] mb-4">
        Weekly revenue trends for the last 8 weeks.
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" stroke="#6B7280" />
          <YAxis stroke="#6B7280" />
          <Tooltip />
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
  );
}
