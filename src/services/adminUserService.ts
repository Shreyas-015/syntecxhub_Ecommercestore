import api from "../lib/api";

export interface AdminCustomer {
  id: string;
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

export interface AdminCustomerDetail {
  customer: AdminCustomer & { addresses: any[] };
  orders: any[];
}

export const adminUserService = {
  /**
   * Fetch all customers with cumulative stats
   */
  async getCustomers(): Promise<AdminCustomer[]> {
    const res = await api.get("/admin/users");
    return res.data.data.customers || [];
  },

  /**
   * Fetch a single customer's detailed profile, order history and addresses
   */
  async getCustomerById(id: string): Promise<AdminCustomerDetail> {
    const res = await api.get(`/admin/users/${id}`);
    return res.data.data;
  },

  /**
   * Enable/Disable a customer's account status
   */
  async toggleUserStatus(id: string, isActive: boolean): Promise<AdminCustomer> {
    const res = await api.patch(`/admin/users/${id}/status`, { isActive });
    return res.data.data.customer;
  },

  /**
   * Reset a customer's password with a temporary secure placeholder
   */
  async resetUserPassword(id: string): Promise<string> {
    const res = await api.post(`/admin/users/${id}/reset-password`);
    return res.data.message || "Password successfully reset to Temp@123456";
  },
};
