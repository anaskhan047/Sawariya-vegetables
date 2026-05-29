import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPushSubscription extends Document {
  adminId?: string;
  userId?: string;
  role?: "admin" | "delivery" | "user";
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  origin?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    adminId: { type: String, default: "" },
    userId: { type: String, default: "", index: true },
    role: { type: String, enum: ["admin", "delivery", "user"], default: "admin", index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    origin: { type: String, default: null },
  },
  { timestamps: true }
);

const existingModel = mongoose.models
  .PushSubscription as Model<IPushSubscription> | undefined;

const PushSubscription =
  existingModel ||
  mongoose.model<IPushSubscription>(
    "PushSubscription",
    PushSubscriptionSchema
  );

export default PushSubscription;
