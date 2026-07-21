import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentAuditLog extends Document {
  user?: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  payment?: mongoose.Types.ObjectId;
  provider: string;
  action: string;
  result: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentAuditLogSchema = new Schema<IPaymentAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", index: true },
    payment: { type: Schema.Types.ObjectId, ref: "Payment", index: true },
    provider: { type: String, required: true, index: true },
    action: {
      type: String,
      required: true,
      enum: [
        "Payment Created",
        "Payment Verified",
        "Payment Failed",
        "Payment Cancelled",
        "Refund Requested",
        "Refund Completed",
        "Inventory Updated",
        "Cart Cleared",
        "Webhook Received",
        "Transaction Rolled Back"
      ],
      index: true
    },
    result: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

export const PaymentAuditLog = mongoose.model<IPaymentAuditLog>("PaymentAuditLog", PaymentAuditLogSchema);
