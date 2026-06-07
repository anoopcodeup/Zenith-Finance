import { Request, Response } from "express";
import {
  createRecurringService,
  listRecurringService,
  getRecurringByIdService,
  updateRecurringService,
  pauseRecurringService,
  resumeRecurringService,
  deleteRecurringService,
} from "../services/recurringTransaction.service";

export const createRecurring = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const recurringTransaction = await createRecurringService(userId, req.body);

  return res.status(201).json({
    message: "Recurring transaction created successfully",
    recurringTransaction,
  });
};

export const listRecurring = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const recurringTransactions = await listRecurringService(userId);

  return res.status(200).json({
    recurringTransactions,
  });
};

export const getRecurringById = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const id = req.params.id as string;

  const recurringTransaction = await getRecurringByIdService(id, userId);

  return res.status(200).json({
    recurringTransaction,
  });
};

export const updateRecurring = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const id = req.params.id as string;

  const recurringTransaction = await updateRecurringService(id, userId, req.body);

  return res.status(200).json({
    message: "Recurring transaction updated successfully",
    recurringTransaction,
  });
};

export const pauseRecurring = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const id = req.params.id as string;

  const recurringTransaction = await pauseRecurringService(id, userId);

  return res.status(200).json({
    message: "Recurring transaction paused successfully",
    recurringTransaction,
  });
};

export const resumeRecurring = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const id = req.params.id as string;

  const recurringTransaction = await resumeRecurringService(id, userId);

  return res.status(200).json({
    message: "Recurring transaction resumed successfully",
    recurringTransaction,
  });
};

export const deleteRecurring = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const id = req.params.id as string;

  await deleteRecurringService(id, userId);

  return res.status(204).send();
};
