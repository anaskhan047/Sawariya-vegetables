"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  image?: string;
  role: string;
  orders: number;
  cancelledOrders: number;
  isActive: boolean;
};

type OrderItem = {
  name?: string;
  inHindi?: string;
  quantity?: number;
  unit?: string;
  price?: number;
};

type OrderDetail = {
  id: string;
  total: number;
  subTotal: number;
  deliveryCharge: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  otp?: string;
  address?: {
    name?: string;
    phone?: string;
    address?: string;
    area?: string | { name?: string; pincode?: string };
  };
  items: OrderItem[];
};

type UserOrderDetailsResponse = {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    image?: string;
    role: string;
    isActive: boolean;
  };
  summary?: {
    totalOrders: number;
    cancelledOrders: number;
    totalSpend: number;
  };
  orders?: OrderDetail[];
  message?: string;
};

function getStatusClass(status: string) {
  const value = status.toLowerCase();
  if (value === "delivered") return "bg-emerald-100 text-emerald-700";
  if (value === "packed") return "bg-amber-100 text-amber-700";
  if (value === "in_transit") return "bg-sky-100 text-sky-700";
  if (value === "cancelled") return "bg-rose-100 text-rose-700";
  if (value === "refunded") return "bg-violet-100 text-violet-700";
  return "bg-slate-100 text-slate-700";
}

function formatArea(area: unknown) {
  if (!area) return "--";
  if (typeof area === "string") return area;
  if (typeof area === "object") {
    const a = area as { name?: string; pincode?: string };
    return `${a.name || ""}${a.pincode ? ` (${a.pincode})` : ""}`.trim() || "--";
  }
  return "--";
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pincodeFilter, setPincodeFilter] = useState("");
  const [orderFilter, setOrderFilter] = useState("");

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<OrderDetail[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<{
    totalOrders: number;
    cancelledOrders: number;
    totalSpend: number;
  } | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users-with-orders");
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const address = user.address || "";
        const pincodeMatch = pincodeFilter ? address.includes(pincodeFilter) : true;

        const orderMatch =
          orderFilter === "high"
            ? Number(user.orders) > 10
            : orderFilter === "low"
            ? Number(user.orders) <= 10
            : true;

        const searchMatch = search
          ? user.name.toLowerCase().includes(search.toLowerCase()) ||
            (user.email || "").toLowerCase().includes(search.toLowerCase()) ||
            (user.phone || "").includes(search)
          : true;

        return pincodeMatch && orderMatch && searchMatch;
      })
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""), "en", {
          sensitivity: "base",
        })
      );
  }, [orderFilter, pincodeFilter, search, users]);

  const openDetails = async (user: User) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setSelectedUser(user);
    setSelectedOrders([]);
    setSelectedSummary(null);

    try {
      const res = await fetch(`/api/admin/users-with-orders?userId=${encodeURIComponent(user.id)}`);
      const data = (await res.json()) as UserOrderDetailsResponse;

      if (!data.success) {
        alert(data.message || "Failed to load user details");
        return;
      }

      setSelectedSummary(
        data.summary || {
          totalOrders: 0,
          cancelledOrders: 0,
          totalSpend: 0,
        }
      );
      setSelectedOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      console.error(err);
      alert("Failed to load user details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      const res = await fetch("/api/admin/toggle-user-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, isActive: !user.isActive }),
      });

      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
        );
        setSelectedUser((prev) => (prev?.id === user.id ? { ...prev, isActive: !user.isActive } : prev));
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  if (loading) {
    return <p className="py-10 text-center text-gray-600">Loading users...</p>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-3 md:p-6">
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-4 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Users Management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Desktop me aligned table, mobile me compact cards, aur user-wise detailed order intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-4 shadow-sm md:grid-cols-4">
        <input
          type="text"
          placeholder="Search name/email/phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Filter by pincode"
          value={pincodeFilter}
          onChange={(e) => setPincodeFilter(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <select
          value={orderFilter}
          onChange={(e) => setOrderFilter(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All Orders</option>
          <option value="high">High Orders (&gt; 10)</option>
          <option value="low">Low Orders (≤ 10)</option>
        </select>
        <button
          onClick={() => {
            setSearch("");
            setPincodeFilter("");
            setOrderFilter("");
          }}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Clear Filters
        </button>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border bg-white shadow-sm lg:block">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="w-[19%] px-3 py-3 text-left">User</th>
              <th className="w-[16%] px-3 py-3 text-left">Contact</th>
              <th className="w-[18%] px-3 py-3 text-left">Address</th>
              <th className="w-[8%] px-3 py-3 text-left">Role</th>
              <th className="w-[12%] px-3 py-3 text-left">Order Stats</th>
              <th className="w-[9%] px-3 py-3 text-left">Status</th>
              <th className="w-[18%] px-3 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b align-top hover:bg-slate-50/80">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <img src={user.image} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                        {user.name?.[0] || "U"}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-slate-600">{user.phone || "--"}</td>
                <td className="px-3 py-3 text-slate-600">{user.address || "--"}</td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">
                    {user.role}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-slate-700">
                  <p>Total: <span className="font-semibold">{user.orders}</span></p>
                  <p>Cancelled: <span className="font-semibold text-rose-600">{user.cancelledOrders}</span></p>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openDetails(user)}
                      className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium text-white ${
                        user.isActive ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600"
                      }`}
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:hidden sm:grid-cols-2">
        {filteredUsers.map((user, idx) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.2) }}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-3">
              {user.image ? (
                <img src={user.image} alt={user.name} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                  {user.name?.[0] || "U"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <p><span className="font-medium">Phone:</span> {user.phone || "--"}</p>
              <p><span className="font-medium">Address:</span> {user.address || "--"}</p>
              <p><span className="font-medium">Role:</span> {user.role}</p>
              <p><span className="font-medium">Orders:</span> {user.orders}</p>
              <p><span className="font-medium">Cancelled:</span> {user.cancelledOrders}</p>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}
              >
                {user.isActive ? "Active" : "Inactive"}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => openDetails(user)}
                  className="rounded-md bg-sky-600 px-2.5 py-1.5 text-xs font-medium text-white"
                >
                  Details
                </button>
                <button
                  onClick={() => toggleUserStatus(user)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium text-white ${
                    user.isActive ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                >
                  {user.isActive ? "Off" : "On"}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="rounded-xl border border-dashed bg-white px-4 py-10 text-center text-slate-500">
          No users found.
        </div>
      )}

      <AnimatePresence>
        {detailsOpen && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3"
            onClick={() => setDetailsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b bg-slate-900 p-4 text-white">
                <div>
                  <h2 className="text-lg font-semibold">User Details - {selectedUser.name}</h2>
                  <p className="text-xs text-slate-300">Complete order history and profile summary</p>
                </div>
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="rounded-md border border-slate-500 px-3 py-1 text-sm hover:bg-slate-800"
                >
                  Close
                </button>
              </div>

              <div className="max-h-[calc(90vh-72px)] overflow-auto p-4">
                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="rounded-xl border bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Total Orders</p>
                    <p className="text-xl font-bold text-slate-900">{selectedSummary?.totalOrders ?? selectedUser.orders}</p>
                  </div>
                  <div className="rounded-xl border bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Cancelled Orders</p>
                    <p className="text-xl font-bold text-rose-600">{selectedSummary?.cancelledOrders ?? selectedUser.cancelledOrders}</p>
                  </div>
                  <div className="rounded-xl border bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Total Spend</p>
                    <p className="text-xl font-bold text-slate-900">Rs {selectedSummary?.totalSpend ?? 0}</p>
                  </div>
                  <div className="rounded-xl border bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Current Status</p>
                    <p className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${selectedUser.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>

                <div className="mb-4 rounded-xl border p-3 text-sm text-slate-700">
                  <p><span className="font-semibold">Email:</span> {selectedUser.email || "--"}</p>
                  <p><span className="font-semibold">Phone:</span> {selectedUser.phone || "--"}</p>
                  <p><span className="font-semibold">Address:</span> {selectedUser.address || "--"}</p>
                  <p><span className="font-semibold">Role:</span> {selectedUser.role}</p>
                </div>

                {detailsLoading ? (
                  <p className="py-8 text-center text-sm text-slate-500">Loading detailed orders...</p>
                ) : selectedOrders.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">No orders found for this user.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="px-3 py-2 text-left">Order ID</th>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Items</th>
                          <th className="px-3 py-2 text-left">Amount</th>
                          <th className="px-3 py-2 text-left">Payment</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Address</th>
                          <th className="px-3 py-2 text-left">OTP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrders.map((order) => (
                          <tr key={order.id} className="border-t align-top hover:bg-slate-50">
                            <td className="px-3 py-2 font-mono text-xs text-slate-700">{order.id}</td>
                            <td className="px-3 py-2 text-xs text-slate-600">{new Date(order.createdAt).toLocaleString()}</td>
                            <td className="px-3 py-2 text-xs text-slate-700">
                              {order.items?.map((item, idx) => (
                                <p key={idx}>
                                  {item.name || "Item"}
                                  {item.inHindi ? ` / ${item.inHindi}` : ""} ({item.quantity || 0} {item.unit || ""}) - Rs {item.price || 0}
                                </p>
                              ))}
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-700">
                              <p>Total: <span className="font-semibold">Rs {order.total}</span></p>
                              <p>SubTotal: Rs {order.subTotal}</p>
                              <p>Delivery: Rs {order.deliveryCharge}</p>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-700">
                              <p>{String(order.paymentMethod || "--").toUpperCase()}</p>
                              <p className="text-slate-500">{order.paymentStatus || "--"}</p>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-700">
                              <p>{order.address?.address || "--"}</p>
                              <p className="text-slate-500">Area: {formatArea(order.address?.area)}</p>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-700">{order.otp || "--"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
