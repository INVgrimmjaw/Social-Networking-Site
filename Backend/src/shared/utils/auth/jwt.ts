
import jwt, { Secret, SignOptions } from "jsonwebtoken";

interface TokenPayload {
  id: string;
  name?: string | null;
  email?: string | null;
}

export const generateAccessToken = (payload: TokenPayload) => {
  const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET as Secret;

  const options: SignOptions = {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, accessTokenSecret, options);
};

export const generateRefreshToken = (payload: TokenPayload) => {
  const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET as Secret;

  const options: SignOptions = {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, refreshTokenSecret, options);
};