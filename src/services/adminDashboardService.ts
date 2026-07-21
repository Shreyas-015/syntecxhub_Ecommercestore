import api from "../lib/api";

export interface SummaryMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalPayments: number;
  averageOrderValue: number;
}

export interface SalesTimelineItem {
  date: string;
  sales: number;
  orders: number;
  revenue: number;
}

export interface SalesAnalytics {
  filter: string;
  startDate: string;
  endDate: string;
  timeline: SalesTimelineItem[];
  salesByDay: { date: string; amount: number }[];
  ordersByDay: { date: string; count: number }[];
  revenueByDay: { date: string; amount: number }[];
}

export interface RevenueByMethod {
  method: string;
  totalRevenue: number;
  count: number;
}

export interface RevenueByProvider {
  provider: string;
  totalRevenue: number;
  count: number;
}

export interface RefundSummary {
  totalRefunded: number;
  count: number;
}

export interface PaymentStatusBreakdown {
  status: string;
  count: number;
  totalAmount: number;
}

export interface RecentTransaction {
  paymentId: string;
  user: {
    name: string;
    email: string;
  } | null;
  provider: string;
  transactionId: string;
  amount: number;
  status: string;
  method: string;
  createdAt: string;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueByMethod: RevenueByMethod[];
  revenueByProvider: RevenueByProvider[];
  refundSummary: RefundSummary;
  paymentStatusBreakdown: PaymentStatusBreakdown[];
  recentTransactions: RecentTransaction[];
}

export interface OrderStatusStat {
  status: string;
  count: number;
  totalValue: number;
}

export interface OrderPaymentStatusStat {
  status: string;
  count: number;
  totalValue: number;
}

export interface OrderPaymentMethodStat {
  method: string;
  count: number;
  totalValue: number;
}

export interface RecentOrder {
  orderId: string;
  orderNumber: string;
  user: {
    name: string;
    email: string;
  } | null;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface OrderAnalytics {
  ordersByStatus: OrderStatusStat[];
  ordersByPaymentStatus: OrderPaymentStatusStat[];
  ordersByPaymentMethod: OrderPaymentMethodStat[];
  recentOrders: RecentOrder[];
}

export interface BestSellingProduct {
  productId: string;
  name: string;
  thumbnail: string;
  totalSold: number;
  totalRevenue: number;
}

export interface LowStockProduct {
  productId: string;
  name: string;
  stock: number;
  price: number;
  category: string | null;
  thumbnail: string;
}

export interface OutOfStockProduct {
  productId: string;
  name: string;
  stock: number;
  price: number;
  category: string | null;
  thumbnail: string;
}

export interface TopCategory {
  categoryId: string;
  categoryName: string;
  totalSold: number;
  totalRevenue: number;
  orderCount: number;
}

export interface RecentlyAddedProduct {
  productId: string;
  name: string;
  price: number;
  stock: number;
  category: string | null;
  thumbnail: string;
  createdAt: string;
}

export interface ProductAnalytics {
  bestSellingProducts: BestSellingProduct[];
  lowStockProducts: LowStockProduct[];
  outOfStockProducts: OutOfStockProduct[];
  topCategories: TopCategory[];
  recentlyAddedProducts: RecentlyAddedProduct[];
}

export interface TopCustomer {
  userId: string;
  totalSpent: number;
  orderCount: number;
  name: string;
  email: string;
  avatar: string;
}

export interface CustomerAnalytics {
  totalRegisteredUsers: number;
  newUsers: number;
  returningCustomers: number;
  topCustomers: TopCustomer[];
}

export const adminDashboardService = {
  /**
   * Fetch main summary metrics
   */
  async getSummary(): Promise<SummaryMetrics> {
    const res = await api.get("/admin/dashboard/summary");
    return res.data.data;
  },

  /**
   * Fetch sales trends with filtering
   */
  async getSales(filter = "30days", startDate?: string, endDate?: string): Promise<SalesAnalytics> {
    const params: any = { filter };
    if (filter === "custom") {
      params.startDate = startDate;
      params.endDate = endDate;
    }
    const res = await api.get("/admin/dashboard/sales", { params });
    return res.data.data;
  },

  /**
   * Fetch revenue breakdown metrics
   */
  async getRevenue(): Promise<RevenueAnalytics> {
    const res = await api.get("/admin/dashboard/revenue");
    return res.data.data;
  },

  /**
   * Fetch orders aggregated tracking data
   */
  async getOrders(): Promise<OrderAnalytics> {
    const res = await api.get("/admin/dashboard/orders");
    return res.data.data;
  },

  /**
   * Fetch product intelligence and stock status
   */
  async getProducts(): Promise<ProductAnalytics> {
    const res = await api.get("/admin/dashboard/products");
    return res.data.data;
  },

  /**
   * Fetch detailed cohort and customer demographics
   */
  async getCustomers(): Promise<CustomerAnalytics> {
    const res = await api.get("/admin/dashboard/users");
    return res.data.data;
  }
};
