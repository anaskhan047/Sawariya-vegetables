// src/app/api/push/test-send/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import PushSubscription from "@/app/models/PushSubscription";
import { sendPush, VapidSubscription, PushPayload } from "@/app/lib/webpush";

/**
 * DbSubscription: minimal shape we expect from .lean()
 * _id left as unknown to avoid mismatched ObjectId types
 */
type DbSubscription = {
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
  origin?: string | null;
  updatedAt?: Date;
  _id?: unknown;
};

type TestSendResult = {
  endpoint: string;
  ok: boolean;
  error?: string;
};

export async function POST(req: Request) {
  try {
    await dbConnect();

    // parse URL query origin (if provided)
    const url = new URL(req.url);
    const queryOrigin = url.searchParams.get("origin");

    // parse body once and reuse it
    let parsedBody: any = {};
    try {
      parsedBody = (await req.json().catch(() => ({}))) ?? {};
    } catch {
      parsedBody = {};
    }

    const bodyOrigin = parsedBody?.origin ?? null;
    const origin = queryOrigin || bodyOrigin || null;

    // fetch subscriptions (filtered if origin provided)
    const raw = await PushSubscription.find(origin ? { origin } : {}).lean();
    const subs = (raw as unknown) as DbSubscription[];

    if (!subs || !subs.length) {
      return NextResponse.json({ success: false, message: "No subscriptions" }, { status: 404 });
    }

    // dedupe by endpoint
    const uniqueMap = new Map<string, DbSubscription>();
    for (const s of subs) {
      if (s.endpoint && !uniqueMap.has(s.endpoint)) uniqueMap.set(s.endpoint, s);
    }

    // allow optional custom payload via body.payload for testing
    const customPayload = parsedBody?.payload ?? null;

    // typed payload (PushPayload is exported from webpush helper)
    const payload: PushPayload = customPayload ?? {
      title: "Test notification",
      body: "This is a test push from server",
      data: { origin: origin ?? "all", url: "https://www.shrisawariyamart.com" },
      tag: "test-notif",
      renotify: false,
    };

    // send to unique endpoints
    const results: TestSendResult[] = await Promise.all(
      Array.from(uniqueMap.values()).map(async (s) => {
        // build typed subscription for sendPush
        const subData: VapidSubscription = {
          endpoint: s.endpoint,
          keys: s.keys,
        };

        try {
          await sendPush(subData, payload);
          return { endpoint: s.endpoint, ok: true };
        } catch (err) {
          // typed error shape
          const errorObj = err as { statusCode?: number; status?: number };

          const statusCode =
            errorObj.statusCode !== undefined ? errorObj.statusCode : errorObj.status ?? null;

          // remove stale subscriptions returned by push service
          if (statusCode === 410 || statusCode === 404) {
            try {
              await PushSubscription.deleteOne({ endpoint: s.endpoint });
            } catch (deleteErr) {
              console.warn("Failed to delete stale subscription", deleteErr);
            }
          }

          return { endpoint: s.endpoint, ok: false, error: String(err) };
        }
      })
    );

    return NextResponse.json(
      {
        success: true,
        sent: results.filter((r) => r.ok).length,
        total: results.length,
        results,
      },
      { status: 200 }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("test-send error:", err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
