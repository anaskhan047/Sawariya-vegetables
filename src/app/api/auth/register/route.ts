// src/app/api/auth/register/route.ts
import bcrypt from "bcryptjs";
import dbConnect from "@/app/lib/mongodb";
import Otp from "@/app/models/Otp";
import { sendMail, otpEmailTemplate } from "@/app/api/utils/sendMail";
import { NextRequest, NextResponse } from "next/server";

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "All fields required" }, { status: 400 });
    }

    await dbConnect();

    // OPTIONAL: check existing user and return error if you want to block duplicate registration.
    // If you prefer the flow where user must verify email even if account exists, adjust accordingly.
    // const exists = await User.findOne({ email });
    // if (exists) return NextResponse.json({ success: false, error: "Email already registered" }, { status: 400 });

    const otp = genOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const passwordHash = await bcrypt.hash(password, 10);

    // store the OTP document with the user payload (we'll create user on verify)
    await Otp.create({
      email,
      otpHash,
      type: "register",
      payload: { name, passwordHash, role: role ?? "user" },
    });

    // send email (don't expose internal info)
    await sendMail(email, "Verify your account", otpEmailTemplate({ name, otp, purpose: "account verification" }));

    return NextResponse.json({ success: true, message: "OTP sent to email" }, { status: 200 });
  } catch (err: unknown) {
    console.error("REGISTER ERROR:", err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
