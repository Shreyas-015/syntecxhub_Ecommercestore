import { z } from "zod";
import { PaymentMethod } from "../types/order";

export const checkoutSchema = z.object({
  shippingAddressId: z.string().trim().min(1, "Shipping address ID is required"),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    message: `Invalid payment method. Allowed values are: ${Object.values(PaymentMethod).join(", ")}`,
  }),
  notes: z.string().trim().optional(),
  couponCode: z.string().trim().optional(),
  shippingOption: z.string().trim().optional(),
});
