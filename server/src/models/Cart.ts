import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  priceAtAddition: number;
}

export interface ISavedForLaterItem {
  product: mongoose.Types.ObjectId;
  priceAtAddition: number;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  savedForLater: ISavedForLaterItem[];
  totalItems: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
    priceAtAddition: { type: Number, required: true, min: [0, "Price must be non-negative"] }
  },
  { _id: false }
);

const SavedForLaterItemSchema = new Schema<ISavedForLaterItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    priceAtAddition: { type: Number, required: true, min: [0, "Price must be non-negative"] }
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: {
      type: [CartItemSchema],
      default: [],
      validate: {
        validator: function (items: ICartItem[]) {
          const productIds = items.map(item => String(item.product));
          return productIds.length === new Set(productIds).size;
        },
        message: "Cart cannot contain duplicate products."
      }
    },
    savedForLater: {
      type: [SavedForLaterItemSchema],
      default: []
    },
    totalItems: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, default: 0, min: 0 }
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
CartSchema.pre("save", async function (this: ICart, next: any) {
  if (this.items && this.items.length > 0) {
    const productIds = this.items.map(item => item.product);
    const ProductModel = mongoose.model("Product");
    const count = await ProductModel.countDocuments({ _id: { $in: productIds } });
    if (count !== productIds.length) {
      return next(new Error("One or more products in the cart do not exist."));
    }
  }
  next();
});

export const Cart = mongoose.model<ICart>("Cart", CartSchema);
