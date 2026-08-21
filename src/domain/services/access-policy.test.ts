import { describe, expect, it } from "vitest";
import { AccessPolicy } from "./access-policy";
import {
  CAPABILITIES,
  CAPABILITY_LABELS,
  OWNER_ROLE_ID,
  ownerRole,
  type Capability,
  type Role,
} from "../entities/role";

let seq = 0;
function role(overrides: Partial<Role> = {}): Role {
  seq += 1;
  return {
    id: `r${seq}`,
    name: `دور ${seq}`,
    capabilities: [],
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
const NOW = "2026-08-19T00:00:00.000Z";

describe("capability list (gate P3/G1)", () => {
  it("every capability has an Arabic label", () => {
    for (const c of CAPABILITIES) {
      expect(CAPABILITY_LABELS[c], c).toBeTruthy();
    }
  });

  it("has no duplicates", () => {
    expect(new Set(CAPABILITIES).size).toBe(CAPABILITIES.length);
  });
});

describe("AccessPolicy.resolve — the owner cannot be locked out (gate P3/G2)", () => {
  const roles = [ownerRole(), role({ id: "rep", capabilities: ["recordSales"] })];

  it("no session at all resolves to the owner, holding everything", () => {
    const a = AccessPolicy.resolve(roles, null);
    expect(a.isOwner).toBe(true);
    expect(a.role.id).toBe(OWNER_ROLE_ID);
    for (const c of CAPABILITIES) expect(a.can(c), c).toBe(true);
    expect(a.salesScope).toBeUndefined();
  });

  it("a session naming a role that no longer exists falls back to the owner", () => {
    const a = AccessPolicy.resolve(roles, { roleId: "deleted-role", since: NOW });
    expect(a.isOwner).toBe(true);
    expect(a.can("manageAccess")).toBe(true);
  });

  it("an ARCHIVED role falls back to the owner rather than to nothing", () => {
    const archived = role({ id: "old", capabilities: ["recordSales"], status: "archived" });
    const a = AccessPolicy.resolve([ownerRole(), archived], { roleId: "old", since: NOW });
    expect(a.isOwner).toBe(true);
  });

  it("G10 deleting the active role leaves the owner, not a capability-less session", () => {
    // the role is gone from storage while a session still names it
    const a = AccessPolicy.resolve([ownerRole()], { roleId: "rep", repId: "R1", since: NOW });
    expect(a.role.id).toBe(OWNER_ROLE_ID);
    expect(a.can("manageAccess")).toBe(true);
    // and the stale rep binding is dropped, so the owner is not shown one rep's
    // numbers while believing they are the store's
    expect(a.repId).toBeUndefined();
    expect(a.salesScope).toBeUndefined();
  });

  it("a tampered owner row still holds every capability", () => {
    const stripped = { ...ownerRole(), capabilities: [] as Capability[] };
    const a = AccessPolicy.resolve([stripped], { roleId: OWNER_ROLE_ID, since: NOW });
    for (const c of CAPABILITIES) expect(a.can(c), c).toBe(true);
    expect(a.role.capabilities).toHaveLength(CAPABILITIES.length);
  });

  it("the owner role is never editable; any other role is", () => {
    expect(AccessPolicy.isEditable(ownerRole())).toBe(false);
    expect(AccessPolicy.isEditable({ id: "x" })).toBe(true);
    expect(AccessPolicy.isEditable({ id: "y", builtIn: true })).toBe(false);
  });

  it("an owner session never carries a rep binding", () => {
    const a = AccessPolicy.resolve(roles, { roleId: OWNER_ROLE_ID, repId: "R1", since: NOW });
    expect(a.repId).toBeUndefined();
    expect(a.salesScope).toBeUndefined();
  });
});

describe("AccessPolicy.resolve — a limited role", () => {
  const rep = role({
    id: "rep",
    name: "مندوب",
    capabilities: ["recordSales", "viewTargets"],
  });
  const roles = [ownerRole(), rep];

  it("grants exactly what it lists and nothing else", () => {
    const a = AccessPolicy.resolve(roles, { roleId: "rep", repId: "R1", since: NOW });
    expect(a.isOwner).toBe(false);
    expect(a.can("recordSales")).toBe(true);
    expect(a.can("viewTargets")).toBe(true);
    expect(a.can("viewCosts")).toBe(false);
    expect(a.can("manageSettings")).toBe(false);
    expect(a.can("manageAccess")).toBe(false);
  });

  it("G3 a bound session is scoped to its own rep", () => {
    const a = AccessPolicy.resolve(roles, { roleId: "rep", repId: "R1", since: NOW });
    expect(a.repId).toBe("R1");
    expect(a.salesScope).toEqual({ repId: "R1" });
    expect(AccessPolicy.inScope(a.salesScope, { repId: "R1" })).toBe(true);
    expect(AccessPolicy.inScope(a.salesScope, { repId: "R2" })).toBe(false);
    // a sale with no rep at all belongs to the store, not to this session
    expect(AccessPolicy.inScope(a.salesScope, {})).toBe(false);
  });

  it("a role WITHOUT viewAllSales and bound to nobody sees no sales, not all of them", () => {
    const a = AccessPolicy.resolve(roles, { roleId: "rep", since: NOW });
    expect(a.salesScope).toBe("none");
    expect(AccessPolicy.inScope(a.salesScope, { repId: "R1" })).toBe(false);
    expect(AccessPolicy.inScope(a.salesScope, {})).toBe(false);
  });

  it("a role WITH viewAllSales has no scope even when bound", () => {
    const wide = role({ id: "acc", capabilities: ["viewAllSales", "viewReports"] });
    const a = AccessPolicy.resolve([ownerRole(), wide], {
      roleId: "acc",
      repId: "R1",
      since: NOW,
    });
    expect(a.salesScope).toBeUndefined();
    expect(AccessPolicy.inScope(a.salesScope, { repId: "R9" })).toBe(true);
  });

  it("junk in a stored capability list cannot grant anything", () => {
    const bad = { ...role({ id: "bad" }), capabilities: ["nonsense", "viewCosts"] as unknown as Capability[] };
    const a = AccessPolicy.resolve([ownerRole(), bad], { roleId: "bad", since: NOW });
    expect(a.can("viewCosts")).toBe(true);
    expect(a.can("manageSettings")).toBe(false);
  });
});

describe("AccessPolicy.inScope", () => {
  it("an undefined scope admits everything, including a sale with no rep", () => {
    expect(AccessPolicy.inScope(undefined, {})).toBe(true);
    expect(AccessPolicy.inScope(undefined, { repId: "R1" })).toBe(true);
  });
});

describe("AccessPolicy.sanitise", () => {
  it("drops unknown members and keeps the declared order", () => {
    const out = AccessPolicy.sanitise(["manageSettings", "nope", "viewCosts", "viewCosts"]);
    expect(out).toEqual(["viewCosts", "manageSettings"]);
  });

  it("an empty list stays empty — a role that can do nothing is a real thing", () => {
    expect(AccessPolicy.sanitise([])).toEqual([]);
  });

  it("does not smuggle manageAccess in or out", () => {
    expect(AccessPolicy.sanitise(["manageAccess"])).toEqual(["manageAccess"]);
    expect(AccessPolicy.sanitise(["recordSales"])).not.toContain("manageAccess");
  });
});

describe("AccessPolicy sessions", () => {
  it("builds a session for a role, with and without a rep", () => {
    expect(AccessPolicy.session("rep", NOW, "R1")).toEqual({
      roleId: "rep",
      repId: "R1",
      since: NOW,
    });
    expect(AccessPolicy.session("rep", NOW).repId).toBeUndefined();
  });

  it("the owner session is always reachable and carries no binding", () => {
    const s = AccessPolicy.ownerSession(NOW);
    expect(s.roleId).toBe(OWNER_ROLE_ID);
    expect(s.repId).toBeUndefined();
    expect(AccessPolicy.resolve([], s).isOwner).toBe(true);
  });
});
