import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { orderService } from "../services/orderService";
import { Order } from "../types/order";
import { PageTransition } from "../components/common/PageTransition";
import { Button } from "../components/common/Button";
import { 
  CheckCircle, 
  ShoppingBag, 
  Truck, 
  MapPin, 
  CreditCard, 
  Calendar, 
  ArrowRight, 
  Loader2, 
  ShieldCheck,
  Phone
} from "lucide-react";

export const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
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
        <p className="text-xs text-slate-400 font-mono">Securing receipt parameters...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4 max-w-md mx-auto text-center px-4">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="font-extrabold text-slate-800 text-lg">Failed to retrieve invoice</h3>
        <p className="text-xs text-slate-400">
          The order was placed successfully, but we encountered a network discrepancy retrieving details.
        </p>
        <Link to="/orders">
          <Button variant="outline" size="sm">Go to Purchases History</Button>
        </Link>
      </div>
    );
  }

  // Format delivery date
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
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm animate-bounce">
              <CheckCircle className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                Authorized successfully
              </h1>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your order is certified on our server ledger. Thank you for shopping with Syntex Store!
              </p>
            </div>
          </div>

          {/* Core Invoice Card */}
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
            
            {/* Header detail */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-1 font-mono">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Voucher Number</p>
                <p className="text-sm font-extrabold text-slate-200">{order.orderNumber}</p>
              </div>
              <div className="space-y-1 sm:text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Transaction value</p>
                <p className="text-base font-black text-blue-400">${formattedTotal}</p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Timeline details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Delivery details */}
                <div className="space-y-3.5">
                  <h4 className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-slate-300" />
                    <span>Logistics Dispatch</span>
                  </h4>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p className="font-extrabold text-slate-800 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Est. Arrival:</span>
                    </p>
                    <p className="font-medium text-blue-600 pl-4.5">{formatDeliveryDate(order.estimatedDelivery)}</p>
                    <p className="text-[10px] text-slate-400 pl-4.5">Standard Dispatch Protocol activated.</p>
                  </div>
                </div>

                {/* Status elements */}
                <div className="space-y-3.5">
                  <h4 className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-slate-300" />
                    <span>Registry state</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-medium">Order Status:</span>
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px] uppercase font-mono border border-blue-100">
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-medium">Payment State:</span>
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-md font-bold text-[10px] uppercase font-mono border border-amber-100">
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Shipping snapshot details */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5 pb-3">
                  <MapPin className="w-4 h-4 text-slate-300" />
                  <span>Delivery destination</span>
                </h4>
                <div className="text-xs text-slate-600 space-y-1.5 pl-5 border-l-2 border-slate-100">
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

          {/* Action Pathways */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link to={`/orders/${order._id}`} className="w-full sm:w-auto">
              <Button variant="primary" className="w-full text-xs font-bold py-3 px-6" icon={<ShoppingBag className="w-4 h-4" />}>
                View Order Details
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
