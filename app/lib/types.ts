// Plain shapes sent from loaders to pages. Database documents are converted
// to these so that pages never receive more fields than they need.
import type { ApplicationStatus, PriceBand } from "./constants";

export interface MarketDTO {
  id: string;
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
  theme: { brand: string; ground: string; accent: string };
  categories: { name: string; isFood: boolean }[];
  stallTypes: { key: string; label: string; size: string; price: number; description: string }[];
}

/** A confirmed trader as shown to the public. No contact details. */
export interface StallDTO {
  id: string;
  businessName: string;
  category: string;
  description: string;
  priceBand: PriceBand;
  website: string;
  pitchCode: string | null;
}

export interface PitchDTO {
  id: string;
  code: string;
  zone: string;
  stallType: string;
  hasPower: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  taken: boolean;
  /** Only filled in when the trader agreed to be listed publicly. */
  occupant: { businessName: string; category: string; description: string } | null;
}

export interface HistoryDTO {
  status: ApplicationStatus;
  at: Date;
  by: string;
  note: string;
}

/** Everything about an application. Only for the trader who owns it and admins. */
export interface ApplicationDTO {
  id: string;
  marketId: string;
  marketName: string;
  marketSlug: string;
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
  consent: { privacyAcceptedAt: Date; publicListing: boolean; marketing: boolean };
  history: HistoryDTO[];
  deletionRequestedAt: Date | null;
  erasedAt: Date | null;
  retainUntil: Date;
  createdAt: Date;
  pitchId: string | null;
  pitchCode: string | null;
}

export interface ApplicationInput {
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
  publicListing: boolean;
  marketing: boolean;
}

export interface MarketInput {
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
  theme: { brand: string; ground: string; accent: string };
}

export type FieldErrors = Record<string, string>;
