import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { orderService } from "../services/orderService";
import { Order, OrderStatus, PaymentStatus } from "../types/order";
import { PageTransition } from "../components/common/PageTransition";
import { Button } from "../components/common/Button";
import { useToast } from "../context/ToastContext";
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Calendar, 
  Truck, 
  CheckCircle, 
  ShieldCheck, 
  HelpCircle,
  Loader2,
  Clock,
  CircleDot,
  FileText
} from "lucide-react";

export const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;
      try {
        const data = await orderService.getOrderById(id);
        setOrder(data);
      } catch (err: any) {
        setError(err.message || "Failed to load order coordinates");
        showToast(err.message || "Failed to load order details", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [id, showToast]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs text-slate-400 font-mono">Retrieving order details from ledger...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4 max-w-md mx-auto text-center px-4">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-slate-800 text-lg">Order detail not found</h3>
        <p className="text-xs text-slate-400">
          The order ledger might have been archived or is temporarily inaccessible.
        </p>
        <Link to="/orders">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Purchase History
          </Button>
        </Link>
      </div>
    );
  }

  // Define steps for Timeline
  const steps = [
    { label: "Pending", status: OrderStatus.PENDING, desc: "Order authenticated" },
    { label: "Confirmed", status: OrderStatus.CONFIRMED, desc: "Logistics approved" },
    { label: "Processing", status: OrderStatus.PROCESSING, desc: "Packing in progress" },
    { label: "Shipped", status: OrderStatus.SHIPPED, desc: "Carrier dispatched" },
    { label: "Out For Delivery", status: OrderStatus.OUT_FOR_DELIVERY, desc: "Courier route" },
    { label: "Delivered", status: OrderStatus.DELIVERED, desc: "Package handed over" }
  ];

  const getStepIndex = (status: OrderStatus) => {
    return steps.findIndex((step) => step.status === status);
  };

  const currentStepIdx = getStepIndex(order.status);

  const getStatusColor = (status: OrderStatus) => {
    if (status === OrderStatus.CANCELLED) return "text-red-500 border-red-200 bg-red-50";
    return "text-blue-600 border-blue-200 bg-blue-50";
  };

  const formatOrderDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const orderTotal = typeof order.total === "number" ? order.total : Number(order.total || 0);
  const orderSubtotal = typeof order.subtotal === "number" ? order.subtotal : Number(order.subtotal || 0);
  const orderDiscount = typeof order.discount === "number" ? order.discount : Number(order.discount || 0);
  const orderShipping = typeof order.shipping === "number" ? order.shipping : Number(order.shipping || 0);
  const orderTax = typeof order.tax === "number" ? order.tax : Number(order.tax || 0);

  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Back button */}
          <div className="flex items-center">
            <Link to="/orders" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Purchase History</span>
            </Link>
          </div>

          {/* Title Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-150">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900 font-display">
                  Order {order.orderNumber}
                </h1>
                {order.status === OrderStatus.CANCELLED && (
                  <span className="px-2.5 py-0.5 bg-red-50 text-red-600 rounded-md font-bold text-[10px] uppercase font-mono border border-red-100">
                    Cancelled
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Registered on: <span className="font-semibold text-slate-600">{formatOrderDate(order.createdAt)}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold py-2"
                onClick={() => showToast("Invoice generated and downloaded (Simulated).", "success")}
                icon={<FileText className="w-4 h-4" />}
              >
                Voucher PDF
              </Button>
            </div>
          </div>

          {/* Timeline Process Visualizer */}
          {order.status !== OrderStatus.CANCELLED && (
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-xs space-y-6">
              <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-400">
                Logistics Timeline
              </h3>
              
              <div className="relative pt-2">
                {/* Desktop horizontal progress line */}
                <div className="hidden md:block absolute top-[19px] left-8 right-8 h-0.5 bg-slate-100 -z-10">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-500" 
                    style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
                  />
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-y-6 gap-x-2">
                  {steps.map((step, idx) => {
                    const isCompleted = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;

                    return (
                      <div key={idx} className="flex md:flex-col items-center md:text-center gap-4 md:gap-2 relative">
                        {/* Bullet Icon */}
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
                            isCompleted 
                              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10" 
                              : "bg-white text-slate-300 border-slate-150"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <CircleDot className="w-4 h-4" />
                          )}
                        </div>

                        {/* Label & Description */}
                        <div className="space-y-0.5">
                          <p className={`text-xs font-bold ${isCurrent ? "text-blue-600 font-extrabold" : isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                            {step.label}
                          </p>
                          <p className="text-[10px] text-slate-400 leading-normal max-w-[120px] mx-auto md:block hidden">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          )}

          {/* Details Content Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* Left: Product Snaps and Summary */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Products in this order */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-5">
                <h3 className="font-extrabold text-slate-900 font-display text-sm pb-3 border-b border-slate-100">
                  Consolidated Package Content
                </h3>

                <div className="space-y-5">
                  {order.orderItems.map((item, idx) => {
                    const itemPrice = typeof item.price === "number" ? item.price : Number(item.price || 0);
                    return (
                      <div key={idx} className="flex items-center gap-5 pb-5 border-b border-slate-50 last:border-0 last:pb-0">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0 p-0.5">
                          <img
                            src={item.thumbnail || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80"}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 leading-snug">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold font-mono uppercase mt-0.5">
                            Unit Cost: ${itemPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-black text-slate-900 font-mono">${(itemPrice * item.quantity).toFixed(2)}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery parameters and details */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-6">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 font-display text-sm">
                    Shipping & Logistics Parameters
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs leading-relaxed">
                  
                  {/* Address snapshot */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Recipient Address</p>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <p className="font-extrabold text-slate-800">{order.shippingAddress.fullName}</p>
                      <p className="text-slate-600 font-medium">
                        {order.shippingAddress.addressLine1}
                        {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                        <br />
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 font-mono mt-1.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                        <span>{order.shippingAddress.phone}</span>
                      </p>
                    </div>
                  </div>

                  {/* Payment specs */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Payment Protocol</p>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Channel:</span>
                        <span className="font-bold text-slate-800">{order.paymentMethod}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Payment State:</span>
                        <span className={`px-2.5 py-0.5 rounded font-bold text-[9px] uppercase font-mono border ${
                          order.paymentStatus === PaymentStatus.PAID 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Order State:</span>
                        <span className={`px-2.5 py-0.5 rounded font-bold text-[9px] uppercase font-mono border ${
                          order.status === OrderStatus.DELIVERED 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {order.notes && (
                  <div className="pt-4 border-t border-slate-50 text-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono pb-1">Recipient delivery comments</p>
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic font-medium">"{order.notes}"</p>
                  </div>
                )}
              </div>

            </div>

            {/* Right: Payment value breakdown */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-5">
              <h3 className="font-extrabold text-slate-900 font-display text-sm pb-3 border-b border-slate-100">
                Financial Breakdown
              </h3>

              <div className="space-y-3 text-xs font-medium">
                <div className="flex justify-between text-slate-500">
                  <span>Selected items cost</span>
                  <span className="font-mono text-slate-800 font-bold">${orderSubtotal.toFixed(2)}</span>
                </div>
                {orderDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount Deducted</span>
                    <span className="font-mono">-${orderDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Logistics Carrier fee</span>
                  <span className="font-mono text-slate-800 font-bold">
                    {orderShipping === 0 ? "FREE" : `$${orderShipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Sales Tax (State Node)</span>
                  <span className="font-mono text-slate-800 font-bold">${orderTax.toFixed(2)}</span>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between text-sm font-black text-slate-900">
                  <span>Grand Total</span>
                  <span className="font-mono text-blue-600 text-base font-black">${orderTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 leading-normal bg-slate-50 p-3 rounded-xl border border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Synchronized via secure sandbox parameters. Authorized.</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </PageTransition>
  );
};
