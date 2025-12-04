/**
 * Quick test script to verify the spin API works with multi-category selection
 * Run with: npx tsx scripts/test-spin-api.ts
 */

async function testSpinAPI() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  
  console.log("🧪 Testing Spin API with multi-category selection...\n");
  
  // Test 1: Single category (backwards compatibility)
  console.log("Test 1: Single category (breakfast)");
  try {
    const res1 = await fetch(`${baseUrl}/api/spin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "breakfast",
        dishCount: 1,
      }),
    });
    const data1 = await res1.json();
    console.log(`   Status: ${res1.status}`);
    console.log(`   Selection count: ${data1.selection?.length || 0}`);
    if (data1.selection?.[0]) {
      console.log(`   First dish: ${data1.selection[0].name} (${data1.selection[0].category})`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
  
  console.log("\nTest 2: Multiple categories (breakfast + lunch)");
  try {
    const res2 = await fetch(`${baseUrl}/api/spin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categories: ["breakfast", "lunch"],
        dishCount: 2,
      }),
    });
    const data2 = await res2.json();
    console.log(`   Status: ${res2.status}`);
    console.log(`   Selection count: ${data2.selection?.length || 0}`);
    if (data2.selection) {
      data2.selection.forEach((d: any, i: number) => {
        console.log(`   Dish ${i + 1}: ${d.name} (${d.category})`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
  
  console.log("\nTest 3: All categories");
  try {
    const res3 = await fetch(`${baseUrl}/api/spin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categories: ["breakfast", "lunch", "dinner", "dessert"],
        dishCount: 3,
      }),
    });
    const data3 = await res3.json();
    console.log(`   Status: ${res3.status}`);
    console.log(`   Selection count: ${data3.selection?.length || 0}`);
    if (data3.selection) {
      const categories = [...new Set(data3.selection.map((d: any) => d.category))];
      console.log(`   Categories in result: ${categories.join(", ")}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
  
  console.log("\n✅ API tests complete!");
  console.log("\n💡 Note: If you see errors, make sure the dev server is running:");
  console.log("   npm run dev");
}

testSpinAPI();

