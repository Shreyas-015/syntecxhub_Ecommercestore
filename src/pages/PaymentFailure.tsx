import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { orderService } from "../services/orderService";
import { Order } from "../types/order";
import { PageTransition } from "../components/common/PageTransition";
import { Button } from "../components/common/Button";
import { 
  XCircle, 
  RefreshCw, 
  HelpCircle, 
  ShoppingBag, 
  ArrowLeft,
  Loader2,
  AlertTriangle,
  FileText
} from "lucide-react";

export const PaymentFailure: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reason = searchParams.get("reason") || "The payment transaction was cancelled or declined by the provider gateway.";

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const data = await orderService.getOrderById(orderId);
        setOrder(data);
      } catch (err: any) {
        setError(err.message || "Failed to load order coordinates");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs text-slate-400 font-mono">Loading transaction parameters...</p>
      </div>
    );
  }

  const formattedTotal = order ? (typeof order.total === "number" ? order.total.toFixed(2) : Number(order.total || 0).toFixed(2)) : "0.00";

  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 py-16">
        <div className="max-w-xl mx-auto px-4 sm:px-6 space-y-8 text-center">
          
          {/* Failed Icon & Title */}
          <div className="space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-xs animate-shake">
              <XCircle className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                Payment Authorized Failed
              </h1>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                We could not complete your transaction token handshake with the gateway.
              </p>
            </div>
          </div>

          {/* Error Details Card */}
          <div className="bg-white border border-slate-150 p-6 rounded-3xl text-left space-y-4 shadow-xs">
            <div className="flex items-start gap-3 bg-rose-50/40 p-4 rounded-2xl border border-rose-100/50">
              <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-rose-900">Decline Reason</h4>
                <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
                  {reason}
                </p>
              </div>
            </div>

            {order && (
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">Order Reference:</span>
                  <span className="font-mono font-bold text-slate-800">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">Transaction Value:</span>
                  <span className="font-mono font-bold text-slate-800">${formattedTotal}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Status:</span>
                  <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md font-bold text-[9px] uppercase font-mono border border-rose-100/60">
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions pathways */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (order) {
                    // Navigate back to checkout with order details if possible
                    navigate(`/checkout?retryOrder=${order._id}`);
                  } else {
                    navigate("/cart");
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl text-xs transition-all shadow-xs"
              >
                <RefreshCw className="w-4 h-4 animate-spin-hover" />
                <span>Retry Payment</span>
              </button>

              <Link to="/shop" className="w-full">
                <button className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-3.5 px-6 rounded-xl text-xs transition-all shadow-xs">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Continue Shopping</span>
                </button>
              </Link>
            </div>

            <Link 
              to="/contact?topic=payment_failure" 
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors py-2"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Contact Support Desk</span>
            </Link>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};
