import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Product, CartItem } from "../types";
import { cartService } from "../services/cartService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useWishlist } from "../context/WishlistContext";

interface CartContextType {
  // Spec fields
  items: CartItem[];
  savedForLater: CartItem[];
  totalItems: number;
  subtotal: number;
  loading: boolean;
  error: string | null;

  // Spec methods
  fetchCart: () => Promise<void>;
  addToCart: (product: Product, quantity?: number, size?: string, color?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => Promise<void>;
  removeItem: (productId: string, size?: string, color?: string) => Promise<void>;
  clearCart: () => Promise<void>;

  // Save For Later methods
  moveToSaveForLater: (productId: string) => Promise<void>;
  moveToCart: (productId: string) => Promise<void>;
  removeFromSaveForLater: (productId: string) => Promise<void>;

  // Shipping & Tax states and modifiers
  shippingCost: number;
  tax: number;
  shippingDestination: string;
  setShippingDestination: (dest: string) => void;
  taxRegion: string;
  setTaxRegion: (region: string) => void;

  // Coupon infrastructure
  couponCode: string | null;
  discount: number;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;

  // Backward compatibility fields
  cart: CartItem[];
  wishlist: string[]; // list of product IDs
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  removeFromCart: (productId: string, size?: string, color?: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  cartTotal: number;
  cartItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { products: wishlistProducts, addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();

  const [items, setItems] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Shipping & Tax estimation
  const [shippingDestination, setShippingDestination] = useState<string>("");
  const [taxRegion, setTaxRegion] = useState<string>("");
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);

  // Coupon configuration
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);

  // Debouncing refs for quantity updates
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Recalculate helper for Guest Cart
  const recalculateLocalTotals = useCallback((localItems: CartItem[]) => {
    const total = localItems.reduce((acc, item) => acc + item.quantity, 0);
    const sub = localItems.reduce((acc, item) => {
      const price = item.product.discountPrice ?? item.product.price;
      return acc + (item.quantity * price);
    }, 0);
    setTotalItems(total);
    setSubtotal(sub);
  }, []);

  // Sync shipping and taxes dynamically
  useEffect(() => {
    if (subtotal === 0) {
      setShippingCost(0);
      setTax(0);
      return;
    }

    // Shipping Estimation (configurable threshold of $150)
    const freeShippingThreshold = 150;
    if (subtotal >= freeShippingThreshold) {
      setShippingCost(0);
    } else {
      let cost = 9.99;
      if (shippingDestination) {
        const dest = shippingDestination.toLowerCase();
        if (dest.includes("hi") || dest.includes("ak") || dest.includes("hawaii") || dest.includes("alaska")) {
          cost = 19.99;
        } else if (dest.includes("international")) {
          cost = 24.99;
        }
      }
      setShippingCost(cost);
    }

    // Tax calculation with configurable rules
    const taxRules: Record<string, number> = {
      "CA": 0.0825,
      "NY": 0.08875,
      "TX": 0.0625,
      "IN": 0.18, // GST
    };
    const rate = taxRegion ? (taxRules[taxRegion.toUpperCase().trim()] ?? 0.05) : 0.05;
    setTax(Math.round((subtotal * rate) * 100) / 100);
  }, [subtotal, shippingDestination, taxRegion]);

  // Fetch Cart from Backend
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await cartService.getCart();
      setItems(data.items);
      setSavedForLater(data.savedForLater);
      setTotalItems(data.totalItems);
      setSubtotal(data.subtotal);
    } catch (err: any) {
      setError(err.message || "Failed to load cart from database");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Handle initialization and Login Merge / Synchronization
  useEffect(() => {
    const handleLoginMergeAndSync = async () => {
      if (isAuthenticated) {
        const guestCartStr = localStorage.getItem("syntex_guest_cart");
        let guestItems: CartItem[] = [];
        try {
          if (guestCartStr) {
            guestItems = JSON.parse(guestCartStr);
          }
        } catch (e) {
          console.error("Failed to parse guest cart", e);
        }

        if (guestItems.length > 0) {
          // Merge guest cart items into authenticated DB cart
          const formatted = guestItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          }));

          try {
            const data = await cartService.mergeCart(formatted);
            setItems(data.items);
            setSavedForLater(data.savedForLater);
            setTotalItems(data.totalItems);
            setSubtotal(data.subtotal);
            showToast("Your guest shopping cart has been merged securely with your account.", "success");
          } catch (err: any) {
            console.error("Failed to merge guest cart into DB:", err);
            await fetchCart();
          } finally {
            localStorage.removeItem("syntex_guest_cart");
          }
        } else {
          await fetchCart();
        }

        // Handle Guest Save For Later Merge
        const guestSflStr = localStorage.getItem("syntex_guest_save_for_later");
        let guestSflItems: CartItem[] = [];
        try {
          if (guestSflStr) {
            guestSflItems = JSON.parse(guestSflStr);
          }
        } catch (e) {}

        if (guestSflItems.length > 0) {
          for (const sflItem of guestSflItems) {
            try {
              await cartService.moveToSaveForLater(sflItem.product.id);
            } catch (err) {
              console.error(err);
            }
          }
          localStorage.removeItem("syntex_guest_save_for_later");
          await fetchCart();
        }
      } else {
        // Load Guest Cart
        const guestCartStr = localStorage.getItem("syntex_guest_cart");
        const guestSflStr = localStorage.getItem("syntex_guest_save_for_later");
        let localCart: CartItem[] = [];
        let localSfl: CartItem[] = [];
        try {
          if (guestCartStr) localCart = JSON.parse(guestCartStr);
        } catch (e) {}
        try {
          if (guestSflStr) localSfl = JSON.parse(guestSflStr);
        } catch (e) {}

        setItems(localCart);
        setSavedForLater(localSfl);
        recalculateLocalTotals(localCart);
      }
    };

    handleLoginMergeAndSync();
  }, [isAuthenticated, fetchCart, recalculateLocalTotals, showToast]);

  // Add Item to active cart
  const addToCart = useCallback(async (product: Product, quantity = 1, size?: string, color?: string) => {
    if (product.stock !== undefined && product.stock <= 0) {
      showToast("This item is currently out of stock.", "error");
      return;
    }

    if (!isAuthenticated) {
      // Guest Cart implementation
      const guestCartStr = localStorage.getItem("syntex_guest_cart");
      let localCart: CartItem[] = [];
      try {
        if (guestCartStr) localCart = JSON.parse(guestCartStr);
      } catch (e) {}

      const duplicateIndex = localCart.findIndex((item) => item.product.id === product.id);
      if (duplicateIndex > -1) {
        const combinedQuantity = localCart[duplicateIndex].quantity + quantity;
        if (combinedQuantity > product.stock) {
          showToast(`Cannot add more items. Stock limit is ${product.stock}.`, "error");
          return;
        }
        localCart[duplicateIndex].quantity = combinedQuantity;
      } else {
        if (quantity > product.stock) {
          showToast(`Cannot add more items. Stock limit is ${product.stock}.`, "error");
          return;
        }
        localCart.push({ product, quantity, selectedColor: color, selectedSize: size });
      }

      localStorage.setItem("syntex_guest_cart", JSON.stringify(localCart));
      setItems(localCart);
      recalculateLocalTotals(localCart);
      showToast(`${product.name} added to your guest basket.`, "success");
      setIsCartOpen(true);
      return;
    }

    // Authenticated Database Cart
    setLoading(true);
    setError(null);
    try {
      const data = await cartService.addItem(product.id, quantity);
      setItems(data.items);
      setSavedForLater(data.savedForLater);
      setTotalItems(data.totalItems);
      setSubtotal(data.subtotal);
      showToast(`${product.name} added to your secure cart.`, "success");
      setIsCartOpen(true);
    } catch (err: any) {
      const msg = err.message || "Failed to add product to cart";
      showToast(msg, "error");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, recalculateLocalTotals, showToast]);

  // Update Item Quantity
  const updateQuantity = useCallback(async (productId: string, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      await removeItem(productId, size, color);
      return;
    }

    // Optimistic UI update instantly for reactive feel
    const originalItems = [...items];
    const originalTotalItems = totalItems;
    const originalSubtotal = subtotal;

    const updated = items.map((item) => {
      if (item.product.id === productId) {
        // Double check stock
        if (item.product.stock !== undefined && quantity > item.product.stock) {
          showToast(`Only ${item.product.stock} items are available in stock.`, "error");
          return { ...item, quantity: item.product.stock };
        }
        return { ...item, quantity };
      }
      return item;
    });

    setItems(updated);
    recalculateLocalTotals(updated);

    if (!isAuthenticated) {
      localStorage.setItem("syntex_guest_cart", JSON.stringify(updated));
      showToast("Quantity updated.", "success");
      return;
    }

    // Debounced and background sync for authenticated user to prevent server spam
    if (debounceTimersRef.current[productId]) {
      clearTimeout(debounceTimersRef.current[productId]);
    }

    debounceTimersRef.current[productId] = setTimeout(async () => {
      try {
        const data = await cartService.updateQuantity(productId, quantity);
        setItems(data.items);
        setSavedForLater(data.savedForLater);
        setTotalItems(data.totalItems);
        setSubtotal(data.subtotal);
      } catch (err: any) {
        console.error("Failed to sync quantity to DB, rolling back:", err);
        setItems(originalItems);
        setTotalItems(originalTotalItems);
        setSubtotal(originalSubtotal);
        showToast(err.message || "Network sync failed. Rolled back.", "error");
      }
    }, 500);
  }, [isAuthenticated, items, totalItems, subtotal, recalculateLocalTotals, showToast]);

  // Remove Item from Cart
  const removeItem = useCallback(async (productId: string, size?: string, color?: string) => {
    const targetProduct = items.find((i) => i.product.id === productId)?.product;

    if (!isAuthenticated) {
      const filtered = items.filter((item) => item.product.id !== productId);
      localStorage.setItem("syntex_guest_cart", JSON.stringify(filtered));
      setItems(filtered);
      recalculateLocalTotals(filtered);
      showToast(`${targetProduct ? targetProduct.name : "Product"} removed from your guest cart.`, "info");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await cartService.removeItem(productId);
      setItems(data.items);
      setSavedForLater(data.savedForLater);
      setTotalItems(data.totalItems);
      setSubtotal(data.subtotal);
      showToast(`${targetProduct ? targetProduct.name : "Product"} removed from your secure cart.`, "info");
    } catch (err: any) {
      const msg = err.message || "Failed to remove item";
      showToast(msg, "error");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, items, recalculateLocalTotals, showToast]);

  // Clear Cart
  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      localStorage.removeItem("syntex_guest_cart");
      setItems([]);
      setTotalItems(0);
      setSubtotal(0);
      showToast("Guest cart cleared.", "info");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await cartService.clearCart();
      setItems(data.items);
      setSavedForLater(data.savedForLater);
      setTotalItems(data.totalItems);
      setSubtotal(data.subtotal);
      showToast("Your cart has been cleared.", "info");
    } catch (err: any) {
      const msg = err.message || "Failed to clear cart";
      showToast(msg, "error");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, showToast]);

  // Move Active Cart Item to Save For Later
  const moveToSaveForLater = useCallback(async (productId: string) => {
    const itemToMove = items.find((item) => item.product.id === productId);
    if (!itemToMove) return;

    if (!isAuthenticated) {
      // Manage locally
      const filteredCart = items.filter((item) => item.product.id !== productId);
      const guestSflStr = localStorage.getItem("syntex_guest_save_for_later");
      let localSfl: CartItem[] = [];
      try {
        if (guestSflStr) localSfl = JSON.parse(guestSflStr);
      } catch (e) {}

      const exists = localSfl.some((item) => item.product.id === productId);
      if (!exists) {
        localSfl.push(itemToMove);
      }

      localStorage.setItem("syntex_guest_cart", JSON.stringify(filteredCart));
      localStorage.setItem("syntex_guest_save_for_later", JSON.stringify(localSfl));
      
      setItems(filteredCart);
      setSavedForLater(localSfl);
      recalculateLocalTotals(filteredCart);
      showToast(`${itemToMove.product.name} moved to Save For Later.`, "success");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await cartService.moveToSaveForLater(productId);
      setItems(data.items);
      setSavedForLater(data.savedForLater);
      setTotalItems(data.totalItems);
      setSubtotal(data.subtotal);
      showToast(`${itemToMove.product.name} moved to Save For Later.`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save for later", "error");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, items, recalculateLocalTotals, showToast]);

  // Move Save For Later item back to active Cart
  const moveToCart = useCallback(async (productId: string) => {
    const itemToMove = savedForLater.find((s) => s.product.id === productId);
    if (!itemToMove) return;

    // Verify stock
    if (itemToMove.product.stock !== undefined && itemToMove.product.stock <= 0) {
      showToast("This product is currently out of stock.", "error");
      return;
    }

    if (!isAuthenticated) {
      const filteredSfl = savedForLater.filter((s) => s.product.id !== productId);
      const guestCartStr = localStorage.getItem("syntex_guest_cart");
      let localCart: CartItem[] = [];
      try {
        if (guestCartStr) localCart = JSON.parse(guestCartStr);
      } catch (e) {}

      const exists = localCart.some((item) => item.product.id === productId);
      if (!exists) {
        localCart.push(itemToMove);
      }

      localStorage.setItem("syntex_guest_save_for_later", JSON.stringify(filteredSfl));
      localStorage.setItem("syntex_guest_cart", JSON.stringify(localCart));

      setItems(localCart);
      setSavedForLater(filteredSfl);
      recalculateLocalTotals(localCart);
      showToast(`${itemToMove.product.name} moved back to active cart.`, "success");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await cartService.moveToCart(productId);
      setItems(data.items);
      setSavedForLater(data.savedForLater);
      setTotalItems(data.totalItems);
      setSubtotal(data.subtotal);
      showToast(`${itemToMove.product.name} moved back to active cart.`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to move item to active cart", "error");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, savedForLater, recalculateLocalTotals, showToast]);

  // Remove Save For Later item entirely
  const removeFromSaveForLater = useCallback(async (productId: string) => {
    const itemToRemove = savedForLater.find((s) => s.product.id === productId);

    if (!isAuthenticated) {
      const filteredSfl = savedForLater.filter((s) => s.product.id !== productId);
      localStorage.setItem("syntex_guest_save_for_later", JSON.stringify(filteredSfl));
      setSavedForLater(filteredSfl);
      showToast(`${itemToRemove ? itemToRemove.product.name : "Item"} removed from saved list.`, "info");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await cartService.removeItemFromSaveForLater(productId);
      setItems(data.items);
      setSavedForLater(data.savedForLater);
      setTotalItems(data.totalItems);
      setSubtotal(data.subtotal);
      showToast(`${itemToRemove ? itemToRemove.product.name : "Item"} removed from saved list.`, "info");
    } catch (err: any) {
      showToast(err.message || "Failed to remove item", "error");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, savedForLater, showToast]);

  // Apply Coupon infrastructure
  const applyCoupon = useCallback(async (code: string): Promise<boolean> => {
    const normalized = code.trim().toUpperCase();
    if (normalized === "SYNTEX10") {
      if (subtotal < 50) {
        showToast("Minimum subtotal of $50 required to apply SYNTEX10.", "error");
        return false;
      }
      setCouponCode("SYNTEX10");
      setDiscount(Math.round((subtotal * 0.10) * 100) / 100);
      showToast("Promo Code 'SYNTEX10' applied! 10% discount credited.", "success");
      return true;
    } else if (normalized === "SECURE50") {
      if (subtotal < 300) {
        showToast("Minimum subtotal of $300 required to apply SECURE50.", "error");
        return false;
      }
      setCouponCode("SECURE50");
      setDiscount(50.00);
      showToast("Promo Code 'SECURE50' applied! $50.00 discount credited.", "success");
      return true;
    } else {
      showToast("The promotional code you entered is invalid.", "error");
      return false;
    }
  }, [subtotal, showToast]);

  const removeCoupon = useCallback(() => {
    setCouponCode(null);
    setDiscount(0);
    showToast("Promo code has been removed.", "info");
  }, [showToast]);

  // Keep discount calculation in sync if subtotal shifts
  useEffect(() => {
    if (couponCode === "SYNTEX10") {
      if (subtotal < 50) {
        setCouponCode(null);
        setDiscount(0);
      } else {
        setDiscount(Math.round((subtotal * 0.10) * 100) / 100);
      }
    } else if (couponCode === "SECURE50") {
      if (subtotal < 300) {
        setCouponCode(null);
        setDiscount(0);
      } else {
        setDiscount(50.00);
      }
    }
  }, [subtotal, couponCode]);

  // Wishlist Bridges (Backward compatibility delegation)
  const toggleWishlist = useCallback(async (productId: string) => {
    if (isWishlisted(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  }, [isWishlisted, addToWishlist, removeFromWishlist]);

  const isInWishlist = useCallback((productId: string) => {
    return isWishlisted(productId);
  }, [isWishlisted]);

  const wishlistIds = wishlistProducts.map((p) => p.id);

  return (
    <CartContext.Provider
      value={{
        items,
        savedForLater,
        totalItems,
        subtotal,
        loading,
        error,

        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,

        moveToSaveForLater,
        moveToCart,
        removeFromSaveForLater,

        shippingCost,
        tax,
        shippingDestination,
        setShippingDestination,
        taxRegion,
        setTaxRegion,

        couponCode,
        discount,
        applyCoupon,
        removeCoupon,

        cart: items,
        wishlist: wishlistIds,
        isCartOpen,
        setIsCartOpen,
        removeFromCart: removeItem,
        toggleWishlist,
        isInWishlist,
        cartTotal: subtotal,
        cartItemsCount: totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
