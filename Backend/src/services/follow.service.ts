import { db } from "../prisma/db.js";
import { ApiError } from "../shared/utils/ApiError.js";

const findUserByUsername = async (username: string) => {
  const user = await db.orm.public.User.where({
    username: username.toLowerCase().trim(),
  })
    .select("id", "username")
    .first();
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

/** Idempotent: following someone you already follow is a no-op, not an error. */
export const followUser = async (followerId: string, username: string) => {
  const target = await findUserByUsername(username);

  if (target.id === followerId) {
    throw new ApiError(400, "You can't follow yourself");
  }

  // onConflict "skip" ignores the insert if the (followerId, followingId) pair exists.
  const inserted = await db.orm.public.Follow.createAndCount(
    [{ followerId, followingId: target.id }],
    { onConflict: "skip" }
  );

  return { following: true, changed: inserted > 0 };
};

/** Idempotent: unfollowing someone you don't follow is a no-op. */
export const unfollowUser = async (followerId: string, username: string) => {
  const target = await findUserByUsername(username);

  const removed = await db.orm.public.Follow.where({
    followerId,
    followingId: target.id,
  }).deleteAndCount();

  return { following: false, changed: removed > 0 };
};