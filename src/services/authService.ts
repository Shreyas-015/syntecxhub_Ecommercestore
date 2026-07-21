import { User, LoginRequest, RegisterRequest } from "../types/auth";
import api from "../lib/api";

const mapUser = (backendUser: any): User => {
  if (!backendUser) return backendUser;
  return {
    id: backendUser.id || backendUser._id,
    name: backendUser.name || `${backendUser.firstName || ""} ${backendUser.lastName || ""}`.trim() || "User",
    email: backendUser.email,
    phone: backendUser.phone,
    avatarUrl: backendUser.avatarUrl,
    addresses: backendUser.addresses || [],
    role: backendUser.role,
  };
};

export const authService = {
  /**
   * Real login with credentials (relying on HTTP-only cookies)
   */
  async login(request: LoginRequest): Promise<User> {
    const response = await api.post("/auth/login", {
      email: request.email,
      password: request.password,
    });

    return mapUser(response.data.data.user);
  },

  /**
   * Real registration (relying on HTTP-only cookies)
   * Maps UI "name" to backend "firstName" and "lastName"
   */
  async register(request: RegisterRequest): Promise<User> {
    const parts = (request.name || "").trim().split(/\s+/);
    const firstName = parts[0] || "User";
    const lastName = parts.slice(1).join(" ") || "Customer";

    const response = await api.post("/auth/register", {
      firstName,
      lastName,
      email: request.email,
      password: request.password,
    });

    return mapUser(response.data.data.user);
  },

  /**
   * Real logout (clears backend cookies and database refresh token)
   */
  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  /**
   * Fetch current authenticated user profile
   */
  async getMe(): Promise<User> {
    const response = await api.get("/auth/me");
    return mapUser(response.data.data.user);
  },

  /**
   * Real profile and address list update
   */
  async updateProfile(userId: string, updatedFields: Partial<User>): Promise<User> {
    // If updating name, map it back to firstName and lastName
    const payload: any = { ...updatedFields };
    if (updatedFields.name) {
      const parts = updatedFields.name.trim().split(/\s+/);
      payload.firstName = parts[0] || "";
      payload.lastName = parts.slice(1).join(" ") || "";
      delete payload.name;
    }

    const response = await api.put("/auth/profile", payload);
    return mapUser(response.data.data.user);
  },

  /**
   * Real password update
   */
  async updatePassword(passwordData: any): Promise<void> {
    await api.put("/auth/password", passwordData);
  },
};

