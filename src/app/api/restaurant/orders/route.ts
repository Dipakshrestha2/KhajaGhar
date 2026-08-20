import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/restaurant/orders — Get orders for the logged-in restaurant owner
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "RESTAURANT_OWNER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the restaurant owned by this user
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true },
    });

    if (!restaurant && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (restaurant) {
      where.restaurantId = restaurant.id;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, phone: true } },
        items: {
          select: {
            name: true,
            quantity: true,
            selectedAddons: true,
            specialInstructions: true,
          },
        },
        payment: { select: { method: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching restaurant orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
