import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICartItem {
  productId: Types.ObjectId;
  quantity: number;
  priceAtAdd: number;
}

export interface ICart extends Document {
  cartId: string;
  userId?: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    priceAtAdd: { type: Number, required: true },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    cartId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true }
);

export default (mongoose.models.Cart as mongoose.Model<ICart>) ||
  mongoose.model<ICart>("Cart", CartSchema);
