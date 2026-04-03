// src/app/api/admin/users-with-orders/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";
import Orders from "@/app/models/Orders";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();

    if (userId) {
      const user = await User.findById(userId).lean();
      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      const orders = await Orders.find({ user: user._id })
        .sort({ createdAt: -1 })
        .lean<
          {
            _id: { toString(): string };
            total?: number;
            subTotal?: number;
            deliveryCharge?: number;
            status?: string;
            paymentMethod?: string;
            paymentStatus?: string;
            createdAt?: Date;
            otp?: string;
            address?: unknown;
            items?: unknown[];
          }[]
        >();

      const totalOrders = orders.length;
      const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;
      const totalSpend = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

      return NextResponse.json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          address: user.address || "",
          image: user.image || "",
          role: user.role,
          isActive: Boolean(user.isActive),
        },
        summary: {
          totalOrders,
          cancelledOrders,
          totalSpend,
        },
        orders: orders.map((order) => ({
          id: order._id.toString(),
          total: Number(order.total || 0),
          subTotal: Number(order.subTotal || 0),
          deliveryCharge: Number(order.deliveryCharge || 0),
          status: String(order.status || ""),
          paymentMethod: String(order.paymentMethod || ""),
          paymentStatus: String(order.paymentStatus || ""),
          createdAt: order.createdAt,
          otp: order.otp || "",
          address: order.address || {},
          items: Array.isArray(order.items) ? order.items : [],
        })),
      });
    }

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

    return NextResponse.json({
      success: true,
      users: usersWithOrders.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""), "en", {
          sensitivity: "base",
        })
      ),
    });
  } catch (error) {
    console.error("Error fetching users with orders:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
