import { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Forwards any thrown/rejected error to the Express error middleware. */
export const asyncHandler =
  (fn: AsyncFn): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };