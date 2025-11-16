// src/app/models/PushSubscription.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPushSubscription extends Document {
  adminId?: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  origin?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    adminId: { type: String, default: "" },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    origin: { type: String, default: "" }, // <-- store origin (e.g. https://www.shrisawariyamart.com)
  },
  { timestamps: true }
);

const existingModel = mongoose.models.PushSubscription as Model<IPushSubscription> | undefined;

const PushSubscription =
  existingModel || mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);

export default PushSubscription;
