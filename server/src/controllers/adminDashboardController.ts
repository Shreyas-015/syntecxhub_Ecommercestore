import { Request, Response } from "express";
import { adminDashboardService } from "../services/adminDashboardService";
import { ApiResponse } from "../utils/response";

export class AdminDashboardController {
  /**
   * GET /api/admin/dashboard/summary
   */
  async getSummaryMetrics(req: Request, res: Response) {
    const summary = await adminDashboardService.getSummaryMetrics();
    return ApiResponse.success(res, "Admin dashboard summary metrics retrieved successfully", summary);
  }

  /**
   * GET /api/admin/dashboard/sales
   */
  async getSalesAnalytics(req: Request, res: Response) {
    const { filter = "30days", startDate, endDate } = req.query;
    
    const salesData = await adminDashboardService.getSalesAnalytics(
      filter as string,
      startDate as string | undefined,
      endDate as string | undefined
    );
    
    return ApiResponse.success(res, "Admin dashboard sales analytics retrieved successfully", salesData);
  }

  /**
   * GET /api/admin/dashboard/revenue
   */
  async getRevenueAnalytics(req: Request, res: Response) {
    const revenueData = await adminDashboardService.getRevenueAnalytics();
    return ApiResponse.success(res, "Admin dashboard revenue analytics retrieved successfully", revenueData);
  }

  /**
   * GET /api/admin/dashboard/orders
   */
  async getOrderAnalytics(req: Request, res: Response) {
    const orderData = await adminDashboardService.getOrderAnalytics();
    return ApiResponse.success(res, "Admin dashboard order analytics retrieved successfully", orderData);
  }

  /**
   * GET /api/admin/dashboard/products
   */
  async getProductAnalytics(req: Request, res: Response) {
    const productData = await adminDashboardService.getProductAnalytics();
    return ApiResponse.success(res, "Admin dashboard product analytics retrieved successfully", productData);
  }

  /**
   * GET /api/admin/dashboard/users
   */
  async getCustomerAnalytics(req: Request, res: Response) {
    const customerData = await adminDashboardService.getCustomerAnalytics();
    return ApiResponse.success(res, "Admin dashboard customer analytics retrieved successfully", customerData);
  }
}

export const adminDashboardController = new AdminDashboardController();
