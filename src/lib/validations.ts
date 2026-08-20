import { z } from "zod";

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone must be at least 10 digits").optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    role: z.enum(["CUSTOMER", "RESTAURANT_OWNER"]).default("CUSTOMER"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  image: z.string().optional(),
});

// ============================================================================
// RESTAURANT SCHEMAS
// ============================================================================

export const restaurantSchema = z.object({
  name: z.string().min(2, "Restaurant name must be at least 2 characters"),
  description: z.string().optional(),
  cuisine: z.array(z.string()).min(1, "Select at least one cuisine"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  logo: z.string().optional(),
  banner: z.string().optional(),
  minOrder: z.number().min(0).default(0),
  deliveryFee: z.number().min(0).default(0),
  avgDeliveryTime: z.number().min(5).default(30),
});

export const restaurantAddressSchema = z.object({
  street: z.string().min(2, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  landmark: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  deliveryRadius: z.number().min(1).max(50).default(5),
});

export const restaurantHoursSchema = z.object({
  dayOfWeek: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  isClosed: z.boolean().default(false),
});

// ============================================================================
// FOOD SCHEMAS
// ============================================================================

export const foodCategorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  description: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().default(0),
});

export const foodItemSchema = z.object({
  name: z.string().min(2, "Food name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be greater than 0"),
  discountPrice: z.number().positive().optional().nullable(),
  image: z.string().optional(),
  isAvailable: z.boolean().default(true),
  isVegetarian: z.boolean().default(false),
  isSpicy: z.boolean().default(false),
  preparationTime: z.number().positive().optional().nullable(),
  categoryId: z.string().uuid("Valid category is required"),
});

export const foodAddonSchema = z.object({
  name: z.string().min(1, "Addon name is required"),
  price: z.number().min(0, "Price must be 0 or greater"),
});

// ============================================================================
// ADDRESS SCHEMAS
// ============================================================================

export const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  street: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  landmark: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  label: z.string().optional(),
  isDefault: z.boolean().default(false),
});

// ============================================================================
// CART SCHEMAS
// ============================================================================

export const addToCartSchema = z.object({
  foodItemId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  selectedAddons: z.array(z.string().uuid()).default([]),
  specialInstructions: z.string().optional(),
});

export const updateCartItemSchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

// ============================================================================
// ORDER SCHEMAS
// ============================================================================

export const createOrderSchema = z.object({
  addressId: z.string().uuid("Delivery address is required"),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "ONLINE", "DEMO"]),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ]),
  note: z.string().optional(),
});

// ============================================================================
// COUPON SCHEMAS
// ============================================================================

export const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .toUpperCase(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive("Discount value must be greater than 0"),
  minimumOrder: z.number().min(0).default(0),
  maximumDiscount: z.number().positive().optional().nullable(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  usageLimit: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  subtotal: z.number().positive(),
});

// ============================================================================
// REVIEW SCHEMAS
// ============================================================================

export const reviewSchema = z.object({
  restaurantId: z.string().uuid(),
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  foodRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
});

// ============================================================================
// SEARCH SCHEMA
// ============================================================================

export const searchSchema = z.object({
  query: z.string().min(1),
  type: z.enum(["all", "restaurants", "food"]).default("all"),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
});

// ============================================================================
// PLATFORM SETTINGS SCHEMA
// ============================================================================

export const platformSettingsSchema = z.object({
  platformName: z.string().optional(),
  currency: z.string().optional(),
  taxPercentage: z.number().min(0).max(100).optional(),
  serviceFeePercentage: z.number().min(0).max(100).optional(),
  baseDeliveryFee: z.number().min(0).optional(),
  perKmDeliveryFee: z.number().min(0).optional(),
  minimumOrderValue: z.number().min(0).optional(),
  maximumDeliveryRadius: z.number().min(0).optional(),
  platformCommission: z.number().min(0).max(100).optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type RestaurantInput = z.infer<typeof restaurantSchema>;
export type FoodItemInput = z.infer<typeof foodItemSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
