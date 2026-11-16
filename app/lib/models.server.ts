import mongoose, { Schema, type Model, type Types } from "mongoose";
import { PRICE_BANDS, STATUSES, type ApplicationStatus, type PriceBand } from "./constants";

export interface ICategory {
  name: string;
  isFood: boolean;
}

export interface IStallType {
  key: string;
  label: string;
  size: string;
  price: number;
  description: string;
}

export interface IMarket {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  venue: string;
  address: string;
  startDate: Date;
  endDate: Date;
  openingHours: string;
  applicationsOpen: Date;
  applicationsClose: Date;
  announcement: string;
  featured: boolean;
  theme: {
    brand: string; // tint: buttons, links and the active tab
    ground: string; // background of the hero card
    accent: string; // highlights on the hero card
  };
  categories: ICategory[];
  stallTypes: IStallType[];
  createdAt: Date;
  updatedAt: Date;
}

const hexColour = /^#[0-9a-fA-F]{6}$/;

const marketSchema = new Schema<IMarket>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    venue: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    openingHours: { type: String, default: "", trim: true },
    applicationsOpen: { type: Date, required: true },
    applicationsClose: { type: Date, required: true },
    announcement: { type: String, default: "", trim: true },
    featured: { type: Boolean, default: false },
    theme: {
      brand: { type: String, default: "#0066cc", match: hexColour },
      ground: { type: String, default: "#1c1c1e", match: hexColour },
      accent: { type: String, default: "#ffd60a", match: hexColour },
    },
    categories: [
      {
        _id: false,
        name: { type: String, required: true },
        isFood: { type: Boolean, default: false },
      },
    ],
    stallTypes: [
      {
        _id: false,
        key: { type: String, required: true },
        label: { type: String, required: true },
        size: { type: String, default: "" },
        price: { type: Number, required: true, min: 0 },
        description: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true },
);

export interface IPitch {
  _id: Types.ObjectId;
  market: Types.ObjectId;
  code: string;
  zone: string;
  stallType: string;
  hasPower: boolean;
  // Position on the site plan, in a 1000 x 560 drawing area.
  x: number;
  y: number;
  w: number;
  h: number;
  // The application that holds this pitch, or null when it is free.
  application: Types.ObjectId | null;
}

const pitchSchema = new Schema<IPitch>({
  market: { type: Schema.Types.ObjectId, ref: "Market", required: true, index: true },
  code: { type: String, required: true, trim: true },
  zone: { type: String, default: "" },
  stallType: { type: String, required: true },
  hasPower: { type: Boolean, default: false },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  w: { type: Number, required: true },
  h: { type: Number, required: true },
  application: { type: Schema.Types.ObjectId, ref: "Application", default: null },
});
pitchSchema.index({ market: 1, code: 1 }, { unique: true });

export interface IHistoryEntry {
  status: ApplicationStatus;
  at: Date;
  by: string;
  note: string;
}

export interface IApplication {
  _id: Types.ObjectId;
  market: Types.ObjectId;
  reference: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  category: string;
  description: string;
  priceBand: PriceBand;
  stallType: string;
  needsPower: boolean;
  foodHygieneNumber: string;
  status: ApplicationStatus;
  adminNotes: string;
  consent: {
    privacyAcceptedAt: Date;
    publicListing: boolean;
    marketing: boolean;
  };
  history: IHistoryEntry[];
  deletionRequestedAt: Date | null;
  erasedAt: Date | null;
  retainUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    market: { type: Schema.Types.ObjectId, ref: "Market", required: true, index: true },
    reference: { type: String, required: true, unique: true, uppercase: true },
    businessName: { type: String, required: true, trim: true, maxlength: 80 },
    contactName: { type: String, default: "", trim: true, maxlength: 80 },
    email: { type: String, default: "", trim: true, lowercase: true, maxlength: 120 },
    phone: { type: String, default: "", trim: true, maxlength: 30 },
    website: { type: String, default: "", trim: true, maxlength: 200 },
    category: { type: String, required: true },
    description: { type: String, default: "", trim: true, maxlength: 600 },
    priceBand: { type: String, enum: PRICE_BANDS.map((band) => band.key), required: true },
    stallType: { type: String, required: true },
    needsPower: { type: Boolean, default: false },
    foodHygieneNumber: { type: String, default: "", trim: true, maxlength: 40 },
    status: { type: String, enum: STATUSES, default: "submitted", index: true },
    adminNotes: { type: String, default: "", trim: true, maxlength: 1000 },
    consent: {
      privacyAcceptedAt: { type: Date, required: true },
      publicListing: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false },
    },
    history: [
      {
        _id: false,
        status: { type: String, enum: STATUSES, required: true },
        at: { type: Date, required: true },
        by: { type: String, default: "" },
        note: { type: String, default: "" },
      },
    ],
    deletionRequestedAt: { type: Date, default: null },
    erasedAt: { type: Date, default: null },
    retainUntil: { type: Date, required: true },
  },
  { timestamps: true },
);

// Storage limitation (GDPR Art. 5(1)(e)): MongoDB deletes an application by
// itself once its retainUntil date has passed.
applicationSchema.index({ retainUntil: 1 }, { expireAfterSeconds: 0 });

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin";
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin"], default: "admin" },
  },
  { timestamps: true },
);

// Re-use the compiled models when the dev server reloads this file.
export const Market: Model<IMarket> =
  (mongoose.models.Market as Model<IMarket>) ?? mongoose.model<IMarket>("Market", marketSchema);
export const Pitch: Model<IPitch> =
  (mongoose.models.Pitch as Model<IPitch>) ?? mongoose.model<IPitch>("Pitch", pitchSchema);
export const Application: Model<IApplication> =
  (mongoose.models.Application as Model<IApplication>) ??
  mongoose.model<IApplication>("Application", applicationSchema);
export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ?? mongoose.model<IUser>("User", userSchema);
