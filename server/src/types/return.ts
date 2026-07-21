export enum ReturnStatus {
  NONE = "None",
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected"
}

export interface IReturnRequestInput {
  orderId: string;
  reason: string;
  notes?: string;
}

export interface IReturnRequest {
  id?: string;
  orderId: string;
  returnRequested: boolean;
  returnStatus: ReturnStatus;
  returnReason: string;
  returnRequestedAt: Date;
  processedAt?: Date;
  adminNotes?: string;
}
