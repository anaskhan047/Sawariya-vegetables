// src/app/models/Notification.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  title: string;
  message: string;
  meta?: Record<string, unknown>; // ✅ replaced `any` with `unknown`
  read: boolean;
  forRole?: string; // "admin"
  createdAt: Date;
  updatedAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
    forRole: { type: String, default: "admin" },
  },
  { timestamps: true }
);

// Safely access mongoose.models with typing — no `any` used
const existingModel =
  (mongoose.models.Notification as Model<INotification>) || undefined;

const Notification =
  existingModel || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
