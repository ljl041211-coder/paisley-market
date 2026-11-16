export const STATUSES = [
  "submitted",
  "approved",
  "waitlisted",
  "rejected",
  "withdrawn",
] as const;
export type ApplicationStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Received",
  approved: "Approved",
  waitlisted: "Waiting list",
  rejected: "Not successful",
  withdrawn: "Withdrawn",
};

export const STATUS_EXPLANATIONS: Record<ApplicationStatus, string> = {
  submitted:
    "We have your application. The market team reviews applications in the order they arrive.",
  approved:
    "Your application has been approved. Your pitch is shown below once the team has allocated it.",
  waitlisted:
    "Every pitch of this type is taken for now. You are on the waiting list and we will contact you if one becomes free.",
  rejected:
    "We could not offer you a pitch this time. The note from the market team explains why.",
  withdrawn: "This application has been withdrawn and will not be considered.",
};

export const PRICE_BANDS = [
  { key: "under-10", label: "Under £10" },
  { key: "10-25", label: "£10 to £25" },
  { key: "25-50", label: "£25 to £50" },
  { key: "over-50", label: "Over £50" },
] as const;
export type PriceBand = (typeof PRICE_BANDS)[number]["key"];

export function priceBandLabel(key: string) {
  return PRICE_BANDS.find((band) => band.key === key)?.label ?? key;
}

// Colours used to tell categories apart on the pitch map. A market's
// categories take these in order.
export const CATEGORY_COLOURS = [
  "#c93400", // orange
  "#0071a4", // teal
  "#8944ab", // purple
  "#248a3d", // green
  "#d30f45", // pink
  "#3634a3", // indigo
  "#636366", // grey
];

export function categoryColour(categories: { name: string }[], name: string) {
  const position = categories.findIndex((category) => category.name === name);
  return CATEGORY_COLOURS[
    (position < 0 ? CATEGORY_COLOURS.length - 1 : position) %
      CATEGORY_COLOURS.length
  ];
}

export const PLATFORM_NAME = "Marktplatz";
