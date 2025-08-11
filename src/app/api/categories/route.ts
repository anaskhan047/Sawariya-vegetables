import { NextResponse } from "next/server";
import Category from "@/app/models/Category";
import dbConnect from "@/app/lib/mongodb";
import cloudinary from "@/app/lib/cloudinary";
import { createSchema } from "@/app/lib/schemas/category";

type CategoryCreateInput = {
  name: string;
  imageUrl?: string;
  public_id?: string;
};
export async function GET() {
  await dbConnect();
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: categories });
  } catch (err) {
    console.error("Error fetching categories:", err);
    return NextResponse.json({ success: false, error: "Fetch failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const file = formData.get("image") as File | null;

    const parsed = createSchema.safeParse({ name, file });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const toCreate: CategoryCreateInput = { name };

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const base64String = `data:${file.type};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
      const uploadRes = await cloudinary.uploader.upload(base64String, { folder: "categories" });
      toCreate.imageUrl = uploadRes.secure_url;
      toCreate.public_id = uploadRes.public_id;
    }

    const created = await Category.create(toCreate);
    return NextResponse.json({ success: true, data: created });
  } catch (err) {
    console.error("Error creating category:", err);
    return NextResponse.json({ success: false, error: "Create failed" }, { status: 500 });
  }
}
