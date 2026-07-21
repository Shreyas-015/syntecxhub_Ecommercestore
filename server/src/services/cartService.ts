import { cartRepository } from "../repositories/cartRepository";
import { productRepository } from "../repositories/productRepository";
import { ValidationError, NotFoundError } from "../utils/errors";
import mongoose from "mongoose";

export class CartService {
  /**
   * Retrieve active cart for a user.
   */
  async getCartByUser(userId: string): Promise<any> {
    if (!userId) {
      throw new ValidationError("User ID is required to get a cart");
    }
    return cartRepository.getCartByUser(userId);
  }

  /**
   * Create or reset cart for a user with optional items.
   */
  async createCart(userId: string, items: any[] = []): Promise<any> {
    if (!userId) {
      throw new ValidationError("User ID is required to create a cart");
    }
    return cartRepository.createCart(userId, items);
  }

  /**
   * Add a product to the user's shopping cart.
   */
  async addItem(userId: string, productId: string, quantity: number, priceAtAddition?: number): Promise<any> {
    if (!userId) {
      throw new ValidationError("User ID is required to add an item to the cart");
    }
    if (!productId) {
      throw new ValidationError("Product ID is required to add an item to the cart");
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError("Invalid product ID format");
    }
    if (quantity < 1) {
      throw new ValidationError("Quantity must be greater than zero");
    }

    // 1. Verify product exists
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} does not exist`);
    }

    // 2. Product must be active
    if (product.isActive === false) {
      throw new ValidationError("Product is inactive");
    }

    // 3. Product must be in stock
    if (product.stock <= 0) {
      throw new ValidationError("Product is out of stock");
    }

    const resolvedPrice = priceAtAddition !== undefined ? priceAtAddition : (product.discountPrice ?? product.price);

    // 4. Retrieve current cart to check if duplicate
    const cart = await cartRepository.getCartByUser(userId);

    const existingItem = cart.items.find((item: any) => {
      const itemProdId = item.product && typeof item.product === "object" ? (item.product._id || item.product.id) : item.product;
      return String(itemProdId) === String(productId);
    });

    if (existingItem) {
      // 5. If product already exists: Increase quantity instead of creating a duplicate
      const targetQuantity = existingItem.quantity + quantity;
      if (targetQuantity > product.stock) {
        throw new ValidationError(`Cannot add ${quantity} more items. Stock limit is ${product.stock}, and you already have ${existingItem.quantity} in cart.`);
      }
      return cartRepository.updateQuantity(userId, productId, targetQuantity);
    } else {
      // 6. Verify quantity does not exceed available stock
      if (quantity > product.stock) {
        throw new ValidationError(`Cannot add ${quantity} items. Only ${product.stock} items are in stock.`);
      }
      return cartRepository.addItem(userId, productId, quantity, resolvedPrice);
    }
  }

  /**
   * Update the quantity of a product inside the user's cart.
   */
  async updateQuantity(userId: string, productId: string, quantity: number): Promise<any> {
    if (!userId) {
      throw new ValidationError("User ID is required to update item quantity");
    }
    if (!productId) {
      throw new ValidationError("Product ID is required to update item quantity");
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError("Invalid product ID format");
    }
    if (quantity < 1) {
      throw new ValidationError("Quantity cannot be less than 1");
    }

    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} does not exist`);
    }

    if (product.isActive === false) {
      throw new ValidationError("Product is inactive");
    }

    if (quantity > product.stock) {
      throw new ValidationError(`Quantity cannot exceed available stock of ${product.stock}`);
    }

    return cartRepository.updateQuantity(userId, productId, quantity);
  }

  /**
   * Remove a product from the user's cart.
   */
  async removeItem(userId: string, productId: string): Promise<any> {
    if (!userId) {
      throw new ValidationError("User ID is required to remove an item");
    }
    if (!productId) {
      throw new ValidationError("Product ID is required to remove an item");
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError("Invalid product ID format");
    }
    return cartRepository.removeItem(userId, productId);
  }

  /**
   * Clear all items from the user's cart.
   */
  async clearCart(userId: string): Promise<any> {
    if (!userId) {
      throw new ValidationError("User ID is required to clear the cart");
    }
    return cartRepository.clearCart(userId);
  }

  /**
   * Move an active cart item to save-for-later list
   */
  async moveToSaveForLater(userId: string, productId: string): Promise<any> {
    if (!userId) {
      throw new ValidationError("User ID is required");
    }
    if (!productId) {
      throw new ValidationError("Product ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError("Invalid product ID format");
    }
    return cartRepository.moveToSaveForLater(userId, productId);
  }

  /**
   * Move a save-for-later item back to active cart
   */
  async moveToCart(userId: string, productId: string): Promise<any> {
    if (!userId) {
      throw new ValidationError("User ID is required");
    }
    if (!productId) {
      throw new ValidationError("Product ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError("Invalid product ID format");
    }

    // Verify stock before moving to active cart
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} does not exist`);
    }
    if (product.isActive === false) {
      throw new ValidationError("Product is inactive");
    }
    if (product.stock <= 0) {
      throw new ValidationError("Product is out of stock");
    }

    return cartRepository.moveToCart(userId, productId);
  }

  /**
   * Remove item from save-for-later list
   */
  async removeItemFromSaveForLater(userId: string, productId: string): Promise<any> {
    if (!userId) {
      throw new ValidationError("User ID is required");
    }
    if (!productId) {
      throw new ValidationError("Product ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError("Invalid product ID format");
    }
    return cartRepository.removeItemFromSaveForLater(userId, productId);
  }

  /**
   * Merge guest cart items into user's authenticated database cart
   */
  async mergeCart(userId: string, guestItems: Array<{ productId: string; quantity: number }>): Promise<any> {
    if (!userId) {
      throw new ValidationError("User ID is required to merge carts");
    }

    if (!Array.isArray(guestItems) || guestItems.length === 0) {
      return this.getCartByUser(userId);
    }

    for (const item of guestItems) {
      const { productId, quantity } = item;
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) continue;

      try {
        const product = await productRepository.findById(productId);
        if (!product || product.isActive === false || product.stock <= 0) {
          continue; // skip deleted, inactive, or completely out of stock items
        }

        // Determine added price
        const resolvedPrice = product.discountPrice ?? product.price;

        // Fetch current user cart to check for existing duplicates
        const cart = await this.getCartByUser(userId);
        const existingItem = cart.items.find((i: any) => {
          const itemProdId = i.product && typeof i.product === "object" ? (i.product._id || i.product.id) : i.product;
          return String(itemProdId) === String(productId);
        });

        if (existingItem) {
          // Combine quantities, limit to stock
          const combinedQuantity = existingItem.quantity + quantity;
          const cappedQuantity = Math.min(combinedQuantity, product.stock);
          await cartRepository.updateQuantity(userId, productId, cappedQuantity);
        } else {
          // Add fresh item, limit to stock
          const cappedQuantity = Math.min(quantity, product.stock);
          await cartRepository.addItem(userId, productId, cappedQuantity, resolvedPrice);
        }
      } catch (err) {
        console.error(`Error merging guest product ${productId}:`, err);
        // Continue merging other items if one fails
      }
    }

    return this.getCartByUser(userId);
  }
}

export const cartService = new CartService();
