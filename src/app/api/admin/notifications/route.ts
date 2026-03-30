// src/app/api/admin/notifications/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import Notification from "@/app/models/Notification";
import { notifyAllUsersFromAdmin } from "@/app/lib/notifications/orderNotifications";

type MaybeUser = {
  _id?: string;
  role?: string;
  [key: string]: unknown;
};

// helper: extract user from Authorization header (same pattern used elsewhere)
async function getUserFromReq(req: Request | NextRequest): Promise<MaybeUser | null> {
  try {
    const authHeader = (req.headers.get("authorization") || "") as string;
    if (!authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id?: string };
    if (!decoded?.id) return null;
    await dbConnect();
    const u = await User.findById(decoded.id).lean<MaybeUser>();
    return u || null;
  } catch {
    return null;
  }
}

// GET: list notifications (optionally only unread)
export async function GET(req: Request) {
  try {
    const user = await getUserFromReq(req);
    if (!user || !["admin", "delivery"].includes(user.role ?? "")) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    await dbConnect();

    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get("unread") === "true";

    const q: Record<string, unknown> = { forRole: "admin" };
    if (unreadOnly) q.read = false;

    const notifs = await Notification.find(q as Record<string, unknown>).sort({ createdAt: -1 }).limit(200).lean();

    return NextResponse.json({ success: true, notifications: notifs });
  } catch (err: unknown) {
    console.error("admin/notifications GET error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// POST: send broadcast notification to all users
export async function POST(req: Request) {
  try {
    const user = await getUserFromReq(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    await dbConnect();

    const rawBody = (await req.json().catch(() => ({}))) as unknown;
    const body =
      typeof rawBody === "object" && rawBody !== null
        ? (rawBody as Record<string, unknown>)
        : {};

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const link = typeof body.link === "string" ? body.link.trim() : "";

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: "title and message are required" },
        { status: 400 }
      );
    }

    const result = await notifyAllUsersFromAdmin(title, message, link || undefined);
    if (result.skipped) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.reason === "firebase-admin-not-configured"
              ? "Push send"
              : "Push send skipped.",
          ...result,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    console.error("admin/notifications POST error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// PATCH: mark notification(s) read
export async function PATCH(req: Request) {
  try {
    const user = await getUserFromReq(req);
    if (!user || !["admin", "delivery"].includes(user.role ?? "")) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    await dbConnect();

    const rawBody = (await req.json().catch(() => ({}))) as unknown;
    // safe extraction of id
    const body = typeof rawBody === "object" && rawBody !== null ? (rawBody as Record<string, unknown>) : {};
    const idCandidate = body["id"];
    const id = typeof idCandidate === "string" && idCandidate.trim() !== "" ? idCandidate.trim() : undefined;

    if (id) {
      // Using updateOne — we don't depend on matchedCount shape for success
      await Notification.updateOne({ _id: id, forRole: "admin" }, { $set: { read: true } });
      return NextResponse.json({ success: true });
    } else {
      // mark all admin notifs read
      await Notification.updateMany({ forRole: "admin", read: false }, { $set: { read: true } });
      return NextResponse.json({ success: true });
    }
  } catch (err: unknown) {
    console.error("admin/notifications PATCH error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
