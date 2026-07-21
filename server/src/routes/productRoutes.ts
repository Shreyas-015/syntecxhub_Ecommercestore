import { Router } from "express";
import { productController } from "../controllers/productController";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware";
import { validate } from "../middleware/validationMiddleware";
import { asyncHandler } from "../middleware/errorMiddleware";
import { createProductSchema, updateProductSchema } from "../validators/productValidator";

const router = Router();

// Public routes
router.get("/", asyncHandler(productController.getAllProducts));
router.get("/featured", asyncHandler(productController.getFeaturedProducts));
router.get("/latest", asyncHandler(productController.getLatestProducts));
router.get("/categories", asyncHandler(productController.getCategoriesWithCounts));
router.get("/:id", asyncHandler(productController.getProductById));

// Admin-only routes
router.post(
  "/",
  verifyToken as any,
  verifyAdmin as any,
  validate(createProductSchema),
  asyncHandler(productController.createProduct)
);

router.put(
  "/:id",
  verifyToken as any,
  verifyAdmin as any,
  validate(updateProductSchema),
  asyncHandler(productController.updateProduct)
);

router.delete(
  "/:id",
  verifyToken as any,
  verifyAdmin as any,
  asyncHandler(productController.deleteProduct)
);

export default router;
