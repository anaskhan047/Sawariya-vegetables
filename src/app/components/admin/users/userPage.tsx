"use client";

import { useState } from "react";
import { Eye } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  pincode: string;
  orders: number;
};

const usersData: User[] = [
  { id: "SWU001", name: "Priya Sharma", email: "priya.s@example.com", phone: "+91 9876543210", pincode: "400001", orders: 12 },
  { id: "SWU002", name: "Amit Kumar", email: "amit.k@example.com", phone: "+91 9123456789", pincode: "110001", orders: 5 },
  { id: "SWU003", name: "Rina Patel", email: "rina.p@example.com", phone: "+91 9988776655", pincode: "380001", orders: 8 },
  { id: "SWU004", name: "Sameer Gupta", email: "sameer.g@example.com", phone: "+91 9012345678", pincode: "560001", orders: 15 },
  { id: "SWU005", name: "Deepa Singh", email: "deepa.s@example.com", phone: "+91 9345678901", pincode: "600001", orders: 3 },
];

export default function UsersPage() {
  const [pincodeFilter, setPincodeFilter] = useState("");
  const [orderFilter, setOrderFilter] = useState("");

  const filteredUsers = usersData.filter((user) => {
    const pincodeMatch = pincodeFilter ? user.pincode === pincodeFilter : true;
    const orderMatch =
      orderFilter === "high"
        ? user.orders > 10
        : orderFilter === "low"
        ? user.orders <= 10
        : true;
    return pincodeMatch && orderMatch;
  });

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* Heading */}
      <h1 className="text-2xl font-bold text-[color:var(--text-color)]">Users</h1>

      {/* Filters */}
      <div className="bg-[color:var(--background-color)] p-4 rounded-xl border border-[color:var(--border-color)] shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-[color:var(--text-color)]">
          Filter & Sort Users
        </h2>
        <div className="flex gap-4 flex-wrap">
          {/* Pincode filter */}
          <select
            className="border border-[color:var(--border-color)] rounded-lg p-2 text-[color:var(--text-light)]"
            value={pincodeFilter}
            onChange={(e) => setPincodeFilter(e.target.value)}
          >
            <option value="">All Pincodes</option>
            <option value="400001">400001</option>
            <option value="110001">110001</option>
            <option value="380001">380001</option>
            <option value="560001">560001</option>
            <option value="600001">600001</option>
          </select>

          {/* Orders filter */}
          <select
            className="border border-[color:var(--border-color)] rounded-lg p-2 text-[color:var(--text-light)]"
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
          >
            <option value="">All Orders</option>
            <option value="high">High Orders (&gt; 10)</option>
            <option value="low">Low Orders (≤ 10)</option>
          </select>

          <button
            className="px-4 py-2 rounded-lg text-white bg-[color:var(--secondary-color)] hover:bg-[color:var(--primary-color)]"
            onClick={() => {
              setPincodeFilter("");
              setOrderFilter("");
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* User Table / Cards */}
      <div className="bg-[color:var(--background-color)] p-4 rounded-xl border border-[color:var(--border-color)] shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-[color:var(--text-color)]">
          User List
        </h2>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-[900px] w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[color:var(--border-color)] bg-gray-50">
                <th className="p-3">User ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Pincode</th>
                <th className="p-3">Orders</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[color:var(--border-color)] hover:bg-gray-50"
                >
                  <td className="p-3">{user.id}</td>
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.phone}</td>
                  <td className="p-3">{user.pincode}</td>
                  <td className="p-3">{user.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile / Tablet Cards */}
        <div className="grid gap-4 lg:hidden">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="border border-[color:var(--border-color)] rounded-lg p-4 shadow-sm bg-white"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-[color:var(--text-color)]">
                  {user.name}
                </h3>
                <span className="text-xs px-2 py-1 rounded bg-[color:var(--secondary-color)] text-white">
                  {user.orders} Orders
                </span>
              </div>
              <p className="text-sm text-[color:var(--text-light)]">
                <strong>ID:</strong> {user.id}
              </p>
              <p className="text-sm text-[color:var(--text-light)]">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-sm text-[color:var(--text-light)]">
                <strong>Phone:</strong> {user.phone}
              </p>
              <p className="text-sm text-[color:var(--text-light)]">
                <strong>Pincode:</strong> {user.pincode}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
