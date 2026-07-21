import mongoose from "mongoose";
import { Order } from "../models/Order";
import { Payment } from "../models/Payment";
import { Product } from "../models/Product";
import { User } from "../models/User";
import { Role } from "../constants/roles";
import { ValidationError } from "../utils/errors";
import { OrderStatus } from "../types/order";
import { PaymentStatus } from "../types/payment";

export class AdminDashboardService {
  /**
   * Helper to parse date filter and return startDate and endDate
   */
  private parseDateFilter(filter: string, customStart?: string, customEnd?: string) {
    const now = new Date();
    let startDate = new Date();
    let endDate = now;

    switch (filter) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case "7days":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(now.getDate() - 30);
        break;
      case "12months":
        startDate.setMonth(now.getMonth() - 12);
        break;
      case "custom":
        if (!customStart) {
          throw new ValidationError("startDate query parameter is required for custom filter");
        }
        startDate = new Date(customStart);
        if (isNaN(startDate.getTime())) {
          throw new ValidationError("Invalid startDate format");
        }
        if (customEnd) {
          endDate = new Date(customEnd);
          if (isNaN(endDate.getTime())) {
            throw new ValidationError("Invalid endDate format");
          }
        }
        break;
      default:
        // Default to last 30 days
        startDate.setDate(now.getDate() - 30);
    }

    return { startDate, endDate };
  }

  /**
   * Helper to generate a continuous series of date strings (YYYY-MM-DD)
   */
  private generateDateSeries(start: Date, end: Date): string[] {
    const series: string[] = [];
    const current = new Date(start);
    // Keep it reasonable to prevent infinite loop or memory blow up
    const maxDays = 366;
    let daysCount = 0;

    while (current <= end && daysCount < maxDays) {
      series.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
      daysCount++;
    }
    return series;
  }

  /**
   * GET /api/admin/dashboard/summary
   * Overall store health and critical operational summary metrics
   */
  async getSummaryMetrics() {
    const [
      revenueAgg,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      totalPayments,
      aovAgg
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amounts.total" } } }
      ]),
      Order.countDocuments(),
      User.countDocuments({ role: Role.CUSTOMER }),
      Product.countDocuments(),
      Order.countDocuments({ status: OrderStatus.PENDING }),
      Order.countDocuments({ status: OrderStatus.DELIVERED }),
      Order.countDocuments({ status: OrderStatus.CANCELLED }),
      Payment.countDocuments(),
      Order.aggregate([
        { $group: { _id: null, avgValue: { $avg: "$total" } } }
      ])
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const averageOrderValue = aovAgg[0]?.avgValue || 0;

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      totalPayments,
      averageOrderValue: Number(averageOrderValue.toFixed(2))
    };
  }

  /**
   * GET /api/admin/dashboard/sales
   * Sales, orders and revenue trends aggregated by date with flexible filters
   */
  async getSalesAnalytics(filter: string, customStart?: string, customEnd?: string) {
    const { startDate, endDate } = this.parseDateFilter(filter, customStart, customEnd);

    // Get order counts and values by day
    const orderStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$total" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get actual captured revenue by day
    const revenueStats = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amounts.total" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format into a continuous date timeline series to prevent graph gaps
    const dateList = this.generateDateSeries(startDate, endDate);
    const statsMap = new Map<string, { sales: number; orders: number; revenue: number }>();
    
    for (const d of dateList) {
      statsMap.set(d, { sales: 0, orders: 0, revenue: 0 });
    }

    for (const stat of orderStats) {
      const d = stat._id;
      if (statsMap.has(d)) {
        const item = statsMap.get(d)!;
        item.sales = stat.sales;
        item.orders = stat.orders;
      } else if (dateList.length > 365) {
        statsMap.set(d, { sales: stat.sales, orders: stat.orders, revenue: 0 });
      }
    }

    for (const stat of revenueStats) {
      const d = stat._id;
      if (statsMap.has(d)) {
        const item = statsMap.get(d)!;
        item.revenue = stat.revenue;
      } else if (dateList.length > 365) {
        if (statsMap.has(d)) {
          statsMap.get(d)!.revenue = stat.revenue;
        } else {
          statsMap.set(d, { sales: 0, orders: 0, revenue: stat.revenue });
        }
      }
    }

    const timeline = Array.from(statsMap.entries()).map(([date, values]) => ({
      date,
      sales: Number(values.sales.toFixed(2)),
      orders: values.orders,
      revenue: Number(values.revenue.toFixed(2))
    }));

    const salesByDay = timeline.map(t => ({ date: t.date, amount: t.sales }));
    const ordersByDay = timeline.map(t => ({ date: t.date, count: t.orders }));
    const revenueByDay = timeline.map(t => ({ date: t.date, amount: t.revenue }));

    return {
      filter,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      timeline,
      salesByDay,
      ordersByDay,
      revenueByDay
    };
  }

  /**
   * GET /api/admin/dashboard/revenue
   * High-fidelity revenue breakdown by provider, payment methods, refunds and transactions
   */
  async getRevenueAnalytics() {
    const [
      revenueAgg,
      revenueByMethod,
      revenueByProvider,
      refundSummary,
      paymentStatuses,
      recentPayments
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amounts.total" } } }
      ]),
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: "$method", totalRevenue: { $sum: "$amounts.total" }, count: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: "$provider", totalRevenue: { $sum: "$amounts.total" }, count: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { $match: { status: "refunded" } },
        { $group: { _id: null, totalRefunded: { $sum: "$refundAmount" }, count: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, totalAmount: { $sum: "$amounts.total" } } }
      ]),
      Payment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "firstName lastName email")
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const totalRefunded = refundSummary[0]?.totalRefunded || 0;
    const refundCount = refundSummary[0]?.count || 0;

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      revenueByMethod: revenueByMethod.map(rm => ({
        method: rm._id,
        totalRevenue: Number(rm.totalRevenue.toFixed(2)),
        count: rm.count
      })),
      revenueByProvider: revenueByProvider.map(rp => ({
        provider: rp._id,
        totalRevenue: Number(rp.totalRevenue.toFixed(2)),
        count: rp.count
      })),
      refundSummary: {
        totalRefunded: Number(totalRefunded.toFixed(2)),
        count: refundCount
      },
      paymentStatusBreakdown: paymentStatuses.map(ps => ({
        status: ps._id,
        count: ps.count,
        totalAmount: Number(ps.totalAmount.toFixed(2))
      })),
      recentTransactions: recentPayments.map(p => ({
        paymentId: p._id,
        user: p.user ? {
          name: `${(p.user as any).firstName} ${(p.user as any).lastName}`,
          email: (p.user as any).email
        } : null,
        provider: p.provider,
        transactionId: p.transactionId,
        amount: p.amounts.total,
        status: p.status,
        method: p.method,
        createdAt: p.createdAt
      }))
    };
  }

  /**
   * GET /api/admin/dashboard/orders
   * High-fidelity orders tracking by delivery and payment statuses
   */
  async getOrderAnalytics() {
    const [
      ordersByStatus,
      ordersByPaymentStatus,
      ordersByPaymentMethod,
      recentOrders
    ] = await Promise.all([
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, totalValue: { $sum: "$total" } } }
      ]),
      Order.aggregate([
        { $group: { _id: "$paymentStatus", count: { $sum: 1 }, totalValue: { $sum: "$total" } } }
      ]),
      Order.aggregate([
        { $group: { _id: "$paymentMethod", count: { $sum: 1 }, totalValue: { $sum: "$total" } } }
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "firstName lastName email")
    ]);

    // Ensure all mandatory statuses are returned
    const statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    const statusMap = new Map(ordersByStatus.map(s => [s._id, { count: s.count, totalValue: s.totalValue }]));

    const formattedOrdersByStatus = statuses.map(status => ({
      status,
      count: statusMap.get(status)?.count || 0,
      totalValue: Number((statusMap.get(status)?.totalValue || 0).toFixed(2))
    }));

    return {
      ordersByStatus: formattedOrdersByStatus,
      ordersByPaymentStatus: ordersByPaymentStatus.map(ps => ({
        status: ps._id,
        count: ps.count,
        totalValue: Number(ps.totalValue.toFixed(2))
      })),
      ordersByPaymentMethod: ordersByPaymentMethod.map(pm => ({
        method: pm._id,
        count: pm.count,
        totalValue: Number(pm.totalValue.toFixed(2))
      })),
      recentOrders: recentOrders.map(o => ({
        orderId: o._id,
        orderNumber: o.orderNumber,
        user: o.user ? {
          name: `${(o.user as any).firstName} ${(o.user as any).lastName}`,
          email: (o.user as any).email
        } : null,
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt
      }))
    };
  }

  /**
   * GET /api/admin/dashboard/products
   * Comprehensive product intelligence, stock health, categories, and best sellers
   */
  async getProductAnalytics() {
    const [
      bestSellingProducts,
      lowStockProducts,
      outOfStockProducts,
      topCategories,
      recentlyAddedProducts
    ] = await Promise.all([
      // Best sellers
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $unwind: "$orderItems" },
        {
          $group: {
            _id: "$orderItems.product",
            name: { $first: "$orderItems.name" },
            thumbnail: { $first: "$orderItems.thumbnail" },
            totalSold: { $sum: "$orderItems.quantity" },
            totalRevenue: { $sum: "$orderItems.subtotal" }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 }
      ]),
      // Low stock (stock between 1 and 10)
      Product.find({ stock: { $gt: 0, $lte: 10 }, isActive: true })
        .sort({ stock: 1 })
        .limit(10)
        .populate("category", "name slug"),
      // Out of stock (stock is exactly 0)
      Product.find({ stock: 0, isActive: true })
        .sort({ name: 1 })
        .limit(10)
        .populate("category", "name slug"),
      // Top categories aggregation
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $unwind: "$orderItems" },
        {
          $lookup: {
            from: "products",
            localField: "orderItems.product",
            foreignField: "_id",
            as: "productInfo"
          }
        },
        { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "categories",
            localField: "productInfo.category",
            foreignField: "_id",
            as: "categoryInfo"
          }
        },
        { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$productInfo.category",
            categoryName: { $first: "$categoryInfo.name" },
            totalSold: { $sum: "$orderItems.quantity" },
            totalRevenue: { $sum: "$orderItems.subtotal" },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]),
      // Recently added
      Product.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("category", "name slug")
    ]);

    const formattedTopCategories = topCategories.map(tc => ({
      categoryId: tc._id || "uncategorized",
      categoryName: tc.categoryName || "Uncategorized",
      totalSold: tc.totalSold,
      totalRevenue: Number(tc.totalRevenue.toFixed(2)),
      orderCount: tc.orderCount
    }));

    return {
      bestSellingProducts: bestSellingProducts.map(bp => ({
        productId: bp._id,
        name: bp.name,
        thumbnail: bp.thumbnail,
        totalSold: bp.totalSold,
        totalRevenue: Number(bp.totalRevenue.toFixed(2))
      })),
      lowStockProducts: lowStockProducts.map(p => ({
        productId: p._id,
        name: p.name,
        stock: p.stock,
        price: p.price,
        category: p.category ? (p.category as any).name : null,
        thumbnail: p.thumbnail
      })),
      outOfStockProducts: outOfStockProducts.map(p => ({
        productId: p._id,
        name: p.name,
        stock: p.stock,
        price: p.price,
        category: p.category ? (p.category as any).name : null,
        thumbnail: p.thumbnail
      })),
      topCategories: formattedTopCategories,
      recentlyAddedProducts: recentlyAddedProducts.map(p => ({
        productId: p._id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        category: p.category ? (p.category as any).name : null,
        thumbnail: p.thumbnail,
        createdAt: p.createdAt
      }))
    };
  }

  /**
   * GET /api/admin/dashboard/users
   * Detailed cohort and customer metrics (new users, returning rates, top spenders)
   */
  async getCustomerAnalytics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      newUsers,
      returningCustomers,
      topCustomers
    ] = await Promise.all([
      User.countDocuments({ role: Role.CUSTOMER }),
      User.countDocuments({ role: Role.CUSTOMER, createdAt: { $gte: thirtyDaysAgo } }),
      Order.aggregate([
        { $group: { _id: "$user", orderCount: { $sum: 1 } } },
        { $match: { orderCount: { $gt: 1 } } },
        { $count: "count" }
      ]),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: "$user",
            totalSpent: { $sum: "$total" },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userInfo"
          }
        },
        { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } }
      ])
    ]);

    const returningCustomersCount = returningCustomers[0]?.count || 0;

    return {
      totalRegisteredUsers: totalUsers,
      newUsers,
      returningCustomers: returningCustomersCount,
      topCustomers: topCustomers.map(tc => ({
        userId: tc._id,
        totalSpent: Number(tc.totalSpent.toFixed(2)),
        orderCount: tc.orderCount,
        name: tc.userInfo ? `${tc.userInfo.firstName} ${tc.userInfo.lastName}` : "Unknown User",
        email: tc.userInfo?.email || "Unknown Email",
        avatar: tc.userInfo?.avatar || ""
      }))
    };
  }
}

export const adminDashboardService = new AdminDashboardService();
