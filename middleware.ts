// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge } from "./lib/jwt";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = await verifyTokenEdge(token);

    if (!payload) {
      console.log("Middleware: Invalid or expired token (Edge verification)");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/protected/:path*"],
};
