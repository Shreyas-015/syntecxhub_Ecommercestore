import mongoose from "mongoose";

export enum PaymentStatus {
  PENDING = "pending",
  AUTHORIZED = "authorized",
  PAID = "paid",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded"
}

export enum PaymentMethod {
  CARD = "card",
  UPI = "upi",
  WALLET = "wallet",
  NET_BANKING = "netBanking",
  COD = "cod"
}

export enum PaymentProviderName {
  STRIPE = "Stripe",
  RAZORPAY = "Razorpay",
  CASH_ON_DELIVERY = "CashOnDelivery"
}

export interface IPaymentAmounts {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export interface IPayment {
  id?: string;
  _id?: string | mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId | string;
  order: mongoose.Types.ObjectId | string;
  provider: PaymentProviderName | string;
  paymentId?: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  providerSignature?: string;
  transactionId?: string;
  amounts: IPaymentAmounts;
  currency: string;
  exchangeRate?: number;
  status: PaymentStatus;
  method: PaymentMethod;
  refundId?: string;
  refundStatus?: string;
  refundAmount?: number;
  refundReason?: string;
  refundCreatedAt?: Date;
  metadata?: {
    providerResponse?: any;
    failureReason?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
