import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import PushSubscription from "@/app/models/PushSubscription";
import {
  sendPush,
  VapidSubscription,
  PushPayload,
} from "@/app/lib/webpush";

type DbSubscription = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
  origin?: string | null;
  updatedAt?: Date;
  _id?: unknown;
};

type TestSendResult = { endpoint: string; ok: boolean; error?: string };

export async function POST(req: Request) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const queryOrigin = url.searchParams.get("origin");

    let parsedBody: Record<string, unknown> = {};
    try {
      parsedBody = ((await req.json().catch(() => ({}))) ??
        {}) as Record<string, unknown>;
    } catch {
      parsedBody = {};
    }

    const bodyOrigin = (parsedBody?.origin as string) ?? null;
    const origin = queryOrigin || bodyOrigin || null;

    const findFilter = origin ? { origin } : {};
    const raw = await PushSubscription.find(findFilter).lean();
    const subs = raw as unknown as DbSubscription[];

    if (!subs || !subs.length) {
      return NextResponse.json(
        { success: false, message: "No subscriptions" },
        { status: 404 }
      );
    }

    const uniqueMap = new Map<string, DbSubscription>();
    for (const s of subs) {
      if (s.endpoint && !uniqueMap.has(s.endpoint)) {
        uniqueMap.set(s.endpoint, s);
      }
    }

    const customPayload = parsedBody?.payload as PushPayload | undefined;
    const payload: PushPayload =
      customPayload ?? {
        title: "New Order",
        body: "Naya order aaya hai!",
        notification: {
          title: "New Order",
          body: "Naya order aaya hai!",
        },
        data: {
          title: "New Order",
          body: "Naya order aaya hai!",
          origin: origin ?? "all",
          url: "https://www.shrisawariyamart.com/admin/orders",
        },
        renotify: true,
      };

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
          const statusCode = errorObj.statusCode ?? errorObj.status ?? null;
          if (statusCode === 410 || statusCode === 404) {
            await PushSubscription.deleteOne({ endpoint: s.endpoint });
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
    const errorMsg =
      err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
