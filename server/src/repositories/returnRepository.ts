import { IReturnRequest, ReturnStatus } from "../types/return";
import mongoose from "mongoose";

// In-memory map for mock mode return requests
export const mockReturnRequests = new Map<string, IReturnRequest>();

export class ReturnRepository {
  /**
   * Find a return request by order ID
   */
  async findByOrderId(orderId: string): Promise<IReturnRequest | null> {
    const found = Array.from(mockReturnRequests.values()).find(
      (req) => req.orderId.toString() === orderId.toString()
    );
    return found || null;
  }

  /**
   * Save a return request to mock map or database
   */
  async create(returnRequestData: Partial<IReturnRequest>): Promise<IReturnRequest> {
    const id = returnRequestData.id || new mongoose.Types.ObjectId().toString();
    const returnRequest: IReturnRequest = {
      id,
      orderId: returnRequestData.orderId!,
      returnRequested: true,
      returnStatus: returnRequestData.returnStatus || ReturnStatus.PENDING,
      returnReason: returnRequestData.returnReason || "Unspecified",
      returnRequestedAt: returnRequestData.returnRequestedAt || new Date(),
      adminNotes: returnRequestData.adminNotes
    };
    mockReturnRequests.set(id, returnRequest);
    return returnRequest;
  }

  /**
   * Update return request status
   */
  async updateStatus(orderId: string, status: ReturnStatus, adminNotes?: string): Promise<IReturnRequest | null> {
    const existing = await this.findByOrderId(orderId);
    if (!existing) return null;

    existing.returnStatus = status;
    existing.processedAt = new Date();
    if (adminNotes !== undefined) {
      existing.adminNotes = adminNotes;
    }

    mockReturnRequests.set(existing.id!, existing);
    return existing;
  }
}

export const returnRepository = new ReturnRepository();
