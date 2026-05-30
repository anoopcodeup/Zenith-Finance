import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type ValidationTarget = "body" | "params" | "query";

export const validate =
  //target accepts body, params, or query; body being the default
  (schema: ZodSchema, target: ValidationTarget = "body") =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = schema.parse(req[target]);

        // Use defineProperty to bypass potential read-only getters on req.query or req.params
        // and ensure numeric/date types are preserved.
        Object.defineProperty(req, target, {
          value: parsed,
          writable: true,
          enumerable: true,
          configurable: true,
        });

        next();
      } catch (error: any) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
      }
    };
