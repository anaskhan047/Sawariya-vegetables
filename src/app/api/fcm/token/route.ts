import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";
import FcmToken from "@/app/models/FcmToken";

type JwtPayload = {
  id: string;
};

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const headerToken = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : "";
  const cookieToken = (await cookies()).get("token")?.value || "";
  const token = headerToken || cookieToken;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    await dbConnect();
    return User.findById(decoded.id).select("_id role").lean<{ _id: string; role: "admin" | "delivery" | "user" } | null>();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    console.warn("FCM token save blocked: unauthenticated request.");
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const token = typeof raw.token === "string" ? raw.token.trim() : "";
  if (!token) {
    console.warn("FCM token save blocked: empty token payload.");
    return NextResponse.json({ success: false, message: "FCM token is required" }, { status: 400 });
  }

  const userAgent = req.headers.get("user-agent") || "";

  await FcmToken.updateOne(
    { token },
    {
      $set: {
        userId: user._id,
        role: user.role,
        token,
        userAgent,
        lastSeenAt: new Date(),
      },
    },
    { upsert: true }
  );

  console.info("FCM token saved", {
    userId: String(user._id),
    role: user.role,
    tokenPrefix: token.slice(0, 12),
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const token = typeof raw.token === "string" ? raw.token.trim() : "";
  if (!token) {
    return NextResponse.json({ success: false, message: "FCM token is required" }, { status: 400 });
  }

  await FcmToken.deleteOne({ token, userId: user._id });
  return NextResponse.json({ success: true });
}
