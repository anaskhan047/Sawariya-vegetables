import { NextRequest, NextResponse } from "next/server";
import User from "@/app/models/User";
import Cart from "@/app/models/Cart";
import dbConnect from "@/app/lib/mongodb";

// Secure this route (only admins)
async function getUsers() {
  await dbConnect();

  // Fetch all users
  const users = await User.find().lean();

  // Map through users to add cart and order stats
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      // Cart items count
      const cart = await Cart.findOne({ userId: user._id });
      const cartItemsCount = cart ? cart.items.length : 0;

      // Orders
    //   const orders = await Order.find({ userId: user._id });
    //   const ordersPlaced = orders.length;
    //   const ordersCancelled = orders.filter((o) => o.status === "cancelled").length;

      return {
        ...user,
        cartItemsCount,
        // ordersPlaced,
        // ordersCancelled,
      };
    })
  );

  return usersWithStats;
}

export async function GET(req: NextRequest) {
  try {
    // Optional: check if admin (you must implement isAdmin)
    // const user = await getCurrentUser(req);
    // if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const users = await getUsers();
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
