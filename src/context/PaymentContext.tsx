import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "./ToastContext";
import { useAuth } from "./AuthContext";
import { paymentService, PaymentDetails } from "../services/paymentService";
import { useCart } from "../hooks/useCart";

export enum PaymentMethod {
  CASH_ON_DELIVERY = "CashOnDelivery",
  STRIPE = "Stripe",
  RAZORPAY = "Razorpay"
}

export enum PaymentStatus {
  IDLE = "idle",
  LOADING = "loading",
  SUCCESS = "success",
  FAILED = "failed"
}

interface PaymentContextType {
  selectedMethod: PaymentMethod;
  setSelectedMethod: (method: PaymentMethod) => void;
  paymentLoading: boolean;
  paymentStatus: PaymentStatus;
  paymentError: string | null;
  activePayment: PaymentDetails | null;
  createPayment: (orderId: string, provider: PaymentMethod) => Promise<PaymentDetails>;
  verifyPayment: (paymentId: string, data: any) => Promise<PaymentDetails>;
  placeCODOrder: (orderId: string) => Promise<PaymentDetails>;
  retryPayment: (paymentId: string) => Promise<void>;
  fetchPaymentStatus: (paymentId: string) => Promise<PaymentDetails>;
  clearPaymentState: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { clearCart } = useCart();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CASH_ON_DELIVERY);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.IDLE);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [activePayment, setActivePayment] = useState<PaymentDetails | null>(null);

  const clearPaymentState = () => {
    setPaymentLoading(false);
    setPaymentStatus(PaymentStatus.IDLE);
    setPaymentError(null);
    setActivePayment(null);
  };

  /**
   * Initialize a checkout payment session on the backend
   */
  const createPayment = async (orderId: string, provider: PaymentMethod): Promise<PaymentDetails> => {
    setPaymentLoading(true);
    setPaymentStatus(PaymentStatus.LOADING);
    setPaymentError(null);

    try {
      // Map frontend selected method to backend enum format
      // Backend expects providerName: 'Stripe' | 'Razorpay' | 'CashOnDelivery'
      const providerName = provider; 
      const preferredMethod = provider === PaymentMethod.STRIPE 
        ? "card" 
        : provider === PaymentMethod.RAZORPAY 
          ? "upi" 
          : "cod";

      const payment = await paymentService.createPaymentOrder(orderId, providerName, preferredMethod);
      setActivePayment(payment);
      return payment;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to initialize payment session with gateway.";
      setPaymentError(errorMsg);
      setPaymentStatus(PaymentStatus.FAILED);
      showToast(errorMsg, "error");
      throw err;
    } finally {
      setPaymentLoading(false);
    }
  };

  /**
   * Verify an authorized gateway payment
   */
  const verifyPayment = async (paymentId: string, verificationData: any): Promise<PaymentDetails> => {
    setPaymentLoading(true);
    setPaymentStatus(PaymentStatus.LOADING);
    setPaymentError(null);

    try {
      const payment = await paymentService.verifyPayment(paymentId, verificationData);
      setActivePayment(payment);
      setPaymentStatus(PaymentStatus.SUCCESS);
      showToast("Payment verified and authorized on ledger!", "success");
      await clearCart();
      return payment;
    } catch (err: any) {
      const errorMsg = err.message || "Payment signature verification failed.";
      setPaymentError(errorMsg);
      setPaymentStatus(PaymentStatus.FAILED);
      showToast(errorMsg, "error");
      throw err;
    } finally {
      setPaymentLoading(false);
    }
  };

  /**
   * Place COD Order and create payment record directly
   */
  const placeCODOrder = async (orderId: string): Promise<PaymentDetails> => {
    setPaymentLoading(true);
    setPaymentStatus(PaymentStatus.LOADING);
    setPaymentError(null);

    try {
      const payment = await paymentService.createCODPayment(orderId);
      setActivePayment(payment);
      setPaymentStatus(PaymentStatus.SUCCESS);
      showToast("COD dispatch registered! Syntex ledger synced.", "success");
      await clearCart();
      return payment;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to register COD order.";
      setPaymentError(errorMsg);
      setPaymentStatus(PaymentStatus.FAILED);
      showToast(errorMsg, "error");
      throw err;
    } finally {
      setPaymentLoading(false);
    }
  };

  /**
   * Retry an initialized payment session
   */
  const retryPayment = async (paymentId: string): Promise<void> => {
    setPaymentLoading(true);
    setPaymentStatus(PaymentStatus.LOADING);
    setPaymentError(null);

    try {
      const payment = await paymentService.getPaymentById(paymentId);
      setActivePayment(payment);
      setPaymentStatus(PaymentStatus.IDLE);
    } catch (err: any) {
      const errorMsg = err.message || "Failed to retrieve existing payment details.";
      setPaymentError(errorMsg);
      setPaymentStatus(PaymentStatus.FAILED);
      showToast(errorMsg, "error");
    } finally {
      setPaymentLoading(false);
    }
  };

  /**
   * Fetch payment status and update local state
   */
  const fetchPaymentStatus = async (paymentId: string): Promise<PaymentDetails> => {
    try {
      const payment = await paymentService.getPaymentById(paymentId);
      setActivePayment(payment);
      if (payment.status === "paid") {
        setPaymentStatus(PaymentStatus.SUCCESS);
      } else if (payment.status === "failed" || payment.status === "cancelled") {
        setPaymentStatus(PaymentStatus.FAILED);
      }
      return payment;
    } catch (err: any) {
      console.error("Error fetching payment status:", err);
      throw err;
    }
  };

  return (
    <PaymentContext.Provider
      value={{
        selectedMethod,
        setSelectedMethod,
        paymentLoading,
        paymentStatus,
        paymentError,
        activePayment,
        createPayment,
        verifyPayment,
        placeCODOrder,
        retryPayment,
        fetchPaymentStatus,
        clearPaymentState
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error("usePayment must be used within a PaymentProvider");
  }
  return context;
};
