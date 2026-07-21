import { Product } from "./product";

export interface Wishlist {
  id?: string;
  _id?: string;
  user: string | any; // ObjectId (string) or populated User object
  products: (string | Product | any)[]; // Array of ObjectIds or populated Products
  createdAt?: Date;
  updatedAt?: Date;
}
