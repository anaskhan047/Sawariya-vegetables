// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const url = req.nextUrl.clone();

  // Public pages allowed
  const publicPaths = ["/login", "/register", "/api/auth/login", "/api/auth/register", "/api/auth/me", "/api/auth/logout", "/"];
  if (publicPaths.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"))) {
    // still allow through - but we still want protection for admin/shop paths below
  }

  // If accessing protected routes and no token -> redirect to /login
  if (!token) {
    if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/deliveryBoy") || url.pathname.startsWith("/shop")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  try {
    interface JwtPayload {
      role: string;
      // add other properties as needed
    }
    const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (url.pathname.startsWith("/admin") && decoded.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (url.pathname.startsWith("/deliveryBoy") && decoded.role !== "delivery") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (url.pathname.startsWith("/shop") && !["user", "admin", "delivery"].includes(decoded.role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/deliveryBoy/:path*", "/shop/:path*"],
};
