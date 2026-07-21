import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Product } from "../types";
import { wishlistService } from "../services/wishlistService";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

interface WishlistContextType {
  products: Product[];
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      const data = await wishlistService.getWishlist();
      setProducts(data.products);
    } catch (err: any) {
      console.error("Failed to fetch wishlist:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = useCallback(async (productId: string) => {
    if (!isAuthenticated) {
      showToast("Please sign in to add items to your wishlist.", "info");
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setLoading(true);
    try {
      const data = await wishlistService.addProduct(productId);
      setProducts(data.products);
      showToast("Product added to your secure vault wishlist.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to add to wishlist", "error");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, showToast]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await wishlistService.removeProduct(productId);
      setProducts(data.products);
      showToast("Product removed from your wishlist.", "info");
    } catch (err: any) {
      showToast(err.message || "Failed to remove from wishlist", "error");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, showToast]);

  const clearWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await wishlistService.clearWishlist();
      setProducts(data.products);
      showToast("Your wishlist has been cleared.", "info");
    } catch (err: any) {
      showToast(err.message || "Failed to clear wishlist", "error");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, showToast]);

  const isWishlisted = useCallback((productId: string) => {
    return products.some((p) => String(p.id) === String(productId));
  }, [products]);

  return (
    <WishlistContext.Provider
      value={{
        products,
        loading,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isWishlisted,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
