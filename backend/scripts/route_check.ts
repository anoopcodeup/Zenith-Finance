import fetch from 'node-fetch';

const baseUrl = 'http://localhost:3000';

const endpoints = [
  '/auth',
  '/accounts',
  '/transactions',
  '/transfers',
  '/feed',
  '/reports',
  '/budgets',
  '/recurring-transactions',
  '/health',
];

async function check() {
  for (const ep of endpoints) {
    try {
      const res = await fetch(`${baseUrl}${ep}`, { method: 'GET' });
      console.log(`${ep}: ${res.status}`);
    } catch (err) {
      console.error(`${ep}: error`, err);
    }
  }
}

check();
