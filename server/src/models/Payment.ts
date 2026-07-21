import mongoose, { Schema, Document } from "mongoose";
import { IPayment, PaymentStatus, PaymentMethod, PaymentProviderName } from "../types/payment";

export interface IPaymentDocument extends Omit<IPayment, "_id">, Document {}

const PaymentSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },
    provider: {
      type: String,
      required: true,
      enum: Object.values(PaymentProviderName),
      index: true
    },
    paymentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    providerOrderId: {
      type: String,
      index: true
    },
    providerPaymentId: {
      type: String,
      index: true
    },
    providerSignature: {
      type: String
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    amounts: {
      subtotal: { type: Number, required: true },
      tax: { type: Number, required: true, default: 0 },
      shipping: { type: Number, required: true, default: 0 },
      discount: { type: Number, required: true, default: 0 },
      total: { type: Number, required: true }
    },
    currency: {
      type: String,
      required: true,
      default: "USD"
    },
    exchangeRate: {
      type: Number,
      default: 1.0
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true
    },
    method: {
      type: String,
      required: true,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.CARD
    },
    refundId: {
      type: String,
      sparse: true,
      index: true
    },
    refundStatus: {
      type: String,
      sparse: true,
      index: true
    },
    refundAmount: {
      type: Number
    },
    refundReason: {
      type: String
    },
    refundCreatedAt: {
      type: Date
    },
    metadata: {
      providerResponse: { type: Schema.Types.Mixed },
      failureReason: { type: String }
    }
  },
  {
    timestamps: true
  }
);

export const Payment = mongoose.model<IPaymentDocument>("Payment", PaymentSchema);
