import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").optional().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});
