const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let categoryId = '';
let budgetId = '';

const log = (msg, color = '\x1b[0m') => console.log(`${color}${msg}\x1b[0m`);
const green = '\x1b[32m';
const red = '\x1b[31m';
const cyan = '\x1b[36m';

async function runBudgetTests() {
    log('\n=== BUDGET CRUD TESTS ===\n', cyan);

    try {
        // 1. Setup: Register user to get fresh auth token
        log('Registering test user...');
        const email = `budgettest${Date.now()}@example.com`;
        const regRes = await axios.post(`${BASE_URL}/auth/register`, {
            email,
            password: 'TestPassword123!',
            name: 'Budget Tester'
        });
        authToken = regRes.data.accessToken || regRes.data.token;
        log('✓ User registered successfully', green);

        // 2. Fetch Category ID to set budget on
        log('\nFetching categories...');
        // We'll create a custom category for the user so we know it exists and belongs to the user
        // Wait, does Zenith2 have a route to create/get categories? 
        // Let's check routes. In schema, category has unique constraint on [userId, name].
        // Let's see if we can get database client directly or if we can use a query to seed.
        // Actually, we can fetch all categories from the user profile or reporting or transactions.
        // Or wait, is there a category router? Let's check routes directory.
        // We listed routes earlier: account, auditLogs, auth, feed, reporting, transaction, transfer.
        // There is no category route! 
        // Let's check if creating a transaction creates a category or if we can just query the database via prisma to get a category ID.
        // Since we are running on the user's local machine, we can import prisma client in our test script, or we can use a direct prisma lookup inside the script!
        // Yes, we can import prisma from '../src/config/prisma' but we are writing a plain Node script.
        // Let's fetch a category ID directly from the database using Prisma to keep it easy!
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        // Find a global category (e.g., Food)
        const category = await prisma.category.findFirst({
            where: { name: 'Food' }
        });
        
        if (!category) {
            throw new Error("Could not find global 'Food' category in database. Please run prisma seed first.");
        }
        categoryId = category.id;
        log(`✓ Found category 'Food' with ID: ${categoryId}`, green);
        await prisma.$disconnect();

        // 3. Test: Upsert budget (Create)
        log('\nTesting: Create Budget (POST /budgets)...');
        const setRes = await axios.post(`${BASE_URL}/budgets`, {
            categoryId,
            month: '2026-05',
            amount: 500.00
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        budgetId = setRes.data.budget.id;
        log(`✓ Create Budget success (ID: ${budgetId}, Amount: ${setRes.data.budget.amount})`, green);

        // 4. Test: Upsert budget (Update/Replace)
        log('\nTesting: Update Budget (POST /budgets)...');
        const updateRes = await axios.post(`${BASE_URL}/budgets`, {
            categoryId,
            month: '2026-05',
            amount: 750.50
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log(`✓ Update Budget success (Amount: ${updateRes.data.budget.amount})`, green);
        if (Number(updateRes.data.budget.amount) !== 750.50) {
            throw new Error(`Expected updated amount to be 750.50, got ${updateRes.data.budget.amount}`);
        }

        // 5. Test: List budgets (GET /budgets)
        log('\nTesting: List Budgets (GET /budgets)...');
        const listRes = await axios.get(`${BASE_URL}/budgets`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log(`✓ List Budgets success (Count: ${listRes.data.budgets.length})`, green);
        if (listRes.data.budgets.length < 1) {
            throw new Error('Expected at least one budget in response');
        }

        // 6. Test: List budgets filtered by month (GET /budgets?month=2026-05)
        log('\nTesting: List Budgets filtered by month (GET /budgets?month=2026-05)...');
        const listMonthRes = await axios.get(`${BASE_URL}/budgets?month=2026-05`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log(`✓ Filtered List success (Count: ${listMonthRes.data.budgets.length})`, green);
        if (!listMonthRes.data.budgets.every(b => b.month === '2026-05')) {
            throw new Error('Filtered list returned budgets with incorrect month');
        }

        // 7. Test: Get Budget by ID (GET /budgets/:budgetId)
        log('\nTesting: Get Budget by ID (GET /budgets/:budgetId)...');
        const getRes = await axios.get(`${BASE_URL}/budgets/${budgetId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log(`✓ Get Budget by ID success (ID: ${getRes.data.budget.id}, Amount: ${getRes.data.budget.amount})`, green);
        if (getRes.data.budget.id !== budgetId) {
            throw new Error('Get budget by ID returned mismatching ID');
        }

        // 8. Test: Reject Invalid Month Format
        log('\nTesting: Validation checks (invalid month)...');
        try {
            await axios.post(`${BASE_URL}/budgets`, {
                categoryId,
                month: '2026-5', // invalid YYYY-MM format
                amount: 100
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            throw new Error('Expected invalid month format to fail, but it succeeded');
        } catch (err) {
            if (err.response && err.response.status === 400) {
                log('✓ Invalid month format rejected correctly with 400', green);
            } else {
                throw err;
            }
        }

        // 9. Test: Reject Negative Amount
        log('\nTesting: Validation checks (negative amount)...');
        try {
            await axios.post(`${BASE_URL}/budgets`, {
                categoryId,
                month: '2026-05',
                amount: -100
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            throw new Error('Expected negative amount to fail, but it succeeded');
        } catch (err) {
            if (err.response && err.response.status === 400) {
                log('✓ Negative amount rejected correctly with 400', green);
            } else {
                throw err;
            }
        }

        // 10. Test: Delete Budget (DELETE /budgets/:budgetId)
        log('\nTesting: Delete Budget (DELETE /budgets/:budgetId)...');
        const delRes = await axios.delete(`${BASE_URL}/budgets/${budgetId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log(`✓ Delete Budget success (Status: ${delRes.status})`, green);

        // 11. Test: Verify budget is deleted (GET /budgets/:budgetId should fail with 404)
        log('\nTesting: Verify budget is deleted...');
        try {
            await axios.get(`${BASE_URL}/budgets/${budgetId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            throw new Error('Expected deleted budget to return 404, but it succeeded');
        } catch (err) {
            if (err.response && err.response.status === 404) {
                log('✓ Deleted budget returned 404 correctly', green);
            } else {
                throw err;
            }
        }

        log('\nALL BUDGET CRUD TESTS PASSED ✅\n', cyan);
        process.exit(0);

    } catch (err) {
        log(`\nBUDGET TEST FAILED: ${err.message}`, red);
        if (err.response) {
            log(`Status: ${err.response.status}`, red);
            log(`Data: ${JSON.stringify(err.response.data, null, 2)}`, red);
        }
        process.exit(1);
    }
}

runBudgetTests();
