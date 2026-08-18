export type RepStatus = "active" | "archived";

/**
 * A person who sells on the owner's behalf. No salary and — deliberately — no
 * stored balance: what a rep is owed is always derived from the frozen splits
 * minus the settlements, so voiding a sale or correcting a payment can never
 * leave a cached total behind.
 */
export interface Rep {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  status: RepStatus;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

export type NewRep = Omit<Rep, "id" | "createdAt" | "updatedAt">;

/**
 * Archived reps stay payable and stay in history — a merchant retires a rep
 * without erasing money they still owe. Callers use this to filter lists and
 * pickers; it is never a gate inside the math, which must keep producing the
 * same figures for an archived rep as for an active one.
 */
export function isArchivedRep(rep: Rep): boolean {
  return rep.status === "archived";
}
