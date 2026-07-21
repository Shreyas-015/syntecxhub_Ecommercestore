import { Request, Response } from "express";
import { User } from "../models/User";
import { Order } from "../models/Order";
import { ApiResponse } from "../utils/response";
import { NotFoundError, ValidationError } from "../utils/errors";
import mongoose from "mongoose";

export class AdminUserController {
  /**
   * List all customers with aggregate order statistics
   * GET /api/admin/users
   */
  async getAllCustomers(req: Request, res: Response) {
    const customers = await User.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "user",
          as: "orders",
        },
      },
      {
        $project: {
          id: { $toString: "$_id" },
          firstName: 1,
          lastName: 1,
          name: { $concat: ["$firstName", " ", "$lastName"] },
          email: 1,
          phone: 1,
          role: 1,
          isActive: 1,
          isVerified: 1,
          createdAt: 1,
          orderCount: { $size: "$orders" },
          totalSpent: {
            $reduce: {
              input: "$orders",
              initialValue: 0,
              in: { $add: ["$$value", "$$this.total"] },
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return ApiResponse.success(res, "Customers retrieved successfully", { customers });
  }

  /**
   * Get customer details, orders, saved addresses
   * GET /api/admin/users/:id
   */
  async getCustomerById(req: Request, res: Response) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid customer ID format");
    }

    const user = await User.findById(id).select("-password -refreshToken");
    if (!user) {
      throw new NotFoundError("Customer not found");
    }

    // Fetch all orders for this customer
    const orders = await Order.find({ user: id }).sort({ createdAt: -1 });

    const totalSpent = orders.reduce((acc, order) => acc + order.total, 0);

    return ApiResponse.success(res, "Customer details retrieved successfully", {
      customer: {
        ...user.toJSON(),
        orderCount: orders.length,
        totalSpent,
      },
      orders,
    });
  }

  /**
   * Enable or Disable user account
   * PATCH /api/admin/users/:id/status
   */
  async toggleUserStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid customer ID format");
    }

    if (typeof isActive !== "boolean") {
      throw new ValidationError("isActive status must be a boolean");
    }

    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true }).select("-password -refreshToken");
    if (!user) {
      throw new NotFoundError("Customer not found");
    }

    return ApiResponse.success(
      res,
      `Customer account ${isActive ? "activated" : "deactivated"} successfully`,
      { customer: user }
    );
  }

  /**
   * Reset Password (Placeholder mock)
   * POST /api/admin/users/:id/reset-password
   */
  async resetUserPassword(req: Request, res: Response) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid customer ID format");
    }

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError("Customer not found");
    }

    // Set a default/temporary password for reset
    user.password = "Temp@123456";
    await user.save();

    return ApiResponse.success(
      res,
      `Temporary password successfully set to "Temp@123456". Please advise customer to update it on login.`,
      { customer: user.toSafeObject() }
    );
  }
}

export const adminUserController = new AdminUserController();
