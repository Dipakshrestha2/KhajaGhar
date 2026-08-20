"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Search,
  Star,
  Clock,
  Truck,
  ChefHat,
  SlidersHorizontal,
  X,
  Heart,
} from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cuisine: string[];
  logo: string | null;
  banner: string | null;
  rating: number;
  reviewCount: number;
  avgDeliveryTime: number;
  deliveryFee: number;
  minOrder: number;
  isActive: boolean;
  address: { city: string } | null;
  hours: Array<{ dayOfWeek: string; openTime: string; closeTime: string; isClosed: boolean }>;
}

const CUISINES = [
  "Nepali", "Indian", "Chinese", "Italian", "American",
  "Fast Food", "Cafe", "Bakery", "Desserts", "BBQ",
];

const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated" },
  { value: "delivery_time", label: "Fastest Delivery" },
  { value: "delivery_fee", label: "Lowest Fee" },
  { value: "name", label: "A-Z" },
];

export default function RestaurantsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialCuisine = searchParams.get("cuisine") || "";

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [cuisine, setCuisine] = useState(initialCuisine);
  const [sort, setSort] = useState("rating");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (cuisine) params.set("cuisine", cuisine);
      params.set("sort", sort);
      params.set("page", page.toString());
      params.set("limit", "12");

      const res = await fetch(`/api/restaurants?${params}`);
      const data = await res.json();
      setRestaurants(data.restaurants || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      console.error("Failed to fetch restaurants");
    } finally {
      setLoading(false);
    }
  }, [search, cuisine, sort, page]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const clearFilters = () => {
    setSearch("");
    setCuisine("");
    setSort("rating");
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)]">
              {cuisine
                ? `${cuisine.charAt(0).toUpperCase() + cuisine.slice(1)} Restaurants`
                : search
                ? `Results for "${search}"`
                : "All Restaurants"}
            </h1>
            <p className="text-surface-500 mt-1 text-sm">
              {loading ? "Loading..." : `${restaurants.length} restaurants found`}
            </p>
          </div>

          {/* Search & Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search restaurants..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-surface-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  showFilters || cuisine
                    ? "border-primary-500 bg-primary-50 text-primary-600"
                    : "border-surface-200 bg-white text-surface-600 hover:bg-surface-50"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {cuisine && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] text-white">
                    1
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Cuisine Filters */}
          {showFilters && (
            <div className="mb-6 rounded-xl bg-white border border-surface-200 p-4 animate-slide-down">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-surface-700">
                  Filter by Cuisine
                </h3>
                {cuisine && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {CUISINES.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCuisine(cuisine === c.toLowerCase() ? "" : c.toLowerCase());
                      setPage(1);
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      cuisine === c.toLowerCase()
                        ? "bg-primary-500 text-white"
                        : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Filter Tags */}
          {(search || cuisine) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {search && (
                <span className="flex items-center gap-1 rounded-full bg-surface-200 px-3 py-1 text-xs">
                  Search: {search}
                  <button onClick={() => setSearch("")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {cuisine && (
                <span className="flex items-center gap-1 rounded-full bg-primary-100 text-primary-700 px-3 py-1 text-xs">
                  {cuisine}
                  <button onClick={() => setCuisine("")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Restaurant Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white border border-surface-200/60 overflow-hidden"
                >
                  <div className="h-44 skeleton" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 w-3/4 skeleton rounded" />
                    <div className="h-4 w-1/2 skeleton rounded" />
                    <div className="h-4 w-2/3 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-16">
              <ChefHat className="h-16 w-16 mx-auto text-surface-300 mb-4" />
              <h3 className="text-lg font-semibold text-surface-700 mb-2">
                No restaurants found
              </h3>
              <p className="text-sm text-surface-500 mb-4">
                Try adjusting your search or filters
              </p>
              <button
                onClick={clearFilters}
                className="rounded-full bg-primary-500 px-5 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {restaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/restaurants/${restaurant.slug}`}
                  className="group rounded-2xl bg-white border border-surface-200/60 overflow-hidden card-hover"
                >
                  {/* Image */}
                  <div className="relative h-44 bg-gradient-to-br from-primary-100 to-primary-50 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ChefHat className="h-14 w-14 text-primary-200 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    {/* Rating Badge */}
                    <div className="absolute top-3 left-3">
                      <div className="flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2.5 py-1">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold">
                          {restaurant.rating.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-surface-500">
                          ({restaurant.reviewCount})
                        </span>
                      </div>
                    </div>
                    {/* Favorite button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        // TODO: Toggle favorite
                      }}
                      className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur p-2 hover:bg-white transition-colors"
                    >
                      <Heart className="h-4 w-4 text-surface-400" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">
                      {restaurant.name}
                    </h3>
                    <p className="text-xs text-surface-500 mt-1">
                      {restaurant.cuisine.join(" • ")}
                    </p>
                    {restaurant.description && (
                      <p className="text-xs text-surface-400 mt-1 line-clamp-2">
                        {restaurant.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-surface-100">
                      <span className="flex items-center gap-1 text-xs text-surface-500">
                        <Clock className="h-3.5 w-3.5" />
                        {restaurant.avgDeliveryTime} min
                      </span>
                      <span className="flex items-center gap-1 text-xs text-surface-500">
                        <Truck className="h-3.5 w-3.5" />
                        Rs. {restaurant.deliveryFee}
                      </span>
                      <span className="text-xs text-surface-400 ml-auto">
                        Min. Rs. {restaurant.minOrder}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    page === i + 1
                      ? "bg-primary-500 text-white"
                      : "border border-surface-200 bg-white text-surface-600 hover:bg-surface-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
