// src/app/lib/webpush.ts
import webpush from "web-push";

const publicKey = process.env.VAPID_PUBLIC_KEY || "";
const privateKey = process.env.VAPID_PRIVATE_KEY || "";
const subject = process.env.VAPID_SUBJECT ?? "mailto:anaskhany47@gmail.com";

if (!publicKey || !privateKey) {
  console.error("VAPID keys missing. Web push disabled. Make sure VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are set.");
} else {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export function getVapidPublicKey() {
  return publicKey;
}

export async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: unknown
) {
  if (!publicKey || !privateKey) {
    // fail loudly — so you see this in production logs
    throw new Error("VAPID keys missing on server — cannot send push");
  }
  try {
    await webpush.sendNotification(subscription as any, JSON.stringify(payload));
  } catch (err: unknown) {
    console.error("sendPush error:", err);
    throw err; // rethrow so caller can decide (and logs show the reason)
  }
}
