// app/api/auth/forgot-password/route.ts
import bcrypt from "bcryptjs";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";
import Otp from "@/app/models/Otp";
import { sendMail, otpEmailTemplate } from "@/app/api/utils/sendMail";
import { NextRequest, NextResponse } from "next/server";

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      // For security, still return success (do not reveal whether email exists)
      return NextResponse.json({ success: true, message: "If that email exists, an OTP was sent" });
    }

    const otp = genOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await Otp.create({ email, otpHash, type: "forgot" });

    await sendMail(email, "Password reset OTP", otpEmailTemplate({ name: user.name, otp, purpose: "password reset" }));

    return NextResponse.json({ success: true, message: "If that email exists, an OTP was sent" });
  } catch (err: unknown) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
