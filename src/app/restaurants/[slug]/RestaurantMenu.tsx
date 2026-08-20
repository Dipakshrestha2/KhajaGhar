"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Minus,
  ShoppingCart,
  UtensilsCrossed,
  Leaf,
  Flame,
  X,
} from "lucide-react";

interface FoodAddon {
  id: string;
  name: string;
  price: number;
}

interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  image: string | null;
  isAvailable: boolean;
  isVegetarian: boolean;
  isSpicy: boolean;
  preparationTime: number | null;
  category: { id: string; name: string };
  addons: FoodAddon[];
}

interface RestaurantMenuProps {
  restaurantId: string;
  restaurantName: string;
  categories: Record<string, FoodItem[]>;
  isOpen: boolean;
}

export default function RestaurantMenu({
  restaurantId,
  restaurantName,
  categories,
  isOpen,
}: RestaurantMenuProps) {
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(
    Object.keys(categories)[0] || ""
  );
  const [addingToCart, setAddingToCart] = useState(false);

  const categoryNames = Object.keys(categories);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  const addToCart = async () => {
    if (!selectedItem) return;
    setAddingToCart(true);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodItemId: selectedItem.id,
          quantity,
          selectedAddons,
          specialInstructions: specialInstructions || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add to cart");
        return;
      }

      toast.success(`${selectedItem.name} added to cart!`);
      setSelectedItem(null);
      setQuantity(1);
      setSelectedAddons([]);
      setSpecialInstructions("");
    } catch {
      toast.error("Failed to add to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  const getEffectivePrice = (item: FoodItem) =>
    item.discountPrice ?? item.price;

  return (
    <>
      {/* Category Navigation */}
      {categoryNames.length > 1 && (
        <div className="sticky top-16 z-20 bg-surface-50/95 backdrop-blur pb-3 -mx-1 px-1">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {categoryNames.map((name) => (
              <button
                key={name}
                onClick={() => {
                  setActiveCategory(name);
                  document
                    .getElementById(`category-${name}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === name
                    ? "bg-primary-500 text-white shadow-md"
                    : "bg-white border border-surface-200 text-surface-600 hover:bg-surface-50"
                }`}
              >
                {name} ({categories[name].length})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Sections */}
      <div className="space-y-8 mt-4">
        {categoryNames.map((categoryName) => (
          <div key={categoryName} id={`category-${categoryName}`}>
            <h2 className="text-lg font-bold mb-4 text-surface-800">
              {categoryName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories[categoryName].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.isAvailable && isOpen) {
                      setSelectedItem(item);
                      setQuantity(1);
                      setSelectedAddons([]);
                      setSpecialInstructions("");
                    }
                  }}
                  disabled={!item.isAvailable || !isOpen}
                  className={`flex gap-4 rounded-xl bg-white border border-surface-200/60 p-4 text-left transition-all ${
                    item.isAvailable && isOpen
                      ? "hover:border-primary-200 hover:shadow-md cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                >
                  {/* Food image placeholder */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50">
                    <UtensilsCrossed className="h-8 w-8 text-amber-300" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-surface-900 text-sm">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.isVegetarian && (
                          <Leaf className="h-3.5 w-3.5 text-green-500" />
                        )}
                        {item.isSpicy && (
                          <Flame className="h-3.5 w-3.5 text-red-500" />
                        )}
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
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

                      {item.isAvailable && isOpen && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white">
                          <Plus className="h-4 w-4" />
                        </div>
                      )}

                      {!item.isAvailable && (
                        <span className="text-[10px] text-red-500 font-medium">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {categoryNames.length === 0 && (
        <div className="text-center py-12">
          <UtensilsCrossed className="h-12 w-12 mx-auto text-surface-300 mb-3" />
          <h3 className="text-lg font-semibold text-surface-700">
            No menu items available
          </h3>
          <p className="text-sm text-surface-500">
            This restaurant hasn&apos;t added any items yet
          </p>
        </div>
      )}

      {/* Food Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedItem(null)}
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-surface-100 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-lg">{selectedItem.name}</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-full p-1.5 hover:bg-surface-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Image placeholder */}
              <div className="h-40 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                <UtensilsCrossed className="h-16 w-16 text-amber-200" />
              </div>

              {/* Description */}
              {selectedItem.description && (
                <p className="text-sm text-surface-600">
                  {selectedItem.description}
                </p>
              )}

              {/* Price */}
              <div className="flex items-center gap-2">
                {selectedItem.discountPrice ? (
                  <>
                    <span className="text-xl font-bold text-primary-600">
                      Rs. {selectedItem.discountPrice}
                    </span>
                    <span className="text-sm text-surface-400 line-through">
                      Rs. {selectedItem.price}
                    </span>
                  </>
                ) : (
                  <span className="text-xl font-bold">
                    Rs. {selectedItem.price}
                  </span>
                )}
              </div>

              {/* Add-ons */}
              {selectedItem.addons.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Add-ons</h4>
                  <div className="space-y-2">
                    {selectedItem.addons.map((addon) => (
                      <label
                        key={addon.id}
                        className="flex items-center justify-between rounded-lg border border-surface-200 p-3 cursor-pointer hover:bg-surface-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedAddons.includes(addon.id)}
                            onChange={() => toggleAddon(addon.id)}
                            className="rounded accent-primary-500"
                          />
                          <span className="text-sm">{addon.name}</span>
                        </div>
                        <span className="text-sm font-medium text-surface-600">
                          + Rs. {addon.price}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Special Instructions
                </h4>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g., extra spicy, no onions..."
                  rows={2}
                  className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
                />
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-surface-300 hover:bg-surface-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-lg font-semibold w-6 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={addToCart}
                disabled={addingToCart}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-500 py-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                {addingToCart
                  ? "Adding..."
                  : `Add to Cart — Rs. ${(
                      getEffectivePrice(selectedItem) * quantity +
                      selectedAddons.reduce((sum, addonId) => {
                        const addon = selectedItem.addons.find(
                          (a) => a.id === addonId
                        );
                        return sum + (addon?.price || 0) * quantity;
                      }, 0)
                    ).toFixed(0)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
