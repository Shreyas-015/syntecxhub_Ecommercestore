export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  discountPrice: number;
  rating: number;
  reviewsCount: number;
  images: string[];
  specifications: Record<string, string>;
  isFeatured?: boolean;
  isNew?: boolean;
  stock: number;
  sku?: string;
  thumbnail?: string;
  isActive?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface FilterState {
  searchQuery: string;
  category: string;
  brand: string;
  minPrice: number;
  maxPrice: number;
  sortBy: string;
}
