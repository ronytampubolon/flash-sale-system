import mongoose from "mongoose";
import { IOrder, PurchaseStatus } from "../types";

export interface IOrderModel extends IOrder, mongoose.Document { }

const orderSchema = new mongoose.Schema<IOrderModel>({
  userId: { type: String, required: true },
  itemId: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  totalPrice: { type: Number, required: true, default: 0 },
  status: { type: String, required: true, enum: Object.values(PurchaseStatus) },
}, {
  timestamps: true, // adds createdAt, updatedAt automatically
});

orderSchema.index({ userId: 1, itemId: 1 }, { unique: true });

export default mongoose.model<IOrderModel>("Order", orderSchema);