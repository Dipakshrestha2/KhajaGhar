import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateCouponDiscount } from "@/server/services/pricing.service";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, subtotal } = await request.json();

    if (!code || !subtotal) {
      return NextResponse.json({ error: "Code and subtotal required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }

    if (subtotal < coupon.minimumOrder) {
      return NextResponse.json(
        { error: `Minimum order of Rs. ${coupon.minimumOrder} required` },
        { status: 400 }
      );
    }

    const discount = calculateCouponDiscount(
      subtotal,
      coupon.discountType,
      coupon.discountValue,
      coupon.maximumDiscount
    );

    return NextResponse.json({
      code: coupon.code,
      discount: Math.round(discount * 100) / 100,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
