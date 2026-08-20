import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  ChefHat,
  ClipboardList,
  UtensilsCrossed,
  BarChart3,
  Settings,
  Star,
  LogOut,
  Home,
  FolderOpen,
} from "lucide-react";

const navItems = [
  { href: "/restaurant/dashboard", label: "Dashboard", icon: Home },
  { href: "/restaurant/dashboard/orders", label: "Orders", icon: ClipboardList },
  { href: "/restaurant/dashboard/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/restaurant/dashboard/categories", label: "Categories", icon: FolderOpen },
  { href: "/restaurant/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/restaurant/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/restaurant/dashboard/settings", label: "Settings", icon: Settings },
];

export default async function RestaurantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id || (session.user.role !== "RESTAURANT_OWNER" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, name: true, slug: true, isApproved: true },
  });

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-surface-200">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-surface-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
              <ChefHat className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gradient font-[family-name:var(--font-outfit)]">
              KhajaGhar
            </span>
          </Link>
        </div>

        {/* Restaurant Info */}
        <div className="px-5 py-3 border-b border-surface-100">
          <p className="text-sm font-semibold truncate">{restaurant?.name || "My Restaurant"}</p>
          <p className="text-xs text-surface-500">
            {restaurant?.isApproved ? "✅ Approved" : "⏳ Pending Approval"}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-surface-600 hover:bg-surface-100 hover:text-surface-900 transition-colors"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-surface-100">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-surface-500 hover:text-surface-700">
            <LogOut className="h-4 w-4" />
            Back to Website
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-surface-200">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
              <ChefHat className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm">{restaurant?.name || "Dashboard"}</span>
          </Link>
        </header>

        {/* Mobile Nav */}
        <nav className="md:hidden flex gap-1 px-3 py-2 bg-white border-b border-surface-100 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs text-surface-600 hover:bg-surface-100">
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Not approved warning */}
        {restaurant && !restaurant.isApproved && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700">
            ⏳ Your restaurant is pending admin approval. You can set up your menu in the meantime.
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
