import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define which roles can access which routes
const roleBasedRoutes: Record<string, string[]> = {
  "/admin": ["admin"],
  "/delivery-address": ["delivery"],
  "/shop": ["user", "admin", "delivery"], // shop accessible by all roles (adjust if needed)
};

// Extract token from cookie (assuming you save JWT token in cookie after login)
function getTokenFromCookie(req: NextRequest): string | null {
  return req.cookies.get("token")?.value || null;
}

// A simple JWT decode function (you can use a library or verify token server side)
function parseJwt(token: string) {
  try {
    const base64Payload = token.split(".")[1];
    const payload = Buffer.from(base64Payload, "base64").toString();
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // If request is for public routes (login, register, api etc), let it pass
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname === "/" // home page
  ) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = getTokenFromCookie(req);
  if (!token) {
    // No token, redirect to login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Decode JWT to get role
  const payload = parseJwt(token);
  if (!payload || !payload.role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check if current path requires role and user has permission
  for (const routePrefix in roleBasedRoutes) {
    if (pathname.startsWith(routePrefix)) {
      if (!roleBasedRoutes[routePrefix].includes(payload.role)) {
        // User role not allowed here → redirect to unauthorized or home
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  }

  // Otherwise allow
  return NextResponse.next();
}

// Define matcher for middleware (paths to apply middleware)
export const config = {
  matcher: ["/admin/:path*", "/deliveryBoy/:path*", "/shop/:path*"],
};
