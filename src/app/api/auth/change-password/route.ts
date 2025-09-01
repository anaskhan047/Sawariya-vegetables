import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

interface DecodedToken {
  id: string;
  iat?: number;
  exp?: number;
}

export async function PUT(req: Request) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("authorization");
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      token = (await cookies()).get("token")?.value;
    }

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { oldPassword, newPassword }: { oldPassword: string; newPassword: string } = await req.json();
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Old password incorrect" }, { status: 400 });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return NextResponse.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
