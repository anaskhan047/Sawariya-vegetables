// src/app/lib/webpush.ts
import webpush, { PushSubscription as WebPushSubscription } from "web-push";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:shri@shrisawariyamart.com";

if (!publicKey || !privateKey) {
  throw new Error(
    "VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY."
  );
}

webpush.setVapidDetails(subject, publicKey, privateKey);

export type VapidSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export type PushPayload = Record<string, unknown>;

export async function sendPush(
  subscription: VapidSubscription,
  payload: PushPayload
): Promise<void> {
  const body = JSON.stringify(payload);
  const wpSub = subscription as unknown as WebPushSubscription;
  await webpush.sendNotification(wpSub, body);
}
