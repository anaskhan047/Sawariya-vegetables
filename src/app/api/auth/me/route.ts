import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";

interface DecodedToken {
  id: string;
  iat?: number;
  exp?: number;
}

export async function GET(req: Request) {
  try {
    //  1. Header se token check
    const authHeader = req.headers.get("authorization");
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      token = (await cookies()).get("token")?.value;
    }

    if (!token) {
      return NextResponse.json({ loggedIn: false, user: null }, { status: 200 });
    }

    await dbConnect();

    //  Type-safe JWT verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

    const user = await User.findById(decoded.id).lean();

    if (!user) {
      return NextResponse.json({ loggedIn: false, user: null }, { status: 200 });
    }

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      image: user.image,
    };

    return NextResponse.json({ loggedIn: true, user: safeUser }, { status: 200 });
  } catch (err) {
    console.error("ME ERROR:", err);
    return NextResponse.json({ loggedIn: false, user: null }, { status: 200 });
  }
}
