import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { PageTransition } from "../components/common/PageTransition";
import { Button } from "../components/common/Button";
import { useToast } from "../context/ToastContext";
import { Link } from "react-router-dom";
import { 
  Package, 
  ArrowRight, 
  Compass, 
  Clock, 
  CheckCircle, 
  Truck, 
  HelpCircle,
  Sparkles,
  ShoppingBag,
  Loader2,
  ExternalLink
} from "lucide-react";
import { orderService } from "../services/orderService";
import { Order, OrderStatus } from "../types/order";

export const Orders: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) return;
      try {
        const data = await orderService.getOrders();
        setOrders(data);
      } catch (err: any) {
        setError(err.message || "Failed to load order ledger");
        showToast(err.message || "Failed to load orders", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [isAuthenticated, showToast]);

  const handleTrackShipment = (orderNumber: string) => {
    showToast(`Retrieving global tracking logs for parcel ${orderNumber}...`, "info");
  };

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DELIVERED:
        return "text-emerald-500 bg-emerald-50 border-emerald-100";
      case OrderStatus.CANCELLED:
        return "text-rose-500 bg-rose-50 border-rose-100";
      case OrderStatus.SHIPPED:
      case OrderStatus.OUT_FOR_DELIVERY:
        return "text-indigo-500 bg-indigo-50 border-indigo-100";
      case OrderStatus.PROCESSING:
      case OrderStatus.CONFIRMED:
        return "text-sky-500 bg-sky-50 border-sky-100";
      case OrderStatus.PENDING:
      default:
        return "text-amber-500 bg-amber-50 border-amber-100";
    }
  };

  const formatOrderDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Compute stats dynamically
  const inTransitCount = orders.filter(
    (o) => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED
  ).length;

  const deliveredCount = orders.filter((o) => o.status === OrderStatus.DELIVERED).length;

  const totalSpent = orders
    .filter((o) => o.status !== OrderStatus.CANCELLED)
    .reduce((sum, o) => sum + (typeof o.total === "number" ? o.total : Number(o.total || 0)), 0);

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
        <ShoppingBag className="w-12 h-12 text-slate-300" />
        <h3 className="font-extrabold text-slate-800 text-base">Please authenticate</h3>
        <p className="text-xs text-slate-400">Login to your Syntex store profile to inspect purchase logs.</p>
        <Link to="/login?redirect=orders">
          <Button variant="primary" size="sm">Log In Now</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs text-slate-400 font-mono">Querying central order ledger...</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Header */}
          <div className="space-y-2 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
              <Sparkles className="w-3 h-3" />
              <span>Purchase Ledger</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Your Store Orders
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Track current shipments, retrieve invoice statements, and inspect secure digital dispatch records.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 font-mono">Active / Processing</p>
                <p className="text-lg font-extrabold text-slate-800">{inTransitCount} {inTransitCount === 1 ? "Shipment" : "Shipments"}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 font-mono">Delivered</p>
                <p className="text-lg font-extrabold text-slate-800">{deliveredCount} {deliveredCount === 1 ? "Shipment" : "Shipments"}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 font-mono">Total Spent</p>
                <p className="text-lg font-extrabold text-slate-800">${totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-6">
            {orders.length > 0 ? (
              orders.map((order) => {
                const totalItemCount = order.orderItems.reduce((acc, it) => acc + it.quantity, 0);
                const orderTotal = typeof order.total === "number" ? order.total : Number(order.total || 0);

                return (
                  <div 
                    key={order._id} 
                    className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs hover:border-slate-200 transition-all"
                  >
                    {/* Header detail */}
                    <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-x-6 gap-y-2 text-xs">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Order Number</p>
                          <Link to={`/orders/${order._id}`} className="font-bold font-mono text-blue-400 hover:underline flex items-center gap-1">
                            <span>{order.orderNumber}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Placed On</p>
                          <p className="font-semibold text-slate-200">{formatOrderDate(order.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Total Checkout</p>
                          <p className="font-extrabold text-emerald-400">${orderTotal.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border uppercase ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border border-slate-700 bg-slate-800/80 text-slate-300 uppercase">
                          Pay: {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Items in the order */}
                    <div className="p-6 space-y-4">
                      {order.orderItems.map((item, itemIdx) => {
                        const itemPrice = typeof item.price === "number" ? item.price : Number(item.price || 0);
                        return (
                          <div key={itemIdx} className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 bg-white p-0.5 flex-shrink-0">
                              <img
                                src={item.thumbnail || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80"}
                                alt={item.name}
                                className="w-full h-full object-cover rounded-xl"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <h4 className="text-xs font-bold text-slate-800">{item.name}</h4>
                              <p className="text-[10px] text-slate-400 font-bold font-mono uppercase">
                                Unit Price: ${itemPrice.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-extrabold text-slate-900">${(itemPrice * item.quantity).toFixed(2)}</p>
                              <p className="text-[10px] text-slate-400 font-bold">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Actions Bar */}
                      <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <HelpCircle className="w-4 h-4" />
                          <span>Delivered by Syntex Logistics. Items count: {totalItemCount}</span>
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto">
                          <Link to={`/orders/${order._id}`} className="flex-1 sm:flex-initial">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs font-bold w-full py-2"
                            >
                              Inspect Details
                            </Button>
                          </Link>
                          {order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="text-xs font-bold flex-1 sm:flex-initial py-2"
                              onClick={() => handleTrackShipment(order.orderNumber)}
                              icon={<Truck className="w-4 h-4" />}
                            >
                              Track Shipment
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs font-bold flex-1 sm:flex-initial py-2"
                            onClick={() => showToast("PDF invoice downloaded successfully (Simulated).", "success")}
                          >
                            Download Invoice
                          </Button>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 space-y-5">
                <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                  <Package className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-extrabold text-slate-800">Your purchases folder is empty</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    You have not committed any checkout transactions on our server ledger. Navigate to our catalog to select your premium wear.
                  </p>
                </div>
                <div>
                  <Link to="/shop">
                    <Button variant="primary">Shop Catalog Now</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Continue Shopping button */}
          {orders.length > 0 && (
            <div className="text-center pt-4">
              <Link to="/shop">
                <Button variant="primary" icon={<ArrowRight className="w-4.5 h-4.5" />}>
                  Continue Exploration
                </Button>
              </Link>
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
};
