import dbConnect from "@/app/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ message: "MongoDB Connected ✅" });
  } catch (error: any) {
    console.error("MongoDB Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
