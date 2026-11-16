import { z } from "zod";
import { PRICE_BANDS } from "./constants";
import type { ApplicationInput, FieldErrors, MarketDTO, MarketInput } from "./types";

type Result<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldErrors; values: Record<string, string> };

/** The text the user typed, so a form can be shown again without losing it. */
function textValues(form: FormData) {
  const values: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

/** Keeps the first message for each field. */
function collectErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!errors[field]) errors[field] = issue.message;
  }
  return errors;
}

const text = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};
const ticked = (form: FormData, name: string) => form.get(name) === "on";

const applicationSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Enter the name your business trades under")
    .max(80, "Business name must be 80 characters or fewer"),
  contactName: z
    .string()
    .trim()
    .min(2, "Enter the name of the person we should contact")
    .max(80, "Contact name must be 80 characters or fewer"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(120, "Email address must be 120 characters or fewer")
    .pipe(z.email("Enter an email address in the correct format, like name@example.com")),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+() -]{7,20}$/, "Enter a phone number, like 07700 900123"),
  website: z
    .string()
    .trim()
    .max(200, "Website address must be 200 characters or fewer")
    .refine(
      (value) => value === "" || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(value),
      "Enter a full web address starting with https://, or leave this empty",
    ),
  description: z
    .string()
    .trim()
    .min(20, "Describe what you sell in at least 20 characters")
    .max(600, "Description must be 600 characters or fewer"),
  priceBand: z.enum(
    PRICE_BANDS.map((band) => band.key) as [string, ...string[]],
    "Choose the typical price of what you sell",
  ),
  foodHygieneNumber: z.string().trim().max(40, "Registration number must be 40 characters or fewer"),
});

export function parseApplicationForm(
  form: FormData,
  market: Pick<MarketDTO, "categories" | "stallTypes">,
): Result<ApplicationInput> {
  const values = textValues(form);
  const parsed = applicationSchema.safeParse({
    businessName: text(form, "businessName"),
    contactName: text(form, "contactName"),
    email: text(form, "email"),
    phone: text(form, "phone"),
    website: text(form, "website"),
    description: text(form, "description"),
    priceBand: text(form, "priceBand"),
    foodHygieneNumber: text(form, "foodHygieneNumber"),
  });
  const errors: FieldErrors = parsed.success ? {} : collectErrors(parsed.error);

  // These depend on how the organiser has set this market up.
  const category = market.categories.find((c) => c.name === text(form, "category"));
  if (!category) errors.category = "Choose the category that best fits your stall";

  const stallType = market.stallTypes.find((s) => s.key === text(form, "stallType"));
  if (!stallType) errors.stallType = "Choose the type of pitch you want";

  if (category?.isFood && text(form, "foodHygieneNumber").trim() === "") {
    errors.foodHygieneNumber =
      "Food and drink traders must give their food business registration number";
  }

  if (!ticked(form, "privacy")) {
    errors.privacy = "Confirm you have read the privacy notice so we can process your application";
  }

  if (!parsed.success || Object.keys(errors).length > 0 || !category || !stallType) {
    return { ok: false, errors, values };
  }

  return {
    ok: true,
    data: {
      ...parsed.data,
      priceBand: parsed.data.priceBand as ApplicationInput["priceBand"],
      category: category.name,
      stallType: stallType.key,
      needsPower: ticked(form, "needsPower"),
      publicListing: ticked(form, "publicListing"),
      marketing: ticked(form, "marketing"),
    },
  };
}

const dateField = (message: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message);
const colourField = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a colour");

const marketSchema = z.object({
  name: z.string().trim().min(3, "Enter the market's name").max(80, "Name must be 80 characters or fewer"),
  tagline: z.string().trim().max(140, "Tagline must be 140 characters or fewer"),
  description: z.string().trim().max(1200, "Description must be 1,200 characters or fewer"),
  venue: z.string().trim().min(2, "Enter where the market is held").max(80),
  address: z.string().trim().max(160),
  openingHours: z.string().trim().max(160),
  announcement: z.string().trim().max(200, "Announcement must be 200 characters or fewer"),
  startDate: dateField("Enter the first day of the market"),
  endDate: dateField("Enter the last day of the market"),
  applicationsOpen: dateField("Enter the day applications open"),
  applicationsClose: dateField("Enter the day applications close"),
  brand: colourField,
  ground: colourField,
  accent: colourField,
});

export function parseMarketForm(form: FormData): Result<MarketInput> {
  const values = textValues(form);
  const parsed = marketSchema.safeParse(
    Object.fromEntries(
      Object.keys(marketSchema.shape).map((key) => [key, text(form, key)]),
    ),
  );
  if (!parsed.success) return { ok: false, errors: collectErrors(parsed.error), values };

  const d = parsed.data;
  const errors: FieldErrors = {};
  if (d.endDate < d.startDate) errors.endDate = "The last day must be on or after the first day";
  if (d.applicationsClose < d.applicationsOpen) {
    errors.applicationsClose = "Applications must close on or after the day they open";
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors, values };

  return {
    ok: true,
    data: {
      name: d.name,
      tagline: d.tagline,
      description: d.description,
      venue: d.venue,
      address: d.address,
      openingHours: d.openingHours,
      announcement: d.announcement,
      // Times are chosen so each date falls on the same calendar day in UK
      // time in both winter (UTC) and summer (UTC+1).
      startDate: new Date(`${d.startDate}T12:00:00Z`),
      endDate: new Date(`${d.endDate}T12:00:00Z`),
      applicationsOpen: new Date(`${d.applicationsOpen}T00:00:00Z`),
      applicationsClose: new Date(`${d.applicationsClose}T22:59:59Z`),
      featured: ticked(form, "featured"),
      theme: { brand: d.brand, ground: d.ground, accent: d.accent },
    },
  };
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
