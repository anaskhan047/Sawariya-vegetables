// src/app/api/products/[id]/route.ts
import dbConnect from "@/app/lib/mongodb";
import Product from "@/app/models/Product";
import { productSchema } from "@/app/lib/schemas/productSchema";
import {
  uploadBase64Image,
  destroyByPublicId,
  extractPublicIdFromUrl,
} from "@/app/lib/cloudinary";

import { NextRequest, NextResponse } from "next/server";

interface ImageObj {
  url: string;
  public_id: string;
}

interface IncomingImage {
  url?: string;
  public_id?: string;
  publicId?: string;
}

// ---------- GET ----------
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    const product = await Product.findOne({ id }).lean();
    if (!product) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, product });
  } catch (err: unknown) {
    console.error("Product GET error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ---------- Helpers ----------
function normalizeIncoming(images: (string | IncomingImage)[] | undefined): ImageObj[] {
  if (!images) return [];
  return images
    .map((it) => {
      if (!it) return null;
      if (typeof it === "string") {
        return { url: it, public_id: extractPublicIdFromUrl(it) ?? "" };
      }
      if (typeof it === "object" && it.url && (it.public_id || it.publicId)) {
        return { url: it.url, public_id: it.public_id ?? it.publicId! };
      }
      return null;
    })
    .filter((x): x is ImageObj => x !== null);
}

// ---------- PUT ----------
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;

    const raw: unknown = await req.json().catch(() => ({}));
    const parsed = productSchema.partial().safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const doc = await Product.findOne({ id });
    console.log(doc, "food api data =========================================>");
    if (!doc) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const keepImages = normalizeIncoming(
      parsed.data.images ?? doc.images.map((i: ImageObj) => ({ url: i.url, public_id: i.public_id }))
    );

    const keepSet = new Set(keepImages.map((i) => i.public_id));
    for (const img of doc.images as ImageObj[]) {
      if (!keepSet.has(img.public_id)) {
        await destroyByPublicId(img.public_id);
      }
    }

    let finalImages: ImageObj[] = [...keepImages];

    const imageBase64 = (parsed.data as { imageBase64?: string }).imageBase64;
    const imagesBase64 = (parsed.data as { imagesBase64?: string[] }).imagesBase64;

    if (imageBase64) {
      const u = await uploadBase64Image(imageBase64, "products");
      finalImages.push(u);
    }

    if (imagesBase64?.length) {
      const uploaded = await Promise.all(
        imagesBase64.map((b64) => uploadBase64Image(b64, "products"))
      );
      finalImages = [...finalImages, ...uploaded];
    }
    console.log(parsed.data.inHindi, "parsed data ===================>");
    console.log(doc.inHindi, "doc data ===================>");
    // console.log(parsed.data.inHindi, "doc data ===================>");
    // ---------- Assign fields ----------
    if (parsed.data.name !== undefined) doc.name = parsed.data.name;
    if (parsed.data.inHindi !== undefined) doc.inHindi = parsed.data.inHindi;
    if (parsed.data.description !== undefined) doc.description = parsed.data.description;
    if (parsed.data.marketPrice !== undefined) doc.marketPrice = parsed.data.marketPrice;
    if (parsed.data.price !== undefined) doc.price = parsed.data.price;
    if (parsed.data.category !== undefined) doc.category = parsed.data.category;
    if (parsed.data.stockQty !== undefined) doc.stockQty = parsed.data.stockQty;
    if (parsed.data.unit !== undefined) doc.unit = parsed.data.unit;
    if (parsed.data.minQty !== undefined) doc.minQty = parsed.data.minQty;
    if (parsed.data.maxQty !== undefined) doc.maxQty = parsed.data.maxQty;
    if (parsed.data.grade !== undefined) doc.grade = parsed.data.grade;
    if (parsed.data.popular !== undefined) doc.popular = parsed.data.popular;

    doc.images = finalImages;
    // Right before doc.save()
const data = parsed.data as typeof parsed.data & { stockChange?: number };

if (data.stockChange !== undefined && typeof data.stockChange === "number") {
  doc.stockQty = (doc.stockQty || 0) + data.stockChange; // subtract if negative
  if (doc.stockQty < 0) doc.stockQty = 0; // prevent negative stock
}
await doc.save();

    return NextResponse.json({ success: true, product: doc.toObject() });
  } catch (err: unknown) {
    console.error("Product PUT error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ---------- DELETE ----------
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;

    const doc = await Product.findOne({ id });
    if (!doc) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    for (const img of doc.images as ImageObj[]) {
      await destroyByPublicId(img.public_id);
    }

    await doc.deleteOne();
    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (err: unknown) {
    console.error("Product DELETE error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
