import { wishlistRepository } from "../repositories/wishlistRepository";
import { productRepository } from "../repositories/productRepository";
import { ValidationError, NotFoundError } from "../utils/errors";
import mongoose from "mongoose";

export class WishlistService {
  /**
   * Retrieve active wishlist for a user.
   */
  async getWishlist(userId: string): Promise<any> {
    if (!userId) {
      throw new ValidationError("User ID is required to get a wishlist");
    }
    return wishlistRepository.getWishlist(userId);
  }

  /**
   * Add a product to the user's wishlist.
   */
  async addProduct(userId: string, productId: string): Promise<any> {
    if (!userId) {
      throw new ValidationError("User ID is required to add product to wishlist");
    }
    if (!productId) {
      throw new ValidationError("Product ID is required to add product to wishlist");
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError("Invalid product ID format");
    }

    // 1. Verify product exists
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} does not exist`);
    }

    // 2. Prevent duplicates
    const wishlist = await wishlistRepository.getWishlist(userId);
    const isDuplicate = wishlist.products.some((prod: any) => {
      const prodId = prod && typeof prod === "object" ? (prod._id || prod.id) : prod;
      return String(prodId) === String(productId);
    });

    if (isDuplicate) {
      throw new ValidationError("Product already exists in the wishlist");
    }

    return wishlistRepository.addProduct(userId, productId);
  }

  /**
   * Remove a product from the user's wishlist.
   */
  async removeProduct(userId: string, productId: string): Promise<any> {
    if (!userId) {
      throw new ValidationError("User ID is required to remove product from wishlist");
    }
    if (!productId) {
      throw new ValidationError("Product ID is required to remove product from wishlist");
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError("Invalid product ID format");
    }
    return wishlistRepository.removeProduct(userId, productId);
  }

  /**
   * Clear all products from the user's wishlist.
   */
  async clearWishlist(userId: string): Promise<any> {
    if (!userId) {
      throw new ValidationError("User ID is required to clear the wishlist");
    }
    return wishlistRepository.clearWishlist(userId);
  }
}

export const wishlistService = new WishlistService();
