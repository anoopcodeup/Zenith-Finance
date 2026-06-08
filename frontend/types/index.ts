// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
}

// ─── Account ─────────────────────────────────────────────────────────────────
export type AccountType = "SAVINGS" | "CREDIT" | "CASH";

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  createdAt: string;
  deletedAt?: string | null;
}

export interface AccountBalance {
  accountId: string;
  balance: string;
}

// ─── Transaction ─────────────────────────────────────────────────────────────
export type TransactionType = "INCOME" | "EXPENSE";

export interface Category {
  id: string;
  name: string;
  userId?: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  amount: string;
  type: TransactionType;
  categoryId?: string | null;
  category?: Category | null;
  description?: string | null;
  transferId?: string | null;
  createdAt: string;
  deletedAt?: string | null;
}

export interface PaginatedTransactions {
  data: Transaction[];
  nextCursor?: string | null;
}

// ─── Transfer ────────────────────────────────────────────────────────────────
export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  createdAt: string;
  description?: string | null;
}

// ─── Feed ────────────────────────────────────────────────────────────────────
export type FeedItemType = "INCOME" | "EXPENSE" | "TRANSFER";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  amount: string;
  accountId: string;
  accountName?: string;
  categoryId?: string | null;
  categoryName?: string | null;
  description?: string | null;
  createdAt: string;
  deletedAt?: string | null;
}

export interface PaginatedFeed {
  data: FeedItem[];
  nextCursor?: string | null;
}

// ─── Budget ──────────────────────────────────────────────────────────────────
export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  category?: Category;
  month: string; // "YYYY-MM"
  amount: string;
  createdAt: string;
}

// ─── Recurring Transaction ───────────────────────────────────────────────────
export type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface RecurringTransaction {
  id: string;
  userId: string;
  accountId: string;
  amount: string;
  type: TransactionType;
  categoryId?: string | null;
  category?: Category | null;
  description?: string | null;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string | null;
  nextRunAt: string;
  lastRunAt?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export interface MonthlySummary {
  userId: string;
  month: string;
  income: string;
  expense: string;
  net: string;
  generatedAt: string;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  total: string;
  type: TransactionType;
}

// ─── API Error ───────────────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  status?: number;
}

// ─── Pagination ──────────────────────────────────────────────────────────────
export interface PaginationParams {
  cursor?: string;
  limit?: number;
}
