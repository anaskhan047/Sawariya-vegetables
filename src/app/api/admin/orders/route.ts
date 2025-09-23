import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Orders from "@/app/models/Orders";
import User from "@/app/models/User";
import jwt from "jsonwebtoken";
import "@/app/models/DeliveryArea";
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

// GET /api/admin/orders → list all orders
export async function GET(req: Request) {
  try {
    const admin = await getUserFromReq(req);
    if (!admin || admin.role !== "admin")
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });

    await dbConnect();
    const orders = await Orders.find()
      .populate("user", "name email")
      .populate("address.area", "name pincode")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, orders });
  } catch (err: unknown) {
    console.error("❌ Error fetching orders:", err);
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}


// PATCH /api/admin/orders → update status / OTP / payment
export async function PATCH(req: Request) {
  const body = await req.json();
  const admin = await getUserFromReq(req);
  if (!admin || admin.role !== "admin")
    return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });

  await dbConnect();
  const { orderId, status, paymentReceived, verifyOtp, upiTxnInfo } = body;
  const order = await Orders.findById(orderId);
  if (!order) return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });

  // ✅ Handle payment received
  if (paymentReceived) {
    order.paymentStatus = "received";
    if (upiTxnInfo) order.upiTxnInfo = { ...(order.upiTxnInfo || {}), ...upiTxnInfo };
    order.statusHistory.push({ status: "payment_received", by: admin._id, at: new Date() });
    await order.save();
    return NextResponse.json({ success: true, order });
  }

  // ✅ Handle OTP verification for delivery
  if (verifyOtp) {
    if (!order.otp || String(order.otp) !== String(verifyOtp))
      return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 400 });
    if (!order.otpExpiresAt || new Date() > new Date(order.otpExpiresAt))
      return NextResponse.json({ success: false, message: "OTP expired" }, { status: 400 });

    order.status = "delivered";
    order.otp = null;
    order.otpExpiresAt = null;
    order.statusHistory.push({ status: "delivered", by: admin._id, at: new Date() });
    await order.save();
    return NextResponse.json({ success: true, order });
  }

  // ✅ Handle status update (no OTP generation here)
  if (status) {
    order.status = status;
    order.statusHistory.push({ status, by: admin._id, at: new Date() });

    // Clear OTP only if order is delivered or cancelled
    if (status === "delivered" || status === "cancelled") {
      order.otp = null;
      order.otpExpiresAt = null;
    }

    await order.save();
    return NextResponse.json({ success: true, order });
  }
  if (body.utr) {
    order.upiTxnInfo = {
      ...(order.upiTxnInfo || {}),
      txnRef: body.utr,     // ✅ UTR entered by user
      paidTo: body.upiId,   // ✅ kaunsa UPI ID select hua
      userClaimed: true,
      claimedAt: new Date(),
    };
    order.paymentStatus = "pending";
    await order.save();
    return NextResponse.json({ success: true, order });
  }


  return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
}
