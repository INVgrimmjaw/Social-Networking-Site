import { Request, Response } from "express";
import { ApiError } from "../shared/utils/ApiError.js";
import { db } from "../prisma/db.js";
import { comparePassword, encryptPassword } from "../shared/utils/auth/hash.js";
import { generateAccessToken, generateRefreshToken, } from "../shared/utils/auth/jwt.js";
import { setAuthCookies } from "../shared/utils/auth/helper.js";
import { ApiResponse } from "../shared/utils/ApiResponse.js";

const handleError = (res: Response, error: unknown, label: string) => {
  console.error(`${label}: `, error);

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errors: [],
  });
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await db.orm.public.User.where({
      email: normalizedEmail,
    }).first();

    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }

    const hashedPassword = await encryptPassword(password);

    const user = await db.orm.public.User.create({
      name: name.toLowerCase().trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });
    const payload = { id: user.id, name: user.name ?? "", email: user.email };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
          },
          accessToken,
          refreshToken,
        },
        "User registered successfully"
      )
    );
  } catch (error: unknown) {
    return handleError(res, error, "Register User Error");
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await db.orm.public.User.where({
      email: email.toLowerCase().trim(),
    }).first();

    if (!user) {
      throw new ApiError(400, "Invalid credentials");
    }

    const isPasswordCorrect = await comparePassword(password, user.password);

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid credentials");
    }
    const payload = { id: user.id, name: user.name ?? "", email: user.email };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
          },
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
  } catch (error: unknown) {
    return handleError(res, error, "Login User Error");
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res
      .status(200)
      .json(new ApiResponse(200, null, "User logged out successfully"));
  } catch (error: unknown) {
    return handleError(res, error, "Logout User Error");
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (userId === undefined) {
      throw new ApiError(401, "Unauthorized");
    }

    const user = await db.orm.public.User.where({ id: userId }).first();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        "User details fetched successfully"
      )
    );
  } catch (error: unknown) {
    return handleError(res, error, "Get Current User Error");
  }
};