import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";
import FcmToken from "@/app/models/FcmToken";

type JwtPayload = { id: string };

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
    return User.findById(decoded.id).select("_id role email").lean<{
      _id: string;
      role: string;
      email: string;
    } | null>();
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  const tokens = await FcmToken.find({ userId: user._id })
    .sort({ updatedAt: -1 })
    .select("token role updatedAt userAgent")
    .lean<{ token: string; role: string; updatedAt: Date; userAgent?: string }[]>();

  return NextResponse.json({
    success: true,
    user: { id: user._id, role: user.role, email: user.email },
    count: tokens.length,
    tokens: tokens.map((t) => ({
      role: t.role,
      tokenPrefix: t.token.slice(0, 20),
      updatedAt: t.updatedAt,
      userAgent: t.userAgent || "",
    })),
    firebaseAdminConfigured: Boolean(
      process.env.FIREBASE_ADMIN_PROJECT_ID &&
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
        process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ),
  });
}
