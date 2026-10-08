import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../shared/utils/ApiError.js";

/*
 * IMPORTANT: this must verify with the same secret that generateAccessToken in
 * shared/utils/auth/jwt.ts signs with. I haven't seen that file, so I assumed
 * the env var is ACCESS_TOKEN_SECRET. Rename it below if yours differs.
 *
 * If jwt.ts already exports a verify function, you can replace the
 * jwt.verify(...) call with it.
 */
const getAccessSecret = (): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET is not set");
  }
  return secret;
};

/** Reads the token from the accessToken cookie, falling back to "Authorization: Bearer <token>". */
const extractToken = (req: Request): string | undefined => {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  if (cookies?.accessToken) {
    return cookies.accessToken;
  }

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }

  return undefined;
};

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, getAccessSecret());

    if (typeof decoded === "string" || typeof decoded.id !== "string") {
      return next(new ApiError(401, "Invalid access token"));
    }

    // same shape as the payload built in toTokenPayload()
    req.user = {
      id: decoded.id,
      name: typeof decoded.name === "string" ? decoded.name : "",
      email: typeof decoded.email === "string" ? decoded.email : "",
    };

    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, "Access token expired"));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, "Invalid access token"));
    }
    // anything else (e.g. missing secret) is a server problem, not the client's
    return next(error);
  }
};