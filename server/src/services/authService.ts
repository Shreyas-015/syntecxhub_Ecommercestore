import { userRepository } from "../repositories/userRepository";
import { User, IUser } from "../models/User";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/tokens";
import { ConflictError, UnauthorizedError, NotFoundError } from "../utils/errors";
import { Role } from "../constants/roles";

export class AuthService {
  /**
   * Helper to split a combined name string into firstName and lastName
   */
  private splitName(name: string): { firstName: string; lastName: string } {
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || "";
    return { firstName, lastName };
  }

  /**
   * Register a new user and generate initial tokens
   */
  async register(registerData: { firstName: string; lastName: string; email: string; password?: string }) {
    const normalizedEmail = registerData.email.trim().toLowerCase();
    
    const existingEmail = await userRepository.findByEmail(normalizedEmail);
    if (existingEmail) {
      throw new ConflictError("An account with this email address already exists.");
    }

    const user = await userRepository.create({
      firstName: registerData.firstName.trim(),
      lastName: registerData.lastName.trim(),
      email: normalizedEmail,
      password: registerData.password,
      role: Role.CUSTOMER,
      isVerified: false,
      isActive: true,
    });

    const payload = { id: user.id, userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await userRepository.updateRefreshToken(user.id, refreshToken);

    return {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user, verify credentials, and generate tokens
   */
  async login(loginData: { email: string; password?: string }) {
    const normalizedEmail = loginData.email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const isMatch = await user.comparePassword(loginData.password || "");
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const payload = { id: user.id, userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await userRepository.updateRefreshToken(user.id, refreshToken);

    return {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Logout user and invalidate refresh token
   */
  async logout(userId: string) {
    await userRepository.updateRefreshToken(userId, null);
  }

  /**
   * Refresh access token & rotate refresh token
   */
  async refresh(token: string) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await userRepository.findById(decoded.id);
      
      if (!user || !user.isActive || user.refreshToken !== token) {
        throw new UnauthorizedError("Invalid session or inactive user.");
      }

      const payload = { id: user.id, userId: user.id, email: user.email, role: user.role };
      const newAccessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      await userRepository.updateRefreshToken(user.id, newRefreshToken);

      return {
        user: user.toSafeObject(),
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err: any) {
      throw new UnauthorizedError("Session expired. Please log in again.");
    }
  }

  /**
   * Update profile fields
   */
  async updateProfile(userId: string, profileData: { name?: string; email?: string; phone?: string; avatarUrl?: string; addresses?: any[] }) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const updates: Partial<IUser> = {};

    if (profileData.name) {
      const { firstName, lastName } = this.splitName(profileData.name);
      updates.firstName = firstName;
      updates.lastName = lastName;
    }

    if (profileData.email && profileData.email.toLowerCase() !== user.email.toLowerCase()) {
      const existingEmail = await userRepository.findByEmail(profileData.email);
      if (existingEmail) {
        throw new ConflictError("This email address is already in use by another account.");
      }
      updates.email = profileData.email;
    }

    if (profileData.phone && profileData.phone !== user.phone) {
      const existingPhone = await userRepository.findByPhone(profileData.phone);
      if (existingPhone) {
        throw new ConflictError("This phone number is already in use by another account.");
      }
      updates.phone = profileData.phone;
    }

    if (profileData.avatarUrl !== undefined) {
      updates.avatar = profileData.avatarUrl;
    }

    if (profileData.addresses !== undefined) {
      // Map frontend keys (like zipCode) to database keys (like postalCode) if necessary
      updates.addresses = profileData.addresses.map((addr) => ({
        _id: addr.id || addr._id,
        label: addr.label || "Home",
        fullName: addr.fullName,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        country: addr.country || "USA",
        postalCode: addr.postalCode || addr.zipCode || "",
        zipCode: addr.zipCode || addr.postalCode,
        isDefault: addr.isDefault || false,
      }));
    }

    const updatedUser = await userRepository.update(userId, updates);
    if (!updatedUser) {
      throw new NotFoundError("User update failed.");
    }

    return updatedUser.toSafeObject();
  }

  /**
   * Update password
   */
  async updatePassword(userId: string, data: { currentPassword?: string; newPassword?: string }) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const isMatch = await user.comparePassword(data.currentPassword || "");
    if (!isMatch) {
      throw new UnauthorizedError("Incorrect current password.");
    }

    user.password = data.newPassword;
    await user.save();

    return user.toSafeObject();
  }
}

export const authService = new AuthService();
