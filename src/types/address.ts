export interface BackendAddress {
  _id: string;
  user?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
  addressType: "Home" | "Work" | "Other";
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}
