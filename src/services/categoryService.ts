import api from "../lib/api";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const categoryService = {
  /**
   * Fetch all categories
   */
  async getAllCategories(): Promise<CategoryItem[]> {
    // We can also fetch counts from /products/categories
    const countsRes = await api.get("/products/categories");
    const categoriesWithCounts = countsRes.data.data.categories || [];

    const res = await api.get("/categories");
    const categories = res.data.data.categories || res.data.data || [];

    // Map counts to the category objects
    return categories.map((cat: any) => {
      const match = categoriesWithCounts.find(
        (c: any) => c._id === cat.id || c._id === cat._id || c.name?.toLowerCase() === cat.name?.toLowerCase()
      );
      return {
        ...cat,
        id: cat.id || cat._id,
        productCount: match ? match.count : 0,
      };
    });
  },

  /**
   * Create a category
   */
  async createCategory(data: Partial<CategoryItem>): Promise<CategoryItem> {
    const res = await api.post("/categories", data);
    return res.data.data.category || res.data.data;
  },

  /**
   * Update category
   */
  async updateCategory(id: string, data: Partial<CategoryItem>): Promise<CategoryItem> {
    const res = await api.put(`/categories/${id}`, data);
    return res.data.data.category || res.data.data;
  },

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
