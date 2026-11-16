// Dates are always shown in UK time so the server and the browser print the
// same text, whatever time zone either of them is in.
const TIME_ZONE = "Europe/London";

const dayMonthYear = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});
const dayMonth = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  timeZone: TIME_ZONE,
});
const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

export function formatDate(date: Date) {
  return dayMonthYear.format(new Date(date));
}

export function formatDateTime(date: Date) {
  return dateTime.format(new Date(date));
}

/** "26 November to 23 December 2027" */
export function formatDateRange(start: Date, end: Date) {
  const a = new Date(start);
  const b = new Date(end);
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  return `${sameYear ? dayMonth.format(a) : dayMonthYear.format(a)} to ${dayMonthYear.format(b)}`;
}

/** Value for an <input type="date">. */
export function toDateInput(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function formatPrice(pounds: number) {
  return `£${pounds.toLocaleString("en-GB")}`;
}

export type ApplicationWindow = "not-open-yet" | "open" | "closed";

export function applicationWindow(
  market: { applicationsOpen: Date; applicationsClose: Date },
  now = new Date(),
): ApplicationWindow {
  if (now < new Date(market.applicationsOpen)) return "not-open-yet";
  if (now > new Date(market.applicationsClose)) return "closed";
  return "open";
}
