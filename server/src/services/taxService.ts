export interface TaxCalculationRequest {
  subtotal: number;
  region?: string; // US State or international region code
}

export interface TaxResult {
  rate: number;
  amount: number;
  name: string;
}

export class TaxService {
  /**
   * Configurable regional tax rules
   */
  private readonly rules: Record<string, { rate: number; name: string }> = {
    "CA": { rate: 0.0825, name: "California Sales Tax" },
    "NY": { rate: 0.08875, name: "New York Sales Tax" },
    "TX": { rate: 0.0625, name: "Texas Sales Tax" },
    "GST": { rate: 0.18, name: "GST (18%)" },
    "IN": { rate: 0.18, name: "GST (18%)" },
    "default": { rate: 0.05, name: "Standard Retail Tax" }
  };

  calculateTax(request: TaxCalculationRequest): TaxResult {
    const { subtotal, region } = request;
    const key = region ? region.toUpperCase().trim() : "default";
    
    // Fallback search or default
    const rule = this.rules[key] || this.rules["default"];
    const amount = Math.round((subtotal * rule.rate) * 100) / 100;

    return {
      rate: rule.rate,
      amount,
      name: rule.name
    };
  }
}

export const taxService = new TaxService();
