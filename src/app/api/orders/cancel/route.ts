// file: /app/api/orders/cancel/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Orders from "@/app/models/Orders";
import Product from "@/app/models/Product";
import User from "@/app/models/User";
import jwt from "jsonwebtoken";
import { notifyAdminsForCancelledOrder } from "@/app/lib/notifications/orderNotifications";

async function getUserFromReq(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    await dbConnect();
    return await User.findById(decoded.id).lean();
  } catch {
    return null;
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUserFromReq(req);
    if (!user) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ success: false, message: "orderId required" }, { status: 400 });

    await dbConnect();
    const order = await Orders.findById(orderId);
    if (!order) return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });

    // Only owner can cancel
    if (String(order.user) !== String(user._id)) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    // Already cancelled/delivered etc.
    if (["cancelled", "delivered", "returned"].includes(order.status)) {
      return NextResponse.json({ success: false, message: `Cannot cancel order in status ${order.status}` }, { status: 400 });
    }

    // Time-window check: 5 minutes
    const created = new Date(order.createdAt).getTime();
    const now = Date.now();
    const FIVE_MIN = 5 * 60 * 1000;
    if (now - created > FIVE_MIN) {
      return NextResponse.json({ success: false, message: "Cancel window expired (5 minutes)" }, { status: 400 });
    }

    // Update order status & history
    order.status = "cancelled";
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({ status: "cancelled", by: user._id, at: new Date() });
    order.paymentStatus = order.paymentStatus === "received" ? order.paymentStatus : "cancelled";
    // Save first so we have consistent state
    await order.save();

    // Restore stock for each item (increment)
    for (const it of order.items) {
      try {
        await Product.findByIdAndUpdate(it.productId, { $inc: { stockQty: Number(it.quantity) } });
      } catch (err) {
        console.error("Failed to restore stock for", it.productId, err);
      }
    }

    void (async () => {
      try {
        await notifyAdminsForCancelledOrder({
          orderId: String(order._id),
          customerName: String((user as { name?: string })?.name || "Customer"),
          total: Number(order.total || 0),
          itemCount: Array.isArray(order.items) ? order.items.length : 0,
          status: String(order.status || "cancelled"),
        });
        console.info("[orders] PATCH cancel admin notify pipeline completed", { orderId: String(order._id) });
      } catch (notificationError) {
        console.error("[orders] PATCH admin cancel-order notification failed:", notificationError);
      }
    })();

    return NextResponse.json({ success: true, order }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
