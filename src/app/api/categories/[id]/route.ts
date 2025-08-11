import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import { createSchema } from "@/app/lib/schemas/category";
import Category from "@/app/models/Category";
import cloudinary from "@/app/lib/cloudinary";

export async function PUT(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop(); // assuming id is last segment

  if (!id) {
    return NextResponse.json({ success: false, error: "Missing id param" }, { status: 400 });
  }

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

    const category = await Category.findById(id);
    if (!category) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    category.name = name;

    if (file) {
      if (category.public_id) await cloudinary.uploader.destroy(category.public_id);
      const arrayBuffer = await file.arrayBuffer();
      const base64String = `data:${file.type};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
      const uploadRes = await cloudinary.uploader.upload(base64String, { folder: "categories" });
      category.imageUrl = uploadRes.secure_url;
      category.public_id = uploadRes.public_id;
    }

    await category.save();
    return NextResponse.json({ success: true, data: category });
  } catch (err) {
    console.error("Error updating category:", err);
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ success: false, error: "Missing id param" }, { status: 400 });
  }

  await dbConnect();

  try {
    const category = await Category.findById(id);
    if (!category) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    if (category.public_id) await cloudinary.uploader.destroy(category.public_id);
    await category.deleteOne();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting category:", err);
    return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
  }
}
