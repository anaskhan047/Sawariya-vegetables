import cloudinary from "@/app/lib/cloudinary";
import dbConnect from "@/app/lib/mongodb";
import HeroImage from "@/app/models/HeroImage";
import { NextResponse } from "next/server";
import { z } from "zod";

const uploadSchema = z.object({
  file: z
    .string()
    .min(1, "File is required")
    .refine((val) => val.startsWith("data:image/"), {
      message: "Invalid image format. Must be base64 encoded image.",
    }),
  section: z.string().default("hero"),
});

export async function GET() {
  await dbConnect();
  const images = await HeroImage.find({ section: "hero" }).sort({ createdAt: -1 });
  return NextResponse.json(images);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = uploadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { file, section } = parseResult.data;
    await dbConnect();

    const uploadRes = await cloudinary.uploader.upload(file, {
      folder: section,
    });

    const newImage = await HeroImage.create({
      url: uploadRes.secure_url,
      public_id: uploadRes.public_id,
      section,
    });

    return NextResponse.json({ success: true, image: newImage });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { public_id } = await req.json();

    if (!public_id) {
      return NextResponse.json(
        { error: "No public_id provided" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Remove from Cloudinary
    await cloudinary.uploader.destroy(public_id);

    // Remove from MongoDB
    await HeroImage.findOneAndDelete({ public_id });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
