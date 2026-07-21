import { categoryRepository } from "../repositories/categoryRepository";
import { productRepository } from "../repositories/productRepository";
import { ICategory } from "../models/Category";
import { createCategorySchema, updateCategorySchema } from "../validators/categoryValidator";
import { ValidationError, ConflictError, NotFoundError } from "../utils/errors";

export class CategoryService {
  /**
   * Create a new category with slug validation and business checks
   */
  async createCategory(data: any): Promise<ICategory> {
    const parseResult = createCategorySchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError("Category validation failed", parseResult.error.issues);
    }

    const validatedData = parseResult.data;

    // Check name uniqueness (prevent duplicate category names)
    const existingName = await categoryRepository.findByName(validatedData.name);
    if (existingName) {
      throw new ConflictError(`Category with name '${validatedData.name}' already exists`);
    }

    // Check slug uniqueness
    const existingSlug = await categoryRepository.findBySlug(validatedData.slug);
    if (existingSlug) {
      throw new ConflictError(`Category with slug '${validatedData.slug}' already exists`);
    }

    return categoryRepository.create(validatedData);
  }

  /**
   * Retrieve category by unique ID
   */
  async getCategoryById(id: string): Promise<ICategory | null> {
    return categoryRepository.findById(id);
  }

  /**
   * Retrieve category by slug
   */
  async getCategoryBySlug(slug: string): Promise<ICategory | null> {
    return categoryRepository.findBySlug(slug);
  }

  /**
   * Update category with slug collision check
   */
  async updateCategory(id: string, data: any): Promise<ICategory> {
    const parseResult = updateCategorySchema.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError("Category validation failed", parseResult.error.issues);
    }

    const validatedData = parseResult.data;

    // Retrieve existing category
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError("Category not found");
    }

    // Prevent duplicate category names if name is changing
    if (validatedData.name && validatedData.name.toLowerCase() !== category.name.toLowerCase()) {
      const existingName = await categoryRepository.findByName(validatedData.name);
      if (existingName) {
        throw new ConflictError(`Category with name '${validatedData.name}' already exists`);
      }
    }

    // Check unique slug if it's being updated
    if (validatedData.slug && validatedData.slug !== category.slug) {
      const existingSlug = await categoryRepository.findBySlug(validatedData.slug);
      if (existingSlug) {
        throw new ConflictError(`Category with slug '${validatedData.slug}' already exists`);
      }
    }

    const updated = await categoryRepository.update(id, validatedData);
    if (!updated) {
      throw new NotFoundError("Category not found");
    }
    return updated;
  }

  /**
   * Delete category by ID
   */
  async deleteCategory(id: string): Promise<ICategory> {
    // Retrieve existing category to check if it exists
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError("Category not found");
    }

    // Prevent deletion if products reference the category
    const referencingProducts = await productRepository.findAll({ category: id });
    if (referencingProducts.length > 0) {
      throw new ConflictError(
        `Cannot delete category '${category.name}' because it is currently referenced by ${referencingProducts.length} product(s)`
      );
    }

    const deleted = await categoryRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError("Category not found");
    }
    return deleted;
  }

  /**
   * Retrieve all categories using filters
   */
  async getAllCategories(filter: any = {}): Promise<ICategory[]> {
    return categoryRepository.findAll(filter);
  }
}

export const categoryService = new CategoryService();
