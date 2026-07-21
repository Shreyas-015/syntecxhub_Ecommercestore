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
  product: any;
  name: string;
  thumbnail?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface OrderAddress {
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
}

export interface Order {
  _id: string;
  user: string;
  orderItems: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: OrderAddress;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  orderNumber: string;
  notes?: string;
  estimatedDelivery?: string;
  createdAt?: string;
  updatedAt?: string;
}
