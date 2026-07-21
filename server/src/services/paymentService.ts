import { paymentRepository } from "../repositories/paymentRepository";
import { orderRepository } from "../repositories/orderRepository";
import { orderService } from "./orderService";
import { IPayment, PaymentStatus, PaymentMethod, PaymentProviderName } from "../types/payment";
import { 
  IPaymentProvider, 
  StripeProvider, 
  RazorpayProvider, 
  CashOnDeliveryProvider 
} from "./paymentProvider";
import { ValidationError, NotFoundError } from "../utils/errors";
import { PaymentStatus as OrderPaymentStatus, OrderStatus as OrderStatus } from "../types/order";
import mongoose from "mongoose";
import { Payment } from "../models/Payment";
import { Order } from "../models/Order";
import { Cart } from "../models/Cart";
import { PaymentAuditLog } from "../models/PaymentAuditLog";
import { inventoryService } from "./inventoryService";

export class PaymentService {
  private providers: Record<PaymentProviderName, IPaymentProvider>;

  constructor() {
    this.providers = {
      [PaymentProviderName.STRIPE]: new StripeProvider(),
      [PaymentProviderName.RAZORPAY]: new RazorpayProvider(),
      [PaymentProviderName.CASH_ON_DELIVERY]: new CashOnDeliveryProvider()
    };
  }

  /**
   * Resolve appropriate gateway adapter by provider name
   */
  getProvider(name: PaymentProviderName): IPaymentProvider {
    const provider = this.providers[name];
    if (!provider) {
      throw new ValidationError(`Unsupported payment provider: ${name}`);
    }
    return provider;
  }

  /**
   * Map from generic provider name to order-specific method type
   */
  private mapProviderToMethod(providerName: PaymentProviderName): PaymentMethod {
    switch (providerName) {
      case PaymentProviderName.STRIPE:
        return PaymentMethod.CARD;
      case PaymentProviderName.RAZORPAY:
        return PaymentMethod.UPI; // default, can be dynamically determined
      case PaymentProviderName.CASH_ON_DELIVERY:
        return PaymentMethod.COD;
      default:
        return PaymentMethod.CARD;
    }
  }

  /**
   * Standardized Initializer: Register a new payment sequence for an order
   */
  async initializePayment(
    userId: string,
    orderId: string,
    providerName: PaymentProviderName,
    preferredMethod?: PaymentMethod
  ): Promise<IPayment> {
    // 1. Load the corresponding order
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID ${orderId} not found`);
    }

    // Validation: Invalid order ownership
    const orderUserId = order.user && (order.user._id ? order.user._id.toString() : order.user.toString());
    if (orderUserId !== userId.toString()) {
      throw new ValidationError("Unauthorized: You do not own this order.");
    }

    // Validation: Paying cancelled orders
    if (order.status === OrderStatus.CANCELLED) {
      throw new ValidationError("Payment processing failed: Cannot pay for a cancelled order.");
    }

    // Validation: Paying already paid orders
    if (order.paymentStatus === OrderPaymentStatus.PAID) {
      throw new ValidationError("Payment processing failed: This order has already been paid.");
    }

    // 2. Map preferred method or fall back to provider defaults
    const method = preferredMethod || this.mapProviderToMethod(providerName);

    // 3. Check if there is an existing payment record for this order
    let payment = await paymentRepository.getPaymentByOrder(orderId);

    if (payment) {
      // If we already have a paid payment, we shouldn't re-initialize
      if (payment.status === PaymentStatus.PAID) {
        throw new ValidationError("Payment has already been successfully processed and completed for this order");
      }
      
      // If payment provider matches and status is pending, we can reuse or recreate.
      // For standard compliance, let's update current state or proceed to create a fresh one.
    }

    // Determine target currency (standard default USD)
    const currency = providerName === PaymentProviderName.RAZORPAY ? "INR" : "USD";

    // 4. Create structured Payment document
    payment = await paymentRepository.createPayment({
      user: new mongoose.Types.ObjectId(userId) as any,
      order: new mongoose.Types.ObjectId(orderId) as any,
      provider: providerName,
      status: PaymentStatus.PENDING,
      method,
      currency,
      amounts: {
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total
      },
      metadata: {
        providerResponse: null
      }
    });

    // 5. Invoke selected gateway order initialization
    const provider = this.getProvider(providerName);
    try {
      const { providerOrderId, rawResponse } = await provider.createOrder(payment);

      // 6. Save tracking ID and raw provider response to payment record
      payment = await paymentRepository.updateProviderData(payment.id!, {
        providerOrderId,
        providerResponse: rawResponse
      });

      // 7. Audit trail/Timeline entry on Order
      if (order.timeline) {
        order.timeline.push({
          status: "Payment Initiated",
          timestamp: new Date(),
          note: `Payment process initiated via ${providerName}. Reference: ${providerOrderId}`
        });
        await orderRepository.update(orderId, order as any);
      }
    } catch (err: any) {
      console.error(`[PaymentService] Failed to create order session on ${providerName}:`, err);
      await paymentRepository.updateStatus(payment.id!, PaymentStatus.FAILED, err.message || "Initialization failed");
      throw new ValidationError(`Failed to initialize session with payment provider: ${err.message || "Unknown error"}`);
    }

    return payment;
  }

  /**
   * Verify and process incoming verification payloads from clients or callbacks
   */
  async verifyAndProcessPayment(
    paymentId: string,
    verificationData: {
      providerPaymentId?: string;
      providerSignature?: string;
      [key: string]: any;
    }
  ): Promise<IPayment> {
    // 1. Fetch payment details
    const payment = await paymentRepository.getPaymentById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment record ${paymentId} not found`);
    }

    if (payment.status === PaymentStatus.PAID) {
      return payment; // Already processed
    }

    const provider = this.getProvider(payment.provider as PaymentProviderName);

    // 2. Verify with payment provider gateway
    const { success, providerResponse } = await provider.verifyPayment(paymentId, verificationData);

    const txId = verificationData.providerPaymentId || `txn_${Date.now()}`;

    if (success) {
      return await this.completePaymentTransaction(
        paymentId,
        verificationData.providerPaymentId,
        verificationData.providerSignature,
        txId,
        providerResponse
      );
    } else {
      const failureReason = "Payment verification signature check failed";
      return await this.failPaymentTransaction(paymentId, failureReason, providerResponse);
    }
  }

  /**
   * Unifies successful payment updates, order status confirmation, inventory deduction,
   * cart clearing, and audit logging into a single database transaction.
   */
  async completePaymentTransaction(
    paymentId: string,
    providerPaymentId?: string,
    providerSignature?: string,
    transactionId?: string,
    providerResponse?: any
  ): Promise<IPayment> {
    const runTx = async (session?: mongoose.ClientSession) => {
      // 1. Fetch payment
      const payment = await Payment.findById(paymentId).session(session || null);
      if (!payment) {
        throw new NotFoundError(`Payment record ${paymentId} not found`);
      }

      if (payment.status === PaymentStatus.PAID) {
        return payment.toObject() as IPayment;
      }

      // Write Webhook Received Audit Log
      await PaymentAuditLog.create(
        [
          {
            user: payment.user,
            order: payment.order,
            payment: payment._id,
            provider: payment.provider,
            action: "Webhook Received",
            result: "success",
            metadata: { providerPaymentId, transactionId }
          }
        ],
        { session }
      );

      // Write Payment Created Audit Log
      await PaymentAuditLog.create(
        [
          {
            user: payment.user,
            order: payment.order,
            payment: payment._id,
            provider: payment.provider,
            action: "Payment Created",
            result: "success"
          }
        ],
        { session }
      );

      // 2. Update payment status
      payment.status = PaymentStatus.PAID;
      if (providerPaymentId !== undefined) payment.providerPaymentId = providerPaymentId;
      if (providerSignature !== undefined) payment.providerSignature = providerSignature;
      payment.transactionId = transactionId || providerPaymentId || `txn_${Date.now()}`;
      if (providerResponse !== undefined) payment.metadata = { ...payment.metadata, providerResponse };
      await payment.save({ session });

      // Write Payment Verified Audit Log
      await PaymentAuditLog.create(
        [
          {
            user: payment.user,
            order: payment.order,
            payment: payment._id,
            provider: payment.provider,
            action: "Payment Verified",
            result: "success",
            metadata: { transactionId: payment.transactionId }
          }
        ],
        { session }
      );

      // 3. Update Order status
      const order = await Order.findById(payment.order).session(session || null);
      if (!order) {
        throw new NotFoundError(`Order with ID ${payment.order} not found`);
      }

      order.paymentStatus = OrderPaymentStatus.PAID;
      if (order.status === OrderStatus.PENDING) {
        order.status = OrderStatus.CONFIRMED;
      }
      if (!order.timeline) {
        order.timeline = [];
      }
      order.timeline.push({
        status: "Payment Confirmed",
        timestamp: new Date(),
        note: `Payment successfully captured and verified via ${payment.provider}. TxID: ${payment.transactionId}`
      });
      await order.save({ session });

      // 4. Deduct Inventory
      if (order.orderItems && order.orderItems.length > 0) {
        for (const item of order.orderItems) {
          await inventoryService.deductStock(
            item.product.toString(),
            item.quantity,
            order._id.toString(),
            session
          );
        }

        // Write Inventory Updated Audit Log
        await PaymentAuditLog.create(
          [
            {
              user: payment.user,
              order: payment.order,
              payment: payment._id,
              provider: payment.provider,
              action: "Inventory Updated",
              result: "success",
              metadata: { items: order.orderItems }
            }
          ],
          { session }
        );
      }

      // 5. Clear User's Cart
      const userId = payment.user.toString();
      await Cart.findOneAndUpdate(
        { user: userId },
        { $set: { items: [], totalItems: 0, subtotal: 0 } },
        { session }
      );

      // Write Cart Cleared Audit Log
      await PaymentAuditLog.create(
        [
          {
            user: payment.user,
            order: payment.order,
            payment: payment._id,
            provider: payment.provider,
            action: "Cart Cleared",
            result: "success"
          }
        ],
        { session }
      );

      return payment.toObject() as IPayment;
    };

    try {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        const result = await runTx(session);
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
            "[PaymentService] Transactions are not supported by this MongoDB database deployment. Falling back to non-transactional execution."
          );
          return await runTx(undefined);
        }
        throw error;
      } finally {
        session.endSession();
      }
    } catch (transactionError: any) {
      console.error("[PaymentService] Payment transaction failed, rolling back.", transactionError);
      
      // Write Transaction Rolled Back Audit Log
      try {
        await PaymentAuditLog.create({
          provider: "System",
          action: "Transaction Rolled Back",
          result: "failed",
          metadata: { error: transactionError.message || "Unknown transaction error" }
        });
      } catch (logErr) {
        console.error("Failed to write rollback audit log:", logErr);
      }
      
      throw transactionError;
    }
  }

  /**
   * Helper to process payment failure inside an audit-logged boundary
   */
  async failPaymentTransaction(
    paymentId: string,
    failureReason: string,
    providerResponse?: any
  ): Promise<IPayment> {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment record ${paymentId} not found`);
    }

    if (payment.status === PaymentStatus.FAILED) {
      return payment.toObject() as IPayment;
    }

    // Write Audit Log - Payment Failed
    await PaymentAuditLog.create({
      user: payment.user,
      order: payment.order,
      payment: payment._id,
      provider: payment.provider,
      action: "Payment Failed",
      result: "failed",
      metadata: { failureReason }
    });

    payment.status = PaymentStatus.FAILED;
    payment.metadata = { ...payment.metadata, failureReason, providerResponse };
    await payment.save();

    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus = OrderPaymentStatus.FAILED;
      if (!order.timeline) {
        order.timeline = [];
      }
      order.timeline.push({
        status: "Payment Failed",
        timestamp: new Date(),
        note: `Payment process failed. Reason: ${failureReason}`
      });
      await order.save();
    }

    return payment.toObject() as IPayment;
  }

  /**
   * Helper to process payment cancellation inside an audit-logged boundary
   */
  async cancelPaymentTransaction(
    paymentId: string,
    providerResponse?: any
  ): Promise<IPayment> {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment record ${paymentId} not found`);
    }

    if (payment.status === PaymentStatus.CANCELLED) {
      return payment.toObject() as IPayment;
    }

    // Write Audit Log - Payment Cancelled
    await PaymentAuditLog.create({
      user: payment.user,
      order: payment.order,
      payment: payment._id,
      provider: payment.provider,
      action: "Payment Cancelled",
      result: "success"
    });

    payment.status = PaymentStatus.CANCELLED;
    payment.metadata = { ...payment.metadata, providerResponse };
    await payment.save();

    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus = OrderPaymentStatus.FAILED;
      if (!order.timeline) {
        order.timeline = [];
      }
      order.timeline.push({
        status: "Payment Cancelled",
        timestamp: new Date(),
        note: `Payment was cancelled by client/provider.`
      });
      await order.save();
    }

    return payment.toObject() as IPayment;
  }

  /**
   * Capture a pre-authorized payment
   */
  async captureAuthorizedPayment(paymentId: string, captureData?: any): Promise<IPayment> {
    const payment = await paymentRepository.getPaymentById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment record ${paymentId} not found`);
    }

    const provider = this.getProvider(payment.provider as PaymentProviderName);
    const { success, transactionId, providerResponse } = await provider.capturePayment(paymentId, captureData);

    if (success) {
      const updatedPayment = await paymentRepository.updateStatus(paymentId, PaymentStatus.PAID);
      await paymentRepository.updateProviderData(paymentId, {
        transactionId,
        providerResponse
      });

      // Update order status
      const orderId = String(payment.order);
      await orderService.updateOrderPaymentStatus(orderId, OrderPaymentStatus.PAID);

      return updatedPayment;
    } else {
      const updatedPayment = await paymentRepository.updateStatus(paymentId, PaymentStatus.FAILED, "Capture failed");
      return updatedPayment;
    }
  }

  /**
   * Process refund requests
   */
  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<IPayment> {
    const payment = await paymentRepository.getPaymentById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment record ${paymentId} not found`);
    }

    if (payment.status !== PaymentStatus.PAID) {
      throw new ValidationError("Only successfully paid payment transactions can be refunded");
    }

    const provider = this.getProvider(payment.provider as PaymentProviderName);
    const { success, refundTransactionId, providerResponse } = await provider.refundPayment(paymentId, amount, reason);

    if (success) {
      const updatedPayment = await paymentRepository.updateStatus(paymentId, PaymentStatus.REFUNDED);
      await paymentRepository.updateProviderData(paymentId, {
        transactionId: refundTransactionId,
        providerResponse
      });

      // Update Order payment status to REFUNDED
      const orderId = String(payment.order);
      await orderService.updateOrderPaymentStatus(orderId, OrderPaymentStatus.REFUNDED);

      // Audit trail / Order timeline entry
      const order = await orderRepository.findById(orderId);
      if (order && order.timeline) {
        order.timeline.push({
          status: "Payment Refunded",
          timestamp: new Date(),
          note: `Refund of ${amount || payment.amounts.total} processed. Reason: ${reason || "Unspecified"}`
        });
        await orderRepository.update(orderId, order as any);
      }

      return updatedPayment;
    } else {
      throw new ValidationError("Failed to process refund with the gateway provider");
    }
  }

  /**
   * Cancel/Void transaction
   */
  async cancelPayment(paymentId: string): Promise<IPayment> {
    const payment = await paymentRepository.getPaymentById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment record ${paymentId} not found`);
    }

    const provider = this.getProvider(payment.provider as PaymentProviderName);
    const { success, providerResponse } = await provider.cancelPayment(paymentId);

    if (success) {
      const updatedPayment = await paymentRepository.updateStatus(paymentId, PaymentStatus.CANCELLED);
      await paymentRepository.updateProviderData(paymentId, {
        providerResponse
      });
      return updatedPayment;
    } else {
      throw new ValidationError("Failed to cancel payment session with the gateway provider");
    }
  }

  /**
   * Detail getter
   */
  async getPaymentDetails(paymentId: string): Promise<IPayment> {
    const payment = await paymentRepository.getPaymentById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment record ${paymentId} not found`);
    }
    return payment;
  }

  /**
   * Retrieve payment associated with a given order
   */
  async getPaymentByOrder(orderId: string): Promise<IPayment> {
    const payment = await paymentRepository.getPaymentByOrder(orderId);
    if (!payment) {
      throw new NotFoundError(`Payment record for order ${orderId} not found`);
    }
    return payment;
  }
}

export const paymentService = new PaymentService();
