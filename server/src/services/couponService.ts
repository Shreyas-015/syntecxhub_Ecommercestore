export interface ICoupon {
  code: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  minSubtotal?: number;
  expiryDate?: Date;
  isActive: boolean;
  maxDiscountAmount?: number;
}

export class CouponValidationService {
  validate(coupon: ICoupon, subtotal: number): { valid: boolean; error?: string } {
    if (!coupon.isActive) {
      return { valid: false, error: "This coupon is currently inactive." };
    }
    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      return { valid: false, error: "This coupon has expired." };
    }
    if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
      return { valid: false, error: `Minimum order subtotal of $${coupon.minSubtotal} required to apply this coupon.` };
    }
    return { valid: true };
  }
}

export class CouponDiscountService {
  calculateDiscount(coupon: ICoupon, subtotal: number): number {
    if (coupon.discountType === "percentage") {
      let discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
      return Math.round(discount * 100) / 100;
    } else {
      const discount = Math.min(coupon.discountValue, subtotal);
      return Math.round(discount * 100) / 100;
    }
  }
}

export class CouponRepositoryPlaceholder {
  private readonly mockCoupons: Map<string, ICoupon> = new Map([
    [
      "SYNTEX10",
      {
        code: "SYNTEX10",
        discountType: "percentage",
        discountValue: 10,
        isActive: true,
        minSubtotal: 50,
        expiryDate: new Date("2030-01-01")
      }
    ],
    [
      "SECURE50",
      {
        code: "SECURE50",
        discountType: "fixed_amount",
        discountValue: 50.00,
        isActive: true,
        minSubtotal: 300,
        expiryDate: new Date("2030-01-01")
      }
    ]
  ]);

  async findByCode(code: string): Promise<ICoupon | null> {
    const normalized = code.trim().toUpperCase();
    return this.mockCoupons.get(normalized) || null;
  }
}

export const couponValidationService = new CouponValidationService();
export const couponDiscountService = new CouponDiscountService();
export const couponRepositoryPlaceholder = new CouponRepositoryPlaceholder();
