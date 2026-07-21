import mongoose from "mongoose";
import { Wishlist, IWishlist } from "../models/Wishlist";
import { Product } from "../models/Product";
import { mockProducts } from "./productRepository";

export const mockWishlists = new Map<string, any>();

export class InMemoryWishlist {
  id: string;
  _id: string;
  user: string;
  products: string[];
  createdAt: Date;
  updatedAt: Date;

  constructor(userId: string) {
    this.id = Math.random().toString(36).substring(2, 15);
    this._id = this.id;
    this.user = userId;
    this.products = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

export class WishlistRepository {
  private isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Retrieve wishlist by userId, auto-creating if not found
   */
  async getWishlist(userId: string): Promise<any> {
    if (!this.isConnected()) {
      let mockWish = mockWishlists.get(userId);
      if (!mockWish) {
        mockWish = new InMemoryWishlist(userId);
        mockWishlists.set(userId, mockWish);
      }
      return mockWish;
    }

    let wishlist = await Wishlist.findOne({ user: userId }).populate("products", "name thumbnail price discountPrice stock slug");
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
      await wishlist.save();
      // Refetch to populate correctly
      wishlist = await Wishlist.findOne({ user: userId }).populate("products", "name thumbnail price discountPrice stock slug");
    }
    return wishlist;
  }

  /**
   * Add a product to the user's wishlist
   */
  async addProduct(userId: string, productId: string): Promise<any> {
    if (!productId) {
      throw new Error("Product ID is required.");
    }

    if (!this.isConnected()) {
      const productExists = mockProducts.has(productId);
      if (!productExists) {
        throw new Error(`Product with ID ${productId} does not exist.`);
      }

      const wishlist = await this.getWishlist(userId);

      // Prevent duplicate products
      const isDuplicate = wishlist.products.some((prod: any) => String(prod) === String(productId));
      if (isDuplicate) {
        throw new Error("Product already exists in the wishlist.");
      }

      wishlist.products.push(productId);
      wishlist.updatedAt = new Date();
      mockWishlists.set(userId, wishlist);
      return wishlist;
    } else {
      const productExists = await Product.exists({ _id: productId });
      if (!productExists) {
        throw new Error(`Product with ID ${productId} does not exist.`);
      }

      const wishlist = await this.getWishlist(userId);

      // Prevent duplicate products
      const isDuplicate = wishlist.products.some((prod: any) => {
        const prodId = prod && typeof prod === "object" ? prod._id : prod;
        return String(prodId) === String(productId);
      });
      if (isDuplicate) {
        throw new Error("Product already exists in the wishlist.");
      }

      wishlist.products.push(new mongoose.Types.ObjectId(productId) as any);
      await wishlist.save();
      return this.getWishlist(userId);
    }
  }

  /**
   * Remove a product from the user's wishlist
   */
  async removeProduct(userId: string, productId: string): Promise<any> {
    if (!this.isConnected()) {
      const wishlist = await this.getWishlist(userId);
      wishlist.products = wishlist.products.filter((prod: any) => String(prod) !== String(productId));
      wishlist.updatedAt = new Date();
      mockWishlists.set(userId, wishlist);
      return wishlist;
    } else {
      const wishlist = await this.getWishlist(userId);
      wishlist.products = wishlist.products.filter((prod: any) => {
        const prodId = prod && typeof prod === "object" ? prod._id : prod;
        return String(prodId) !== String(productId);
      });
      await wishlist.save();
      return this.getWishlist(userId);
    }
  }

  /**
   * Clear all products from the user's wishlist
   */
  async clearWishlist(userId: string): Promise<any> {
    if (!this.isConnected()) {
      const wishlist = await this.getWishlist(userId);
      wishlist.products = [];
      wishlist.updatedAt = new Date();
      mockWishlists.set(userId, wishlist);
      return wishlist;
    } else {
      const wishlist = await this.getWishlist(userId);
      wishlist.products = [];
      await wishlist.save();
      return this.getWishlist(userId);
    }
  }
}

export const wishlistRepository = new WishlistRepository();
