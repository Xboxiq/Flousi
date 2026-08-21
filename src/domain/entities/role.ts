/**
 * What a role is allowed to see and do.
 *
 * Every member names a real surface in THIS product. There is deliberately no
 * `canRead`/`canWrite` grid: a capability nothing consumes is dead flexibility, and
 * a matrix invented for symmetry ends up describing an app nobody built (gate
 * P3/G1). If a capability is added here, something must read it.
 */
export const CAPABILITIES = [
  /** Sees purchase prices, cost lines and margin. The merchant's own secret. */
  "viewCosts",
  /** Sees the whole store's sales. Without it, a session sees only its own rep's. */
  "viewAllSales",
  /**
   * Opens the catalogue and a product's page. Separate from `manageProducts` on
   * purpose: a rep who may record a sale has to be able to FIND the product, and
   * that is not the same permission as editing it.
   */
  "viewProducts",
  /** Sees the team screen, other reps' figures and the schemes bench. */
  "viewTeam",
  /** Opens the reports hub and the report views. */
  "viewReports",
  /** Opens the targets screen. */
  "viewTargets",
  /** Opens the settlements list and the movement log. */
  "viewLedger",
  /** Creates and edits products. */
  "manageProducts",
  /** Records a sale. */
  "recordSales",
  /** Creates and edits reps, schemes and assignments. */
  "manageTeam",
  /** Pays a rep. Money leaving the till is its own decision. */
  "settleBalances",
  /** Sets targets. */
  "manageTargets",
  /** Closes a month. Irreversible, so it is never bundled with anything. */
  "closePeriods",
  /** Exports and downloads data. */
  "exportData",
  /** Changes settings, restores a backup, resets the store. */
  "manageSettings",
  /** Manages roles and switches the session. The way back (gate P3/G2). */
  "manageAccess",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/** Arabic label per capability, as the matrix on `/access` prints it. */
export const CAPABILITY_LABELS: Record<Capability, string> = {
  viewCosts: "يرى تكاليف الشراء والهامش",
  viewAllSales: "يرى مبيعات المتجر كلها",
  viewProducts: "يرى قائمة المنتجات",
  viewTeam: "يرى الفريق وحصص الآخرين",
  viewReports: "يفتح التقارير",
  viewTargets: "يفتح الأهداف",
  viewLedger: "يفتح التسويات والسجل",
  manageProducts: "يضيف المنتجات ويعدّلها",
  recordSales: "يسجّل البيعات",
  manageTeam: "يدير المندوبين وطرق العمولة",
  settleBalances: "يسوّي حسابات المندوبين",
  manageTargets: "يحدّد الأهداف",
  closePeriods: "يغلق الشهر",
  exportData: "يصدّر البيانات",
  manageSettings: "يغيّر الإعدادات والنسخ الاحتياطية",
  manageAccess: "يدير الأدوار ويبدّل وضع العرض",
};

/** One line of help per capability, for the row that needs it. */
export const CAPABILITY_NOTES: Partial<Record<Capability, string>> = {
  viewCosts: "بدونها لا يظهر سعر الشراء ولا بنود التكلفة ولا الهامش في أي شاشة.",
  viewAllSales: "بدونها ترى الجلسة مبيعات المندوب المرتبط بها وحده.",
  viewProducts: "لازمة لمن يسجّل البيعات: لا يمكن اختيار منتج لا يُرى.",
  closePeriods: "فعل لا رجعة فيه، فلا يُمنح مع غيره تلقائياً.",
  manageAccess: "من يملكها يستطيع الرجوع إلى وضع المالك. لا تمنحها لدور محدود.",
};

export type RoleStatus = "active" | "archived";

/**
 * A named set of capabilities.
 *
 * `builtIn` marks the owner: it holds every capability, cannot be edited and cannot
 * be deleted, because a merchant who edits his own way out of `/access` has locked
 * himself out of his own data on a device with no server to appeal to (gate P3/G2).
 * The seeded rep and accountant roles are NOT built in — they are starting points,
 * and a starting point a merchant cannot change is a decision taken away from him.
 */
export interface Role {
  id: string;
  name: string;
  /** Shown under the name on `/access`. */
  description?: string;
  capabilities: Capability[];
  /** True only for the owner. */
  builtIn?: boolean;
  status: RoleStatus;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

export type NewRole = Omit<Role, "id" | "createdAt" | "updatedAt">;

/** The owner's id is fixed so the fallback in `resolveSession` cannot miss it. */
export const OWNER_ROLE_ID = "role-owner";

export function ownerRole(now = "1970-01-01T00:00:00.000Z"): Role {
  return {
    id: OWNER_ROLE_ID,
    name: "المالك",
    description: "كل شيء. لا يمكن تعديله ولا حذفه، فهو طريق الرجوع.",
    capabilities: [...CAPABILITIES],
    builtIn: true,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

export function isOwnerRole(role: Pick<Role, "id">): boolean {
  return role.id === OWNER_ROLE_ID;
}

/**
 * The session running on this device.
 *
 * `repId` binds a session to ONE rep: that is what makes «وضع المندوب» mean
 * something — the scope travels into the read models, so a bound session's totals
 * are that rep's totals and not the store's with rows hidden (gate P3/G3).
 */
export interface AccessSession {
  roleId: string;
  /** Set when the role is being used as one specific rep's view. */
  repId?: string;
  /** ISO timestamp the session was switched. */
  since: string;
}

/** A PIN record. The digits are never stored — see gate P3/G8 and G0. */
export interface PinRecord {
  /** Hex SHA-256 of `salt + pin`. */
  hash: string;
  /** Per-install random salt, hex. */
  salt: string;
  updatedAt: string;
}
