import { Request } from "express";

declare global {
    namespace Express {
        interface Request {
            user: {
                id: string;
            };
        }
    }
}

export type CategoryBreakdownQuery = {
  month: string;
  type: TransactionType;
};