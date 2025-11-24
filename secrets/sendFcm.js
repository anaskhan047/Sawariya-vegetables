// scripts/sendFcm.js (node)
const admin = require("firebase-admin");
const serviceAccount = require("./secrets/firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function sendToToken(token, payload) {
  const message = {
    token,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data ? Object.fromEntries(Object.entries(payload.data).map(([k,v])=>[k,String(v)])) : {},
    android: { notification: { click_action: payload.data?.url || "/", tag: payload.tag } },
    apns: { payload: { aps: { category: payload.tag } } },
  };

  return admin.messaging().send(message);
}

// example use
(async () => {
  const token = process.argv[2];
  const payload = {
    title: "Test",
    body: "hello",
    data: { url: "https://www.shrisawariyamart.com/admin" },
    tag: "test"
  };
  try {
    const res = await sendToToken(token, payload);
    console.log("Sent:", res);
  } catch (e) {
    console.error("Send failed:", e);
  }
})();
