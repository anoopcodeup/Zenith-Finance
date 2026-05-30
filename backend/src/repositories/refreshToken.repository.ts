import { prisma } from "../config/prisma";
import { PrismaTx } from "../types/prisma";
import bcrypt from "bcrypt";

async function hashToken(token: string) {
  const crypto = await import("crypto");
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function findRefreshTokenByHash(token: string) {
  const tokenHash = await hashToken(token);
  return prisma.refreshToken.findFirst({
    where: { tokenHash },
  });
}

export async function deleteRefreshToken(
  prisma: PrismaTx,
  id: string
) {
  return prisma.refreshToken.delete({ where: { id } });
}

export async function deleteAllRefreshTokensForUser(
  prisma: PrismaTx,
  userId: string
) {
  return prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function createRefreshToken(
  prisma: PrismaTx,
  userId: string,
  token: string,
  expiresAt: Date
) {
  const tokenHash = await hashToken(token);

  return prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
}
