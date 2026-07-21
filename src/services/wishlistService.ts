import api from "../lib/api";
import { mapProduct } from "./productService";
import { Product } from "../types";

export interface FrontendWishlist {
  products: Product[];
}

export const wishlistService = {
  async getWishlist(): Promise<FrontendWishlist> {
    const response = await api.get("/wishlist");
    const { products } = response.data.data;
    return {
      products: (products || []).map(mapProduct),
    };
  },

  async addProduct(productId: string): Promise<FrontendWishlist> {
    const response = await api.post(`/wishlist/${productId}`);
    const { products } = response.data.data;
    return {
      products: (products || []).map(mapProduct),
    };
  },

  async removeProduct(productId: string): Promise<FrontendWishlist> {
    const response = await api.delete(`/wishlist/${productId}`);
    const { products } = response.data.data;
    return {
      products: (products || []).map(mapProduct),
    };
  },

  async clearWishlist(): Promise<FrontendWishlist> {
    const response = await api.delete("/wishlist");
    const { products } = response.data.data;
    return {
      products: (products || []).map(mapProduct),
    };
  },
};
