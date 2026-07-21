import { IPayment, PaymentProviderName } from "../types/payment";
import Stripe from "stripe";
// @ts-ignore
import Razorpay from "razorpay";
import crypto from "crypto";

export interface IPaymentProvider {
  name: PaymentProviderName;
  
  /**
   * Initializes or registers an order on the payment provider gateway
   */
  createOrder(payment: IPayment): Promise<{
    providerOrderId: string;
    rawResponse: any;
  }>;

  /**
   * Verifies the client-side payment signature or payload (webhook / return callback payload)
   */
  verifyPayment(
    paymentId: string,
    verificationData: {
      providerPaymentId?: string;
      providerSignature?: string;
      providerOrderId?: string;
      [key: string]: any;
    }
  ): Promise<{
    success: boolean;
    providerResponse: any;
  }>;

  /**
   * Captures an authorized payment (e.g. standard two-phase authorize-and-capture gateways)
   */
  capturePayment(
    paymentId: string,
    captureData?: any
  ): Promise<{
    success: boolean;
    transactionId: string;
    providerResponse: any;
  }>;

  /**
   * Processes or schedules a refund for the target payment transaction
   */
  refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<{
    success: boolean;
    refundTransactionId: string;
    providerResponse: any;
  }>;

  /**
   * Cancels/voids an un-captured or pending payment session
   */
  cancelPayment(
    paymentId: string
  ): Promise<{
    success: boolean;
    providerResponse: any;
  }>;
}

// Lazy initialization of Stripe to prevent startup crashes when keys are missing
let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY environment variable is required but missing. Payment provider integration is inactive.");
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(key, {
      apiVersion: "2023-10-16" as any, // standard API version
    });
  }
  return stripeInstance;
}

// Lazy initialization of Razorpay to prevent startup crashes when keys are missing
let razorpayInstance: any = null;
function getRazorpay(): any {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required but missing. Payment provider integration is inactive.");
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
}

// ==========================================
// PRODUCTION-READY STRIPE GATEWAY PROVIDER
// ==========================================
export class StripeProvider implements IPaymentProvider {
  name = PaymentProviderName.STRIPE;

  async createOrder(payment: IPayment): Promise<{ providerOrderId: string; rawResponse: any }> {
    try {
      const stripe = getStripe();
      
      // Create a PaymentIntent which is perfect for modern Stripe Element/Mobile checkout
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(payment.amounts.total * 100), // Stripe expects amount in cents
        currency: payment.currency.toLowerCase(),
        metadata: {
          paymentId: String(payment.id || payment._id),
          orderId: String(payment.order),
          userId: String(payment.user)
        }
      });

      console.log(`[StripeProvider] Created Stripe PaymentIntent: ${paymentIntent.id} for payment ${payment.id || payment._id}`);
      
      return {
        providerOrderId: paymentIntent.id,
        rawResponse: {
          id: paymentIntent.id,
          object: "payment_intent",
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          client_secret: paymentIntent.client_secret,
          status: paymentIntent.status
        }
      };
    } catch (err: any) {
      console.error(`[StripeProvider] Error creating order:`, err.message);
      throw err;
    }
  }

  async verifyPayment(
    paymentId: string,
    verificationData: { providerPaymentId?: string; providerSignature?: string; [key: string]: any }
  ): Promise<{ success: boolean; providerResponse: any }> {
    try {
      console.log(`[StripeProvider] Verifying Stripe payment status for paymentId: ${paymentId}`);
      const stripe = getStripe();
      
      // Verification data might contain either a Checkout Session or PaymentIntent ID
      const targetId = verificationData.providerPaymentId || verificationData.providerOrderId;
      if (!targetId) {
        throw new Error("Stripe verification requires providerPaymentId (PaymentIntent or Session ID).");
      }

      if (targetId.startsWith("cs_")) {
        // Stripe Checkout Session verification
        const session = await stripe.checkout.sessions.retrieve(targetId);
        const success = session.status === "complete" || session.payment_status === "paid";
        return {
          success,
          providerResponse: session
        };
      } else {
        // Stripe PaymentIntent verification
        const paymentIntent = await stripe.paymentIntents.retrieve(targetId);
        const success = paymentIntent.status === "succeeded";
        return {
          success,
          providerResponse: paymentIntent
        };
      }
    } catch (err: any) {
      console.error(`[StripeProvider] Verification error:`, err.message);
      return {
        success: false,
        providerResponse: { error: err.message }
      };
    }
  }

  async capturePayment(
    paymentId: string,
    captureData?: any
  ): Promise<{ success: boolean; transactionId: string; providerResponse: any }> {
    try {
      const stripe = getStripe();
      const targetId = captureData?.providerPaymentId || paymentId;
      const capturedIntent = await stripe.paymentIntents.capture(targetId);
      return {
        success: capturedIntent.status === "succeeded",
        transactionId: capturedIntent.id,
        providerResponse: capturedIntent
      };
    } catch (err: any) {
      console.error(`[StripeProvider] Capture error:`, err.message);
      return {
        success: false,
        transactionId: "",
        providerResponse: { error: err.message }
      };
    }
  }

  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; refundTransactionId: string; providerResponse: any }> {
    try {
      const stripe = getStripe();
      const refund = await stripe.refunds.create({
        payment_intent: paymentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: (reason as any) || "requested_by_customer"
      });
      return {
        success: refund.status === "succeeded",
        refundTransactionId: refund.id,
        providerResponse: refund
      };
    } catch (err: any) {
      console.error(`[StripeProvider] Refund error:`, err.message);
      return {
        success: false,
        refundTransactionId: "",
        providerResponse: { error: err.message }
      };
    }
  }

  async cancelPayment(paymentId: string): Promise<{ success: boolean; providerResponse: any }> {
    try {
      const stripe = getStripe();
      const cancelledIntent = await stripe.paymentIntents.cancel(paymentId);
      return {
        success: cancelledIntent.status === "canceled",
        providerResponse: cancelledIntent
      };
    } catch (err: any) {
      console.error(`[StripeProvider] Cancel error:`, err.message);
      return {
        success: false,
        providerResponse: { error: err.message }
      };
    }
  }
}

// ==========================================
// PRODUCTION-READY RAZORPAY GATEWAY PROVIDER
// ==========================================
export class RazorpayProvider implements IPaymentProvider {
  name = PaymentProviderName.RAZORPAY;

  async createOrder(payment: IPayment): Promise<{ providerOrderId: string; rawResponse: any }> {
    try {
      const razorpay = getRazorpay();
      
      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(payment.amounts.total * 100), // Razorpay expects amount in paise (1 INR = 100 paise)
        currency: payment.currency.toUpperCase(),
        receipt: String(payment.id || payment._id),
        notes: {
          paymentId: String(payment.id || payment._id),
          orderId: String(payment.order),
          userId: String(payment.user)
        }
      });

      console.log(`[RazorpayProvider] Created Razorpay order: ${rzpOrder.id} for payment ${payment.id || payment._id}`);
      
      return {
        providerOrderId: rzpOrder.id,
        rawResponse: rzpOrder
      };
    } catch (err: any) {
      console.error(`[RazorpayProvider] Error creating order:`, err.message);
      throw err;
    }
  }

  async verifyPayment(
    paymentId: string,
    verificationData: { providerPaymentId?: string; providerSignature?: string; providerOrderId?: string; [key: string]: any }
  ): Promise<{ success: boolean; providerResponse: any }> {
    try {
      console.log(`[RazorpayProvider] Verifying Razorpay signature for paymentId: ${paymentId}`);
      
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        throw new Error("RAZORPAY_KEY_SECRET is required but missing");
      }

      const { providerOrderId, providerPaymentId, providerSignature } = verificationData;
      if (!providerOrderId || !providerPaymentId || !providerSignature) {
        return {
          success: false,
          providerResponse: { error: "Missing verification parameters. providerOrderId, providerPaymentId, and providerSignature are required." }
        };
      }

      // Verify the HMAC SHA256 Signature
      const hmac = crypto.createHmac("sha256", keySecret);
      hmac.update(`${providerOrderId}|${providerPaymentId}`);
      const generatedSignature = hmac.digest("hex");

      const success = generatedSignature === providerSignature;
      console.log(`[RazorpayProvider] Signature verification result: ${success}`);

      return {
        success,
        providerResponse: {
          verified: success,
          providerOrderId,
          providerPaymentId,
          providerSignature
        }
      };
    } catch (err: any) {
      console.error(`[RazorpayProvider] Verification error:`, err.message);
      return {
        success: false,
        providerResponse: { error: err.message }
      };
    }
  }

  async capturePayment(
    paymentId: string,
    captureData?: any
  ): Promise<{ success: boolean; transactionId: string; providerResponse: any }> {
    try {
      const razorpay = getRazorpay();
      const amount = captureData?.amount;
      const currency = captureData?.currency || "INR";
      
      if (!amount) {
        throw new Error("Capture amount is required for Razorpay manual capture");
      }

      const captured = await razorpay.payments.capture(paymentId, amount, currency);
      return {
        success: captured.status === "captured",
        transactionId: captured.id,
        providerResponse: captured
      };
    } catch (err: any) {
      console.error(`[RazorpayProvider] Capture error:`, err.message);
      return {
        success: false,
        transactionId: "",
        providerResponse: { error: err.message }
      };
    }
  }

  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; refundTransactionId: string; providerResponse: any }> {
    try {
      const razorpay = getRazorpay();
      const refund = await razorpay.payments.refund(paymentId, {
        amount: amount ? Math.round(amount * 100) : undefined,
        notes: { reason: reason || "requested_by_customer" }
      });
      return {
        success: refund.status === "processed",
        refundTransactionId: refund.id,
        providerResponse: refund
      };
    } catch (err: any) {
      console.error(`[RazorpayProvider] Refund error:`, err.message);
      return {
        success: false,
        refundTransactionId: "",
        providerResponse: { error: err.message }
      };
    }
  }

  async cancelPayment(paymentId: string): Promise<{ success: boolean; providerResponse: any }> {
    // Razorpay orders cannot be explicitly "cancelled" via API once created, they just expire
    console.log(`[RazorpayProvider] Cancel/void deferred (orders automatically expire)`);
    return {
      success: true,
      providerResponse: { message: "Razorpay order voided or left to expire" }
    };
  }
}

// ==========================================
// PRODUCTION-READY CASH ON DELIVERY PROVIDER
// ==========================================
export class CashOnDeliveryProvider implements IPaymentProvider {
  name = PaymentProviderName.CASH_ON_DELIVERY;

  async createOrder(payment: IPayment): Promise<{ providerOrderId: string; rawResponse: any }> {
    const codOrderId = `cod_${Math.random().toString(36).substring(2, 12)}`;
    console.log(`[CashOnDeliveryProvider] Initialized Cash on Delivery record ${codOrderId}`);
    return {
      providerOrderId: codOrderId,
      rawResponse: {
        id: codOrderId,
        method: "cod",
        requires_verification: false,
        status: "pending_delivery"
      }
    };
  }

  async verifyPayment(
    paymentId: string,
    verificationData: { providerPaymentId?: string; providerSignature?: string; [key: string]: any }
  ): Promise<{ success: boolean; providerResponse: any }> {
    console.log(`[CashOnDeliveryProvider] COD payment verification is deferred until physical handoff`);
    return {
      success: true,
      providerResponse: {
        verified_by: "system_deferral",
        status: "pending_handover"
      }
    };
  }

  async capturePayment(
    paymentId: string,
    captureData?: any
  ): Promise<{ success: boolean; transactionId: string; providerResponse: any }> {
    const txId = `txn_cod_${Math.random().toString(36).substring(2, 12)}`;
    console.log(`[CashOnDeliveryProvider] Captured and confirmed physical Cash on Delivery handover ${paymentId}`);
    return {
      success: true,
      transactionId: txId,
      providerResponse: {
        captured_by: "delivery_agent",
        status: "paid"
      }
    };
  }

  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; refundTransactionId: string; providerResponse: any }> {
    const refundTxId = `re_cod_${Math.random().toString(36).substring(2, 12)}`;
    console.log(`[CashOnDeliveryProvider] Initiated refund of cash value for cod payment ${paymentId}`);
    return {
      success: true,
      refundTransactionId: refundTxId,
      providerResponse: {
        repayment_method: "store_credit_or_bank_transfer",
        status: "refunded"
      }
    };
  }

  async cancelPayment(paymentId: string): Promise<{ success: boolean; providerResponse: any }> {
    console.log(`[CashOnDeliveryProvider] Cancelled COD commitment ${paymentId}`);
    return {
      success: true,
      providerResponse: {
        status: "voided"
      }
    };
  }
}
