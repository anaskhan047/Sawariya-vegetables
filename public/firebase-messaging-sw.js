importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBTj7ViH2RSta0OWLKUg2GgQ9o5njXLUes",
  authDomain: "shrisawariyamart-8bb12.firebaseapp.com",
  projectId: "shrisawariyamart-8bb12",
  storageBucket: "shrisawariyamart-8bb12.firebasestorage.app",
  messagingSenderId: "1043325796880",
  appId: "1:1043325796880:web:b3f17bd45b629d0d32c095",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      data: payload.data,
      icon: "/icons/icon-192.png",
    }
  );
});
