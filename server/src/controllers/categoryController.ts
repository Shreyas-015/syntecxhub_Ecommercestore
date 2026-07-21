import { Request, Response } from "express";
import mongoose from "mongoose";
import { categoryService } from "../services/categoryService";
import { ApiResponse } from "../utils/response";
import { NotFoundError, ValidationError } from "../utils/errors";

export class CategoryController {
  /**
   * Create a new category
   */
  async createCategory(req: Request, res: Response) {
    const category = await categoryService.createCategory(req.body);
    return ApiResponse.success(res, "Category created successfully", { category }, 201);
  }

  /**
   * Get category by ID or Slug
   */
  async getCategoryById(req: Request, res: Response) {
    const { id } = req.params;
    let category = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      category = await categoryService.getCategoryById(id);
    } else {
      category = await categoryService.getCategoryBySlug(id);
    }

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    return ApiResponse.success(res, "Category retrieved successfully", { category }, 200);
  }

  /**
   * Update an existing category
   */
  async updateCategory(req: Request, res: Response) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid category ID format");
    }

    const category = await categoryService.updateCategory(id, req.body);
    return ApiResponse.success(res, "Category updated successfully", { category }, 200);
  }

  /**
   * Delete category by ID
   */
  async deleteCategory(req: Request, res: Response) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid category ID format");
    }

    await categoryService.deleteCategory(id);
    return ApiResponse.success(res, "Category deleted successfully", null, 200);
  }

  /**
   * Get all categories
   */
  async getAllCategories(req: Request, res: Response) {
    const categories = await categoryService.getAllCategories(req.query);
    return ApiResponse.success(res, "Categories retrieved successfully", { categories }, 200);
  }
}

export const categoryController = new CategoryController();
