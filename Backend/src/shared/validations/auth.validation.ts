import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9_]{3,15}$/,
      "Username must be 3-15 characters: letters, numbers, underscore"
    ),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;