import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  followUser,
  getFollowers,
  getFollowing,
  getProfile,
  getUserPosts,
  unfollowUser,
} from "../controllers/user.controller.js";
import {
  paginationQuerySchema,
  usernameParamSchema,
} from "../shared/validations/common.validation.js";

const router = Router();

router.use(authenticate);

const username = validate(usernameParamSchema, "params");
const pagination = validate(paginationQuerySchema, "query");

router.get("/:username", username, getProfile);
router.get("/:username/posts", username, pagination, getUserPosts);
router.get("/:username/followers", username, pagination, getFollowers);
router.get("/:username/following", username, pagination, getFollowing);
router.post("/:username/follow", username, followUser);
router.delete("/:username/follow", username, unfollowUser);

export default router;