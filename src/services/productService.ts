import api from "../lib/api";
import { Product } from "../types";

export interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: Pagination;
}

export const mapProduct = (p: any): Product => {
  if (!p) return p;

  // Resolve category as a string matching its slug (or fallback to id or name)
  let categoryStr = "";
  if (p.category && typeof p.category === "object") {
    categoryStr = p.category.slug || p.category.id || p.category.name || "";
  } else {
    categoryStr = String(p.category || "");
  }

  return {
    id: p.id || p._id,
    name: p.name || "",
    brand: p.brand || "",
    category: categoryStr.toLowerCase(),
    description: p.description || "",
    price: p.price || 0,
    discountPrice: p.discountPrice || p.price || 0,
    rating: p.averageRating !== undefined ? p.averageRating : (p.rating || 0),
    reviewsCount: p.totalReviews !== undefined ? p.totalReviews : (p.reviewsCount || 0),
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ["https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80"],
    specifications: p.specifications || {},
    isFeatured: p.isFeatured || false,
    isNew: p.isNew !== undefined ? p.isNew : (new Date(p.createdAt || Date.now()).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000),
    stock: p.stock !== undefined ? p.stock : 10,
  };
};

export const productService = {
  /**
   * Get all products with query parameters for advanced filtering, sorting, pagination
   */
  async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    featured?: boolean;
    active?: boolean;
  }): Promise<ProductsResponse> {
    const response = await api.get("/products", { params });
    const { products, pagination } = response.data.data;
    return {
      products: products.map(mapProduct),
      pagination,
    };
  },

  /**
   * Get product by ID or Slug
   */
  async getProductById(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return mapProduct(response.data.data.product);
  },

  /**
   * Get featured products
   */
  async getFeaturedProducts(): Promise<Product[]> {
    const response = await api.get("/products/featured");
    const products = response.data.data.products;
    return products.map(mapProduct);
  },

  /**
   * Get latest products
   */
  async getLatestProducts(limit?: number): Promise<Product[]> {
    const response = await api.get("/products/latest", { params: { limit } });
    const products = response.data.data.products;
    return products.map(mapProduct);
  },

  /**
   * Get active categories with product counts
   */
  async getCategories(): Promise<any[]> {
    const response = await api.get("/products/categories");
    return response.data.data.categories;
  },

  /**
   * Create a new product (Admin)
   */
  async createProduct(data: any): Promise<Product> {
    const response = await api.post("/products", data);
    return mapProduct(response.data.data.product);
  },

  /**
   * Update an existing product (Admin)
   */
  async updateProduct(id: string, data: any): Promise<Product> {
    const response = await api.put(`/products/${id}`, data);
    return mapProduct(response.data.data.product);
  },

  /**
   * Delete a product by ID (Admin)
   */
  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};
