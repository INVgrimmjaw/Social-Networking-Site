import { db } from "../prisma/db.js";
import { ApiError } from "../shared/utils/ApiError.js";
import { comparePassword, encryptPassword } from "../shared/utils/auth/hash.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../shared/utils/auth/jwt.js";

const USERNAME_RE = /^[a-z0-9_]{3,15}$/;

interface UserRow {
  id: string;
  email: string;
  username: string;
  name: string;
  bio?: string | null;
  createdAt: string;
}

/** The only shape of a user that ever leaves the service. No password. */
export const toSelfUser = (user: UserRow) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  name: user.name,
  bio: user.bio ?? null,
  createdAt: user.createdAt,
});

// PostgreSQL SQL state 23505 = unique_violation (see Prisma 8 "Writing data" docs)
const isUniqueViolation = (error: unknown) =>
  (error as { sqlState?: string } | null)?.sqlState === "23505";

// Only the id goes in the token: name/email go stale when the profile changes.
// If generateAccessToken's payload type still requires name/email, loosen it in jwt.ts
// (and in express.d.ts for req.user).

const issueTokens = (userId: string) => {
  const payload = { id: userId };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

// Hash compared against when the email doesn't exist, so "unknown email" and
// "wrong password" take about the same time.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= encryptPassword("not-a-real-password"));

export interface RegisterInput {
  name: string;
  username: string;
  email: string;
  password: string;
}

export const registerUser = async (input: RegisterInput) => {
  const email = input.email.toLowerCase().trim();
  const username = input.username.toLowerCase().trim();
  const name = input.name.trim();

  if (!USERNAME_RE.test(username)) {
    throw new ApiError(
      400,
      "Username must be 3-15 characters: lowercase letters, numbers, underscores"
    );
  }

  // Friendly messages for the common case...
  const [emailTaken, usernameTaken] = await Promise.all([
    db.orm.public.User.where({ email }).first(),
    db.orm.public.User.where({ username }).first(),
  ]);
  if (emailTaken) throw new ApiError(409, "Email is already registered");
  if (usernameTaken) throw new ApiError(409, "Username is already taken");

  const password = await encryptPassword(input.password);

  // ...and the unique constraints are the real guard against two simultaneous requests.
  try {
    const user = await db.orm.public.User.create({
      email,
      username,
      name,
      password,
    });
    return { user: toSelfUser(user), ...issueTokens(user.id) };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError(409, "Email or username is already in use");
    }
    throw error;
  }
};

export const loginUser = async (emailInput: string, password: string) => {
  const user = await db.orm.public.User.where({
    email: emailInput.toLowerCase().trim(),
  }).first();

  const passwordOk = await comparePassword(
    password,
    user?.password ?? (await getDummyHash())
  );

  if (!user || !passwordOk) {
    throw new ApiError(401, "Invalid credentials");
  }

  return { user: toSelfUser(user), ...issueTokens(user.id) };
};

export const getUserById = async (id: string) => {
  const user = await db.orm.public.User.where({ id }).first();
  if (!user) throw new ApiError(404, "User not found");
  return toSelfUser(user);
};