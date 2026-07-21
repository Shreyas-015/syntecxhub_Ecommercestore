import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Layers,
  Activity,
  Calendar,
  ArrowUpRight,
  Eye,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Inbox,
  ShieldAlert,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { Badge } from "../components/common/Badge";
import { Skeleton } from "../components/common/Skeleton";
import {
  adminDashboardService,
  SummaryMetrics,
  SalesAnalytics,
  RevenueAnalytics,
  OrderAnalytics,
  ProductAnalytics,
  CustomerAnalytics,
} from "../services/adminDashboardService";

export const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();

  // Filters State
  const [filter, setFilter] = useState<string>("30days");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [showCustomDates, setShowCustomDates] = useState<boolean>(false);

  // Data Loading States
  const [loading, setLoading] = useState<{
    summary: boolean;
    sales: boolean;
    revenue: boolean;
    orders: boolean;
    products: boolean;
    customers: boolean;
  }>({
    summary: true,
    sales: true,
    revenue: true,
    orders: true,
    products: true,
    customers: true,
  });

  // Data Storage States
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [sales, setSales] = useState<SalesAnalytics | null>(null);
  const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null);
  const [orders, setOrders] = useState<OrderAnalytics | null>(null);
  const [products, setProducts] = useState<ProductAnalytics | null>(null);
  const [customers, setCustomers] = useState<CustomerAnalytics | null>(null);

  // Errors state
  const [error, setError] = useState<string | null>(null);

  // Fetch independent metadata endpoints once on mount
  const fetchMetadata = async () => {
    setLoading((prev) => ({
      ...prev,
      summary: true,
      revenue: true,
      orders: true,
      products: true,
      customers: true,
    }));

    try {
      const [sumData, revData, ordData, prodData, custData] = await Promise.all([
        adminDashboardService.getSummary(),
        adminDashboardService.getRevenue(),
        adminDashboardService.getOrders(),
        adminDashboardService.getProducts(),
        adminDashboardService.getCustomers(),
      ]);

      setSummary(sumData);
      setRevenue(revData);
      setOrders(ordData);
      setProducts(prodData);
      setCustomers(custData);

      setError(null);
    } catch (err: any) {
      console.error("Error loading administrative metadata:", err);
      setError(err.message || "Failed to load dashboard statistics.");
      showToast(err.message || "Error synchronizing database metrics", "error");
    } finally {
      setLoading((prev) => ({
        ...prev,
        summary: false,
        revenue: false,
        orders: false,
        products: false,
        customers: false,
      }));
    }
  };

  // Fetch filter-dependent sales trend analytics
  const fetchSalesTrends = async (selectedFilter: string, start?: string, end?: string) => {
    setLoading((prev) => ({ ...prev, sales: true }));
    try {
      const salesData = await adminDashboardService.getSales(selectedFilter, start, end);
      setSales(salesData);
    } catch (err: any) {
      console.error("Error loading sales trends:", err);
      showToast(err.message || "Error loading sales analytics trend", "error");
    } finally {
      setLoading((prev) => ({ ...prev, sales: false }));
    }
  };

  // Run on mount
  useEffect(() => {
    fetchMetadata();
    fetchSalesTrends(filter);
  }, []);

  // Sync on filter change
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    if (newFilter === "custom") {
      setShowCustomDates(true);
    } else {
      setShowCustomDates(false);
      fetchSalesTrends(newFilter);
      showToast(`Refreshed analytics filter: ${formatFilterLabel(newFilter)}`, "success");
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart) {
      showToast("Please choose a valid starting date limit", "error");
      return;
    }
    fetchSalesTrends("custom", customStart, customEnd || undefined);
    showToast("Refreshed with custom date boundary", "success");
  };

  const formatFilterLabel = (f: string) => {
    switch (f) {
      case "today":
        return "Today";
      case "7days":
        return "Last 7 Days";
      case "30days":
        return "Last 30 Days";
      case "12months":
        return "Last 12 Months";
      case "custom":
        return "Custom Range";
      default:
        return f;
    }
  };

  const refreshAll = () => {
    fetchMetadata();
    fetchSalesTrends(filter, customStart || undefined, customEnd || undefined);
    showToast("Full dashboard synched with database.", "success");
  };

  // PIE CHART CONFIGURATION
  const COLORS = {
    pending: "#f59e0b",
    confirmed: "#0ea5e9",
    processing: "#6366f1",
    shipped: "#3b82f6",
    delivered: "#10b981",
    cancelled: "#f43f5e",
  };

  const orderPieData = useMemo(() => {
    if (!orders?.ordersByStatus) return [];
    return orders.ordersByStatus.map((o) => ({
      name: o.status.charAt(0).toUpperCase() + o.status.slice(1),
      value: o.count,
      status: o.status,
    }));
  }, [orders]);

  // STATUS BADGES IN RECENT ORDERS
  const getStatusBadge = (status: string, type: "order" | "payment") => {
    const cleanStatus = status.toLowerCase();
    if (type === "order") {
      switch (cleanStatus) {
        case "delivered":
          return <Badge variant="success">Delivered</Badge>;
        case "pending":
          return <Badge variant="warning">Pending</Badge>;
        case "cancelled":
          return <Badge variant="danger">Cancelled</Badge>;
        case "shipped":
          return <Badge variant="primary">Shipped</Badge>;
        case "processing":
          return <Badge variant="primary">Processing</Badge>;
        case "confirmed":
          return <Badge variant="primary">Confirmed</Badge>;
        default:
          return <Badge variant="neutral">{status}</Badge>;
      }
    } else {
      switch (cleanStatus) {
        case "paid":
          return <Badge variant="success">Paid</Badge>;
        case "unpaid":
        case "pending":
          return <Badge variant="warning">Pending</Badge>;
        case "failed":
        case "cancelled":
          return <Badge variant="danger">Failed</Badge>;
        case "refunded":
          return <Badge variant="neutral">Refunded</Badge>;
        default:
          return <Badge variant="neutral">{status}</Badge>;
      }
    }
  };

  return (
    <div className="space-y-8" id="admin-dashboard-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Store Performance
            <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Real-time analytics, inventory thresholds, customer retention cohorts, and transactional summaries.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <button
            onClick={refreshAll}
            disabled={Object.values(loading).some(Boolean)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Reload Data"
            aria-label="Refresh Dashboard Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${Object.values(loading).some(Boolean) ? "animate-spin" : ""}`} />
          </button>

          {/* DATE SELECTOR DROPDOWN */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {["today", "7days", "30days", "12months", "custom"].map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filter === f
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {formatFilterLabel(f)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CUSTOM DATE FORM RANGE */}
      {showCustomDates && (
        <form
          onSubmit={handleCustomSubmit}
          className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-end gap-4 max-w-xl animate-fade-in"
        >
          <div className="flex-1 w-full space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Start Date</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
            />
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">End Date (Optional)</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold bg-slate-950 text-white rounded-xl hover:bg-slate-900 active:scale-98 transition-all"
          >
            Apply Range
          </button>
        </form>
      )}

      {/* ERROR HANDLER VIEW */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3.5 text-red-700">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold">Dashboard Synchronization Failure</h3>
            <p className="text-xs text-red-600/90 mt-1">{error}</p>
            <button
              onClick={refreshAll}
              className="text-xs font-bold underline mt-2 text-red-700 hover:text-red-900 block"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* KPI METRICS COUNT GRIDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-metrics-grid">
        {/* KPI CARD 1: REVENUE */}
        {loading.summary ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-blue-600" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                ${summary?.totalRevenue?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 font-mono">
                <TrendingUp className="w-3 h-3" />
                +14.2%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Gross earnings captured</span>
          </div>
        )}

        {/* KPI CARD 2: ORDERS */}
        {loading.summary ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-indigo-600" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Orders</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {summary?.totalOrders?.toLocaleString("en-US") || "0"}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 font-mono">
                <TrendingUp className="w-3 h-3" />
                +8.7%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Completed & active pipelines</span>
          </div>
        )}

        {/* KPI CARD 3: CUSTOMERS */}
        {loading.summary ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-emerald-600" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Customers</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {summary?.totalCustomers?.toLocaleString("en-US") || "0"}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 font-mono">
                <TrendingUp className="w-3 h-3" />
                +11.5%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Registered consumer base</span>
          </div>
        )}

        {/* KPI CARD 4: PRODUCTS */}
        {loading.summary ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-amber-600" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Products</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {summary?.totalProducts?.toLocaleString("en-US") || "0"}
              </span>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5 font-mono">
                Stable
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">SKUs managed in catalog</span>
          </div>
        )}

        {/* KPI CARD 5: AVERAGE ORDER VALUE */}
        {loading.summary ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-sky-600" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Avg Order Value</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                ${summary?.averageOrderValue?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 font-mono">
                <TrendingUp className="w-3 h-3" />
                +2.4%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">AOV across order cohort</span>
          </div>
        )}

        {/* KPI CARD 6: PENDING ORDERS */}
        {loading.summary ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-amber-500" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Pending Orders</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {summary?.pendingOrders || "0"}
              </span>
              {summary && summary.pendingOrders > 5 ? (
                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 font-mono">
                  Action required
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400 font-mono">Within SLA</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Awaiting fulfillment queue</span>
          </div>
        )}

        {/* KPI CARD 7: DELIVERED ORDERS */}
        {loading.summary ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-emerald-500" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Delivered Orders</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {summary?.deliveredOrders || "0"}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 font-mono">
                +11.8%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Successfully closed cycles</span>
          </div>
        )}

        {/* KPI CARD 8: CANCELLED ORDERS */}
        {loading.summary ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-rose-500" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Cancelled Orders</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                <ShoppingBag className="w-4 h-4 text-rose-500" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {summary?.cancelledOrders || "0"}
              </span>
              <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5 font-mono">
                -4.2%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Churned/Revoked orders</span>
          </div>
        )}
      </div>

      {/* CHARTS GRAPHICS VIEW SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 1: REVENUE TRENDS LINE CHART */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue Generation Timeline</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Line chart showing captured cash flows in selected filter period.</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 uppercase">Gross Revenue</span>
          </div>

          <div className="h-72">
            {loading.sales ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="h-full w-full rounded-xl" />
              </div>
            ) : sales?.timeline && sales.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sales.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                    labelStyle={{ fontWeight: "bold", fontSize: "11px", color: "#0f172a" }}
                    itemStyle={{ fontSize: "11px", padding: "1px 0" }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Inbox className="w-8 h-8 mb-2" />
                <span className="text-xs font-semibold">No revenue timeline data available for this filter</span>
              </div>
            )}
          </div>
        </div>

        {/* CHART 3: ORDER STATUS PIE DISTRIBUTION */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Order Pipelines</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Distribution of orders grouped by processing stage.</p>
          </div>

          <div className="h-52 relative flex items-center justify-center">
            {loading.orders ? (
              <Skeleton className="h-44 w-44 rounded-full" />
            ) : orderPieData && orderPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {orderPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.status] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                    itemStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <Inbox className="w-8 h-8 mb-2" />
                <span className="text-xs font-semibold">No pipeline statistics</span>
              </div>
            )}
          </div>

          {/* CUSTOM LEGEND */}
          {!loading.orders && orderPieData && orderPieData.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4 border-t border-slate-100 pt-3">
              {orderPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: (COLORS as any)[item.status] || "#94a3b8" }}
                  />
                  <span className="text-[10px] text-slate-600 font-semibold truncate">
                    {item.name}: <span className="text-slate-900 font-bold">{item.value}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 2: SALES VOLUME BAR CHART */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Sales Volume</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Order counts vs gross sales values generated daily.</p>
            </div>
          </div>

          <div className="h-64">
            {loading.sales ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : sales?.timeline && sales.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sales.timeline} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                    itemStyle={{ fontSize: "11px" }}
                  />
                  <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Inbox className="w-8 h-8 mb-2" />
                <span className="text-xs font-semibold">No sales charts available</span>
              </div>
            )}
          </div>
        </div>

        {/* CHART 4: TOP CATEGORIES BAR CHART */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Top Categories</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Highest earning product categories.</p>
            </div>
          </div>

          <div className="h-64">
            {loading.products ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : products?.topCategories && products.topCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={products.topCategories}
                  layout="vertical"
                  margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis dataKey="categoryName" type="category" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                    itemStyle={{ fontSize: "11px" }}
                  />
                  <Bar dataKey="totalRevenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Inbox className="w-8 h-8 mb-2" />
                <span className="text-xs font-semibold">No category rankings available</span>
              </div>
            )}
          </div>
        </div>

        {/* CHART 5: BEST SELLING PRODUCTS CHART */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Product Velocity</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Bestselling items mapped by units sold.</p>
            </div>
          </div>

          <div className="h-64">
            {loading.products ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : products?.bestSellingProducts && products.bestSellingProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={products.bestSellingProducts} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(v) => (v.length > 10 ? `${v.substring(0, 10)}...` : v)} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                    itemStyle={{ fontSize: "11px" }}
                  />
                  <Bar dataKey="totalSold" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Inbox className="w-8 h-8 mb-2" />
                <span className="text-xs font-semibold">No sales velocity recorded</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECENT ORDERS TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Purchase Envelopes</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Real-time record of customer checkouts on the store.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading.orders ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : orders?.recentOrders && orders.recentOrders.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-400 uppercase tracking-widest text-[9px] font-mono">
                  <th className="py-3 px-6">Order Number</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Total Amount</th>
                  <th className="py-3 px-6">Payment</th>
                  <th className="py-3 px-6">Fulfillment</th>
                  <th className="py-3 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.recentOrders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                      {order.orderNumber || "STX-UNK"}
                    </td>
                    <td className="py-3.5 px-6">
                      {order.user ? (
                        <div>
                          <span className="font-semibold text-slate-800 block">{order.user.name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{order.user.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Guest Checkout</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-6">
                      {getStatusBadge(order.paymentStatus, "payment")}
                    </td>
                    <td className="py-3.5 px-6">
                      {getStatusBadge(order.status, "order")}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <Link
                        to={`/orders/${order.orderId}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-950 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <Inbox className="w-8 h-8 mb-2" />
              <span className="text-xs font-semibold">No recent orders registered in the system</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 5: LOW STOCK PRODUCTS MONITOR */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Inventory Warning Board</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Critical alert for items running low or out of stock.</p>
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Action Recommended
            </span>
          </div>

          <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
            {loading.products ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : products &&
              (products.lowStockProducts.length > 0 || products.outOfStockProducts.length > 0) ? (
              <>
                {/* Out of Stock First */}
                {products.outOfStockProducts.map((p) => (
                  <div
                    key={p.productId}
                    className="flex items-center justify-between p-3 rounded-xl border border-red-100 bg-red-50/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {p.thumbnail ? (
                          <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Layers className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900 truncate max-w-44 sm:max-w-64">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">{p.category || "Uncategorized"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="danger" className="text-[9px] uppercase font-bold tracking-wider">
                        Out of stock
                      </Badge>
                      <span className="text-[10px] text-slate-400 block font-bold mt-1">0 units remaining</span>
                    </div>
                  </div>
                ))}

                {/* Low stock */}
                {products.lowStockProducts.map((p) => (
                  <div
                    key={p.productId}
                    className="flex items-center justify-between p-3 rounded-xl border border-amber-100 bg-amber-50/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {p.thumbnail ? (
                          <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Layers className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900 truncate max-w-44 sm:max-w-64">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">{p.category || "Uncategorized"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="warning" className="text-[9px] uppercase font-bold tracking-wider">
                        Low stock
                      </Badge>
                      <span className="text-[10px] text-slate-600 block font-bold mt-1">{p.stock} units left</span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="py-12 text-center text-emerald-600 bg-emerald-50/10 border border-emerald-100 rounded-xl flex flex-col items-center justify-center">
                <Sparkles className="w-8 h-8 mb-2 text-emerald-500 animate-bounce" />
                <span className="text-xs font-semibold">Inventory is perfectly balanced and stocked!</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 6: TOP CUSTOMERS COHORT MONITOR */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Highest Spender Cohorts</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Top customer advocates ranked by aggregate spends.</p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {loading.customers ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : customers?.topCustomers && customers.topCustomers.length > 0 ? (
              customers.topCustomers.map((c, index) => (
                <div
                  key={c.userId}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Number */}
                    <span className="text-xs font-mono font-bold text-slate-400 w-4">{index + 1}</span>

                    {/* Avatar Initials Placeholder */}
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-extrabold text-slate-700 shrink-0 uppercase">
                      {c.name ? c.name.split(" ").map(w => w[0]).join("").substring(0, 2) : "C"}
                    </div>

                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-900 truncate max-w-40 sm:max-w-64">
                        {c.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate font-mono">{c.email}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">${c.totalSpent.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 block font-bold font-mono">{c.orderCount} purchases</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <Inbox className="w-8 h-8 mb-2" />
                <span className="text-xs font-semibold">No spend records on custom database registries</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
