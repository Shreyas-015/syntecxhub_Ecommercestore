import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Eye,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  ShoppingCart,
  Printer,
  Calendar,
  User,
  MapPin,
  CreditCard,
  Truck,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "../../context/ToastContext";
import { orderService } from "../../services/orderService";
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from "../../types/order";
import { Badge } from "../../components/common/Badge";
import { Skeleton } from "../../components/common/Skeleton";

export const AdminOrders: React.FC = () => {
  const { showToast } = useToast();

  // Core Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Filter/Search States
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest"); // "newest", "oldest", "totalDesc", "totalAsc"

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.adminGetOrders();
      setOrders(data || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load order queue", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Filter & Search Logic (Client-side with full query flexibility)
  const filteredOrders = orders.filter((order) => {
    const orderNum = order.orderNumber || order._id || "";
    // Handle customer info (it could be an object or a string or shippingAddress)
    const customerName = order.shippingAddress?.fullName || "";
    const customerPhone = order.shippingAddress?.phone || "";

    const matchesSearch =
      orderNum.toLowerCase().includes(search.toLowerCase()) ||
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      customerPhone.includes(search);

    const matchesStatus = statusFilter === "" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "" || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Sorting logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }
    if (sortBy === "totalDesc") {
      return b.total - a.total;
    }
    if (sortBy === "totalAsc") {
      return a.total - b.total;
    }
    return 0;
  });

  // Paginated Orders
  const totalItems = sortedOrders.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedOrders = sortedOrders.slice((page - 1) * limit, page * limit);

  // Single Order Detail Fetch
  const handleOpenDetail = async (id: string) => {
    try {
      const order = await orderService.adminGetOrderById(id);
      setSelectedOrder(order);
      setIsDetailOpen(true);
    } catch (err: any) {
      showToast(err.message || "Error fetching order detail specifications", "error");
    }
  };

  // Update Statuses
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await orderService.adminUpdateStatus(id, status);
      showToast(`Fulfillment status updated to ${status}`, "success");
      // Refresh current detail modal if open
      if (selectedOrder && selectedOrder._id === id) {
        setSelectedOrder({ ...selectedOrder, status: status as OrderStatus });
      }
      loadOrders();
    } catch (err: any) {
      showToast(err.message || "Failed to update fulfillment status", "error");
    }
  };

  const handleUpdatePaymentStatus = async (id: string, paymentStatus: string) => {
    try {
      await orderService.adminUpdatePaymentStatus(id, paymentStatus);
      showToast(`Payment status updated to ${paymentStatus}`, "success");
      if (selectedOrder && selectedOrder._id === id) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: paymentStatus as PaymentStatus });
      }
      loadOrders();
    } catch (err: any) {
      showToast(err.message || "Failed to update payment status", "error");
    }
  };

  // Print Invoice Popup
  const handlePrintReceipt = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Please allow popups to print receipt templates", "warning");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Invoice - ${order.orderNumber || order._id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px; }
            .meta { font-size: 13px; color: #64748b; line-height: 1.5; }
            .section { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 40px; }
            .col { flex: 1; font-size: 13px; }
            .col-title { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; letter-spacing: 0.5px; }
            .table { w-full; width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th { border-bottom: 1px solid #cbd5e1; padding: 12px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; }
            .table td { padding: 12px 8px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
            .table td.num { text-align: right; }
            .table th.num { text-align: right; }
            .totals { width: 40%; margin-left: auto; margin-top: 30px; font-size: 13px; }
            .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
            .totals-row.grand { border-top: 2px solid #e2e8f0; padding-top: 12px; font-weight: bold; font-size: 16px; color: #0f172a; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 60px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">SYNTEX STORE INVOICE</div>
              <div class="meta" style="margin-top: 6px;">Fulfillment Centre: 3000 Commerce Pkwy</div>
            </div>
            <div class="meta" style="text-align: right;">
              <div><strong>Invoice:</strong> #${order.orderNumber || order._id}</div>
              <div><strong>Fulfillment Status:</strong> ${order.status.toUpperCase()}</div>
              <div><strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}</div>
              <div><strong>Order Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
          </div>

          <div class="section">
            <div class="col">
              <div class="col-title">Shipping Information</div>
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${order.shippingAddress?.fullName}</div>
              <div>Phone: ${order.shippingAddress?.phone}</div>
              <div>${order.shippingAddress?.addressLine1}</div>
              ${order.shippingAddress?.addressLine2 ? `<div>${order.shippingAddress.addressLine2}</div>` : ""}
              <div>${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.postalCode}</div>
              <div>${order.shippingAddress?.country}</div>
            </div>
            <div class="col">
              <div class="col-title">Payment Mode</div>
              <div style="font-weight: bold; margin-bottom: 4px;">Method: ${order.paymentMethod}</div>
              <div>Estimated Delivery: ${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : "3-5 Business Days"}</div>
              ${order.notes ? `<div style="margin-top: 10px; font-style: italic; color: #64748b;">Notes: ${order.notes}</div>` : ""}
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Item Specification</th>
                <th class="num">Unit Price</th>
                <th class="num">Quantity</th>
                <th class="num">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${order.orderItems
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td class="num">$${item.price.toFixed(2)}</td>
                  <td class="num">${item.quantity}</td>
                  <td class="num">$${item.subtotal.toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Cart Subtotal</span>
              <span>$${order.subtotal.toFixed(2)}</span>
            </div>
            <div class="totals-row">
              <span>Shipping cost</span>
              <span>$${(order.shipping || 0).toFixed(2)}</span>
            </div>
            <div class="totals-row">
              <span>Tax / VAT (15%)</span>
              <span>$${(order.tax || 0).toFixed(2)}</span>
            </div>
            ${
              order.discount && order.discount > 0
                ? `
              <div class="totals-row" style="color: #10b981;">
                <span>Applied Coupon Discount</span>
                <span>-$${order.discount.toFixed(2)}</span>
              </div>
            `
                : ""
            }
            <div class="totals-row grand">
              <span>Grand Total</span>
              <span>$${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            Thank you for shopping at Syntex Store. If you have questions, contact order support.
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Status Styling mappings
  const getOrderStatusVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "success";
      case "processing":
      case "confirmed":
        return "primary";
      case "shipped":
      case "outForDelivery":
        return "warning";
      case "cancelled":
        return "danger";
      default:
        return "neutral";
    }
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "failed":
      case "refunded":
        return "danger";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Fulfillment Order Registry</h1>
          <p className="text-xs text-slate-500 font-medium">Verify processing checkout items, shipping nodes, and invoices</p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Registry
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* SEARCH BY TRANSACTION/CUSTOMER */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Order ID, Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
          />
        </div>

        {/* ORDER FULFILLMENT STATUS */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full text-xs font-medium px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
        >
          <option value="">All Fulfillment Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="outForDelivery">Out For Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* PAYMENT STATS */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="w-full text-xs font-medium px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
        >
          <option value="">All Payment Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        {/* ORDER SORT BY */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full text-xs font-medium px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
        >
          <option value="newest">Order Date: Newest First</option>
          <option value="oldest">Order Date: Oldest First</option>
          <option value="totalDesc">Grand Total: High to Low</option>
          <option value="totalAsc">Grand Total: Low to High</option>
        </select>
      </div>

      {/* ORDERS DATA GRID */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Order Date</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Grand Total</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Method</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Fulfillment</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Payment</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30">
                    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-4">
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </td>
                    <td className="p-4"><Skeleton className="h-3.5 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-3.5 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-3.5 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="p-4 text-right"><Skeleton className="h-8 w-16 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    No orders registered in fulfillment logs.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const itemsCount = order.orderItems?.reduce((acc, it) => acc + it.quantity, 0) || 0;
                  return (
                    <tr key={order._id} className="hover:bg-slate-50/50 transition-all duration-150">
                      <td className="p-4 text-xs font-mono font-bold text-slate-900">
                        #{order.orderNumber || order._id.substring(18)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900">{order.shippingAddress?.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{itemsCount} items purchased</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-600">
                        {new Date(order.createdAt || Date.now()).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-xs font-black text-slate-950">${order.total.toFixed(2)}</td>
                      <td className="p-4 text-xs font-semibold text-slate-500 uppercase">{order.paymentMethod}</td>
                      <td className="p-4">
                        <Badge variant={getOrderStatusVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                          {order.paymentStatus}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(order._id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-950 transition-all"
                            title="Open Invoice detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(order)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-950 transition-all"
                            title="Print invoice Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && totalItems > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-bold">
              Showing {paginatedOrders.length} of {totalItems} items
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const isCurrent = idx + 1 === page;
                return (
                  <button
                    key={idx}
                    onClick={() => setPage(idx + 1)}
                    className={`w-9.5 h-9.5 text-xs font-bold rounded-lg transition-all ${
                      isCurrent
                        ? "bg-slate-950 text-white shadow-sm"
                        : "border border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ORDER SPECIFICATIONS DRAWER / MODAL */}
      <AnimatePresence>
        {isDetailOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Container */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="relative bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6"
              >
                {/* Header detail */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        Order #{selectedOrder.orderNumber || selectedOrder._id}
                      </h2>
                      <button
                        onClick={() => handlePrintReceipt(selectedOrder)}
                        className="p-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      Fulfillment entry registered on {new Date(selectedOrder.createdAt || 0).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Grid info details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Shipping information card */}
                  <div className="p-4 rounded-2xl border border-slate-100 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-50 pb-1.5">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      Shipping Node
                    </div>
                    <div className="text-xs space-y-1 text-slate-600 font-semibold">
                      <div className="font-extrabold text-slate-900 text-sm mb-1">
                        {selectedOrder.shippingAddress?.fullName}
                      </div>
                      <div>Phone: {selectedOrder.shippingAddress?.phone}</div>
                      <div>{selectedOrder.shippingAddress?.addressLine1}</div>
                      {selectedOrder.shippingAddress?.addressLine2 && (
                        <div>{selectedOrder.shippingAddress?.addressLine2}</div>
                      )}
                      <div>
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.postalCode}
                      </div>
                      <div>{selectedOrder.shippingAddress?.country}</div>
                    </div>
                  </div>

                  {/* Payment Info Card */}
                  <div className="p-4 rounded-2xl border border-slate-100 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-50 pb-1.5">
                      <CreditCard className="w-4 h-4 text-slate-500" />
                      Transaction
                    </div>
                    <div className="text-xs space-y-1.5 text-slate-600 font-semibold">
                      <div>
                        Method: <span className="text-slate-900 font-extrabold uppercase">{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        Status:
                        <Badge variant={getPaymentStatusVariant(selectedOrder.paymentStatus)}>
                          {selectedOrder.paymentStatus}
                        </Badge>
                      </div>
                      {/* FAST PAYMENT STATUS TOGGLE */}
                      <div className="pt-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Update Payment State</label>
                        <select
                          value={selectedOrder.paymentStatus}
                          onChange={(e) => handleUpdatePaymentStatus(selectedOrder._id, e.target.value)}
                          className="w-full text-[11px] font-bold px-2 py-1.5 rounded-lg border border-slate-200/80 focus:outline-none focus:border-slate-950 bg-slate-50 text-slate-800 cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Fulfillment Status Control Card */}
                  <div className="p-4 rounded-2xl border border-slate-100 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-50 pb-1.5">
                      <Truck className="w-4 h-4 text-slate-500" />
                      Fulfillment Control
                    </div>
                    <div className="text-xs space-y-1.5 text-slate-600 font-semibold">
                      <div className="flex items-center gap-2">
                        Status:
                        <Badge variant={getOrderStatusVariant(selectedOrder.status)}>
                          {selectedOrder.status}
                        </Badge>
                      </div>
                      {/* FULFILLMENT SELECT STATUS DROP DOWN */}
                      <div className="pt-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Update Fulfillment Node</label>
                        <select
                          value={selectedOrder.status}
                          onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value)}
                          className="w-full text-[11px] font-bold px-2 py-1.5 rounded-lg border border-slate-200/80 focus:outline-none focus:border-slate-950 bg-slate-50 text-slate-800 cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="outForDelivery">Out For Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PURCHASE ITEMS TABLE */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Checkout Cart Specifications</h4>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[180px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          <th className="p-3">Item details</th>
                          <th className="p-3 text-right">Unit Price</th>
                          <th className="p-3 text-center">Qty</th>
                          <th className="p-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                        {selectedOrder.orderItems?.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30">
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                {item.thumbnail && (
                                  <img
                                    src={item.thumbnail}
                                    alt={item.name}
                                    className="w-8.5 h-8.5 rounded-lg border border-slate-100 object-cover shrink-0"
                                  />
                                )}
                                <span className="font-bold text-slate-900 truncate max-w-[220px]">{item.name}</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">${item.price.toFixed(2)}</td>
                            <td className="p-3 text-center text-slate-950 font-black">{item.quantity}</td>
                            <td className="p-3 text-right text-slate-900 font-extrabold">${item.subtotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TAX AND CALCULATIONS LIST */}
                <div className="flex justify-between items-start gap-6 pt-4 border-t border-slate-100">
                  {selectedOrder.notes && (
                    <div className="text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100 max-w-[340px] text-slate-500 leading-relaxed font-semibold">
                      <span className="block font-bold text-slate-800 text-[10px] uppercase tracking-wide mb-0.5">Customer checkout notes</span>
                      "{selectedOrder.notes}"
                    </div>
                  )}

                  <div className="w-[280px] ml-auto space-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span>Cart Subtotal</span>
                      <span className="text-slate-900">${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fulfillment Shipping</span>
                      <span className="text-slate-900">${(selectedOrder.shipping || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Tax / VAT</span>
                      <span className="text-slate-900">${(selectedOrder.tax || 0).toFixed(2)}</span>
                    </div>
                    {selectedOrder.discount && selectedOrder.discount > 0 ? (
                      <div className="flex justify-between text-green-600">
                        <span>Coupon Discount</span>
                        <span>-${selectedOrder.discount.toFixed(2)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-sm font-black text-slate-950 border-t border-slate-100 pt-2">
                      <span>Grand Total</span>
                      <span>${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* MODAL BOTTOM BAR */}
                <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-950 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    Close Invoice View
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
