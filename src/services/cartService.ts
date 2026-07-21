import api from "../lib/api";
import { mapProduct } from "./productService";
import { Product } from "../types";

export interface FrontendCartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface FrontendCart {
  items: FrontendCartItem[];
  savedForLater: FrontendCartItem[];
  totalItems: number;
  subtotal: number;
}

const mapCartItem = (item: any): FrontendCartItem => {
  return {
    product: mapProduct(item.product),
    quantity: item.quantity || 1,
    selectedColor: item.selectedColor,
    selectedSize: item.selectedSize,
  };
};

export const cartService = {
  async getCart(): Promise<FrontendCart> {
    const response = await api.get("/cart");
    const { items, savedForLater, totalItems, subtotal } = response.data.data;
    return {
      items: (items || []).map(mapCartItem),
      savedForLater: (savedForLater || []).map(mapCartItem),
      totalItems: totalItems || 0,
      subtotal: subtotal || 0,
    };
  },

  async addItem(productId: string, quantity = 1): Promise<FrontendCart> {
    const response = await api.post("/cart/items", { productId, quantity });
    const { items, savedForLater, totalItems, subtotal } = response.data.data;
    return {
      items: (items || []).map(mapCartItem),
      savedForLater: (savedForLater || []).map(mapCartItem),
      totalItems: totalItems || 0,
      subtotal: subtotal || 0,
    };
  },

  async updateQuantity(productId: string, quantity: number): Promise<FrontendCart> {
    const response = await api.put(`/cart/items/${productId}`, { quantity });
    const { items, savedForLater, totalItems, subtotal } = response.data.data;
    return {
      items: (items || []).map(mapCartItem),
      savedForLater: (savedForLater || []).map(mapCartItem),
      totalItems: totalItems || 0,
      subtotal: subtotal || 0,
    };
  },

  async removeItem(productId: string): Promise<FrontendCart> {
    const response = await api.delete(`/cart/items/${productId}`);
    const { items, savedForLater, totalItems, subtotal } = response.data.data;
    return {
      items: (items || []).map(mapCartItem),
      savedForLater: (savedForLater || []).map(mapCartItem),
      totalItems: totalItems || 0,
      subtotal: subtotal || 0,
    };
  },

  async clearCart(): Promise<FrontendCart> {
    const response = await api.delete("/cart");
    const { items, savedForLater, totalItems, subtotal } = response.data.data;
    return {
      items: (items || []).map(mapCartItem),
      savedForLater: (savedForLater || []).map(mapCartItem),
      totalItems: totalItems || 0,
      subtotal: subtotal || 0,
    };
  },

  async moveToSaveForLater(productId: string): Promise<FrontendCart> {
    const response = await api.post(`/cart/items/${productId}/save-for-later`);
    const { items, savedForLater, totalItems, subtotal } = response.data.data;
    return {
      items: (items || []).map(mapCartItem),
      savedForLater: (savedForLater || []).map(mapCartItem),
      totalItems: totalItems || 0,
      subtotal: subtotal || 0,
    };
  },

  async moveToCart(productId: string): Promise<FrontendCart> {
    const response = await api.post(`/cart/save-for-later/${productId}/move-to-cart`);
    const { items, savedForLater, totalItems, subtotal } = response.data.data;
    return {
      items: (items || []).map(mapCartItem),
      savedForLater: (savedForLater || []).map(mapCartItem),
      totalItems: totalItems || 0,
      subtotal: subtotal || 0,
    };
  },

  async removeItemFromSaveForLater(productId: string): Promise<FrontendCart> {
    const response = await api.delete(`/cart/save-for-later/${productId}`);
    const { items, savedForLater, totalItems, subtotal } = response.data.data;
    return {
      items: (items || []).map(mapCartItem),
      savedForLater: (savedForLater || []).map(mapCartItem),
      totalItems: totalItems || 0,
      subtotal: subtotal || 0,
    };
  },

  async mergeCart(guestItems: Array<{ productId: string; quantity: number }>): Promise<FrontendCart> {
    const response = await api.post("/cart/merge", { items: guestItems });
    const { items, savedForLater, totalItems, subtotal } = response.data.data;
    return {
      items: (items || []).map(mapCartItem),
      savedForLater: (savedForLater || []).map(mapCartItem),
      totalItems: totalItems || 0,
      subtotal: subtotal || 0,
    };
  },
};
