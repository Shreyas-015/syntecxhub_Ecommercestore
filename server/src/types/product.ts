export interface Product {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand?: string;
  sku?: string;
  price: number;
  discountPrice?: number;
  category?: any; // ID or fully populated Category object
  images?: string[];
  thumbnail?: string;
  stock?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  averageRating?: number;
  totalReviews?: number;
  tags?: string[];
  specifications?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
