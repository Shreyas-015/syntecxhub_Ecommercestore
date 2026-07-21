import { Router } from "express";
import { adminDashboardController } from "../controllers/adminDashboardController";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware";
import { asyncHandler } from "../middleware/errorMiddleware";

const router = Router();

// Protect all dashboard analytics routes with JWT token and administrator check
router.use(verifyToken as any);
router.use(verifyAdmin as any);

// GET /api/admin/dashboard/summary
router.get("/summary", asyncHandler(adminDashboardController.getSummaryMetrics));

// GET /api/admin/dashboard/sales
router.get("/sales", asyncHandler(adminDashboardController.getSalesAnalytics));

// GET /api/admin/dashboard/revenue
router.get("/revenue", asyncHandler(adminDashboardController.getRevenueAnalytics));

// GET /api/admin/dashboard/orders
router.get("/orders", asyncHandler(adminDashboardController.getOrderAnalytics));

// GET /api/admin/dashboard/products
router.get("/products", asyncHandler(adminDashboardController.getProductAnalytics));

// GET /api/admin/dashboard/users
router.get("/users", asyncHandler(adminDashboardController.getCustomerAnalytics));

export default router;
