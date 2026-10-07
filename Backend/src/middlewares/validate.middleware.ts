import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { ApiError } from "../shared/utils/ApiError.js";

type Source = "body" | "query" | "params";

/**
 * Validates req[source] against a zod schema and replaces it with the parsed
 * (trimmed / coerced / defaulted) result.
 */
export const validate =
  (schema: ZodType, source: Source = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map(
        (issue) => `${issue.path.join(".") || source}: ${issue.message}`
      );
      return next(new ApiError(400, "Validation failed", errors));
    }

    // defineProperty works on Express 4 and 5 (req.query is a getter in v5)
    Object.defineProperty(req, source, {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    return next();
  };