import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotification extends Document {
  title: string;
  message: string;
  meta?: Record<string, unknown>;
  read: boolean;
  forRole?: "admin" | "user";
  userId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
    forRole: { type: String, enum: ["admin", "user"], default: "admin", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  },
  { timestamps: true }
);

const existingModel = mongoose.models.Notification as Model<INotification> | undefined;

const Notification =
  existingModel || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
