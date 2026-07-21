import mongoose from "mongoose";
import { Address, IAddress } from "../models/Address";

export const mockAddresses = new Map<string, any>();

export class AddressRepository {
  private isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Find address by ID
   */
  async findById(id: string): Promise<IAddress | null> {
    if (!this.isConnected()) {
      const mock = mockAddresses.get(id);
      return mock ? (mock as IAddress) : null;
    }
    return Address.findById(id);
  }

  /**
   * Find all addresses for a user
   */
  async findByUser(userId: string): Promise<IAddress[]> {
    if (!this.isConnected()) {
      return Array.from(mockAddresses.values()).filter(
        (addr) => addr.user.toString() === userId.toString()
      ) as IAddress[];
    }
    return Address.find({ user: userId });
  }

  /**
   * Find default address for a user
   */
  async findDefaultByUser(userId: string): Promise<IAddress | null> {
    if (!this.isConnected()) {
      const found = Array.from(mockAddresses.values()).find(
        (addr) => addr.user.toString() === userId.toString() && addr.isDefault
      );
      return found ? (found as IAddress) : null;
    }
    return Address.findOne({ user: userId, isDefault: true });
  }

  /**
   * Create new address
   */
  async create(addressData: Partial<IAddress>): Promise<IAddress> {
    if (!this.isConnected()) {
      const id = addressData._id || (addressData as any).id || new mongoose.Types.ObjectId().toString();
      const mock = {
        _id: id,
        id: id,
        user: addressData.user,
        fullName: addressData.fullName || "",
        phone: addressData.phone || "",
        addressLine1: addressData.addressLine1 || "",
        addressLine2: addressData.addressLine2,
        city: addressData.city || "",
        state: addressData.state || "",
        postalCode: addressData.postalCode || "",
        country: addressData.country || "",
        landmark: addressData.landmark,
        addressType: addressData.addressType || "Home",
        isDefault: !!addressData.isDefault,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...addressData
      };
      mockAddresses.set(id, mock);
      return mock as unknown as IAddress;
    }
    return Address.create(addressData);
  }

  /**
   * Update address
   */
  async update(id: string, addressData: Partial<IAddress>): Promise<IAddress | null> {
    if (!this.isConnected()) {
      const mock = mockAddresses.get(id);
      if (!mock) return null;
      const updated = {
        ...mock,
        ...addressData,
        updatedAt: new Date()
      };
      mockAddresses.set(id, updated);
      return updated as unknown as IAddress;
    }
    return Address.findByIdAndUpdate(id, { $set: addressData }, { new: true, runValidators: true });
  }

  /**
   * Delete address
   */
  async delete(id: string): Promise<IAddress | null> {
    if (!this.isConnected()) {
      const mock = mockAddresses.get(id);
      if (!mock) return null;
      mockAddresses.delete(id);
      return mock as unknown as IAddress;
    }
    return Address.findByIdAndDelete(id);
  }

  /**
   * Unset defaults for all other user addresses
   */
  async unsetDefaults(userId: string, exceptId?: string): Promise<void> {
    if (!this.isConnected()) {
      for (const addr of mockAddresses.values()) {
        if (addr.user.toString() === userId.toString() && addr._id.toString() !== exceptId?.toString()) {
          addr.isDefault = false;
          addr.updatedAt = new Date();
          mockAddresses.set(addr._id.toString(), addr);
        }
      }
      return;
    }
    await Address.updateMany(
      { user: userId, _id: { $ne: exceptId } },
      { $set: { isDefault: false } }
    );
  }
}

export const addressRepository = new AddressRepository();
