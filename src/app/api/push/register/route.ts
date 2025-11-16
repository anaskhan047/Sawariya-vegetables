// src/app/api/push/register/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import PushSubscription from "@/app/models/PushSubscription";

type Subscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function POST(req: Request) {
  try {
    await dbConnect();

    const raw = (await req.json().catch(() => ({}))) as unknown;
    const body = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

    const subscriptionCandidate = body["subscription"];
    const originCandidate = body["origin"];
    const adminIdCandidate = body["adminId"];

    const isValidSubscription = (v: unknown): v is Subscription => {
      if (typeof v !== "object" || v === null) return false;
      const s = v as Record<string, unknown>;
      if (typeof s["endpoint"] !== "string" || !s["endpoint"].trim()) return false;
      const keys = s["keys"];
      if (typeof keys !== "object" || keys === null) return false;
      const k = keys as Record<string, unknown>;
      if (typeof k["p256dh"] !== "string" || typeof k["auth"] !== "string") return false;
      return true;
    };

    if (!isValidSubscription(subscriptionCandidate)) {
      return NextResponse.json({ success: false, error: "Invalid subscription" }, { status: 400 });
    }

    const subscription = subscriptionCandidate as Subscription;
    const origin = typeof originCandidate === "string" && originCandidate.trim() ? originCandidate.trim() : "";
    const adminId = typeof adminIdCandidate === "string" && adminIdCandidate.trim() ? adminIdCandidate.trim() : undefined;

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        origin,
        ...(adminId ? { adminId } : {}),
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Push register error", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
