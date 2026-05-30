import { Request, Response } from "express";
import { listAuditLogs } from "../services/auditLogRead.service";
import { HttpError } from "../utils/httpError";

export const listAuditLogsController = async (
  req: Request,
  res: Response
) => {
  const limit = Number(req.query.limit ?? 50);

  if (Number.isNaN(limit) || limit <= 0 || limit > 100) {
    throw new HttpError("Invalid limit", 400);
  }

  const cursor = typeof req.query.cursor === "string"
    ? req.query.cursor
    : undefined;

  const filters = {
    userId: typeof req.query.userId === "string" ? req.query.userId : undefined,
    event: typeof req.query.event === "string" ? req.query.event : undefined,
    entityType:
      typeof req.query.entityType === "string"
        ? req.query.entityType
        : undefined,
    entityId:
      typeof req.query.entityId === "string"
        ? req.query.entityId
        : undefined,
    from: req.query.from ? new Date(String(req.query.from)) : undefined,
    to: req.query.to ? new Date(String(req.query.to)) : undefined,
  };

  // basic date validation
  if (
    (filters.from && isNaN(filters.from.getTime())) ||
    (filters.to && isNaN(filters.to.getTime()))
  ) {
    throw new HttpError("Invalid date filter", 400);
  }

  const result = await listAuditLogs({
    limit,
    cursor,
    filters,
  });

  res.json(result);
};
