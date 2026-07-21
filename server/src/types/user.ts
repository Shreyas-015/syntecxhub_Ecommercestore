export enum UserRole {
  CUSTOMER = "customer",
  ADMIN = "admin",
}

export interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  refreshToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
