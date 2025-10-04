import dbConnect from "@/app/lib/mongodb";
import { subscribeSchema } from "@/app/lib/schemas/subscribeSchema";
import Subscribe from "@/app/models/Subscribe";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    await dbConnect();
    const subscribe = await Subscribe.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, subscribe });
  } catch (err: unknown) {
    console.error("Subscribe GET error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    // Validate request body with existing Zod schema
    const result = subscribeSchema.safeParse(body);
    if (!result.success) {
  return NextResponse.json(
    { success: false, error: result.error.issues },
    { status: 400 }
  );
}


    const { email } = result.data;

    // Check for existing email
    const existing = await Subscribe.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Email already subscribed" },
        { status: 400 }
      );
    }

    // Create new subscription
    const newSubscribe = await Subscribe.create({ email });

    return NextResponse.json({
      success: true,
      message: "Subscribed successfully",
      subscribe: newSubscribe,
    });
  } catch (err: unknown) {
    console.error("Subscribe POST error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
