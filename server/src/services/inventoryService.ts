import { productRepository } from "../repositories/productRepository";
import { ValidationError, NotFoundError } from "../utils/errors";
import mongoose from "mongoose";
import { Product } from "../models/Product";

export interface IInventoryHistory {
  productId: string;
  orderId?: string;
  changeType: "reserve" | "deduct" | "restore" | "release";
  quantity: number;
  previousStock: number;
  newStock: number;
  timestamp: Date;
  note?: string;
}

// In-memory inventory history for mock mode
export const mockInventoryHistory: IInventoryHistory[] = [];

export class InventoryService {
  /**
   * Placeholder to reserve stock for an order (pre-deduction step)
   */
  async reserveStock(
    productId: string,
    quantity: number,
    orderId?: string,
    session?: mongoose.ClientSession
  ): Promise<void> {
    console.log(`[InventoryService] Reserving ${quantity} of product ${productId} for order ${orderId}`);
    
    // Perform history logging hook
    await this.logHistory({
      productId,
      orderId,
      changeType: "reserve",
      quantity,
      previousStock: 0, // Placeholder
      newStock: 0, // Placeholder
      timestamp: new Date(),
      note: "Stock reserved pending checkout confirmation"
    });
  }

  /**
   * Deduct stock when payment succeeds or Cash on Delivery order is confirmed
   */
  async deductStock(
    productId: string,
    quantity: number,
    orderId?: string,
    session?: mongoose.ClientSession
  ): Promise<{ previousStock: number; newStock: number }> {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} not found for stock deduction`);
    }

    if (product.stock < quantity) {
      throw new ValidationError(
        `Insufficient stock for product '${product.name}'. Available: ${product.stock}, Requested: ${quantity}`
      );
    }

    const previousStock = product.stock;
    const newStock = previousStock - quantity;

    // Perform atomic update in DB if connected, otherwise use repository update
    if (mongoose.connection.readyState === 1) {
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $inc: { stock: -quantity } },
        { new: true, runValidators: true, session }
      );
      if (!updatedProduct) {
        throw new NotFoundError(`Product with ID ${productId} not found during stock deduction`);
      }
    } else {
      await productRepository.update(productId, { stock: newStock });
    }

    console.log(
      `[InventoryService] Deducted ${quantity} from product ${productId} (${product.name}). Stock changed from ${previousStock} to ${newStock}`
    );

    await this.logHistory({
      productId,
      orderId,
      changeType: "deduct",
      quantity,
      previousStock,
      newStock,
      timestamp: new Date(),
      note: `Stock deducted for order ${orderId}`
    });

    return { previousStock, newStock };
  }

  /**
   * Restore stock when order is cancelled after inventory has already been deducted
   */
  async restoreStock(
    productId: string,
    quantity: number,
    orderId?: string,
    session?: mongoose.ClientSession
  ): Promise<{ previousStock: number; newStock: number }> {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} not found for stock restoration`);
    }

    const previousStock = product.stock;
    const newStock = previousStock + quantity;

    // Perform atomic update in DB if connected, otherwise use repository update
    if (mongoose.connection.readyState === 1) {
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $inc: { stock: quantity } },
        { new: true, runValidators: true, session }
      );
      if (!updatedProduct) {
        throw new NotFoundError(`Product with ID ${productId} not found during stock restoration`);
      }
    } else {
      await productRepository.update(productId, { stock: newStock });
    }

    console.log(
      `[InventoryService] Restored ${quantity} to product ${productId} (${product.name}). Stock changed from ${previousStock} to ${newStock}`
    );

    await this.logHistory({
      productId,
      orderId,
      changeType: "restore",
      quantity,
      previousStock,
      newStock,
      timestamp: new Date(),
      note: `Stock restored automatically after cancellation of order ${orderId}`
    });

    return { previousStock, newStock };
  }

  /**
   * Inventory history hook / logger
   */
  private async logHistory(historyEntry: IInventoryHistory): Promise<void> {
    mockInventoryHistory.push(historyEntry);
    console.log(
      `[InventoryHistoryHook] [${historyEntry.timestamp.toISOString()}] Product ${
        historyEntry.productId
      } - Event: ${historyEntry.changeType.toUpperCase()}, Qty: ${historyEntry.quantity}, Prev Stock: ${
        historyEntry.previousStock
      }, New Stock: ${historyEntry.newStock}, Note: ${historyEntry.note}`
    );
  }

  /**
   * Get inventory history for debugging or admin reference
   */
  async getInventoryHistory(productId?: string): Promise<IInventoryHistory[]> {
    if (productId) {
      return mockInventoryHistory.filter((h) => h.productId === productId);
    }
    return mockInventoryHistory;
  }
}

export const inventoryService = new InventoryService();
