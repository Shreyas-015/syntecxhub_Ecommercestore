import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { Role } from "../constants/roles";

export interface IAddress {
  id?: string;
  _id?: string;
  label?: string; // e.g. "Home", "Office"
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  zipCode?: string; // Compatible with frontend
  isDefault: boolean;
}

export interface IUser extends Document {
  id: string;
  name?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  avatar?: string;
  avatarUrl?: string; // Compatible with frontend
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  refreshToken?: string;
  addresses: IAddress[];
  wishlist: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeObject(): any;
}

const AddressSchema = new Schema<IAddress>(
  {
    label: { type: String, default: "Home" },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: "USA", trim: true },
    postalCode: { type: String, required: true, trim: true },
    zipCode: { type: String, trim: true }, // Keep synced with postalCode for client
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (doc: any, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.zipCode = ret.zipCode || ret.postalCode;
        delete ret._id;
        return ret;
      }
    }
  }
);

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, unique: true, sparse: true, trim: true, index: true },
    password: { type: String, required: true },
    avatar: { type: String },
    role: { type: String, enum: Object.values(Role), default: Role.USER },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String },
    addresses: [AddressSchema],
    wishlist: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc: any, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.name = `${ret.firstName} ${ret.lastName}`;
        ret.avatarUrl = ret.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(ret.name)}`;
        delete ret._id;
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Virtual for dynamic fullName property mapping to frontend context
UserSchema.virtual("name").get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`.trim();
});

UserSchema.virtual("avatarUrl").get(function (this: IUser) {
  return this.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(this.name)}`;
});

// Middleware to hash passwords before saving
UserSchema.pre("save", async function (this: any, next: any) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare Password method
UserSchema.methods.comparePassword = async function (this: IUser, candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe output helper
UserSchema.methods.toSafeObject = function (this: IUser) {
  const obj = this.toJSON();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

export const User = mongoose.model<IUser>("User", UserSchema);
