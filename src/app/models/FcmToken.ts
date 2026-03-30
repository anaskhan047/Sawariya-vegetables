import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFcmToken extends Document {
  userId: mongoose.Types.ObjectId;
  role: "admin" | "delivery" | "user";
  token: string;
  userAgent?: string;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FcmTokenSchema = new Schema<IFcmToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: {
      type: String,
      enum: ["admin", "delivery", "user"],
      required: true,
      index: true,
    },
    token: { type: String, required: true, unique: true, index: true },
    userAgent: { type: String, default: "" },
    lastSeenAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const existingModel = mongoose.models.FcmToken as Model<IFcmToken> | undefined;

const FcmToken = existingModel || mongoose.model<IFcmToken>("FcmToken", FcmTokenSchema);

export default FcmToken;
