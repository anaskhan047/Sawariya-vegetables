import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { userId, isActive } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID missing" },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Toggle User Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
