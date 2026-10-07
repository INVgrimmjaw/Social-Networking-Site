import { Router } from "express";
// Assumed: your existing middleware that verifies the access token and sets req.user.
// Adjust the file/export name to match yours.
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/auth.controller.js";
import { loginSchema, registerSchema } from "../shared/validations/auth.validation.js";

const router = Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/logout", logoutUser);
router.get("/me", authenticate, getCurrentUser);

export default router;