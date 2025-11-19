"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { User } from "@/app/lib/types";
import { Eye, EyeOff } from "lucide-react"; // 👁 icons
import CircularLoader from "../components/Loader/Loader";


export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // password fields
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  // forgot password fields
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newFP, setNewFP] = useState("");
  const [confirmFP, setConfirmFP] = useState("");
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.loggedIn) {
          setUser(data.user);
          setImage(data.user.image || null);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  //  change password
  async function handleChangePassword() {
    if (newPass !== confirmPass) {
      alert("New password and confirm password do not match");
      return;
    }

    const res = await fetch("/api/auth/change-password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
    });

    const data = await res.json();
    if (!res.ok) alert(data.error || "Change failed");
    else {
      alert("Password changed successfully");
      setOpen(false);
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    }
  }


  //  forgot password flow
  async function handleSendOtp() {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user?.email }),
    });
    const data = await res.json();
    if (data.success) {
      alert("OTP sent to your email");
      setOtpSent(true);
    } else alert(data.error);
  }

 async function handleResetPassword() {
  if (newFP !== confirmFP) {
    alert("Passwords do not match");
    return;
  }
  const res = await fetch("/api/auth/forgot-password/verify", {  // 👈 correct path
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user?.email, otp, newPassword: newFP }),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = { success: false, error: "Invalid server response" };
  }
  if (data.success) {
    alert("Password reset successfully");
    setForgotOpen(false);
    setOtpSent(false);
    setOtp("");
    setNewFP("");
    setConfirmFP("");
  } else alert(data.error);
}


  const handleSave = async () => {
    try {
      const res = await fetch("/api/auth/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...user, image }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Profile updated!");
      } else {
        alert("Failed to update: " + data.error);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <CircularLoader />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>No user logged in.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background-color)] flex items-center justify-center p-6">
      <section className="w-full max-w-2xl bg-white border border-[var(--border-color)] rounded-2xl shadow-lg p-8 space-y-6">
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
              name="name"
              value={user.name || ""}
              onChange={handleChange}
              className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-[var(--text-color)] mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={user.email || ""}
              readOnly
              className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-[var(--text-color)] mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={user.phone || ""}
              onChange={handleChange}
              className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-[var(--text-color)] mb-1">Address</label>
            <input
              type="text"
              name="address"
              value={user.address || ""}
              onChange={handleChange}
              className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2"
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
          <button
            onClick={() => setForgotOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl shadow"
          >
            Forgot Password
          </button>
          <button
            onClick={handleSave}
            className="bg-[var(--accent-color)] hover:bg-yellow-500 text-black px-6 py-2 rounded-xl shadow"
          >
            Save Changes
          </button>
        </section>
      </section>

      {/* 🔒 Change Password Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-color)]">
              Change Password
            </h3>
            {["Old Password", "New Password", "Confirm Password"].map(
              (placeholder, idx) => (
                <div key={idx} className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder={placeholder}
                    value={
                      idx === 0 ? oldPass : idx === 1 ? newPass : confirmPass
                    }
                    onChange={(e) =>
                      idx === 0
                        ? setOldPass(e.target.value)
                        : idx === 1
                          ? setNewPass(e.target.value)
                          : setConfirmPass(e.target.value)
                    }
                    className="w-full border rounded-lg px-3 py-2 mb-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-3 text-gray-600"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              )
            )}
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setOpen(false)}
                className="bg-[var(--border-color)] text-[var(--text-color)] px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white px-4 py-2 rounded-lg"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔑 Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-color)]">
              Forgot Password
            </h3>
            {!otpSent ? (
              <button
                onClick={handleSendOtp}
                className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-lg"
              >
                Send OTP to {user?.email}
              </button>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 mb-2"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newFP}
                  onChange={(e) => setNewFP(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 mb-2"
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmFP}
                  onChange={(e) => setConfirmFP(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 mb-2"
                />
                <button
                  onClick={handleResetPassword}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  Reset Password
                </button>
              </>
            )}
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setForgotOpen(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
