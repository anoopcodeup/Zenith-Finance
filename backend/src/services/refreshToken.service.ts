import { HttpError } from "../utils/httpError";
import {
  findRefreshTokenByHash,
  deleteRefreshToken,
  createRefreshToken,
} from "../repositories/refreshToken.repository";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { PrismaTx } from "../types/prisma";
import { recordAuditLog, AuditEvents, EntityTypes } from "./auditLog.service";

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;


// Verifies JWT and finds matching hashed token in DB
async function verifyStoredRefreshToken(
  prisma: PrismaTx,
  refreshToken: string
) {
  let payload: any;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError("Invalid refresh token", 401);
  }

  const token = await findRefreshTokenByHash(refreshToken);

  if (!token || token.userId !== payload.userId) {
    // We generally keep audit logging at the service layer, but token replay detection is a security boundary. If we don’t log at the point of detection, the event is lost. So we allow a narrowly scoped exception for security telemetry, clearly documented
    await recordAuditLog(prisma, {
      userId: payload.userId,
      event: AuditEvents.AUTH_REFRESH_TOKEN_REUSED,
      entityType: EntityTypes.USER,
      entityId: payload.userId,
      metadata: {
        reason: "TOKEN_REUSE_OR_INVALID",
      },
    });
    throw new HttpError("Refresh token not found or invalid", 401);
  }

  return { payload, token };
}

/**
 * Issue fresh access + refresh tokens
 */
export async function issueTokens(
  prisma: PrismaTx,
  userId: string
) {
  const accessToken = signAccessToken({ userId });
  const refreshToken = signRefreshToken({ userId });

  await createRefreshToken(
    prisma,
    userId,
    refreshToken,
    new Date(Date.now() + REFRESH_TOKEN_TTL)
  );

  return { accessToken, refreshToken };
}

/**
 * Refresh token rotation
 */
export async function rotateRefreshToken(
  prisma: PrismaTx,
  refreshToken: string
) {
  const { payload, token } =
    await verifyStoredRefreshToken(prisma, refreshToken);

  // delete old refresh token
  await deleteRefreshToken(prisma, token.id);

  // issue new pair
  const tokens = await issueTokens(prisma, payload.userId);
  return {userId: payload.userId, tokens};
}

/**
 * Logout (revoke refresh token)
 */
export async function revokeRefreshToken(
  prisma: PrismaTx,
  refreshToken: string
) {
  const { token } =
    await verifyStoredRefreshToken(prisma, refreshToken);

  await deleteRefreshToken(prisma, token.id);
  return token.userId;
}
