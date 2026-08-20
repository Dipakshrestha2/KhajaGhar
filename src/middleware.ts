import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use the edge-safe config (no Prisma) for middleware
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/account/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/admin/:path*",
    "/restaurant/:path*",
    "/login",
    "/register",
  ],
};
