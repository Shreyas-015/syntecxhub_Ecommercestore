import { Router } from "express";
import { orderController } from "../controllers/orderController";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware";
import { asyncHandler } from "../middleware/errorMiddleware";

const router = Router();

// Protect all admin order routes with JWT token and administrator role check
router.use(verifyToken as any);
router.use(verifyAdmin as any);

// GET /api/admin/orders
router.get("/", asyncHandler(orderController.adminGetOrders));

// GET /api/admin/orders/:id
router.get("/:id", asyncHandler(orderController.adminGetOrderById));

// PATCH /api/admin/orders/:id/status
router.patch("/:id/status", asyncHandler(orderController.adminUpdateStatus));

// PATCH /api/admin/orders/:id/payment-status
router.patch("/:id/payment-status", asyncHandler(orderController.adminUpdatePaymentStatus));

export default router;
