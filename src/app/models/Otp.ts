// app/models/Otp.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  email: string;
  otpHash: string;
  type: "register" | "forgot";
  payload?: OtpPayload;
  createdAt: Date;
}

export interface OtpPayload {
  name?: string;
  passwordHash?: string;
  role?: string;
}


const OtpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    type: { type: String, enum: ["register", "forgot"], required: true },
    payload: { type: Schema.Types.Mixed }, // store name, passwordHash, role for register
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// expire documents after 10 minutes
OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

export default (mongoose.models.Otp as mongoose.Model<IOtp>) ||
  mongoose.model<IOtp>("Otp", OtpSchema);
