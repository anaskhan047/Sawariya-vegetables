// src/app/lib/webpush.ts
import webpush from "web-push";

const publicKey = process.env.VAPID_PUBLIC_KEY || "";
const privateKey = process.env.VAPID_PRIVATE_KEY || "";
const subject = process.env.VAPID_SUBJECT ?? "mailto:shri@shrisawariyamart.com";

if (!publicKey || !privateKey) {
  console.error("VAPID keys missing. Web push disabled. Make sure VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are set.");
} else {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  } catch (err) {
    console.error("Failed to set VAPID details:", err);
  }
}

export function getVapidPublicKey() {
  return publicKey;
}

export async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: unknown
) {
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys missing on server — cannot send push");
  }

  try {
    const payloadStr = JSON.stringify(payload ?? {});
    console.log("webpush: sending to endpoint:", subscription.endpoint);
    await webpush.sendNotification(subscription, payloadStr, { TTL: 60 });
    console.log("webpush: sendNotification succeeded for endpoint:", subscription.endpoint);
  } catch (err: unknown) {
    console.error("sendPush error for endpoint:", subscription.endpoint, err);
    throw err;
  }
}
