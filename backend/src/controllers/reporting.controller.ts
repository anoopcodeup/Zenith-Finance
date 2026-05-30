import { Request, Response } from "express";
import {
  getCategoryBreakdownService,
} from "../services/reporting.service";
import { getOrGenerateMonthlySummaryService } from "../services/monthlySummary.service";
import {
  monthlySummaryQuerySchema,
  categoryBreakdownQuerySchema,
} from "../validators/reporting.schema";

export const getMonthlySummaryController = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const { month } = monthlySummaryQuerySchema.parse(req.query);

  const result = await getOrGenerateMonthlySummaryService(userId, month);
  res.json(result);
};

export const getCategoryBreakdownController = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const { month, type } =
    categoryBreakdownQuerySchema.parse(req.query);

  const result = await getCategoryBreakdownService(
    userId,
    month,
    type
  );

  res.json(result);
};
