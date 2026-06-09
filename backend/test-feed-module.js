const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let accountId1 = '';
let accountId2 = '';
let txId1 = '';
let txId2 = '';
let transferId = '';

const log = (msg, color = '\x1b[0m') => console.log(`${color}${msg}\x1b[0m`);
const green = '\x1b[32m';
const red = '\x1b[31m';
const cyan = '\x1b[36m';

async function runFeedTests() {
    log('\n=== FEED MODULE TESTS ===\n', cyan);

    try {
        // --- Setup: Register + Accounts ---
        const regRes = await axios.post(`${BASE_URL}/auth/register`, {
            email: `feedtest${Date.now()}@example.com`,
            password: 'Test123!',
            name: 'Feed Tester'
        });
        authToken = regRes.data.accessToken || regRes.data.token;

        const accRes1 = await axios.post(`${BASE_URL}/accounts`,
            { name: 'Savings', type: 'SAVINGS' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        accountId1 = accRes1.data.account.id;

        const accRes2 = await axios.post(`${BASE_URL}/accounts`,
            { name: 'Cash', type: 'CASH' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        accountId2 = accRes2.data.account.id;

        // --- 1️⃣ Create Transactions + Transfers ---
        const tx1 = await axios.post(`${BASE_URL}/transactions`,
            { accountId: accountId1, amount: 100, type: 'INCOME', description: 'Tx 1' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        txId1 = tx1.data.id;

        const tx2 = await axios.post(`${BASE_URL}/transactions`,
            { accountId: accountId1, amount: 200, type: 'EXPENSE', description: 'Tx 2' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        txId2 = tx2.data.id;

        const xfer = await axios.post(`${BASE_URL}/transfers`,
            { fromAccountId: accountId1, toAccountId: accountId2, amount: 150, description: 'Transfer 1' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        transferId = xfer.data.transferId;

        // --- 2️⃣ Feed Ordering Test ---
        const feedRes = await axios.get(`${BASE_URL}/feed?limit=10`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const items = feedRes.data.items;

        log(`Feed Ordering Test: ${items.map(i => i.kind + ':' + (i.id || i.transferId)).join(' | ')}`, cyan);
        if (!(items[0].createdAt >= items[1]?.createdAt)) throw new Error('Feed ordering failed');
        log('✓ Feed ordering verified', green);

        // --- 3️⃣ Transfer Grouping Test ---
        const transferItems = items.filter(i => i.kind === 'TRANSFER');
        if (transferItems.length !== 1) throw new Error('Transfer grouping failed');
        log('✓ Transfer grouping verified', green);

        // --- 4️⃣ Cursor Continuation Test ---
        const page1 = await axios.get(`${BASE_URL}/feed?limit=2`, { headers: { Authorization: `Bearer ${authToken}` } });
        const nextCursor = page1.data.nextCursor;
        if (!nextCursor) throw new Error('Next cursor missing on page 1');

        const page2 = await axios.get(`${BASE_URL}/feed?limit=2&cursor=${encodeURIComponent(nextCursor)}`, { headers: { Authorization: `Bearer ${authToken}` } });
        // Ensure no duplicates across pages
        const idsPage1 = page1.data.items.map(i => i.id || i.transferId);
        const idsPage2 = page2.data.items.map(i => i.id || i.transferId);
        if (idsPage1.some(id => idsPage2.includes(id))) throw new Error('Duplicate items across pages');
        log('✓ Cursor pagination verified (no duplicates, stable order)', green);

        // --- 5️⃣ Filtered Feed Test ---
        const txOnly = await axios.get(`${BASE_URL}/feed?kind=TRANSACTION`, { headers: { Authorization: `Bearer ${authToken}` } });
        if (!txOnly.data.items.every(i => i.kind === 'TRANSACTION')) throw new Error('Kind filter failed');
        log('✓ Feed kind filter verified', green);

        const xferOnly = await axios.get(`${BASE_URL}/feed?kind=TRANSFER`, { headers: { Authorization: `Bearer ${authToken}` } });
        if (!xferOnly.data.items.every(i => i.kind === 'TRANSFER')) throw new Error('Kind filter failed');
        log('✓ Transfer kind filter verified', green);

        log('\nALL FEED TESTS PASSED ✅\n', cyan);

    } catch (err) {
        log(`\nFEED TEST FAILED: ${err.message}`, red);
        if (err.response) {
            log(`Status: ${err.response.status}`, red);
            log(`Data: ${JSON.stringify(err.response.data, null, 2)}`, red);
        }
        process.exit(1);
    }
}

runFeedTests();
