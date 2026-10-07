import { ApiResponse } from "../shared/utils/ApiResponse.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { requireUserId } from "../shared/utils/requireUserId.js";
import * as postService from "../services/post.service.js";
import type { IdParam, PaginationQuery } from "../shared/validations/common.validation.js";
import type { CreatePostInput } from "../shared/validations/post.validation.js";

export const createPost = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const { content } = req.body as CreatePostInput;

  const post = await postService.createPost(userId, content);
  return res.status(201).json(new ApiResponse(201, post, "Post created"));
});

export const replyToPost = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const { id } = req.params as IdParam;
  const { content } = req.body as CreatePostInput;

  const reply = await postService.createPost(userId, content, id);
  return res.status(201).json(new ApiResponse(201, reply, "Reply created"));
});

export const getPost = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const { id } = req.params as IdParam;

  const post = await postService.getPostById(id, userId);
  return res.status(200).json(new ApiResponse(200, post, "Post fetched"));
});

export const deletePost = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const { id } = req.params as IdParam;

  await postService.deletePost(id, userId);
  return res.status(200).json(new ApiResponse(200, null, "Post deleted"));
});

export const getFeed = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const { limit, cursor } = req.query as unknown as PaginationQuery;

  const page = await postService.getHomeFeed(userId, { limit, cursor });
  return res.status(200).json(new ApiResponse(200, page, "Feed fetched"));
});

export const getReplies = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const { id } = req.params as IdParam;
  const { limit, cursor } = req.query as unknown as PaginationQuery;

  const page = await postService.getReplies(id, userId, { limit, cursor });
  return res.status(200).json(new ApiResponse(200, page, "Replies fetched"));
});

export const likePost = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const { id } = req.params as IdParam;

  const result = await postService.likePost(userId, id);
  return res.status(200).json(new ApiResponse(200, result, "Post liked"));
});

export const unlikePost = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const { id } = req.params as IdParam;

  const result = await postService.unlikePost(userId, id);
  return res.status(200).json(new ApiResponse(200, result, "Post unliked"));
});