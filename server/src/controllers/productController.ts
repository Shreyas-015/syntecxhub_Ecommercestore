import { Request, Response } from "express";
import mongoose from "mongoose";
import { productService } from "../services/productService";
import { ApiResponse } from "../utils/response";
import { NotFoundError, ValidationError } from "../utils/errors";

export class ProductController {
  /**
   * Create a new product
   */
  async createProduct(req: Request, res: Response) {
    const product = await productService.createProduct(req.body);
    return ApiResponse.success(res, "Product created successfully", { product }, 201);
  }

  /**
   * Get product by ID or Slug
   */
  async getProductById(req: Request, res: Response) {
    const { id } = req.params;
    let product = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await productService.getProductById(id);
    } else {
      product = await productService.getProductBySlug(id);
    }

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return ApiResponse.success(res, "Product retrieved successfully", { product }, 200);
  }

  /**
   * Update an existing product
   */
  async updateProduct(req: Request, res: Response) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid product ID format");
    }

    const product = await productService.updateProduct(id, req.body);
    return ApiResponse.success(res, "Product updated successfully", { product }, 200);
  }

  /**
   * Delete product by ID
   */
  async deleteProduct(req: Request, res: Response) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid product ID format");
    }

    await productService.deleteProduct(id);
    return ApiResponse.success(res, "Product deleted successfully", null, 200);
  }

  /**
   * Get all products (with advanced search, pagination, filtering, and sorting)
   */
  async getAllProducts(req: Request, res: Response) {
    const result = await productService.getAdvancedProducts(req.query);
    return ApiResponse.success(res, "Products retrieved successfully", result, 200);
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(req: Request, res: Response) {
    const products = await productService.getFeaturedProducts();
    return ApiResponse.success(res, "Featured products retrieved successfully", { products }, 200);
  }

  /**
   * Get latest products
   */
  async getLatestProducts(req: Request, res: Response) {
    const limitQuery = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const limit = isNaN(limitQuery) || limitQuery < 1 ? 10 : limitQuery;
    const products = await productService.getLatestProducts(limit);
    return ApiResponse.success(res, "Latest products retrieved successfully", { products }, 200);
  }

  /**
   * Get active categories with product counts
   */
  async getCategoriesWithCounts(req: Request, res: Response) {
    const categories = await productService.getCategoriesWithCounts();
    return ApiResponse.success(res, "Categories with product counts retrieved successfully", { categories }, 200);
  }
}

export const productController = new ProductController();
