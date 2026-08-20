"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ChefHat,
  Tag,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  id: string;
  foodItem: {
    id: string;
    name: string;
    price: number;
    discountPrice: number | null;
    image: string | null;
    addons: Array<{ id: string; name: string; price: number }>;
  };
  quantity: number;
  selectedAddons: string[];
  specialInstructions: string | null;
  unitPrice: number;
  addonTotal: number;
  itemTotal: number;
}

interface CartData {
  cart: {
    id: string;
    restaurantId: string;
    restaurant: { id: string; name: string; slug: string; minOrder: number; deliveryFee: number };
  } | null;
  items: CartItem[];
  subtotal: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.status === 401) {
        setCartData(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCartData(data);
    } catch {
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingItem(cartItemId);
    try {
      await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId, quantity: newQuantity }),
      });
      await fetchCart();
    } catch {
      toast.error("Failed to update quantity");
    } finally {
      setUpdatingItem(null);
    }
  };

  const removeItem = async (cartItemId: string) => {
    setUpdatingItem(cartItemId);
    try {
      await fetch(`/api/cart?itemId=${cartItemId}`, { method: "DELETE" });
      toast.success("Item removed");
      await fetchCart();
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setUpdatingItem(null);
    }
  };

  const clearCart = async () => {
    try {
      await fetch("/api/cart", { method: "DELETE" });
      toast.success("Cart cleared");
      await fetchCart();
    } catch {
      toast.error("Failed to clear cart");
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal: cartData?.subtotal || 0 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid coupon");
        return;
      }
      setCouponApplied({ code: data.code, discount: data.discount });
      toast.success(`Coupon applied! Rs. ${data.discount} off`);
    } catch {
      toast.error("Failed to apply coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const deliveryFee = cartData?.cart?.restaurant?.deliveryFee || 0;
  const subtotal = cartData?.subtotal || 0;
  const serviceFee = Math.round(subtotal * 0.05 * 100) / 100;
  const tax = Math.round(subtotal * 0.13 * 100) / 100;
  const discount = couponApplied?.discount || 0;
  const total = Math.max(0, subtotal + deliveryFee + serviceFee + tax - discount);

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

  const isEmpty = !cartData?.cart || !cartData.items || cartData.items.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)] mb-6">
            Your Cart
          </h1>

          {isEmpty ? (
            <div className="text-center py-16">
              <ShoppingCart className="h-16 w-16 mx-auto text-surface-300 mb-4" />
              <h3 className="text-lg font-semibold text-surface-700 mb-2">
                Your cart is empty
              </h3>
              <p className="text-sm text-surface-500 mb-6">
                Add some delicious food to get started!
              </p>
              <Link
                href="/restaurants"
                className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
              >
                Browse Restaurants
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3">
                {/* Restaurant Header */}
                <div className="flex items-center justify-between rounded-xl bg-white border border-surface-200/60 p-4">
                  <Link
                    href={`/restaurants/${cartData.cart!.restaurant.slug}`}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                      <ChefHat className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">
                        {cartData.cart!.restaurant.name}
                      </h3>
                      <p className="text-xs text-surface-500">
                        {cartData.items.length} item{cartData.items.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Clear Cart
                  </button>
                </div>

                {/* Items */}
                {cartData.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-xl bg-white border border-surface-200/60 p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-surface-900">
                        {item.foodItem.name}
                      </h4>
                      {item.selectedAddons.length > 0 && (
                        <p className="text-xs text-surface-500 mt-0.5">
                          Add-ons:{" "}
                          {item.foodItem.addons
                            .filter((a) => item.selectedAddons.includes(a.id))
                            .map((a) => a.name)
                            .join(", ")}
                        </p>
                      )}
                      {item.specialInstructions && (
                        <p className="text-xs text-surface-400 mt-0.5 italic">
                          &quot;{item.specialInstructions}&quot;
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-bold text-primary-600">
                          Rs. {item.itemTotal.toFixed(0)}
                        </span>
                        <span className="text-xs text-surface-400">
                          (Rs. {item.unitPrice} × {item.quantity})
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={updatingItem === item.id}
                        className="text-surface-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updatingItem === item.id}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-surface-300 disabled:opacity-30"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-semibold w-5 text-center">
                          {updatingItem === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                          ) : (
                            item.quantity
                          )}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={updatingItem === item.id}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-20 rounded-xl bg-white border border-surface-200/60 p-5">
                  <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

                  {/* Coupon */}
                  <div className="mb-4">
                    {couponApplied ? (
                      <div className="flex items-center justify-between rounded-lg bg-success-50 border border-green-200 p-3">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            {couponApplied.code}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setCouponApplied(null);
                            setCouponCode("");
                          }}
                        >
                          <X className="h-4 w-4 text-green-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                        />
                        <button
                          onClick={applyCoupon}
                          disabled={applyingCoupon || !couponCode}
                          className="rounded-lg bg-surface-900 px-4 py-2 text-sm font-medium text-white hover:bg-surface-800 disabled:opacity-50"
                        >
                          {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-surface-500">Subtotal</span>
                      <span>Rs. {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Delivery Fee</span>
                      <span>Rs. {deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Service Fee (5%)</span>
                      <span>Rs. {serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Tax (13%)</span>
                      <span>Rs. {tax.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>- Rs. {discount.toFixed(2)}</span>
                      </div>
                    )}
                    <hr className="border-surface-200" />
                    <div className="flex justify-between font-bold text-base pt-1">
                      <span>Total</span>
                      <span className="text-primary-600">Rs. {total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Min Order Warning */}
                  {cartData.cart!.restaurant.minOrder > 0 &&
                    subtotal < cartData.cart!.restaurant.minOrder && (
                      <p className="text-xs text-red-500 mt-3">
                        Minimum order: Rs. {cartData.cart!.restaurant.minOrder}.
                        Add Rs. {(cartData.cart!.restaurant.minOrder - subtotal).toFixed(0)} more.
                      </p>
                    )}

                  {/* Checkout Button */}
                  <button
                    onClick={() => router.push("/checkout")}
                    disabled={
                      cartData.cart!.restaurant.minOrder > 0 &&
                      subtotal < cartData.cart!.restaurant.minOrder
                    }
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-primary-500 py-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-500/20"
                  >
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
