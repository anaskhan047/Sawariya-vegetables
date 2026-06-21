import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/app/lib/mongodb";
import Settings from "@/app/models/Settings";
import User from "@/app/models/User";
import jwt from "jsonwebtoken";
import { buildDeliveryTimeLabel, normalizeTime24h } from "@/app/lib/orderWindow";
import { getGlobalSettings } from "@/app/lib/settingsServer";

export const dynamic = "force-dynamic";

async function getUserFromReq(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const headerToken = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : "";
    const cookieToken = (await cookies()).get("token")?.value || "";
    const token = headerToken || cookieToken;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "") as { id: string };
    await dbConnect();
    return await User.findById(decoded.id).lean();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const settings = await getGlobalSettings();
    return NextResponse.json(
      { success: true, settings },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
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

    await dbConnect();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const current = await getGlobalSettings();

    const updateFields: Record<string, unknown> = {};

    if (typeof body.businessEmail === "string" && body.businessEmail.trim()) {
      updateFields.businessEmail = body.businessEmail.trim();
    }
    if (typeof body.businessPhone === "string" && body.businessPhone.trim()) {
      updateFields.businessPhone = body.businessPhone.trim();
    }
    if (typeof body.deliveryCharge === "number" && !Number.isNaN(body.deliveryCharge)) {
      updateFields.deliveryCharge = body.deliveryCharge;
    }

    const hasStart = typeof body.orderWindowStart === "string";
    const hasEnd = typeof body.orderWindowEnd === "string";

    if (hasStart || hasEnd) {
      const start = normalizeTime24h(
        hasStart ? body.orderWindowStart : current.orderWindowStart,
        current.orderWindowStart
      );
      const end = normalizeTime24h(
        hasEnd ? body.orderWindowEnd : current.orderWindowEnd,
        current.orderWindowEnd
      );
      updateFields.orderWindowStart = start;
      updateFields.orderWindowEnd = end;
      updateFields.deliveryTimeWindow = buildDeliveryTimeLabel(start, end);
    } else if (typeof body.deliveryTimeWindow === "string" && body.deliveryTimeWindow.trim()) {
      updateFields.deliveryTimeWindow = body.deliveryTimeWindow.trim();
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ success: false, message: "No valid fields to update" }, { status: 400 });
    }

    const updated = await Settings.findOneAndUpdate(
      { key: "global" },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    const settings = await getGlobalSettings();

    console.info("[settings] PATCH saved", {
      orderWindowStart: settings.orderWindowStart,
      orderWindowEnd: settings.orderWindowEnd,
      deliveryTimeWindow: settings.deliveryTimeWindow,
      rawId: updated?._id ? String(updated._id) : undefined,
    });

    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error("PATCH settings error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
