import { z } from "zod";

export const createAddressSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z.string().trim().min(1, "Phone number is required"),
  addressLine1: z.string().trim().min(1, "Address Line 1 is required"),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().min(1, "Country is required"),
  landmark: z.string().trim().optional(),
  addressType: z.enum(["Home", "Work", "Other"]).optional().default("Home"),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").optional(),
  phone: z.string().trim().min(1, "Phone number is required").optional(),
  addressLine1: z.string().trim().min(1, "Address Line 1 is required").optional(),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required").optional(),
  state: z.string().trim().min(1, "State is required").optional(),
  postalCode: z.string().trim().min(1, "Postal code is required").optional(),
  country: z.string().trim().min(1, "Country is required").optional(),
  landmark: z.string().trim().optional(),
  addressType: z.enum(["Home", "Work", "Other"]).optional(),
  isDefault: z.boolean().optional(),
});
