import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { orderService } from "../services/orderService";
import { paymentService, PaymentDetails } from "../services/paymentService";
import { Order } from "../types/order";
import { PageTransition } from "../components/common/PageTransition";
import { Button } from "../components/common/Button";
import { 
  CheckCircle2, 
  ShoppingBag, 
  Truck, 
  MapPin, 
  CreditCard, 
  Calendar, 
  ArrowRight, 
  Loader2, 
  ShieldCheck,
  Phone,
  Receipt,
  FileCheck2,
  ExternalLink
} from "lucide-react";

export const PaymentSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) return;
      try {
        // Fetch order details first
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);

        // Fetch payment details associated with the order
        try {
          const paymentData = await paymentService.getPaymentByOrderId(orderId);
          setPayment(paymentData);
        } catch (payErr) {
          console.warn("Payment details not found yet or pending:", payErr);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load payment summary details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs text-slate-400 font-mono">Verifying payment authorization parameters...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4 max-w-md mx-auto text-center px-4">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="font-extrabold text-slate-800 text-lg">Invoice Query Failed</h3>
        <p className="text-xs text-slate-400">
          The payment succeeded, but we encountered an issue retrieving invoice synchronization parameters.
        </p>
        <Link to="/orders">
          <Button variant="outline" size="sm">Go to Purchases History</Button>
        </Link>
      </div>
    );
  }

  const formatDeliveryDate = (dateStr?: string) => {
    if (!dateStr) return "Within 5-7 business days";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formattedTotal = typeof order.total === "number" ? order.total.toFixed(2) : Number(order.total || 0).toFixed(2);

  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Visual confirmation badge */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs animate-pulse">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                Payment Successful
              </h1>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your payment transaction is certified on the secure ledger. Dispatch queue initialized.
              </p>
            </div>
          </div>

          {/* Secure Invoice & Payment Receipt Card */}
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
            
            {/* Dark Tech Card Header */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Invoice Reference</p>
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-extrabold text-slate-200 font-mono">{order.orderNumber}</span>
                </div>
              </div>
              <div className="space-y-1 sm:text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono font-medium">Grand Authorized Total</p>
                <p className="text-xl font-black text-blue-400 font-mono">${formattedTotal}</p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Payment Receipt Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-300" />
                    <span>Transaction Attributes</span>
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between sm:justify-start sm:gap-8">
                      <span className="text-slate-400 font-medium w-28">Payment ID:</span>
                      <span className="font-mono text-slate-800 font-bold break-all">
                        {payment?.providerPaymentId || payment?.transactionId || "N/A (Cash on Delivery)"}
                      </span>
                    </div>
                    <div className="flex justify-between sm:justify-start sm:gap-8">
                      <span className="text-slate-400 font-medium w-28">Payment Gateway:</span>
                      <span className="font-semibold text-slate-800 capitalize">
                        {order.paymentMethod === "CashOnDelivery" ? "Cash On Delivery" : order.paymentMethod}
                      </span>
                    </div>
                    <div className="flex justify-between sm:justify-start sm:gap-8">
                      <span className="text-slate-400 font-medium w-28">Payment Status:</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[10px] uppercase font-mono border border-emerald-100/60">
                        {payment?.status || order.paymentStatus}
                      </span>
                    </div>
                    <div className="flex justify-between sm:justify-start sm:gap-8">
                      <span className="text-slate-400 font-medium w-28">Order Status:</span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px] uppercase font-mono border border-blue-100/60">
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Logistics Estimates */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-slate-300" />
                    <span>Logistics Parameters</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Estimated Delivery:</span>
                    </p>
                    <p className="font-bold text-blue-600 pl-5.5 leading-relaxed">
                      {formatDeliveryDate(order.estimatedDelivery)}
                    </p>
                    <p className="text-[10px] text-slate-400 pl-5.5">
                      Standard sandbox dispatch protocols are active. Order tracked via local carrier.
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Destination Coordinate */}
              <div className="pt-2">
                <h4 className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5 pb-3">
                  <MapPin className="w-4 h-4 text-slate-300" />
                  <span>Delivery Coordinates</span>
                </h4>
                <div className="text-xs text-slate-600 space-y-1 pl-5 border-l-2 border-slate-100">
                  <p className="font-extrabold text-slate-800">{order.shippingAddress.fullName}</p>
                  <p className="font-medium leading-relaxed">
                    {order.shippingAddress.addressLine1}
                    {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                    <br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 font-mono mt-2 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-300" />
                    <span>{order.shippingAddress.phone}</span>
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* User Pathway Pathways */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link to={`/orders/${order._id}`} className="w-full sm:w-auto">
              <Button variant="primary" className="w-full text-xs font-bold py-3 px-6" icon={<FileCheck2 className="w-4 h-4" />}>
                View Order Summary
              </Button>
            </Link>
            <Link to="/shop" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full text-xs font-bold py-3 px-6" icon={<ArrowRight className="w-4.5 h-4.5" />}>
                Continue Shopping
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};
