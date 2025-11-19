const webpush = require("web-push");

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (!publicKey || !privateKey) {
    throw new Error("Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars");
}

webpush.setVapidDetails(
    "mailto:shrisawariyamart@gmail.com",
    publicKey,
    privateKey
);

// Put REAL subscription from your database here:
const subscription = {
    endpoint: "PASTE_ENDPOINT_HERE",
    keys: {
        p256dh: "PASTE_P256DH",
        auth: "PASTE_AUTH",
    },
};

const payload = {
    title: "Node direct TEST",
    body: "Direct push from node script",
    data: { url: "https://www.shrisawariyamart.com/admin/orders" },
    tag: "direct-test",
};

webpush
    .sendNotification(subscription, JSON.stringify(payload))
    .then(() => console.log("SENT!"))
    .catch((err) => console.error("ERROR:", err));
