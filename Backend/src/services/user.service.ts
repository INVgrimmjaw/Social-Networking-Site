import { db } from "../prisma/db.js";
import { ApiError } from "../shared/utils/ApiError.js";
import { isUniqueViolation } from "../shared/utils/dbErrors.js";
import { toPublicUser } from "../shared/utils/toPublicUser.js";

/*
 * ORM calls beyond where({..}) / first() / create() that need to match your
 * Prisma Next version: .count()  .in([...])  .lt(value)  .orderBy(..desc())
 * .take(n)  .all()  .delete()
 */
const orm = db.orm.public;

export interface PageParams {
  limit: number;
  cursor?: string;
}

export const getUserByUsernameOrThrow = async (username: string) => {
  const user = await orm.User.where({ username }).first();
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

export const getProfile = async (username: string, viewerId: string) => {
  const user = await getUserByUsernameOrThrow(username);
  const isSelf = user.id === viewerId;

  const [postCount, followerCount, followingCount, relation] = await Promise.all([
    orm.Post.where({ authorId: user.id }).count(),
    orm.Follow.where({ followingId: user.id }).count(),
    orm.Follow.where({ followerId: user.id }).count(),
    isSelf
      ? null
      : orm.Follow.where({ followerId: viewerId, followingId: user.id }).first(),
  ]);

  return {
    ...toPublicUser(user),
    postCount,
    followerCount,
    followingCount,
    isSelf,
    isFollowing: Boolean(relation),
  };
};

// -------------------------------------------------------------- follows

export const followUser = async (followerId: string, username: string) => {
  const target = await getUserByUsernameOrThrow(username);

  if (target.id === followerId) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const existing = await orm.Follow.where({
    followerId,
    followingId: target.id,
  }).first();

  if (!existing) {
    try {
      await orm.Follow.create({ followerId, followingId: target.id });
    } catch (error) {
      // simultaneous requests: the composite primary key rejects the duplicate
      if (!isUniqueViolation(error)) throw error;
    }
  }

  return { following: true };
};

export const unfollowUser = async (followerId: string, username: string) => {
  const target = await getUserByUsernameOrThrow(username);

  await orm.Follow.where({ followerId, followingId: target.id }).delete();

  return { following: false };
};

/** direction "followers": who follows this user. "following": who this user follows. */
/*export const listConnections = async (
  username: string,
  direction: "followers" | "following",
  { limit, cursor }: PageParams
) => {
  const user = await getUserByUsernameOrThrow(username);

  const base =
    direction === "followers"
      ? orm.Follow.where({ followingId: user.id })
      : orm.Follow.where({ followerId: user.id });
  const query = cursor ? base.where((f) => f.createdAt.lt(cursor)) : base;

  const rows = await query
    .orderBy((f) => f.createdAt.desc())
    .take(limit + 1)
    .all();

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  const userIds = pageRows.map((r) =>
    direction === "followers" ? r.followerId : r.followingId
  );
  const users =
    userIds.length > 0 ? await orm.User.where((u) => u.id.in(userIds)).all() : [];
  const userById = new Map(users.map((u) => [u.id, toPublicUser(u)]));

  return {
    items: userIds.map((id) => userById.get(id)).filter(Boolean),
    nextCursor: hasMore ? (pageRows[pageRows.length - 1]?.createdAt ?? null) : null,
  };
};*/