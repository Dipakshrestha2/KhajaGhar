import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  ShieldCheck,
  Store,
  Users,
  Settings,
  AlertCircle,
  Home,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch pending restaurants
  const pendingRestaurants = await prisma.restaurant.findMany({
    where: { isApproved: false },
    include: { owner: { select: { name: true, email: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Fetch stats
  const [totalUsers, totalRestaurants, totalOrders] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.restaurant.count({ where: { isApproved: true } }),
    prisma.order.count(),
  ]);

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-surface-900 text-white">
        <div className="px-5 py-6 border-b border-surface-800">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold font-[family-name:var(--font-outfit)]">Admin Portal</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 rounded-lg bg-surface-800 px-3 py-2.5 text-sm font-medium text-white">
            <Home className="h-4 w-4 text-primary-400" /> Dashboard
          </Link>
          <Link href="/admin/restaurants" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-400 hover:text-white hover:bg-surface-800 transition-colors">
            <Store className="h-4 w-4" /> Restaurants
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-400 hover:text-white hover:bg-surface-800 transition-colors">
            <Users className="h-4 w-4" /> Users
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-400 hover:text-white hover:bg-surface-800 transition-colors">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-surface-500 mt-1">Platform overview and pending approvals</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Total Customers", value: totalUsers, icon: Users, color: "text-blue-600 bg-blue-100" },
            { label: "Active Restaurants", value: totalRestaurants, icon: Store, color: "text-emerald-600 bg-emerald-100" },
            { label: "Total Orders", value: totalOrders, icon: TrendingUp, color: "text-purple-600 bg-purple-100" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white border border-surface-200 shadow-sm p-5 flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-500">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Approvals */}
        <div className="rounded-xl bg-white border border-surface-200 shadow-sm overflow-hidden">
          <div className="border-b border-surface-200 px-6 py-4 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Pending Approvals
            </h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              {pendingRestaurants.length} action{pendingRestaurants.length !== 1 ? 's' : ''} needed
            </span>
          </div>

          <div className="divide-y divide-surface-100">
            {pendingRestaurants.length === 0 ? (
              <div className="px-6 py-12 text-center text-surface-500">
                <CheckCircle className="h-10 w-10 mx-auto text-green-500 mb-3" />
                <p>All caught up! No pending restaurants.</p>
              </div>
            ) : (
              pendingRestaurants.map((restaurant) => (
                <div key={restaurant.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                    <p className="text-sm text-surface-600 mt-1">
                      Owner: {restaurant.owner.name} • {restaurant.owner.email} • {restaurant.owner.phone || "No phone"}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-surface-500 bg-surface-100 px-2 py-1 rounded">
                        ID: {restaurant.id}
                      </span>
                      <span className="text-xs text-surface-500">
                        Requested: {new Date(restaurant.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={async () => {
                      "use server";
                      await prisma.restaurant.update({
                        where: { id: restaurant.id },
                        data: { isApproved: true, isActive: true }
                      });
                    }}>
                      <button className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600">
                        <CheckCircle className="h-4 w-4" /> Approve
                      </button>
                    </form>
                    <button className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
