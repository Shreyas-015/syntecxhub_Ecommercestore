import { Router } from "express";
import { adminUserController } from "../controllers/adminUserController";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware";
import { asyncHandler } from "../middleware/errorMiddleware";

const router = Router();

// Protect all admin user routes with JWT token and admin role verification
router.use(verifyToken as any);
router.use(verifyAdmin as any);

// GET /api/admin/users
router.get("/", asyncHandler(adminUserController.getAllCustomers));

// GET /api/admin/users/:id
router.get("/:id", asyncHandler(adminUserController.getCustomerById));

// PATCH /api/admin/users/:id/status
router.patch("/:id/status", asyncHandler(adminUserController.toggleUserStatus));

// POST /api/admin/users/:id/reset-password
router.post("/:id/reset-password", asyncHandler(adminUserController.resetUserPassword));

export default router;
