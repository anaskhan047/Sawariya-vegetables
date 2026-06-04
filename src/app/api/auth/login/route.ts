// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/app/lib/mongodb";
import { loginSchema } from "@/app/lib/schemas/authSchemas";
import User from "@/app/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((e) => e.message) },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 400 });
    }

    user.lastLoginAt = new Date();
    user.authProvider = user.authProvider || "password";
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      token, // 👈 add this
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      redirectUrl:
        user.role === "admin"
          ? "/admin"
          : user.role === "delivery"
            ? "/deliveryBoy"
            : "/shop",
    });


    // secure: true only in production (HTTPS). On localhost secure should be false.
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
