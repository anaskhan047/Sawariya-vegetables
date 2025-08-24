"use client";

import React from "react";

type Message = {
  id: string;
  user: string;
  subject: string;
  date: string;
  status: "New" | "Replied" | "Archived";
};

const messages: Message[] = [
  {
    id: "MSG001",
    user: "Priya Sharma",
    subject: "Issue with recent vegetable delivery",
    date: "2024-07-28 10:30 AM",
    status: "New",
  },
  {
    id: "MSG002",
    user: "Rahul Kumar",
    subject: "Query about organic produce sourcing",
    date: "2024-07-27 03:15 PM",
    status: "Replied",
  },
  {
    id: "MSG003",
    user: "Sneha Patel",
    subject: "Feedback on website navigation",
    date: "2024-07-26 11:00 AM",
    status: "New",
  },
  {
    id: "MSG004",
    user: "Amit Singh",
    subject: "Request for bulk order pricing",
    date: "2024-07-25 09:45 AM",
    status: "New",
  },
  {
    id: "MSG005",
    user: "Deepa Devi",
    subject: "Complaint about delivery time",
    date: "2024-07-24 07:00 PM",
    status: "Archived",
  },
];

export default function Messages() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">All Messages</h2>

        {/* Table for md+ screens */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-sm text-[var(--text-light)] border-b border-[var(--border-color)]">
                <th className="p-3">Message ID</th>
                <th className="p-3">User Name</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Date Received</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr
                  key={msg.id}
                  className="border-b border-[var(--border-color)] text-sm"
                >
                  <td className="p-3">{msg.id}</td>
                  <td className="p-3">{msg.user}</td>
                  <td className="p-3">{msg.subject}</td>
                  <td className="p-3">{msg.date}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        msg.status === "New"
                          ? "bg-blue-100 text-blue-600"
                          : msg.status === "Replied"
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {msg.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button className="px-4 py-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--primary-color)] hover:text-white transition">
                      View & Reply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards for < md screens */}
        <div className="space-y-4 lg:hidden">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="border border-[var(--border-color)] rounded-xl p-4 shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{msg.id}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    msg.status === "New"
                      ? "bg-blue-100 text-blue-600"
                      : msg.status === "Replied"
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {msg.status}
                </span>
              </div>
              <p className="text-sm font-semibold">{msg.user}</p>
              <p className="text-sm text-[var(--text-light)] mb-2">
                {msg.subject}
              </p>
              <p className="text-xs text-[var(--text-light)] mb-3">{msg.date}</p>
              <button className="w-full px-4 py-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--primary-color)] hover:text-white transition">
                View & Reply
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
