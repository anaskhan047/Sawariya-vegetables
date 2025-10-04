"use client";

import React, { useState } from "react";

type Subscriber = {
  _id: string;
  email: string;
  name?: string;
};

export default function SubscribePage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscribe");
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.subscribe); // your API returns 'subscribe'
      } else {
        alert("Failed to fetch subscribers");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  const openMailClient = () => {
    const emails = subscribers.map(sub => sub.email).join(",");
    const subject = encodeURIComponent("Hello Subscribers");
    const body = encodeURIComponent("This is a message to all subscribers.");
    window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-[var(--primary-color)] text-center">
        Subscribers
      </h1>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
        <button
          onClick={fetchSubscribers}
          className="bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 duration-300"
        >
          {loading ? "Loading..." : "Fetch Subscribers"}
        </button>

        <button
          onClick={openMailClient}
          disabled={subscribers.length === 0}
          className="bg-[var(--accent-color)] hover:bg-yellow-400 text-white py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 duration-300 disabled:opacity-50"
        >
          Mail All Subscribers
        </button>
      </div>

      {/* Subscriber Grid */}
      {subscribers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {subscribers.map((sub) => (
            <div
              key={sub._id}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-300 flex flex-col items-center text-center"
            >
              <div className="text-[var(--primary-color)] font-bold text-lg mb-2">
                {sub.name || "Subscriber"}
              </div>
              <div className="text-[var(--text-light)] break-all">{sub.email}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[var(--text-light)] mt-6 text-center">
          No subscribers fetched yet.
        </p>
      )}
    </div>
  );
}
