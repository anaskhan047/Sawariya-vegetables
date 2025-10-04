import { z } from "zod";

export const subscribeSchema = z.object({
  email: z.string().email(),
  createdAt: z.string().optional(),
});

export type SubscribeSchemaType = z.infer<typeof subscribeSchema>;
