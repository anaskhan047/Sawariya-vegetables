import { NextRequest, NextResponse } from "next/server";
import cookie from "cookie";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@/app/lib/mongodb";
import Cart from "@/app/models/Cart";
import Product from "@/app/models/Product";
import { Types } from "mongoose";

/** Types **/
interface CartQuery {
  cartId: string;
  userId?: Types.ObjectId;
}

/** Helpers **/
function getCartId(req: NextRequest): string | null {
  const raw = req.headers.get("cookie");
  if (!raw) return null;
  try {
    const parsed = cookie.parse(raw);
    return parsed.cartId ?? null;
  } catch {
    return null;
  }
}

function makeCartCookieValue(cartId: string) {
  return cookie.serialize("cartId", cartId, {
    path: "/",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/** GET: fetch cart items */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const cartId = getCartId(req);
    if (!cartId) {
      return NextResponse.json({ success: true, items: [] }, { status: 200 });
    }

    const cart = await Cart.findOne({ cartId }).populate("items.productId").lean();
    return NextResponse.json({ success: true, items: cart?.items ?? [] }, { status: 200 });
  } catch (err) {
    console.error("GET /api/cart error:", err);
    return NextResponse.json({ success: false, error: "Failed to load cart" }, { status: 500 });
  }
}

/** POST: add item */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const { productId, quantity, userId } = body as {
      productId?: string;
      quantity?: number;
      userId?: string;
    };

    if (!productId || typeof quantity !== "number" || quantity <= 0) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const product = await Product.findOne({ id: productId });
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const minQty = product.minQty ?? 1;
    const maxQty = product.maxQty ?? Number.MAX_SAFE_INTEGER;
    if (quantity < minQty || quantity > maxQty) {
      return NextResponse.json(
        { success: false, error: `Quantity must be between ${minQty} and ${maxQty}` },
        { status: 400 }
      );
    }

    let cartId = getCartId(req);
    const headers: Record<string, string> = {};
    if (!cartId) {
      cartId = uuidv4();
      headers["Set-Cookie"] = makeCartCookieValue(cartId);
    }

    const query: CartQuery = { cartId };
    if (userId && Types.ObjectId.isValid(userId)) {
      query.userId = new Types.ObjectId(userId);
    }

    const cart = await Cart.findOneAndUpdate(
      query,
      { $setOnInsert: { cartId, userId: userId ? new Types.ObjectId(userId) : undefined } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const prodObjectId = product._id as Types.ObjectId;
    const existingIndex = cart.items.findIndex((it: { productId: Types.ObjectId; quantity: number }) => it.productId.equals(prodObjectId));

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ productId: prodObjectId, quantity, priceAtAdd: product.price });
    }

    await cart.save();
    await cart.populate("items.productId");

    return NextResponse.json({ success: true, items: cart.items }, { status: 200, headers });
  } catch (err) {
    console.error("POST /api/cart error:", err);
    return NextResponse.json({ success: false, error: "Failed to add to cart" }, { status: 500 });
  }
}

/** PUT: update quantity */
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const { productId, quantity, userId } = body as {
      productId?: string;
      quantity?: number;
      userId?: string;
    };

    const cartId = getCartId(req);
    if (!cartId) {
      return NextResponse.json({ success: false, error: "No cart" }, { status: 400 });
    }

    if (!productId || typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const product = await Product.findOne({ id: productId });
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const minQty = product.minQty ?? 1;
    const maxQty = product.maxQty ?? Number.MAX_SAFE_INTEGER;
    if (quantity > 0 && (quantity < minQty || quantity > maxQty)) {
      return NextResponse.json(
        { success: false, error: `Quantity must be between ${minQty} and ${maxQty}` },
        { status: 400 }
      );
    }

    const query: CartQuery = { cartId };
    if (userId && Types.ObjectId.isValid(userId)) {
      query.userId = new Types.ObjectId(userId);
    }

    const cart = await Cart.findOne(query);
    if (!cart) {
      return NextResponse.json({ success: false, error: "Cart not found" }, { status: 404 });
    }

    const prodObjectId = product._id as Types.ObjectId;
    const idx = cart.items.findIndex((it: { productId: Types.ObjectId; quantity: number }) => it.productId.equals(prodObjectId));
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    if (quantity === 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
    }

    await cart.save();
    await cart.populate("items.productId");

    return NextResponse.json({ success: true, items: cart.items }, { status: 200 });
  } catch (err) {
    console.error("PUT /api/cart error:", err);
    return NextResponse.json({ success: false, error: "Failed to update cart" }, { status: 500 });
  }
}

/** DELETE: remove item or clear cart */
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const { productId, userId } = body as { productId?: string; userId?: string };

    const cartId = getCartId(req);
    if (!cartId) {
      return NextResponse.json({ success: true, items: [] }, { status: 200 });
    }

    const query: CartQuery = { cartId };
    if (userId && Types.ObjectId.isValid(userId)) {
      query.userId = new Types.ObjectId(userId);
    }

    const cart = await Cart.findOne(query);
    if (!cart) {
      return NextResponse.json({ success: true, items: [] }, { status: 200 });
    }

    if (!productId) {
      cart.items = [];
    } else {
      const product = await Product.findOne({ id: productId });
      if (product) {
        const prodObjectId = product._id as Types.ObjectId;
        const idx = cart.items.findIndex((it: { productId: Types.ObjectId; quantity: number }) => it.productId.equals(prodObjectId));
        if (idx >= 0) {
          cart.items.splice(idx, 1);
        }
      }
    }

    await cart.save();
    await cart.populate("items.productId");
    return NextResponse.json({ success: true, items: cart.items }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/cart error:", err);
    return NextResponse.json({ success: false, error: "Failed to modify cart" }, { status: 500 });
  }
}
