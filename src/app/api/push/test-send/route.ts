// src/app/api/push/test-send/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import PushSubscription from "@/app/models/PushSubscription";
import { sendPush, VapidSubscription, PushPayload } from "@/app/lib/webpush";

// Define type for DB subscription document (lean() returns plain objects, _id can be ObjectId)
type DbSubscription = {
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
  origin?: string | null;
  updatedAt?: Date;
  _id?: unknown; // keep it generic to match mongoose lean() result
};

type TestSendResult = {
  endpoint: string;
  ok: boolean;
  error?: string;
};

export async function POST(req: Request) {
  try {
    await dbConnect();

    // Parse origin from query OR body safely
    const url = new URL(req.url);
    const queryOrigin = url.searchParams.get("origin");

    let bodyOrigin: string | null = null;
    try {
      const parsed = await req.json();
      bodyOrigin = parsed?.origin ?? null;
    } catch {
      bodyOrigin = null;
    }

    const origin = queryOrigin || bodyOrigin || null;

    // Fetch subscriptions (filtered if origin provided)
    // NOTE: cast via `unknown` first to satisfy TS when converting from Mongoose result
    const raw = await PushSubscription.find(origin ? { origin } : {}).lean();
    const subs = (raw as unknown) as DbSubscription[];

    if (!subs.length) {
      return NextResponse.json(
        { success: false, message: "No subscriptions" },
        { status: 404 }
      );
    }

    // Deduplicate by endpoint
    const uniqueMap = new Map<string, DbSubscription>();
    for (const sub of subs) {
      if (sub.endpoint && !uniqueMap.has(sub.endpoint)) {
        uniqueMap.set(sub.endpoint, sub);
      }
    }

    // Typed payload (no any)
    const payload: PushPayload = {
      title: "Test notification",
      body: "This is a test push from server",
      data: { origin: origin || "all" },
      tag: "test-notif",
      renotify: false,
    };

    // Send notifications
    const results: TestSendResult[] = await Promise.all(
      Array.from(uniqueMap.values()).map(async (s) => {
        const subData: VapidSubscription = {
          endpoint: s.endpoint,
          keys: s.keys,
        };

        try {
          await sendPush(subData, payload);
          return { endpoint: s.endpoint, ok: true };
        } catch (err) {
          const errorObj = err as { statusCode?: number; status?: number };

          const statusCode =
            errorObj.statusCode !== undefined
              ? errorObj.statusCode
              : errorObj.status ?? null;

          if (statusCode === 410 || statusCode === 404) {
            // stale subscription → delete it
            await PushSubscription.deleteOne({ endpoint: s.endpoint });
          }

          return {
            endpoint: s.endpoint,
            ok: false,
            error: String(err),
          };
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

    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
