import { prisma } from "../config/prisma";
import { v4 as uuidv4 } from "uuid";
import { TransactionType } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import { ListTransfersQueryInput, TransferInput } from "../validators/transfer.schema";
import {
  findAccountById,
  lockAccountsForTransfer,
} from "../repositories/account.repository";
import {
  aggregateAccountBalance,
  createTransactionRepo,
} from "../repositories/transaction.repository";
import {
  findTransferTransactionsCursor,
} from "../repositories/transfer.repository";
import { withIdempotency } from "./idempotency.service";
import { recordAuditLog, AuditEvents, EntityTypes } from "./auditLog.service";

export const transferBetweenAccounts = async (
  userId: string,
  input: TransferInput,
  idempotencyKey?: string
) => {
  return withIdempotency({
    userId,
    idempotencyKey,
    operation: "TRANSFER",
    payload: input,
    handler: async (tx) => {
      const { fromAccountId, toAccountId, amount, description } = input;

      if (fromAccountId === toAccountId) {
        throw new HttpError("Cannot transfer to same account", 400);
      }

      if (amount <= 0) {
        throw new HttpError("Invalid transfer amount", 400);
      }

      /**
       * 1. Lock both accounts (pessimistic concurrency control)
       * - Deterministic ordering inside repository
       * - Blocks concurrent transfers touching same accounts
       */
      await lockAccountsForTransfer(
        tx,
        [fromAccountId, toAccountId],
        userId
      );

      /**
       * 2. Fetch accounts AFTER lock
       * - Ownership + existence validation
       */
      const [from, to] = await Promise.all([
        findAccountById(tx, fromAccountId, userId),
        findAccountById(tx, toAccountId, userId),
      ]);

      if (!from || !to) {
        await recordAuditLog(tx, {
          event: AuditEvents.TRANSFER_FAILED,
          userId,
          entityType: "TRANSFER",
          metadata: {
            reason: "ACCOUNT_NOT_FOUND",
            fromAccountId,
            toAccountId,
          },
          idempotencyKey,
        });
        throw new HttpError("Account not found", 404);
      }

      /**
       * 3. Compute sender balance AFTER lock
       * - Derived from ledger
       * - Safe under concurrency
       */
      const { income, expense } = await aggregateAccountBalance(
        tx,
        fromAccountId,
        userId
      );

      const availableBalance = income - expense;

      if (availableBalance < amount) {
        await recordAuditLog(tx, {
          event: AuditEvents.TRANSFER_FAILED,
          userId,
          entityType: "TRANSFER",
          metadata: {
            reason: "INSUFFICIENT_BALANCE",
            fromAccountId,
            availableBalance,
            amount,
          },
          idempotencyKey,
        });
        throw new HttpError("Insufficient balance", 422);
      }

      /**
       * 4. Create double-entry ledger records atomically
       */
      const transferId = uuidv4();

      const debit = await createTransactionRepo(tx, {
        userId,
        accountId: fromAccountId,
        type: TransactionType.EXPENSE,
        amount,
        description,
        transferId,
      });

      const credit = await createTransactionRepo(tx, {
        userId,
        accountId: toAccountId,
        type: TransactionType.INCOME,
        amount,
        description,
        transferId,
      });

      await recordAuditLog(
        tx,
        {
          event: AuditEvents.TRANSFER_SUCCEEDED,
          userId,
          entityType: EntityTypes.TRANSFER,
          entityId: transferId,
          metadata: {
            fromAccountId,
            toAccountId,
            amount,
          },
          idempotencyKey,
        },
      );

      return { transferId, debit, credit };
    },
  });
};


export const listTransferHistory = async (
  userId: string,
  query: ListTransfersQueryInput
) => {
  let cursor:
    | {
      createdAt: Date;
      transferId: string;
    }
    | undefined;

  if (query.cursor) {
    const [createdAt, transferId] = Buffer.from(
      query.cursor,
      "base64"
    )
      .toString("utf8")
      .split("|");

    if (!createdAt || !transferId) {
      throw new HttpError("Invalid cursor", 400);
    }

    cursor = {
      createdAt: new Date(createdAt),
      transferId,
    };
  }

  const rows = await findTransferTransactionsCursor(prisma, {
    userId,
    limit: query.limit,
    cursor,
    from: query.from,
    to: query.to,
  });

  const hasNextPage = rows.length > query.limit;
  const sliced = hasNextPage ? rows.slice(0, query.limit) : rows;

  // Group by transferId
  const transfers = Object.values(
    sliced.reduce<Record<string, any>>((acc, tx) => {
      if (!acc[tx.transferId!]) {
        acc[tx.transferId!] = {
          transferId: tx.transferId,
          createdAt: tx.createdAt,
          from: null,
          to: null,
        };
      }

      if (tx.type === TransactionType.EXPENSE) acc[tx.transferId!].from = tx;
      if (tx.type === TransactionType.INCOME) acc[tx.transferId!].to = tx;

      return acc;
    }, {})
  );

  const nextCursor = hasNextPage
    ? Buffer.from(
      `${sliced[sliced.length - 1].createdAt.toISOString()}|${sliced[sliced.length - 1].transferId
      }`
    ).toString("base64")
    : null;

  return {
    data: transfers,
    nextCursor,
  };
};
