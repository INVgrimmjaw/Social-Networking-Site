import { Router } from "express";
import authRoutes from "./auth.routes.js";
import postRoutes from "./post.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/users", userRoutes);

export default router;