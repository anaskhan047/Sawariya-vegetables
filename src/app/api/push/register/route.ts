import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import PushSubscription from "@/app/models/PushSubscription";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { token, origin, adminId } = body || {};

    if (!token) {
      return NextResponse.json({ success: false, message: "Missing token" }, { status: 400 });
    }

    await PushSubscription.updateOne(
      { token },
      {
        $set: {
          token,
          origin: origin || null,
          adminId: adminId || "",
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("push register error", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
