// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const token = (await cookies()).get("token")?.value;

    if (!token) {
      return NextResponse.json({ loggedIn: false, user: null }, { status: 200 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return NextResponse.json({ loggedIn: true, user: decoded }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ loggedIn: false, user: null }, { status: 200 });
  }
}
