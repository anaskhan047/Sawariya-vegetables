// src/models/Category.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug?: string;
  imageUrl?: string;
  public_id?: string; // cloudinary public id
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: false, index: true },
    imageUrl: { type: String, required: false },
    public_id: { type: String, required: false, unique: false },
  },
  { timestamps: true }
);

export default mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
