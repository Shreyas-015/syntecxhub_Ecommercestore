import { z } from "zod";

// Password complexity pattern: At least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character
const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one digit")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().toLowerCase().email("Invalid email address format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address format"),
  password: z.string().min(1, "Password is required"),
});

const addressSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  label: z.string().optional(),
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  addressLine1: z.string().trim().min(1, "Address line 1 is required"),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  zipCode: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().optional(),
  isDefault: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long").optional(),
  email: z.string().trim().email("Invalid email address format").optional(),
  phone: z.string().trim().min(7, "Phone number must be at least 7 characters").optional(),
  avatarUrl: z.string().url("Invalid avatar image URL").optional().or(z.literal("")).optional(),
  addresses: z.array(addressSchema).optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: strongPasswordSchema,
});
