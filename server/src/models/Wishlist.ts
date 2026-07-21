import mongoose, { Schema, Document } from "mongoose";

export interface IWishlist extends Document {
  user: mongoose.Types.ObjectId;
  products: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    products: {
      type: [{ type: Schema.Types.ObjectId, ref: "Product" }],
      default: [],
      validate: {
        validator: function (products: any[]) {
          const productIds = products.map(id => String(id));
          return productIds.length === new Set(productIds).size;
        },
        message: "Wishlist cannot contain duplicate products."
      }
    }
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
      }
    }
  }
);

// Pre-save validation: Check if products exist in DB
WishlistSchema.pre("save", async function (this: IWishlist, next: any) {
  if (this.products && this.products.length > 0) {
    const ProductModel = mongoose.model("Product");
    const count = await ProductModel.countDocuments({ _id: { $in: this.products } });
    if (count !== this.products.length) {
      return next(new Error("One or more products in the wishlist do not exist."));
    }
  }
  next();
});

export const Wishlist = mongoose.model<IWishlist>("Wishlist", WishlistSchema);
