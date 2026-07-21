import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { wishlistService } from "../services/wishlistService";
import { ApiResponse } from "../utils/response";
import { UnauthorizedError, ValidationError } from "../utils/errors";
import mongoose from "mongoose";

export class WishlistController {
  /**
   * Retrieve wishlist for the authenticated user
   */
  async getWishlist(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const wishlist = await wishlistService.getWishlist(userId);
    return ApiResponse.success(res, "Wishlist retrieved successfully", {
      products: wishlist.products || [],
    });
  }

  /**
   * Add a product to the wishlist
   */
  async addProduct(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError("Invalid product ID format");
    }

    const wishlist = await wishlistService.addProduct(userId, productId);
    return ApiResponse.success(res, "Product added to wishlist successfully", {
      products: wishlist.products || [],
    });
  }

  /**
   * Remove a product from the wishlist
   */
  async removeProduct(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError("Invalid product ID format");
    }

    const wishlist = await wishlistService.removeProduct(userId, productId);
    return ApiResponse.success(res, "Product removed from wishlist successfully", {
      products: wishlist.products || [],
    });
  }

  /**
   * Clear all products from the wishlist
   */
  async clearWishlist(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const wishlist = await wishlistService.clearWishlist(userId);
    return ApiResponse.success(res, "Wishlist cleared successfully", {
      products: wishlist.products || [],
    });
  }
}

export const wishlistController = new WishlistController();
