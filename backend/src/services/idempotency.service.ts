import crypto from "crypto";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/httpError";
import {
  createIdempotencyKey,
  findIdempotencyKey,
  completeIdempotencyKey,
} from "../repositories/idempotency.repository";
import { PrismaTx } from "../types/prisma";

/**
 * Executes a write operation exactly once using idempotency key.
 */
export const withIdempotency = async <T>(
  params: {
    userId: string;
    idempotencyKey?: string;
    operation: "CREATE_TX" | "TRANSFER" | "REFUND";
    payload: unknown;
    handler: (tx: PrismaTx) => Promise<T>;
  }
): Promise<T> => {
  const { userId, idempotencyKey, payload, handler } = params;

  // No key → wrap handler in transaction for atomicity
  if (!idempotencyKey) {
    return prisma.$transaction(async (tx) => {
      return handler(tx);
    });
  }

  const requestHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  return prisma.$transaction(async (tx) => {
    const existing = await findIdempotencyKey(tx, userId, idempotencyKey);

    // Replay
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new HttpError(
          "Idempotency key reused with different payload",
          409
        );
      }

      if (existing.status === "COMPLETED") {
        return existing.responseBody as T;
      }

      throw new HttpError("Request already in progress", 409);
    }

    // First execution
    const record = await createIdempotencyKey(tx, {
      userId,
      key: idempotencyKey,
      requestHash,
    });

    const result = await handler(tx);

    await completeIdempotencyKey(tx, record.id, result);

    return result;
  });
};
