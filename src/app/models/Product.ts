import mongoose, { Schema, Document } from "mongoose";

export type ImageRef = {
  url: string;
  public_id: string;
};

export interface IProduct extends Document {
  id: string;
  name: string;
  inHindi?: string;
  description?: string;
  marketPrice: number;
  price: number;
  category?: string;
  stockQty: number;
  unit: "kg" | "piece" | "dozen";
  tags: string[]; // ✅ multiple tags support
  minQty: number;
  maxQty: number;
  images: ImageRef[];
  grade: "Premium" | "Gold" | "Silver" | "Standard";
  popular: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schema for images
const ImageSchema = new Schema<ImageRef>(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    inHindi: { type: String, default: "" },
    description: { type: String, default: "" },
    marketPrice: { type: Number, required: true },
    price: { type: Number, required: true },
    category: { type: String, default: "" },
    stockQty: { type: Number, default: 0 },
    unit: { type: String, enum: ["kg", "piece", "dozen"], default: "kg" },
    tags: { type: [String], default: [] }, // ✅ added here
    minQty: { type: Number, default: 1 },
    maxQty: { type: Number, default: 10 },
    images: { type: [ImageSchema], default: [] },
    grade: {
      type: String,
      enum: ["Premium", "Gold", "Silver", "Standard"],
      default: "Standard",
    },
    popular: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Fix Next.js + Mongoose hot reload
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

const Product =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
