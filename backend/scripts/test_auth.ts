import axios from 'axios';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5000';
const USER_EMAIL = 'test@example.com';
const USER_PASSWORD = 'password123';
const LOG_FILE = 'test_auth.log';

function log(message: string, ...args: any[]) {
    const line = message + (args.length ? ' ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') : '') + '\n';
    console.log(message, ...args);
    fs.appendFileSync(LOG_FILE, line);
}

function getCookieValue(cookieHeaders: string[], name: string): string {
    for (const cookie of cookieHeaders) {
        const parts = cookie.split(';')[0].split('=');
        if (parts[0].trim() === name) {
            return parts[1];
        }
    }
    return '';
}

async function testAuth() {
    if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
    log('--- Starting Auth Endpoints Test ---');

    let accessToken = '';
    let refreshToken = '';
    let csrfToken = '';

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
            const cookies = registerRes.headers['set-cookie'] || [];
            refreshToken = getCookieValue(cookies, 'refreshToken');
            csrfToken = getCookieValue(cookies, 'csrfToken');
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
        const loginCookies = loginRes.headers['set-cookie'] || [];
        refreshToken = getCookieValue(loginCookies, 'refreshToken');
        csrfToken = getCookieValue(loginCookies, 'csrfToken');

        // 3. Get Me (Authenticated)
        log('\n[3] Testing GET /auth/me...');
        const meRes = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        log('✅ Get Me success:', meRes.data);

        // 4. Refresh Token
        log('\n[4] Testing POST /auth/refresh...');
        const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
            headers: {
                Cookie: `refreshToken=${refreshToken}; csrfToken=${csrfToken}`,
                'X-CSRF-Token': csrfToken
            }
        });
        log('✅ Refresh success (got new tokens)');
        accessToken = refreshRes.data.accessToken;
        const refreshCookies = refreshRes.headers['set-cookie'] || [];
        refreshToken = getCookieValue(refreshCookies, 'refreshToken');
        csrfToken = getCookieValue(refreshCookies, 'csrfToken');

        // 5. Verify Me with new accessToken
        log('\n[5] Testing GET /auth/me with new token...');
        const meRes2 = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        log('✅ Get Me success with refreshed token');

        // 6. Logout
        log('\n[6] Testing POST /auth/logout...');
        const logoutRes = await axios.post(`${BASE_URL}/auth/logout`, {}, {
            headers: {
                Cookie: `refreshToken=${refreshToken}; csrfToken=${csrfToken}`,
                'X-CSRF-Token': csrfToken
            }
        });
        log('✅ Logout success:', logoutRes.data.message);

        // 7. Verify Refresh Token is invalidated
        log('\n[7] Testing POST /auth/refresh after logout (should fail)...');
        try {
            await axios.post(`${BASE_URL}/auth/refresh`, {}, {
                headers: {
                    Cookie: `refreshToken=${refreshToken}; csrfToken=${csrfToken}`,
                    'X-CSRF-Token': csrfToken
                }
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
