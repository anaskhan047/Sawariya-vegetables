import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Settings from "@/app/models/Settings";
import User from "@/app/models/User";
import jwt from "jsonwebtoken";

async function getUserFromReq(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "") as { id: string };
    await dbConnect();
    return await User.findById(decoded.id).lean();
  } catch {
    return null;
  }
}

async function ensureSettings() {
  const existing = await Settings.findOne({ key: "global" }).lean();
  if (existing) return existing;
  const created = await Settings.create({});
  return created.toObject();
}

export async function GET() {
  try {
    await dbConnect();
    const settings = await ensureSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error("GET settings error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUserFromReq(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const updateFields: Record<string, unknown> = {};

    if (body.businessEmail) updateFields.businessEmail = body.businessEmail;
    if (body.businessPhone) updateFields.businessPhone = body.businessPhone;
    if (typeof body.deliveryCharge === "number") updateFields.deliveryCharge = body.deliveryCharge;
    if (body.deliveryTimeWindow) updateFields.deliveryTimeWindow = body.deliveryTimeWindow;

    const updated = await Settings.findOneAndUpdate(
      { key: "global" },
      { $set: updateFields },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ success: true, settings: updated });
  } catch (err) {
    console.error("PATCH settings error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
