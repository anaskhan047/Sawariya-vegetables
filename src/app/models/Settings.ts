import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
  key: "global";
  businessEmail: string;
  businessPhone: string;
  deliveryCharge: number;
  deliveryTimeWindow: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, default: "global", unique: true },
    businessEmail: { type: String, required: true, default: "admin@myshop.com" },
    businessPhone: { type: String, required: true, default: "+91 9876543210" },
    deliveryCharge: { type: Number, required: true, default: 40 },
    deliveryTimeWindow: { type: String, required: true, default: "9 AM - 9 PM" },
  },
  { timestamps: true }
);

const existing = mongoose.models.Settings as Model<ISettings> | undefined;
const SettingsModel = existing || mongoose.model<ISettings>("Settings", SettingsSchema);
export default SettingsModel;
