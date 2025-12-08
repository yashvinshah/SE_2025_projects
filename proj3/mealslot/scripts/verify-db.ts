import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

// Try to load .env file manually
try {
  const envPath = resolve(process.cwd(), ".env");
  const envFile = readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  // .env file doesn't exist, that's okay
}

// Set default DATABASE_URL if not set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./prisma/dev.db";
  console.log("⚠️  DATABASE_URL not set, using default: file:./prisma/dev.db");
}

const prisma = new PrismaClient();

async function verify() {
  try {
    console.log("🔍 Verifying database connection...");
    
    // Check dish count
    const dishCount = await prisma.dish.count();
    console.log(`✅ Total dishes in database: ${dishCount}`);
    
    // Check dishes by category
    const byCategory = await prisma.dish.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { category: "asc" },
    });
    
    console.log("\n📊 Dishes by category:");
    byCategory.forEach(({ category, _count }) => {
      console.log(`   ${category}: ${_count.category}`);
    });
    
    // Sample a few dishes
    console.log("\n🍽️  Sample dishes:");
    const samples = await prisma.dish.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        category: true,
        tags: true,
        allergens: true,
      },
    });
    
    samples.forEach((d) => {
      console.log(`   - ${d.name} (${d.category})`);
      console.log(`     Tags: ${d.tags}`);
      console.log(`     Allergens: ${d.allergens}`);
    });
    
    // Test query for specific categories
    console.log("\n🔎 Testing category queries:");
    const breakfast = await prisma.dish.findMany({
      where: { category: "breakfast" },
      take: 3,
    });
    console.log(`   Breakfast dishes found: ${breakfast.length}`);
    
    const lunch = await prisma.dish.findMany({
      where: { category: "lunch" },
      take: 3,
    });
    console.log(`   Lunch dishes found: ${lunch.length}`);
    
    const dinner = await prisma.dish.findMany({
      where: { category: "dinner" },
      take: 3,
    });
    console.log(`   Dinner dishes found: ${dinner.length}`);
    
    const dessert = await prisma.dish.findMany({
      where: { category: "dessert" },
      take: 3,
    });
    console.log(`   Dessert dishes found: ${dessert.length}`);
    
    // Test multi-category query
    const multi = await prisma.dish.findMany({
      where: {
        category: { in: ["breakfast", "lunch"] },
      },
      take: 5,
    });
    console.log(`\n   Multi-category (breakfast + lunch): ${multi.length} dishes found`);
    
    console.log("\n✅ Database verification complete!");
    
  } catch (error) {
    console.error("❌ Database verification failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();

