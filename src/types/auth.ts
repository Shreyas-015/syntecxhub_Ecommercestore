export interface Address {
  id: string;
  label: string; // e.g. Home, Office
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  addresses?: Address[];
  role?: "admin" | "customer";
}

export interface LoginRequest {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password?: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}
