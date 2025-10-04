import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";

interface UpdateUserBody {
  name?: string;
  phone?: string;
  address?: string;
  image?: string;
}

interface DecodedToken {
  id: string;
  iat?: number;
  exp?: number;
}

export async function PUT(req: Request) {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) 
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    const body: UpdateUserBody = await req.json();

    await dbConnect();

    const user = await User.findById(decoded.id);
    if (!user) 
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    //  Use user.set() instead of casting to any
    const allowed: (keyof UpdateUserBody)[] = ["name", "phone", "address", "image"];
    allowed.forEach((key) => {
      if (body[key] !== undefined) {
        user.set(key, body[key]);
      }
    });

    await user.save();

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      image: user.image,
    };

    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: unknown) {
    console.error("UPDATE PROFILE ERROR:", err);
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
