import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  slug: z.string().trim().min(1, "Product slug is required"),
  description: z.string().trim().min(1, "Product description is required"),
  shortDescription: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  discountPrice: z.number().min(0, "Discount price must be greater than or equal to 0").optional(),
  category: z.string().optional(), // Can support mongoose ObjectId or general mock IDs
  images: z.array(z.string()).optional(),
  thumbnail: z.string().trim().optional(),
  stock: z.number().int().min(0, "Stock must be greater than or equal to 0").default(0),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  averageRating: z.number().min(0).max(5).optional(),
  totalReviews: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  specifications: z.record(z.string(), z.any()).optional(),
});

export const updateProductSchema = createProductSchema.partial();
