import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canTransitionTo, ORDER_STATUS_LABELS } from "@/lib/utils";

// GET /api/orders/[id] — Get single order
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true, name: true, slug: true, phone: true, logo: true,
            address: true,
          },
        },
        items: {
          include: { foodItem: { select: { name: true, image: true } } },
        },
        payment: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        review: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Authorization: customer, restaurant owner, or admin
    const isCustomer = order.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    let isRestaurantOwner = false;
    if (session.user.role === "RESTAURANT_OWNER") {
      const restaurant = await prisma.restaurant.findFirst({
        where: { id: order.restaurantId, ownerId: session.user.id },
      });
      isRestaurantOwner = !!restaurant;
    }

    if (!isCustomer && !isRestaurantOwner && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

// PATCH /api/orders/[id] — Update order status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status, note } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Authorization
    const isAdmin = session.user.role === "ADMIN";
    const isOwner =
      session.user.role === "RESTAURANT_OWNER" &&
      order.restaurant.ownerId === session.user.id;
    const isCustomer = order.userId === session.user.id;

    // Only restaurant owner, admin can update most statuses
    // Customer can only cancel (if still PENDING)
    if (!isAdmin && !isOwner) {
      if (isCustomer && status === "CANCELLED" && order.status === "PENDING") {
        // Allow customer cancellation of pending orders
      } else {
        return NextResponse.json({ error: "Not authorized to update this order" }, { status: 403 });
      }
    }

    // Validate status transition (admin can override)
    if (!isAdmin && !canTransitionTo(order.status, status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${ORDER_STATUS_LABELS[order.status]} to ${ORDER_STATUS_LABELS[status]}` },
        { status: 400 }
      );
    }

    // Update order
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status,
          changedBy: session.user.id,
          note: note || `Status changed to ${ORDER_STATUS_LABELS[status]}`,
        },
      });

      // Update payment status if delivered
      if (status === "DELIVERED") {
        await tx.payment.updateMany({
          where: { orderId: id, method: "CASH_ON_DELIVERY" },
          data: { status: "COMPLETED" },
        });
      }

      // Create notification for customer
      const notificationMessages: Record<string, string> = {
        CONFIRMED: `Your order #${order.orderNumber} has been confirmed by the restaurant!`,
        PREPARING: `Your order #${order.orderNumber} is being prepared.`,
        READY_FOR_PICKUP: `Your order #${order.orderNumber} is ready for pickup!`,
        OUT_FOR_DELIVERY: `Your order #${order.orderNumber} is on its way!`,
        DELIVERED: `Your order #${order.orderNumber} has been delivered. Enjoy!`,
        CANCELLED: `Your order #${order.orderNumber} has been cancelled.`,
      };

      if (notificationMessages[status]) {
        await tx.notification.create({
          data: {
            userId: order.userId,
            title: ORDER_STATUS_LABELS[status],
            message: notificationMessages[status],
            type: `ORDER_${status === "CONFIRMED" ? "CONFIRMED" : status === "PREPARING" ? "PREPARING" : status === "READY_FOR_PICKUP" ? "READY" : status === "OUT_FOR_DELIVERY" ? "DISPATCHED" : status === "DELIVERED" ? "DELIVERED" : "CANCELLED"}` as "ORDER_CONFIRMED" | "ORDER_PREPARING" | "ORDER_READY" | "ORDER_DISPATCHED" | "ORDER_DELIVERED" | "ORDER_CANCELLED",
            orderId: id,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({
      message: `Order status updated to ${ORDER_STATUS_LABELS[status]}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
