import { PrismaTx } from "../types/prisma";

export interface CreateAuditLogInput {
    event: string;
    userId?: string;
    entityType: string;
    entityId?: string;
    requestId?: string;
    idempotencyKey?: string;
    metadata?: Record<string, any>;
}

/**
 * Persist an immutable audit log entry
 */
export const createAuditLogRepo = (
    prisma: PrismaTx,
    input: CreateAuditLogInput
) => {
    return prisma.auditLog.create({
        data: {
            ...input,
            metadata: input.metadata || {},
        },
    });
};

/**
 * Retrieve audit logs for a specific entity
 */
export const findAuditLogsByEntity = (
    prisma: PrismaTx,
    entityType: string,
    entityId: string
) => {
    return prisma.auditLog.findMany({
        where: {
            entityType,
            entityId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

/**
 * Retrieve audit logs for a specific user
 */
export const findAuditLogsByUser = (
    prisma: PrismaTx,
    userId: string 
) => {
    return prisma.auditLog.findMany({
        where: {
            userId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};


export const findAuditLogsCursor = (
    prisma: PrismaTx,
    params: {
        limit: number;
        cursor?: {
            createdAt: Date;
            id: string;
        };
        filters?: {
            userId?: string;
            event?: string;
            entityType?: string;
            entityId?: string;
            from?: Date;
            to?: Date;
        };
    }
) => {
    const { limit, cursor, filters } = params;

    return prisma.auditLog.findMany({
        where: {
            ...(filters?.userId && { userId: filters.userId }),
            ...(filters?.event && { event: filters.event }),
            ...(filters?.entityType && { entityType: filters.entityType }),
            ...(filters?.entityId && { entityId: filters.entityId }),
            ...(filters?.from || filters?.to
                ? {
                    createdAt: {
                        ...(filters.from && { gte: filters.from }),
                        ...(filters.to && { lte: filters.to }),
                    },
                }
                : {}),

            ...(cursor && {
                OR: [
                    { createdAt: { lt: cursor.createdAt } },
                    {
                        createdAt: cursor.createdAt,
                        id: { lt: cursor.id },
                    },
                ],
            }),
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 2 * limit + 1,
    });
};
