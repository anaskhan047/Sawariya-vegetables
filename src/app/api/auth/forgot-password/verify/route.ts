// app/api/auth/forgot-password/verify/route.ts
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";
import Otp from "@/app/models/Otp";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) {
      return NextResponse.json({ success: false, error: "Email, OTP and newPassword are required" }, { status: 400 });
    }

    await dbConnect();

    const otpDoc = await Otp.findOne({ email, type: "forgot" }).sort({ createdAt: -1 });
    if (!otpDoc) return NextResponse.json({ success: false, error: "OTP not found or expired" }, { status: 400 });

    const match = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!match) return NextResponse.json({ success: false, error: "Invalid OTP" }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const newHashed = await bcrypt.hash(newPassword, 10);
    user.password = newHashed;
    await user.save();

    // remove OTP
    await Otp.deleteMany({ email, type: "forgot" });

    return NextResponse.json({ success: true, message: "Password reset successful" });
  } catch (err: unknown) {
    console.error("FORGOT VERIFY ERROR:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
