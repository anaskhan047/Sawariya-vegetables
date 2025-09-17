"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  image?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  cartItemsCount: number;
  orders: string | number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pincodeFilter, setPincodeFilter] = useState("");
  const [orderFilter, setOrderFilter] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success) setUsers(data.users);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
  const address = user.address || ""; // prevent undefined error

  const pincodeMatch = pincodeFilter
    ? address.includes(pincodeFilter)
    : true;

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
});


  if (loading)
    return <p className="text-center py-10 text-gray-600">Loading users...</p>;

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Users</h1>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-lg flex-1 min-w-[200px]"
        />
        <input
          type="text"
          placeholder="Filter by pincode"
          value={pincodeFilter}
          onChange={(e) => setPincodeFilter(e.target.value)}
          className="border p-2 rounded-lg min-w-[150px]"
        />
        <select
          value={orderFilter}
          onChange={(e) => setOrderFilter(e.target.value)}
          className="border p-2 rounded-lg"
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Clear Filters
        </button>
      </div>

      {/* User Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white flex flex-col"
          >
            <div className="flex items-center mb-3">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-12 h-12 rounded-full mr-3 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full mr-3 bg-gray-200 flex items-center justify-center text-gray-500">
                  {user.name[0]}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Phone:</strong> {user.phone}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Address:</strong> {user.address}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Role:</strong> {user.role}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Cart Items:</strong> {user.cartItemsCount}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Orders:</strong> {user.orders || "-"}
            </p>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-10">
            No users found.
          </p>
        )}
      </div>
    </div>
  );
}
