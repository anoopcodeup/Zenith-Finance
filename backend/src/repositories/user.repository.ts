import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const createUser = async (email: string, passwordHash: string) => {
  return prisma.user.create({
    data: {
      email,
      passwordHash,
    },
  });
};
