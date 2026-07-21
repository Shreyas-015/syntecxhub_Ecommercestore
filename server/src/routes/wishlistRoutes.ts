import { Router } from "express";
import { wishlistController } from "../controllers/wishlistController";
import { verifyToken } from "../middleware/authMiddleware";
import { asyncHandler } from "../middleware/errorMiddleware";

const router = Router();

// Every wishlist endpoint is protected with verifyToken
router.use(verifyToken as any);

// GET /api/wishlist
router.get("/", asyncHandler(wishlistController.getWishlist));

// POST /api/wishlist/:productId
router.post("/:productId", asyncHandler(wishlistController.addProduct));

// DELETE /api/wishlist/:productId
router.delete("/:productId", asyncHandler(wishlistController.removeProduct));

// DELETE /api/wishlist
router.delete("/", asyncHandler(wishlistController.clearWishlist));

export default router;
