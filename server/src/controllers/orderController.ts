import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { orderService } from "../services/orderService";
import { invoiceService } from "../services/invoiceService";
import { returnService } from "../services/returnService";
import { ApiResponse } from "../utils/response";
import { UnauthorizedError, ValidationError, ForbiddenError } from "../utils/errors";
import { Role } from "../constants/roles";
import mongoose from "mongoose";

export class OrderController {
  /**
   * Place an order by executing the checkout flow
   */
  async checkout(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { shippingAddressId, paymentMethod, notes, couponCode, shippingOption } = req.body;

    const order = await orderService.checkout(userId, {
      shippingAddressId,
      paymentMethod,
      notes,
      couponCode,
      shippingOption,
    });

    return ApiResponse.success(res, "Order placed successfully", order, 201);
  }

  /**
   * Get order history for the authenticated user, sorted by newest first
   */
  async getOrders(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const orders = await orderService.getUserOrders(userId);

    // Ensure they are sorted by newest first (safeguard for both Mongoose and Mock modes)
    orders.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return ApiResponse.success(res, "Orders retrieved successfully", orders);
  }

  /**
   * Get specific order details by ID
   */
  async getOrderById(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { id } = req.params;
    if (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid order ID format");
    }

    const order = await orderService.getOrderById(id, userId);
    return ApiResponse.success(res, "Order details retrieved successfully", order);
  }

  /**
   * User cancels their own order if still eligible (Pending/Confirmed/Processing)
   */
  async cancel(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { id } = req.params;
    if (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid order ID format");
    }

    const cancelledOrder = await orderService.cancelOrder(id, userId);
    return ApiResponse.success(res, "Order cancelled successfully", cancelledOrder);
  }

  /**
   * Retrieve order tracking timeline
   */
  async getTracking(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { id } = req.params;
    if (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid order ID format");
    }

    const order = await orderService.getOrderById(id, userId);
    
    // Generate order status tracking timeline with descriptive, chronological checkpoints
    const defaultTimeline = [
      { status: "Order Placed", timestamp: order.createdAt || new Date(), completed: true, note: "Order placed securely." },
      { status: "Confirmed", timestamp: null, completed: false, note: "Checking items stock and billing validity." },
      { status: "Processing", timestamp: null, completed: false, note: "Packing items carefully at fulfillment center." },
      { status: "Shipped", timestamp: null, completed: false, note: "Handed over to delivery carrier." },
      { status: "Out For Delivery", timestamp: null, completed: false, note: "Arriving today at your destination." },
      { status: "Delivered", timestamp: null, completed: false, note: "Delivered securely." }
    ];

    // If there is an explicit database-saved timeline, we prefer that and map completed statuses
    const savedTimeline = order.timeline || [];
    
    return ApiResponse.success(res, "Order tracking timeline retrieved successfully", {
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      estimatedDelivery: order.estimatedDelivery,
      savedTimeline,
      trackingTimeline: defaultTimeline.map((item) => {
        // Find if this status was matched in the saved timeline
        const matched = savedTimeline.find(
          (t) => t.status.toLowerCase().replace(/\s+/g, "") === item.status.toLowerCase().replace(/\s+/g, "") ||
                 t.status.toLowerCase().includes(item.status.toLowerCase())
        );
        if (matched) {
          return {
            ...item,
            timestamp: matched.timestamp,
            completed: true,
            note: matched.note || item.note
          };
        }
        
        // Handle cancellation state override
        if (order.status === "cancelled") {
          return {
            ...item,
            completed: false,
            note: item.status.toLowerCase() === "confirmed" ? "Order was cancelled before confirmation." : item.note
          };
        }

        return item;
      })
    });
  }

  /**
   * Request order return (Infrastructure Foundation)
   */
  async requestReturn(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid order ID format");
    }

    const returnRequest = await returnService.requestReturn(userId, { orderId: id, reason });
    return ApiResponse.success(res, "Return request initiated successfully", returnRequest, 201);
  }

  /**
   * Dynamic Invoice Data Builder Endpoint (Invoice Foundation)
   */
  async getInvoice(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { id } = req.params;
    if (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid order ID format");
    }

    // Double check authorization: must be admin, or the owner of the order
    const order = await orderService.getOrderByIdForAdmin(id);
    if (userRole !== Role.ADMIN && order.user.toString() !== userId.toString()) {
      throw new ForbiddenError("You do not have permission to access this order's invoice");
    }

    const invoiceData = await invoiceService.buildInvoiceData(id);
    return ApiResponse.success(res, "Invoice details compiled successfully", invoiceData);
  }

  /* =========================================
     ADMINSTRATIVE ORDERS ENDPOINTS (RBAC)
     ========================================= */

  /**
   * Admin: Get all orders in system (GET /api/admin/orders)
   */
  async adminGetOrders(req: AuthenticatedRequest, res: Response) {
    const orders = await orderService.getAllOrdersForAdmin();
    return ApiResponse.success(res, "All orders retrieved successfully for administration", orders);
  }

  /**
   * Admin: Get specific order by ID (GET /api/admin/orders/:id)
   */
  async adminGetOrderById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid order ID format");
    }

    const order = await orderService.getOrderByIdForAdmin(id);
    return ApiResponse.success(res, "Order details retrieved successfully for administration", order);
  }

  /**
   * Admin: Transition Order Status (PATCH /api/admin/orders/:id/status)
   */
  async adminUpdateStatus(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new ValidationError("Target order status is required");
    }
    if (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid order ID format");
    }

    const updatedOrder = await orderService.updateOrderStatus(id, status);
    return ApiResponse.success(res, `Order status successfully updated to ${status}`, updatedOrder);
  }

  /**
   * Admin: Update Order Payment Status (PATCH /api/admin/orders/:id/payment-status)
   */
  async adminUpdatePaymentStatus(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus) {
      throw new ValidationError("Target payment status is required");
    }
    if (mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid order ID format");
    }

    const updatedOrder = await orderService.updateOrderPaymentStatus(id, paymentStatus);
    return ApiResponse.success(res, `Order payment status successfully updated to ${paymentStatus}`, updatedOrder);
  }
}

export const orderController = new OrderController();
