"use client";

import { useState } from "react";

export default function DeliveryAreasPage() {
  const [areas, setAreas] = useState<string[]>([]);
  const [newArea, setNewArea] = useState("");

  const addArea = () => {
    if (!newArea.trim()) return;
    if (areas.includes(newArea.trim())) return; // Prevent duplicates
    setAreas([...areas, newArea.trim()]);
    setNewArea("");
  };

  const deleteArea = (name: string) => {
    setAreas(areas.filter((a) => a !== name));
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
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((a, i) => (
                <tr
                  key={i}
                  className="border-t"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <td className="p-3">{a}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => deleteArea(a)}
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
                    colSpan={2}
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
          {areas.map((a, i) => (
            <div
              key={i}
              className="border rounded-lg p-4 bg-white flex justify-between items-center"
              style={{ borderColor: "var(--border-color)" }}
            >
              <span className="font-medium">{a}</span>
              <button
                onClick={() => deleteArea(a)}
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
