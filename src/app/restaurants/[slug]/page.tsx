import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RestaurantMenu from "./RestaurantMenu";
import {
  Star,
  Clock,
  Truck,
  MapPin,
  Phone,
  ChefHat,
} from "lucide-react";
import { formatTime, isRestaurantOpen } from "@/lib/utils";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { name: true, description: true, cuisine: true },
  });

  if (!restaurant) return { title: "Restaurant Not Found" };

  return {
    title: restaurant.name,
    description: restaurant.description || `Order from ${restaurant.name}`,
    openGraph: {
      title: restaurant.name,
      description: restaurant.description || `Order from ${restaurant.name}`,
    },
  };
}

export default async function RestaurantPage({ params }: PageProps) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      address: true,
      hours: { orderBy: { dayOfWeek: "asc" } },
      foodItems: {
        where: { isAvailable: true },
        include: {
          category: true,
          addons: true,
        },
        orderBy: { name: "asc" },
      },
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!restaurant) notFound();

  const isOpen = isRestaurantOpen(restaurant.hours);

  // Group food items by category
  const categories = new Map<string, typeof restaurant.foodItems>();
  for (const item of restaurant.foodItems) {
    const catName = item.category.name;
    if (!categories.has(catName)) {
      categories.set(catName, []);
    }
    categories.get(catName)!.push(item);
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      <Header />

      <main className="flex-1">
        {/* Banner */}
        <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary-600 to-primary-800 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <ChefHat className="h-20 w-20 text-white/20" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Restaurant Info */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="rounded-2xl bg-white border border-surface-200/60 shadow-lg p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              {/* Logo */}
              <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shrink-0">
                <ChefHat className="h-8 w-8 md:h-10 md:w-10 text-white" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-outfit)]">
                      {restaurant.name}
                    </h1>
                    <p className="text-sm text-surface-500 mt-0.5">
                      {restaurant.cuisine.join(" • ")}
                    </p>
                  </div>
                  <div
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      isOpen
                        ? "bg-success-50 text-success-600"
                        : "bg-error-50 text-error-600"
                    }`}
                  >
                    {isOpen ? "Open Now" : "Closed"}
                  </div>
                </div>

                {restaurant.description && (
                  <p className="text-sm text-surface-500 mt-2 line-clamp-2">
                    {restaurant.description}
                  </p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
                  <span className="flex items-center gap-1.5 text-sm">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="font-semibold">{restaurant.rating.toFixed(1)}</span>
                    <span className="text-surface-400">
                      ({restaurant.reviewCount} reviews)
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-surface-500">
                    <Clock className="h-4 w-4" />
                    {restaurant.avgDeliveryTime} min
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-surface-500">
                    <Truck className="h-4 w-4" />
                    Rs. {restaurant.deliveryFee} delivery
                  </span>
                  {restaurant.address && (
                    <span className="flex items-center gap-1.5 text-sm text-surface-500">
                      <MapPin className="h-4 w-4" />
                      {restaurant.address.street}, {restaurant.address.city}
                    </span>
                  )}
                  {restaurant.phone && (
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600"
                    >
                      <Phone className="h-4 w-4" />
                      {restaurant.phone}
                    </a>
                  )}
                </div>

                {/* Min order */}
                {restaurant.minOrder > 0 && (
                  <p className="text-xs text-surface-400 mt-2">
                    Minimum order: Rs. {restaurant.minOrder}
                  </p>
                )}
              </div>
            </div>

            {/* Hours */}
            <details className="mt-4 pt-4 border-t border-surface-100">
              <summary className="text-sm font-medium text-surface-600 cursor-pointer hover:text-surface-900">
                Opening Hours
              </summary>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                {restaurant.hours.map((h) => (
                  <div
                    key={h.dayOfWeek}
                    className="rounded-lg bg-surface-50 px-3 py-2"
                  >
                    <div className="text-xs font-medium text-surface-700">
                      {h.dayOfWeek.charAt(0) + h.dayOfWeek.slice(1).toLowerCase()}
                    </div>
                    <div className="text-xs text-surface-500">
                      {h.isClosed
                        ? "Closed"
                        : `${formatTime(h.openTime)} - ${formatTime(h.closeTime)}`}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>

        {/* Menu */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <RestaurantMenu
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            categories={Object.fromEntries(categories)}
            isOpen={isOpen}
          />
        </div>

        {/* Reviews */}
        {restaurant.reviews.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
            <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {restaurant.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl bg-white border border-surface-200/60 p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
                      {review.user.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{review.user.name}</div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating
                                ? "text-amber-500 fill-amber-500"
                                : "text-surface-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-surface-600">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
