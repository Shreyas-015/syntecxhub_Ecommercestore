import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { cartService } from "../services/cartService";
import { ApiResponse } from "../utils/response";
import { UnauthorizedError, ValidationError } from "../utils/errors";
import mongoose from "mongoose";

export class CartController {
  /**
   * Retrieve active cart for the authenticated user
   */
  async getCart(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const cart = await cartService.getCartByUser(userId);
    return ApiResponse.success(res, "Cart retrieved successfully", {
      items: cart.items || [],
      savedForLater: cart.savedForLater || [],
      totalItems: cart.totalItems || 0,
      subtotal: cart.subtotal || 0,
    });
  }

  /**
   * Add a product to the cart
   */
  async addItem(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { productId, quantity } = req.body;
    const cart = await cartService.addItem(userId, productId, quantity);
    return ApiResponse.success(res, "Product added to cart successfully", {
      items: cart.items || [],
      savedForLater: cart.savedForLater || [],
      totalItems: cart.totalItems || 0,
      subtotal: cart.subtotal || 0,
    });
  }

  /**
   * Update the quantity of a product in the cart
   */
  async updateQuantity(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError("Invalid product ID format");
    }

    const cart = await cartService.updateQuantity(userId, productId, quantity);
    return ApiResponse.success(res, "Cart quantity updated successfully", {
      items: cart.items || [],
      savedForLater: cart.savedForLater || [],
      totalItems: cart.totalItems || 0,
      subtotal: cart.subtotal || 0,
    });
  }

  /**
   * Remove a product from the cart
   */
  async removeItem(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError("Invalid product ID format");
    }

    const cart = await cartService.removeItem(userId, productId);
    return ApiResponse.success(res, "Product removed from cart successfully", {
      items: cart.items || [],
      savedForLater: cart.savedForLater || [],
      totalItems: cart.totalItems || 0,
      subtotal: cart.subtotal || 0,
    });
  }

  /**
   * Clear all items from the cart
   */
  async clearCart(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const cart = await cartService.clearCart(userId);
    return ApiResponse.success(res, "Cart cleared successfully", {
      items: cart.items || [],
      savedForLater: cart.savedForLater || [],
      totalItems: cart.totalItems || 0,
      subtotal: cart.subtotal || 0,
    });
  }

  /**
   * Move item to Save For Later
   */
  async moveToSaveForLater(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError("Invalid product ID format");
    }

    const cart = await cartService.moveToSaveForLater(userId, productId);
    return ApiResponse.success(res, "Item moved to Save For Later successfully", {
      items: cart.items || [],
      savedForLater: cart.savedForLater || [],
      totalItems: cart.totalItems || 0,
      subtotal: cart.subtotal || 0,
    });
  }

  /**
   * Move item from Save For Later back to active Cart
   */
  async moveToCart(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError("Invalid product ID format");
    }

    const cart = await cartService.moveToCart(userId, productId);
    return ApiResponse.success(res, "Item moved to active cart successfully", {
      items: cart.items || [],
      savedForLater: cart.savedForLater || [],
      totalItems: cart.totalItems || 0,
      subtotal: cart.subtotal || 0,
    });
  }

  /**
   * Remove item from Save For Later list entirely
   */
  async removeItemFromSaveForLater(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError("Invalid product ID format");
    }

    const cart = await cartService.removeItemFromSaveForLater(userId, productId);
    return ApiResponse.success(res, "Item removed from Save For Later successfully", {
      items: cart.items || [],
      savedForLater: cart.savedForLater || [],
      totalItems: cart.totalItems || 0,
      subtotal: cart.subtotal || 0,
    });
  }

  /**
   * Merge guest items into active user database cart
   */
  async mergeCart(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { items: guestItems } = req.body;
    const cart = await cartService.mergeCart(userId, guestItems || []);
    return ApiResponse.success(res, "Guest cart items merged successfully", {
      items: cart.items || [],
      savedForLater: cart.savedForLater || [],
      totalItems: cart.totalItems || 0,
      subtotal: cart.subtotal || 0,
    });
  }
}

export const cartController = new CartController();
