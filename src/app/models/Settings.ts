import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  key: "global";
  businessEmail: string;
  businessPhone: string;
  deliveryCharge: number;
  deliveryTimeWindow: string;
  /** 24h "HH:MM" — when customers may place orders (checkout). */
  orderWindowStart: string;
  /** 24h "HH:MM" — end of order window; "00:00" = midnight (end of day). */
  orderWindowEnd: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, default: "global", unique: true },
    businessEmail: { type: String, required: true, default: "admin@myshop.com" },
    businessPhone: { type: String, required: true, default: "+91 9876543210" },
    deliveryCharge: { type: Number, required: true, default: 40 },
    deliveryTimeWindow: { type: String, required: true, default: "8:00 AM – 12:00 AM (midnight)" },
    orderWindowStart: { type: String, required: true, default: "08:00" },
    orderWindowEnd: { type: String, required: true, default: "00:00" },
  },
  { timestamps: true }
);

// Hot reload: re-register schema when orderWindowStart/End fields are added
if (mongoose.models.Settings) {
  delete mongoose.models.Settings;
}

const SettingsModel = mongoose.model<ISettings>("Settings", SettingsSchema);
export default SettingsModel;
