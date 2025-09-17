import { NextRequest, NextResponse } from "next/server";
import User from "@/app/models/User";
import Cart from "@/app/models/Cart";
import dbConnect from "@/app/lib/mongodb";
import { Types } from "mongoose";

interface PopulatedCartItem {
  productId: {
    _id: Types.ObjectId;
    name: string;
    price: number;
  };
  quantity: number;
}

interface CartWithPopulatedItems {
  items: PopulatedCartItem[];
}

/** Fetch all users with their cart details */
async function getUsers() {
  await dbConnect();

  // Fetch all users
  const users = await User.find().lean();

  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      // Fetch cart by userId
      const cartDoc = await Cart.findOne({ userId: user._id })
        .populate<{ items: PopulatedCartItem[] }>("items.productId")
        .lean<CartWithPopulatedItems | null>();

      const cartItems = cartDoc?.items ?? [];

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        image: user.image,
        role: user.role,
        cartItemsCount: cartItems.length,
        cartItems: cartItems.map((it) => ({
          productId: it.productId?._id.toString() || null,
          name: it.productId?.name || "",
          price: it.productId?.price || 0,
          quantity: it.quantity,
        })),
        orders: "", // leave blank for now
      };
    })
  );

  return usersWithStats;
}

export async function GET(req: NextRequest) {
  try {
    const users = await getUsers();
    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch users" }, { status: 500 });
  }
}
