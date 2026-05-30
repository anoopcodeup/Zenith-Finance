import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { createUser, findUserByEmail } from "../repositories/user.repository";
import { HttpError } from "../utils/httpError";
import {
    issueTokens,
    rotateRefreshToken,
    revokeRefreshToken,
} from "./refreshToken.service";
import { deleteAllRefreshTokensForUser } from "../repositories/refreshToken.repository";
import { recordAuditLog, AuditEvents, EntityTypes } from "./auditLog.service";

export const register = async (email: string, password: string) => {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new HttpError("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(email, passwordHash);

    const tokens = await issueTokens(prisma, user.id);

    return {
        user: { id: user.id, email: user.email },
        ...tokens,
    };
};

export const login = async (
    email: string,
    password: string,
    requestId?: string
) => {
    return prisma.$transaction(async (tx) => {
        const user = await findUserByEmail(email);

        if (!user) {
            // Record failed login
            await recordAuditLog(tx, {
                userId: "unknown", // We don't have a valid user ID yet
                event: AuditEvents.AUTH_LOGIN_FAILED,
                entityType: EntityTypes.USER,
                metadata: { email, reason: "USER_NOT_FOUND" },
                requestId,
            });
            throw new HttpError("Invalid email or password", 401);
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            // Record failed login
            await recordAuditLog(tx, {
                userId: user.id,
                event: AuditEvents.AUTH_LOGIN_FAILED,
                entityType: EntityTypes.USER,
                entityId: user.id,
                metadata: { email, reason: "INVALID_PASSWORD" },
                requestId,
            });
            throw new HttpError("Invalid email or password", 401);
        }

        // Delete all existing refresh tokens for this user
        await deleteAllRefreshTokensForUser(tx, user.id);

        // Issue tokens
        const tokens = await issueTokens(tx, user.id);

        // Record success
        await recordAuditLog(tx, {
            userId: user.id,
            event: AuditEvents.AUTH_LOGIN_SUCCESS,
            entityType: EntityTypes.USER,
            entityId: user.id,
            requestId,
        });

        return {
            user: { id: user.id, email: user.email },
            ...tokens,
        };
    });
};



export const refresh = async (
    refreshToken: string,
    requestId?: string
) => {
    if (!refreshToken) {
        throw new HttpError("Refresh token required", 400);
    }
    return prisma.$transaction(async (tx) => {
        const {userId, tokens} = await rotateRefreshToken(tx, refreshToken);
        await recordAuditLog(tx, {
            userId,
            event: AuditEvents.AUTH_TOKEN_REFRESHED,
            entityType: EntityTypes.USER,
            entityId: userId,
            requestId,
        });
        return tokens;
    });
};

export const logout = async (
    refreshToken: string,
    requestId?: string,
) => {
    if (!refreshToken) {
        throw new HttpError("Refresh token required", 400);
    }
    return prisma.$transaction(async (tx) => {
        const userId = await revokeRefreshToken(tx, refreshToken);

        await recordAuditLog(tx, {
            userId,
            event: AuditEvents.AUTH_LOGOUT,
            entityType: EntityTypes.USER,
            entityId: userId,
            requestId,
        });
    });
};

export const getCurrentUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new HttpError("User not found", 404);
    }

    return user;
};
