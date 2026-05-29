import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/app/lib/mongodb";
import PushSubscription from "@/app/models/PushSubscription";
import User from "@/app/models/User";

type JwtPayload = {
  id?: string;
};

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const headerToken = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : "";
  const cookieToken = (await cookies()).get("token")?.value || "";
  const token = headerToken || cookieToken;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    if (!decoded.id) return null;
    await dbConnect();
    return User.findById(decoded.id).select("_id role").lean<{
      _id: string;
      role: "admin" | "delivery" | "user";
    } | null>();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { subscription, origin, adminId } = body ?? {};

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { success: false, message: "Invalid subscription" },
        { status: 400 }
      );
    }

    const siteOrigin =
      (typeof origin === "string" && origin.startsWith("http")
        ? origin
        : process.env.SITE_ORIGIN) || null;

    await PushSubscription.updateOne(
      { endpoint: subscription.endpoint },
      {
        $set: {
          endpoint: subscription.endpoint,
          keys: subscription.keys || {},
          adminId: typeof adminId === "string" ? adminId : "",
          userId: String(user._id),
          role: user.role,
          origin: siteOrigin,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("push register error", err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
