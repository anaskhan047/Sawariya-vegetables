import mongoose, { Schema, Document } from "mongoose";

export interface IDeliveryArea extends Document {
  name: string;
  pincode: string;
}

const DeliveryAreaSchema = new Schema<IDeliveryArea>(
  {
    name: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.DeliveryArea ||
  mongoose.model<IDeliveryArea>("DeliveryArea", DeliveryAreaSchema);
