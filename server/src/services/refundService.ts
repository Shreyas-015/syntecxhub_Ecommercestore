import mongoose from "mongoose";
import { Payment } from "../models/Payment";
import { Order } from "../models/Order";
import { PaymentAuditLog } from "../models/PaymentAuditLog";
import { paymentRepository } from "../repositories/paymentRepository";
import { orderRepository } from "../repositories/orderRepository";
import { inventoryService } from "./inventoryService";
import { PaymentStatus } from "../types/payment";
import { PaymentStatus as OrderPaymentStatus } from "../types/order";
import { ValidationError, NotFoundError } from "../utils/errors";

export class RefundService {
  /**
   * Run operations inside a MongoDB session transaction (with sequential fallback for non-replica sets)
   */
  private async runTransaction<T>(
    fn: (session?: mongoose.ClientSession) => Promise<T>
  ): Promise<T> {
    if (mongoose.connection.readyState !== 1) {
      return await fn(undefined);
    }
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (error: any) {
      await session.abortTransaction();
      const errMsg = error.message || "";
      if (
        errMsg.includes("replica set") ||
        errMsg.includes("transaction") ||
        errMsg.includes("Transaction numbers are only allowed") ||
        error.codeName === "IllegalOperation"
      ) {
        console.warn(
          "[RefundService] Transactions are not supported by this MongoDB database deployment. Falling back to non-transactional execution."
        );
        return await fn(undefined);
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Initialize a refund request on a payment record (Simulated Gateway for Foundation Phase)
   */
  async processRefund(
    paymentId: string,
    amount?: number,
    reason?: string,
    userId?: string
  ): Promise<any> {
    return this.runTransaction(async (session) => {
      // 1. Retrieve the payment record
      const payment = await Payment.findById(paymentId).session(session || null);
      if (!payment) {
        throw new NotFoundError(`Payment record with ID ${paymentId} not found`);
      }

      // Check if user has permission if userId is provided
      if (userId && payment.user.toString() !== userId) {
        throw new ValidationError("Unauthorized: You do not own this payment record.");
      }

      // 2. Validate payment status (must be PAID to be refunded)
      if (payment.status !== PaymentStatus.PAID) {
        throw new ValidationError(
          `Payment is in status '${payment.status}'. Only PAID payment records can be refunded.`
        );
      }

      const refundValue = amount !== undefined ? amount : payment.amounts.total;

      if (refundValue <= 0) {
        throw new ValidationError("Refund amount must be greater than zero.");
      }

      if (refundValue > payment.amounts.total) {
        throw new ValidationError(
          `Refund amount $${refundValue} exceeds original payment total of $${payment.amounts.total}.`
        );
      }

      const refundId = `ref_${payment.provider.toLowerCase()}_${Date.now()}`;
      const refundReason = reason || "Customer request";
      const refundCreatedAt = new Date();
      const refundStatus = "completed"; // Simulated successful refund processing

      // Write Audit Log - Refund Requested
      await PaymentAuditLog.create(
        [
          {
            user: payment.user,
            order: payment.order,
            payment: payment._id,
            provider: payment.provider,
            action: "Refund Requested",
            result: "success",
            metadata: { refundId, refundAmount: refundValue, refundReason }
          }
        ],
        { session }
      );

      // 3. Update Payment record with refund details and status
      payment.status = PaymentStatus.REFUNDED;
      payment.refundId = refundId;
      payment.refundStatus = refundStatus;
      payment.refundAmount = refundValue;
      payment.refundReason = refundReason;
      payment.refundCreatedAt = refundCreatedAt;
      await payment.save({ session });

      // 4. Update corresponding Order payment status and timeline
      const order = await Order.findById(payment.order).session(session || null);
      if (order) {
        order.paymentStatus = OrderPaymentStatus.REFUNDED;
        if (!order.timeline) {
          order.timeline = [];
        }
        order.timeline.push({
          status: "Refund Processed",
          timestamp: new Date(),
          note: `Refund of $${refundValue} processed. Refund ID: ${refundId}. Reason: ${refundReason}`
        });
        await order.save({ session });
      }

      // 5. Restore Inventory: Iterate through original order items to restore stock
      if (order && order.orderItems && order.orderItems.length > 0) {
        for (const item of order.orderItems) {
          await inventoryService.restoreStock(
            item.product.toString(),
            item.quantity,
            order._id.toString(),
            session
          );
        }

        // Write Audit Log - Inventory Updated
        await PaymentAuditLog.create(
          [
            {
              user: payment.user,
              order: payment.order,
              payment: payment._id,
              provider: payment.provider,
              action: "Inventory Updated",
              result: "success",
              metadata: { note: "Stock restored during refund sequence", items: order.orderItems }
            }
          ],
          { session }
        );
      }

      // Write Audit Log - Refund Completed
      await PaymentAuditLog.create(
        [
          {
            user: payment.user,
            order: payment.order,
            payment: payment._id,
            provider: payment.provider,
            action: "Refund Completed",
            result: "success",
            metadata: { refundId, refundAmount: refundValue }
          }
        ],
        { session }
      );

      return payment.toObject();
    });
  }

  /**
   * Retrieve refund status details for a given payment record
   */
  async getRefundStatus(paymentId: string, userId?: string): Promise<any> {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment record with ID ${paymentId} not found`);
    }

    if (userId && payment.user.toString() !== userId) {
      throw new ValidationError("Unauthorized: Access to this payment record is restricted.");
    }

    return {
      paymentId: payment._id.toString(),
      status: payment.status,
      refundId: payment.refundId || null,
      refundStatus: payment.refundStatus || null,
      refundAmount: payment.refundAmount || 0,
      refundReason: payment.refundReason || null,
      refundCreatedAt: payment.refundCreatedAt || null
    };
  }
}

export const refundService = new RefundService();
