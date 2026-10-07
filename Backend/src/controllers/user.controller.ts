import { ApiResponse } from "../shared/utils/ApiResponse.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { requireUserId } from "../shared/utils/requireUserId.js";
import * as userService from "../services/user.service.js";
import * as postService from "../services/post.service.js";
import type { PaginationQuery, UsernameParam } from "../shared/validations/common.validation.js";

export const getProfile = asyncHandler(async (req, res) => {
  const viewerId = requireUserId(req);
  const { username } = req.params as UsernameParam;

  const profile = await userService.getProfile(username, viewerId);
  return res.status(200).json(new ApiResponse(200, profile, "Profile fetched"));
});

export const getUserPosts = asyncHandler(async (req, res) => {
  const viewerId = requireUserId(req);
  const { username } = req.params as UsernameParam;
  const { limit, cursor } = req.query as unknown as PaginationQuery;

  const page = await postService.getPostsByUsername(username, viewerId, { limit, cursor });
  return res.status(200).json(new ApiResponse(200, page, "Posts fetched"));
});

export const followUser = asyncHandler(async (req, res) => {
  const viewerId = requireUserId(req);
  const { username } = req.params as UsernameParam;

  const result = await userService.followUser(viewerId, username);
  return res.status(200).json(new ApiResponse(200, result, "Followed"));
});

export const unfollowUser = asyncHandler(async (req, res) => {
  const viewerId = requireUserId(req);
  const { username } = req.params as UsernameParam;

  const result = await userService.unfollowUser(viewerId, username);
  return res.status(200).json(new ApiResponse(200, result, "Unfollowed"));
});

export const getFollowers = asyncHandler(async (req, res) => {
  requireUserId(req);
  const { username } = req.params as UsernameParam;
  const { limit, cursor } = req.query as unknown as PaginationQuery;

  const page = await userService.listConnections(username, "followers", { limit, cursor });
  return res.status(200).json(new ApiResponse(200, page, "Followers fetched"));
});

export const getFollowing = asyncHandler(async (req, res) => {
  requireUserId(req);
  const { username } = req.params as UsernameParam;
  const { limit, cursor } = req.query as unknown as PaginationQuery;

  const page = await userService.listConnections(username, "following", { limit, cursor });
  return res.status(200).json(new ApiResponse(200, page, "Following fetched"));
});