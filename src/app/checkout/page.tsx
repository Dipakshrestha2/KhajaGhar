"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import {
  MapPin,
  Plus,
  CreditCard,
  Banknote,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Clock,
  Truck,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  landmark: string | null;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  label: string | null;
}

interface CartSummary {
  subtotal: number;
  items: Array<{ foodItem: { name: string }; quantity: number; itemTotal: number }>;
  cart: { restaurant: { name: string; deliveryFee: number } } | null;
}

const STEPS = ["Address", "Delivery", "Payment", "Confirm"];

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH_ON_DELIVERY");
  const [couponCode, setCouponCode] = useState("");
  const [notes, setNotes] = useState("");
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "", phone: "", street: "", city: "Kathmandu",
    landmark: "", latitude: 27.7172, longitude: 85.3240, label: "Home",
  });

  const fetchData = useCallback(async () => {
    try {
      const [addrRes, cartRes] = await Promise.all([
        fetch("/api/addresses"),
        fetch("/api/cart"),
      ]);
      const addrData = await addrRes.json();
      const cartData = await cartRes.json();

      setAddresses(addrData.addresses || []);
      setCartSummary(cartData);

      // Auto-select default address
      const defaultAddr = (addrData.addresses || []).find((a: Address) => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);

      if (!cartData.cart || !cartData.items?.length) {
        toast.error("Your cart is empty");
        router.push("/cart");
      }
    } catch {
      toast.error("Failed to load checkout data");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveNewAddress = async () => {
    if (!newAddress.fullName || !newAddress.phone || !newAddress.street) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAddress, isDefault: addresses.length === 0 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save address");
        return;
      }
      setAddresses((prev) => [data.address, ...prev]);
      setSelectedAddressId(data.address.id);
      setShowNewAddress(false);
      toast.success("Address saved!");
    } catch {
      toast.error("Failed to save address");
    }
  };

  const placeOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }
    setPlacingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod,
          couponCode: couponCode || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to place order");
        return;
      }
      toast.success("Order placed successfully! 🎉");
      router.push(`/orders/${data.order.id}`);
    } catch {
      toast.error("Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

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

  const deliveryFee = cartSummary?.cart?.restaurant?.deliveryFee || 0;
  const subtotal = cartSummary?.subtotal || 0;

  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {/* Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    i <= step
                      ? "bg-primary-500 text-white"
                      : "bg-surface-200 text-surface-500"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </button>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    i <= step ? "text-surface-900" : "text-surface-400"
                  }`}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-8 ${
                      i < step ? "bg-primary-500" : "bg-surface-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="rounded-2xl bg-white border border-surface-200/60 p-5 md:p-6">
            {/* Step 0: Address */}
            {step === 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Delivery Address</h2>

                {addresses.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                          selectedAddressId === addr.id
                            ? "border-primary-500 bg-primary-50"
                            : "border-surface-200 hover:bg-surface-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 accent-primary-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{addr.fullName}</span>
                            {addr.label && (
                              <span className="rounded bg-surface-100 px-1.5 py-0.5 text-[10px] font-medium text-surface-500">
                                {addr.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-surface-500 mt-0.5">
                            {addr.street}, {addr.city}
                          </p>
                          <p className="text-xs text-surface-400">{addr.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {showNewAddress ? (
                  <div className="space-y-3 border border-surface-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold">New Address</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="Full Name *" value={newAddress.fullName}
                        onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        className="col-span-2 rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:border-primary-500" />
                      <input placeholder="Phone *" value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:border-primary-500" />
                      <input placeholder="City" value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:border-primary-500" />
                      <input placeholder="Street Address *" value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        className="col-span-2 rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:border-primary-500" />
                      <input placeholder="Landmark" value={newAddress.landmark}
                        onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                        className="col-span-2 rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:border-primary-500" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveNewAddress}
                        className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
                        Save Address
                      </button>
                      <button onClick={() => setShowNewAddress(false)}
                        className="rounded-lg border border-surface-200 px-4 py-2 text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowNewAddress(true)}
                    className="flex items-center gap-2 rounded-xl border-2 border-dashed border-surface-300 p-4 w-full text-sm text-surface-500 hover:border-primary-500 hover:text-primary-600 transition-colors">
                    <Plus className="h-4 w-4" />
                    Add New Address
                  </button>
                )}

                <div className="flex justify-end mt-6">
                  <button onClick={() => selectedAddressId ? setStep(1) : toast.error("Select an address")}
                    className="flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600">
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Delivery */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Delivery Details</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-4">
                    <Clock className="h-5 w-5 text-primary-500" />
                    <div>
                      <div className="text-sm font-medium">Estimated Delivery</div>
                      <div className="text-xs text-surface-500">30-45 minutes</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-4">
                    <Truck className="h-5 w-5 text-primary-500" />
                    <div>
                      <div className="text-sm font-medium">Delivery Fee</div>
                      <div className="text-xs text-surface-500">Rs. {deliveryFee}</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Order Notes (optional)</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special delivery instructions..."
                      rows={2} className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none" />
                  </div>
                </div>
                <div className="flex justify-between mt-6">
                  <button onClick={() => setStep(0)}
                    className="flex items-center gap-2 rounded-xl border border-surface-200 px-6 py-2.5 text-sm hover:bg-surface-50">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <button onClick={() => setStep(2)}
                    className="flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600">
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Payment Method</h2>
                <div className="space-y-2">
                  {[
                    { value: "CASH_ON_DELIVERY", label: "Cash on Delivery", icon: Banknote, desc: "Pay when your order arrives" },
                    { value: "DEMO", label: "Online Payment (Demo)", icon: CreditCard, desc: "Simulated payment for testing" },
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <label key={method.value}
                        className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${
                          paymentMethod === method.value ? "border-primary-500 bg-primary-50" : "border-surface-200 hover:bg-surface-50"
                        }`}>
                        <input type="radio" name="payment" checked={paymentMethod === method.value}
                          onChange={() => setPaymentMethod(method.value)} className="accent-primary-500" />
                        <Icon className="h-5 w-5 text-surface-500" />
                        <div>
                          <div className="text-sm font-medium">{method.label}</div>
                          <div className="text-xs text-surface-500">{method.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {paymentMethod === "DEMO" && (
                  <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                    ⚠️ This is a demo payment. No real money will be charged.
                  </div>
                )}
                <div className="flex justify-between mt-6">
                  <button onClick={() => setStep(1)}
                    className="flex items-center gap-2 rounded-xl border border-surface-200 px-6 py-2.5 text-sm hover:bg-surface-50">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <button onClick={() => setStep(3)}
                    className="flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600">
                    Review Order <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Review & Confirm</h2>

                {/* Items */}
                <div className="rounded-xl bg-surface-50 p-4 mb-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    {cartSummary?.cart?.restaurant?.name}
                  </h3>
                  {cartSummary?.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-surface-600">{item.quantity}× {item.foodItem.name}</span>
                      <span>Rs. {item.itemTotal.toFixed(0)}</span>
                    </div>
                  ))}
                </div>

                {/* Address */}
                <div className="rounded-xl bg-surface-50 p-4 mb-4">
                  <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Delivery Address
                  </h3>
                  {(() => {
                    const addr = addresses.find((a) => a.id === selectedAddressId);
                    return addr ? (
                      <p className="text-xs text-surface-600">{addr.fullName} • {addr.street}, {addr.city}</p>
                    ) : null;
                  })()}
                </div>

                {/* Payment */}
                <div className="rounded-xl bg-surface-50 p-4 mb-4">
                  <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Payment
                  </h3>
                  <p className="text-xs text-surface-600">
                    {paymentMethod === "CASH_ON_DELIVERY" ? "Cash on Delivery" : "Online Payment (Demo)"}
                  </p>
                </div>

                {/* Total */}
                <div className="border-t border-surface-200 pt-4 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-surface-500">Subtotal</span><span>Rs. {subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-surface-500">Delivery</span><span>Rs. {deliveryFee.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-surface-500">Service Fee</span><span>Rs. {(subtotal * 0.05).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-surface-500">Tax (13%)</span><span>Rs. {(subtotal * 0.13).toFixed(2)}</span></div>
                  <hr className="border-surface-200" />
                  <div className="flex justify-between font-bold text-base pt-1">
                    <span>Total</span>
                    <span className="text-primary-600">Rs. {(subtotal + deliveryFee + subtotal * 0.05 + subtotal * 0.13).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button onClick={() => setStep(2)}
                    className="flex items-center gap-2 rounded-xl border border-surface-200 px-6 py-2.5 text-sm hover:bg-surface-50">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <button onClick={placeOrder} disabled={placingOrder}
                    className="flex items-center gap-2 rounded-xl bg-primary-500 px-8 py-3 text-sm font-bold text-white hover:bg-primary-600 disabled:opacity-50 shadow-lg shadow-primary-500/20">
                    {placingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {placingOrder ? "Placing Order..." : "Place Order"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
