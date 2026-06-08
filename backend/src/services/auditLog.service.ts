import { PrismaTx } from "../types/prisma";
import { createAuditLogRepo, CreateAuditLogInput } from "../repositories/auditLog.repository";

/**
 * Log an event to the audit trail
 * Can be used within or outside a transaction
 */
export const recordAuditLog = async (
    prisma: PrismaTx,
    input: CreateAuditLogInput,
) => {
    return createAuditLogRepo(prisma, input);
};

/**
 * Domain-specific helpers to standardize event naming
 */
export const AuditEvents = {
    TRANSFER_INITIATED: "transfer.initiated",
    TRANSFER_SUCCEEDED: "transfer.succeeded",
    TRANSFER_FAILED: "transfer.failed",

    TRANSACTION_CREATED: "transaction.created",
    TRANSACTION_DELETED: "transaction.deleted",
    TRANSACTION_RESTORED: "transaction.restored",

    ACCOUNT_CREATED: "account.created",
    ACCOUNT_DELETED: "account.deleted",

    BUDGET_CREATED: "budget.created",
    BUDGET_EXCEEDED: "budget.exceeded",

    IDEMPOTENCY_REPLAYED: "idempotency.replayed",

    AUTH_LOGIN_SUCCESS: "auth.login.success",
    AUTH_LOGIN_FAILED: "auth.login.failed",
    AUTH_LOGOUT: "auth.logout",

    AUTH_TOKEN_REFRESHED: "auth.token.refreshed",
    AUTH_REFRESH_TOKEN_REUSED: "auth.refresh_token.reused",

    AUTH_ACCOUNT_LOCKED: "auth.account.locked",

};

export const EntityTypes = {
    ACCOUNT: "ACCOUNT",
    TRANSACTION: "TRANSACTION",
    TRANSFER: "TRANSFER",
    BUDGET: "BUDGET",
    USER: "USER",
};
