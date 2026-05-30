import { Request, Response } from "express";
import { transferBetweenAccounts, listTransferHistory } from "../services/transfer.service";
import { ListTransfersQueryInput } from "../validators/transfer.schema";

export const transferHandler = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const idempotencyKey = req.header("Idempotency-Key") ?? undefined;

  const result = await transferBetweenAccounts(
    userId,
    req.body,
    idempotencyKey
  );

  res.status(201).json(result);
};


export const listTransferHistoryHandler = async (
  req: Request,
  res: Response
) => {
  const userId = (req as any).user.id;

  const query = req.query as unknown as ListTransfersQueryInput;

  const result = await listTransferHistory(userId, query);

  res.json(result);
};

