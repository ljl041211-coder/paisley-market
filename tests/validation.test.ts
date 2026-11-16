import assert from "node:assert/strict";
import { test } from "node:test";
import { applicationWindow, formatDateRange } from "../app/lib/format";
import { readableOn, tintOnWhite } from "../app/lib/theme";
import { parseApplicationForm, parseMarketForm, slugify } from "../app/lib/validation";

const market = {
  categories: [
    { name: "Food & drink", isFood: true },
    { name: "Handmade crafts", isFood: false },
  ],
  stallTypes: [{ key: "stall", label: "Open stall", size: "3 m x 3 m", price: 260, description: "" }],
};

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const validApplication = {
  businessName: "Candle Close",
  contactName: "Priya Nair",
  email: "  Priya@Example.com ",
  phone: "07700 900123",
  website: "",
  category: "Handmade crafts",
  description: "Soy candles poured in Paisley in winter scents.",
  priceBand: "10-25",
  stallType: "stall",
  foodHygieneNumber: "",
  privacy: "on",
};

test("a complete application is accepted and tidied up", () => {
  const result = parseApplicationForm(form(validApplication), market);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.email, "priya@example.com");
  assert.equal(result.data.publicListing, false, "optional consent is off unless ticked");
  assert.equal(result.data.marketing, false);
});

test("an empty application reports every required answer", () => {
  const result = parseApplicationForm(form({}), market);
  assert.equal(result.ok, false);
  if (result.ok) return;
  for (const field of ["businessName", "contactName", "email", "phone", "category", "description", "priceBand", "stallType", "privacy"]) {
    assert.ok(result.errors[field], `expected an error for ${field}`);
  }
});

test("food traders must give a registration number", () => {
  const result = parseApplicationForm(form({ ...validApplication, category: "Food & drink" }), market);
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.foodHygieneNumber);
});

test("a category or pitch type the market does not offer is refused", () => {
  const result = parseApplicationForm(form({ ...validApplication, category: "Fireworks", stallType: "castle" }), market);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.category);
    assert.ok(result.errors.stallType);
  }
});

test("the privacy notice must be accepted", () => {
  const { privacy, ...withoutPrivacy } = validApplication;
  const result = parseApplicationForm(form(withoutPrivacy), market);
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.privacy);
});

const validMarket = {
  name: "Paisley Easter Market",
  tagline: "",
  description: "",
  venue: "County Square",
  address: "",
  openingHours: "",
  announcement: "",
  startDate: "2027-04-03",
  endDate: "2027-04-04",
  applicationsOpen: "2026-12-01",
  applicationsClose: "2027-02-01",
  brand: "#2e6b4f",
  ground: "#ffe9a8",
  accent: "#7c2d7a",
};

test("market details are accepted and dates are converted", () => {
  const result = parseMarketForm(form(validMarket));
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data.startDate.toISOString(), "2027-04-03T12:00:00.000Z");
});

test("a market cannot end before it starts", () => {
  const result = parseMarketForm(form({ ...validMarket, endDate: "2027-04-01" }));
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.endDate);
});

test("helpers", () => {
  assert.equal(slugify("Paisley Christmas Market!"), "paisley-christmas-market");
  assert.equal(readableOn("#12382e"), "#ffffff");
  assert.equal(readableOn("#ffe9a8"), "#1c1c1e");
  assert.equal(tintOnWhite("#a3212f"), "#a3212f", "a dark tint is used as it is");
  assert.equal(tintOnWhite("#ffd60a"), "#1c1c1e", "a pale tint falls back to the label colour");
  assert.equal(
    formatDateRange(new Date("2027-11-26T12:00:00Z"), new Date("2027-12-23T12:00:00Z")),
    "26 November to 23 December 2027",
  );
  const window = { applicationsOpen: new Date("2026-11-01"), applicationsClose: new Date("2027-03-31") };
  assert.equal(applicationWindow(window, new Date("2026-12-01")), "open");
  assert.equal(applicationWindow(window, new Date("2027-04-01")), "closed");
});
