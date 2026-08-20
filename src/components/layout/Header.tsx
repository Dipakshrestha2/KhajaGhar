"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search,
  ShoppingCart,
  MapPin,
  Menu,
  X,
  User,
  Heart,
  ClipboardList,
  LogIn,
  ChefHat,
} from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 glass border-b border-surface-200/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/20">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold font-[family-name:var(--font-outfit)] text-gradient hidden sm:block">
              KhajaGhar
            </span>
          </Link>

          {/* Location Selector */}
          <button className="hidden md:flex items-center gap-1.5 rounded-full bg-surface-100 px-3 py-1.5 text-sm hover:bg-surface-200 transition-colors">
            <MapPin className="h-4 w-4 text-primary-500" />
            <span className="text-surface-700 max-w-[140px] truncate">Burtibang</span>
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search restaurants, cuisines, food..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full bg-surface-100 py-2 pl-10 pr-4 text-sm outline-none placeholder:text-surface-400 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    window.location.href = `/restaurants?search=${encodeURIComponent(searchQuery)}`;
                  }
                }}
              />
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/restaurants"
              className="rounded-lg px-3 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors"
            >
              Restaurants
            </Link>
            <Link
              href="/orders"
              className="rounded-lg px-3 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors"
            >
              Orders
            </Link>
            <Link
              href="/account/favorites"
              className="rounded-lg px-3 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors"
            >
              <Heart className="h-4 w-4" />
            </Link>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative rounded-full bg-surface-100 p-2.5 hover:bg-surface-200 transition-colors"
            >
              <ShoppingCart className="h-5 w-5 text-surface-700" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
                0
              </span>
            </Link>

            {/* Login Button */}
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-2 rounded-full bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden rounded-lg p-2 hover:bg-surface-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search restaurants, food..."
              className="w-full rounded-full bg-surface-100 py-2 pl-10 pr-4 text-sm outline-none placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-surface-200 bg-white animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/restaurants"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ChefHat className="h-4 w-4" />
              Restaurants
            </Link>
            <Link
              href="/orders"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ClipboardList className="h-4 w-4" />
              Orders
            </Link>
            <Link
              href="/account/favorites"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Heart className="h-4 w-4" />
              Favorites
            </Link>
            <Link
              href="/account"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <User className="h-4 w-4" />
              Account
            </Link>
            <hr className="border-surface-200" />
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 rounded-full bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LogIn className="h-4 w-4" />
              Login / Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
