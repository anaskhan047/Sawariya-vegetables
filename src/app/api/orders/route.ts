import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Orders from "@/app/models/Orders";
import User from "@/app/models/User";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

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
};

type ItemPayload = {
  productId: string;
  name: string;
  inHindi?: string;
  price: number;
  quantity: number;
  unit: string;
};

type AddressPayload = {
  area: unknown;
  [key: string]: unknown;
};

// ---------- Helpers ----------
async function getUserFromReq(req: Request): Promise<UserPayload | null> {
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return null;

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    await dbConnect();
    return (await User.findById(decoded.id).lean<UserPayload>()) || null;
  } catch {
    return null;
  }
}

// ---------- GET /api/orders ----------
export async function GET(req: Request) {
  try {
    const user = await getUserFromReq(req);
    if (!user)
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });

    await dbConnect();
    const orders = await Orders.find({ user: new Types.ObjectId(user._id) })
      .populate("address.area", "name pincode")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, orders });
  } catch (err: unknown) {
    console.error("❌ Orders API Error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}


// ---------- POST /api/orders ----------
export async function POST(req: Request) {
  const user = await getUserFromReq(req);
  if (!user)
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });

  const { items, address, paymentMethod = "cod", deliveryCharge = 0 } = await req.json();

  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ success: false, message: "Cart empty" }, { status: 400 });
  if (!address?.area)
    return NextResponse.json({ success: false, message: "Delivery area required" }, { status: 400 });

  const subTotal = items.reduce(
    (s: number, it: ItemPayload) => s + Number(it.price) * Number(it.quantity),
    0
  );
  if (subTotal < 50)
    return NextResponse.json({ success: false, message: "Minimum order amount is ₹50" }, { status: 400 });

  await dbConnect();
  const total = subTotal + (deliveryCharge || 0);

  function generateOtp(length = 6) {
    return Math.floor(100000 + Math.random() * 900000).toString().slice(0, length);
  }

  const orderPayload = {
    user: user._id,
    items: items.map((it: ItemPayload) => ({
      productId: it.productId,
      name: it.name,
      inHindi: it.inHindi || "",
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
    otpExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    paymentStatus: paymentMethod === "cod" ? "cod" : "pending",
  } as Record<string, unknown>;

  if (paymentMethod === "upi") {
    const idx = Math.floor(Math.random() * UPI_IDS.length);
    (orderPayload as Record<string, unknown>).upiId = UPI_IDS[idx];
  }

  let order;
  try {
    order = await Orders.create(orderPayload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }

  let upiPayload = null;
  if (order.paymentMethod === "upi" && order.upiId) {
    const pa = encodeURIComponent(order.upiId);
    const pn = encodeURIComponent("Sawariya Vegetables");
    const am = encodeURIComponent(order.total.toFixed(2));
    const tn = encodeURIComponent(`Order:${order._id}`);
    const upiUrl = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
    upiPayload = { upiUrl, upiId: order.upiId, amount: order.total };
  }

  return NextResponse.json({ success: true, order, upiPayload }, { status: 201 });
}
