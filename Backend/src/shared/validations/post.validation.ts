import { z } from "zod";

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post cannot be empty")
    .max(280, "Post cannot exceed 280 characters"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;