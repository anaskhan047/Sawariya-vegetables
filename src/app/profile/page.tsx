"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Camera, MapPin, Phone, Mail, UserCircle2, ShieldCheck } from "lucide-react";
import { User } from "@/app/lib/types";
import CircularLoader from "../components/Loader/Loader";

type PasswordField = "old" | "new" | "confirm";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [open, setOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState<Record<PasswordField, boolean>>({ old: false, new: false, confirm: false });
  const [changingPassword, setChangingPassword] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newFP, setNewFP] = useState("");
  const [confirmFP, setConfirmFP] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

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

    fetchUser().catch(() => undefined);
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

  async function handleChangePassword() {
    if (changingPassword) return;

    if (newPass !== confirmPass) {
      alert("New password and confirm password do not match");
      return;
    }

    try {
      setChangingPassword(true);
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Password update failed");
        return;
      }

      alert("Password changed successfully");
      setOpen(false);
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSendOtp() {
    if (sendingOtp || !user?.email) return;

    try {
      setSendingOtp(true);
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await res.json();
      if (data.success) {
        alert("OTP sent to your email");
        setOtpSent(true);
      } else {
        alert(data.error || "Unable to send OTP");
      }
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleResetPassword() {
    if (resettingPassword) return;

    if (newFP !== confirmFP) {
      alert("Passwords do not match");
      return;
    }

    try {
      setResettingPassword(true);
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, otp, newPassword: newFP }),
      });

      const data = await res.json().catch(() => ({ success: false, error: "Invalid server response" }));
      if (!data.success) {
        alert(data.error || "Reset failed");
        return;
      }

      alert("Password reset successfully");
      setForgotOpen(false);
      setOtpSent(false);
      setOtp("");
      setNewFP("");
      setConfirmFP("");
    } finally {
      setResettingPassword(false);
    }
  }

  const handleSave = async () => {
    if (saving || !user) return;

    try {
      setSaving(true);
      const res = await fetch("/api/auth/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...user, image }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Profile updated successfully");
      } else {
        alert(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Something went wrong while updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <CircularLoader />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-center text-slate-700">
        No user logged in.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-100 px-3 pb-10 pt-24 sm:px-5">
      <section className="mx-auto w-full max-w-5xl space-y-4">
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-600 via-emerald-500 to-lime-500 p-5 text-white shadow-lg sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">My Account</p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">Profile Settings</h1>
          <p className="mt-2 text-sm text-emerald-50">Update your details, password, and contact information from one clean dashboard.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mx-auto mb-4 w-fit rounded-full border-4 border-emerald-100 p-1">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <UserCircle2 className="h-12 w-12" />
                  </div>
                )}

                <label className="absolute bottom-1 right-1 inline-flex cursor-pointer items-center justify-center rounded-full bg-emerald-600 p-2 text-white shadow">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  <Camera className="h-4 w-4" />
                </label>
              </div>
            </div>

            <h2 className="text-center text-lg font-bold text-slate-900">{user.name || "User"}</h2>
            <p className="mt-1 text-center text-sm text-slate-500">Manage your profile and security settings</p>

            <div className="mt-5 space-y-2 text-sm text-slate-700">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-emerald-600" /> {user.email || "--"}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-600" /> {user.phone || "No phone added"}</p>
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-emerald-600" /> {user.address || "No address added"}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-4 text-xl font-bold text-slate-900">Personal Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Name</span>
                <input
                  type="text"
                  name="name"
                  value={user.name || ""}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Phone</span>
                <input
                  type="tel"
                  name="phone"
                  value={user.phone || ""}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Email</span>
                <input
                  type="email"
                  name="email"
                  value={user.email || ""}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Address</span>
                <input
                  type="text"
                  name="address"
                  value={user.address || ""}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
                />
              </label>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <button
                onClick={() => setOpen(true)}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Change Password
              </button>
              <button
                onClick={() => setForgotOpen(true)}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                Forgot Password
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${saving ? "cursor-not-allowed bg-slate-400" : "bg-slate-900 hover:bg-slate-800"}`}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Change Password</h3>
            <p className="mt-1 text-sm text-slate-500">Use a strong password to keep your account secure.</p>

            <div className="mt-4 space-y-3">
              {[
                { key: "old", label: "Old Password", value: oldPass, setter: setOldPass },
                { key: "new", label: "New Password", value: newPass, setter: setNewPass },
                { key: "confirm", label: "Confirm Password", value: confirmPass, setter: setConfirmPass },
              ].map((item) => (
                <label key={item.key} className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">{item.label}</span>
                  <div className="relative">
                    <input
                      type={showPass[item.key as PasswordField] ? "text" : "password"}
                      value={item.value}
                      onChange={(e) => item.setter(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((prev) => ({ ...prev, [item.key]: !prev[item.key as PasswordField] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    >
                      {showPass[item.key as PasswordField] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${changingPassword ? "cursor-not-allowed bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {changingPassword ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Forgot Password</h3>
            <p className="mt-1 text-sm text-slate-500">Reset your password with OTP verification.</p>

            {!otpSent ? (
              <button
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${sendingOtp ? "cursor-not-allowed bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {sendingOtp ? "Sending OTP..." : `Send OTP to ${user.email}`}
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">OTP</span>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
                    placeholder="Enter OTP"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">New Password</span>
                  <input
                    type="password"
                    value={newFP}
                    onChange={(e) => setNewFP(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
                    placeholder="New password"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">Confirm Password</span>
                  <input
                    type="password"
                    value={confirmFP}
                    onChange={(e) => setConfirmFP(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
                    placeholder="Confirm password"
                  />
                </label>

                <button
                  onClick={handleResetPassword}
                  disabled={resettingPassword}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${resettingPassword ? "cursor-not-allowed bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700"}`}
                >
                  {resettingPassword ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setForgotOpen(false);
                  setOtpSent(false);
                  setOtp("");
                  setNewFP("");
                  setConfirmFP("");
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
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
