import { Router } from "express";
import { orderController } from "../controllers/orderController";
import { paymentController } from "../controllers/paymentController";
import { verifyToken } from "../middleware/authMiddleware";
import { validate } from "../middleware/validationMiddleware";
import { asyncHandler } from "../middleware/errorMiddleware";
import { checkoutSchema } from "../validators/orderValidator";

const router = Router();

// Protect all order routes
router.use(verifyToken as any);

// POST /api/orders/checkout
router.post("/checkout", validate(checkoutSchema), asyncHandler(orderController.checkout));

// GET /api/orders
router.get("/", asyncHandler(orderController.getOrders));

// GET /api/orders/:orderId/payment
router.get("/:orderId/payment", asyncHandler(paymentController.getPaymentByOrder));

// GET /api/orders/:id
router.get("/:id", asyncHandler(orderController.getOrderById));

// PATCH /api/orders/:id/cancel
router.patch("/:id/cancel", asyncHandler(orderController.cancel));

// GET /api/orders/:id/tracking
router.get("/:id/tracking", asyncHandler(orderController.getTracking));

// GET /api/orders/:id/invoice
router.get("/:id/invoice", asyncHandler(orderController.getInvoice));

// POST /api/orders/:id/return
router.post("/:id/return", asyncHandler(orderController.requestReturn));

export default router;
