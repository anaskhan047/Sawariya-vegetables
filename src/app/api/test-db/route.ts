import dbConnect from "@/app/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ message: "✅ MongoDB Connected successfully" });
  } catch (error: unknown) {
    console.error("❌ MongoDB Error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error 
      }, 
      { status: 500 }
    );
  }
}
