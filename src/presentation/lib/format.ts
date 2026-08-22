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

/**
 * Locale-aware date. Digits forced to latn so dates and money never mix
 * numbering systems on one surface (MASTER §6).
 */
export function formatDate(
  date: Date | string,
  opts: { locale?: string } & Intl.DateTimeFormatOptions = {},
): string {
  const { locale = DEFAULTS.locale, ...dtOpts } = opts;
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    numberingSystem: "latn",
    ...(Object.keys(dtOpts).length ? dtOpts : { year: "numeric", month: "short", day: "numeric" }),
  } as Intl.DateTimeFormatOptions).format(d);
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

/**
 * The four Arabic forms a counted noun takes. `one` and `two` are COMPLETE phrases
 * with no digit in them, because Arabic says «قطعة واحدة» and «قطعتان» rather than
 * «1 قطعة» and «2 قطعة». `few` (3 to 10) and `singular` (11 and up) are the noun
 * that follows the digit.
 */
export interface CountedForms {
  /** The whole phrase at exactly one: «قطعة واحدة». */
  one: string;
  /**
   * The whole phrase at exactly two, in the NOMINATIVE: «قطعتان». The dual declines,
   * so a phrase from this helper belongs in subject position. After a preposition
   * («في طلبيتين») the case changes, and the copy must use the colon form the app
   * uses elsewhere instead of this.
   */
  two: string;
  /** The PLURAL noun, for 3 to 10 and for zero: «قطع». */
  few: string;
  /** The SINGULAR noun, for 11 and up: «قطعة». */
  singular: string;
}

/**
 * A counted noun in correct Arabic.
 *
 * The noun agrees with the count, so no single template is right at every number:
 * «3 قطعة» and «1 قطعة» are both wrong Arabic, and both are the kind of mistake a
 * merchant notices before he notices anything else on the screen. `Intl.PluralRules`
 * already knows the categories for `ar`, so the categories are read from it rather
 * than reimplemented here.
 *
 * A count that has no natural phrase falls back to the colon form the app uses
 * elsewhere («أهداف محدّدة: 3»), which is right at every number.
 */
export function countedNoun(
  value: number,
  forms: CountedForms,
  opts: { locale?: string } = {},
): string {
  const locale = opts.locale ?? DEFAULTS.locale;
  const n = formatNumber(value, { locale, digits: 0 });
  let category: Intl.LDMLPluralRule;
  try {
    category = new Intl.PluralRules(locale).select(value);
  } catch {
    return `${n} ${forms.singular}`;
  }
  switch (category) {
    case "one":
      return forms.one;
    case "two":
      return forms.two;
    case "zero":
    case "few":
      return `${n} ${forms.few}`;
    default:
      // 11 and up: the digit followed by the singular.
      return `${n} ${forms.singular}`;
  }
}

/** The forms used across the app, so one screen never disagrees with another. */
export const NOUNS = {
  piece: { one: "قطعة واحدة", two: "قطعتان", few: "قطع", singular: "قطعة" },
  item: { one: "صنف واحد", two: "صنفان", few: "أصناف", singular: "صنفًا" },
  order: { one: "طلبية واحدة", two: "طلبيتان", few: "طلبيات", singular: "طلبية" },
  sale: { one: "بيعة واحدة", two: "بيعتان", few: "بيعات", singular: "بيعة" },
  operation: { one: "عملية واحدة", two: "عمليتان", few: "عمليات", singular: "عملية" },
} satisfies Record<string, CountedForms>;
