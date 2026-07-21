import { Router } from "express";
import { authController } from "../controllers/authController";
import { verifyToken } from "../middleware/authMiddleware";
import { validate } from "../middleware/validationMiddleware";
import { asyncHandler } from "../middleware/errorMiddleware";
import { 
  registerSchema, 
  loginSchema, 
  updateProfileSchema, 
  updatePasswordSchema 
} from "../validators/authValidator";

const router = Router();

// Public routes
router.post("/register", validate(registerSchema), asyncHandler(authController.register));
router.post("/login", validate(loginSchema), asyncHandler(authController.login));
router.post("/logout", asyncHandler(authController.logout));
router.post("/refresh", asyncHandler(authController.refresh));

// Protected routes
router.get("/me", verifyToken, asyncHandler(authController.getMe));
router.put("/profile", verifyToken, validate(updateProfileSchema), asyncHandler(authController.updateProfile));
router.put("/password", verifyToken, validate(updatePasswordSchema), asyncHandler(authController.updatePassword));

export default router;
