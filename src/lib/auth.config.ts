import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";

/**
 * Auth config that does NOT import Prisma/db.
 * Safe to use in Edge middleware.
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: UserRole;
      phone?: string | null;
    };
  }
  interface User {
    role: UserRole;
    phone?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    phone?: string | null;
  }
}

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // Credentials provider is configured in the full auth.ts
    // This is just the base config for middleware
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // authorize is handled in the full auth.ts
      async authorize() {
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.phone = user.phone;
      }
      if (trigger === "update" && session) {
        token.name = session.name;
        token.email = session.email;
        token.phone = session.phone;
        token.image = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.phone = token.phone;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // Protected routes
      const adminPaths = ["/admin"];
      const restaurantPaths = ["/restaurant"];
      const protectedPaths = ["/account", "/checkout", "/orders"];

      if (adminPaths.some((p) => path.startsWith(p))) {
        if (!isLoggedIn || auth?.user?.role !== "ADMIN") {
          return Response.redirect(new URL("/login", nextUrl));
        }
      }

      if (restaurantPaths.some((p) => path.startsWith(p))) {
        if (
          !isLoggedIn ||
          (auth?.user?.role !== "RESTAURANT_OWNER" &&
            auth?.user?.role !== "ADMIN")
        ) {
          return Response.redirect(new URL("/login", nextUrl));
        }
      }

      if (protectedPaths.some((p) => path.startsWith(p))) {
        if (!isLoggedIn) {
          return Response.redirect(
            new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, nextUrl)
          );
        }
      }

      // Redirect logged-in users away from auth pages
      if (isLoggedIn && (path === "/login" || path === "/register")) {
        if (auth?.user?.role === "ADMIN") {
          return Response.redirect(new URL("/admin", nextUrl));
        }
        if (auth?.user?.role === "RESTAURANT_OWNER") {
          return Response.redirect(new URL("/restaurant/dashboard", nextUrl));
        }
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
};
