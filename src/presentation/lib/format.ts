/**
 * Locale- and currency-aware formatting. Arabic-first (default ar-IQ + IQD).
 * Digits are forced to Western (latn) for numeric clarity in a finance product
 * and to render cleanly in the mono figure font.
 */

export interface FormatOptions {
  locale?: string;
  currency?: string;
}

const DEFAULTS: Required<FormatOptions> = {
  locale: "ar-IQ",
  currency: "IQD",
};

// Currencies conventionally displayed with no fraction digits.
const ZERO_DECIMAL = new Set(["IQD", "JPY", "KRW", "VND", "CLP", "ISK"]);

function fractionDigits(currency: string): number {
  return ZERO_DECIMAL.has(currency) ? 0 : 2;
}

export function formatCurrency(amount: number, opts: FormatOptions = {}): string {
  const { locale, currency } = { ...DEFAULTS, ...opts };
  const digits = fractionDigits(currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    numberingSystem: "latn",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatCurrencyCompact(amount: number, opts: FormatOptions = {}): string {
  const { locale, currency } = { ...DEFAULTS, ...opts };
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    numberingSystem: "latn",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatPercent(ratio: number, opts: { locale?: string; digits?: number } = {}): string {
  const { locale = DEFAULTS.locale, digits = 1 } = opts;
  return new Intl.NumberFormat(locale, {
    style: "percent",
    numberingSystem: "latn",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(ratio) ? ratio : 0);
}

export function formatNumber(value: number, opts: FormatOptions & { digits?: number } = {}): string {
  const { locale = DEFAULTS.locale, digits } = opts;
  return new Intl.NumberFormat(locale, {
    numberingSystem: "latn",
    maximumFractionDigits: digits ?? 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatSignedPercent(ratio: number, opts: { locale?: string; digits?: number } = {}): string {
  const sign = ratio > 0 ? "+" : "";
  return sign + formatPercent(ratio, opts);
}

/** Currency symbol for a currency/locale, e.g. "$", "د.ع". */
export function currencySymbol(currency = DEFAULTS.currency, locale = DEFAULTS.locale): string {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      numberingSystem: "latn",
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}
