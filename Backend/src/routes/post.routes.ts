import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createPost,
  deletePost,
  getFeed,
  getPost,
  getReplies,
  likePost,
  replyToPost,
  unlikePost,
} from "../controllers/post.controller.js";
import {
  idParamSchema,
  paginationQuerySchema,
} from "../shared/validations/common.validation.js";
import { createPostSchema } from "../shared/validations/post.validation.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createPostSchema), createPost);

// must be declared before "/:id" or "feed" would be treated as an id
router.get("/feed", validate(paginationQuerySchema, "query"), getFeed);

router.get("/:id", validate(idParamSchema, "params"), getPost);
router.delete("/:id", validate(idParamSchema, "params"), deletePost);

router.get(
  "/:id/replies",
  validate(idParamSchema, "params"),
  validate(paginationQuerySchema, "query"),
  getReplies
);
router.post(
  "/:id/replies",
  validate(idParamSchema, "params"),
  validate(createPostSchema),
  replyToPost
);

router.post("/:id/like", validate(idParamSchema, "params"), likePost);
router.delete("/:id/like", validate(idParamSchema, "params"), unlikePost);

export default router;