import mongoose, { Schema, Document } from "mongoose";
import { OrderStatus, PaymentStatus, PaymentMethod } from "../types/order";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  thumbnail?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderItems: IOrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    landmark?: string;
    addressType?: string;
  };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  orderNumber: string;
  notes?: string;
  estimatedDelivery?: Date;
  returnRequested?: boolean;
  returnStatus?: string;
  returnReason?: string;
  returnRequestedAt?: Date;
  inventoryDeducted?: boolean;
  invoiceNumber?: string;
  timeline?: Array<{ status: string; timestamp: Date; note?: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    thumbnail: { type: String },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be greater than 0"]
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price must be non-negative"]
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal must be non-negative"]
    }
  },
  { _id: false }
);

const OrderAddressSchema = new Schema(
  {
    fullName: { type: String, required: [true, "Full name is required"] },
    phone: { type: String, required: [true, "Phone number is required"] },
    addressLine1: { type: String, required: [true, "Address line 1 is required"] },
    addressLine2: { type: String },
    city: { type: String, required: [true, "City is required"] },
    state: { type: String, required: [true, "State is required"] },
    postalCode: { type: String, required: [true, "Postal code is required"] },
    country: { type: String, required: [true, "Country is required"] },
    landmark: { type: String },
    addressType: { type: String, enum: ["Home", "Work", "Other"] }
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderItems: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: function(v: any) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "Order must contain at least one item"
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal must be non-negative"]
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount must be non-negative"]
    },
    shipping: {
      type: Number,
      default: 0,
      min: [0, "Shipping must be non-negative"]
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, "Tax must be non-negative"]
    },
    total: {
      type: Number,
      required: true,
      min: [0, "Total must be non-negative"]
    },
    shippingAddress: {
      type: OrderAddressSchema,
      required: [true, "Shipping address is required"]
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: [true, "Payment method is required"]
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    notes: { type: String },
    estimatedDelivery: { type: Date },
    returnRequested: { type: Boolean, default: false },
    returnStatus: { type: String, enum: ["None", "Pending", "Approved", "Rejected"], default: "None" },
    returnReason: { type: String },
    returnRequestedAt: { type: Date },
    inventoryDeducted: { type: Boolean, default: false },
    invoiceNumber: { type: String, unique: true, sparse: true, index: true },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String }
      }
    ]
  },
  {
    timestamps: true
  }
);

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
