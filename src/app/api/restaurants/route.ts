import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const cuisine = searchParams.get("cuisine") || "";
    const sort = searchParams.get("sort") || "rating";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true,
      isApproved: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { cuisine: { has: search } },
      ];
    }

    if (cuisine) {
      where.cuisine = { has: cuisine.charAt(0).toUpperCase() + cuisine.slice(1) };
    }

    // Build orderBy
    let orderBy: Record<string, string> = {};
    switch (sort) {
      case "rating":
        orderBy = { rating: "desc" };
        break;
      case "delivery_time":
        orderBy = { avgDeliveryTime: "asc" };
        break;
      case "delivery_fee":
        orderBy = { deliveryFee: "asc" };
        break;
      case "name":
        orderBy = { name: "asc" };
        break;
      default:
        orderBy = { rating: "desc" };
    }

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        include: {
          address: true,
          hours: true,
          _count: { select: { reviews: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.restaurant.count({ where }),
    ]);

    return NextResponse.json({
      restaurants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}
