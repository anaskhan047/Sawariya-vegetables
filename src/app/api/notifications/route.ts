import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";
import Notification from "@/app/models/Notification";

type MaybeUser = {
  _id?: string;
  role?: string;
};

async function getUserFromReq(req: Request): Promise<MaybeUser | null> {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const headerToken = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : "";
    const cookieToken = (await cookies()).get("token")?.value || "";
    const token = headerToken || cookieToken;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id?: string };
    if (!decoded?.id) return null;
    await dbConnect();
    return (await User.findById(decoded.id).select("_id role").lean<MaybeUser>()) || null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromReq(req);
    if (!user || !user._id) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get("unread") === "true";

    const query: Record<string, unknown> = {
      forRole: "user",
      userId: user._id,
    };
    if (unreadOnly) query.read = false;

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(300).lean();
    return NextResponse.json({ success: true, notifications });
  } catch (err: unknown) {
    console.error("notifications GET error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUserFromReq(req);
    if (!user || !user._id) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    const rawBody = (await req.json().catch(() => ({}))) as unknown;
    const body =
      typeof rawBody === "object" && rawBody !== null
        ? (rawBody as Record<string, unknown>)
        : {};

    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : "";
    if (id) {
      await Notification.updateOne(
        { _id: id, forRole: "user", userId: user._id },
        { $set: { read: true } }
      );
    } else {
      await Notification.updateMany(
        { forRole: "user", userId: user._id, read: false },
        { $set: { read: true } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("notifications PATCH error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
