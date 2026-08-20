import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create Admin
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@khajaghar.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@khajaghar.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Create Customer
  const customerPassword = await bcrypt.hash("password123", 10);
  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "customer@example.com",
      password: customerPassword,
      phone: "9800000000",
      role: "CUSTOMER",
    },
  });

  // Create Restaurant Owner
  const ownerPassword = await bcrypt.hash("owner123", 10);
  const owner = await prisma.user.upsert({
    where: { email: "owner@restaurant.com" },
    update: {},
    create: {
      name: "Jane Smith",
      email: "owner@restaurant.com",
      password: ownerPassword,
      phone: "9811111111",
      role: "RESTAURANT_OWNER",
    },
  });

  // Create Restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "momo-magic" },
    update: {},
    create: {
      name: "Momo Magic",
      slug: "momo-magic",
      description: "The best authentic Nepali momos in town.",
      address: {
        create: {
          street: "Thamel",
          city: "Kathmandu",
          latitude: 27.7172,
          longitude: 85.3240,
        },
      },
      phone: "01-4444444",
      cuisine: ["Nepali", "Fast Food"],
      minOrder: 300,
      deliveryFee: 50,
      avgDeliveryTime: 30,
      rating: 4.8,
      reviewCount: 120,
      isApproved: true,
      isActive: true,
      ownerId: owner.id,
      logo: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=800&q=80",
    },
  });

  // Create Category
  const category = await prisma.foodCategory.upsert({
    where: { id: "seed-momos" },
    update: {},
    create: {
      id: "seed-momos",
      name: "Momos",
      slug: "momos",
    },
  });

  // Create Food Items
  await prisma.foodItem.create({
    data: {
      name: "Chicken Steam Momo",
      description: "Steamed dumplings filled with minced chicken and spices.",
      price: 250,
      image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isVegetarian: false,
      restaurantId: restaurant.id,
      categoryId: category.id,
    },
  });

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
