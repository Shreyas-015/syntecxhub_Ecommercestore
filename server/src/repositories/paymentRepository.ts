import mongoose from "mongoose";
import { Payment, IPaymentDocument } from "../models/Payment";
import { IPayment, PaymentStatus } from "../types/payment";
import { NotFoundError } from "../utils/errors";

export const mockPayments = new Map<string, any>();

export class PaymentRepository {
  private isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Create a new payment record (supports MongoDB transaction sessions)
   */
  async createPayment(
    paymentData: Partial<IPayment>,
    session?: mongoose.ClientSession
  ): Promise<IPayment> {
    if (!this.isConnected()) {
      const id = paymentData.id || new mongoose.Types.ObjectId().toString();
      const mockPay: IPayment = {
        id,
        _id: id,
        user: paymentData.user!,
        order: paymentData.order!,
        provider: paymentData.provider!,
        paymentId: paymentData.paymentId || `pay_mock_${Date.now()}`,
        providerOrderId: paymentData.providerOrderId,
        providerPaymentId: paymentData.providerPaymentId,
        providerSignature: paymentData.providerSignature,
        transactionId: paymentData.transactionId || `tx_mock_${Date.now()}`,
        amounts: paymentData.amounts || { subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 },
        currency: paymentData.currency || "USD",
        exchangeRate: paymentData.exchangeRate || 1.0,
        status: paymentData.status || PaymentStatus.PENDING,
        method: paymentData.method!,
        metadata: paymentData.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockPayments.set(id, mockPay);
      return mockPay;
    }

    const payment = new Payment(paymentData);
    const saved = await payment.save({ session });
    return saved.toObject() as IPayment;
  }

  /**
   * Retrieve payment record by order reference
   */
  async getPaymentByOrder(orderId: string): Promise<IPayment | null> {
    if (!this.isConnected()) {
      const found = Array.from(mockPayments.values()).find(
        (p) => p.order.toString() === orderId.toString()
      );
      return found || null;
    }
    const payment = await Payment.findOne({ order: orderId }).populate("user").populate("order");
    return payment ? (payment.toObject() as IPayment) : null;
  }

  /**
   * Retrieve payment record by payment database ID
   */
  async getPaymentById(id: string): Promise<IPayment | null> {
    if (!this.isConnected()) {
      const found = mockPayments.get(id);
      return found || null;
    }
    const payment = await Payment.findById(id).populate("user").populate("order");
    return payment ? (payment.toObject() as IPayment) : null;
  }

  /**
   * Update payment status (supports MongoDB transaction sessions)
   */
  async updateStatus(
    id: string,
    status: PaymentStatus,
    failureReason?: string,
    session?: mongoose.ClientSession
  ): Promise<IPayment> {
    if (!this.isConnected()) {
      const payment = mockPayments.get(id);
      if (!payment) {
        throw new NotFoundError(`Payment record ${id} not found`);
      }
      payment.status = status;
      if (failureReason) {
        payment.metadata = {
          ...payment.metadata,
          failureReason
        };
      }
      payment.updatedAt = new Date();
      mockPayments.set(id, payment);
      return payment;
    }

    const update: any = { status };
    if (failureReason) {
      update["metadata.failureReason"] = failureReason;
    }

    const updated = await Payment.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true, session }
    );

    if (!updated) {
      throw new NotFoundError(`Payment record ${id} not found for status update`);
    }

    return updated.toObject() as IPayment;
  }

  /**
   * Update provider-specific tracking data (supports MongoDB transaction sessions)
   */
  async updateProviderData(
    id: string,
    providerData: {
      providerOrderId?: string;
      providerPaymentId?: string;
      providerSignature?: string;
      transactionId?: string;
      providerResponse?: any;
    },
    session?: mongoose.ClientSession
  ): Promise<IPayment> {
    if (!this.isConnected()) {
      const payment = mockPayments.get(id);
      if (!payment) {
        throw new NotFoundError(`Payment record ${id} not found`);
      }
      Object.assign(payment, providerData);
      if (providerData.providerResponse) {
        payment.metadata = {
          ...payment.metadata,
          providerResponse: providerData.providerResponse
        };
      }
      payment.updatedAt = new Date();
      mockPayments.set(id, payment);
      return payment;
    }

    const update: any = {};
    if (providerData.providerOrderId !== undefined) update.providerOrderId = providerData.providerOrderId;
    if (providerData.providerPaymentId !== undefined) update.providerPaymentId = providerData.providerPaymentId;
    if (providerData.providerSignature !== undefined) update.providerSignature = providerData.providerSignature;
    if (providerData.transactionId !== undefined) update.transactionId = providerData.transactionId;
    if (providerData.providerResponse !== undefined) update["metadata.providerResponse"] = providerData.providerResponse;

    const updated = await Payment.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true, session }
    );

    if (!updated) {
      throw new NotFoundError(`Payment record ${id} not found for provider data update`);
    }

    return updated.toObject() as IPayment;
  }

  /**
   * Update refund-specific details (supports MongoDB transaction sessions)
   */
  async updateRefundData(
    id: string,
    refundData: {
      refundId: string;
      refundStatus: string;
      refundAmount: number;
      refundReason: string;
      refundCreatedAt: Date;
    },
    session?: mongoose.ClientSession
  ): Promise<IPayment> {
    if (!this.isConnected()) {
      const payment = mockPayments.get(id);
      if (!payment) {
        throw new NotFoundError(`Payment record ${id} not found`);
      }
      Object.assign(payment, refundData);
      payment.updatedAt = new Date();
      mockPayments.set(id, payment);
      return payment;
    }

    const updated = await Payment.findByIdAndUpdate(
      id,
      { $set: refundData },
      { new: true, runValidators: true, session }
    );

    if (!updated) {
      throw new NotFoundError(`Payment record ${id} not found for refund data update`);
    }

    return updated.toObject() as IPayment;
  }
}

export const paymentRepository = new PaymentRepository();
