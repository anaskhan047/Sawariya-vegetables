// src/app/api/orders/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Orders from "@/app/models/Orders";
import User from "@/app/models/User";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import Product from "@/app/models/Product";

// Notification & push
import { sendPush } from "@/app/lib/webpush";
import PushSubscription from "@/app/models/PushSubscription";
import Notification from "@/app/models/Notification";

/* Environment: set SITE_ORIGIN to your production origin (https://www.shrisawariyamart.com)
   Optionally set SITE_ORIGIN_ALT to support the non-www variant (https://shrisawariyamart.com)
*/
const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://www.shrisawariyamart.com";
const SITE_ORIGIN_ALT = process.env.SITE_ORIGIN_ALT || "";

// Example UPI ids (fallbacks)
const UPI_IDS = [
  process.env.UPI_1 || "9301893055@ybl",
  process.env.UPI_2 || "9301893055@ibl",
  process.env.UPI_3 || "9301893055@ybl",
  process.env.UPI_4 || "9301893055@ibl",
];

// ---------- Types ----------
type UserPayload = {
  _id: Types.ObjectId | string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
};

type ItemPayload = {
  productId: string;
  name: string;
  inHindi?: string;
  price: number;
  quantity: number;
  unit: string;
};

type OrderPayload = {
  user: Types.ObjectId | string;
  items: Array<{
    productId: string;
    name: string;
    inHindi?: string;
    price: number;
    quantity: number;
    unit: string;
  }>;
  address: unknown;
  subTotal: number;
  deliveryCharge: number;
  total: number;
  status: string;
  statusHistory: Array<{ status: string; by: Types.ObjectId | string; at: Date }>;
  paymentMethod: string;
  otp: string;
  otpExpiresAt: Date;
  paymentStatus: string;
  upiId?: string;
  utr?: string;
  upiTxnInfo?: Record<string, unknown>;
  customerName?: string;
};

type PushSubDoc = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  origin?: string;
};

// ---------- Helpers ----------
async function getUserFromReq(req: Request): Promise<UserPayload | null> {
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return null;

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id?: string };

    if (!decoded?.id) return null;

    await dbConnect();
    return (await User.findById(decoded.id).lean<UserPayload>()) || null;
  } catch {
    return null;
  }
}

function extractStatusFromError(err: unknown): number | undefined {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    const sc = e["statusCode"] ?? e["status"];
    if (typeof sc === "number") return sc;
    if (typeof sc === "string" && /^\d+$/.test(sc)) return Number(sc);
  }
  return undefined;
}

// ---------- Notification helper ----------
async function afterOrderCreated(order: {
  _id: string | { toString(): string };
  total?: number;
  customerName?: string;
  user?: string | { name?: string };
}) {
  console.log("afterOrderCreated called for order:", order._id);
  try {
    await dbConnect();

    const orderIdStr = typeof order._id === "string" ? order._id : order._id?.toString();
    const customerLabel =
      typeof order.customerName === "string" && order.customerName.trim() !== ""
        ? order.customerName
        : typeof order.user === "string"
        ? order.user
        : order.user && typeof order.user === "object" && "name" in order.user && typeof (order.user as { name?: unknown }).name === "string"
        ? (order.user as { name?: string }).name
        : "customer";

    const title = `New order #${orderIdStr}`;
    const message = `Order by ${customerLabel} — ₹${order.total ?? 0}.`;

    // create notification in DB
    const notif = await Notification.create({
      title,
      message,
      meta: { orderId: orderIdStr },
      forRole: "admin",
    });

    // Build origin list to query subscriptions
    const origins = [SITE_ORIGIN];
    if (SITE_ORIGIN_ALT) origins.push(SITE_ORIGIN_ALT);

    // fetch subscriptions for these origins
    const subs = (await PushSubscription.find({ origin: { $in: origins } }).lean<PushSubDoc[]>()) || [];

    console.log("afterOrderCreated: pushing to subs count:", subs.length, "origins:", origins);
    subs.slice(0, 5).forEach((s, idx) => {
      console.log(`sub sample [${idx}]:`, (s.endpoint && s.endpoint.slice ? s.endpoint.slice(0, 120) : s.endpoint), " origin:", s.origin);
    });

    const payload = {
      type: "new-order",
      title,
      message,
      data: { orderId: orderIdStr, notificationId: notif._id },
      timestamp: new Date().toISOString(),
    };

    await Promise.all(
      subs.map(async (s) => {
        try {
          await sendPush({ endpoint: s.endpoint, keys: s.keys }, payload);
        } catch (err: unknown) {
          const status = extractStatusFromError(err);
          console.warn("Push send failed for endpoint (first 120 chars):", s.endpoint?.slice?.(0, 120), "error:", err);
          if (status === 410 || status === 404) {
            try {
              await PushSubscription.deleteOne({ endpoint: s.endpoint });
              console.log("Deleted stale subscription for endpoint:", s.endpoint?.slice?.(0, 120));
            } catch (cleanupErr) {
              console.warn("Failed to delete stale subscription:", cleanupErr);
            }
          }
        }
      })
    );
  } catch (err: unknown) {
    // do not break order flow on notification errors
    console.error("afterOrderCreated error:", err);
  }
}

// ---------- GET /api/orders ----------
export async function GET(req: Request) {
  try {
    const user = await getUserFromReq(req);
    console.log(" User from token:", user);

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    await dbConnect();
    console.log(" DB connected");

    const orders = await Orders.find({ user: user._id })
      .populate("address.area", "name pincode")
      .sort({ createdAt: -1 })
      .lean();

    console.log(" Orders fetched:", Array.isArray(orders) ? orders.length : 0);

    return NextResponse.json({ success: true, orders });
  } catch (err: unknown) {
    console.error("  Orders API Error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// ---------- POST /api/orders ----------
export async function POST(req: Request) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });

  // verify user is active
  const fullUser = await User.findById(user._id);
  if (!fullUser) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

  if (!fullUser.isActive) {
    return NextResponse.json({
      success: false,
      message: "Your account is inactive. You cannot place orders right now.",
    });
  }

  const raw = (await req.json().catch(() => ({}))) as unknown;
  const body = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

  const itemsRaw = body["items"];
  const address = body["address"];
  const paymentMethod = typeof body["paymentMethod"] === "string" ? (body["paymentMethod"] as string) : "cod";
  const deliveryCharge = typeof body["deliveryCharge"] === "number" ? (body["deliveryCharge"] as number) : 0;
  const utr = typeof body["utr"] === "string" ? (body["utr"] as string) : undefined;
  const upiId = typeof body["upiId"] === "string" ? (body["upiId"] as string) : undefined;

  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0)
    return NextResponse.json({ success: false, message: "Cart empty" }, { status: 400 });
  if (!address || (typeof address === "object" && !("area" in (address as Record<string, unknown>))))
    return NextResponse.json({ success: false, message: "Delivery area required" }, { status: 400 });

  // Normalize items and validate shape minimally
  const items: ItemPayload[] = itemsRaw.map((it: unknown) => {
    const obj = typeof it === "object" && it !== null ? (it as Record<string, unknown>) : {};
    return {
      productId: String(obj["productId"] ?? ""),
      name: String(obj["name"] ?? ""),
      inHindi: typeof obj["inHindi"] === "string" ? (obj["inHindi"] as string) : undefined,
      price: Number(obj["price"] ?? 0),
      quantity: Number(obj["quantity"] ?? 0),
      unit: String(obj["unit"] ?? "kg"),
    };
  });

  const subTotal = items.reduce((s, it) => s + Number(it.price) * Number(it.quantity), 0);
  if (subTotal < 50) return NextResponse.json({ success: false, message: "Minimum order amount is ₹50" }, { status: 400 });

  await dbConnect();
  const total = subTotal + (deliveryCharge || 0);

  function generateOtp(length = 6) {
    return Math.floor(100000 + Math.random() * 900000).toString().slice(0, length);
  }

  const orderPayload: OrderPayload = {
    user: user._id,
    items: items.map((it) => ({
      productId: it.productId,
      name: it.name,
      inHindi: it.inHindi ?? "",
      price: it.price,
      quantity: it.quantity,
      unit: it.unit,
    })),
    address,
    subTotal,
    deliveryCharge,
    total,
    status: "placed",
    statusHistory: [{ status: "placed", by: user._id, at: new Date() }],
    paymentMethod,
    otp: generateOtp(),
    otpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    paymentStatus: paymentMethod === "cod" ? "cod" : "pending",
  };

  if (paymentMethod === "upi") {
    orderPayload.upiId = upiId || UPI_IDS[Math.floor(Math.random() * UPI_IDS.length)];

    if (utr) {
      orderPayload.utr = utr;
      orderPayload.upiTxnInfo = {
        txnRef: utr,
        paidTo: orderPayload.upiId,
        userClaimed: true,
        claimedAt: new Date(),
      };
    }
  }

  // Optionally attach customer name for nicer notification message
  if (typeof fullUser.name === "string" && fullUser.name.trim() !== "") {
    orderPayload.customerName = fullUser.name;
  }

  let orderDoc;
  try {
    orderDoc = await Orders.create(orderPayload as unknown as Record<string, unknown>);
    console.log("Order created:", (orderDoc as any)?._id ?? "<unknown>", "total:", (orderDoc as any)?.total, "by user:", user._id);

    // debug subscriptions count (all origins)
    const subsCount = await PushSubscription.countDocuments();
    console.log("Push subscriptions count (all origins):", subsCount);

    // Fire notification (non-blocking)
    afterOrderCreated(orderDoc).catch((e: unknown) => console.error("afterOrderCreated failed:", e));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }

  // --------------------- Reduce stock for each product ---------------------
  for (const it of items) {
    try {
      await Product.findByIdAndUpdate(it.productId, { $inc: { stockQty: -Number(it.quantity) } });
    } catch (stockErr: unknown) {
      console.error(`  Failed to update stock for product ${it.productId}`, stockErr);
    }
  }
  // ---------------------------------------------------------------------------

  return NextResponse.json({ success: true, order: orderDoc }, { status: 201 });
}
