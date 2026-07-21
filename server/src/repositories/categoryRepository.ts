import mongoose from "mongoose";
import { Category, ICategory } from "../models/Category";

const mockCategories = new Map<string, any>();

export class InMemoryCategory {
  id: string;
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this.id = data.id || data._id || Math.random().toString(36).substring(2, 15);
    this._id = this.id;
    this.name = data.name || "";
    this.slug = data.slug || "";
    this.description = data.description;
    this.image = data.image;
    this.isActive = data.isActive !== false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      image: this.image,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  async save(): Promise<any> {
    this.updatedAt = new Date();
    mockCategories.set(this.id, this);
    return this;
  }
}

export class CategoryRepository {
  private isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async findById(id: string): Promise<ICategory | null> {
    if (!this.isConnected()) {
      const mockCategory = mockCategories.get(id);
      return mockCategory ? (mockCategory as unknown as ICategory) : null;
    }
    return Category.findById(id);
  }

  async findBySlug(slug: string): Promise<ICategory | null> {
    if (!this.isConnected()) {
      for (const category of mockCategories.values()) {
        if (category.slug === slug) {
          return category as unknown as ICategory;
        }
      }
      return null;
    }
    return Category.findOne({ slug });
  }

  async findByName(name: string): Promise<ICategory | null> {
    if (!this.isConnected()) {
      const lowerName = name.toLowerCase();
      for (const category of mockCategories.values()) {
        if (category.name.toLowerCase() === lowerName) {
          return category as unknown as ICategory;
        }
      }
      return null;
    }
    return Category.findOne({ name: { $regex: new RegExp("^" + name + "$", "i") } });
  }

  async create(categoryData: Partial<ICategory>): Promise<ICategory> {
    if (!this.isConnected()) {
      const newCategory = new InMemoryCategory(categoryData);
      mockCategories.set(newCategory.id, newCategory);
      return newCategory as unknown as ICategory;
    }
    const category = new Category(categoryData);
    return category.save();
  }

  async update(id: string, updateData: Partial<ICategory>): Promise<ICategory | null> {
    if (!this.isConnected()) {
      const mockCategory = mockCategories.get(id);
      if (!mockCategory) return null;

      if (updateData.name !== undefined) mockCategory.name = updateData.name;
      if (updateData.slug !== undefined) mockCategory.slug = updateData.slug;
      if (updateData.description !== undefined) mockCategory.description = updateData.description;
      if (updateData.image !== undefined) mockCategory.image = updateData.image;
      if (updateData.isActive !== undefined) mockCategory.isActive = updateData.isActive;

      mockCategory.updatedAt = new Date();
      mockCategories.set(id, mockCategory);
      return mockCategory as unknown as ICategory;
    }
    return Category.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<ICategory | null> {
    if (!this.isConnected()) {
      const mockCategory = mockCategories.get(id);
      if (!mockCategory) return null;
      mockCategories.delete(id);
      return mockCategory as unknown as ICategory;
    }
    return Category.findByIdAndDelete(id);
  }

  async findAll(filter: any = {}): Promise<ICategory[]> {
    if (!this.isConnected()) {
      const all = Array.from(mockCategories.values());
      const filtered = all.filter(c => {
        if (filter.isActive !== undefined && c.isActive !== filter.isActive) return false;
        return true;
      });
      return filtered as unknown as ICategory[];
    }
    return Category.find(filter);
  }
}

export const categoryRepository = new CategoryRepository();
export { mockCategories };
