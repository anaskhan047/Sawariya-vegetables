import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import PushSubscription from "@/app/models/PushSubscription";
import { sendPush, VapidSubscription, PushPayload } from "@/app/lib/webpush";

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

    const url = new URL(req.url);
    const queryOrigin = url.searchParams.get("origin");

    // Read body once
    let body: Record<string, unknown> = {};
    try {
      const parsed = await req.json();
      if (typeof parsed === "object" && parsed !== null) {
        body = parsed as Record<string, unknown>;
      }
    } catch {
      body = {};
    }

    const bodyOrigin =
      typeof body["origin"] === "string" ? (body["origin"] as string) : null;

    const origin = queryOrigin || bodyOrigin || null;

    // Fetch subscriptions
    const raw = await PushSubscription.find(origin ? { origin } : {}).lean();
    const subs = raw as unknown as DbSubscription[];

    if (subs.length === 0) {
      return NextResponse.json(
        { success: false, message: "No subscriptions" },
        { status: 404 }
      );
    }

    // Unique endpoints
    const unique = new Map<string, DbSubscription>();
    for (const s of subs) {
      if (s.endpoint && !unique.has(s.endpoint)) {
        unique.set(s.endpoint, s);
      }
    }

    // Custom payload from body
    const payloadFromBody = (() => {
      const p = body["payload"];
      return typeof p === "object" && p !== null ? (p as PushPayload) : null;
    })();

    const payload: PushPayload = 
      payloadFromBody ?? {
        title: "Test notification",
        body: "This is a test push from server",
        data: {
          origin: origin ?? "all",
          url: "https://www.shrisawariyamart.com",
        },
        tag: "test-notif",
        renotify: false,
      };

    const results: TestSendResult[] = await Promise.all(
      Array.from(unique.values()).map(async (s) => {
        const subData: VapidSubscription = {
          endpoint: s.endpoint,
          keys: s.keys,
        };

        try {
          await sendPush(subData, payload);
          return { endpoint: s.endpoint, ok: true };
        } catch (err) {
          const e =
            err instanceof Error
              ? err
              : new Error(typeof err === "string" ? err : "Unknown error");

          const code = (e as unknown as { statusCode?: number }).statusCode;

          if (code === 404 || code === 410) {
            await PushSubscription.deleteOne({ endpoint: s.endpoint });
          }

          return { endpoint: s.endpoint, ok: false, error: e.message };
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
    const e =
      err instanceof Error ? err.message : "Unknown internal server error";

    return NextResponse.json(
      { success: false, error: e },
      { status: 500 }
    );
  }
}
