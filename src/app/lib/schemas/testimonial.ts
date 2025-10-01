import z from 'zod';

export const testimonialSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(212),
  rating: z.number().min(1).max(5).optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  creditedAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
