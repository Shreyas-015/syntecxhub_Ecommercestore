import { Response, Request } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { paymentService } from "../services/paymentService";
import { ApiResponse } from "../utils/response";
import { UnauthorizedError, ValidationError, NotFoundError } from "../utils/errors";
import { PaymentProviderName, PaymentMethod } from "../types/payment";
import mongoose from "mongoose";

export class PaymentController {
  /**
   * GET /api/payments/config
   * Returns active/enabled payment providers based on backend keys configuration
   */
  async getPaymentConfig(req: AuthenticatedRequest, res: Response) {
    const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;
    const razorpayEnabled = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    
    return ApiResponse.success(res, "Payment configuration retrieved", {
      stripe: stripeEnabled,
      razorpay: razorpayEnabled,
      cod: true,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || null
    });
  }

  /**
   * POST /api/payments/create-order
   * Initializes a payment (Stripe or Razorpay) for an existing order
   */
  async createOrder(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { orderId, providerName, preferredMethod } = req.body;

    if (!orderId) {
      throw new ValidationError("Order ID is required");
    }
    if (!providerName) {
      throw new ValidationError("Payment provider name is required");
    }

    if (!Object.values(PaymentProviderName).includes(providerName)) {
      throw new ValidationError(`Unsupported payment provider. Supported: ${Object.values(PaymentProviderName).join(", ")}`);
    }

    if (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(orderId)) {
      throw new ValidationError("Invalid order ID format");
    }

    const payment = await paymentService.initializePayment(
      userId,
      orderId,
      providerName as PaymentProviderName,
      preferredMethod as PaymentMethod
    );

    return ApiResponse.success(res, "Payment order initialized successfully", payment, 201);
  }

  /**
   * POST /api/payments/verify
   * Verifies the checkout signatures or session status for payment providers
   */
  async verifyPayment(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { paymentId, providerPaymentId, providerSignature, providerOrderId, ...otherVerificationData } = req.body;

    if (!paymentId) {
      throw new ValidationError("Payment ID is required");
    }

    if (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(paymentId)) {
      throw new ValidationError("Invalid payment ID format");
    }

    // Load payment to check ownership first
    const payment = await paymentService.getPaymentDetails(paymentId);
    const paymentUserId = payment.user && (typeof payment.user === "object" ? (payment.user as any)._id?.toString() || (payment.user as any).id?.toString() : payment.user.toString());
    
    if (paymentUserId !== userId.toString()) {
      throw new ValidationError("Unauthorized: You do not own this payment record.");
    }

    const verificationData = {
      providerPaymentId,
      providerSignature,
      providerOrderId,
      ...otherVerificationData
    };

    const updatedPayment = await paymentService.verifyAndProcessPayment(paymentId, verificationData);

    return ApiResponse.success(res, "Payment verified and processed successfully", updatedPayment);
  }

  /**
   * POST /api/payments/cod
   * Explicitly handles Cash on Delivery checkout method registration
   */
  async codPayment(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { orderId } = req.body;

    if (!orderId) {
      throw new ValidationError("Order ID is required");
    }

    if (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(orderId)) {
      throw new ValidationError("Invalid order ID format");
    }

    const payment = await paymentService.initializePayment(
      userId,
      orderId,
      PaymentProviderName.CASH_ON_DELIVERY,
      PaymentMethod.COD
    );

    return ApiResponse.success(res, "Cash on delivery payment registered successfully", payment, 201);
  }

  /**
   * GET /api/payments/:paymentId
   * Retrieve specific payment record details by its DB ID
   */
  async getPaymentById(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { paymentId } = req.params;

    if (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(paymentId)) {
      throw new ValidationError("Invalid payment ID format");
    }

    const payment = await paymentService.getPaymentDetails(paymentId);
    const paymentUserId = payment.user && (typeof payment.user === "object" ? (payment.user as any)._id?.toString() || (payment.user as any).id?.toString() : payment.user.toString());

    if (paymentUserId !== userId.toString()) {
      throw new ValidationError("Unauthorized: Access to this payment record is restricted.");
    }

    return ApiResponse.success(res, "Payment details retrieved successfully", payment);
  }

  /**
   * GET /api/orders/:orderId/payment
   * Retrieve payment details associated with a given order
   */
  async getPaymentByOrder(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { orderId } = req.params;

    if (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(orderId)) {
      throw new ValidationError("Invalid order ID format");
    }

    const payment = await paymentService.getPaymentByOrder(orderId);
    const paymentUserId = payment.user && (typeof payment.user === "object" ? (payment.user as any)._id?.toString() || (payment.user as any).id?.toString() : payment.user.toString());

    if (paymentUserId !== userId.toString()) {
      throw new ValidationError("Unauthorized: Access to this order's payment record is restricted.");
    }

    return ApiResponse.success(res, "Order payment details retrieved successfully", payment);
  }

  /**
   * POST /api/payments/webhooks/stripe
   * Standard production-grade Stripe Webhook processor with signature verification and idempotency
   */
  async stripeWebhook(req: any, res: Response) {
    const signature = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    console.log("[Stripe Webhook] Received event header signature:", signature);

    // Reject if Stripe Secret is configured but signature header is missing
    if (webhookSecret && !signature) {
      console.error("[Stripe Webhook] Rejecting: Missing stripe-signature header");
      return res.status(400).json({ success: false, message: "Missing stripe-signature header" });
    }

    let event: any;
    if (webhookSecret) {
      try {
        const Stripe = require("stripe");
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
        // Use rawBody buffer for proper signature checking
        const rawBody = req.rawBody || JSON.stringify(req.body);
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ success: false, message: `Webhook signature verification failed: ${err.message}` });
      }
    } else {
      console.warn("[Stripe Webhook] Webhook Secret unconfigured. Operating in Sandbox simulation mode.");
      event = req.body;
    }

    const eventId = event?.id || `evt_sim_${Date.now()}`;
    
    // Idempotency check: Ignore duplicate events
    const ProcessedEventModel = mongoose.model("ProcessedEvent");
    try {
      await ProcessedEventModel.create({ eventId, provider: "stripe" });
    } catch (err: any) {
      if (err.code === 11000) {
        console.log(`[Stripe Webhook] Event ${eventId} was already processed. Ignoring.`);
        return res.status(200).json({ received: true, ignored: true, message: "Duplicate event" });
      }
      throw err;
    }

    const eventType = event?.type;
    console.log(`[Stripe Webhook] Processing event ID: ${eventId}, Type: ${eventType}`);

    // Log the event received
    try {
      const PaymentAuditLogModel = mongoose.model("PaymentAuditLog");
      await PaymentAuditLogModel.create({
        provider: "Stripe",
        action: "Webhook Received",
        result: "success",
        metadata: { eventId, eventType }
      });
    } catch (err) {
      console.error("[Stripe Webhook] Failed to write Audit Log for incoming webhook:", err);
    }

    const dataObj = event?.data?.object;
    if (!dataObj) {
      return res.status(200).json({ received: true });
    }

    // Try to find Payment Record by PaymentIntent / Session ID or Metadata
    const providerOrderId = dataObj.id;
    const paymentIdFromMetadata = dataObj.metadata?.paymentId;

    let payment: any;
    if (paymentIdFromMetadata && mongoose.Types.ObjectId.isValid(paymentIdFromMetadata)) {
      payment = await mongoose.model("Payment").findById(paymentIdFromMetadata);
    }
    if (!payment && providerOrderId) {
      payment = await mongoose.model("Payment").findOne({ providerOrderId });
    }

    if (!payment) {
      console.warn(`[Stripe Webhook] No matching payment found for providerOrderId: ${providerOrderId}`);
      return res.status(200).json({ received: true, message: "No matching payment record found" });
    }

    const paymentId = payment._id.toString();

    try {
      switch (eventType) {
        case "payment_intent.succeeded":
        case "checkout.session.completed":
          await paymentService.completePaymentTransaction(
            paymentId,
            dataObj.id,
            signature,
            dataObj.id,
            dataObj
          );
          break;

        case "payment_intent.payment_failed":
          await paymentService.failPaymentTransaction(
            paymentId,
            dataObj.last_payment_error?.message || "Stripe transaction failed",
            dataObj
          );
          break;

        case "payment_intent.canceled":
          await paymentService.cancelPaymentTransaction(paymentId, dataObj);
          break;

        case "charge.refunded":
          const refundServiceInstance = require("../services/refundService").refundService;
          const refundAmount = dataObj.amount_refunded ? dataObj.amount_refunded / 100 : undefined;
          await refundServiceInstance.processRefund(paymentId, refundAmount, "Refund processed via Stripe Webhook");
          break;

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${eventType}`);
      }
    } catch (err: any) {
      console.error(`[Stripe Webhook] Error processing event ${eventType}:`, err);
      return res.status(200).json({ received: true, error: err.message });
    }

    return res.status(200).json({ received: true });
  }

  /**
   * POST /api/payments/webhooks/razorpay
   * Standard production-grade Razorpay Webhook processor with signature verification and idempotency
   */
  async razorpayWebhook(req: any, res: Response) {
    const signature = req.headers["x-razorpay-signature"] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    console.log("[Razorpay Webhook] Received signature:", signature);

    // Reject if Razorpay Webhook secret is configured but signature header is missing
    if (webhookSecret && !signature) {
      console.error("[Razorpay Webhook] Rejecting: Missing x-razorpay-signature header");
      return res.status(400).json({ success: false, message: "Missing x-razorpay-signature header" });
    }

    if (webhookSecret) {
      const crypto = require("crypto");
      const bodyString = req.rawBody ? req.rawBody.toString() : (typeof req.body === "string" ? req.body : JSON.stringify(req.body));
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(bodyString)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.error("[Razorpay Webhook] Signature mismatch!");
        return res.status(400).json({ success: false, message: "Webhook signature verification failed" });
      }
    } else {
      console.warn("[Razorpay Webhook] Webhook Secret unconfigured. Operating in Sandbox simulation mode.");
    }

    const eventObj = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const eventId = eventObj?.id || `rzp_evt_sim_${Date.now()}`;

    // Idempotency check: Ignore duplicate events
    const ProcessedEventModel = mongoose.model("ProcessedEvent");
    try {
      await ProcessedEventModel.create({ eventId, provider: "razorpay" });
    } catch (err: any) {
      if (err.code === 11000) {
        console.log(`[Razorpay Webhook] Event ${eventId} was already processed. Ignoring.`);
        return res.status(200).json({ received: true, ignored: true, message: "Duplicate event" });
      }
      throw err;
    }

    const eventType = eventObj?.event;
    console.log(`[Razorpay Webhook] Processing event ID: ${eventId}, Type: ${eventType}`);

    // Log Webhook Received Action
    try {
      const PaymentAuditLogModel = mongoose.model("PaymentAuditLog");
      await PaymentAuditLogModel.create({
        provider: "Razorpay",
        action: "Webhook Received",
        result: "success",
        metadata: { eventId, eventType }
      });
    } catch (err) {
      console.error("[Razorpay Webhook] Failed to write Audit Log:", err);
    }

    const payload = eventObj?.payload;
    if (!payload) {
      return res.status(200).json({ received: true });
    }

    // Try to find the Payment Record by Payment ID or providerOrderId (order_id)
    const paymentEntity = payload.payment?.entity;
    const providerOrderId = paymentEntity?.order_id;
    const paymentIdFromNotes = paymentEntity?.notes?.paymentId;

    let payment: any;
    if (paymentIdFromNotes && mongoose.Types.ObjectId.isValid(paymentIdFromNotes)) {
      payment = await mongoose.model("Payment").findById(paymentIdFromNotes);
    }
    if (!payment && providerOrderId) {
      payment = await mongoose.model("Payment").findOne({ providerOrderId });
    }

    if (!payment) {
      console.warn(`[Razorpay Webhook] No matching payment found for order_id: ${providerOrderId}`);
      return res.status(200).json({ received: true, message: "No matching payment record found" });
    }

    const paymentId = payment._id.toString();

    try {
      switch (eventType) {
        case "payment.captured":
        case "order.paid":
          await paymentService.completePaymentTransaction(
            paymentId,
            paymentEntity.id,
            signature,
            paymentEntity.id,
            payload
          );
          break;

        case "payment.failed":
          await paymentService.failPaymentTransaction(
            paymentId,
            paymentEntity.error_description || "Razorpay transaction failed",
            payload
          );
          break;

        case "refund.processed":
        case "refund.created":
          const refundServiceInstance = require("../services/refundService").refundService;
          const refundAmount = payload.refund?.entity?.amount ? payload.refund.entity.amount / 100 : undefined;
          await refundServiceInstance.processRefund(paymentId, refundAmount, "Refund processed via Razorpay Webhook");
          break;

        default:
          console.log(`[Razorpay Webhook] Unhandled event type: ${eventType}`);
      }
    } catch (err: any) {
      console.error(`[Razorpay Webhook] Error processing event ${eventType}:`, err);
      return res.status(200).json({ received: true, error: err.message });
    }

    return res.status(200).json({ received: true });
  }

  /**
   * POST /api/payments/:paymentId/refund
   * Triggers the simulated refund flow (with auto rollback & inventory restoration)
   */
  async refundPayment(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    if (!paymentId || (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(paymentId))) {
      throw new ValidationError("Invalid or missing payment ID");
    }

    const refundServiceInstance = require("../services/refundService").refundService;
    const refundedPayment = await refundServiceInstance.processRefund(paymentId, amount, reason, userId.toString());

    return ApiResponse.success(res, "Refund processed and completed successfully", refundedPayment);
  }

  /**
   * GET /api/payments/:paymentId/refund-status
   * Checks the status and metadata for a previously requested refund
   */
  async getRefundStatus(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { paymentId } = req.params;

    if (!paymentId || (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(paymentId))) {
      throw new ValidationError("Invalid or missing payment ID");
    }

    const refundServiceInstance = require("../services/refundService").refundService;
    const refundStatus = await refundServiceInstance.getRefundStatus(paymentId, userId.toString());

    return ApiResponse.success(res, "Refund status details retrieved successfully", refundStatus);
  }
}

export const paymentController = new PaymentController();
