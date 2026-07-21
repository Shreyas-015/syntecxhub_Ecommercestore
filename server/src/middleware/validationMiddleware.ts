import { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Higher-order middleware to validate req.body against a Zod schema
 */
export const validate = (schema: z.ZodObject<any, any>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = await schema.parseAsync(req.body);
    // Replace req.body with parsed/sanitized data from Zod
    req.body = parsed;
    next();
  } catch (error) {
    next(error);
  }
};
