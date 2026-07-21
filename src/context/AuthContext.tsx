import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, LoginRequest, RegisterRequest, Address } from "../types/auth";
import { authService } from "../services/authService";
import { useToast } from "./ToastContext";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updatedFields: Partial<User>) => Promise<void>;
  addAddress: (address: Omit<Address, "id">) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  // Fetch current user on mount to verify session
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const fetchedUser = await authService.getMe();
        setUser(fetchedUser);
      } catch (err) {
        // User is not logged in or session expired - silent fail on startup
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCurrentUser();

    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener("auth-unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth-unauthorized", handleUnauthorized);
    };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fetchedUser = await authService.getMe();
      setUser(fetchedUser);
    } catch (err) {
      setUser(null);
      throw err;
    }
  }, []);

  const login = useCallback(async (request: LoginRequest) => {
    try {
      const responseUser = await authService.login(request);
      setUser(responseUser);
      showToast(`Welcome back, ${responseUser.name || "User"}!`, "success");
    } catch (err: any) {
      showToast(err.message || "Login failed", "error");
      throw err;
    }
  }, [showToast]);

  const register = useCallback(async (request: RegisterRequest) => {
    try {
      const responseUser = await authService.register(request);
      setUser(responseUser);
      showToast("Account created successfully! Welcome to Syntex Store.", "success");
    } catch (err: any) {
      showToast(err.message || "Registration failed", "error");
      throw err;
    }
  }, [showToast]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
      showToast("You have been signed out safely.", "success");
    } catch (err: any) {
      showToast("Logout failed. Please try again.", "error");
      throw err;
    }
  }, [showToast]);

  const updateProfile = useCallback(async (updatedFields: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = await authService.updateProfile(user.id, updatedFields);
      setUser(updatedUser);
      showToast("Profile settings updated successfully.", "success");
    } catch (err: any) {
      showToast(err.message || "Profile update failed", "error");
      throw err;
    }
  }, [user, showToast]);

  const addAddress = useCallback(async (newAddr: Omit<Address, "id">) => {
    if (!user) return;
    try {
      const addressWithId: Address = {
        ...newAddr,
        id: `addr-${Math.random().toString(36).substring(2, 9)}`,
      };
      const existingAddresses = user.addresses || [];
      const updatedAddresses = [...existingAddresses, addressWithId];
      await updateProfile({ addresses: updatedAddresses });
      showToast("New delivery address added.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to add address", "error");
    }
  }, [user, updateProfile, showToast]);

  const deleteAddress = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const existingAddresses = user.addresses || [];
      const updatedAddresses = existingAddresses.filter((addr) => addr.id !== id);
      await updateProfile({ addresses: updatedAddresses });
      showToast("Address deleted successfully.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete address", "error");
    }
  }, [user, updateProfile, showToast]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    loading: isLoading,
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
    addAddress,
    deleteAddress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
