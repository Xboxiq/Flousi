import {
  CAPABILITIES,
  OWNER_ROLE_ID,
  isOwnerRole,
  ownerRole,
  type AccessSession,
  type Capability,
  type Role,
} from "../entities/role";

/**
 * The resolved answer to «من يستخدم التطبيق الآن، وماذا يستطيع؟».
 *
 * Every screen and every read model asks this object rather than reasoning about
 * roles itself, so there is exactly one place the rules live.
 */
export interface ResolvedAccess {
  role: Role;
  /** Set when the session is bound to one rep. */
  repId?: string;
  /** True when this is the unrestricted owner session. */
  isOwner: boolean;
  can(capability: Capability): boolean;
  /**
   * Which sales this session may read. Three real states, not two:
   *
   * * `undefined` — every sale in the store.
   * * `{ repId }` — that rep's sales only.
   * * `"none"` — no sales at all, which is what a role without `viewAllSales`
   *   that is bound to nobody honestly means. Collapsing it into "every sale"
   *   would leak the store; collapsing it into a rep id that happens not to exist
   *   would work only by accident.
   *
   * Read models take this and filter at the SOURCE, so a scoped total is that
   * rep's total rather than the store's with rows hidden (gate P3/G3).
   */
  salesScope: { repId: string } | "none" | undefined;
}

export const AccessPolicy = {
  /**
   * Resolves the session against the stored roles.
   *
   * Falls back to the OWNER on anything unexpected — no session, an id that resolves
   * to nothing (a deleted role), or an archived role. The alternative is a session
   * with no capabilities at all, which denies `manageAccess` too and leaves the
   * merchant unable to reach the screen that would fix it (gate P3/G10).
   */
  resolve(roles: readonly Role[], session: AccessSession | null | undefined): ResolvedAccess {
    const owner = roles.find((r) => isOwnerRole(r)) ?? ownerRole();
    const found = session?.roleId
      ? roles.find((r) => r.id === session.roleId && r.status === "active")
      : undefined;
    const role = found ?? owner;
    const isOwner = isOwnerRole(role);

    // The owner always holds everything, even if a stored row was tampered with:
    // the built-in role's capability list is not data we trust from storage.
    const granted = new Set<Capability>(isOwner ? CAPABILITIES : role.capabilities);

    // A binding belongs to a limited view. When the resolved role is the owner —
    // either genuinely or because we fell back from a deleted role — any stored
    // binding is stale and is dropped, so a fallback can never leave the owner
    // looking at one rep's numbers while believing they are the store's.
    const repId = isOwner ? undefined : session?.repId;

    return {
      role: isOwner ? { ...role, capabilities: [...CAPABILITIES] } : role,
      repId,
      isOwner,
      can: (capability) => granted.has(capability),
      salesScope: granted.has("viewAllSales") ? undefined : repId ? { repId } : "none",
    };
  },

  /**
   * Whether `role` may be edited at all. The owner may not: it is the way back.
   */
  isEditable(role: Pick<Role, "id" | "builtIn">): boolean {
    return !isOwnerRole(role) && !role.builtIn;
  },

  /**
   * Normalises a capability list before it is stored.
   *
   * Drops unknown members (a hand-edited backup), de-duplicates, and keeps the
   * declared order so the matrix reads the same everywhere. `manageAccess` is NOT
   * silently added or removed: granting it is the merchant's decision, and the way
   * back does not depend on it — switching to the owner is always possible on this
   * device (gate P3/G2).
   */
  sanitise(capabilities: readonly string[]): Capability[] {
    const wanted = new Set(capabilities);
    return CAPABILITIES.filter((c) => wanted.has(c));
  },

  /** A session for a role, optionally as one rep. */
  session(roleId: string, now: string, repId?: string): AccessSession {
    return { roleId, repId, since: now };
  },

  /**
   * Whether a sale (or anything else carrying a `repId`) falls inside a scope.
   *
   * One helper, so no caller has to remember that `"none"` exists — which is
   * exactly the thing a caller forgets on the one screen that then leaks.
   */
  inScope(scope: ResolvedAccess["salesScope"], subject: { repId?: string }): boolean {
    if (scope === undefined) return true;
    if (scope === "none") return false;
    return subject.repId === scope.repId;
  },

  /** The way home. Always available on this device. */
  ownerSession(now: string): AccessSession {
    return { roleId: OWNER_ROLE_ID, since: now };
  },
};
