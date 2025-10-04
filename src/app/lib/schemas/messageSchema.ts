import { z } from "zod";

export const MessageSchema = z.object({
    name: z.string().min(2).max(100),
    number: z.string().min(10).max(15),
  email: z.string().email(),
    message: z.string().min(10).max(500),
    status: z.enum(["New", "Replied"]).optional(),
  createdAt: z.string().optional(),
});

export type MessageSchemaType = z.infer<typeof MessageSchema>;
