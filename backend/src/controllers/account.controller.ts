import { Request, Response } from "express";
import { AccountType } from "@prisma/client";
import {
  createUserAccount,
  listUserAccounts,
  getUserAccountById,
  deleteUserAccount,
} from "../services/account.service";

export const createAccount = async (req: Request, res: Response) => {
  const { name, type } = req.body;
  const userId = (req as any).user.id;

  const account = await createUserAccount(
    userId,
    name,
    type as AccountType
  );

  return res.status(201).json({
    message: "Account created successfully",
    account,
  });
};

export const getAccounts = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const accounts = await listUserAccounts(userId);

  return res.status(200).json({
    accounts,
  });
};

export const getAccountById = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const accountId = req.params.accountId as string;

  const account = await getUserAccountById(userId, accountId);

  return res.status(200).json({ account });
};

export const deleteAccount = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const accountId = req.params.accountId as string;

  await deleteUserAccount(userId, accountId);

  return res.status(200).json({ message: "Account deleted successfully" }).send();
};
