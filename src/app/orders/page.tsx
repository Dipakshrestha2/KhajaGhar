"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ClipboardList, ArrowRight, Loader2, ChefHat } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  restaurant: { name: string; slug: string };
  items: Array<{ name: string; quantity: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-indigo-100 text-indigo-700",
  READY_FOR_PICKUP: "bg-purple-100 text-purple-700",
  OUT_FOR_DELIVERY: "bg-cyan-100 text-cyan-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      params.set("limit", "20");
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      console.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)] mb-6">Your Orders</h1>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
            {["", "PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map((s) => (
              <button key={s} onClick={() => { setFilter(s); setLoading(true); }}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  filter === s ? "bg-primary-500 text-white" : "bg-white border border-surface-200 text-surface-600 hover:bg-surface-50"
                }`}>
                {s ? s.replace(/_/g, " ") : "All"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="h-16 w-16 mx-auto text-surface-300 mb-4" />
              <h3 className="text-lg font-semibold text-surface-700 mb-2">No orders yet</h3>
              <p className="text-sm text-surface-500 mb-4">Start ordering to see your order history</p>
              <Link href="/restaurants" className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600">
                Browse Restaurants <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`}
                  className="flex items-center gap-4 rounded-xl bg-white border border-surface-200/60 p-4 hover:shadow-md transition-shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 shrink-0">
                    <ChefHat className="h-6 w-6 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-sm truncate">{order.restaurant.name}</h3>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[order.status] || ""}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5">
                      #{order.orderNumber} • {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-surface-400">{formatDateTime(order.createdAt)}</span>
                      <span className="text-sm font-bold text-primary-600">Rs. {order.total.toFixed(0)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
