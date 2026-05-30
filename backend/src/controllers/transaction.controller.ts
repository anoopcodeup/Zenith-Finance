import { Request, Response } from "express";
import {
    createTransaction,
    listAccountTransactions, 
    deleteTransaction, 
    getAccountBalance,
} from "../services/transaction.service";
import { HttpError } from "../utils/httpError";
import { ListTransactionsQuery } from "../validators/transaction.schema";

export const createTransactionHandler = async (
    req: Request,
    res: Response
) => {
    const userId = (req as any).user.id;

    const transaction = await createTransaction(userId, req.body);
    res.status(201).json(transaction);
};

export const listAccountTransactionsHandler = async (
  req: Request,
  res: Response
) => {
  const userId = (req as any).user.id;
  const { accountId } = req.params;

  if (!accountId) {
    throw new HttpError("Invalid accountId", 400);
  }
  
  if (typeof accountId !== "string") {
    throw new HttpError("Invalid accountId", 400);
  }

  const query = req.query as unknown as ListTransactionsQuery;
  //unknown : the fix is to tell TS, “Trust me — this has been validated.”

  const result = await listAccountTransactions(
    userId,
    accountId,
    query
  );

  res.json(result);
};


export const deleteTransactionHandler = async (
    req: Request,
    res: Response
) => {
    const userId = (req as any).user.id;
    const { transactionId } = req.params;

    if (typeof transactionId !== "string") {
        throw new HttpError("Invalid transactionId", 400);
    }

    await deleteTransaction(userId, transactionId);
    res.status(204).send();
};

export const getAccountBalanceHandler = async (
    req: Request,
    res: Response
) => {
    const userId = (req as any).user.id;
    const { accountId } = req.params;

    if (typeof accountId !== "string") {
        throw new HttpError("Invalid accountId", 400);
    }

    const balance = await getAccountBalance(userId, accountId);
    res.json(balance);
};