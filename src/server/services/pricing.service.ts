import { calculateDistance } from "@/lib/utils";
import { getNumericSetting } from "./settings.service";

// ============================================================================
// PRICING SERVICE — All calculations server-side
// ============================================================================

export interface PricingInput {
  items: Array<{
    price: number;
    discountPrice?: number | null;
    quantity: number;
    addons?: Array<{ price: number }>;
  }>;
  deliveryDistance: number; // km
  couponDiscount?: number;
}

export interface PricingResult {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  discount: number;
  total: number;
}

export async function calculatePricing(input: PricingInput): Promise<PricingResult> {
  const taxPercentage = await getNumericSetting("taxPercentage");
  const serviceFeePercentage = await getNumericSetting("serviceFeePercentage");
  const baseDeliveryFee = await getNumericSetting("baseDeliveryFee");
  const perKmDeliveryFee = await getNumericSetting("perKmDeliveryFee");

  // Calculate subtotal
  let subtotal = 0;
  for (const item of input.items) {
    const unitPrice = item.discountPrice ?? item.price;
    let itemTotal = unitPrice * item.quantity;
    
    // Add addon prices
    if (item.addons) {
      for (const addon of item.addons) {
        itemTotal += addon.price * item.quantity;
      }
    }
    
    subtotal += itemTotal;
  }

  // Calculate delivery fee
  const deliveryFee = baseDeliveryFee + input.deliveryDistance * perKmDeliveryFee;

  // Calculate service fee
  const serviceFee = (subtotal * serviceFeePercentage) / 100;

  // Calculate tax
  const tax = (subtotal * taxPercentage) / 100;

  // Apply discount
  const discount = input.couponDiscount ?? 0;

  // Calculate total
  const total = Math.max(0, subtotal + deliveryFee + serviceFee + tax - discount);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    serviceFee: Math.round(serviceFee * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

// ============================================================================
// DELIVERY FEE CALCULATION
// ============================================================================

export async function calculateDeliveryFee(
  restaurantLat: number,
  restaurantLng: number,
  customerLat: number,
  customerLng: number
): Promise<{ fee: number; distance: number; isWithinRange: boolean }> {
  const distance = calculateDistance(
    restaurantLat,
    restaurantLng,
    customerLat,
    customerLng
  );

  const baseDeliveryFee = await getNumericSetting("baseDeliveryFee");
  const perKmDeliveryFee = await getNumericSetting("perKmDeliveryFee");
  const maxRadius = await getNumericSetting("maximumDeliveryRadius");

  const fee = baseDeliveryFee + distance * perKmDeliveryFee;
  const isWithinRange = distance <= maxRadius;

  return {
    fee: Math.round(fee * 100) / 100,
    distance: Math.round(distance * 100) / 100,
    isWithinRange,
  };
}

// ============================================================================
// COUPON DISCOUNT CALCULATION
// ============================================================================

export function calculateCouponDiscount(
  subtotal: number,
  discountType: "PERCENTAGE" | "FIXED",
  discountValue: number,
  maximumDiscount?: number | null
): number {
  let discount = 0;

  if (discountType === "PERCENTAGE") {
    discount = (subtotal * discountValue) / 100;
    if (maximumDiscount && discount > maximumDiscount) {
      discount = maximumDiscount;
    }
  } else {
    discount = discountValue;
  }

  // Discount cannot exceed subtotal
  return Math.min(discount, subtotal);
}
