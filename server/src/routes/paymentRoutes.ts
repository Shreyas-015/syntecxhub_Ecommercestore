import { Router } from "express";
import { paymentController } from "../controllers/paymentController";
import { verifyToken } from "../middleware/authMiddleware";
import { asyncHandler } from "../middleware/errorMiddleware";

const router = Router();

// Webhook endpoints (Public - signature verified inside controller)
router.post("/webhooks/stripe", asyncHandler(paymentController.stripeWebhook));
router.post("/webhooks/razorpay", asyncHandler(paymentController.razorpayWebhook));

// Protect all other payment routes
router.use(verifyToken as any);

// GET /api/payments/config
router.get("/config", asyncHandler(paymentController.getPaymentConfig));

// POST /api/payments/create-order
router.post("/create-order", asyncHandler(paymentController.createOrder));

// POST /api/payments/verify
router.post("/verify", asyncHandler(paymentController.verifyPayment));

// POST /api/payments/cod
router.post("/cod", asyncHandler(paymentController.codPayment));

// POST /api/payments/:paymentId/refund
router.post("/:paymentId/refund", asyncHandler(paymentController.refundPayment));

// GET /api/payments/:paymentId/refund-status
router.get("/:paymentId/refund-status", asyncHandler(paymentController.getRefundStatus));

// GET /api/payments/:paymentId
router.get("/:paymentId", asyncHandler(paymentController.getPaymentById));

export default router;
