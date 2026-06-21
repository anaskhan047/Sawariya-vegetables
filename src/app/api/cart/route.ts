import { NextRequest, NextResponse } from "next/server";
import * as cookie from "cookie"; //  fixed import
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@/app/lib/mongodb";
import Cart from "@/app/models/Cart";
import Product from "@/app/models/Product";
import { Types } from "mongoose";
import { getOutsideOrderWindowMessage, getOrderWindowStatus } from "@/app/lib/orderWindow";
import { getGlobalSettings } from "@/app/lib/settingsServer";
import { getOrderableMaxQty, stockExceededMessage } from "@/app/lib/stock";

/** Types **/
interface CartQuery {
  cartId: string;
  userId?: Types.ObjectId;
}

interface CartItem {
  productId: Types.ObjectId;
  quantity: number;
  priceAtAdd: number;
}

async function findProductByIdentifier(productId: string) {
  if (!productId) return null;
  if (Types.ObjectId.isValid(productId)) {
    const byObjectId = await Product.findById(productId);
    if (byObjectId) return byObjectId;
  }
  return Product.findOne({ id: productId });
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

async function orderWindowPayload() {
  const settings = await getGlobalSettings();
  const start =
    typeof settings.orderWindowStart === "string" && settings.orderWindowStart.trim()
      ? settings.orderWindowStart.trim()
      : "08:00";
  const end =
    typeof settings.orderWindowEnd === "string" && settings.orderWindowEnd.trim()
      ? settings.orderWindowEnd.trim()
      : "00:00";
  const status = getOrderWindowStatus(start, end);
  return {
    isOpen: status.isOpen,
    label: status.label,
    outsideMessage: status.isOpen ? undefined : getOutsideOrderWindowMessage(status),
  };
}

/** GET: fetch cart items */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const cartId = getCartId(req);
    if (!cartId) {
      return NextResponse.json({ success: true, items: [] }, { status: 200 });
    }

    const cart = await Cart.findOne({ cartId })
      .populate("items.productId")
      .lean();

    return NextResponse.json(
      { success: true, items: cart?.items ?? [] },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/cart error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load cart" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const product = await findProductByIdentifier(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const minQty = product.minQty ?? 1;
    const orderableMax = getOrderableMaxQty(product);
    if (orderableMax <= 0) {
      return NextResponse.json(
        { success: false, error: `${product.name} is out of stock.` },
        { status: 400 }
      );
    }
    if (quantity < minQty) {
      return NextResponse.json(
        { success: false, error: `Minimum order is ${minQty} ${product.unit || "units"}.` },
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
      { cartId },
      {
        $setOnInsert: {
          cartId,
          userId: userId ? new Types.ObjectId(userId) : undefined,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const prodObjectId = product._id as Types.ObjectId;
    const existingIndex = (cart.items as CartItem[]).findIndex((it) =>
      it.productId.equals(prodObjectId)
    );

    if (existingIndex >= 0) {
      const existingQty = (cart.items[existingIndex] as CartItem).quantity;
      const newTotal = existingQty + quantity;

      if (newTotal > orderableMax) {
        return NextResponse.json(
          {
            success: false,
            error: stockExceededMessage(product, newTotal),
          },
          { status: 400 }
        );
      }

      (cart.items[existingIndex] as CartItem).quantity = newTotal;
    } else {
      if (quantity > orderableMax) {
        return NextResponse.json(
          {
            success: false,
            error: stockExceededMessage(product, quantity),
          },
          { status: 400 }
        );
      }

      (cart.items as CartItem[]).push({
        productId: prodObjectId,
        quantity,
        priceAtAdd: product.price,
      });
    }


    await cart.save();
    await cart.populate("items.productId");

    const orderWindow = await orderWindowPayload();

    return NextResponse.json(
      { success: true, items: cart.items, orderWindow },
      { status: 200, headers }
    );
  } catch (err) {
    console.error("POST /api/cart error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to add to cart" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { success: false, error: "No cart" },
        { status: 400 }
      );
    }

    if (!productId || typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const product = await findProductByIdentifier(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const minQty = product.minQty ?? 1;
    const orderableMax = getOrderableMaxQty(product);
    if (quantity > 0) {
      if (orderableMax <= 0) {
        return NextResponse.json(
          { success: false, error: `${product.name} is out of stock.` },
          { status: 400 }
        );
      }
      if (quantity < minQty) {
        return NextResponse.json(
          { success: false, error: `Minimum order is ${minQty} ${product.unit || "units"}.` },
          { status: 400 }
        );
      }
      if (quantity > orderableMax) {
        return NextResponse.json(
          { success: false, error: stockExceededMessage(product, quantity) },
          { status: 400 }
        );
      }
    }

    const query: CartQuery = { cartId };
    if (userId && Types.ObjectId.isValid(userId)) {
      query.userId = new Types.ObjectId(userId);
    }

    const cart = await Cart.findOne(query);
    if (!cart) {
      return NextResponse.json(
        { success: false, error: "Cart not found" },
        { status: 404 }
      );
    }

    const prodObjectId = product._id as Types.ObjectId;
    const idx = (cart.items as CartItem[]).findIndex((it) =>
      it.productId.equals(prodObjectId)
    );

    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    if (quantity === 0) {
      (cart.items as CartItem[]).splice(idx, 1);
    } else {
      (cart.items[idx] as CartItem).quantity = quantity;
    }

    await cart.save();
    await cart.populate("items.productId");

    return NextResponse.json(
      { success: true, items: cart.items },
      { status: 200 }
    );
  } catch (err) {
    console.error("PUT /api/cart error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update cart" },
      { status: 500 }
    );
  }
}

/** DELETE: remove item or clear cart */
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const { productId, userId } = body as {
      productId?: string;
      userId?: string;
    };

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
      (cart.items as CartItem[]) = [];
    } else {
      const product = await findProductByIdentifier(productId);
      if (product) {
        const prodObjectId = product._id as Types.ObjectId;
        const idx = (cart.items as CartItem[]).findIndex((it) =>
          it.productId.equals(prodObjectId)
        );
        if (idx >= 0) {
          (cart.items as CartItem[]).splice(idx, 1);
        }
      }
    }

    await cart.save();
    await cart.populate("items.productId");
    return NextResponse.json(
      { success: true, items: cart.items },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE /api/cart error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to modify cart" },
      { status: 500 }
    );
  }
}
