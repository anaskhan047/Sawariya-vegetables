"use client";

import { useEffect, useState } from "react";

type Area = {
  _id: string;
  name: string;
  pincode: string;
};

export default function DeliveryAreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [newArea, setNewArea] = useState("");
  const [newPincode, setNewPincode] = useState("");

  // 🔹 Fetch Areas from API
  const fetchAreas = async () => {
    try {
      const res = await fetch("/api/delivery-area");
      const data = await res.json();
      if (res.ok) setAreas(data);
    } catch (err) {
      console.error("Failed to fetch areas", err);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  // 🔹 Add Area
  const addArea = async () => {
    if (!newArea.trim() || !newPincode.trim()) return;

    try {
      const res = await fetch("/api/delivery-area", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newArea.trim(), pincode: newPincode.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setAreas([...areas, data.area]);
        setNewArea("");
        setNewPincode("");
      } else {
        alert(data.message || "Failed to add area");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Delete Area
  const deleteArea = async (id: string) => {
    try {
      const res = await fetch(`/api/delivery-area?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAreas(areas.filter((a) => a._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="container mx-auto p-6">
      <div
        className="rounded-xl border bg-white shadow-sm p-6"
        style={{ borderColor: "var(--border-color)" }}
      >
        <h1
          className="text-2xl font-bold mb-4"
          style={{ color: "var(--text-color)" }}
        >
          Delivery Areas
        </h1>

        {/* Input Box */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={newArea}
            onChange={(e) => setNewArea(e.target.value)}
            placeholder="Enter area name"
            className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-color)",
            }}
          />
          <input
            type="text"
            value={newPincode}
            onChange={(e) => setNewPincode(e.target.value)}
            placeholder="Enter pincode"
            className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-color)",
            }}
          />
          <button
            onClick={addArea}
            className="px-5 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            Add Area
          </button>
        </div>

        {/* Table (desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-[600px] w-full border-collapse">
            <thead>
              <tr
                className="text-left text-sm"
                style={{ color: "var(--text-light)" }}
              >
                <th className="p-3">Area Name</th>
                <th className="p-3">Pincode</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => (
                <tr
                  key={a._id}
                  className="border-t"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <td className="p-3">{a.name}</td>
                  <td className="p-3">{a.pincode}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => deleteArea(a._id)}
                      className="px-3 py-1.5 rounded-lg text-white text-sm"
                      style={{ backgroundColor: "var(--secondary-color)" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {areas.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="p-6 text-center text-sm"
                    style={{ color: "var(--text-light)" }}
                  >
                    No areas added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card View (mobile) */}
        <div className="grid gap-4 md:hidden">
          {areas.map((a) => (
            <div
              key={a._id}
              className="border rounded-lg p-4 bg-white flex justify-between items-center"
              style={{ borderColor: "var(--border-color)" }}
            >
              <span className="font-medium">
                {a.name} ({a.pincode})
              </span>
              <button
                onClick={() => deleteArea(a._id)}
                className="px-3 py-1.5 rounded-lg text-white text-sm"
                style={{ backgroundColor: "var(--secondary-color)" }}
              >
                Delete
              </button>
            </div>
          ))}
          {areas.length === 0 && (
            <div
              className="text-center text-sm py-6"
              style={{ color: "var(--text-light)" }}
            >
              No areas added yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
