import FcmToken from "@/app/models/FcmToken";
import { getFirebaseAdminMessaging } from "@/app/lib/firebase/admin";

type SendFcmPayload = {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
};

type SendFcmResult = {
  attempted: number;
  successCount: number;
  failureCount: number;
  invalidTokensRemoved: number;
  skipped?: boolean;
  reason?: string;
};

function dedupeTokens(tokens: string[]) {
  return Array.from(new Set(tokens.map((token) => token.trim()).filter(Boolean)));
}

async function cleanupInvalidTokens(tokens: string[]) {
  if (!tokens.length) return;
  await FcmToken.deleteMany({ token: { $in: tokens } });
}

export async function sendFcmNotification(payload: SendFcmPayload): Promise<SendFcmResult> {
  const messaging = getFirebaseAdminMessaging();
  if (!messaging) {
    console.warn("FCM send skipped: Firebase Admin messaging is not configured.", {
      hasProjectId: Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID),
      hasClientEmail: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
      hasPrivateKey: Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
      hasServiceAccountJson: Boolean(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON),
    });
    return {
      attempted: 0,
      successCount: 0,
      failureCount: 0,
      invalidTokensRemoved: 0,
      skipped: true,
      reason: "firebase-admin-not-configured",
    };
  }

  const tokens = dedupeTokens(payload.tokens);
  if (!tokens.length) {
    console.warn("FCM send skipped: no target tokens.");
    return {
      attempted: 0,
      successCount: 0,
      failureCount: 0,
      invalidTokensRemoved: 0,
      skipped: true,
      reason: "no-target-tokens",
    };
  }

  console.info("FCM send started.", {
    tokenCount: tokens.length,
    type: payload.data?.type || "GENERIC",
  });

  const response = await messaging.sendEachForMulticast({
    tokens,
    data: {
      ...(payload.data || {}),
      title: payload.title,
      body: payload.body,
      url: payload.data?.url || "/",
    },
    webpush: {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: "/logo/android-launchericon-192-192.png",
        badge: "/logo/android-launchericon-192-192.png",
      },
      fcmOptions: {
        link: payload.data?.url || "/",
      },
    },
  });

  const invalidTokens: string[] = [];
  response.responses.forEach((result, index) => {
    if (result.success) return;
    const errorCode = result.error?.code;
    console.warn("FCM send failed for token.", {
      tokenPrefix: tokens[index]?.slice(0, 12),
      code: errorCode,
      message: result.error?.message,
    });
    if (
      errorCode === "messaging/registration-token-not-registered" ||
      errorCode === "messaging/invalid-registration-token"
    ) {
      invalidTokens.push(tokens[index]);
    }
  });

  await cleanupInvalidTokens(invalidTokens);
  if (invalidTokens.length) {
    console.info("FCM invalid tokens cleaned.", { removed: invalidTokens.length });
  }

  console.info("FCM send completed.", {
    successCount: response.successCount,
    failureCount: response.failureCount,
  });

  return {
    attempted: tokens.length,
    successCount: response.successCount,
    failureCount: response.failureCount,
    invalidTokensRemoved: invalidTokens.length,
  };
}

export async function getRoleTokens(role: "admin" | "delivery" | "user") {
  const rows = await FcmToken.find({ role }).select("token").lean<{ token: string }[]>();
  return rows.map((row) => row.token);
}

export async function getUserTokens(userId: string) {
  const rows = await FcmToken.find({ userId }).select("token").lean<{ token: string }[]>();
  return rows.map((row) => row.token);
}
