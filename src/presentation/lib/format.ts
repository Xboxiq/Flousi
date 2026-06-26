/**
 * Locale- and currency-aware formatting helpers.
 * All money/number display in the UI must go through these so currency and
 * locale changes (Settings) propagate consistently.
 */

export interface FormatOptions {
  locale?: string;
  currency?: string;
}

const DEFAULTS: Required<FormatOptions> = {
  locale: "en-US",
  currency: "USD",
};

/** Format a numeric amount as currency, e.g. 1234.5 -> "$1,234.50". */
export function formatCurrency(amount: number, opts: FormatOptions = {}): string {
  const { locale, currency } = { ...DEFAULTS, ...opts };
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

/** Compact currency for tight spaces, e.g. 12500 -> "$12.5K". */
export function formatCurrencyCompact(amount: number, opts: FormatOptions = {}): string {
  const { locale, currency } = { ...DEFAULTS, ...opts };
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(amount) ? amount : 0);
}

/** Format a ratio (0.42) as a percentage string ("42.0%"). */
export function formatPercent(ratio: number, opts: { locale?: string; digits?: number } = {}): string {
  const { locale = DEFAULTS.locale, digits = 1 } = opts;
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(ratio) ? ratio : 0);
}

/** Format a plain number with grouping. */
export function formatNumber(value: number, opts: FormatOptions & { digits?: number } = {}): string {
  const { locale = DEFAULTS.locale, digits } = opts;
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: digits ?? 2,
  }).format(Number.isFinite(value) ? value : 0);
}

/** Signed delta for KPI deltas, e.g. +12.4% / -3.1%. */
export function formatSignedPercent(ratio: number, opts: { locale?: string; digits?: number } = {}): string {
  const sign = ratio > 0 ? "+" : "";
  return sign + formatPercent(ratio, opts);
}

/** Extract the currency symbol for a currency/locale, e.g. "$", "€", "ر.س". */
export function currencySymbol(currency = "USD", locale = "en-US"): string {
  try {
    const parts = new Intl.NumberFormat(locale, { style: "currency", currency }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}
