import api from "../lib/api";
import { Order, PaymentMethod } from "../types/order";

export interface CheckoutInput {
  shippingAddressId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  couponCode?: string;
  shippingOption?: string;
}

export const orderService = {
  async checkout(input: CheckoutInput): Promise<Order> {
    const response = await api.post("/orders/checkout", input);
    return response.data.data;
  },

  async getOrders(): Promise<Order[]> {
    const response = await api.get("/orders");
    return response.data.data;
  },

  async getOrderById(id: string): Promise<Order> {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  },

  // Admin-only order methods
  async adminGetOrders(): Promise<Order[]> {
    const response = await api.get("/admin/orders");
    return response.data.data.orders || response.data.data;
  },

  async adminGetOrderById(id: string): Promise<Order> {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data.data.order || response.data.data;
  },

  async adminUpdateStatus(id: string, status: string): Promise<Order> {
    const response = await api.patch(`/admin/orders/${id}/status`, { status });
    return response.data.data.order || response.data.data;
  },

  async adminUpdatePaymentStatus(id: string, paymentStatus: string): Promise<Order> {
    const response = await api.patch(`/admin/orders/${id}/payment-status`, { paymentStatus });
    return response.data.data.order || response.data.data;
  }
};
