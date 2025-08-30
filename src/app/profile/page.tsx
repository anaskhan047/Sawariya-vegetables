"use client";

import { useState, ChangeEvent } from "react";

export default function ProfilePage() {
  const [image, setImage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <main className="min-h-screen bg-[var(--background-color)] flex items-center justify-center p-6">
      <section className="w-full max-w-2xl bg-white border border-[var(--border-color)] rounded-2xl shadow-lg p-8 space-y-6">
        {/* Header */}
        <h2 className="text-center text-2xl font-semibold text-[var(--text-color)]">
          User Profile
        </h2>

        {/* Profile Image Upload */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--primary-color)]">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt="Profile"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-[var(--border-color)] text-[var(--text-light)]">
                📷
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-[var(--primary-color)] text-white p-2 rounded-full cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              📷
            </label>
          </div>
        </div>

        {/* User Details */}
        <section className="space-y-4">
          <div>
            <label className="block text-[var(--text-color)] mb-1">Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            />
          </div>
          <div>
            <label className="block text-[var(--text-color)] mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            />
          </div>
          <div>
            <label className="block text-[var(--text-color)] mb-1">Phone</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            />
          </div>
          <div>
            <label className="block text-[var(--text-color)] mb-1">Address</label>
            <input
              type="text"
              placeholder="Enter your address"
              className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            />
          </div>
        </section>

        {/* Actions */}
        <section className="flex justify-between items-center pt-4">
          <button
            onClick={() => setOpen(true)}
            className="bg-[var(--secondary-color)] hover:bg-[var(--primary-color)] text-white px-6 py-2 rounded-xl shadow"
          >
            Change Password
          </button>
          <button className="bg-[var(--accent-color)] hover:bg-yellow-500 text-black px-6 py-2 rounded-xl shadow">
            Save Changes
          </button>
        </section>
      </section>

      {/* Password Change Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-color)]">
              Change Password
            </h3>
            <div>
              <label className="block text-[var(--text-color)] mb-1">
                Old Password
              </label>
              <input
                type="password"
                placeholder="Enter old password"
                className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              />
            </div>
            <div>
              <label className="block text-[var(--text-color)] mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              />
            </div>
            <div>
              <label className="block text-[var(--text-color)] mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setOpen(false)}
                className="bg-[var(--border-color)] text-[var(--text-color)] px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button className="bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white px-4 py-2 rounded-lg">
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
