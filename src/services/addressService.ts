import api from "../lib/api";
import { BackendAddress } from "../types/address";

export const addressService = {
  async getAddresses(): Promise<BackendAddress[]> {
    const response = await api.get("/addresses");
    return response.data.data;
  },

  async getAddressById(id: string): Promise<BackendAddress> {
    const response = await api.get(`/addresses/${id}`);
    return response.data.data;
  },

  async createAddress(addressData: Omit<BackendAddress, "_id">): Promise<BackendAddress> {
    const response = await api.post("/addresses", addressData);
    return response.data.data;
  },

  async updateAddress(id: string, addressData: Partial<BackendAddress>): Promise<BackendAddress> {
    const response = await api.put(`/addresses/${id}`, addressData);
    return response.data.data;
  },

  async deleteAddress(id: string): Promise<void> {
    await api.delete(`/addresses/${id}`);
  },

  async setDefaultAddress(id: string): Promise<BackendAddress> {
    const response = await api.patch(`/addresses/${id}/default`);
    return response.data.data;
  }
};
