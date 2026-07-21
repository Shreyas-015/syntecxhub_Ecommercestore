import { productRepository } from "../repositories/productRepository";
import { categoryRepository } from "../repositories/categoryRepository";
import { IProduct } from "../models/Product";
import { createProductSchema, updateProductSchema } from "../validators/productValidator";
import { ValidationError, ConflictError, NotFoundError } from "../utils/errors";

export class ProductService {
  /**
   * Create a new product with comprehensive integrity and uniqueness checks
   */
  async createProduct(data: any): Promise<IProduct> {
    const parseResult = createProductSchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError("Product validation failed", parseResult.error.issues);
    }

    const validatedData = parseResult.data;

    // 1. Verify slug uniqueness
    const existingSlug = await productRepository.findBySlug(validatedData.slug);
    if (existingSlug) {
      throw new ConflictError(`Product with slug '${validatedData.slug}' already exists`);
    }

    // 2. Verify SKU uniqueness if provided
    if (validatedData.sku) {
      const existingSku = await productRepository.findBySku(validatedData.sku);
      if (existingSku) {
        throw new ConflictError(`Product with SKU '${validatedData.sku}' already exists`);
      }
    }

    // 3. Verify referenced Category existence if provided
    if (validatedData.category) {
      const categoryExists = await categoryRepository.findById(validatedData.category);
      if (!categoryExists) {
        throw new NotFoundError(`Referenced Category with ID '${validatedData.category}' not found`);
      }
    }

    return productRepository.create(validatedData as any);
  }

  /**
   * Retrieve a product by unique ID
   */
  async getProductById(id: string): Promise<IProduct | null> {
    return productRepository.findById(id);
  }

  /**
   * Retrieve a product by slug
   */
  async getProductBySlug(slug: string): Promise<IProduct | null> {
    return productRepository.findBySlug(slug);
  }

  /**
   * Update a product with collision and relational integrity checks
   */
  async updateProduct(id: string, data: any): Promise<IProduct> {
    const parseResult = updateProductSchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError("Product validation failed", parseResult.error.issues);
    }

    const validatedData = parseResult.data;

    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // 1. Check unique slug if it's changing
    if (validatedData.slug && validatedData.slug !== product.slug) {
      const existingSlug = await productRepository.findBySlug(validatedData.slug);
      if (existingSlug) {
        throw new ConflictError(`Product with slug '${validatedData.slug}' already exists`);
      }
    }

    // 2. Check unique SKU if it's changing
    if (validatedData.sku && validatedData.sku !== product.sku) {
      const existingSku = await productRepository.findBySku(validatedData.sku);
      if (existingSku) {
        throw new ConflictError(`Product with SKU '${validatedData.sku}' already exists`);
      }
    }

    // 3. Check referenced Category existence if changing
    if (validatedData.category) {
      const categoryExists = await categoryRepository.findById(validatedData.category);
      if (!categoryExists) {
        throw new NotFoundError(`Referenced Category with ID '${validatedData.category}' not found`);
      }
    }

    const updated = await productRepository.update(id, validatedData as any);
    if (!updated) {
      throw new NotFoundError("Product not found");
    }
    return updated;
  }

  /**
   * Delete a product by ID
   */
  async deleteProduct(id: string): Promise<IProduct> {
    const deleted = await productRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError("Product not found");
    }
    return deleted;
  }

  /**
   * Retrieve all products using filters (legacy method retained for compatibility)
   */
  async getAllProducts(filter: any = {}): Promise<IProduct[]> {
    return productRepository.findAll(filter);
  }

  /**
   * Retrieve products using advanced filtering, search, sorting, and pagination
   */
  async getAdvancedProducts(queryParams: any): Promise<any> {
    const page = queryParams.page ? parseInt(queryParams.page as string, 10) : 1;
    const limit = queryParams.limit ? parseInt(queryParams.limit as string, 10) : 10;

    if (isNaN(page) || page < 1) {
      throw new ValidationError("Invalid page value. Page must be a positive integer.");
    }
    if (isNaN(limit) || limit < 1) {
      throw new ValidationError("Invalid limit value. Limit must be a positive integer.");
    }

    const options: any = {
      page,
      limit,
    };

    if (queryParams.search) {
      options.search = String(queryParams.search).trim();
    }

    if (queryParams.category) {
      options.category = String(queryParams.category).trim();
    }

    if (queryParams.brand) {
      options.brand = String(queryParams.brand).trim();
    }

    if (queryParams.minPrice !== undefined && queryParams.minPrice !== "") {
      const minPrice = parseFloat(queryParams.minPrice as string);
      if (isNaN(minPrice) || minPrice < 0) {
        throw new ValidationError("Invalid filter: minPrice must be a non-negative number.");
      }
      options.minPrice = minPrice;
    }

    if (queryParams.maxPrice !== undefined && queryParams.maxPrice !== "") {
      const maxPrice = parseFloat(queryParams.maxPrice as string);
      if (isNaN(maxPrice) || maxPrice < 0) {
        throw new ValidationError("Invalid filter: maxPrice must be a non-negative number.");
      }
      options.maxPrice = maxPrice;
    }

    if (options.minPrice !== undefined && options.maxPrice !== undefined && options.minPrice > options.maxPrice) {
      throw new ValidationError("Invalid filter: minPrice cannot be greater than maxPrice.");
    }

    if (queryParams.featured !== undefined && queryParams.featured !== "") {
      options.featured = queryParams.featured === "true" || queryParams.featured === true;
    }

    if (queryParams.active !== undefined && queryParams.active !== "") {
      options.active = queryParams.active === "true" || queryParams.active === true;
    }

    if (queryParams.inStock !== undefined && queryParams.inStock !== "") {
      options.inStock = queryParams.inStock === "true" || queryParams.inStock === true;
    }

    if (queryParams.sort) {
      const validSorts = ["newest", "oldest", "priceAsc", "priceDesc", "rating", "popular", "nameAsc", "nameDesc"];
      if (!validSorts.includes(queryParams.sort as string)) {
        throw new ValidationError(`Invalid sort value. Must be one of: ${validSorts.join(", ")}`);
      }
      options.sort = queryParams.sort as string;
    }

    const { products, totalItems } = await productRepository.findAdvanced(options);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      products,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Retrieve active featured products
   */
  async getFeaturedProducts(): Promise<IProduct[]> {
    return productRepository.findAll({ isFeatured: true, isActive: true });
  }

  /**
   * Retrieve latest active products
   */
  async getLatestProducts(limit: number = 10): Promise<IProduct[]> {
    const { products } = await productRepository.findAdvanced({
      page: 1,
      limit,
      active: true,
      sort: "newest",
    });
    return products;
  }

  /**
   * Retrieve active categories with product counts
   */
  async getCategoriesWithCounts(): Promise<any[]> {
    return productRepository.getCategoriesWithProductCounts();
  }
}

export const productService = new ProductService();
