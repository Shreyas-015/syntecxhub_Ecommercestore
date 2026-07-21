import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand?: string;
  sku?: string;
  price: number;
  discountPrice?: number;
  category?: mongoose.Types.ObjectId;
  images: string[];
  thumbnail?: string;
  stock: number;
  isFeatured: boolean;
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
  tags: string[];
  specifications?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true },
    brand: { type: String, trim: true },
    sku: { type: String, unique: true, sparse: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    category: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    images: { type: [String], default: [] },
    thumbnail: { type: String },
    stock: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0, min: 0 },
    totalReviews: { type: Number, default: 0, min: 0 },
    tags: { type: [String], default: [] },
    specifications: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc: any, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// MongoDB Index Optimization
ProductSchema.index({ name: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ tags: 1 });

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
