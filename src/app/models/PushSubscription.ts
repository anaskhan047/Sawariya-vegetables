import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPushSubscription extends Document {
  token: string;
  origin?: string | null;
  adminId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    token: { type: String, required: true, unique: true },
    origin: { type: String, default: null },
    adminId: { type: String, default: "" }
  },
  { timestamps: true }
);

const PushSubscription =
  (mongoose.models.PushSubscription as Model<IPushSubscription>) ||
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);

export default PushSubscription;
