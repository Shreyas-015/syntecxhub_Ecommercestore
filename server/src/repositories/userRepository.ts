import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, IUser } from "../models/User";
import { Role } from "../constants/roles";

// Cache for simulated in-memory users
const mockUsers = new Map<string, any>();

// Helper class to mimic a Mongoose Document for in-memory fallback
export class InMemoryUser {
  id: string;
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  refreshToken?: string;
  addresses: any[];
  wishlist: string[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this.id = data.id || data._id || Math.random().toString(36).substring(2, 15);
    this._id = this.id;
    this.firstName = data.firstName || "";
    this.lastName = data.lastName || "";
    this.email = (data.email || "").toLowerCase();
    this.phone = data.phone;
    this.password = data.password;
    this.role = data.role || Role.USER;
    this.isVerified = data.isVerified || false;
    this.isActive = data.isActive !== false;
    this.refreshToken = data.refreshToken;
    this.addresses = data.addresses || [];
    this.wishlist = data.wishlist || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  get name() {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  get avatarUrl() {
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(this.name || "User")}`;
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    const isHash = this.password.startsWith("$2a$") || this.password.startsWith("$2b$");
    if (isHash) {
      return bcrypt.compare(candidatePassword, this.password);
    }
    return candidatePassword === this.password;
  }

  toSafeObject() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      name: this.name,
      email: this.email,
      phone: this.phone,
      role: this.role,
      isVerified: this.isVerified,
      isActive: this.isActive,
      addresses: this.addresses,
      wishlist: this.wishlist,
      avatarUrl: this.avatarUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toJSON() {
    return this.toSafeObject();
  }

  async save(): Promise<any> {
    this.updatedAt = new Date();
    if (this.password && !this.password.startsWith("$2a$") && !this.password.startsWith("$2b$")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    mockUsers.set(this.id, this);
    return this;
  }
}

// Seed demo user inside in-memory cache
const demoPasswordHash = bcrypt.hashSync("Demo@123", 10);
const demoUser = new InMemoryUser({
  id: "demo-user-id-123456",
  firstName: "Demo",
  lastName: "Sandbox",
  email: "demo@syntexstore.com",
  phone: "1234567890",
  password: demoPasswordHash,
  role: Role.USER,
  isVerified: true,
  isActive: true,
  addresses: [
    {
      id: "demo-address-1",
      label: "Home",
      fullName: "Demo Sandbox",
      phone: "1234567890",
      addressLine1: "1600 Amphitheatre Parkway",
      city: "Mountain View",
      state: "CA",
      country: "USA",
      postalCode: "94043",
      isDefault: true,
    }
  ],
  wishlist: [],
});
mockUsers.set(demoUser.id, demoUser);

export class UserRepository {
  /**
   * Helper to check if Mongoose is connected
   */
  private isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Find user by id
   */
  async findById(id: string): Promise<IUser | null> {
    if (!this.isConnected()) {
      const mockUser = mockUsers.get(id);
      return mockUser ? (mockUser as unknown as IUser) : null;
    }
    return User.findById(id);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    const normalizedEmail = email.toLowerCase();
    if (!this.isConnected()) {
      for (const user of mockUsers.values()) {
        if (user.email === normalizedEmail) {
          return user as unknown as IUser;
        }
      }
      return null;
    }
    return User.findOne({ email: normalizedEmail });
  }

  /**
   * Find user by phone
   */
  async findByPhone(phone: string): Promise<IUser | null> {
    if (!this.isConnected()) {
      for (const user of mockUsers.values()) {
        if (user.phone === phone) {
          return user as unknown as IUser;
        }
      }
      return null;
    }
    return User.findOne({ phone });
  }

  /**
   * Create new user
   */
  async create(userData: Partial<IUser>): Promise<IUser> {
    if (!this.isConnected()) {
      const newUser = new InMemoryUser(userData);
      if (newUser.password && !newUser.password.startsWith("$2a$") && !newUser.password.startsWith("$2b$")) {
        const salt = bcrypt.genSaltSync(10);
        newUser.password = bcrypt.hashSync(newUser.password, salt);
      }
      mockUsers.set(newUser.id, newUser);
      return newUser as unknown as IUser;
    }
    const user = new User(userData);
    return user.save();
  }

  /**
   * Update existing user
   */
  async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    if (!this.isConnected()) {
      const mockUser = mockUsers.get(id);
      if (!mockUser) return null;

      // Update fields
      if (updateData.firstName !== undefined) mockUser.firstName = updateData.firstName;
      if (updateData.lastName !== undefined) mockUser.lastName = updateData.lastName;
      if (updateData.email !== undefined) mockUser.email = updateData.email.toLowerCase();
      if (updateData.phone !== undefined) mockUser.phone = updateData.phone;
      if (updateData.password !== undefined) {
        if (!updateData.password.startsWith("$2a$") && !updateData.password.startsWith("$2b$")) {
          const salt = bcrypt.genSaltSync(10);
          mockUser.password = bcrypt.hashSync(updateData.password, salt);
        } else {
          mockUser.password = updateData.password;
        }
      }
      if (updateData.addresses !== undefined) mockUser.addresses = updateData.addresses;
      if (updateData.wishlist !== undefined) mockUser.wishlist = updateData.wishlist;
      if (updateData.isActive !== undefined) mockUser.isActive = updateData.isActive;
      if (updateData.isVerified !== undefined) mockUser.isVerified = updateData.isVerified;
      
      mockUser.updatedAt = new Date();
      mockUsers.set(id, mockUser);
      return mockUser as unknown as IUser;
    }
    return User.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
  }

  /**
   * Update refresh token for user
   */
  async updateRefreshToken(id: string, token: string | null): Promise<IUser | null> {
    if (!this.isConnected()) {
      const mockUser = mockUsers.get(id);
      if (!mockUser) return null;
      mockUser.refreshToken = token || undefined;
      mockUser.updatedAt = new Date();
      mockUsers.set(id, mockUser);
      return mockUser as unknown as IUser;
    }
    return User.findByIdAndUpdate(id, { $set: { refreshToken: token } }, { new: true });
  }

  /**
   * Delete user by ID
   */
  async delete(id: string): Promise<IUser | null> {
    if (!this.isConnected()) {
      const mockUser = mockUsers.get(id);
      if (!mockUser) return null;
      mockUsers.delete(id);
      return mockUser as unknown as IUser;
    }
    return User.findByIdAndDelete(id);
  }
}

export const userRepository = new UserRepository();
