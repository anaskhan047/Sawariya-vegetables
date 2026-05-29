import Notification from "@/app/models/Notification";
import PushSubscription from "@/app/models/PushSubscription";
import User from "@/app/models/User";
import dbConnect from "@/app/lib/mongodb";
import { getRoleTokens, getUserTokens, sendFcmNotification } from "@/app/lib/notifications/fcmServer";
import { sendPush, VapidSubscription } from "@/app/lib/webpush";

type NewOrderPayload = {
  orderId: string;
  customerName: string;
  total: number;
  itemCount: number;
  status: string;
};

type CancelledOrderPayload = {
  orderId: string;
  customerName: string;
  total: number;
  itemCount: number;
  status: string;
};

type OrderStatusPayload = {
  orderId: string;
  status: string;
  total: number;
  itemCount: number;
  userId: string;
};

type DbPushSubscription = {
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

async function sendRoleWebPushNotification(params: {
  role: "admin" | "delivery" | "user";
  title: string;
  body: string;
  url: string;
  data?: Record<string, string>;
}) {
  let subscriptions: DbPushSubscription[] = [];
  try {
    subscriptions = await PushSubscription.find({ role: params.role })
      .select("endpoint keys")
      .lean<DbPushSubscription[]>();
  } catch (err) {
    console.error("[order-notify] native web-push subscription lookup failed", err);
    return;
  }

  if (!subscriptions.length) {
    console.info("[order-notify] native web-push skipped: no role subscriptions", { role: params.role });
    return;
  }

  const payload = {
    title: params.title,
    body: params.body,
    notification: {
      title: params.title,
      body: params.body,
    },
    data: {
      ...(params.data || {}),
      title: params.title,
      body: params.body,
      url: params.url,
    },
    renotify: true,
  };

  const invalidEndpoints: string[] = [];
  const results = await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await sendPush(subscription as VapidSubscription, payload);
        return true;
      } catch (err) {
        const statusCode = (err as { statusCode?: number; status?: number }).statusCode ?? (err as { status?: number }).status;
        if (statusCode === 404 || statusCode === 410) {
          invalidEndpoints.push(subscription.endpoint);
        }
        console.warn("[order-notify] native web-push send failed", {
          endpointPrefix: subscription.endpoint.slice(0, 32),
          statusCode,
          message: err instanceof Error ? err.message : String(err),
        });
        return false;
      }
    })
  );

  if (invalidEndpoints.length) {
    await PushSubscription.deleteMany({ endpoint: { $in: invalidEndpoints } });
  }

  console.info("[order-notify] native web-push finished", {
    role: params.role,
    successCount: results.filter(Boolean).length,
    total: results.length,
    invalidRemoved: invalidEndpoints.length,
  });
}

async function notifyAdminsForOrderEvent(params: {
  title: string;
  body: string;
  type: "ORDER_CREATED" | "ORDER_CANCELLED";
  orderId: string;
  status: string;
  total: number;
  itemCount: number;
}) {
  const relativeUrl = `/admin/orders?orderId=${params.orderId}`;

  try {
    await dbConnect();
  } catch (err) {
    console.error("[order-notify] dbConnect failed before admin notify", err);
    return;
  }

  let tokens: string[] = [];
  try {
    tokens = await getRoleTokens("admin");
    console.info("[order-notify] admin FCM tokens resolved", { count: tokens.length });
  } catch (err) {
    console.error("[order-notify] getRoleTokens(admin) failed", err);
  }

  try {
    const result = await sendFcmNotification({
      tokens,
      title: params.title,
      body: params.body,
      data: {
        type: params.type,
        orderId: params.orderId,
        status: params.status,
        url: relativeUrl,
      },
    });
    console.info("[order-notify] admin FCM multicast finished", {
      skipped: Boolean(result.skipped),
      reason: result.reason,
      attempted: result.attempted,
      successCount: result.successCount,
      failureCount: result.failureCount,
      invalidRemoved: result.invalidTokensRemoved,
    });
  } catch (err) {
    console.error("[order-notify] sendFcmNotification(admin) threw", err);
  }

  try {
    await sendRoleWebPushNotification({
      role: "admin",
      title: params.title,
      body: params.body,
      url: relativeUrl,
      data: {
        type: params.type,
        orderId: params.orderId,
        status: params.status,
      },
    });
  } catch (err) {
    console.error("[order-notify] native web-push admin fallback threw", err);
  }

  try {
    await Notification.create({
      title: params.title,
      message: params.body,
      forRole: "admin",
      meta: {
        type: params.type,
        orderId: params.orderId,
        status: params.status,
        total: params.total,
        itemCount: params.itemCount,
        url: relativeUrl,
      },
    });
    console.info("[order-notify] in-app Notification document created for admin", {
      orderId: params.orderId,
      type: params.type,
    });
  } catch (err) {
    console.error("[order-notify] Notification.create(admin) failed — push may have already been sent", err);
  }
}

export async function notifyAdminsForNewOrder(payload: NewOrderPayload) {
  console.info("order created", {
    orderId: payload.orderId,
    status: payload.status,
    total: payload.total,
    itemCount: payload.itemCount,
  });
  console.info("admin notification send started", { orderId: payload.orderId });

  const title = "New Order Received";
  const body = `Order ${payload.orderId} by ${payload.customerName} | ${payload.itemCount} items | Rs ${payload.total} | ${payload.status}`;

  await notifyAdminsForOrderEvent({
    title,
    body,
    type: "ORDER_CREATED",
    orderId: payload.orderId,
    status: payload.status,
    total: payload.total,
    itemCount: payload.itemCount,
  });
}

export async function notifyAdminsForCancelledOrder(payload: CancelledOrderPayload) {
  console.info("order cancelled by user", {
    orderId: payload.orderId,
    status: payload.status,
    total: payload.total,
    itemCount: payload.itemCount,
  });
  console.info("admin cancellation notification send started", { orderId: payload.orderId });

  const title = "Order Cancelled By User";
  const body = `Order ${payload.orderId} cancelled by ${payload.customerName} | ${payload.itemCount} items | Rs ${payload.total}`;

  await notifyAdminsForOrderEvent({
    title,
    body,
    type: "ORDER_CANCELLED",
    orderId: payload.orderId,
    status: payload.status,
    total: payload.total,
    itemCount: payload.itemCount,
  });
}

export async function notifyUserForOrderStatus(payload: OrderStatusPayload) {
  console.info("[order-notify] order status updated", {
    orderId: payload.orderId,
    status: payload.status,
    userId: payload.userId,
  });

  const title = "Order Status Updated";
  const body = `Order ${payload.orderId} is now ${payload.status}. Total Rs ${payload.total} for ${payload.itemCount} items.`;
  const relativeUrl = `/order?orderId=${payload.orderId}`;

  try {
    await dbConnect();
  } catch (err) {
    console.error("[order-notify] dbConnect failed before user notify", err);
    return;
  }

  let tokens: string[] = [];
  try {
    tokens = await getUserTokens(payload.userId);
    console.info("[order-notify] user FCM tokens resolved", { count: tokens.length, userId: payload.userId });
  } catch (err) {
    console.error("[order-notify] getUserTokens failed", err);
  }

  try {
    const result = await sendFcmNotification({
      tokens,
      title,
      body,
      data: {
        type: "ORDER_STATUS_UPDATED",
        orderId: payload.orderId,
        status: payload.status,
        url: relativeUrl,
      },
    });
    console.info("[order-notify] user FCM multicast finished", {
      userId: payload.userId,
      ...result,
    });
  } catch (err) {
    console.error("[order-notify] sendFcmNotification(user) threw", err);
  }

  try {
    await Notification.create({
      title,
      message: body,
      forRole: "user",
      userId: payload.userId,
      meta: {
        orderId: payload.orderId,
        status: payload.status,
        total: payload.total,
        itemCount: payload.itemCount,
        url: relativeUrl,
        type: "ORDER_STATUS_UPDATED",
      },
    });
  } catch (err) {
    console.error("[order-notify] Notification.create(user) failed", err);
  }
}

export async function notifyAllUsersFromAdmin(title: string, message: string, link?: string) {
  console.info("manual all-user notification started", { title });
  const users = await User.find({ role: "user", isActive: true }).select("_id").lean<{ _id: string }[]>();
  if (!users.length) {
    await Notification.create({
      title: `[Broadcast] ${title}`,
      message: `${message} (No active users found)`,
      forRole: "admin",
      meta: {
        type: "ADMIN_BROADCAST_LOG",
        targetUsers: 0,
        targetTokens: 0,
        successCount: 0,
        failureCount: 0,
        skipped: true,
        reason: "no-active-users",
        url: "/admin/notifications",
      },
    });
    return { userCount: 0, tokenCount: 0 };
  }

  const targetUrl = typeof link === "string" && link.trim() ? link.trim() : "/notifications";

  await Notification.insertMany(
    users.map((u) => ({
      title,
      message,
      forRole: "user" as const,
      userId: u._id,
      meta: {
        type: "ADMIN_BROADCAST",
        url: targetUrl,
      },
    }))
  );

  const tokens = await getRoleTokens("user");
  console.info("total user tokens fetched", { count: tokens.length });
  const result = await sendFcmNotification({
    tokens,
    title,
    body: message,
    data: {
      type: "ADMIN_BROADCAST",
      url: targetUrl,
    },
  });
  console.info("successful sends count", { count: result.successCount });
  console.info("failed sends count", { count: result.failureCount });

  await Notification.create({
    title: `[Broadcast] ${title}`,
    message: `${message} (Users: ${users.length}, Tokens: ${tokens.length}, Success: ${result.successCount}, Failed: ${result.failureCount})`,
    forRole: "admin",
    meta: {
      type: "ADMIN_BROADCAST_LOG",
      targetUsers: users.length,
      targetTokens: tokens.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      skipped: Boolean(result.skipped),
      reason: result.reason || "",
      link: targetUrl,
      url: "/admin/notifications",
    },
  });

  return {
    userCount: users.length,
    tokenCount: tokens.length,
    successCount: result.successCount,
    failureCount: result.failureCount,
    skipped: Boolean(result.skipped),
    reason: result.reason || "",
  };
}
