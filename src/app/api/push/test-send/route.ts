// src/app/api/push/test-send/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import PushSubscription from "@/app/models/PushSubscription";
import { sendPush } from "@/app/lib/webpush";

type PushSubDoc = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function POST(_req: Request) {
  try {
    await dbConnect();
    const subs = (await PushSubscription.find({}).lean()) as PushSubDoc[];
    if (!subs || subs.length === 0) {
      return NextResponse.json({ success: false, message: "No subscriptions" }, { status: 404 });
    }

    const siteOrigin = process.env.SITE_ORIGIN ;
    const payload = {
      title: "Test notification",
      message: "This is a test push from server",
      data: { test: true, ts: Date.now(), url: `${siteOrigin}/admin` }
    };

    await Promise.all(
      subs.map(async (s) => {
        try {
          // s is PushSubDoc
          await sendPush({ endpoint: s.endpoint, keys: s.keys }, payload);
        } catch (err: unknown) {
          // log safely without assuming shape
          const msg = err instanceof Error ? err.message : JSON.stringify(err);
          console.error("sendPush error for", s.endpoint, msg);
        }
      })
    );

    return NextResponse.json({ success: true, sent: subs.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("test-send error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
