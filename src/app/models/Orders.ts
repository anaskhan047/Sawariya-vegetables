import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: {
    productId: mongoose.Types.ObjectId;
    name: string;
    inHindi?: string;
    price: number;
    quantity: number;
    unit: string;
  }[];
  address: {
    name: string;
    phone: string;
    address: string;
    area: string;
  };
  subTotal: number;
  deliveryCharge: number;
  total: number;
  status: "placed" | "packed" | "in_transit" | "delivered" | "cancelled" | "returned";
  statusHistory: {
    status: string;
    by: mongoose.Types.ObjectId | string;
    at: Date;
  }[];
  paymentMethod: "cod" | "online" | "upi";
  paymentStatus: "pending" | "received" | "cod";
  upiId?: string;
  upiTxnInfo?: { userClaimed?: boolean; txnRef?: string; claimedAt?: Date };
  otp?: string;
  otpExpiresAt?: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        inHindi: { type: String, required: false }, // ✅ optional
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
      },
    ],
    address: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      area: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "DeliveryArea", // ✅ must match model name above
},

    },
    subTotal: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, default: "placed" },
    statusHistory: [
      {
        status: { type: String, required: true },
        by: { type: Schema.Types.ObjectId, ref: "User", required: true },
        at: { type: Date, default: Date.now },
      },
    ],
    paymentMethod: { type: String, default: "cod" },
    paymentStatus: { type: String, default: "pending" },
    upiId: { type: String },
    upiTxnInfo: { type: Object },
    otp: { type: String },
    otpExpiresAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
