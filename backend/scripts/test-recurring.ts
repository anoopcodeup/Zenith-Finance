import { redis } from "../src/config/redis";
// Stub Redis client methods to prevent network connection hangs inside sandbox
redis.keys = async () => [];
redis.del = async () => 0;
redis.get = async () => null;
redis.setex = async () => "OK";
redis.ping = async () => "PONG";

import { prisma } from "../src/config/prisma";
import {
  createRecurringService,
  listRecurringService,
  getRecurringByIdService,
  updateRecurringService,
  pauseRecurringService,
  resumeRecurringService,
  deleteRecurringService,
  processDueRecurringTransactionsService,
} from "../src/services/recurringTransaction.service";
import { AccountType, TransactionType } from "@prisma/client";


async function run() {
  console.log("=== RUNNING RECURRING TRANSACTIONS INTEGRATION TESTS ===");

  // 1. Setup User and Account
  let user = await prisma.user.findFirst({
    where: { email: "recurring-test-user@example.com" },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "recurring-test-user@example.com",
        passwordHash: "dummy-hash",
      },
    });
    console.log(`Created test user: ${user.email}`);
  } else {
    console.log(`Using existing test user: ${user.email}`);
  }

  let account = await prisma.account.findFirst({
    where: { userId: user.id, name: "Recurring Wallet" },
  });

  if (!account) {
    account = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Recurring Wallet",
        type: AccountType.SAVINGS,
      },
    });
    console.log(`Created test account: ${account.name}`);
  } else {
    console.log(`Using existing test account: ${account.name}`);
  }

  const category = await prisma.category.findFirst({
    where: { name: "Food" },
  });

  if (!category) {
    throw new Error("Food category not found in DB. Please run prisma seed first.");
  }

  // Cleanup old recurring templates and transactions for clean slate
  await prisma.recurringTransaction.deleteMany({
    where: { userId: user.id },
  });
  await prisma.transaction.deleteMany({
    where: { userId: user.id },
  });

  // 2. Test Create
  console.log("\nTesting createRecurringService (Daily)...");
  // Set start date to yesterday to ensure it is due for execution
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const recurring = await createRecurringService(user.id, {
    accountId: account.id,
    amount: 15.99,
    type: TransactionType.EXPENSE,
    categoryId: category.id,
    description: "Daily Spotify Subscription",
    frequency: "DAILY",
    startDate: yesterday,
  });
  console.log("✓ Recurring transaction template created:", recurring);

  if (recurring.frequency !== "DAILY" || Number(recurring.amount) !== 15.99) {
    throw new Error("Created template field mismatch");
  }

  // 3. Test List
  console.log("\nTesting listRecurringService...");
  const list = await listRecurringService(user.id);
  console.log(`✓ Templates listed successfully (count: ${list.length})`);
  if (list.length !== 1) {
    throw new Error(`Expected 1 template, got ${list.length}`);
  }

  // 4. Test Fetch By ID
  console.log("\nTesting getRecurringByIdService...");
  const fetched = await getRecurringByIdService(recurring.id, user.id);
  console.log("✓ Template fetched successfully:", fetched.id);

  // 5. Test Update
  console.log("\nTesting updateRecurringService...");
  const updated = await updateRecurringService(recurring.id, user.id, {
    description: "Updated Spotify Note",
    amount: 19.99,
  });
  console.log("✓ Template updated successfully:", updated.description, updated.amount);
  if (Number(updated.amount) !== 19.99 || updated.description !== "Updated Spotify Note") {
    throw new Error("Update failed to apply");
  }

  // 6. Test Pause
  console.log("\nTesting pauseRecurringService...");
  const paused = await pauseRecurringService(recurring.id, user.id);
  console.log("✓ Template paused successfully. Active status:", paused.active);
  if (paused.active !== false) {
    throw new Error("Pause failed to set active=false");
  }

  // 7. Test Resume
  console.log("\nTesting resumeRecurringService...");
  const resumed = await resumeRecurringService(recurring.id, user.id);
  console.log("✓ Template resumed successfully. Active status:", resumed.active);
  if (resumed.active !== true) {
    throw new Error("Resume failed to set active=true");
  }

  // 8. Test Execution Job & Idempotency
  console.log("\nTesting processDueRecurringTransactionsService (Running Daily Cron)...");
  
  // Set nextRunAt in database explicitly to yesterday to ensure it is due for the run
  await prisma.recurringTransaction.update({
    where: { id: recurring.id },
    data: { nextRunAt: yesterday },
  });

  const countProcessed = await processDueRecurringTransactionsService();
  console.log(`✓ Daily runner executed successfully. Count processed: ${countProcessed}`);
  if (countProcessed !== 1) {
    throw new Error(`Expected 1 template processed, got ${countProcessed}`);
  }

  // Verify a standard ledger transaction was created
  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
  });
  console.log(`✓ Transactions in ledger: ${transactions.length}`);
  if (transactions.length !== 1) {
    throw new Error(`Expected 1 transaction in ledger, got ${transactions.length}`);
  }
  console.log("Created ledger transaction:", transactions[0]);
  if (Number(transactions[0].amount) !== 19.99) {
    throw new Error("Ledger transaction amount is incorrect");
  }

  // Verify that the recurring template pointers advanced
  const afterRunTemplate = await getRecurringByIdService(recurring.id, user.id);
  console.log("Pointers after run - nextRunAt:", afterRunTemplate.nextRunAt, "lastRunAt:", afterRunTemplate.lastRunAt);
  if (!afterRunTemplate.lastRunAt) {
    throw new Error("lastRunAt should be set");
  }

  // Test Idempotency: run scheduler again. Since nextRunAt has advanced to the future, it shouldn't process it.
  // What if we force nextRunAt to yesterday again, but the idempotency key was already completed in the database?
  console.log("\nTesting Idempotency: forcing due run with same date...");
  await prisma.recurringTransaction.update({
    where: { id: recurring.id },
    data: { nextRunAt: yesterday }, // reset to same run date
  });

  // Run the scheduler again. It should attempt to run it, but the nested createTransaction using the same derived idempotency key should deduplicate it.
  const countProcessedDuplicate = await processDueRecurringTransactionsService();
  console.log(`✓ Runner ran duplicate. Count processed: ${countProcessedDuplicate}`);
  
  const transactionsAfterDup = await prisma.transaction.findMany({
    where: { userId: user.id },
  });
  console.log(`✓ Transactions in ledger after duplicate run: ${transactionsAfterDup.length}`);
  if (transactionsAfterDup.length !== 1) {
    throw new Error("DEDUPLICATION FAILED: Stored a duplicate transaction in ledger!");
  }
  console.log("✓ Idempotency protection successfully blocked duplicate ledger entry.");

  // 9. Test Delete
  console.log("\nTesting deleteRecurringService...");
  await deleteRecurringService(recurring.id, user.id);
  console.log("✓ Template deleted successfully");

  try {
    await getRecurringByIdService(recurring.id, user.id);
    throw new Error("Expected template to be deleted, but it was found");
  } catch (err: any) {
    if (err.statusCode === 404) {
      console.log("✓ Fetch deleted template returned 404 correctly");
    } else {
      throw err;
    }
  }

  console.log("\nALL RECURRING TRANSACTIONS SERVICE TESTS PASSED! 🎉");
}

run()
  .catch((err) => {
    console.error("❌ TEST FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
