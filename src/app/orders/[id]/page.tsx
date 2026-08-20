"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  CreditCard,
  ArrowLeft,
  Loader2,
  ChefHat,
  Truck,
  Package,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  discount: number;
  total: number;
  notes: string | null;
  deliveryAddress: { fullName: string; street: string; city: string; phone: string };
  estimatedDelivery: string | null;
  createdAt: string;
  restaurant: { id: string; name: string; slug: string; phone: string | null };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
    selectedAddons: Array<{ name: string; price: number }> | null;
    specialInstructions: string | null;
  }>;
  payment: { method: string; status: string; transactionId: string | null } | null;
  statusHistory: Array<{ status: string; createdAt: string; note: string | null }>;
  review: { id: string } | null;
}

const STATUS_STEPS = [
  { status: "PENDING", label: "Order Placed", icon: Package },
  { status: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
  { status: "PREPARING", label: "Preparing", icon: ChefHat },
  { status: "READY_FOR_PICKUP", label: "Ready", icon: UtensilsCrossed },
  { status: "OUT_FOR_DELIVERY", label: "On the Way", icon: Truck },
  { status: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (res.ok) setOrder(data.order);
    } catch {
      console.error("Failed to fetch order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    // Poll for updates every 15 seconds
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Order not found</h2>
            <Link href="/orders" className="text-primary-600">View all orders</Link>
          </div>
        </main>
      </div>
    );
  }

  const isCancelled = order.status === "CANCELLED";
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.status === order.status);

  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {/* Back */}
          <Link href="/orders" className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </Link>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Order #{order.orderNumber}</h1>
              <p className="text-sm text-surface-500">{formatDateTime(order.createdAt)}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isCancelled ? "bg-red-100 text-red-700" :
              order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
              "bg-amber-100 text-amber-700"
            }`}>
              {order.status.replace(/_/g, " ")}
            </span>
          </div>

          {/* Order Timeline */}
          {!isCancelled && (
            <div className="rounded-2xl bg-white border border-surface-200/60 p-5 mb-5">
              <h2 className="text-sm font-semibold mb-4">Order Status</h2>
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const isCompleted = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div key={step.status} className="flex flex-col items-center flex-1">
                      <div className="relative">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                          isCompleted
                            ? isCurrent ? "bg-primary-500 text-white ring-4 ring-primary-100" : "bg-primary-500 text-white"
                            : "bg-surface-100 text-surface-400"
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        {isCurrent && !["DELIVERED"].includes(step.status) && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary-500 animate-pulse" />
                        )}
                      </div>
                      <span className={`text-[10px] mt-1.5 text-center ${isCompleted ? "text-primary-600 font-medium" : "text-surface-400"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-5 mb-5 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-700">Order Cancelled</h3>
                <p className="text-sm text-red-600">This order has been cancelled.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Items */}
            <div className="rounded-2xl bg-white border border-surface-200/60 p-5">
              <h2 className="text-sm font-semibold mb-3">
                <Link href={`/restaurants/${order.restaurant.slug}`} className="hover:text-primary-600">
                  {order.restaurant.name}
                </Link>
              </h2>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span className="text-surface-500">{item.quantity}× </span>
                      <span>{item.name}</span>
                      {item.selectedAddons && Array.isArray(item.selectedAddons) && item.selectedAddons.length > 0 && (
                        <p className="text-[10px] text-surface-400 ml-4">
                          + {item.selectedAddons.map((a) => a.name).join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="font-medium">Rs. {item.subtotal.toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <hr className="my-3 border-surface-100" />
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-surface-500">Subtotal</span><span>Rs. {order.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">Delivery</span><span>Rs. {order.deliveryFee.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">Service Fee</span><span>Rs. {order.serviceFee.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">Tax</span><span>Rs. {order.tax.toFixed(2)}</span></div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount</span><span>-Rs. {order.discount.toFixed(2)}</span></div>
                )}
                <hr className="border-surface-100" />
                <div className="flex justify-between font-bold text-sm pt-1">
                  <span>Total</span>
                  <span className="text-primary-600">Rs. {order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              {/* Delivery */}
              <div className="rounded-2xl bg-white border border-surface-200/60 p-5">
                <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Delivery Address
                </h2>
                <p className="text-sm text-surface-700">{order.deliveryAddress.fullName}</p>
                <p className="text-xs text-surface-500">{order.deliveryAddress.street}, {order.deliveryAddress.city}</p>
                <p className="text-xs text-surface-400">{order.deliveryAddress.phone}</p>
              </div>

              {/* Payment */}
              <div className="rounded-2xl bg-white border border-surface-200/60 p-5">
                <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Payment
                </h2>
                <p className="text-sm text-surface-700">
                  {order.payment?.method === "CASH_ON_DELIVERY" ? "Cash on Delivery" :
                   order.payment?.method === "DEMO" ? "Online (Demo)" : order.payment?.method}
                </p>
                <p className="text-xs text-surface-500">
                  Status: {order.payment?.status || "N/A"}
                </p>
              </div>

              {/* Timeline */}
              <div className="rounded-2xl bg-white border border-surface-200/60 p-5">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Timeline
                </h2>
                <div className="space-y-3">
                  {order.statusHistory.map((entry, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <Circle className="h-3 w-3 text-primary-500 fill-primary-500" />
                        {i < order.statusHistory.length - 1 && (
                          <div className="w-0.5 flex-1 bg-surface-200 mt-1" />
                        )}
                      </div>
                      <div className="pb-3">
                        <div className="text-xs font-medium">{entry.status.replace(/_/g, " ")}</div>
                        <div className="text-[10px] text-surface-400">{formatDateTime(entry.createdAt)}</div>
                        {entry.note && <div className="text-[10px] text-surface-500">{entry.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
