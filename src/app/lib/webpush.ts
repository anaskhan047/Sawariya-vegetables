// src/app/lib/webpush.ts
import webpush, { PushSubscription as WebPushSubscription } from "web-push";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (!publicKey || !privateKey) {
  // fail fast so build / runtime error is obvious
  throw new Error("VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars.");
}

webpush.setVapidDetails(
  "mailto:shrisawariyamart@gmail.com",
  publicKey,
  privateKey
);

/**
 * Minimal shape of a subscription record stored in DB / coming from client.
 * Keeps types explicit so we don't use `any`.
 */
export type VapidSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

/**
 * JSON-safe payload shape for push messages.
 * Use Record<string, unknown> to avoid `any`.
 */
export type PushPayload = Record<string, unknown>;

/**
 * Send a web-push notification.
 * Accepts the local VapidSubscription shape and payload.
 */
export async function sendPush(
  subscription: VapidSubscription,
  payload: PushPayload
): Promise<void> {
  const body = JSON.stringify(payload);

  // web-push expects its own PushSubscription type. We cast safely because our
  // VapidSubscription shape matches the essential fields.
  const wpSub = subscription as unknown as WebPushSubscription;

  // sendNotification returns a Promise; await it so errors bubble up
  await webpush.sendNotification(wpSub, body);
}
