import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOrderSchema } from "@/lib/validations";
import { generateOrderNumber, calculateDistance, canTransitionTo } from "@/lib/utils";
import { calculatePricing, calculateCouponDiscount } from "@/server/services/pricing.service";
import { getPaymentProvider } from "@/lib/payments";

// GET /api/orders — Get user's orders
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: Record<string, unknown> = { userId: session.user.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          restaurant: { select: { id: true, name: true, slug: true, logo: true } },
          items: { include: { foodItem: { select: { name: true, image: true } } } },
          payment: true,
          statusHistory: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// POST /api/orders — Create a new order
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { addressId, paymentMethod, couponCode, notes } = result.data;

    // 1. Get cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            foodItem: { include: { addons: true, restaurant: { include: { address: true, hours: true } } } },
          },
        },
        restaurant: { include: { address: true, hours: true } },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const restaurant = cart.restaurant;
    if (!restaurant || !restaurant.isActive || !restaurant.isApproved) {
      return NextResponse.json({ error: "Restaurant is currently unavailable" }, { status: 400 });
    }

    // 2. Verify all items are available
    for (const item of cart.items) {
      if (!item.foodItem.isAvailable) {
        return NextResponse.json(
          { error: `"${item.foodItem.name}" is no longer available` },
          { status: 400 }
        );
      }
    }

    // 3. Get delivery address
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== session.user.id) {
      return NextResponse.json({ error: "Invalid delivery address" }, { status: 400 });
    }

    // 4. Check delivery radius
    let deliveryDistance = 0;
    if (restaurant.address) {
      deliveryDistance = calculateDistance(
        restaurant.address.latitude,
        restaurant.address.longitude,
        address.latitude,
        address.longitude
      );

      if (deliveryDistance > restaurant.address.deliveryRadius) {
        return NextResponse.json(
          { error: "Restaurant does not deliver to your location" },
          { status: 400 }
        );
      }
    }

    // 5. Calculate pricing server-side
    const pricingItems = cart.items.map((item) => ({
      price: item.foodItem.price,
      discountPrice: item.foodItem.discountPrice,
      quantity: item.quantity,
      addons: item.foodItem.addons
        .filter((a) => item.selectedAddons.includes(a.id))
        .map((a) => ({ price: a.price })),
    }));

    // 6. Validate coupon
    let couponDiscount = 0;
    let couponId: string | null = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });

      if (!coupon || !coupon.isActive) {
        return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
      }

      const now = new Date();
      if (now < coupon.startDate || now > coupon.endDate) {
        return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
      }

      // Calculate subtotal for minimum order check
      let subtotalCheck = 0;
      for (const item of pricingItems) {
        subtotalCheck += (item.discountPrice ?? item.price) * item.quantity;
      }

      if (subtotalCheck < coupon.minimumOrder) {
        return NextResponse.json(
          { error: `Minimum order of Rs. ${coupon.minimumOrder} required for this coupon` },
          { status: 400 }
        );
      }

      couponDiscount = calculateCouponDiscount(
        subtotalCheck,
        coupon.discountType,
        coupon.discountValue,
        coupon.maximumDiscount
      );
      couponId = coupon.id;
    }

    const pricing = await calculatePricing({
      items: pricingItems,
      deliveryDistance,
      couponDiscount,
    });

    // Check minimum order
    if (restaurant.minOrder > 0 && pricing.subtotal < restaurant.minOrder) {
      return NextResponse.json(
        { error: `Minimum order amount is Rs. ${restaurant.minOrder}` },
        { status: 400 }
      );
    }

    // 7. Process payment
    const paymentProvider = getPaymentProvider(paymentMethod);
    const paymentResult = await paymentProvider.createPayment({
      amount: pricing.total,
      currency: "NPR",
      orderId: "pending",
      description: `Order from ${restaurant.name}`,
      customerEmail: session.user.email,
    });

    if (!paymentResult.success && paymentMethod !== "CASH_ON_DELIVERY") {
      return NextResponse.json(
        { error: paymentResult.message || "Payment failed" },
        { status: 400 }
      );
    }

    // 8. Create order in a transaction
    const orderNumber = generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          restaurantId: restaurant.id,
          status: "PENDING",
          subtotal: pricing.subtotal,
          deliveryFee: pricing.deliveryFee,
          serviceFee: pricing.serviceFee,
          tax: pricing.tax,
          discount: pricing.discount,
          total: pricing.total,
          couponId,
          deliveryAddress: {
            fullName: address.fullName,
            phone: address.phone,
            street: address.street,
            city: address.city,
            landmark: address.landmark,
            latitude: address.latitude,
            longitude: address.longitude,
          },
          notes,
          estimatedDelivery: new Date(Date.now() + restaurant.avgDeliveryTime * 60 * 1000),
          items: {
            create: cart.items.map((item) => {
              const addons = item.foodItem.addons
                .filter((a) => item.selectedAddons.includes(a.id))
                .map((a) => ({ name: a.name, price: a.price }));
              const unitPrice = item.foodItem.discountPrice ?? item.foodItem.price;
              const addonTotal = addons.reduce((s, a) => s + a.price, 0);

              return {
                foodItemId: item.foodItemId,
                name: item.foodItem.name,
                price: unitPrice,
                quantity: item.quantity,
                selectedAddons: addons,
                specialInstructions: item.specialInstructions,
                subtotal: (unitPrice + addonTotal) * item.quantity,
              };
            }),
          },
          statusHistory: {
            create: {
              status: "PENDING",
              changedBy: session.user.id,
              note: "Order placed",
            },
          },
        },
        include: {
          items: true,
          restaurant: { select: { name: true } },
        },
      });

      // Create payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          method: paymentMethod as "CASH_ON_DELIVERY" | "ONLINE" | "DEMO",
          status: paymentMethod === "CASH_ON_DELIVERY" ? "PENDING" : paymentResult.status === "COMPLETED" ? "COMPLETED" : "PENDING",
          amount: pricing.total,
          transactionId: paymentResult.transactionId,
          provider: paymentProvider.name,
        },
      });

      // Update coupon usage
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { restaurantId: null },
      });

      // Create notification for restaurant owner
      await tx.notification.create({
        data: {
          userId: restaurant.ownerId,
          title: "New Order!",
          message: `New order #${orderNumber} received — Rs. ${pricing.total}`,
          type: "NEW_ORDER",
          orderId: newOrder.id,
        },
      });

      return newOrder;
    });

    return NextResponse.json({
      message: "Order placed successfully",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
