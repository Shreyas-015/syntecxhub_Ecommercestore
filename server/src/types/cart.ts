import { Product } from "./product";

export interface CartItem {
  product: string | Product | any; // ObjectId (string) or populated Product object
  quantity: number;
  priceAtAddition: number;
}

export interface Cart {
  id?: string;
  _id?: string;
  user: string | any; // ObjectId (string) or populated User object
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  createdAt?: Date;
  updatedAt?: Date;
}
