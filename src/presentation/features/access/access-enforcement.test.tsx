import { describe, expect, it } from "vitest";
import {
  AccessPolicy,
  CAPABILITIES,
  ownerRole,
  type Capability,
  type Role,
} from "@/domain";
import {
  capabilityForPath,
  firstAllowedHref,
  visibleNavGroups,
  NAV_GROUPS,
  ROUTE_CAPABILITIES,
} from "@/presentation/components/layout/nav-config";

function role(capabilities: Capability[]): Role {
  return {
    id: "r1",
    name: "دور",
    capabilities,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}
const NOW = "2026-08-19T00:00:00.000Z";
const asRole = (capabilities: Capability[]) =>
  AccessPolicy.resolve([ownerRole(), role(capabilities)], { roleId: "r1", since: NOW });
const asOwner = () => AccessPolicy.resolve([ownerRole()], null);

/** The seeded rep: what the demo store ships and what the proofs were shot under. */
const REP: Capability[] = ["viewProducts", "recordSales", "viewTargets", "viewLedger"];

describe("nav filtering (gate P3/G6)", () => {
  it("the owner sees every entry there is", () => {
    const groups = visibleNavGroups(asOwner());
    expect(groups.map((g) => g.items.length).reduce((a, b) => a + b, 0)).toBe(
      NAV_GROUPS.flatMap((g) => g.items).length,
    );
  });

  it("a rep sees only what their capabilities open", () => {
    const groups = visibleNavGroups(asRole(REP));
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).toContain("/products");
    expect(hrefs).toContain("/targets");
    expect(hrefs).toContain("/ledger");
    expect(hrefs).not.toContain("/dashboard");
    expect(hrefs).not.toContain("/reps");
    expect(hrefs).not.toContain("/settings");
    expect(hrefs).not.toContain("/access");
    expect(hrefs).not.toContain("/calculator");
  });

  it("a group left with nothing in it disappears rather than rendering empty", () => {
    const groups = visibleNavGroups(asRole(REP));
    expect(groups.every((g) => g.items.length > 0)).toBe(true);
    // «النظام» holds only /access and /settings, and a rep has neither
    expect(groups.map((g) => g.label)).not.toContain("النظام");
  });

  it("a role with nothing at all still gets a landing that is not a dead link", () => {
    const none = asRole([]);
    expect(visibleNavGroups(none).flatMap((g) => g.items)).toHaveLength(0);
    expect(firstAllowedHref(none)).toBe("/dashboard");
  });

  it("every nav entry that names a capability has a matching route rule", () => {
    for (const item of NAV_GROUPS.flatMap((g) => g.items)) {
      if (!item.needs) continue;
      const guarded = capabilityForPath(item.href);
      expect(guarded, `${item.href} is in the nav but unguarded`).toBe(item.needs);
    }
  });
});

describe("route guarding (gate P3/G5)", () => {
  it("matches a route and its children, not a route that merely shares a prefix", () => {
    expect(capabilityForPath("/reps")).toBe("viewTeam");
    expect(capabilityForPath("/reps/view")).toBe("viewTeam");
    expect(capabilityForPath("/repsomething")).toBeUndefined();
  });

  it("the create surface is guarded more tightly than the catalogue", () => {
    expect(capabilityForPath("/products")).toBe("viewProducts");
    expect(capabilityForPath("/products/view")).toBe("viewProducts");
    expect(capabilityForPath("/products/new")).toBe("manageProducts");
  });

  it("a rep is refused everything they have no capability for", () => {
    const rep = asRole(REP);
    for (const route of ROUTE_CAPABILITIES) {
      const allowed = rep.can(route.needs);
      expect(
        allowed,
        `${route.prefix} should ${REP.includes(route.needs) ? "open" : "refuse"}`,
      ).toBe(REP.includes(route.needs));
    }
  });

  it("the owner is refused nothing", () => {
    const owner = asOwner();
    for (const route of ROUTE_CAPABILITIES) expect(owner.can(route.needs), route.prefix).toBe(true);
  });
});

describe("every capability is load-bearing (gate P3/G1)", () => {
  it("each one is either a route gate or is checked by a surface", () => {
    // A capability nothing consumes is dead flexibility. These are the ones enforced
    // inside screens rather than at a route boundary, listed so that adding a
    // capability without a consumer FAILS here instead of shipping unused.
    const inScreens: Capability[] = [
      "viewAllSales", // scopes the read models
      "recordSales", // the «تسجيل بيع» action
      "manageTargets", // the target edit controls
      "settleBalances", // the settle sheet
      "exportData", // the export controls
      "manageTeam", // the schemes bench
    ];
    const atRoutes = new Set(ROUTE_CAPABILITIES.map((r) => r.needs));
    for (const c of CAPABILITIES) {
      expect(atRoutes.has(c) || inScreens.includes(c), `${c} has no consumer`).toBe(true);
    }
  });
});
