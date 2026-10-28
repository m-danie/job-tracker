// Fixed locale and time zone so server and browser render the same text
// shortcut: dates show in UTC, switch to the user's time zone once we store it
const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export const formatDate = (value: Date | string) => dateFormat.format(new Date(value));

export function formatSalary(min: number | null, max: number | null, currency: string) {
  if (min == null && max == null) return null;
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  if (min != null && max != null) return `${money.format(min)} – ${money.format(max)}`;
  return min != null ? `From ${money.format(min)}` : `Up to ${money.format(max!)}`;
}

// "YYYY-MM-DD", the same form Postgres date columns arrive in, so dates compare as strings
// shortcut: this is the UTC date, like formatDate; switch both to the user's time zone together
export const today = () => new Date().toISOString().slice(0, 10);
