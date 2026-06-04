import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  image?: string;
  profilePhotoUrl?: string;
  firebaseUid?: string;
  authProvider?: "password" | "google";
  lastLoginAt?: Date;
  verified: boolean;
  role: "admin" | "delivery" | "user";
  isActive: boolean; // 👈 add this line
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    image: { type: String },
    profilePhotoUrl: { type: String },
    firebaseUid: { type: String, sparse: true, unique: true },
    authProvider: {
      type: String,
      enum: ["password", "google"],
      default: "password",
    },
    lastLoginAt: { type: Date },
    verified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["admin", "delivery", "user"],
      default: "user",
    },
    isActive: { type: Boolean, default: true }, // 👈 add this field to schema
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
