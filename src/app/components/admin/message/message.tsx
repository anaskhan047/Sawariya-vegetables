"use client";
import React, { useEffect, useState } from "react";

type Message = {
  _id: string;
  name: string;
  email: string;
  number: string;
  message: string;
  createdAt: string;
  status?: "New" | "Replied";
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/message");
        const data = await res.json();
        if (data.success) {
          // Ensure client-side fallback for status
          const msgsWithStatus = (data.messages || []).map((msg: Message) => ({
            ...msg,
            status: msg.status || "New",
          }));
          setMessages(msgsWithStatus);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  const handleWhatsAppReply = async (msg: Message) => {
    const text = encodeURIComponent(
      `Hello ${msg.name}, regarding your message: "${msg.message}"`
    );
    window.open(`https://wa.me/${msg.number}?text=${text}`, "_blank");

    // Optimistically update status locally
    setMessages((prev) =>
      prev.map((m) =>
        m._id === msg._id ? { ...m, status: "Replied" } : m
      )
    );

    // Persist status in database
    try {
      await fetch("/api/message", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: msg._id, status: "Replied" }),
      });
    } catch (err) {
      console.error("Failed to update message status:", err);
    }
  };

  if (loading)
    return <p className="text-center py-10 text-[var(--text-light)]">Loading messages...</p>;
  if (messages.length === 0)
    return <p className="text-center py-10 text-[var(--text-light)]">No messages found.</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <div className="hidden lg:block bg-white rounded-2xl shadow p-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-sm text-[var(--text-light)] border-b border-[var(--border-color)]">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Number</th>
              <th className="p-3">Message</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((msg) => (
              <tr key={msg._id} className="border-b border-[var(--border-color)] text-sm">
                <td className="p-3">{msg.name}</td>
                <td className="p-3">{msg.email}</td>
                <td className="p-3">{msg.number}</td>
                <td className="p-3 max-w-xs truncate">{msg.message}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-white text-xs ${msg.status === "Replied" ? "bg-green-500" : "bg-blue-500"
                      }`}
                  >
                    {msg.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleWhatsAppReply(msg)}
                    className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Reply on WhatsApp
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-4 lg:hidden">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className="border border-[var(--border-color)] rounded-xl p-4 shadow-sm"
          >
            <p className="font-semibold">{msg.name}</p>
            <p className="text-[var(--text-light)] text-sm">{msg.email}</p>
            <p className="text-[var(--text-light)] text-sm">{msg.number}</p>
            <p className="mt-2 text-sm">{msg.message}</p>
            <p className="mt-2 text-xs font-semibold">
              Status:{" "}
              <span
                className={`px-2 py-1 rounded-full text-white ${msg.status === "Replied" ? "bg-green-500" : "bg-blue-500"
                  }`}
              >
                {msg.status}
              </span>
            </p>
            <button
              onClick={() => handleWhatsAppReply(msg)}
              className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition"
            >
              Reply on WhatsApp
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
