export interface ShippingEstimationRequest {
  subtotal: number;
  destination?: string; // Zip, state, country or region code
  weight?: number; // Placeholder for weight weight-based shipping rules
}

export interface ShippingOption {
  name: string;
  cost: number;
  estimatedDays: number;
}

export class ShippingService {
  /**
   * Configurable threshold for free secure shipping
   */
  private readonly freeShippingThreshold = 150;

  estimateShipping(request: ShippingEstimationRequest): ShippingOption[] {
    const { subtotal, destination } = request;

    if (subtotal >= this.freeShippingThreshold) {
      return [
        { name: "Standard Secure Courier", cost: 0, estimatedDays: 3 },
        { name: "Next-Day Priority Express", cost: 15.00, estimatedDays: 1 }
      ];
    }

    let baseCost = 9.99;
    
    // Example destination modifications
    if (destination) {
      const dest = destination.toLowerCase().trim();
      if (dest.includes("hi") || dest.includes("ak") || dest.includes("hawaii") || dest.includes("alaska")) {
        baseCost = 19.99; // Remote locations require extra safe routing
      } else if (dest.includes("international") || dest.includes("uk") || dest.includes("ca")) {
        baseCost = 24.99;
      }
    }

    return [
      { name: "Standard Secure Courier", cost: baseCost, estimatedDays: 3 },
      { name: "Next-Day Priority Express", cost: baseCost + 15.00, estimatedDays: 1 }
    ];
  }
}

export const shippingService = new ShippingService();
