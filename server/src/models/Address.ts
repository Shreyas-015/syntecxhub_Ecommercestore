import mongoose, { Schema, Document } from "mongoose";

export interface IAddress extends Document {
  user: mongoose.Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fullName: { type: String, required: [true, "Full name is required"], trim: true },
    phone: { type: String, required: [true, "Phone number is required"], trim: true },
    addressLine1: { type: String, required: [true, "Address Line 1 is required"], trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: [true, "City is required"], trim: true },
    state: { type: String, required: [true, "State is required"], trim: true },
    postalCode: { type: String, required: [true, "Postal code is required"], trim: true },
    country: { type: String, required: [true, "Country is required"], trim: true },
    landmark: { type: String, trim: true },
    addressType: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home"
    },
    isDefault: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const Address = mongoose.model<IAddress>("Address", AddressSchema);
