import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { addressService } from "../services/addressService";
import { ApiResponse } from "../utils/response";
import { UnauthorizedError, ValidationError } from "../utils/errors";
import mongoose from "mongoose";

export class AddressController {
  /**
   * Get all addresses for the authenticated user
   */
  async getAddresses(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const addresses = await addressService.getUserAddresses(userId);
    return ApiResponse.success(res, "Addresses retrieved successfully", addresses);
  }

  /**
   * Get a specific address by ID
   */
  async getAddressById(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid address ID format");
    }

    const address = await addressService.getAddressById(id, userId);
    return ApiResponse.success(res, "Address retrieved successfully", address);
  }

  /**
   * Create a new address
   */
  async createAddress(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const address = await addressService.createAddress(userId, req.body);
    return ApiResponse.success(res, "Address created successfully", address, 201);
  }

  /**
   * Update an address by ID
   */
  async updateAddress(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid address ID format");
    }

    const address = await addressService.updateAddress(id, userId, req.body);
    return ApiResponse.success(res, "Address updated successfully", address);
  }

  /**
   * Delete an address by ID
   */
  async deleteAddress(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid address ID format");
    }

    await addressService.deleteAddress(id, userId);
    return ApiResponse.success(res, "Address deleted successfully", null);
  }

  /**
   * Set an address as the default for the user
   */
  async setDefaultAddress(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User is not authenticated");
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid address ID format");
    }

    const address = await addressService.setDefaultAddress(id, userId);
    return ApiResponse.success(res, "Default address set successfully", address);
  }
}

export const addressController = new AddressController();
