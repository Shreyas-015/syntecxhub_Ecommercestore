import { IOrder } from "../models/Order";
import { orderRepository } from "../repositories/orderRepository";
import { NotFoundError } from "../utils/errors";

export interface IInvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  orderNumber: string;
  orderDate: Date;
  customerSnapshot: {
    userId: string;
    name: string;
    email: string;
    phone?: string;
  };
  billingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  lineItems: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  taxBreakdown: {
    taxableAmount: number;
    taxRatePercentage: number;
    taxAmount: number;
    state: string;
  };
  shippingBreakdown: {
    shippingCost: number;
    method: string;
  };
  pricingBreakdown: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
  };
  paymentMethod: string;
  paymentStatus: string;
}

export class InvoiceService {
  /**
   * Helper to generate a standardized unique Invoice Number:
   * Format: INV-YYYYMMDD-XXXX where XXXX is a unique suffix
   */
  generateInvoiceNumber(order: IOrder): string {
    const datePart = new Date(order.createdAt || Date.now())
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");
    
    // Extract a stable suffix from the order ID or orderNumber
    const suffix = order.orderNumber ? order.orderNumber.split("-").pop() : "0001";
    return `INV-${datePart}-${suffix}`;
  }

  /**
   * Invoice Data Builder: Builds the entire structural invoice JSON
   */
  async buildInvoiceData(orderId: string): Promise<IInvoiceData> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found for invoice compilation");
    }

    // Generate stable invoice number if not already stored on the order
    const invoiceNumber = order.invoiceNumber || this.generateInvoiceNumber(order);

    // If order does not have an invoice number saved, we can save it
    if (!order.invoiceNumber) {
      order.invoiceNumber = invoiceNumber;
      await orderRepository.update(orderId, order as any);
    }

    const orderDate = order.createdAt || new Date();
    // Invoices are due on receipt for retail checkout
    const dueDate = orderDate;

    // Compile Customer Snapshot
    const populatedUser = order.user as any;
    const customerSnapshot = {
      userId: String(populatedUser?._id || populatedUser?.id || order.user),
      name: populatedUser?.name || "Verified Customer",
      email: populatedUser?.email || "customer@syntex.store",
      phone: populatedUser?.phone || order.shippingAddress?.phone || undefined,
    };

    // Compile billing / shipping addresses
    const shippingAddress = {
      fullName: order.shippingAddress.fullName,
      phone: order.shippingAddress.phone,
      addressLine1: order.shippingAddress.addressLine1,
      addressLine2: order.shippingAddress.addressLine2,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      postalCode: order.shippingAddress.postalCode,
      country: order.shippingAddress.country,
    };

    // For billing, default same as shipping since it's a B2C retail checkout
    const billingAddress = { ...shippingAddress };

    // Line items mapping
    const lineItems = order.orderItems.map((item) => ({
      productId: String(item.product),
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      subtotal: item.subtotal,
    }));

    // Tax Breakdown (estimate state tax rate percentage based on region, e.g. California 8.25%, Texas 6.25%, other 7.5%)
    const state = order.shippingAddress.state || "US";
    let taxRatePercentage = 7.5;
    if (state.toUpperCase() === "CA") taxRatePercentage = 8.25;
    else if (state.toUpperCase() === "TX") taxRatePercentage = 6.25;
    else if (state.toUpperCase() === "NY") taxRatePercentage = 8.875;

    const taxableAmount = Math.max(0, order.subtotal - order.discount);

    const taxBreakdown = {
      taxableAmount,
      taxRatePercentage,
      taxAmount: order.tax,
      state,
    };

    // Shipping Breakdown
    const shippingBreakdown = {
      shippingCost: order.shipping,
      method: order.shipping > 0 ? "Standard Tracked Delivery" : "Free Eligible Delivery",
    };

    // Grand totals snapshot
    const pricingBreakdown = {
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      shipping: order.shipping,
      total: order.total,
    };

    return {
      invoiceNumber,
      issueDate: orderDate,
      dueDate,
      orderNumber: order.orderNumber,
      orderDate,
      customerSnapshot,
      billingAddress,
      shippingAddress,
      lineItems,
      taxBreakdown,
      shippingBreakdown,
      pricingBreakdown,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    };
  }
}

export const invoiceService = new InvoiceService();
