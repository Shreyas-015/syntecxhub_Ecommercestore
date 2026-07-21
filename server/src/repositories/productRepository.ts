import mongoose from "mongoose";
import { Product, IProduct } from "../models/Product";
import { Category } from "../models/Category";
import { mockCategories } from "./categoryRepository";

export const mockProducts = new Map<string, any>();

export interface FindProductsOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  active?: boolean;
  inStock?: boolean;
  sort?: string;
}

export class InMemoryProduct {
  id: string;
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand?: string;
  sku?: string;
  price: number;
  discountPrice?: number;
  category?: any;
  images: string[];
  thumbnail?: string;
  stock: number;
  isFeatured: boolean;
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
  tags: string[];
  specifications?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this.id = data.id || data._id || Math.random().toString(36).substring(2, 15);
    this._id = this.id;
    this.name = data.name || "";
    this.slug = data.slug || "";
    this.description = data.description || "";
    this.shortDescription = data.shortDescription;
    this.brand = data.brand;
    this.sku = data.sku;
    this.price = data.price || 0;
    this.discountPrice = data.discountPrice;
    this.category = data.category;
    this.images = data.images || [];
    this.thumbnail = data.thumbnail;
    this.stock = data.stock || 0;
    this.isFeatured = data.isFeatured || false;
    this.isActive = data.isActive !== false;
    this.averageRating = data.averageRating || 0;
    this.totalReviews = data.totalReviews || 0;
    this.tags = data.tags || [];
    this.specifications = data.specifications;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toJSON() {
    // Mimic mongoose populate of category object if present in mockCategories
    let populatedCategory = this.category;
    if (typeof this.category === "string" && mockCategories.has(this.category)) {
      populatedCategory = mockCategories.get(this.category).toJSON();
    }

    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      shortDescription: this.shortDescription,
      brand: this.brand,
      sku: this.sku,
      price: this.price,
      discountPrice: this.discountPrice,
      category: populatedCategory,
      images: this.images,
      thumbnail: this.thumbnail,
      stock: this.stock,
      isFeatured: this.isFeatured,
      isActive: this.isActive,
      averageRating: this.averageRating,
      totalReviews: this.totalReviews,
      tags: this.tags,
      specifications: this.specifications,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  async save(): Promise<any> {
    this.updatedAt = new Date();
    mockProducts.set(this.id, this);
    return this;
  }
}

export class ProductRepository {
  private isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async findById(id: string): Promise<IProduct | null> {
    if (!this.isConnected()) {
      const mockProduct = mockProducts.get(id);
      return mockProduct ? (mockProduct as unknown as IProduct) : null;
    }
    return Product.findById(id).populate("category");
  }

  async findBySlug(slug: string): Promise<IProduct | null> {
    if (!this.isConnected()) {
      for (const product of mockProducts.values()) {
        if (product.slug === slug) {
          return product as unknown as IProduct;
        }
      }
      return null;
    }
    return Product.findOne({ slug }).populate("category");
  }

  async findBySku(sku: string): Promise<IProduct | null> {
    if (!this.isConnected()) {
      for (const product of mockProducts.values()) {
        if (product.sku === sku) {
          return product as unknown as IProduct;
        }
      }
      return null;
    }
    return Product.findOne({ sku }).populate("category");
  }

  async create(productData: Partial<IProduct>): Promise<IProduct> {
    if (!this.isConnected()) {
      const newProduct = new InMemoryProduct(productData);
      mockProducts.set(newProduct.id, newProduct);
      return newProduct as unknown as IProduct;
    }
    const product = new Product(productData);
    const saved = await product.save();
    return saved.populate("category");
  }

  async update(id: string, updateData: Partial<IProduct>): Promise<IProduct | null> {
    if (!this.isConnected()) {
      const mockProduct = mockProducts.get(id);
      if (!mockProduct) return null;

      if (updateData.name !== undefined) mockProduct.name = updateData.name;
      if (updateData.slug !== undefined) mockProduct.slug = updateData.slug;
      if (updateData.description !== undefined) mockProduct.description = updateData.description;
      if (updateData.shortDescription !== undefined) mockProduct.shortDescription = updateData.shortDescription;
      if (updateData.brand !== undefined) mockProduct.brand = updateData.brand;
      if (updateData.sku !== undefined) mockProduct.sku = updateData.sku;
      if (updateData.price !== undefined) mockProduct.price = updateData.price;
      if (updateData.discountPrice !== undefined) mockProduct.discountPrice = updateData.discountPrice;
      if (updateData.category !== undefined) mockProduct.category = updateData.category;
      if (updateData.images !== undefined) mockProduct.images = updateData.images;
      if (updateData.thumbnail !== undefined) mockProduct.thumbnail = updateData.thumbnail;
      if (updateData.stock !== undefined) mockProduct.stock = updateData.stock;
      if (updateData.isFeatured !== undefined) mockProduct.isFeatured = updateData.isFeatured;
      if (updateData.isActive !== undefined) mockProduct.isActive = updateData.isActive;
      if (updateData.averageRating !== undefined) mockProduct.averageRating = updateData.averageRating;
      if (updateData.totalReviews !== undefined) mockProduct.totalReviews = updateData.totalReviews;
      if (updateData.tags !== undefined) mockProduct.tags = updateData.tags;
      if (updateData.specifications !== undefined) mockProduct.specifications = updateData.specifications;

      mockProduct.updatedAt = new Date();
      mockProducts.set(id, mockProduct);
      return mockProduct as unknown as IProduct;
    }
    return Product.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).populate("category");
  }

  async delete(id: string): Promise<IProduct | null> {
    if (!this.isConnected()) {
      const mockProduct = mockProducts.get(id);
      if (!mockProduct) return null;
      mockProducts.delete(id);
      return mockProduct as unknown as IProduct;
    }
    return Product.findByIdAndDelete(id);
  }

  async findAll(filter: any = {}): Promise<IProduct[]> {
    if (!this.isConnected()) {
      const all = Array.from(mockProducts.values());
      const filtered = all.filter(p => {
        if (filter.isActive !== undefined && p.isActive !== filter.isActive) return false;
        if (filter.category !== undefined && String(p.category) !== String(filter.category)) return false;
        if (filter.isFeatured !== undefined && p.isFeatured !== filter.isFeatured) return false;
        return true;
      });
      return filtered as unknown as IProduct[];
    }
    return Product.find(filter).populate("category");
  }

  async findAdvanced(options: FindProductsOptions): Promise<{ products: IProduct[]; totalItems: number }> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 10;
    const skip = (page - 1) * limit;

    if (!this.isConnected()) {
      let all = Array.from(mockProducts.values());

      // Search
      if (options.search) {
        const searchRegex = new RegExp(options.search, "i");
        all = all.filter(p => 
          searchRegex.test(p.name) || 
          searchRegex.test(p.brand || "") || 
          searchRegex.test(p.shortDescription || "") || 
          (p.tags && p.tags.some((tag: string) => searchRegex.test(tag)))
        );
      }

      // Filter by category
      if (options.category) {
        const catIdOrSlug = String(options.category);
        const catObj = mockCategories.get(catIdOrSlug) || Array.from(mockCategories.values()).find(c => c.slug === catIdOrSlug || c.id === catIdOrSlug);
        const resolvedId = catObj ? catObj.id : catIdOrSlug;
        all = all.filter(p => String(p.category) === resolvedId || String(p.category) === catIdOrSlug);
      }

      // Filter by brand
      if (options.brand) {
        all = all.filter(p => p.brand && p.brand.toLowerCase() === options.brand!.toLowerCase());
      }

      // Filter by price range
      if (options.minPrice !== undefined) {
        all = all.filter(p => p.price >= options.minPrice!);
      }
      if (options.maxPrice !== undefined) {
        all = all.filter(p => p.price <= options.maxPrice!);
      }

      // Filter by featured
      if (options.featured !== undefined) {
        all = all.filter(p => p.isFeatured === options.featured);
      }

      // Filter by active
      if (options.active !== undefined) {
        all = all.filter(p => p.isActive === options.active);
      }

      // Filter by inStock
      if (options.inStock !== undefined) {
        if (options.inStock) {
          all = all.filter(p => p.stock > 0);
        } else {
          all = all.filter(p => p.stock <= 0);
        }
      }

      // Sort
      if (options.sort) {
        switch (options.sort) {
          case "newest":
            all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            break;
          case "oldest":
            all.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            break;
          case "priceAsc":
            all.sort((a, b) => a.price - b.price);
            break;
          case "priceDesc":
            all.sort((a, b) => b.price - a.price);
            break;
          case "rating":
            all.sort((a, b) => b.averageRating - a.averageRating);
            break;
          case "popular":
            all.sort((a, b) => b.totalReviews - a.totalReviews);
            break;
          case "nameAsc":
            all.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case "nameDesc":
            all.sort((a, b) => b.name.localeCompare(a.name));
            break;
        }
      } else {
        // default newest
        all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      const totalItems = all.length;
      const paginated = all.slice(skip, skip + limit).map(p => {
        if (p instanceof InMemoryProduct) {
          return p;
        }
        return new InMemoryProduct(p);
      });

      return {
        products: paginated as unknown as IProduct[],
        totalItems,
      };
    }

    // Real database query
    const query: any = {};

    if (options.search) {
      const searchRegex = new RegExp(options.search, "i");
      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { shortDescription: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    if (options.category) {
      if (mongoose.Types.ObjectId.isValid(options.category)) {
        query.category = options.category;
      } else {
        const categoryDoc = await Category.findOne({ slug: options.category }).lean().exec();
        if (categoryDoc) {
          query.category = categoryDoc._id;
        } else {
          query.category = new mongoose.Types.ObjectId();
        }
      }
    }

    if (options.brand) {
      query.brand = { $regex: new RegExp("^" + options.brand + "$", "i") };
    }

    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      query.price = {};
      if (options.minPrice !== undefined) {
        query.price.$gte = options.minPrice;
      }
      if (options.maxPrice !== undefined) {
        query.price.$lte = options.maxPrice;
      }
    }

    if (options.featured !== undefined) {
      query.isFeatured = options.featured;
    }

    if (options.active !== undefined) {
      query.isActive = options.active;
    }

    if (options.inStock !== undefined) {
      if (options.inStock) {
        query.stock = { $gt: 0 };
      } else {
        query.stock = { $lte: 0 };
      }
    }

    let sortObj: any = { createdAt: -1 };
    if (options.sort) {
      switch (options.sort) {
        case "newest":
          sortObj = { createdAt: -1 };
          break;
        case "oldest":
          sortObj = { createdAt: 1 };
          break;
        case "priceAsc":
          sortObj = { price: 1 };
          break;
        case "priceDesc":
          sortObj = { price: -1 };
          break;
        case "rating":
          sortObj = { averageRating: -1 };
          break;
        case "popular":
          sortObj = { totalReviews: -1 };
          break;
        case "nameAsc":
          sortObj = { name: 1 };
          break;
        case "nameDesc":
          sortObj = { name: -1 };
          break;
      }
    }

    const [products, totalItems] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate("category")
        .lean()
        .exec(),
      Product.countDocuments(query).exec(),
    ]);

    return {
      products: products as unknown as IProduct[],
      totalItems,
    };
  }

  async getCategoriesWithProductCounts(): Promise<any[]> {
    if (!this.isConnected()) {
      const activeCategories = Array.from(mockCategories.values()).filter(c => c.isActive);
      const activeProducts = Array.from(mockProducts.values()).filter(p => p.isActive);

      return activeCategories.map(cat => {
        const productCount = activeProducts.filter(p => String(p.category) === String(cat.id)).length;
        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image,
          isActive: cat.isActive,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
          productCount,
        };
      });
    }

    // Real DB query
    const activeCategories = await Category.find({ isActive: true }).lean().exec();
    
    // Aggregate product counts for active products
    const counts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const countMap = new Map(counts.map(c => [c._id ? c._id.toString() : "", c.count]));

    return activeCategories.map((cat: any) => {
      const catId = cat._id ? cat._id.toString() : cat.id;
      const populatedCat = {
        id: catId,
        ...cat,
      };
      delete populatedCat._id;
      delete populatedCat.__v;
      return {
        ...populatedCat,
        productCount: countMap.get(catId) || 0,
      };
    });
  }
}

export const productRepository = new ProductRepository();
