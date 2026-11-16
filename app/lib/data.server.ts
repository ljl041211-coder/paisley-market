import { randomInt } from "node:crypto";
import mongoose from "mongoose";
import { STATUSES, type ApplicationStatus } from "./constants";
import { connectDb } from "./db.server";
import {
  Application,
  Market,
  Pitch,
  type IApplication,
  type IMarket,
  type IPitch,
} from "./models.server";
import type {
  ApplicationDTO,
  ApplicationInput,
  MarketDTO,
  MarketInput,
  PitchDTO,
  StallDTO,
} from "./types";
import { slugify } from "./validation";

const DAY = 24 * 60 * 60 * 1000;

function toMarketDTO(m: IMarket): MarketDTO {
  return {
    id: String(m._id),
    slug: m.slug,
    name: m.name,
    tagline: m.tagline,
    description: m.description,
    venue: m.venue,
    address: m.address,
    startDate: m.startDate,
    endDate: m.endDate,
    openingHours: m.openingHours,
    applicationsOpen: m.applicationsOpen,
    applicationsClose: m.applicationsClose,
    announcement: m.announcement,
    featured: m.featured,
    theme: {
      brand: m.theme.brand,
      ground: m.theme.ground,
      accent: m.theme.accent,
    },
    categories: m.categories.map((c) => ({ name: c.name, isFood: c.isFood })),
    stallTypes: m.stallTypes.map((s) => ({
      key: s.key,
      label: s.label,
      size: s.size,
      price: s.price,
      description: s.description,
    })),
  };
}

function toApplicationDTO(
  a: IApplication,
  market: Pick<IMarket, "name" | "slug"> | null,
  pitch: Pick<IPitch, "_id" | "code"> | null,
): ApplicationDTO {
  return {
    id: String(a._id),
    marketId: String(a.market),
    marketName: market?.name ?? "",
    marketSlug: market?.slug ?? "",
    reference: a.reference,
    businessName: a.businessName,
    contactName: a.contactName,
    email: a.email,
    phone: a.phone,
    website: a.website,
    category: a.category,
    description: a.description,
    priceBand: a.priceBand,
    stallType: a.stallType,
    needsPower: a.needsPower,
    foodHygieneNumber: a.foodHygieneNumber,
    status: a.status,
    adminNotes: a.adminNotes,
    consent: {
      privacyAcceptedAt: a.consent.privacyAcceptedAt,
      publicListing: a.consent.publicListing,
      marketing: a.consent.marketing,
    },
    history: a.history.map((h) => ({ status: h.status, at: h.at, by: h.by, note: h.note })),
    deletionRequestedAt: a.deletionRequestedAt ?? null,
    erasedAt: a.erasedAt ?? null,
    retainUntil: a.retainUntil,
    createdAt: a.createdAt,
    pitchId: pitch ? String(pitch._id) : null,
    pitchCode: pitch?.code ?? null,
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listMarkets(): Promise<MarketDTO[]> {
  await connectDb();
  const markets = await Market.find().sort({ startDate: 1 }).lean<IMarket[]>();
  return markets.map(toMarketDTO);
}

export async function getMarket(slug: string): Promise<MarketDTO | null> {
  await connectDb();
  const market = await Market.findOne({ slug: slug.toLowerCase() }).lean<IMarket>();
  return market ? toMarketDTO(market) : null;
}

/** The market shown when someone opens the site's root address. */
export async function getFeaturedMarket(): Promise<MarketDTO | null> {
  await connectDb();
  const market =
    (await Market.findOne({ featured: true }).sort({ startDate: 1 }).lean<IMarket>()) ??
    (await Market.findOne().sort({ startDate: 1 }).lean<IMarket>());
  return market ? toMarketDTO(market) : null;
}

export async function updateMarket(slug: string, input: MarketInput): Promise<void> {
  await connectDb();
  if (input.featured) {
    // Only one market can be the front page.
    await Market.updateMany({ slug: { $ne: slug } }, { $set: { featured: false } });
  }
  await Market.updateOne({ slug }, { $set: input }, { runValidators: true });
}

export interface NewMarketOptions {
  rows: number;
  perRow: number;
}

/** Creates a market with default categories, stall types and a pitch grid. */
export async function createMarket(
  input: MarketInput,
  options: NewMarketOptions,
): Promise<{ slug: string } | { error: string }> {
  await connectDb();
  const slug = slugify(input.name);
  if (!slug) return { error: "The name must contain some letters or numbers" };
  if (await Market.exists({ slug })) {
    return { error: "A market with a very similar name already exists" };
  }
  if (input.featured) await Market.updateMany({}, { $set: { featured: false } });

  const market = await Market.create({
    ...input,
    slug,
    categories: [
      { name: "Food & drink", isFood: true },
      { name: "Handmade crafts", isFood: false },
      { name: "Gifts & toys", isFood: false },
      { name: "Clothing & textiles", isFood: false },
    ],
    stallTypes: [
      {
        key: "stall",
        label: "Covered stall",
        size: "3 m x 3 m",
        price: 120,
        description: "A covered table stall with lighting.",
      },
      {
        key: "food",
        label: "Food pitch",
        size: "4 m x 3 m",
        price: 220,
        description: "Space for a food unit, with power and water nearby.",
      },
    ],
  });

  const rows = Math.min(Math.max(options.rows, 1), 6);
  const perRow = Math.min(Math.max(options.perRow, 1), 12);
  const gap = 12;
  const width = Math.floor((1000 - 80 - gap * (perRow - 1)) / perRow);
  const height = Math.min(70, Math.floor((560 - 120 - 40 * (rows - 1)) / rows));
  const pitches = [];
  for (let row = 0; row < rows; row += 1) {
    const letter = String.fromCharCode(65 + row);
    const isFoodRow = row === 0;
    for (let n = 0; n < perRow; n += 1) {
      pitches.push({
        market: market._id,
        code: `${letter}${n + 1}`,
        zone: `Row ${letter}`,
        stallType: isFoodRow ? "food" : "stall",
        hasPower: isFoodRow,
        x: 40 + n * (width + gap),
        y: 70 + row * (height + 40),
        w: width,
        h: height,
        application: null,
      });
    }
  }
  await Pitch.insertMany(pitches);
  return { slug };
}

export async function getPitchCounts(marketId: string) {
  await connectDb();
  const [total, taken] = await Promise.all([
    Pitch.countDocuments({ market: marketId }),
    Pitch.countDocuments({ market: marketId, application: { $ne: null } }),
  ]);
  return { total, taken };
}

/** Pitches for the public map. Trader names appear only with their consent. */
export async function listPitches(marketId: string): Promise<PitchDTO[]> {
  await connectDb();
  const pitches = await Pitch.find({ market: marketId }).sort({ code: 1 }).lean<IPitch[]>();
  const holderIds = pitches.map((p) => p.application).filter((id) => id !== null);
  const holders = await Application.find({
    _id: { $in: holderIds },
    status: "approved",
    "consent.publicListing": true,
  })
    .select("businessName category description")
    .lean<Pick<IApplication, "_id" | "businessName" | "category" | "description">[]>();
  const byId = new Map(holders.map((h) => [String(h._id), h]));

  return pitches.map((p) => {
    const holder = p.application ? byId.get(String(p.application)) : undefined;
    return {
      id: String(p._id),
      code: p.code,
      zone: p.zone,
      stallType: p.stallType,
      hasPower: p.hasPower,
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h,
      taken: p.application !== null,
      occupant: holder
        ? {
            businessName: holder.businessName,
            category: holder.category,
            description: holder.description,
          }
        : null,
    };
  });
}

export interface StallFilters {
  q?: string;
  category?: string;
  priceBand?: string;
}

/** Approved traders who agreed to appear in the public directory. */
export async function listStalls(marketId: string, filters: StallFilters): Promise<StallDTO[]> {
  await connectDb();
  const query: Record<string, unknown> = {
    market: marketId,
    status: "approved",
    "consent.publicListing": true,
  };
  if (filters.category) query.category = filters.category;
  if (filters.priceBand) query.priceBand = filters.priceBand;
  if (filters.q) {
    const pattern = new RegExp(escapeRegex(filters.q.slice(0, 60)), "i");
    query.$or = [{ businessName: pattern }, { description: pattern }];
  }

  const stalls = await Application.find(query).sort({ businessName: 1 }).lean<IApplication[]>();
  const pitches = await Pitch.find({ application: { $in: stalls.map((s) => s._id) } })
    .select("code application")
    .lean<Pick<IPitch, "code" | "application">[]>();
  const pitchByHolder = new Map(pitches.map((p) => [String(p.application), p.code]));

  return stalls.map((s) => ({
    id: String(s._id),
    businessName: s.businessName,
    category: s.category,
    description: s.description,
    priceBand: s.priceBand,
    website: s.website,
    pitchCode: pitchByHolder.get(String(s._id)) ?? null,
  }));
}

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I

function makeReference(marketSlug: string) {
  const prefix = marketSlug
    .split("-")
    .map((word) => word[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
  let code = "";
  for (let i = 0; i < 6; i += 1) code += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return `${prefix}-${code}`;
}

export async function createApplication(market: MarketDTO, input: ApplicationInput): Promise<string> {
  await connectDb();
  const now = new Date();
  const { publicListing, marketing, ...fields } = input;

  // A reference could, very rarely, already be in use. Try a new one if so.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const reference = makeReference(market.slug);
    try {
      await Application.create({
        ...fields,
        market: market.id,
        reference,
        status: "submitted",
        consent: { privacyAcceptedAt: now, publicListing, marketing },
        history: [{ status: "submitted", at: now, by: "Trader", note: "Application submitted online" }],
        // Kept for 12 months after the market ends, then deleted automatically.
        retainUntil: new Date(new Date(market.endDate).getTime() + 365 * DAY),
      });
      return reference;
    } catch (error) {
      const duplicate = (error as { code?: number }).code === 11000;
      if (!duplicate || attempt === 4) throw error;
    }
  }
  throw new Error("Could not create a unique application reference");
}

async function loadApplication(filter: Record<string, unknown>): Promise<ApplicationDTO | null> {
  const application = await Application.findOne(filter).lean<IApplication>();
  if (!application) return null;
  const [market, pitch] = await Promise.all([
    Market.findById(application.market).select("name slug").lean<Pick<IMarket, "name" | "slug">>(),
    Pitch.findOne({ application: application._id })
      .select("code")
      .lean<Pick<IPitch, "_id" | "code">>(),
  ]);
  return toApplicationDTO(application, market, pitch);
}

function traderFilter(reference: string, email: string) {
  return {
    reference: reference.trim().toUpperCase(),
    email: email.trim().toLowerCase(),
    erasedAt: null,
  };
}

/** A trader proves an application is theirs with its reference and their email. */
export async function findTraderApplication(reference: string, email: string) {
  if (!reference.trim() || !email.trim()) return null;
  await connectDb();
  return loadApplication(traderFilter(reference, email));
}

export async function withdrawApplication(reference: string, email: string): Promise<boolean> {
  await connectDb();
  const application = await Application.findOneAndUpdate(
    { ...traderFilter(reference, email), status: { $in: ["submitted", "approved", "waitlisted"] } },
    {
      $set: { status: "withdrawn" },
      $push: {
        history: { status: "withdrawn", at: new Date(), by: "Trader", note: "Withdrawn by the trader" },
      },
    },
  );
  if (!application) return false;
  await Pitch.updateMany({ application: application._id }, { $set: { application: null } });
  return true;
}

export async function requestDeletion(reference: string, email: string): Promise<boolean> {
  await connectDb();
  const result = await Application.updateOne(
    { ...traderFilter(reference, email), deletionRequestedAt: null },
    { $set: { deletionRequestedAt: new Date() } },
  );
  return result.matchedCount > 0;
}

export interface AdminOverview {
  byStatus: Record<ApplicationStatus, number>;
  pitches: { total: number; taken: number };
  deletionRequests: number;
}

export async function adminOverview(marketId: string): Promise<AdminOverview> {
  await connectDb();
  const counts = await Promise.all(
    STATUSES.map((status) => Application.countDocuments({ market: marketId, status })),
  );
  const byStatus = Object.fromEntries(
    STATUSES.map((status, i) => [status, counts[i]]),
  ) as Record<ApplicationStatus, number>;
  const [pitches, deletionRequests] = await Promise.all([
    getPitchCounts(marketId),
    Application.countDocuments({
      market: marketId,
      deletionRequestedAt: { $ne: null },
      erasedAt: null,
    }),
  ]);
  return { byStatus, pitches, deletionRequests };
}

export async function adminListApplications(
  marketId: string,
  status?: ApplicationStatus,
): Promise<ApplicationDTO[]> {
  await connectDb();
  const query: Record<string, unknown> = { market: marketId };
  if (status) query.status = status;
  const applications = await Application.find(query).sort({ createdAt: -1 }).lean<IApplication[]>();
  const pitches = await Pitch.find({ application: { $in: applications.map((a) => a._id) } })
    .select("code application")
    .lean<Pick<IPitch, "_id" | "code" | "application">[]>();
  const pitchByHolder = new Map(pitches.map((p) => [String(p.application), p]));
  return applications.map((a) => toApplicationDTO(a, null, pitchByHolder.get(String(a._id)) ?? null));
}

export async function adminGetApplication(id: string): Promise<ApplicationDTO | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDb();
  return loadApplication({ _id: id });
}

export async function adminFreePitches(marketId: string) {
  await connectDb();
  const pitches = await Pitch.find({ market: marketId, application: null })
    .sort({ code: 1 })
    .lean<IPitch[]>();
  return pitches.map((p) => ({
    id: String(p._id),
    code: p.code,
    zone: p.zone,
    stallType: p.stallType,
    hasPower: p.hasPower,
  }));
}

export async function adminDecide(
  id: string,
  status: ApplicationStatus,
  note: string,
  adminName: string,
): Promise<void> {
  await connectDb();
  await Application.updateOne(
    { _id: id, erasedAt: null },
    {
      $set: { status },
      $push: { history: { status, at: new Date(), by: adminName, note: note.trim().slice(0, 300) } },
    },
  );
  // Only an approved trader can hold a pitch.
  if (status !== "approved") {
    await Pitch.updateMany({ application: id }, { $set: { application: null } });
  }
}

export async function adminSaveNotes(id: string, notes: string): Promise<void> {
  await connectDb();
  await Application.updateOne({ _id: id }, { $set: { adminNotes: notes.trim().slice(0, 1000) } });
}

/** Gives the application a pitch, or takes its pitch away when pitchId is "". */
export async function adminAssignPitch(
  id: string,
  pitchId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await connectDb();
  const application = await Application.findById(id).select("status market").lean<IApplication>();
  if (!application) return { ok: false, error: "Application not found" };

  if (pitchId === "") {
    await Pitch.updateMany({ application: id }, { $set: { application: null } });
    return { ok: true };
  }
  if (application.status !== "approved") {
    return { ok: false, error: "Approve the application before giving it a pitch" };
  }
  if (!mongoose.isValidObjectId(pitchId)) return { ok: false, error: "Choose a pitch from the list" };

  // The filter only matches a pitch that is still free, so two admins cannot
  // give the same pitch to two traders.
  const claimed = await Pitch.findOneAndUpdate(
    { _id: pitchId, market: application.market, application: null },
    { $set: { application: application._id } },
  );
  if (!claimed) return { ok: false, error: "That pitch has just been taken. Choose another one" };

  await Pitch.updateMany(
    { application: id, _id: { $ne: pitchId } },
    { $set: { application: null } },
  );
  return { ok: true };
}

/**
 * Right to erasure (GDPR Art. 17): removes everything that identifies the
 * trader but keeps an anonymous record so the market's totals stay correct.
 */
export async function adminErase(id: string, adminName: string): Promise<void> {
  await connectDb();
  const now = new Date();
  await Application.updateOne(
    { _id: id },
    {
      $set: {
        businessName: "[erased]",
        contactName: "",
        email: "",
        phone: "",
        website: "",
        description: "",
        foodHygieneNumber: "",
        adminNotes: "",
        status: "withdrawn",
        "consent.publicListing": false,
        "consent.marketing": false,
        erasedAt: now,
        history: [{ status: "withdrawn", at: now, by: adminName, note: "Personal data erased" }],
      },
    },
  );
  await Pitch.updateMany({ application: id }, { $set: { application: null } });
}
