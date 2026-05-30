import { prisma } from "../config/prisma";
import { findAuditLogsCursor } from "../repositories/auditLog.repository";

export const listAuditLogs = async (query: {
  limit: number;
  cursor?: string;
  filters?: {
    userId?: string;
    event?: string;
    entityType?: string;
    entityId?: string;
    from?: Date;
    to?: Date;
  };
}) => {
  let cursor;

  if (query.cursor) {
    const [createdAt, id] = Buffer.from(
      query.cursor,
      "base64"
    ).toString("utf8").split("|");

    cursor = { createdAt: new Date(createdAt), id };
  }

  const rows = await findAuditLogsCursor(prisma, {
    limit: query.limit,
    cursor,
    filters: query.filters,
  });

  const hasNextPage = rows.length > query.limit;
  const sliced = hasNextPage ? rows.slice(0, query.limit) : rows;

  const nextCursor = hasNextPage
    ? Buffer.from(
        `${sliced[sliced.length - 1].createdAt.toISOString()}|${
          sliced[sliced.length - 1].id
        }`
      ).toString("base64")
    : null;

  return {
    data: sliced,
    nextCursor,
  };
};
