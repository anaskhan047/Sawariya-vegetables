// src/app/api/auth/register/verify/route.ts
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";
import Otp from "@/app/models/Otp";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { welcomeEmailTemplate, sendMail } from "@/app/api/utils/sendMail";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) return NextResponse.json({ success: false, error: "Email and OTP required" }, { status: 400 });

    await dbConnect();

    const otpDoc = await Otp.findOne({ email, type: "register" }).sort({ createdAt: -1 });
    if (!otpDoc) return NextResponse.json({ success: false, error: "Invalid or expired OTP" }, { status: 400 });

    const ok = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!ok) return NextResponse.json({ success: false, error: "Invalid OTP" }, { status: 400 });

    // Create user from payload
    const payload = otpDoc.payload as { name: string; passwordHash: string; role?: string };
    // double-check email uniqueness
    const exists = await User.findOne({ email });
    if (exists) {
      // cleanup otp(s)
      await Otp.deleteMany({ email, type: "register" });
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 400 });
    }

    const newUser = await User.create({
      name: payload.name,
      email,
      password: payload.passwordHash,
      role: payload.role ?? "user",
    }) as typeof User.prototype;

    // delete used OTPs
    await Otp.deleteMany({ email, type: "register" });

    // sign token
    const token = jwt.sign(
      { id: newUser._id.toString(), role: newUser.role, name: newUser.name, email: newUser.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // prepare response and set cookie
    const res = NextResponse.json({
      success: true,
      message: "Registration verified",
      user: { id: newUser._id.toString(), name: newUser.name, email: newUser.email, role: newUser.role },
      redirectUrl: newUser.role === "admin" ? "/admin" : newUser.role === "delivery" ? "/deliveryBoy" : "/shop",
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    // optional: send welcome email (non-blocking)
    try { await sendMail(email, "Welcome!", welcomeEmailTemplate({ name: newUser.name })); } catch (e) { console.warn("Welcome email failed:", e); }

    return res;
  } catch (err: unknown) {
    console.error("REGISTER VERIFY ERROR:", err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
