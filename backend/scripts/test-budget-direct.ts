import { prisma } from "../src/config/prisma";
import {
  setMonthlyBudgetService,
  getBudgetsService,
  getBudgetByIdService,
  deleteBudgetService,
} from "../src/services/budget.service";

async function run() {
  console.log("=== RUNNING DIRECT BUDGET SERVICE TESTS ===");

  // 1. Setup: find or create a user and a category
  let user = await prisma.user.findFirst({
    where: { email: "budget-test-user@example.com" }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "budget-test-user@example.com",
        passwordHash: "dummy-hash",
      }
    });
    console.log(`Created test user: ${user.email}`);
  } else {
    console.log(`Using existing test user: ${user.email}`);
  }

  const category = await prisma.category.findFirst({
    where: { name: "Food" }
  });

  if (!category) {
    throw new Error("Food category not found in DB. Please run prisma seed first.");
  }
  console.log(`Using category: ${category.name} (${category.id})`);

  // Cleanup any old budgets for this test user to start clean
  await prisma.budget.deleteMany({
    where: { userId: user.id }
  });

  // 2. Test Create (Upsert)
  console.log("\nTesting setMonthlyBudgetService (Create)...");
  const budget = await setMonthlyBudgetService(user.id, category.id, "2026-05", 500.00);
  console.log("✓ Budget created successfully:", budget);

  if (Number(budget.amount) !== 500) {
    throw new Error(`Expected amount 500, got ${budget.amount}`);
  }

  // 3. Test Update (Upsert)
  console.log("\nTesting setMonthlyBudgetService (Update)...");
  const updatedBudget = await setMonthlyBudgetService(user.id, category.id, "2026-05", 750.50);
  console.log("✓ Budget updated successfully:", updatedBudget);

  if (Number(updatedBudget.amount) !== 750.50) {
    throw new Error(`Expected amount 750.50, got ${updatedBudget.amount}`);
  }

  // 4. Test List
  console.log("\nTesting getBudgetsService...");
  const budgets = await getBudgetsService(user.id);
  console.log(`✓ Budgets listed successfully (count: ${budgets.length})`);
  if (budgets.length !== 1) {
    throw new Error(`Expected 1 budget, got ${budgets.length}`);
  }

  // 5. Test Get By ID
  console.log("\nTesting getBudgetByIdService...");
  const fetchedBudget = await getBudgetByIdService(user.id, budget.id);
  console.log("✓ Budget fetched by ID successfully:", fetchedBudget);
  if (fetchedBudget.id !== budget.id) {
    throw new Error("Fetched budget ID mismatch");
  }

  // 6. Test Delete
  console.log("\nTesting deleteBudgetService...");
  await deleteBudgetService(user.id, budget.id);
  console.log("✓ Budget deleted successfully");

  // Verify deletion
  const budgetsAfterDelete = await getBudgetsService(user.id);
  if (budgetsAfterDelete.length !== 0) {
    throw new Error("Expected 0 budgets after deletion");
  }

  console.log("\nALL DIRECT SERVICE TESTS PASSED! 🎉");
}

run()
  .catch((err) => {
    console.error("❌ TEST FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
