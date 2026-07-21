export interface Address {
  id?: string;
  _id?: string;
  user: string | any; // ObjectId (string) or populated User object
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
  createdAt?: Date;
  updatedAt?: Date;
}
