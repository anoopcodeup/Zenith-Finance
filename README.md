# 🌌 Zenith2 Ledger API

Zenith2 is a high-performance, double-entry ledger and personal finance tracking backend built with **Node.js, TypeScript, Express, Prisma (PostgreSQL)**, and **Redis**. It is engineered for correctness, strict transactional safety, rate limiting, and background-queued notifications.

---

## 🚀 Key Features & Architecture Highlights

*   **⚖️ Double-Entry Ledger (Atomic Transfers):** Implements dual-leg transfers (debit/credit transactions sharing a `transferId`) using database-level pessimistic locking (`SELECT ... FOR UPDATE` in deterministic sorted order) to protect against concurrency race conditions.
*   **🛡️ Idempotent Operations:** Critical write operations (e.g., transaction creation, transfers) are protected by a middleware-integrated idempotency key layer to prevent duplicate requests.
*   **🕒 Asynchronous Queueing (BullMQ & Redis):** Heavy tasks—such as budget compliance evaluations, notification delivery with automatic backoffs, and month-end summaries—are offloaded to Redis-backed background workers.
*   **📰 Unified Activity Feed:** Provides a single, unified chronologically sorted ledger feed that dynamically groups dual-leg transfer transactions into clean virtual transfer records. Employs stable base64-encoded cursor pagination (`createdAt | id`).
*   **⚡ Performance Caching:** Caches financial reports and category breakdowns in Redis (10m TTL) with proactive invalidation triggers hooked into transaction write operations.
*   **🛡️ Administrative Auditing:** Features a write-only audit logger decoupled from foreign key constraints for sub-millisecond writes, exposed via a token-secured admin API.

---

## 🛠️ Tech Stack & Directory Structure

This repository is organized as a monorepo containing both the backend service and the frontend web application:

```text
Zenith-Finance/
├── backend/            # Express REST API (Node/TypeScript)
├── frontend/           # Next.js App Router (React/TypeScript)
└── docs/               # Detailed system architecture documentation
```

### Backend Tech Stack
*   **Runtime:** Node.js (v24+)
*   **Language:** TypeScript
*   **Web Framework:** Express.js (v5)
*   **Database ORM:** Prisma with PostgreSQL
*   **Cache & Queue:** Redis (`ioredis` + `bullmq`)
*   **Data Validation:** Zod

### Frontend Tech Stack
*   **Framework:** Next.js (v16 App Router)
*   **Styling & UI:** TailwindCSS, Framer Motion (for premium micro-animations)
*   **State Management:** Zustand (global UI/auth state)
*   **Data Fetching & Cache:** TanStack React Query (server-state syncing)
*   **Icons:** Lucide React

---

## ⚙️ Environment Configuration

### Backend Configuration
Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db_name>?schema=public"
PORT=3000
REDIS_URL="redis://<user>:<password>@<host>:<port>"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
INTERNAL_API_TOKEN="your-internal-api-secret"
```

### Frontend Configuration
Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

---

## 📦 Getting Started

### 1. Set Up and Run the Backend
```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```
The server starts on `http://localhost:3000`.

### 2. Set Up and Run the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
The client starts on `http://localhost:3001` (or next available port).

---

## 📡 API Reference

All requests must include `Content-Type: application/json`. Protected endpoints require a Bearer token: `Authorization: Bearer <your_jwt_access_token>`.

### Authentication & Rate Limiting
Public endpoints enforce a limit of **10 requests/min**, while authenticated routes allow **60 requests/min**, managed atomically via Redis Lua scripting.

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user | No (Rate Limit: 10/min) |
| `POST` | `/auth/login` | Login user, revokes older tokens, returns JWT pair | No (Rate Limit: 10/min) |
| `POST` | `/auth/refresh` | Refresh access token using rotation | No (Rate Limit: 60/min) |
| `POST` | `/auth/logout` | Revoke active refresh token | Yes (Rate Limit: 60/min) |
| `GET` | `/auth/me` | Fetch active user information | Yes (Rate Limit: 60/min) |

### Accounts
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/accounts` | Create a wallet (`SAVINGS`, `CREDIT`, `CASH`) | Yes |
| `GET` | `/accounts` | List user wallets | Yes |
| `GET` | `/accounts/:accountId` | Retrieve wallet details | Yes |
| `DELETE` | `/accounts/:accountId` | Soft-delete wallet | Yes |

### Transactions
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/transactions` | Create transaction (Idempotency Key supported) | Yes |
| `GET` | `/transactions/accounts/:accountId/history` | List transactions (cursor-paginated) | Yes |
| `GET` | `/transactions/accounts/:accountId/balance` | Get wallet balance (`income - expense`) | Yes |
| `DELETE` | `/transactions/:transactionId` | Soft-delete transaction | Yes |
| `POST` | `/transactions/:transactionId/restore` | Restore a soft-deleted transaction | Yes |

### Transfers
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/transfers` | Create atomic transfer between two user accounts | Yes |
| `GET` | `/transfers` | List transfers history | Yes |

### Unified Feed
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/feed` | Unified activity timeline with pagination and account filters | Yes |

### Budgets
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/budgets` | Upsert monthly budget for a category (`YYYY-MM`) | Yes |
| `GET` | `/budgets` | List budgets (optional `?month=YYYY-MM` filter) | Yes |
| `GET` | `/budgets/:budgetId` | Fetch details of a budget | Yes |
| `DELETE` | `/budgets/:budgetId` | Hard-delete budget | Yes |

### Reports & Analytics
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/reports/monthly-summary` | Summary of monthly flow (pre-cached) | Yes |
| `GET` | `/reports/category-breakdown` | Spend analysis by category (pre-cached) | Yes |

### Administrative (Audit Logs)
| Method | Endpoint | Description | Headers Required |
|---|---|---|---|
| `GET` | `/internal/audit-logs` | Fetch system audit logs | `X-Internal-Token` |

---

## 📘 System Design

For details on core design patterns, models, and workflows, check the documentation files:

*   **[Backend Architecture & Transport](file:///c:/Users/ANOOP%20SINGH/OneDrive/Desktop/Zenith2/docs/system_info/backend.md)**: Routing patterns, middleware stack (auth, validation, and Lua rate limiter), and cursor-based pagination.
*   **[Frontend Application Layout](file:///c:/Users/ANOOP%20SINGH/OneDrive/Desktop/Zenith2/docs/system_info/frontend.md)**: Client structure, Zustand store definitions, custom hook wrappers, and responsive modals.
*   **[Redis & BullMQ Background Queues](file:///c:/Users/ANOOP%20SINGH/OneDrive/Desktop/Zenith2/docs/system_info/redis_workers.md)**: Redis caching strategies, request idempotency keys, sliding window rate limits, cron tasks, and queue workers.
*   **[Database Schema & Models](file:///c:/Users/ANOOP%20SINGH/OneDrive/Desktop/Zenith2/docs/system_info/data_modeling.md)**: Prisma database schemas, tables relations (transactions, users, summaries, logs), and indexes.

---

## 🧪 Testing

The codebase includes several integration test scripts:

*   **Comprehensive Endpoint Verification:** Runs full API cycles.
    ```bash
    node api-test.js
    ```
*   **Activity Feed Verification:** Tests cursor stability and transfer grouping.
    ```bash
    node test-feed-module.js
    ```
*   **Budget CRUD Test (HTTP):** Tests budget routes against a live server.
    ```bash
    node scripts/test-budget.js
    ```
*   **Budget CRUD Test (Direct):** Bypasses HTTP/Redis layers to run tests directly on database and service contexts.
    ```bash
    npx ts-node scripts/test-budget-direct.ts
    ```

