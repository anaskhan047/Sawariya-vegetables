import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/app/lib/mongodb";
import { getFirebaseAdminAuth } from "@/app/lib/firebase/admin";
import User, { IUser } from "@/app/models/User";

const googleAuthSchema = z.object({
  idToken: z.string().min(1, "Google authentication token is required"),
});

function getRedirectUrl(role: IUser["role"]) {
  if (role === "admin") return "/admin";
  if (role === "delivery") return "/deliveryBoy";
  return "/shop";
}

function getUserId(user: IUser) {
  return String(user._id);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function signAppToken(user: IUser) {
  return jwt.sign(
    { id: getUserId(user), role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = googleAuthSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }

    const firebaseAuth = getFirebaseAdminAuth();
    if (!firebaseAuth) {
      return NextResponse.json(
        { success: false, error: "Google authentication is not configured on the server" },
        { status: 500 }
      );
    }

    const decoded = await firebaseAuth.verifyIdToken(parsed.data.idToken);
    const email = decoded.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Google account email is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const now = new Date();
    const fullName = decoded.name?.trim() || email.split("@")[0] || "Google User";
    const profilePhotoUrl = decoded.picture || undefined;
    const byUid = await User.findOne({ firebaseUid: decoded.uid });
    const byEmail = await User.findOne({
      email: { $regex: `^${escapeRegExp(email)}$`, $options: "i" },
    });

    let user = byUid || byEmail;

    if (byUid && byEmail && getUserId(byUid) !== getUserId(byEmail)) {
      return NextResponse.json(
        { success: false, error: "This Google account is linked to another user record" },
        { status: 409 }
      );
    }

    if (user) {
      if (user.firebaseUid && user.firebaseUid !== decoded.uid) {
        return NextResponse.json(
          { success: false, error: "This email is already linked to a different Google account" },
          { status: 409 }
        );
      }

      user.firebaseUid = decoded.uid;
      user.authProvider = "google";
      user.verified = true;
      user.lastLoginAt = now;
      user.profilePhotoUrl = profilePhotoUrl ?? user.profilePhotoUrl;
      user.image = user.image || profilePhotoUrl;
      user.name = user.name || fullName;
      await user.save();
    } else {
      const password = await bcrypt.hash(`google:${decoded.uid}:${randomUUID()}`, 10);
      user = await User.create({
        name: fullName,
        email,
        password,
        image: profilePhotoUrl,
        profilePhotoUrl,
        firebaseUid: decoded.uid,
        authProvider: "google",
        verified: true,
        role: "user",
        isActive: true,
        lastLoginAt: now,
      });
    }

    const token = signAppToken(user);
    const redirectUrl = getRedirectUrl(user.role);
    const response = NextResponse.json({
      success: true,
      message: byEmail || byUid ? "Login successful" : "Account created successfully",
      token,
      user: {
        id: getUserId(user),
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
      redirectUrl,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("GOOGLE AUTH ERROR:", error);
    return NextResponse.json({ success: false, error: "Google authentication failed" }, { status: 500 });
  }
}
