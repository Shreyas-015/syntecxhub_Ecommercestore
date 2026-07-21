import { Router } from "express";
import { categoryController } from "../controllers/categoryController";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware";
import { validate } from "../middleware/validationMiddleware";
import { asyncHandler } from "../middleware/errorMiddleware";
import { createCategorySchema, updateCategorySchema } from "../validators/categoryValidator";

const router = Router();

// Public routes
router.get("/", asyncHandler(categoryController.getAllCategories));
router.get("/:id", asyncHandler(categoryController.getCategoryById));

// Admin-only routes
router.post(
  "/",
  verifyToken as any,
  verifyAdmin as any,
  validate(createCategorySchema),
  asyncHandler(categoryController.createCategory)
);

router.put(
  "/:id",
  verifyToken as any,
  verifyAdmin as any,
  validate(updateCategorySchema),
  asyncHandler(categoryController.updateCategory)
);

router.delete(
  "/:id",
  verifyToken as any,
  verifyAdmin as any,
  asyncHandler(categoryController.deleteCategory)
);

export default router;
