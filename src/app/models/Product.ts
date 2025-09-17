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
  price: number;
  category?: string;
  stockQty: number;
  unit: "kg" | "piece" | "dozen";
  minQty: number;
  maxQty: number;
  images: ImageRef[];
  grade: "Premium" | "Gold" | "Silver" | "Standard";
  popular: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
    price: { type: Number, required: true },
    category: { type: String, default: "" },
    stockQty: { type: Number, default: 0 },
    unit: { type: String, enum: ["kg", "piece", "dozen"], default: "kg" },
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

export default (mongoose.models.Product as mongoose.Model<IProduct>) ||
  mongoose.model<IProduct>("Product", ProductSchema);
