import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Star,
  Clock,
  ArrowRight,
  Package,
} from "lucide-react";

export default async function RestaurantDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, name: true, rating: true, reviewCount: true },
  });

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">No Restaurant Found</h2>
        <p className="text-surface-500 mb-4">Register your restaurant to get started.</p>
        <Link href="/register?role=restaurant" className="rounded-full bg-primary-500 px-6 py-2 text-sm font-medium text-white">
          Register Restaurant
        </Link>
      </div>
    );
  }

  // Dashboard stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayOrders, totalOrders, pendingOrders, totalRevenue, recentOrders] = await Promise.all([
    prisma.order.count({
      where: { restaurantId: restaurant.id, createdAt: { gte: today } },
    }),
    prisma.order.count({ where: { restaurantId: restaurant.id } }),
    prisma.order.count({
      where: { restaurantId: restaurant.id, status: { in: ["PENDING", "CONFIRMED", "PREPARING"] } },
    }),
    prisma.order.aggregate({
      where: { restaurantId: restaurant.id, status: "DELIVERED" },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: { restaurantId: restaurant.id },
      include: {
        items: { select: { name: true, quantity: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Today's Orders", value: todayOrders, icon: ShoppingCart, color: "text-blue-600 bg-blue-100" },
    { label: "Total Orders", value: totalOrders, icon: Package, color: "text-emerald-600 bg-emerald-100" },
    { label: "Pending", value: pendingOrders, icon: Clock, color: "text-amber-600 bg-amber-100" },
    { label: "Revenue", value: `Rs. ${(totalRevenue._sum.total || 0).toFixed(0)}`, icon: DollarSign, color: "text-primary-600 bg-primary-100" },
    { label: "Rating", value: restaurant.rating.toFixed(1), icon: Star, color: "text-yellow-600 bg-yellow-100" },
    { label: "Reviews", value: restaurant.reviewCount, icon: TrendingUp, color: "text-purple-600 bg-purple-100" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">
          Welcome back! 👋
        </h1>
        <p className="text-surface-500 text-sm mt-1">
          Here&apos;s what&apos;s happening with {restaurant.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl bg-white border border-surface-200/60 p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color} mb-2`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-surface-500">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl bg-white border border-surface-200/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link href="/restaurant/dashboard/orders" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-surface-500 text-center py-6">No orders yet</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <Link key={order.id} href={`/restaurant/dashboard/orders?orderId=${order.id}`}
                className="flex items-center justify-between rounded-lg bg-surface-50 px-4 py-3 hover:bg-surface-100 transition-colors">
                <div>
                  <div className="text-sm font-medium">#{order.orderNumber}</div>
                  <div className="text-xs text-surface-500">
                    {order.user.name} • {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">Rs. {order.total.toFixed(0)}</div>
                  <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                    order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                    order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
