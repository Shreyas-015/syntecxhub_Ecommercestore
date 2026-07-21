import { Product } from "./product";
import { Address } from "./address";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  OUT_FOR_DELIVERY = "outForDelivery",
  DELIVERED = "delivered",
  CANCELLED = "cancelled"
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded"
}

export enum PaymentMethod {
  CASH_ON_DELIVERY = "CashOnDelivery",
  STRIPE = "Stripe",
  RAZORPAY = "Razorpay"
}

export interface OrderItem {
  product: string | Product | any; // ObjectId (string) or populated Product object
  name: string;
  thumbnail?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id?: string;
  _id?: string;
  user: string | any; // ObjectId (string) or populated User object
  orderItems: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: Address | any; // Snapshot of the address
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
  createdAt?: Date;
  updatedAt?: Date;
}
