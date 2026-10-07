import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id"),
});

export const usernameParamSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(30),
});

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  // the createdAt timestamp of the last item from the previous page
  cursor: z.string().min(1).max(64).optional(),
});

export type IdParam = z.infer<typeof idParamSchema>;
export type UsernameParam = z.infer<typeof usernameParamSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;