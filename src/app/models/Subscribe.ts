import mongoose, { Schema, models, model } from "mongoose";

export interface Subscribe {
  email: string;
  createdAt: Date;
}

const SubscribeSchema = new Schema<Subscribe>(
  {
    email: { type: String, required: true, unique: true },
  },
  { timestamps: { createdAt: "createdAt" } }
);

//  Fix: Use existing model if already compiled
const SubscribeModel = models.Subscribe || model<Subscribe>("Subscribe", SubscribeSchema);

export default SubscribeModel;
