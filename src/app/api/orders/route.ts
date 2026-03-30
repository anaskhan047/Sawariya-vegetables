import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import dbConnect from "@/app/lib/mongodb";
import Orders from "@/app/models/Orders";
import Product from "@/app/models/Product";
import User from "@/app/models/User";
import { notifyAdminsForNewOrder } from "@/app/lib/notifications/orderNotifications";

const UPI_IDS = [
  process.env.UPI_1 || "rathorevishal7523-1@okaxis",
  process.env.UPI_2 || "rathorevishal7523-1@okaxis",
  process.env.UPI_3 || "rathorevishal7523-1@okaxis",
  process.env.UPI_4 || "rathorevishal7523-1@okaxis",
];

type AuthUser = {
  _id: Types.ObjectId | string;
  name?: string;
  role?: string;
  isActive?: boolean;
};

type ItemPayload = {
  productId: string;
  name: string;
  inHindi?: string;
  price: number;
  quantity: number;
  unit: string;
};

async function getUserFromReq(req: Request): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return null;

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id?: string };
    if (!decoded.id) return null;

    await dbConnect();
    return User.findById(decoded.id).lean<AuthUser>();
  } catch {
    return null;
  }
}

function generateOtp(length = 6) {
  return Math.floor(100000 + Math.random() * 900000)
    .toString()
    .slice(0, length);
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    await dbConnect();
    const orders = await Orders.find({ user: user._id })
      .populate("address.area", "name pincode")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("GET /api/orders failed:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    await dbConnect();
    const fullUser = await User.findById(user._id).lean<AuthUser>();
    if (!fullUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (!fullUser.isActive) {
      return NextResponse.json({
        success: false,
        message: "Your account is inactive. You cannot place orders right now.",
      });
    }

    const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const itemsRaw = raw.items;
    const address = raw.address;

    const paymentMethod =
      typeof raw.paymentMethod === "string" ? raw.paymentMethod : "cod";
    const deliveryCharge =
      typeof raw.deliveryCharge === "number" ? raw.deliveryCharge : 0;
    const utr = typeof raw.utr === "string" ? raw.utr : undefined;
    const requestedUpiId = typeof raw.upiId === "string" ? raw.upiId : undefined;

    if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
      return NextResponse.json({ success: false, message: "Cart empty" }, { status: 400 });
    }

    if (!address || typeof address !== "object" || !("area" in address)) {
      return NextResponse.json(
        { success: false, message: "Delivery area required" },
        { status: 400 }
      );
    }

    const items: ItemPayload[] = itemsRaw.map((item: unknown) => {
      const obj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      return {
        productId: String(obj.productId ?? ""),
        name: String(obj.name ?? ""),
        inHindi: typeof obj.inHindi === "string" ? obj.inHindi : undefined,
        price: Number(obj.price ?? 0),
        quantity: Number(obj.quantity ?? 0),
        unit: String(obj.unit ?? "kg"),
      };
    });

    const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (subTotal < 50) {
      return NextResponse.json(
        { success: false, message: "Minimum order amount is Rs 50" },
        { status: 400 }
      );
    }

    const total = subTotal + deliveryCharge;
    const payload: Record<string, unknown> = {
      user: user._id,
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        inHindi: item.inHindi ?? "",
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
      })),
      address,
      subTotal,
      deliveryCharge,
      total,
      status: "placed",
      statusHistory: [{ status: "placed", by: user._id, at: new Date() }],
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "cod" : "pending",
      otp: generateOtp(),
      otpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    if (paymentMethod === "upi") {
      const upiId = requestedUpiId || UPI_IDS[Math.floor(Math.random() * UPI_IDS.length)];
      payload.upiId = upiId;

      if (utr) {
        payload.utr = utr;
        payload.upiTxnInfo = {
          txnRef: utr,
          paidTo: upiId,
          userClaimed: true,
          claimedAt: new Date(),
        };
      }
    }

    const order = await Orders.create(payload);

    for (const item of items) {
      try {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stockQty: -item.quantity } });
      } catch (stockError) {
        console.error(`Stock update failed for product ${item.productId}:`, stockError);
      }
    }

    notifyAdminsForNewOrder({
      orderId: order._id.toString(),
      customerName: fullUser.name || "Customer",
      total: Number(order.total || 0),
      itemCount: Array.isArray(order.items) ? order.items.length : items.length,
      status: String(order.status || "placed"),
    }).catch((notificationError) => {
      console.error("Admin new-order notification failed:", notificationError);
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders failed:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
