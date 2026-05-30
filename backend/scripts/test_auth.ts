import axios from 'axios';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const USER_EMAIL = 'test@example.com';
const USER_PASSWORD = 'password123';
const LOG_FILE = 'test_auth.log';

function log(message: string, ...args: any[]) {
    const line = message + (args.length ? ' ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') : '') + '\n';
    console.log(message, ...args);
    fs.appendFileSync(LOG_FILE, line);
}

async function testAuth() {
    if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
    log('--- Starting Auth Endpoints Test ---');

    let accessToken = '';
    let refreshToken = '';

    try {
        // 1. Register User
        log('\n[1] Testing POST /auth/register...');
        try {
            const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
                email: USER_EMAIL,
                password: USER_PASSWORD,
            });
            log('✅ Registration success:', registerRes.data.message);
            accessToken = registerRes.data.accessToken;
            refreshToken = registerRes.data.refreshToken;
        } catch (error: any) {
            if (error.response?.status === 409) {
                log('ℹ️ User already exists, proceeding to login.');
            } else {
                log('❌ Registration failed:', error.response?.data || error.message);
            }
        }

        // 2. Login User
        log('\n[2] Testing POST /auth/login...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: USER_EMAIL,
            password: USER_PASSWORD,
        });
        log('✅ Login success:', loginRes.data.message);
        accessToken = loginRes.data.accessToken;
        refreshToken = loginRes.data.refreshToken;

        // 3. Get Me (Authenticated)
        log('\n[3] Testing GET /auth/me...');
        const meRes = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        log('✅ Get Me success:', meRes.data.user);

        // 4. Refresh Token
        log('\n[4] Testing POST /auth/refresh...');
        const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken: refreshToken,
        });
        log('✅ Refresh success (got new tokens)');
        accessToken = refreshRes.data.accessToken;
        refreshToken = refreshRes.data.refreshToken;

        // 5. Verify Me with new accessToken
        log('\n[5] Testing GET /auth/me with new token...');
        const meRes2 = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        log('✅ Get Me success with refreshed token');

        // 6. Logout
        log('\n[6] Testing POST /auth/logout...');
        const logoutRes = await axios.post(`${BASE_URL}/auth/logout`, {
            refreshToken: refreshToken,
        });
        log('✅ Logout success:', logoutRes.data.message);

        // 7. Verify Refresh Token is invalidated
        log('\n[7] Testing POST /auth/refresh after logout (should fail)...');
        try {
            await axios.post(`${BASE_URL}/auth/refresh`, {
                refreshToken: refreshToken,
            });
            log('❌ Refresh worked after logout! (Bug)');
        } catch (error: any) {
            log('✅ Refresh failed as expected:', error.response?.data?.error || error.message);
        }

    } catch (error: any) {
        log('❌ Test failed unexpectedly:');
        if (error.response) {
            log('Status:', error.response.status);
            log('Data:', error.response.data);
        } else {
            log('Message:', error.message);
        }
    }

    console.log('\n--- Auth Endpoints Test Completed ---');
}

testAuth();
