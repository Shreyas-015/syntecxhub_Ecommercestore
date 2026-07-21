import { returnRepository } from "../repositories/returnRepository";
import { orderRepository } from "../repositories/orderRepository";
import { IReturnRequest, ReturnStatus, IReturnRequestInput } from "../types/return";
import { ValidationError, NotFoundError, ForbiddenError } from "../utils/errors";
import { OrderStatus } from "../types/order";

export class ReturnService {
  /**
   * Validation placeholder for a return request.
   * Ensures that returns are only requested for Delivered orders within an active policy window.
   */
  async validateReturnEligibility(orderId: string, userId: string): Promise<void> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.user.toString() !== userId.toString()) {
      throw new ForbiddenError("You do not have permission to request returns for this order");
    }

    // Return requested validation rule placeholders:
    // 1. Order status must be DELIVERED to request a return
    if (order.status !== OrderStatus.DELIVERED) {
      throw new ValidationError(`Return cannot be requested. Order status must be 'delivered', current status: '${order.status}'`);
    }

    // 2. Cannot request duplicate returns
    if (order.returnRequested) {
      throw new ValidationError("A return has already been requested for this order.");
    }
  }

  /**
   * Request a return (Infrastructure foundation)
   */
  async requestReturn(userId: string, input: IReturnRequestInput): Promise<IReturnRequest> {
    const { orderId, reason } = input;

    // Validate eligibility
    await this.validateReturnEligibility(orderId, userId);

    if (!reason || reason.trim() === "") {
      throw new ValidationError("A valid reason for return must be specified");
    }

    // Create the return request record
    const request = await returnRepository.create({
      orderId,
      returnReason: reason,
      returnStatus: ReturnStatus.PENDING,
      returnRequestedAt: new Date()
    });

    // Update the corresponding Order document with return requested attributes
    const order = await orderRepository.findById(orderId);
    if (order) {
      order.returnRequested = true;
      order.returnStatus = ReturnStatus.PENDING;
      order.returnReason = reason;
      order.returnRequestedAt = new Date();
      
      // Update timeline
      if (!order.timeline) {
        order.timeline = [];
      }
      order.timeline.push({
        status: "Return Requested",
        timestamp: new Date(),
        note: `Return request initiated. Reason: ${reason}`
      });

      await orderRepository.update(orderId, order as any);
    }

    return request;
  }

  /**
   * Admin validation & processing of return requests (placeholder)
   */
  async processReturn(
    orderId: string, 
    status: ReturnStatus, 
    adminNotes?: string
  ): Promise<IReturnRequest> {
    if (!Object.values(ReturnStatus).includes(status)) {
      throw new ValidationError("Invalid return request status");
    }

    const updatedRequest = await returnRepository.updateStatus(orderId, status, adminNotes);
    if (!updatedRequest) {
      throw new NotFoundError("No return request found for this order");
    }

    // Update the order itself with the decision
    const order = await orderRepository.findById(orderId);
    if (order) {
      order.returnStatus = status;
      if (!order.timeline) {
        order.timeline = [];
      }
      order.timeline.push({
        status: `Return ${status}`,
        timestamp: new Date(),
        note: `Admin return processing updated to: ${status}. Notes: ${adminNotes || "None"}`
      });
      await orderRepository.update(orderId, order as any);
    }

    return updatedRequest;
  }
}

export const returnService = new ReturnService();
