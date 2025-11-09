import webpush from "web-push";

const publicKey = process.env.VAPID_PUBLIC_KEY!;
const privateKey = process.env.VAPID_PRIVATE_KEY!;
const subject = process.env.VAPID_SUBJECT ?? "mailto:anaskhany47@gmail.com";

if (!publicKey || !privateKey) {
  console.warn("VAPID keys missing. Web push disabled.");
} else {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export function getVapidPublicKey() {
  return publicKey || "";
}

export async function sendPush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: unknown) {
  if (!publicKey || !privateKey) return;
  try {
    await webpush.sendNotification(subscription as { endpoint: string; keys: { p256dh: string; auth: string } }, JSON.stringify(payload));
  } catch (err: unknown) {
    // throw to caller so they can remove invalid subscriptions if needed
    throw err;
  }
}
