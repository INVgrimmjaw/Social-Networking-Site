import { db } from "../prisma/db.js";
import { ApiError } from "../shared/utils/ApiError.js";

export const MAX_POST_LENGTH = 280;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export interface PageParams {
  cursor?: string;
  limit?: number;
}

interface Cursor {
  createdAt: string;
  id: string;
}

interface PostRow {
  id: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; username: string | null; name: string | null} | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Always narrow the author: a bare .include("author") returns the whole User row,
// including the password hash.
const withAuthor = () =>
  db.orm.public.Post.include("author", (author) =>
    author.select("id", "username", "name")
  );
  
// Pick fields explicitly so nothing extra can leak into responses.
const toPostDto = (post: PostRow) => {
  if (!post.author) throw new ApiError(500, "Post is missing its author");

  return {
    id: post.id,
    content: post.content ?? "",
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: {
      id: post.author.id,
      username: post.author.username ?? "",
      name: post.author.name ?? "",
    },
  };
};

const encodeCursor = (cursor: Cursor) =>
  Buffer.from(JSON.stringify(cursor)).toString("base64url");

const decodeCursor = (raw?: string): Cursor | undefined => {
  if (!raw) return undefined;

  let parsed: Partial<Cursor> | undefined;
  try {
    parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    // fall through to the 400 below
  }

  if (
    typeof parsed?.createdAt === "string" &&
    typeof parsed.id === "string" &&
    !Number.isNaN(Date.parse(parsed.createdAt))
  ) {
    return { createdAt: parsed.createdAt, id: parsed.id };
  }
  throw new ApiError(400, "Invalid cursor");
};

/**
 * Fetches limit + 1 rows so we know whether another page exists
 * without a separate count query.
 */
const paginate = async (
  params: PageParams,
  run: (cursor: Cursor | undefined, take: number) => Promise<PostRow[]>
) => {
  const requested =
    params.limit && Number.isFinite(params.limit)
      ? Math.trunc(params.limit)
      : DEFAULT_PAGE_SIZE;
  const limit = Math.min(Math.max(requested, 1), MAX_PAGE_SIZE);

  const rows = await run(decodeCursor(params.cursor), limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];

  return {
    items: items.map(toPostDto),
    nextCursor:
      hasMore && last
        ? encodeCursor({ createdAt: last.createdAt, id: last.id })
        : null,
  };
};

// ---------------------------------------------------------------------------
// Single-post operations
// ---------------------------------------------------------------------------

export const getPostById = async (postId: string) => {
  const post = await withAuthor().where({ id: postId }).first();
  if (!post) throw new ApiError(404, "Post not found");
  if (!post.author) throw new ApiError(500, "Post is missing its author");
  return toPostDto(post);
};

export const createPost = async (authorId: string, rawContent: string) => {
  const content = rawContent.trim();

  // Array.from counts code points, so an emoji is 1 character, not 2.
  const length = Array.from(content).length;
  if (length === 0) throw new ApiError(400, "Post cannot be empty");
  if (length > MAX_POST_LENGTH) {
    throw new ApiError(400, `Post cannot exceed ${MAX_POST_LENGTH} characters`);
  }

  const created = await db.orm.public.Post.create({ content: content, authorId: authorId });
  return getPostById(created.id);
};

export const deletePost = async (postId: string, userId: string) => {
  const post = await db.orm.public.Post.where({ id: postId })
    .select("id", "authorId")
    .first();

  if (!post) throw new ApiError(404, "Post not found");
  if (post.authorId !== userId) {
    throw new ApiError(403, "You can only delete your own posts");
  }

  // authorId in the filter too, so a race can't delete someone else's post.
  // Likes and replies go with it via onDelete: Cascade in the contract.
  await db.orm.public.Post.where({ id: postId, authorId: userId }).delete();
};

// ---------------------------------------------------------------------------
// Lists (newest first, cursor-paginated on (createdAt, id))
// ---------------------------------------------------------------------------

/** Profile timeline: a user's top-level posts (replies excluded). */
/*export const getUserPosts = async (
  username: string,
  params: PageParams = {}
) => {
  const author = await db.orm.public.User.where({
    username: username.toLowerCase().trim(),
  })
    .select("id")
    .first();
  if (!author) throw new ApiError(404, "User not found");

  return paginate(params, async (cursor, take) => {
    const query = withAuthor()
      .where({ authorId: author.id })
      .where((p) => p.parentId.isNull())
      .orderBy([(p) => p.createdAt.desc(), (p) => p.id.desc()]);

    // id stays in the sort and the cursor: createdAt alone can tie.
    return (cursor ? query.cursor(cursor) : query).limit(take).all();
  });
};*/

/** Home feed: top-level posts from people you follow, plus your own. */
/*export const getHomeFeed = async (userId: string, params: PageParams = {}) => {
  const follows = await db.orm.public.Follow.where({ followerId: userId })
    .select("followingId")
    .all();
  const authorIds = [userId, ...follows.map((f) => f.followingId)];

  return paginate(params, async (cursor, take) => {
    const query = withAuthor()
      .where((p) => p.authorId.in(authorIds))
      .where((p) => p.parentId.isNull())
      .orderBy([(p) => p.createdAt.desc(), (p) => p.id.desc()]);

    return (cursor ? query.cursor(cursor) : query).limit(take).all();
  });
};*/