import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addToCartSchema } from "@/lib/validations";

// GET /api/cart — Get current user's cart
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        restaurant: { select: { id: true, name: true, slug: true, minOrder: true, deliveryFee: true, isActive: true } },
        items: {
          include: {
            foodItem: {
              include: {
                addons: true,
                restaurant: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ cart: null, items: [], subtotal: 0 });
    }

    // Calculate subtotal
    let subtotal = 0;
    const items = cart.items.map((item) => {
      const unitPrice = item.foodItem.discountPrice ?? item.foodItem.price;
      const addonTotal = item.foodItem.addons
        .filter((a) => item.selectedAddons.includes(a.id))
        .reduce((sum, a) => sum + a.price, 0);
      const itemTotal = (unitPrice + addonTotal) * item.quantity;
      subtotal += itemTotal;

      return {
        id: item.id,
        foodItem: item.foodItem,
        quantity: item.quantity,
        selectedAddons: item.selectedAddons,
        specialInstructions: item.specialInstructions,
        unitPrice,
        addonTotal,
        itemTotal,
      };
    });

    return NextResponse.json({
      cart: {
        id: cart.id,
        restaurantId: cart.restaurantId,
        restaurant: cart.restaurant,
      },
      items,
      subtotal,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

// POST /api/cart — Add item to cart
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please login to add items to cart" }, { status: 401 });
    }

    const body = await request.json();
    const result = addToCartSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { foodItemId, quantity, selectedAddons, specialInstructions } = result.data;

    // Fetch the food item
    const foodItem = await prisma.foodItem.findUnique({
      where: { id: foodItemId },
      include: { restaurant: { select: { id: true, isActive: true, isApproved: true } } },
    });

    if (!foodItem) {
      return NextResponse.json({ error: "Food item not found" }, { status: 404 });
    }

    if (!foodItem.isAvailable) {
      return NextResponse.json({ error: "This item is currently unavailable" }, { status: 400 });
    }

    if (!foodItem.restaurant.isActive || !foodItem.restaurant.isApproved) {
      return NextResponse.json({ error: "This restaurant is currently unavailable" }, { status: 400 });
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    if (cart && cart.restaurantId && cart.restaurantId !== foodItem.restaurantId) {
      // Cart has items from a different restaurant — clear it
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      cart = await prisma.cart.update({
        where: { id: cart.id },
        data: { restaurantId: foodItem.restaurantId },
        include: { items: true },
      });
    }

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
          restaurantId: foodItem.restaurantId,
        },
        include: { items: true },
      });
    }

    if (!cart.restaurantId) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { restaurantId: foodItem.restaurantId },
      });
    }

    // Check if item already in cart (same food + same addons)
    const existingItem = cart.items.find(
      (item) =>
        item.foodItemId === foodItemId &&
        JSON.stringify([...item.selectedAddons].sort()) ===
          JSON.stringify([...selectedAddons].sort())
    );

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          foodItemId,
          quantity,
          selectedAddons,
          specialInstructions,
        },
      });
    }

    return NextResponse.json({ message: "Item added to cart" }, { status: 200 });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ error: "Failed to add item to cart" }, { status: 500 });
  }
}

// PUT /api/cart — Update cart item quantity
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cartItemId, quantity } = await request.json();

    if (!cartItemId || !quantity || quantity < 1) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Verify ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== session.user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return NextResponse.json({ message: "Cart updated" });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

// DELETE /api/cart — Remove item from cart
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get("itemId");

    if (!cartItemId) {
      // Clear entire cart
      const cart = await prisma.cart.findUnique({
        where: { userId: session.user.id },
      });
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        await prisma.cart.update({
          where: { id: cart.id },
          data: { restaurantId: null },
        });
      }
      return NextResponse.json({ message: "Cart cleared" });
    }

    // Remove single item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== session.user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });

    // Check if cart is now empty
    const remainingItems = await prisma.cartItem.count({
      where: { cartId: cartItem.cartId },
    });

    if (remainingItems === 0) {
      await prisma.cart.update({
        where: { id: cartItem.cartId },
        data: { restaurantId: null },
      });
    }

    return NextResponse.json({ message: "Item removed" });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
  }
}
