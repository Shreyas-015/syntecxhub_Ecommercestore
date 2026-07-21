import mongoose from "mongoose";
import { Order, IOrder } from "../models/Order";
import { OrderStatus, PaymentStatus } from "../types/order";

export const mockOrders = new Map<string, any>();

export class OrderRepository {
  private isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Find order by ID
   */
  async findById(id: string): Promise<IOrder | null> {
    if (!this.isConnected()) {
      const mock = mockOrders.get(id);
      return mock ? (mock as IOrder) : null;
    }
    return Order.findById(id).populate("user").populate("orderItems.product");
  }

  /**
   * Find all orders for a user
   */
  async findByUser(userId: string): Promise<IOrder[]> {
    if (!this.isConnected()) {
      return Array.from(mockOrders.values()).filter(
        (order) => order.user.toString() === userId.toString()
      ) as IOrder[];
    }
    return Order.find({ user: userId }).sort({ createdAt: -1 });
  }

  /**
   * Find all orders (for admin use)
   */
  async findAll(): Promise<IOrder[]> {
    if (!this.isConnected()) {
      return Array.from(mockOrders.values()).sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }) as IOrder[];
    }
    return Order.find({}).populate("user").populate("orderItems.product").sort({ createdAt: -1 });
  }

  /**
   * Find order by Order Number
   */
  async findByOrderNumber(orderNumber: string): Promise<IOrder | null> {
    if (!this.isConnected()) {
      const found = Array.from(mockOrders.values()).find(
        (order) => order.orderNumber === orderNumber
      );
      return found ? (found as IOrder) : null;
    }
    return Order.findOne({ orderNumber }).populate("user").populate("orderItems.product");
  }

  /**
   * Create new order
   */
  async create(orderData: Partial<IOrder>): Promise<IOrder> {
    if (!this.isConnected()) {
      const id = orderData._id || (orderData as any).id || new mongoose.Types.ObjectId().toString();
      const mock = {
        _id: id,
        id: id,
        user: orderData.user,
        orderItems: orderData.orderItems || [],
        subtotal: orderData.subtotal || 0,
        discount: orderData.discount || 0,
        shipping: orderData.shipping || 0,
        tax: orderData.tax || 0,
        total: orderData.total || 0,
        shippingAddress: orderData.shippingAddress,
        status: orderData.status || OrderStatus.PENDING,
        paymentStatus: orderData.paymentStatus || PaymentStatus.PENDING,
        paymentMethod: orderData.paymentMethod,
        orderNumber: orderData.orderNumber,
        notes: orderData.notes,
        estimatedDelivery: orderData.estimatedDelivery,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...orderData
      };
      mockOrders.set(id, mock);
      return mock as unknown as IOrder;
    }
    return Order.create(orderData);
  }

  /**
   * Update order
   */
  async update(id: string, orderData: Partial<IOrder>): Promise<IOrder | null> {
    if (!this.isConnected()) {
      const mock = mockOrders.get(id);
      if (!mock) return null;
      const updated = {
        ...mock,
        ...orderData,
        updatedAt: new Date()
      };
      mockOrders.set(id, updated);
      return updated as unknown as IOrder;
    }
    return Order.findByIdAndUpdate(id, { $set: orderData }, { new: true, runValidators: true });
  }

  /**
   * Update status of an order
   */
  async updateStatus(id: string, status: OrderStatus): Promise<IOrder | null> {
    return this.update(id, { status } as any);
  }

  /**
   * Update payment status of an order
   */
  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<IOrder | null> {
    return this.update(id, { paymentStatus } as any);
  }
}

export const orderRepository = new OrderRepository();
