import Notification from "@/app/models/Notification";
import User from "@/app/models/User";
import { getRoleTokens, getUserTokens, sendFcmNotification } from "@/app/lib/notifications/fcmServer";

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

async function notifyAdminsForOrderEvent(params: {
  title: string;
  body: string;
  type: "ORDER_CREATED" | "ORDER_CANCELLED";
  orderId: string;
  status: string;
  total: number;
  itemCount: number;
}) {
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
      url: `/admin/orders?orderId=${params.orderId}`,
    },
  });

  const tokens = await getRoleTokens("admin");
  console.info("admin tokens fetched count", { count: tokens.length });
  const result = await sendFcmNotification({
    tokens,
    title: params.title,
    body: params.body,
    data: {
      type: params.type,
      orderId: params.orderId,
      status: params.status,
      url: `/admin/orders?orderId=${params.orderId}`,
    },
  });
  console.info("admin push send success/failure", result);
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
  console.info("order status updated", {
    orderId: payload.orderId,
    status: payload.status,
    userId: payload.userId,
  });
  console.info("user notification send started", {
    orderId: payload.orderId,
    userId: payload.userId,
  });

  const title = "Order Status Updated";
  const body = `Order ${payload.orderId} is now ${payload.status}. Total Rs ${payload.total} for ${payload.itemCount} items.`;
  const tokens = await getUserTokens(payload.userId);
  console.info("user tokens fetched count", { count: tokens.length, userId: payload.userId });

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
      url: `/order?orderId=${payload.orderId}`,
      type: "ORDER_STATUS_UPDATED",
    },
  });

  const result = await sendFcmNotification({
    tokens,
    title,
    body,
    data: {
      type: "ORDER_STATUS_UPDATED",
      orderId: payload.orderId,
      status: payload.status,
      url: `/order?orderId=${payload.orderId}`,
    },
  });
  console.info("user push send success/failure", result);
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
