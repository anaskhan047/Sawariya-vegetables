import dbConnect from "@/app/lib/mongodb";
import DeliveryArea from "@/app/models/DeliveryArea";
import { NextRequest, NextResponse } from "next/server";

//  Add new delivery area
export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const { name, pincode } = body;

    if (!name || !pincode) {
      return NextResponse.json({ message: "Name and Pincode required" }, { status: 400 });
    }

    const area = new DeliveryArea({ name, pincode });
    await area.save();

    return NextResponse.json({ message: "Delivery area added", area }, { status: 201 });
  } catch (err: unknown) {
    const message = (err instanceof Error) ? err.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

//  Get all delivery areas
export async function GET() {
  await dbConnect();
  try {
    const areas = await DeliveryArea.find();
    return NextResponse.json(areas);
  } catch (err: unknown) {
    const message = (err instanceof Error) ? err.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

//  Delete delivery area
export async function DELETE(req: NextRequest) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Area ID required" }, { status: 400 });
    }

    await DeliveryArea.findByIdAndDelete(id);

    return NextResponse.json({ message: "Delivery area deleted" });
  } catch (err: unknown) {
    const message = (err instanceof Error) ? err.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
