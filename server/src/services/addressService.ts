import { addressRepository } from "../repositories/addressRepository";
import { ValidationError, NotFoundError, ForbiddenError } from "../utils/errors";
import { IAddress } from "../models/Address";
import mongoose from "mongoose";

export class AddressService {
  /**
   * Get all addresses for a user
   */
  async getUserAddresses(userId: string): Promise<IAddress[]> {
    if (!userId) {
      throw new ValidationError("User ID is required");
    }
    return addressRepository.findByUser(userId);
  }

  /**
   * Get a specific address by ID, ensuring it belongs to the user
   */
  async getAddressById(id: string, userId: string): Promise<IAddress> {
    if (!id || !userId) {
      throw new ValidationError("Address ID and User ID are required");
    }
    const address = await addressRepository.findById(id);
    if (!address) {
      throw new NotFoundError("Address not found");
    }
    if (address.user.toString() !== userId.toString()) {
      throw new ForbiddenError("You do not have permission to access this address");
    }
    return address;
  }

  /**
   * Create a new address for a user
   */
  async createAddress(userId: string, addressData: Partial<IAddress>): Promise<IAddress> {
    if (!userId) {
      throw new ValidationError("User ID is required");
    }
    
    // Check required fields
    const requiredFields = ["fullName", "phone", "addressLine1", "city", "state", "postalCode", "country"];
    for (const field of requiredFields) {
      if (!addressData[field as keyof Partial<IAddress>]) {
        throw new ValidationError(`${field} is required`);
      }
    }

    // Check if user already has addresses
    const existingAddresses = await addressRepository.findByUser(userId);
    const isFirstAddress = existingAddresses.length === 0;

    // Set isDefault to true if it is the first address, or if explicitly requested
    const shouldBeDefault = isFirstAddress || !!addressData.isDefault;

    const newAddress = await addressRepository.create({
      ...addressData,
      user: new mongoose.Types.ObjectId(userId) as any,
      isDefault: shouldBeDefault
    });

    const targetId = newAddress._id ? newAddress._id.toString() : (newAddress as any).id;
    if (shouldBeDefault && targetId) {
      await addressRepository.unsetDefaults(userId, targetId);
    }

    return newAddress;
  }

  /**
   * Update an address
   */
  async updateAddress(id: string, userId: string, addressData: Partial<IAddress>): Promise<IAddress> {
    await this.getAddressById(id, userId);

    const updatedAddress = await addressRepository.update(id, addressData);
    if (!updatedAddress) {
      throw new NotFoundError("Address not found for update");
    }

    // If marked as default, unset other addresses
    if (addressData.isDefault) {
      await addressRepository.unsetDefaults(userId, id);
    }

    return updatedAddress;
  }

  /**
   * Delete an address
   */
  async deleteAddress(id: string, userId: string): Promise<void> {
    const address = await this.getAddressById(id, userId);
    
    await addressRepository.delete(id);

    // If the deleted address was default, set another address as default if any exist
    if (address.isDefault) {
      const remaining = await addressRepository.findByUser(userId);
      if (remaining.length > 0) {
        const remainingId = remaining[0]._id ? remaining[0]._id.toString() : (remaining[0] as any).id;
        await addressRepository.update(remainingId, { isDefault: true });
      }
    }
  }

  /**
   * Set an address as the default for a user
   */
  async setDefaultAddress(id: string, userId: string): Promise<IAddress> {
    await this.getAddressById(id, userId);

    const updated = await addressRepository.update(id, { isDefault: true });
    if (!updated) {
      throw new NotFoundError("Address not found");
    }

    await addressRepository.unsetDefaults(userId, id);
    return updated;
  }
}

export const addressService = new AddressService();
