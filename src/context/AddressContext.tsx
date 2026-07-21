import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BackendAddress } from "../types/address";
import { addressService } from "../services/addressService";
import { useToast } from "./ToastContext";
import { useAuth } from "./AuthContext";

interface AddressContextType {
  addresses: BackendAddress[];
  selectedAddress: BackendAddress | null;
  loading: boolean;
  error: string | null;
  fetchAddresses: () => Promise<void>;
  createAddress: (addressData: Omit<BackendAddress, "_id">) => Promise<BackendAddress>;
  updateAddress: (id: string, addressData: Partial<BackendAddress>) => Promise<BackendAddress>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<BackendAddress>;
  selectAddress: (id: string) => void;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [addresses, setAddresses] = useState<BackendAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<BackendAddress | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
      
      // If there's a default address, select it by default, otherwise select the first one
      if (data.length > 0) {
        const defaultAddr = data.find(addr => addr.isDefault) || data[0];
        setSelectedAddress(defaultAddr);
      } else {
        setSelectedAddress(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch addresses");
      showToast(err.message || "Failed to fetch addresses", "error");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, showToast]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const createAddress = useCallback(async (addressData: Omit<BackendAddress, "_id">) => {
    setLoading(true);
    setError(null);
    try {
      const newAddress = await addressService.createAddress(addressData);
      setAddresses(prev => {
        const updated = [...prev];
        if (newAddress.isDefault) {
          // Unset other defaults locally
          updated.forEach(addr => {
            addr.isDefault = false;
          });
        }
        return [...updated, newAddress];
      });
      if (newAddress.isDefault || !selectedAddress) {
        setSelectedAddress(newAddress);
      }
      showToast("Address saved successfully.", "success");
      return newAddress;
    } catch (err: any) {
      setError(err.message || "Failed to create address");
      showToast(err.message || "Failed to save address", "error");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedAddress, showToast]);

  const updateAddress = useCallback(async (id: string, addressData: Partial<BackendAddress>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedAddress = await addressService.updateAddress(id, addressData);
      setAddresses(prev => {
        return prev.map(addr => {
          if (addr._id === id) {
            return updatedAddress;
          }
          if (updatedAddress.isDefault) {
            return { ...addr, isDefault: false };
          }
          return addr;
        });
      });
      if (selectedAddress?._id === id) {
        setSelectedAddress(updatedAddress);
      } else if (updatedAddress.isDefault) {
        setSelectedAddress(updatedAddress);
      }
      showToast("Address updated successfully.", "success");
      return updatedAddress;
    } catch (err: any) {
      setError(err.message || "Failed to update address");
      showToast(err.message || "Failed to update address", "error");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedAddress, showToast]);

  const deleteAddress = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await addressService.deleteAddress(id);
      setAddresses(prev => prev.filter(addr => addr._id !== id));
      if (selectedAddress?._id === id) {
        setSelectedAddress(prev => {
          const remaining = addresses.filter(addr => addr._id !== id);
          return remaining.length > 0 ? remaining[0] : null;
        });
      }
      showToast("Address deleted successfully.", "success");
    } catch (err: any) {
      setError(err.message || "Failed to delete address");
      showToast(err.message || "Failed to delete address", "error");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addresses, selectedAddress, showToast]);

  const setDefaultAddress = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const updatedAddress = await addressService.setDefaultAddress(id);
      setAddresses(prev => {
        return prev.map(addr => {
          if (addr._id === id) {
            return updatedAddress;
          }
          return { ...addr, isDefault: false };
        });
      });
      setSelectedAddress(updatedAddress);
      showToast("Default address changed.", "success");
      return updatedAddress;
    } catch (err: any) {
      setError(err.message || "Failed to set default address");
      showToast(err.message || "Failed to set default address", "error");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const selectAddress = useCallback((id: string) => {
    const addr = addresses.find(a => a._id === id);
    if (addr) {
      setSelectedAddress(addr);
    }
  }, [addresses]);

  const value = {
    addresses,
    selectedAddress,
    loading,
    error,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    selectAddress
  };

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
};

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error("useAddress must be used within an AddressProvider");
  }
  return context;
};
