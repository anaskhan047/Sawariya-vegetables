import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import PushSubscription from "@/app/models/PushSubscription";
import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const payload = body.payload || {
      title: "Test Notification",
      body: "FCM working",
      data: { url: "https://www.shrisawariyamart.com/admin" },
    };

    const subs = await PushSubscription.find().lean();
    if (!subs.length) {
      return NextResponse.json({ success: false, message: "No tokens" });
    }

    const tokens = subs.map((s) => s.token);

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: Object.fromEntries(
        Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)])
      ),
    });

    return NextResponse.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false });
  }
}
