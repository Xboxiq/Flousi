/**
 * Money value object.
 *
 * Stores amounts as integer minor units (cents) to avoid floating-point drift
 * in financial arithmetic. Immutable: every operation returns a new instance.
 */
export class Money {
  private constructor(
    /** Amount in minor units (e.g. cents). Always an integer. */
    readonly minorUnits: number,
    /** ISO 4217 currency code, e.g. "USD". */
    readonly currency: string,
  ) {}

  static fromMajor(amount: number, currency = "USD"): Money {
    const safe = Number.isFinite(amount) ? amount : 0;
    return new Money(Math.round(safe * 100), currency);
  }

  static fromMinor(minorUnits: number, currency = "USD"): Money {
    return new Money(Math.round(minorUnits), currency);
  }

  static zero(currency = "USD"): Money {
    return new Money(0, currency);
  }

  /** Value in major units (e.g. dollars). */
  get amount(): number {
    return this.minorUnits / 100;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits + other.minorUnits, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits - other.minorUnits, this.currency);
  }

  /** Multiply by a scalar (e.g. quantity or a rate); result is rounded to minor units. */
  multiply(factor: number): Money {
    const safe = Number.isFinite(factor) ? factor : 0;
    return new Money(Math.round(this.minorUnits * safe), this.currency);
  }

  /** Divide by a scalar; returns zero for divide-by-zero rather than throwing. */
  divide(divisor: number): Money {
    if (!divisor) return Money.zero(this.currency);
    return new Money(Math.round(this.minorUnits / divisor), this.currency);
  }

  /** Ratio of this amount to another (unitless). Returns 0 if `other` is zero. */
  ratioTo(other: Money): number {
    if (other.minorUnits === 0) return 0;
    return this.minorUnits / other.minorUnits;
  }

  isZero(): boolean {
    return this.minorUnits === 0;
  }

  isPositive(): boolean {
    return this.minorUnits > 0;
  }

  isNegative(): boolean {
    return this.minorUnits < 0;
  }

  /** -1 | 0 | 1 */
  compareTo(other: Money): number {
    this.assertSameCurrency(other);
    return Math.sign(this.minorUnits - other.minorUnits);
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.minorUnits === other.minorUnits;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: cannot operate on ${this.currency} and ${other.currency}`,
      );
    }
  }
}
