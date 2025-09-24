import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Orders from "@/app/models/Orders";
import User from "@/app/models/User";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import Product from "@/app/models/Product";

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

  const { items, address, paymentMethod = "cod", deliveryCharge = 0, utr, upiId } = await req.json();

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

  const orderPayload: Record<string, unknown> = {
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
  };

  if (paymentMethod === "upi") {
    // Save UPI ID (either passed or random fallback)
    orderPayload.upiId = upiId || UPI_IDS[Math.floor(Math.random() * UPI_IDS.length)];

    // ✅ Save UTR directly in order
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

  let order;
  try {
    order = await Orders.create(orderPayload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
  // --------------------- NEW: Reduce stock for each product ---------------------
for (const it of items) {
  try {
    await Product.findByIdAndUpdate(
      it.productId, // because it's ObjectId
      { $inc: { stockQty: -it.quantity } }
    );
  } catch (err) {
    console.error(`❌ Failed to update stock for product ${it.productId}`, err);
  }
}



  // ---------------------------------------------------------------------------

  return NextResponse.json({ success: true, order }, { status: 201 });
}

