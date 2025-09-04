import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const url = req.nextUrl.clone();

  if (!token) {
    console.log("❌ No token found, redirecting to /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    interface JwtPayload {
      role: string;
      id: string;
      email: string;
      name: string;
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;

    console.log("✅ Middleware: Decoded JWT:", decoded);

    if (url.pathname.startsWith("/admin") && decoded.role !== "admin") {
      console.log("❌", decoded.role, "tried to access /admin");
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (url.pathname.startsWith("/deliveryBoy") && decoded.role !== "delivery") {
      console.log("❌", decoded.role, "tried to access /deliveryBoy");
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (url.pathname.startsWith("/shop") && !["user", "admin", "delivery"].includes(decoded.role)) {
      console.log("❌", decoded.role, "tried to access /shop");
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    console.log("✅ Access granted to", url.pathname, "for role", decoded.role);
    return NextResponse.next();
  } catch (err) {
    console.error("❌ Token verification failed:", err);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/deliveryBoy", "/deliveryBoy/:path*", "/shop", "/shop/:path*"],
};
