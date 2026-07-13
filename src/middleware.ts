import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { authSecret } from "@/lib/auth-secret";
import { clearAuthSessionCookies, hasAuthSessionCookie } from "@/lib/auth-cookies";

const protectedRoutes = ["/settings", "/achievements", "/admin", "/chat"];
const authRoutes = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSessionCookie = hasAuthSessionCookie(req);

  const token = await getToken({
    req,
    secret: authSecret,
  });

  const isLoggedIn = !!token;

  // Старый/битый JWT в cookie — удаляем, чтобы не спамить JWTSessionError
  if (hasSessionCookie && !isLoggedIn) {
    const response = NextResponse.next();
    clearAuthSessionCookies(req, response);
    return response;
  }

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isAuthRoute = authRoutes.some((route) => pathname === route);
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && isLoggedIn && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
