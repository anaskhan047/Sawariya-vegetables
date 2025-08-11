import { z } from "zod";

export const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  file: z.any().optional(),
});
