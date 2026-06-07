const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let refreshTokenCookie = '';
let csrfToken = '';
let accountId = '';
let transactionId = '';
let transferId = '';

const log = (msg, color = '\x1b[0m') => console.log(`${color}${msg}\x1b[0m`);
const green = '\x1b[32m';
const red = '\x1b[31m';
const cyan = '\x1b[36m';

/**
 * Parse a specific cookie value from the Set-Cookie response headers array.
 */
function getCookieValue(cookieHeaders, name) {
    if (!cookieHeaders) return '';
    for (const cookie of cookieHeaders) {
        const parts = cookie.split(';')[0].split('=');
        if (parts[0].trim() === name) {
            return parts.slice(1).join('=');
        }
    }
    return '';
}

async function runTests() {
    log('\n=== COMPREHENSIVE ENDPOINT VERIFICATION ===\n', cyan);

    try {
        // 1. Auth: Register
        log('Testing Auth: Register...');
        const regRes = await axios.post(`${BASE_URL}/auth/register`, {
            email: `finaltest${Date.now()}@example.com`,
            password: 'Test123456!',
            name: 'Final Test User'
        });
        authToken = regRes.data.accessToken || regRes.data.token;
        const regCookies = regRes.headers['set-cookie'] || [];
        refreshTokenCookie = getCookieValue(regCookies, 'refreshToken');
        csrfToken = getCookieValue(regCookies, 'csrfToken');
        log('✓ Register success', green);

        // 2. Auth: Me
        log('\nTesting Auth: Get Me...');
        const meRes = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log(`✓ Get Me success (User: ${meRes.data.name || meRes.data.email})`, green);

        // 3. Accounts: Create
        log('\nTesting Accounts: Create...');
        const accRes = await axios.post(`${BASE_URL}/accounts`,
            { name: 'Final Savings', type: 'SAVINGS' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        accountId = accRes.data.account.id;
        log(`✓ Create Account success (ID: ${accountId})`, green);

        // 4. Accounts: List
        log('\nTesting Accounts: List...');
        const accListRes = await axios.get(`${BASE_URL}/accounts`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log(`✓ List Accounts success (Count: ${accListRes.data.length})`, green);

        // 5. Accounts: Get By ID
        log('\nTesting Accounts: Get By ID...');
        const accGetRes = await axios.get(`${BASE_URL}/accounts/${accountId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log(`✓ Get Account success (Name: ${accGetRes.data.name})`, green);

        // 6. Transactions: Create
        log('\nTesting Transactions: Create...');
        const txRes = await axios.post(`${BASE_URL}/transactions`,
            { accountId, amount: 500, type: 'INCOME', description: 'Salary' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        transactionId = txRes.data.id;
        log(`✓ Create Transaction success (ID: ${transactionId})`, green);

        // 6.1. Transactions: Create another (for pagination test later)
        log('\nTesting Transactions: Create second transaction...');
        await axios.post(`${BASE_URL}/transactions`,
            { accountId, amount: 250, type: 'EXPENSE', description: 'Groceries' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        log(`✓ Create Second Transaction success`, green);

        // 7. Transactions: List (History)
        log('\nTesting Transactions: List History (Query Params)...');
        const txListRes = await axios.get(`${BASE_URL}/transactions/accounts/${accountId}/history?limit=10`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log(`✓ List Transactions success (Count: ${txListRes.data.data.length})`, green);

        // 8. Transactions: Balance
        log('\nTesting Transactions: Balance...');
        const balRes = await axios.get(`${BASE_URL}/transactions/accounts/${accountId}/balance`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log(`✓ Get Balance success (Balance: ${balRes.data.balance})`, green);

        // 9. Transfers: Create
        log('\nTesting Transfers: Create...');
        const acc2Res = await axios.post(`${BASE_URL}/accounts`,
            { name: 'Final Cash', type: 'CASH' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        const accountId2 = acc2Res.data.account.id;
        const xferRes = await axios.post(`${BASE_URL}/transfers`,
            { fromAccountId: accountId, toAccountId: accountId2, amount: 100, description: 'Test Xfer' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        transferId = xferRes.data.transferId;
        log(`✓ Create Transfer success (ID: ${transferId})`, green);

        // 10. Transfers: List History
        log('\nTesting Transfers: List History...');
        const xferListRes = await axios.get(`${BASE_URL}/transfers`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log(`✓ List Transfers success (Count: ${xferListRes.data.data.length})`, green);

        // 11. Feed: List Unified
        log('\nTesting Feed: List Unified (Query Params)...');
        const feedRes = await axios.get(`${BASE_URL}/feed?limit=20`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log(`✓ List Feed success (Count: ${feedRes.data.items.length})`, green);

        // 12. Feed: Advanced Filters (Category & Amount)
        log('\nTesting Feed: Advanced Filters...');
        const validCategoryId = '2e8594e8-915c-4804-972a-9affd670f321'; // Valid ID from DB seeding

        // 12.1 Category Filter
        log('  Testing Category Filter...');
        await axios.get(`${BASE_URL}/feed?kind=TRANSACTION&categoryId=${validCategoryId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log('  ✓ Category filter successful', green);

        // 12.2 Amount Range Filter
        log('  Testing Amount Range Filter (minAmount=60 & maxAmount=600)...');
        const rangeFeedRes = await axios.get(`${BASE_URL}/feed?minAmount=60&maxAmount=600`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (!rangeFeedRes.data.items.every(i => Number(i.amount) >= 60 && Number(i.amount) <= 600)) {
            throw new Error('Amount range filter failed verification');
        }
        log('  ✓ Amount range filter successful', green);

        // 13. Feed: Cursor continuation
        log('\nTesting Feed: Cursor Continuation...');
        const page1 = await axios.get(
            `${BASE_URL}/feed?limit=2`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (!page1.data.nextCursor) {
            throw new Error("Expected nextCursor on page 1");
        }

        const page2 = await axios.get(
            `${BASE_URL}/feed?limit=2&cursor=${encodeURIComponent(page1.data.nextCursor)}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        const allItems = [...page1.data.items, ...page2.data.items];
        const ids = allItems.map((i) => i.kind === "TRANSACTION" ? i.id : i.transferId);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
            throw new Error("Duplicate items detected across pages");
        }

        for (let i = 1; i < allItems.length; i++) {
            const prev = allItems[i - 1];
            const curr = allItems[i];
            if (new Date(prev.createdAt) < new Date(curr.createdAt)) {
                throw new Error("Feed order violated");
            }
        }

        log('✓ Feed cursor pagination verified (no duplicates, stable order)', green);

        // 14. Auth: Refresh (using HttpOnly cookie + CSRF token)
        log('\nTesting Auth: Refresh Token...');
        log(`  Using CSRF Token: ${csrfToken ? (csrfToken.substring(0, 10) + '...') : 'MISSING'}`);
        const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
            headers: {
                Cookie: `refreshToken=${refreshTokenCookie}; csrfToken=${csrfToken}`,
                'X-CSRF-Token': csrfToken,
            }
        });
        const refreshCookies = refreshRes.headers['set-cookie'] || [];
        refreshTokenCookie = getCookieValue(refreshCookies, 'refreshToken') || refreshTokenCookie;
        csrfToken = getCookieValue(refreshCookies, 'csrfToken') || csrfToken;
        log('✓ Refresh Token success', green);

        // 15. Transactions: Delete
        log('\nTesting Transactions: Delete...');
        await axios.delete(`${BASE_URL}/transactions/${transactionId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log('✓ Delete Transaction success', green);

        // 16. Accounts: Delete (Soft)
        log('\nTesting Accounts: Delete...');
        await axios.delete(`${BASE_URL}/accounts/${accountId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log('✓ Delete Account success', green);

        // 17. Auth: Logout (using HttpOnly cookie + CSRF token)
        log('\nTesting Auth: Logout...');
        await axios.post(`${BASE_URL}/auth/logout`, {}, {
            headers: {
                Authorization: `Bearer ${authToken}`,
                Cookie: `refreshToken=${refreshTokenCookie}; csrfToken=${csrfToken}`,
                'X-CSRF-Token': csrfToken,
            }
        });
        log('✓ Logout success', green);

        log('\nALL ENDPOINTS VERIFIED SUCCESSFULLY!\n', cyan);
    } catch (error) {
        log(`\nTEST FAILED: ${error.message}`, red);
        if (error.response) {
            log(`Status: ${error.response.status}`, red);
            log(`Data: ${JSON.stringify(error.response.data, null, 2)}`, red);
        }
        process.exit(1);
    }
}

runTests();
