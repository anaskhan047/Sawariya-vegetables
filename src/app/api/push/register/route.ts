// src/app/api/push/register/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import PushSubscription from "@/app/models/PushSubscription";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { subscription, origin } = body ?? {};
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ success: false, message: "Invalid subscription" }, { status: 400 });
    }

    // upsert by endpoint to avoid duplicates
    await PushSubscription.updateOne(
      { endpoint: subscription.endpoint },
      {
        $set: {
          endpoint: subscription.endpoint,
          keys: subscription.keys || {},
          origin: origin || null,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("push register error", err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
