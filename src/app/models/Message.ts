import mongoose, { Schema, models, model } from "mongoose";

export interface Subscribe {
  name: string;
  number: string;
  email: string;
  message: string;
  status: "New" | "Replied";
  createdAt: Date;
}

const MessageSchema = new Schema<Subscribe>(
  {
    name: { type: String, required: true },
    number: { type: String, required: true },
    message: { type: String, required: true },
    email: { type: String, required: true },
    status: {
      type: String,
      enum: ["New", "Replied"],
      default: "New",
    },
  },
  { timestamps: { createdAt: "createdAt" } }
);

const MessageModel = models.Message || model<Subscribe>("Message", MessageSchema);

export default MessageModel;
