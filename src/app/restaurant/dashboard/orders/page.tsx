"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Package,
  ChefHat,
  UtensilsCrossed,
  Truck,
  XCircle,
  Loader2,
  Search,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  user: { name: string; phone: string | null };
  deliveryAddress: { street: string; city: string };
  items: Array<{ name: string; quantity: number; selectedAddons: Array<{ name: string }> | null }>;
  payment: { method: string; status: string } | null;
}

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export default function RestaurantOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ACTIVE"); // ACTIVE or ALL
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/restaurant/orders"); // We need to create this API
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update status");
        return;
      }
      toast.success(data.message);
      await fetchOrders();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const activeOrders = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
  const pastOrders = orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status));
  
  const displayOrders = filter === "ACTIVE" ? activeOrders : orders;

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-outfit)]">Orders Management</h1>
          <p className="text-sm text-surface-500 mt-1">
            {activeOrders.length} active orders requiring attention
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-surface-200">
        <button
          onClick={() => setFilter("ACTIVE")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "ACTIVE" ? "border-primary-500 text-primary-600" : "border-transparent text-surface-500 hover:text-surface-900"
          }`}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "ALL" ? "border-primary-500 text-primary-600" : "border-transparent text-surface-500 hover:text-surface-900"
          }`}
        >
          All Orders ({orders.length})
        </button>
      </div>

      <div className="space-y-4">
        {displayOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-surface-200">
            <Package className="h-12 w-12 mx-auto text-surface-300 mb-3" />
            <h3 className="text-sm font-semibold">No {filter === "ACTIVE" ? "active" : ""} orders</h3>
            <p className="text-xs text-surface-500">New orders will appear here automatically</p>
          </div>
        ) : (
          displayOrders.map((order) => (
            <div key={order.id} className="rounded-xl bg-white border border-surface-200 shadow-sm p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold">#{order.orderNumber}</span>
                    <span className="text-xs text-surface-500">{formatDateTime(order.createdAt)}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      order.payment?.method === "CASH_ON_DELIVERY" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                    }`}>
                      {order.payment?.method === "CASH_ON_DELIVERY" ? "COD" : "PAID"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-xs font-semibold text-surface-500 mb-1">Customer</h4>
                      <p className="text-sm font-medium">{order.user.name}</p>
                      <p className="text-xs">{order.user.phone}</p>
                      <p className="text-xs text-surface-500">{order.deliveryAddress.street}, {order.deliveryAddress.city}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-surface-500 mb-1">Items</h4>
                      <ul className="text-sm space-y-1">
                        {order.items.map((item, i) => (
                          <li key={i}>
                            {item.quantity}x {item.name}
                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                              <span className="text-[10px] text-surface-500 ml-1">
                                (+{item.selectedAddons.map(a => a.name).join(",")})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm font-bold mt-2">Total: Rs. {order.total.toFixed(0)}</p>
                    </div>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="md:w-64 shrink-0 bg-surface-50 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-surface-500 mb-2">Update Status</h4>
                  <div className="flex flex-col gap-2">
                    {order.status === "PENDING" && (
                      <>
                        <button onClick={() => updateStatus(order.id, "CONFIRMED")} disabled={updating === order.id}
                          className="w-full flex items-center justify-center gap-2 rounded bg-blue-500 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
                          {updating === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Accept Order
                        </button>
                        <button onClick={() => updateStatus(order.id, "CANCELLED")} disabled={updating === order.id}
                          className="w-full text-xs text-red-500 hover:text-red-700 py-1">
                          Reject Order
                        </button>
                      </>
                    )}
                    
                    {order.status === "CONFIRMED" && (
                      <button onClick={() => updateStatus(order.id, "PREPARING")} disabled={updating === order.id}
                        className="w-full flex items-center justify-center gap-2 rounded bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600 disabled:opacity-50">
                        {updating === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChefHat className="h-3 w-3" />} Start Preparing
                      </button>
                    )}

                    {order.status === "PREPARING" && (
                      <button onClick={() => updateStatus(order.id, "READY_FOR_PICKUP")} disabled={updating === order.id}
                        className="w-full flex items-center justify-center gap-2 rounded bg-purple-500 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-600 disabled:opacity-50">
                        {updating === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UtensilsCrossed className="h-3 w-3" />} Mark Ready
                      </button>
                    )}

                    {order.status === "READY_FOR_PICKUP" && (
                      <button onClick={() => updateStatus(order.id, "OUT_FOR_DELIVERY")} disabled={updating === order.id}
                        className="w-full flex items-center justify-center gap-2 rounded bg-cyan-500 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-600 disabled:opacity-50">
                        {updating === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />} Dispatch
                      </button>
                    )}

                    {order.status === "OUT_FOR_DELIVERY" && (
                      <button onClick={() => updateStatus(order.id, "DELIVERED")} disabled={updating === order.id}
                        className="w-full flex items-center justify-center gap-2 rounded bg-green-500 px-3 py-2 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50">
                        {updating === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Mark Delivered
                      </button>
                    )}

                    {["DELIVERED", "CANCELLED"].includes(order.status) && (
                      <div className={`text-center py-2 text-xs font-bold rounded ${
                        order.status === "DELIVERED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {order.status}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
