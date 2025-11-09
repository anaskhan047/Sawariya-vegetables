// src/app/api/push/public-key/route.ts
import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/app/lib/webpush";

export async function GET() {
  try {
    const key = getVapidPublicKey();
    if (!key) {
      return NextResponse.json({ success: false, error: "VAPID key not configured" }, { status: 500 });
    }
    return NextResponse.json({ success: true, key });
  } catch (err: unknown) {
    console.error("public-key GET error:", err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
