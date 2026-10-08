import { db } from "../prisma/db.js";
import { ApiError } from "../shared/utils/ApiError.js";
import { ApiResponse } from "../shared/utils/ApiResponse.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { requireUserId } from "../shared/utils/requireUserId.js";
import { isUniqueViolation } from "../shared/utils/dbErrors.js";
import { comparePassword, encryptPassword } from "../shared/utils/auth/hash.js";
import { generateAccessToken, generateRefreshToken } from "../shared/utils/auth/jwt.js";
import { setAuthCookies } from "../shared/utils/auth/helper.js";
import { toSelfUser, toTokenPayload, UserRecord } from "../shared/utils/toPublicUser.js";
import type { LoginInput, RegisterInput } from "../shared/validations/auth.validation.js";
import type { Response } from "express";

const orm = db.orm.public;


// Hashed once at startup. Compared against when the email doesn't exist so a
// missing account takes as long to reject as a wrong password.
const dummyHash = encryptPassword("not-a-real-password");

const startSession = (res: Response, user: UserRecord) => {
  const payload = toTokenPayload(user);
  setAuthCookies(res, generateAccessToken(payload), generateRefreshToken(payload));
};

const createUserOrConflict = async (data: {
  name: string;
  username: string;
  email: string;
  password: string;
}) => {
  try {
    return await orm.User.create(data);
  } catch (error) {
    //race condition: two requests try to create the same user at the same time. One will succeed, the other will fail with a unique constraint violation.
    if (isUniqueViolation(error)) {
      throw new ApiError(409, "Email or username is already taken");
    }
    throw error;
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  // already trimmed / lowercased (email, username) by registerSchema
  const { name, username, email, password } = req.body as RegisterInput;

  const [emailTaken, usernameTaken] = await Promise.all([
    orm.User.where({ email }).first(),
    orm.User.where({ username }).first(),
  ]);

  if (emailTaken) throw new ApiError(409, "User with this email already exists");
  if (usernameTaken) throw new ApiError(409, "Username is already taken");

  const user = await createUserOrConflict({
    name,
    username,
    email,
    password: await encryptPassword(password),
  });

  startSession(res, user);

  return res.status(201).json(new ApiResponse(201, { user: toSelfUser(user) }, "User registered successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body as LoginInput;

  const user = await orm.User.where({ email }).first();

  const isPasswordCorrect = await comparePassword(
    password,
    user?.password ?? (await dummyHash)
  );

  if (!user || !isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials");
  }

  startSession(res, user);

  return res.status(200).json(new ApiResponse(200, { user: toSelfUser(user) }, "User logged in successfully"));
});

export const logoutUser = asyncHandler(async (_req, res) => {
  // NOTE: clearCookie only works if these options match the ones used in
  // setAuthCookies (path, domain, sameSite, secure). Ideally add a
  // clearAuthCookies(res) helper next to setAuthCookies and call it here.
  //will set path and clear cookie function for a specific path later.
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(200).json(new ApiResponse(200, null, "User logged out successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const user = await orm.User.where({ id: userId }).first();
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, toSelfUser(user), "User details fetched successfully"));
});