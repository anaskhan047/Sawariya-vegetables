import mongoose, { Schema, Document } from "mongoose";

export interface IHeroImage extends Document {
  url: string;
  public_id: string;
  section: string; // For example: "hero"
  createdAt: Date;
}

const HeroImageSchema = new Schema<IHeroImage>(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    section: { type: String, default: "hero" },
  },
  { timestamps: true }
);

export default mongoose.models.HeroImage ||
  mongoose.model<IHeroImage>("HeroImage", HeroImageSchema);
