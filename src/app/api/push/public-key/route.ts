import { NextResponse } from "next/server";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";

export async function GET() {
  if (!VAPID_PUBLIC_KEY) {
    return NextResponse.json(
      { success: false, message: "VAPID key not configured" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true, key: VAPID_PUBLIC_KEY });
}
