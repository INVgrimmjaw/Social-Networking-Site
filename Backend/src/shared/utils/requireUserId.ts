import { Request } from "express";
import { ApiError } from "./ApiError.js";

/** Returns the authenticated user's id or throws 401. */
export const requireUserId = (req: Request): string => {
  const id = req.user?.id;
  if (!id) {
    throw new ApiError(401, "Unauthorized");
  }
  return String(id);
};