// src/app/api/admin/users-with-orders/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";
import Orders from "@/app/models/Orders";

export async function GET() {
  try {
    await dbConnect();

    const users = await User.find({}).lean();

    const usersWithOrders = await Promise.all(
      users.map(async (user) => {
        // IMPORTANT: Orders store user reference in field `user`, not `userId`
        const totalOrders = await Orders.countDocuments({ user: user._id });
        const cancelledOrders = await Orders.countDocuments({
          user: user._id,
          status: "cancelled",
        });

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          image: user.image || "",
          role: user.role,
          isActive: Boolean(user.isActive),
          orders: totalOrders,
          cancelledOrders,
        };
      })
    );

    return NextResponse.json({ success: true, users: usersWithOrders });
  } catch (error) {
    console.error("Error fetching users with orders:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
