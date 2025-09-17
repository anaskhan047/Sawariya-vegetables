import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Product from "@/app/models/Product";
import { productSchema } from "@/app/lib/schemas/productSchema";
import { uploadBase64Image } from "@/app/lib/cloudinary";

function genId() {
  return "PRD" + Math.floor(1000 + Math.random() * 9000).toString();
}

export async function GET() {
  try {
    await dbConnect();
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, products });
  } catch (err: unknown) {
    console.error("Products GET error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const raw = await req.json().catch(() => ({}));
    const parsed = productSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map(i => i.message) },
        { status: 400 }
      );
    }
    const data = parsed.data;

    let id = data.id ?? genId();
    if (await Product.exists({ id })) id = genId();

    let images = data.images ?? [];
    if (data.imageBase64) {
      const uploaded = await uploadBase64Image(data.imageBase64, "products");
      images = [...images, uploaded];
    }
    if (data.imagesBase64?.length) {
      const uploaded = await Promise.all(data.imagesBase64.map(b64 => uploadBase64Image(b64, "products")));
      images = [...images, ...uploaded];
    }

    const doc = await Product.create({
      id,
      name: data.name,
      inHindi: data.inHindi,
      description: data.description,
      price: data.price,
      category: data.category,
      stockQty: data.stockQty,
      unit: data.unit,
      minQty: data.minQty,
      maxQty: data.maxQty,
      images,
      grade: data.grade,
      popular: data.popular,
    });

    return NextResponse.json({ success: true, product: doc.toObject() }, { status: 201 });
  } catch (err: unknown) {
    console.error("Products POST error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
