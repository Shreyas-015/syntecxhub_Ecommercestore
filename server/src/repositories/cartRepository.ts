import mongoose from "mongoose";
import { Cart, ICart, ICartItem } from "../models/Cart";
import { Product } from "../models/Product";
import { mockProducts } from "./productRepository";

export const mockCarts = new Map<string, any>();

export class InMemoryCart {
  id: string;
  _id: string;
  user: string;
  items: { product: string; quantity: number; priceAtAddition: number }[];
  totalItems: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(userId: string) {
    this.id = Math.random().toString(36).substring(2, 15);
    this._id = this.id;
    this.user = userId;
    this.items = [];
    this.totalItems = 0;
    this.subtotal = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  recalculate() {
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.priceAtAddition), 0);
    this.updatedAt = new Date();
  }
}

export class CartRepository {
  private isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Helper to recalculate totalItems and subtotal on a cart document or mock object
   */
  recalculateTotals(cart: any): void {
    const items = cart.items || [];
    cart.totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    cart.subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.priceAtAddition), 0);
  }

  /**
   * Retrieve cart by userId, auto-creating one if not found
   */
  async getCartByUser(userId: string): Promise<any> {
    if (!this.isConnected()) {
      let mockCart = mockCarts.get(userId);
      if (!mockCart) {
        mockCart = new InMemoryCart(userId);
        (mockCart as any).savedForLater = [];
        mockCarts.set(userId, mockCart);
      }
      return mockCart;
    }

    let cart = await Cart.findOne({ user: userId })
      .populate("items.product", "name thumbnail price discountPrice stock slug")
      .populate("savedForLater.product", "name thumbnail price discountPrice stock slug");
    if (!cart) {
      cart = new Cart({ user: userId, items: [], savedForLater: [], totalItems: 0, subtotal: 0 });
      await cart.save();
      // Refetch to populate correctly
      cart = await Cart.findOne({ user: userId })
        .populate("items.product", "name thumbnail price discountPrice stock slug")
        .populate("savedForLater.product", "name thumbnail price discountPrice stock slug");
    }
    return cart;
  }

  /**
   * Manually create cart for user
   */
  async createCart(userId: string, items: any[] = []): Promise<any> {
    if (!this.isConnected()) {
      const mockCart = new InMemoryCart(userId);
      mockCart.items = items;
      mockCart.recalculate();
      mockCarts.set(userId, mockCart);
      return mockCart;
    }

    let cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = items;
      this.recalculateTotals(cart);
      await cart.save();
      return this.getCartByUser(userId);
    }

    cart = new Cart({ user: userId, items, totalItems: 0, subtotal: 0 });
    this.recalculateTotals(cart);
    await cart.save();
    return this.getCartByUser(userId);
  }

  /**
   * Add item to the user's cart
   */
  async addItem(userId: string, productId: string, quantity: number, priceAtAddition: number): Promise<any> {
    // 1. Basic validation
    if (!productId) {
      throw new Error("Product ID is required.");
    }
    if (quantity < 1) {
      throw new Error("Quantity must be at least 1.");
    }

    // 2. Validate product exists
    if (!this.isConnected()) {
      const productExists = mockProducts.has(productId);
      if (!productExists) {
        throw new Error(`Product with ID ${productId} does not exist.`);
      }

      const cart = await this.getCartByUser(userId);
      
      // 3. Prevent duplicate products
      const duplicate = cart.items.find((item: any) => String(item.product) === String(productId));
      if (duplicate) {
        throw new Error("Product already exists in the shopping cart.");
      }

      cart.items.push({ product: productId, quantity, priceAtAddition });
      cart.recalculate();
      mockCarts.set(userId, cart);
      return cart;
    } else {
      const productExists = await Product.exists({ _id: productId });
      if (!productExists) {
        throw new Error(`Product with ID ${productId} does not exist.`);
      }

      const cart = await this.getCartByUser(userId);

      // 3. Prevent duplicate products
      const duplicate = cart.items.find((item: any) => {
        const itemProdId = item.product && typeof item.product === "object" ? item.product._id : item.product;
        return String(itemProdId) === String(productId);
      });
      if (duplicate) {
        throw new Error("Product already exists in the shopping cart.");
      }

      cart.items.push({
        product: new mongoose.Types.ObjectId(productId) as any,
        quantity,
        priceAtAddition
      });
      
      this.recalculateTotals(cart);
      await cart.save();
      return this.getCartByUser(userId);
    }
  }

  /**
   * Update quantity of an existing product in the user's cart
   */
  async updateQuantity(userId: string, productId: string, quantity: number): Promise<any> {
    if (quantity < 1) {
      throw new Error("Quantity must be at least 1.");
    }

    if (!this.isConnected()) {
      const cart = await this.getCartByUser(userId);
      const item = cart.items.find((item: any) => String(item.product) === String(productId));
      if (!item) {
        throw new Error("Product not found in shopping cart.");
      }

      item.quantity = quantity;
      cart.recalculate();
      mockCarts.set(userId, cart);
      return cart;
    } else {
      const cart = await this.getCartByUser(userId);
      const item = cart.items.find((item: any) => {
        const itemProdId = item.product && typeof item.product === "object" ? item.product._id : item.product;
        return String(itemProdId) === String(productId);
      });

      if (!item) {
        throw new Error("Product not found in shopping cart.");
      }

      item.quantity = quantity;
      this.recalculateTotals(cart);
      await cart.save();
      return this.getCartByUser(userId);
    }
  }

  /**
   * Remove item from the user's cart
   */
  async removeItem(userId: string, productId: string): Promise<any> {
    if (!this.isConnected()) {
      const cart = await this.getCartByUser(userId);
      cart.items = cart.items.filter((item: any) => String(item.product) !== String(productId));
      cart.recalculate();
      mockCarts.set(userId, cart);
      return cart;
    } else {
      const cart = await this.getCartByUser(userId);
      cart.items = cart.items.filter((item: any) => {
        const itemProdId = item.product && typeof item.product === "object" ? item.product._id : item.product;
        return String(itemProdId) !== String(productId);
      });
      this.recalculateTotals(cart);
      await cart.save();
      return this.getCartByUser(userId);
    }
  }

  /**
   * Clear all items from the user's cart
   */
  async clearCart(userId: string): Promise<any> {
    if (!this.isConnected()) {
      const cart = await this.getCartByUser(userId);
      cart.items = [];
      cart.recalculate();
      mockCarts.set(userId, cart);
      return cart;
    } else {
      const cart = await this.getCartByUser(userId);
      cart.items = [];
      this.recalculateTotals(cart);
      await cart.save();
      return this.getCartByUser(userId);
    }
  }

  /**
   * Move an item from active items to Save For Later
   */
  async moveToSaveForLater(userId: string, productId: string): Promise<any> {
    if (!this.isConnected()) {
      const cart = await this.getCartByUser(userId);
      if (!cart.savedForLater) {
        cart.savedForLater = [];
      }
      const itemIndex = cart.items.findIndex((item: any) => String(item.product) === String(productId));
      if (itemIndex > -1) {
        const [item] = cart.items.splice(itemIndex, 1);
        const exists = cart.savedForLater.some((s: any) => String(s.product) === String(productId));
        if (!exists) {
          cart.savedForLater.push({ product: productId, priceAtAddition: item.priceAtAddition });
        }
      }
      cart.recalculate();
      mockCarts.set(userId, cart);
      return cart;
    } else {
      const cart = await this.getCartByUser(userId);
      if (!cart.savedForLater) {
        cart.savedForLater = [];
      }
      const itemIndex = cart.items.findIndex((item: any) => {
        const itemProdId = item.product && typeof item.product === "object" ? item.product._id : item.product;
        return String(itemProdId) === String(productId);
      });

      if (itemIndex > -1) {
        const item = cart.items[itemIndex];
        const price = item.priceAtAddition;
        cart.items.splice(itemIndex, 1);

        const exists = cart.savedForLater.some((s: any) => {
          const sProdId = s.product && typeof s.product === "object" ? s.product._id : s.product;
          return String(sProdId) === String(productId);
        });

        if (!exists) {
          cart.savedForLater.push({
            product: new mongoose.Types.ObjectId(productId) as any,
            priceAtAddition: price
          });
        }

        this.recalculateTotals(cart);
        await cart.save();
      }
      return this.getCartByUser(userId);
    }
  }

  /**
   * Move an item from Save For Later back to active items
   */
  async moveToCart(userId: string, productId: string): Promise<any> {
    if (!this.isConnected()) {
      const cart = await this.getCartByUser(userId);
      if (!cart.savedForLater) {
        cart.savedForLater = [];
      }
      const sIndex = cart.savedForLater.findIndex((s: any) => String(s.product) === String(productId));
      if (sIndex > -1) {
        const [savedItem] = cart.savedForLater.splice(sIndex, 1);
        const exists = cart.items.some((item: any) => String(item.product) === String(productId));
        if (!exists) {
          cart.items.push({ product: productId, quantity: 1, priceAtAddition: savedItem.priceAtAddition });
        }
      }
      cart.recalculate();
      mockCarts.set(userId, cart);
      return cart;
    } else {
      const cart = await this.getCartByUser(userId);
      if (!cart.savedForLater) {
        cart.savedForLater = [];
      }
      const sIndex = cart.savedForLater.findIndex((s: any) => {
        const sProdId = s.product && typeof s.product === "object" ? s.product._id : s.product;
        return String(sProdId) === String(productId);
      });

      if (sIndex > -1) {
        const savedItem = cart.savedForLater[sIndex];
        const price = savedItem.priceAtAddition;
        cart.savedForLater.splice(sIndex, 1);

        const exists = cart.items.some((item: any) => {
          const itemProdId = item.product && typeof item.product === "object" ? item.product._id : item.product;
          return String(itemProdId) === String(productId);
        });

        if (!exists) {
          cart.items.push({
            product: new mongoose.Types.ObjectId(productId) as any,
            quantity: 1,
            priceAtAddition: price
          });
        }

        this.recalculateTotals(cart);
        await cart.save();
      }
      return this.getCartByUser(userId);
    }
  }

  /**
   * Remove item from Save For Later
   */
  async removeItemFromSaveForLater(userId: string, productId: string): Promise<any> {
    if (!this.isConnected()) {
      const cart = await this.getCartByUser(userId);
      if (!cart.savedForLater) cart.savedForLater = [];
      cart.savedForLater = cart.savedForLater.filter((s: any) => String(s.product) !== String(productId));
      mockCarts.set(userId, cart);
      return cart;
    } else {
      const cart = await this.getCartByUser(userId);
      if (!cart.savedForLater) cart.savedForLater = [];
      cart.savedForLater = cart.savedForLater.filter((s: any) => {
        const sProdId = s.product && typeof s.product === "object" ? s.product._id : s.product;
        return String(sProdId) !== String(productId);
      });
      await cart.save();
      return this.getCartByUser(userId);
    }
  }
}

export const cartRepository = new CartRepository();
