import dbConnect from "@/app/lib/mongodb";
import { MessageSchema } from "@/app/lib/schemas/messageSchema";
import MessageModel from "@/app/models/Message";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

/**
 * GET: Fetch all messages sorted by createdAt desc, with status ensured
 */
export async function GET() {
  try {
    await dbConnect();
    const messages = await MessageModel.find({}).sort({ createdAt: -1 }).lean();
    const messagesWithStatus = messages.map((msg) => ({
      ...msg,
      status: msg.status || "New",
    }));
    return NextResponse.json({ success: true, messages: messagesWithStatus });
  } catch (err: unknown) {
    console.error("Message GET error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new message, ensure status
 */
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const result = MessageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.format() },
        { status: 400 }
      );
    }
    // Ensure only one definition: "message"
    const created = await MessageModel.create({
      ...result.data,
      status: result.data.status || "New",
    });
    return NextResponse.json({ success: true, message: created });
  } catch (err: unknown) {
    console.error("Message POST error:", err);
    if (err instanceof Error && err.message.includes("E11000")) {
      return NextResponse.json(
        { success: false, error: "This email already has a message" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update status for a message by _id
 */
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { _id, status } = body;
    if (!_id || !status) {
      return NextResponse.json(
        { success: false, error: "Missing _id or status" },
        { status: 400 }
      );
    }
    const updatedMessage = await MessageModel.findByIdAndUpdate(
      new mongoose.Types.ObjectId(_id),
      { status },
      { new: true }
    );
    if (!updatedMessage) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: updatedMessage });
  } catch (err: unknown) {
    console.error("Message PUT error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
