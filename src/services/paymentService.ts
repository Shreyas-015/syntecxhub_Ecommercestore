import api from "../lib/api";

export interface PaymentAmounts {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export interface PaymentDetails {
  _id: string;
  user: string;
  order: string;
  provider: string;
  paymentId?: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  providerSignature?: string;
  transactionId?: string;
  amounts: PaymentAmounts;
  currency: string;
  status: string;
  method: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: {
    providerResponse?: any;
    failureReason?: string;
  };
}

export const paymentService = {
  /**
   * Returns active/enabled payment providers based on backend keys configuration
   */
  async getPaymentConfig(): Promise<{ stripe: boolean; razorpay: boolean; cod: boolean; razorpayKeyId: string | null }> {
    const response = await api.get("/payments/config");
    return response.data.data;
  },

  /**
   * Initializes a payment (Stripe or Razorpay) for an existing order
   */
  async createPaymentOrder(orderId: string, providerName: string, preferredMethod?: string): Promise<PaymentDetails> {
    const response = await api.post("/payments/create-order", {
      orderId,
      providerName,
      preferredMethod,
    });
    return response.data.data;
  },

  /**
   * Verifies checkout signatures or session status for payment providers
   */
  async verifyPayment(
    paymentId: string,
    verificationData: {
      providerPaymentId?: string;
      providerSignature?: string;
      providerOrderId?: string;
      [key: string]: any;
    }
  ): Promise<PaymentDetails> {
    const response = await api.post("/payments/verify", {
      paymentId,
      ...verificationData,
    });
    return response.data.data;
  },

  /**
   * Handles Cash on Delivery checkout method registration
   */
  async createCODPayment(orderId: string): Promise<PaymentDetails> {
    const response = await api.post("/payments/cod", { orderId });
    return response.data.data;
  },

  /**
   * Retrieve payment details by ID
   */
  async getPaymentById(paymentId: string): Promise<PaymentDetails> {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data.data;
  },

  /**
   * Retrieve payment details by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<PaymentDetails> {
    const response = await api.get(`/orders/${orderId}/payment`);
    return response.data.data;
  }
};
