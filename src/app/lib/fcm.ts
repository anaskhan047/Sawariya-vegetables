import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBTj7ViH2RSta0OWLKUg2GgQ9o5njXLUes",
  authDomain: "shrisawariyamart-8bb12.firebaseapp.com",
  projectId: "shrisawariyamart-8bb12",
  storageBucket: "shrisawariyamart-8bb12.firebasestorage.app",
  messagingSenderId: "1043325796880",
  appId: "1:1043325796880:web:b3f17bd45b629d0d32c095"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function registerAdminPush() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;
  const token = await getToken(messaging, { vapidKey });
  if (!token) return;

  await fetch("/api/push/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, origin: location.origin }),
  });

  console.log("FCM Token saved:", token);
}
