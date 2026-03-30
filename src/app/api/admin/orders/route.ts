import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/app/lib/mongodb";
import Orders from "@/app/models/Orders";
import User from "@/app/models/User";
import "@/app/models/DeliveryArea";
import { notifyUserForOrderStatus } from "@/app/lib/notifications/orderNotifications";

type AuthUser = {
  _id: string;
  role: "admin" | "delivery" | "user";
};

async function getUserFromReq(req: Request): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return null;

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id?: string };
    if (!decoded.id) return null;

    await dbConnect();
    return User.findById(decoded.id).select("_id role").lean<AuthUser>();
  } catch {
    return null;
  }
}

async function sendStatusNotificationIfNeeded(order: {
  _id: { toString(): string };
  user: { toString(): string } | string;
  status: string;
  total?: number;
  items?: unknown[];
}) {
  const userId = typeof order.user === "string" ? order.user : order.user.toString();
  await notifyUserForOrderStatus({
    orderId: order._id.toString(),
    userId,
    status: order.status,
    total: Number(order.total || 0),
    itemCount: Array.isArray(order.items) ? order.items.length : 0,
  });
}

export async function GET(req: Request) {
  try {
    const admin = await getUserFromReq(req);
    if (!admin || !["admin", "delivery"].includes(admin.role)) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    await dbConnect();
    const orders = await Orders.find()
      .populate("user", "name email")
      .populate("address.area", "name pincode")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("GET /api/admin/orders failed:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await getUserFromReq(req);
    if (!admin || !["admin", "delivery"].includes(admin.role)) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    await dbConnect();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    if (!orderId) {
      return NextResponse.json({ success: false, message: "orderId is required" }, { status: 400 });
    }

    const order = await Orders.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (body.paymentReceived) {
      order.paymentStatus = "received";
      if (body.upiTxnInfo && typeof body.upiTxnInfo === "object") {
        order.upiTxnInfo = { ...(order.upiTxnInfo || {}), ...(body.upiTxnInfo as object) };
      }
      order.statusHistory.push({ status: "payment_received", by: admin._id, at: new Date() });
      await order.save();
      return NextResponse.json({ success: true, order });
    }

    if (typeof body.verifyOtp === "string" && body.verifyOtp.trim()) {
      if (!order.otp || String(order.otp) !== body.verifyOtp.trim()) {
        return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 400 });
      }
      if (!order.otpExpiresAt || new Date() > new Date(order.otpExpiresAt)) {
        return NextResponse.json({ success: false, message: "OTP expired" }, { status: 400 });
      }

      order.status = "delivered";
      order.otp = null;
      order.otpExpiresAt = null;
      order.statusHistory.push({ status: "delivered", by: admin._id, at: new Date() });
      await order.save();

      sendStatusNotificationIfNeeded(order).catch((error) => {
        console.error("User delivery notification failed:", error);
      });

      return NextResponse.json({ success: true, order });
    }

    if (typeof body.status === "string" && body.status.trim()) {
      const nextStatus = body.status.trim();
      order.status = nextStatus;
      order.statusHistory.push({ status: nextStatus, by: admin._id, at: new Date() });

      if (nextStatus === "delivered" || nextStatus === "cancelled") {
        order.otp = null;
        order.otpExpiresAt = null;
      }

      await order.save();

      sendStatusNotificationIfNeeded(order).catch((error) => {
        console.error("User status notification failed:", error);
      });

      return NextResponse.json({ success: true, order });
    }

    if (typeof body.utr === "string" && body.utr.trim()) {
      order.upiTxnInfo = {
        ...(order.upiTxnInfo || {}),
        txnRef: body.utr.trim(),
        paidTo: typeof body.upiId === "string" ? body.upiId : undefined,
        userClaimed: true,
        claimedAt: new Date(),
      };
      order.paymentStatus = "pending";
      await order.save();
      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/admin/orders failed:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
