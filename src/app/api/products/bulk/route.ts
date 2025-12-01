import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Product from "@/app/models/Product";
import { productSchema } from "@/app/lib/schemas/productSchema";
import { uploadBase64Image } from "@/app/lib/cloudinary";

function genId() {
  return "PRD" + Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const raw = (await req.json().catch(() => null)) as unknown;

    // ✅ bulk route: expects array of products
    if (!Array.isArray(raw)) {
      return NextResponse.json(
        { success: false, error: "Invalid input: expected array of products" },
        { status: 400 }
      );
    }

    if (raw.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product list is empty" },
        { status: 400 }
      );
    }

    // optional safety limit
    if (raw.length > 100) {
      return NextResponse.json(
        { success: false, error: "Maximum 100 products allowed per request" },
        { status: 400 }
      );
    }

    const created: unknown[] = [];

    // ✅ process each product same logic as single POST
    for (let index = 0; index < raw.length; index += 1) {
      const item = raw[index];

      const parsed = productSchema.safeParse(item);
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: parsed.error.issues.map(issue => `Item ${index}: ${issue.message}`)
          },
          { status: 400 }
        );
      }

      const data = parsed.data;

      // normalize tags: prefer `tags`, fallback to `Tag`
      const sourceTags =
        data.tags && data.tags.length > 0 ? data.tags : data.Tag ?? [];

      const tags = sourceTags
        .map((t: unknown) => String(t).trim())
        .filter((t: string) => Boolean(t));

      data.price = Number(data.price) || 0;
      data.marketPrice =
        typeof data.marketPrice === "number" && !Number.isNaN(data.marketPrice)
          ? data.marketPrice
          : 0;

      let id = data.id ?? genId();
      if (await Product.exists({ id })) {
        id = genId();
      }

      let images = data.images ?? [];

      if (data.imageBase64) {
        const uploaded = await uploadBase64Image(data.imageBase64, "products");
        images = [...images, uploaded];
      }

      if (data.imagesBase64?.length) {
        const uploadedMany = await Promise.all(
          data.imagesBase64.map((b64: string) =>
            uploadBase64Image(b64, "products")
          )
        );
        images = [...images, ...uploadedMany];
      }

      const doc = await Product.create({
        id,
        name: data.name,
        inHindi: data.inHindi,
        description: data.description,
        marketPrice: data.marketPrice,
        price: data.price,
        category: data.category,
        stockQty: data.stockQty,
        unit: data.unit,
        minQty: data.minQty,
        maxQty: data.maxQty,
        tags,
        images,
        grade: data.grade,
        popular: data.popular
      });

      created.push(doc.toObject());
    }

    return NextResponse.json(
      { success: true, count: created.length, products: created },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Products BULK POST error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
