import { Money } from "./money";

/**
 * Percentage value object. Internally stored as a rate (0.1 === 10%).
 * Accepts human-facing percent values (10) and machine ratios (0.1).
 */
export class Percentage {
  private constructor(
    /** Fractional rate, e.g. 0.1 for 10%. */
    readonly rate: number,
  ) {}

  /** From a percent value where 10 means 10%. */
  static fromPercent(percent: number): Percentage {
    return new Percentage(Number.isFinite(percent) ? percent / 100 : 0);
  }

  /** From a ratio where 0.1 means 10%. */
  static fromRate(rate: number): Percentage {
    return new Percentage(Number.isFinite(rate) ? rate : 0);
  }

  static zero(): Percentage {
    return new Percentage(0);
  }

  /** Human-facing percent value (0.1 -> 10). */
  get percent(): number {
    return this.rate * 100;
  }

  /** Apply this percentage to a Money amount. */
  of(money: Money): Money {
    return money.multiply(this.rate);
  }

  add(other: Percentage): Percentage {
    return new Percentage(this.rate + other.rate);
  }
}
