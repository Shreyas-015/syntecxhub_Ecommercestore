import { orderRepository } from "../repositories/orderRepository";
import { addressRepository } from "../repositories/addressRepository";
import { OrderStatus, PaymentStatus, PaymentMethod } from "../types/order";
import { ValidationError, NotFoundError, ForbiddenError } from "../utils/errors";
import { IOrder, Order } from "../models/Order";
import mongoose from "mongoose";
import { cartService } from "./cartService";
import { productRepository } from "../repositories/productRepository";
import { couponRepositoryPlaceholder, couponValidationService, couponDiscountService } from "./couponService";
import { shippingService } from "./shippingService";
import { taxService } from "./taxService";
import { inventoryService } from "./inventoryService";

export class OrderService {
  /**
   * Run the checkout flow and place an order
   */
  async checkout(
    userId: string,
    input: {
      shippingAddressId: string;
      paymentMethod: PaymentMethod;
      notes?: string;
      couponCode?: string;
      shippingOption?: string;
    }
  ): Promise<IOrder> {
    const { shippingAddressId, paymentMethod, notes, couponCode, shippingOption } = input;

    if (!userId) {
      throw new ValidationError("User ID is required");
    }

    // 1. Load authenticated user's cart
    const cart = await cartService.getCartByUser(userId);
    if (!cart) {
      throw new ValidationError("Cart not found");
    }

    // 2. Verify cart exists and contains at least one item
    if (!cart.items || cart.items.length === 0) {
      throw new ValidationError("Cart is empty");
    }

    const orderItems: any[] = [];
    let subtotal = 0;

    // 3. Verify every product, activity, stock limits and recalculate pricing
    for (const item of cart.items) {
      const productId = item.product && typeof item.product === "object"
        ? (item.product._id || (item.product as any).id)
        : item.product;
      const productStrId = String(productId);

      const product = await productRepository.findById(productStrId);
      
      // 4. Verify product still exists
      if (!product) {
        throw new NotFoundError("Product no longer exists");
      }

      // 5. Verify product is active
      if (product.isActive === false) {
        throw new ValidationError(`Product '${product.name}' is inactive`);
      }

      // 6. Verify requested quantity does not exceed available stock
      if (item.quantity > product.stock) {
        throw new ValidationError(`Requested quantity for '${product.name}' exceeds available stock (${product.stock})`);
      }

      // 7. Recalculate pricing using current product prices
      const currentPrice = product.discountPrice !== undefined && product.discountPrice !== null
        ? product.discountPrice
        : product.price;
      
      const itemSubtotal = Math.round(currentPrice * item.quantity * 100) / 100;
      subtotal += itemSubtotal;

      // 9. Create an immutable snapshot of: product name, product image, price, quantity, subtotal
      orderItems.push({
        product: product._id || (product as any).id,
        name: product.name,
        thumbnail: product.thumbnail || (product.images && product.images[0]) || "",
        quantity: item.quantity,
        price: currentPrice,
        subtotal: itemSubtotal
      });
    }

    // 10. Copy the selected shipping address into the order (snapshot)
    if (!shippingAddressId) {
      throw new ValidationError("Shipping address is required");
    }
    const address = await addressRepository.findById(shippingAddressId);
    if (!address) {
      throw new NotFoundError("Address not found");
    }
    if (address.user.toString() !== userId.toString()) {
      throw new ForbiddenError("You do not have permission to use this address");
    }

    const shippingAddressSnapshot = {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      landmark: address.landmark,
      addressType: address.addressType
    };

    // 8. Calculate: subtotal, discounts, shipping, tax, grand total
    let discount = 0;
    if (couponCode) {
      const coupon = await couponRepositoryPlaceholder.findByCode(couponCode);
      if (!coupon) {
        throw new ValidationError(`Coupon code '${couponCode}' is invalid`);
      }
      const validationResult = couponValidationService.validate(coupon, subtotal);
      if (!validationResult.valid) {
        throw new ValidationError(validationResult.error || "Coupon validation failed");
      }
      discount = couponDiscountService.calculateDiscount(coupon, subtotal);
    }

    const shippingOptions = shippingService.estimateShipping({ subtotal, destination: address.state || address.city });
    let shippingCost = shippingOptions[0].cost;
    if (shippingOption) {
      const selectedOption = shippingOptions.find(o => o.name.toLowerCase().includes(shippingOption.toLowerCase()));
      if (selectedOption) {
        shippingCost = selectedOption.cost;
      }
    }

    const taxableSubtotal = Math.max(0, subtotal - discount);
    const taxResult = taxService.calculateTax({ subtotal: taxableSubtotal, region: address.state });
    const taxAmount = taxResult.amount;

    const grandTotal = Math.max(0, Math.round((taxableSubtotal + shippingCost + taxAmount) * 100) / 100);

    // 11. Generate a unique order number. Example: ORD-2026-000001
    const year = new Date().getFullYear();
    const randomDigits = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
    let orderNumber = `ORD-${year}-${randomDigits}`;

    // Verify uniqueness in DB if connected
    if (mongoose.connection.readyState === 1) {
      const exists = await Order.exists({ orderNumber });
      if (exists) {
        const nextDigits = String(Math.floor(100000 + Math.random() * 900000));
        orderNumber = `ORD-${year}-${nextDigits}`;
      }
    }

    // 12. Create the order & 13. Set orderStatus = pending, paymentStatus = pending
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const invoiceNumber = `INV-${datePart}-${randomDigits}`;

    const orderData: Partial<IOrder> = {
      user: new mongoose.Types.ObjectId(userId) as any,
      orderItems: orderItems as any,
      subtotal,
      discount,
      shipping: shippingCost,
      tax: taxAmount,
      total: grandTotal,
      shippingAddress: shippingAddressSnapshot,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod,
      orderNumber,
      notes,
      invoiceNumber,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      timeline: [
        {
          status: "Order Created",
          timestamp: new Date(),
          note: "Order has been successfully placed and is pending processing"
        }
      ]
    };

    return orderRepository.create(orderData);
  }

  /**
   * Get all orders for a user
   */
  async getUserOrders(userId: string): Promise<IOrder[]> {
    if (!userId) {
      throw new ValidationError("User ID is required");
    }
    return orderRepository.findByUser(userId);
  }

  /**
   * Get a specific order by ID, ensuring it belongs to the user
   */
  async getOrderById(id: string, userId: string): Promise<IOrder> {
    if (!id || !userId) {
      throw new ValidationError("Order ID and User ID are required");
    }
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    if (order.user.toString() !== userId.toString()) {
      throw new ForbiddenError("You do not have permission to view this order");
    }
    return order;
  }

  /**
   * Create a new order for a user
   */
  async createOrder(
    userId: string,
    orderInput: {
      orderItems: Array<{
        product: string;
        name: string;
        thumbnail?: string;
        quantity: number;
        price: number;
      }>;
      shippingAddressId: string;
      paymentMethod: PaymentMethod;
      notes?: string;
      discount?: number;
      shipping?: number;
      tax?: number;
    }
  ): Promise<IOrder> {
    const { orderItems, shippingAddressId, paymentMethod, notes, discount = 0, shipping = 0, tax = 0 } = orderInput;

    if (!userId) {
      throw new ValidationError("User ID is required");
    }

    // 1. Validate Order Items
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      throw new ValidationError("Order must contain at least one item");
    }

    const validatedItems = orderItems.map((item) => {
      if (!item.product) {
        throw new ValidationError("Product ID is required for each item");
      }
      if (!item.name) {
        throw new ValidationError("Product name is required for each item");
      }
      if (item.quantity <= 0) {
        throw new ValidationError("Quantity must be greater than 0");
      }
      if (item.price < 0) {
        throw new ValidationError("Price must be non-negative");
      }

      const itemSubtotal = Math.round(item.price * item.quantity * 100) / 100;
      return {
        product: new mongoose.Types.ObjectId(item.product),
        name: item.name,
        thumbnail: item.thumbnail,
        quantity: item.quantity,
        price: item.price,
        subtotal: itemSubtotal
      };
    });

    // 2. Fetch and snapshot shipping address
    if (!shippingAddressId) {
      throw new ValidationError("Shipping address is required");
    }
    const address = await addressRepository.findById(shippingAddressId);
    if (!address) {
      throw new NotFoundError("Shipping address not found");
    }
    if (address.user.toString() !== userId.toString()) {
      throw new ForbiddenError("Shipping address does not belong to the user");
    }

    const shippingAddressSnapshot = {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      landmark: address.landmark,
      addressType: address.addressType
    };

    // 3. Calculate Totals
    const subtotal = validatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    
    if (discount < 0) {
      throw new ValidationError("Discount must be non-negative");
    }
    if (shipping < 0) {
      throw new ValidationError("Shipping must be non-negative");
    }
    if (tax < 0) {
      throw new ValidationError("Tax must be non-negative");
    }

    const rawTotal = subtotal - discount + shipping + tax;
    const total = Math.max(0, Math.round(rawTotal * 100) / 100);

    // 4. Generate unique order number: e.g. ST-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ST-${dateStr}-${randomStr}`;

    // 5. Calculate estimated delivery (7 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    // 6. Create Order
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const invoiceNumber = `INV-${datePart}-${randomStr}`;

    const orderData: Partial<IOrder> = {
      user: new mongoose.Types.ObjectId(userId) as any,
      orderItems: validatedItems as any,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      shippingAddress: shippingAddressSnapshot,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod,
      orderNumber,
      notes,
      invoiceNumber,
      estimatedDelivery,
      timeline: [
        {
          status: "Order Created",
          timestamp: new Date(),
          note: "Order has been successfully placed and is pending processing"
        }
      ]
    };

    return orderRepository.create(orderData);
  }

  /**
   * Helper to validate order status transitions in valid order.
   */
  validateStatusTransition(current: OrderStatus, target: OrderStatus): void {
    if (current === target) return;

    if (current === OrderStatus.DELIVERED) {
      throw new ValidationError("Cannot modify status. Order is already delivered.");
    }
    if (current === OrderStatus.CANCELLED) {
      throw new ValidationError("Cannot modify status. Order is already cancelled.");
    }

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.DELIVERED]: [],
    };

    const allowed = allowedTransitions[current] || [];
    if (!allowed.includes(target)) {
      throw new ValidationError(`Invalid state transition. Cannot change order status from '${current}' to '${target}'.`);
    }
  }

  /**
   * Sync inventory stock based on payment success or cancellation status.
   */
  async syncInventoryForOrder(orderId: string, session?: mongoose.ClientSession): Promise<IOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found for inventory synchronization");
    }

    const shouldDeduct =
      order.paymentStatus === PaymentStatus.PAID ||
      (order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY && order.status === OrderStatus.CONFIRMED);

    const shouldRestore = order.status === OrderStatus.CANCELLED;

    if (shouldDeduct && !order.inventoryDeducted) {
      // Deduct inventory
      for (const item of order.orderItems) {
        const productId = String(item.product._id || (item.product as any).id || item.product);
        await inventoryService.deductStock(productId, item.quantity, order._id?.toString(), session);
      }
      order.inventoryDeducted = true;

      if (!order.timeline) order.timeline = [];
      order.timeline.push({
        status: "Inventory Updated",
        timestamp: new Date(),
        note: `Stock deducted successfully for ordered items. Payment state: ${order.paymentStatus}, Order state: ${order.status}`
      });

      const updated = await orderRepository.update(orderId, order as any);
      return updated || order;
    } else if (shouldRestore && order.inventoryDeducted) {
      // Restore inventory
      for (const item of order.orderItems) {
        const productId = String(item.product._id || (item.product as any).id || item.product);
        await inventoryService.restoreStock(productId, item.quantity, order._id?.toString(), session);
      }
      order.inventoryDeducted = false;

      if (!order.timeline) order.timeline = [];
      order.timeline.push({
        status: "Inventory Updated",
        timestamp: new Date(),
        note: "Stock restored automatically due to order cancellation"
      });

      const updated = await orderRepository.update(orderId, order as any);
      return updated || order;
    }

    return order;
  }

  /**
   * Update order status (for admin/seller use) with state validations & inventory hooks
   */
  async updateOrderStatus(id: string, status: OrderStatus): Promise<IOrder> {
    if (!Object.values(OrderStatus).includes(status)) {
      throw new ValidationError(`Invalid order status: ${status}`);
    }

    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Validate status transition
    this.validateStatusTransition(order.status, status);

    const oldStatus = order.status;
    order.status = status;

    // Log status update in timeline
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: `Status Updated`,
      timestamp: new Date(),
      note: `Order status changed from ${oldStatus} to ${status}`
    });

    const updated = await orderRepository.update(id, order as any);
    if (!updated) {
      throw new NotFoundError("Order update failed");
    }

    // Process inventory sync if status transitioned to Cancelled or Confirmed (CoD)
    await this.syncInventoryForOrder(id);

    // Refresh and return latest state
    const finalOrder = await orderRepository.findById(id);
    return finalOrder || updated;
  }

  /**
   * Update order payment status with timeline audit trail and inventory hooks
   */
  async updateOrderPaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<IOrder> {
    if (!Object.values(PaymentStatus).includes(paymentStatus)) {
      throw new ValidationError(`Invalid payment status: ${paymentStatus}`);
    }

    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    const oldPaymentStatus = order.paymentStatus;
    order.paymentStatus = paymentStatus;

    // Log payment update in timeline
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: `Payment Updated`,
      timestamp: new Date(),
      note: `Payment status changed from ${oldPaymentStatus} to ${paymentStatus}`
    });

    const updated = await orderRepository.update(id, order as any);
    if (!updated) {
      throw new NotFoundError("Order update failed");
    }

    // Process inventory sync if payment status became PAID
    await this.syncInventoryForOrder(id);

    // Refresh and return latest state
    const finalOrder = await orderRepository.findById(id);
    return finalOrder || updated;
  }

  /**
   * Cancel an order (by user) with cancellation eligibility checks and automated stock restoration
   */
  async cancelOrder(id: string, userId: string): Promise<IOrder> {
    const order = await this.getOrderById(id, userId);

    if (
      order.status === OrderStatus.SHIPPED || 
      order.status === OrderStatus.OUT_FOR_DELIVERY || 
      order.status === OrderStatus.DELIVERED || 
      order.status === OrderStatus.CANCELLED
    ) {
      throw new ValidationError(`Cannot cancel order. It is already in state '${order.status}'`);
    }

    const oldStatus = order.status;
    order.status = OrderStatus.CANCELLED;

    // Log cancellation in timeline
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: "Cancelled",
      timestamp: new Date(),
      note: `Order cancelled by customer. Previous status was ${oldStatus}.`
    });

    const updated = await orderRepository.update(id, order as any);
    if (!updated) {
      throw new NotFoundError("Order cancellation failed");
    }

    // Automatically restore stock if inventory had already been deducted
    await this.syncInventoryForOrder(id);

    // Refresh and return latest state
    const finalOrder = await orderRepository.findById(id);
    return finalOrder || updated;
  }

  /**
   * Retrieve all orders (admin role access)
   */
  async getAllOrdersForAdmin(): Promise<IOrder[]> {
    return orderRepository.findAll();
  }

  /**
   * Retrieve a specific order by ID (admin role access, bypass ownership constraint)
   */
  async getOrderByIdForAdmin(id: string): Promise<IOrder> {
    if (!id) {
      throw new ValidationError("Order ID is required");
    }
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    return order;
  }
}

export const orderService = new OrderService();
