import { z } from "zod";

const toNumber = (int = false, opts?: { nonnegative?: boolean; positive?: boolean }) =>
  z.preprocess(
    (v) => (typeof v === "string" && v !== "" ? Number(v) : v),
    int ? z.number().int() : z.number()
  ).refine((val) => {
    if (typeof val !== "number" || isNaN(val)) return false;
    if (opts?.nonnegative && val < 0) return false;
    if (opts?.positive && val <= 0) return false;
    return true;
  }, {
    message: opts?.positive ? "Must be > 0" : "Must be >= 0",
  });

const imageRef = z.object({
  url: z.string().url(),
  public_id: z.string().min(1),
});

export const productSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1),
    inHindi: z.string().optional().default(""),
    description: z.string().optional().default(""),

    price: toNumber(false, { nonnegative: true }),
    category: z.string().optional().default(""),

    stockQty: toNumber(true, { nonnegative: true }).optional().default(0),

    unit: z.enum(["kg", "piece", "dozen"]).default("kg"),
    minQty: toNumber(false, { positive: true }).default(1),
    maxQty: toNumber(false, { positive: true }).default(10),

    images: z.array(imageRef).optional().default([]),

    grade: z.enum(["Premium", "Gold", "Silver", "Standard"]).default("Standard"),
    popular: z.boolean().default(false),

    imageBase64: z.string().optional(),
    imagesBase64: z.array(z.string()).optional(),
  })
  .refine((d) => (d.minQty ?? 1) <= (d.maxQty ?? 10), {
    message: "maxQty must be >= minQty",
    path: ["maxQty"],
  });
