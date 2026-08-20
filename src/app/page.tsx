import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Search,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  Truck,
  ShieldCheck,
  Zap,
  ChefHat,
  UtensilsCrossed,
  Pizza,
  Beef,
  Salad,
  Coffee,
  IceCreamCone,
  Soup,
  Sandwich,
} from "lucide-react";
import { prisma } from "@/lib/db";

// Cuisine icons mapping
const cuisineData = [
  { name: "Momo", icon: Soup, color: "from-red-500 to-orange-500", slug: "momo" },
  { name: "Pizza", icon: Pizza, color: "from-amber-500 to-yellow-500", slug: "pizza" },
  { name: "Burger", icon: Beef, color: "from-emerald-500 to-green-500", slug: "burger" },
  { name: "Thakali", icon: UtensilsCrossed, color: "from-purple-500 to-pink-500", slug: "thakali" },
  { name: "Biryani", icon: UtensilsCrossed, color: "from-orange-500 to-red-500", slug: "biryani" },
  { name: "Chinese", icon: Soup, color: "from-rose-500 to-red-500", slug: "chinese" },
  { name: "Indian", icon: Salad, color: "from-yellow-500 to-amber-500", slug: "indian" },
  { name: "Cafe", icon: Coffee, color: "from-sky-500 to-blue-500", slug: "cafe" },
  { name: "Desserts", icon: IceCreamCone, color: "from-pink-500 to-rose-500", slug: "desserts" },
  { name: "Snacks", icon: Sandwich, color: "from-teal-500 to-emerald-500", slug: "snacks" },
];

export default async function HomePage() {
  // Fetch featured restaurants from database
  let featuredRestaurants: Array<{
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
  }> = [];

  let popularFoodItems: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    discountPrice: number | null;
    image: string | null;
    restaurant: { name: string; slug: string };
  }> = [];

  try {
    featuredRestaurants = await prisma.restaurant.findMany({
      where: { isActive: true, isApproved: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        cuisine: true,
        logo: true,
        banner: true,
        rating: true,
        reviewCount: true,
        avgDeliveryTime: true,
        deliveryFee: true,
        minOrder: true,
        isActive: true,
      },
      orderBy: { rating: "desc" },
      take: 8,
    });

    popularFoodItems = await prisma.foodItem.findMany({
      where: { isAvailable: true, restaurant: { isActive: true, isApproved: true } },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        discountPrice: true,
        image: true,
        restaurant: { select: { name: true, slug: true } },
      },
      orderBy: { price: "asc" },
      take: 8,
    });
  } catch {
    // DB not connected yet — show empty state
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* ================================================================
            HERO SECTION
            ================================================================ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary-600/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary-500/5 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-32">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 border border-primary-500/20 px-4 py-1.5 mb-6">
                <Zap className="h-3.5 w-3.5 text-primary-400" />
                <span className="text-xs font-medium text-primary-300">
                  Delivering happiness since 2020
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-[family-name:var(--font-outfit)] text-white leading-[1.1] mb-6">
                Delicious food,
                <br />
                <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                  delivered fast
                </span>
              </h1>

              <p className="text-base md:text-lg text-surface-400 mb-8 max-w-xl mx-auto">
                Order from the best restaurants in Kathmandu Valley. 
                Fresh momo, pizza, biryani & more — at your doorstep in minutes.
              </p>

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch gap-3 max-w-lg mx-auto">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Enter delivery address..."
                    className="w-full rounded-xl bg-white/10 border border-white/10 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-surface-500 outline-none focus:bg-white/15 focus:border-primary-500/50 transition-all"
                  />
                </div>
                <Link
                  href="/restaurants"
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/25 shrink-0"
                >
                  <Search className="h-4 w-4" />
                  Find Food
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-12 max-w-md mx-auto">
                {[
                  { value: "10+", label: "Restaurants" },
                  { value: "50+", label: "Food Items" },
                  { value: "30min", label: "Avg. Delivery" },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl font-bold text-white">{value}</div>
                    <div className="text-xs text-surface-400">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            POPULAR CUISINES
            ================================================================ */}
        <section className="py-12 md:py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)]">
                What are you craving?
              </h2>
              <p className="text-surface-500 mt-2">
                Explore by cuisine
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {cuisineData.map((cuisine) => {
                const Icon = cuisine.icon;
                return (
                  <Link
                    key={cuisine.slug}
                    href={`/restaurants?cuisine=${cuisine.slug}`}
                    className="group flex flex-col items-center gap-3 rounded-2xl bg-surface-50 p-5 hover:bg-white hover:shadow-xl hover:shadow-surface-200/50 transition-all duration-300 card-hover"
                  >
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cuisine.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-sm font-medium text-surface-700 group-hover:text-surface-900">
                      {cuisine.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================
            FEATURED RESTAURANTS
            ================================================================ */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)]">
                  Featured Restaurants
                </h2>
                <p className="text-surface-500 mt-1">
                  Top rated places in your area
                </p>
              </div>
              <Link
                href="/restaurants"
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {featuredRestaurants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {featuredRestaurants.map((restaurant) => (
                  <Link
                    key={restaurant.id}
                    href={`/restaurants/${restaurant.slug}`}
                    className="group rounded-2xl bg-white border border-surface-200/60 overflow-hidden card-hover"
                  >
                    {/* Image */}
                    <div className="relative h-40 bg-gradient-to-br from-primary-100 to-primary-50 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ChefHat className="h-12 w-12 text-primary-300" />
                      </div>
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2 py-1">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-semibold">
                            {restaurant.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors truncate">
                        {restaurant.name}
                      </h3>
                      <p className="text-xs text-surface-500 mt-1 truncate">
                        {restaurant.cuisine.join(" • ")}
                      </p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-surface-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {restaurant.avgDeliveryTime} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5" />
                          Rs. {restaurant.deliveryFee}
                        </span>
                        <span className="text-surface-400">
                          Min. Rs. {restaurant.minOrder}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white border border-surface-200/60 overflow-hidden"
                  >
                    <div className="h-40 skeleton" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 w-3/4 skeleton rounded" />
                      <div className="h-3 w-1/2 skeleton rounded" />
                      <div className="h-3 w-2/3 skeleton rounded mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 text-center sm:hidden">
              <Link
                href="/restaurants"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600"
              >
                View all restaurants
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ================================================================
            POPULAR FOOD ITEMS
            ================================================================ */}
        {popularFoodItems.length > 0 && (
          <section className="py-12 md:py-16 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)]">
                    Popular Items
                  </h2>
                  <p className="text-surface-500 mt-1">
                    Most ordered food near you
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {popularFoodItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/restaurants/${item.restaurant.slug}`}
                    className="group rounded-2xl bg-surface-50 border border-surface-200/60 overflow-hidden card-hover"
                  >
                    <div className="relative h-36 bg-gradient-to-br from-amber-100 to-orange-50 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <UtensilsCrossed className="h-10 w-10 text-amber-300" />
                      </div>
                      {item.discountPrice && (
                        <div className="absolute top-3 left-3">
                          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            SALE
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-surface-500 mt-0.5 truncate">
                        {item.restaurant.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {item.discountPrice ? (
                          <>
                            <span className="text-sm font-bold text-primary-600">
                              Rs. {item.discountPrice}
                            </span>
                            <span className="text-xs text-surface-400 line-through">
                              Rs. {item.price}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-surface-800">
                            Rs. {item.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            SPECIAL OFFERS
            ================================================================ */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)] mb-8">
              Special Offers
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Offer 1 */}
              <div className="relative rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-6 md:p-8 overflow-hidden">
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
                <div className="absolute -right-4 -bottom-4 h-28 w-28 rounded-full bg-white/5" />
                <div className="relative">
                  <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white mb-3">
                    New Users
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    20% OFF
                  </h3>
                  <p className="text-primary-100 text-sm mb-4">
                    On your first order. Use code{" "}
                    <span className="font-bold text-white">WELCOME20</span>
                  </p>
                  <Link
                    href="/restaurants"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary-600 hover:bg-surface-50 transition-colors"
                  >
                    Order Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Offer 2 */}
              <div className="relative rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-6 md:p-8 overflow-hidden">
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
                <div className="absolute -right-4 -bottom-4 h-28 w-28 rounded-full bg-white/5" />
                <div className="relative">
                  <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white mb-3">
                    Free Delivery
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Free Delivery
                  </h3>
                  <p className="text-emerald-100 text-sm mb-4">
                    On orders above Rs. 500. Use code{" "}
                    <span className="font-bold text-white">FREEDELIVERY</span>
                  </p>
                  <Link
                    href="/restaurants"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-surface-50 transition-colors"
                  >
                    Order Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            HOW IT WORKS
            ================================================================ */}
        <section className="py-12 md:py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)]">
                How It Works
              </h2>
              <p className="text-surface-500 mt-2">
                Get your food in 3 simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  icon: Search,
                  title: "Find Restaurant",
                  description:
                    "Browse restaurants near you, filter by cuisine, rating, or delivery time.",
                  color: "from-blue-500 to-indigo-500",
                },
                {
                  step: "02",
                  icon: UtensilsCrossed,
                  title: "Choose Food",
                  description:
                    "Select your favorite dishes, customize with add-ons, and add to cart.",
                  color: "from-primary-500 to-amber-500",
                },
                {
                  step: "03",
                  icon: Truck,
                  title: "Fast Delivery",
                  description:
                    "Track your order in real-time. Fresh food delivered to your doorstep.",
                  color: "from-emerald-500 to-green-500",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="text-center group">
                    <div className="relative inline-flex mb-5">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface-900 text-[10px] font-bold text-white">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-surface-500 max-w-xs mx-auto">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================
            TESTIMONIALS
            ================================================================ */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)]">
                What Our Customers Say
              </h2>
              <p className="text-surface-500 mt-2">
                Trusted by thousands of food lovers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  name: "Aarav Shrestha",
                  review:
                    "Best food delivery app in Kathmandu! The momos from Momo House arrived hot and fresh. Will order again!",
                  rating: 5,
                  initial: "AS",
                },
                {
                  name: "Priya Maharjan",
                  review:
                    "Love the variety of restaurants. The Thakali dal bhat set was exactly like home cooking. Fast delivery too!",
                  rating: 5,
                  initial: "PM",
                },
                {
                  name: "Bikash Tamang",
                  review:
                    "Ordered pizza for a party — came within 30 minutes, hot and delicious. Great prices with the coupon codes!",
                  rating: 4,
                  initial: "BT",
                },
              ].map((testimonial) => (
                <div
                  key={testimonial.name}
                  className="rounded-2xl bg-white border border-surface-200/60 p-6 card-hover"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < testimonial.rating
                            ? "text-amber-500 fill-amber-500"
                            : "text-surface-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-surface-600 mb-4 leading-relaxed">
                    &ldquo;{testimonial.review}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-xs font-bold text-white">
                      {testimonial.initial}
                    </div>
                    <span className="text-sm font-medium text-surface-700">
                      {testimonial.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================
            CTA SECTION
            ================================================================ */}
        <section className="py-12 md:py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-br from-surface-900 to-surface-800 p-8 md:p-12 text-center overflow-hidden relative">
              <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary-500/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary-600/10 blur-3xl" />
              <div className="relative">
                <h2 className="text-2xl md:text-3xl font-bold text-white font-[family-name:var(--font-outfit)] mb-3">
                  Hungry? Order Now!
                </h2>
                <p className="text-surface-400 mb-6 max-w-md mx-auto">
                  Choose from 10+ restaurants, 50+ dishes. Your next meal is
                  just a few clicks away.
                </p>
                <Link
                  href="/restaurants"
                  className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-7 py-3 text-sm font-semibold text-white hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/25"
                >
                  Browse Restaurants
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            TRUST BADGES
            ================================================================ */}
        <section className="py-8 md:py-12 border-t border-surface-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Truck, label: "Fast Delivery", sub: "30 min average" },
                { icon: ShieldCheck, label: "Secure Payment", sub: "100% safe checkout" },
                { icon: Star, label: "Best Quality", sub: "Top rated restaurants" },
                { icon: Zap, label: "Live Tracking", sub: "Real-time updates" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 shrink-0">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-surface-800">
                      {label}
                    </div>
                    <div className="text-xs text-surface-500">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
