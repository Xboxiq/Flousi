/**
 * A payment made to a rep against what they have earned.
 *
 * The amount is held in INTEGER MINOR UNITS (unlike the legacy
 * `Sale.unitPrice`, which stays major only because history depends on it), and
 * the currency is stored per settlement and editable from day one so a merchant
 * paying in a second currency never needs a migration.
 */
export interface Settlement {
  id: string;
  repId: string;
  /** Amount paid to the rep, integer minor units. Positive = money left the owner. */
  amountMinor: number;
  /** Defaults to `AppSettings.currency` at creation, editable afterwards. */
  currency: string;
  /** ISO timestamp. */
  paidAt: string;
  periodId?: string;
  method?: string;
  notes?: string;
}

export type NewSettlement = Omit<Settlement, "id">;

/**
 * One balance line per currency. Lines are never summed across currencies: the
 * domain holds no FX rates and never will, and `Money.add` would throw on a
 * mismatch — bricking the whole reps screen over one mistyped settlement.
 */
export interface CurrencyBalance {
  currency: string;
  /** Sum of frozen `repShareMinor` in this currency. */
  earnedMinor: number;
  /** Sum of settlement `amountMinor` in this currency. */
  settledMinor: number;
  /** earned - settled. Negative = the rep was paid ahead and owes it back. Never clamped. */
  balanceMinor: number;
}

export interface RepBalance {
  repId: string;
  lines: CurrencyBalance[];
}
