import { Router } from "express";
import { cartController } from "../controllers/cartController";
import { verifyToken } from "../middleware/authMiddleware";
import { validate } from "../middleware/validationMiddleware";
import { asyncHandler } from "../middleware/errorMiddleware";
import { addToCartSchema, updateCartItemSchema } from "../validators/cartValidator";

const router = Router();

// Every cart endpoint is protected with verifyToken
router.use(verifyToken as any);

// GET /api/cart
router.get("/", asyncHandler(cartController.getCart));

// POST /api/cart/items
router.post("/items", validate(addToCartSchema), asyncHandler(cartController.addItem));

// PUT /api/cart/items/:productId
router.put("/items/:productId", validate(updateCartItemSchema), asyncHandler(cartController.updateQuantity));

// POST /api/cart/items/:productId/save-for-later
router.post("/items/:productId/save-for-later", asyncHandler(cartController.moveToSaveForLater));

// POST /api/cart/save-for-later/:productId/move-to-cart
router.post("/save-for-later/:productId/move-to-cart", asyncHandler(cartController.moveToCart));

// DELETE /api/cart/save-for-later/:productId
router.delete("/save-for-later/:productId", asyncHandler(cartController.removeItemFromSaveForLater));

// POST /api/cart/merge
router.post("/merge", asyncHandler(cartController.mergeCart));

// DELETE /api/cart/items/:productId
router.delete("/items/:productId", asyncHandler(cartController.removeItem));

// DELETE /api/cart
router.delete("/", asyncHandler(cartController.clearCart));

export default router;
