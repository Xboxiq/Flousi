import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const BASE = process.env.BASE || "http://localhost:8123";
const K = (k) => `ritm:${k}`;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const results = [];

async function fresh(scheme = "light") {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: scheme,
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push("PAGEERROR " + String(e).slice(0, 160)));
  page.on("console", (m) => {
    if (m.type() === "error") errs.push("CONSOLE " + m.text().slice(0, 160));
  });
  return { ctx, page, errs };
}
const rows = (page, key) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "[]").length, K(key));
const raw = (page, key) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), K(key));

async function run(name, route, fn) {
  const { ctx, page, errs } = await fresh();
  let verdict = "PASS",
    detail = "";
  try {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2400);
    detail = (await fn(page)) || "";
  } catch (e) {
    verdict = "FAIL";
    detail = String(e.message || e)
      .split("\n")[0]
      .slice(0, 150);
  }
  if (verdict === "PASS" && detail.startsWith("!")) {
    verdict = "FAIL";
    detail = detail.slice(1);
  }
  const jsErr = errs.filter((e) => !/favicon|manifest/i.test(e));
  results.push({ name, verdict, detail, jsErr: jsErr.length ? jsErr[0] : "" });
  console.log(
    `${verdict === "PASS" ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}${jsErr.length ? " | " + jsErr[0] : ""}`,
  );
  await ctx.close();
}

/* ── 1. createProduct: the /products/new form ── */
await run("createProduct · /products/new", "/products/new", async (p) => {
  const before = await rows(p, "products");
  await p.fill("#name", "منتج سَبْر");
  await p.fill("#price", "40000");
  const purchase = await p.$('#purchase-fixed, input[id*="purchase"]');
  if (purchase) await purchase.fill("25000");
  const save = await p.$(
    'button:has-text("حفظ"), button:has-text("إضافة المنتج"), button[type="submit"]',
  );
  if (!save) return "!no save button found";
  await save.click();
  await p.waitForTimeout(1200);
  const after = await rows(p, "products");
  if (after !== before + 1) return `!products ${before} → ${after}`;
  const list = await raw(p, "products");
  const made = list.find((x) => x.name === "منتج سَبْر");
  if (!made) return "!saved but not findable by name";
  if (made.sellingPrice !== 40000) return `!price stored as ${made.sellingPrice}`;
  return `products ${before} → ${after}, price ${made.sellingPrice}`;
});

/* ── 2. createSale: the record-sale dialog ── */
await run("createSale · record dialog", "/products/", async (p) => {
  const before = await rows(p, "sales");
  const btn = await p.$('button:has-text("تسجيل بيع"), a:has-text("تسجيل بيع")');
  if (btn) await btn.click();
  else {
    const row = await p.$("tbody tr a, tbody tr");
    await row.click();
    await p.waitForTimeout(1800);
    const b2 = await p.$('button:has-text("تسجيل بيع")');
    if (!b2) return "!no record-sale trigger";
    await b2.click();
  }
  await p.waitForTimeout(700);
  const qty = await p.$("#qty, #quantity");
  if (qty) await qty.fill("2");
  const save = await p.$(
    '[role="dialog"] button:has-text("تسجيل"), [role="dialog"] button:has-text("حفظ")',
  );
  if (!save) return "!no dialog save";
  await save.click();
  await p.waitForTimeout(1200);
  const after = await rows(p, "sales");
  if (after !== before + 1) return `!sales ${before} → ${after}`;
  return `sales ${before} → ${after}`;
});

/* ── 3. createOrder: the whole P4-P6 builder, never driven end-to-end ── */
await run("createOrder · the builder", "/orders/", async (p) => {
  const beforeO = await rows(p, "orders");
  const beforeS = await rows(p, "sales");
  const beforeIds = await p.evaluate(() =>
    JSON.parse(localStorage.getItem("ritm:orders") || "[]").map((o) => o.id),
  );
  await p.click('button:has-text("طلبية جديدة")');
  await p.waitForTimeout(600);
  await p.click("text=أضف صنفاً");
  await p.click("text=أضف صنفاً");
  await p.waitForTimeout(400);
  // an offer, so P6's freeze path is exercised too
  await p.click('[role="dialog"] button:has-text("نسبة")');
  await p.waitForTimeout(400);
  const repSel = await p.$("#order-rep");
  if (repSel) {
    const opts = await repSel.$$eval("option", (o) => o.map((x) => x.value).filter(Boolean));
    if (opts.length) await repSel.selectOption(opts[0]);
  }
  await p.waitForTimeout(300);
  await p.click('button:has-text("تسجيل الطلبية")');
  await p.waitForTimeout(1500);
  const afterO = await rows(p, "orders");
  const afterS = await rows(p, "sales");
  if (afterO !== beforeO + 1) return `!orders ${beforeO} → ${afterO}`;
  if (afterS !== beforeS + 2) return `!sales ${beforeS} → ${afterS} (expected +2 lines)`;
  const orders = await raw(p, "orders");
  /* By ID DIFF, never by array position: the repository does not return rows in
     insertion order, and reading `orders[length-1]` made this probe assert against
     a SEEDED order for one whole run. */
  const made = orders.find((o) => !beforeIds.includes(o.id));
  if (!made) return "!the new order is not in storage";
  const sales = await raw(p, "sales");
  const lines = sales.filter((s) => s.orderId === made.id);
  if (lines.length !== 2) return `!${lines.length} lines carry the orderId`;
  const frozen = lines.filter((l) => l.commissionSnapshot);
  const discounted = lines.filter((l) => l.discount > 0);
  if (repSel && frozen.length !== 2)
    return `!only ${frozen.length}/2 lines froze a snapshot (P6/G5)`;
  if (discounted.length === 0) return "!the offer did not reach any line";
  return `order + ${lines.length} lines, ${frozen.length} frozen, ${discounted.length} discounted`;
});

/* ── 4. updateOrder: the P5 status control ── */
await run("updateOrder · status control", "/orders/", async (p) => {
  const rowsBtn = await p.$$("li > button[aria-expanded]");
  if (!rowsBtn.length) return "!no order rows";
  /* Pick a row that is NOT already returned: `setStatus` returns early when the
     status is unchanged, which is correct behaviour and made this probe read a
     no-op as a defect. */
  let target = -1;
  for (let i = 0; i < rowsBtn.length; i++) {
    const label = await rowsBtn[i].innerText();
    if (!/راجعة|ملغاة/.test(label)) {
      target = i;
      break;
    }
  }
  if (target < 0) return "!every row is already void";
  await rowsBtn[target].click();
  await p.waitForTimeout(900);
  const before = await raw(p, "orders");
  /* Scoped to the control's own group: an unscoped «راجعة» matched the BADGE on the
     already-returned seeded row and toggled that latch instead. */
  const G = '[role="group"][aria-label="حالة الطلبية"] ';
  await p.click(G + 'button:has-text("راجعة")');
  await p.waitForTimeout(1200);
  const after = await raw(p, "orders");
  const changed = after.filter((o, i) => JSON.stringify(o) !== JSON.stringify(before[i]));
  if (changed.length !== 1) return `!${changed.length} orders changed`;
  if (changed[0].status !== "returned") return `!status is ${changed[0].status}`;
  if (changed[0].returnCost === undefined) return "!returnCost was not seeded by the form (P5/G5)";
  // and back again — P5/G4 says it must be reversible
  await p.click(G + 'button:has-text("مُسلَّمة")');
  await p.waitForTimeout(1200);
  const back = await raw(p, "orders");
  const restored = back.find((o) => o.id === changed[0].id);
  if (restored.status !== "delivered") return `!did not restore, status ${restored.status}`;
  return `returned (cost ${changed[0].returnCost}) → delivered, reversible`;
});

/* ── 5. create/updateTarget ── */
await run("create/updateTarget · /targets", "/targets/", async (p) => {
  const before = await rows(p, "targets");
  const add = await p.$(
    'button:has-text("حدّد هدفًا"), button:has-text("حدّد"), button:has-text("تعديل")',
  );
  if (!add) return "!no add-target trigger";
  await add.click();
  await p.waitForTimeout(600);
  await p.fill("#target-amount", "7000000");
  const save = await p.$('[role="dialog"] button:has-text("حفظ")');
  if (!save) return "!no dialog save";
  await save.click();
  await p.waitForTimeout(1200);
  const after = await rows(p, "targets");
  const list = await raw(p, "targets");
  /* A rep who already has a target must be UPDATED in place, not given a second
     one — two targets for one scope would be two answers to «ما هدف هذا الشهر؟».
     So the assertion is the amount, and the count is allowed to hold. */
  if (!list.some((t) => t.amount === 7000000)) return "!no target holds the new amount";
  if (after > before + 1) return `!targets ${before} → ${after} (duplicated a scope)`;
  return after === before
    ? `updated in place (count held at ${after})`
    : `targets ${before} → ${after}`;
});

/* ── 6. createRep ── */
await run("createRep · /reps", "/reps/", async (p) => {
  const before = await rows(p, "reps");
  await p.click('button:has-text("إضافة مندوب")');
  await p.waitForTimeout(600);
  const nameIn = await p.$('[role="dialog"] input');
  await nameIn.fill("مندوب سَبْر");
  const save = await p.$(
    '[role="dialog"] button:has-text("حفظ"), [role="dialog"] button:has-text("إضافة")',
  );
  await save.click();
  await p.waitForTimeout(1200);
  const after = await rows(p, "reps");
  if (after !== before + 1) return `!reps ${before} → ${after}`;
  return `reps ${before} → ${after}`;
});

/* ── 7. createRole ── */
await run("createRole · /access", "/access/", async (p) => {
  const before = await rows(p, "roles");
  const add = await p.$('button:has-text("دور جديد"), button:has-text("إضافة دور")');
  if (!add) return "!no add-role trigger";
  await add.click();
  await p.waitForTimeout(600);
  const nameIn = await p.$('[role="dialog"] input');
  await nameIn.fill("دور سَبْر");
  const save = await p.$(
    '[role="dialog"] button:has-text("حفظ"), [role="dialog"] button:has-text("إضافة")',
  );
  await save.click();
  await p.waitForTimeout(1200);
  const after = await rows(p, "roles");
  if (after !== before + 1) return `!roles ${before} → ${after}`;
  return `roles ${before} → ${after}`;
});

/* ── 8. updateCommissionScheme: the bench save ── */
await run("updateCommissionScheme · bench", "/reps/schemes/", async (p) => {
  const before = await raw(p, "commission-schemes");
  await p.click('button:has-text("الربح بعد الشراء")');
  await p.waitForTimeout(500);
  await p.click('button:has-text("حفظ")');
  await p.waitForTimeout(1200);
  const after = await raw(p, "commission-schemes");
  const changed = after.filter((s, i) => JSON.stringify(s) !== JSON.stringify(before[i]));
  if (!changed.length) return "!nothing was saved";
  if (changed[0].profitBasis !== "afterPurchaseCost") return `!basis is ${changed[0].profitBasis}`;
  return `basis → ${changed[0].profitBasis}`;
});

/* ── 9. saveSettings ── */
await run("saveSettings · /settings", "/settings/", async (p) => {
  const before = await raw(p, "settings");
  const mp = await p.$("#mp");
  if (!mp) return "!no #mp fee field on /settings";
  await mp.fill("9.5");
  const save = await p.$('button:has-text("حفظ التغييرات")');
  if (!save) return "!no save button";
  await save.click();
  await p.waitForTimeout(1200);
  const after = await raw(p, "settings");
  if (JSON.stringify(after) === JSON.stringify(before)) return "!settings unchanged";
  return "settings persisted";
});

/* ── 10. createSettlement: the slide-to-commit ── */
await run("createSettlement · settle sheet", "/reps/", async (p) => {
  const before = await rows(p, "settlements");
  const link = await p.$('a[href*="/reps/view"]');
  if (!link) return "!no rep link";
  await link.click();
  await p.waitForTimeout(2400);
  await p.click('button:has-text("تسوية")');
  await p.waitForTimeout(800);
  const thumb = await p.$('[role="slider"]');
  if (!thumb) return "!no slide-to-commit thumb";
  await thumb.focus();
  await p.keyboard.press("Enter");
  await p.waitForTimeout(2200);
  const after = await rows(p, "settlements");
  if (after !== before + 1) return `!settlements ${before} → ${after}`;
  return `settlements ${before} → ${after}`;
});

/* ── 11. closePeriod ── */
await run("closePeriod · /periods", "/periods/", async (p) => {
  const before = await raw(p, "periods");
  await p.click('button:has-text("إغلاق الفترة")');
  await p.waitForTimeout(800);
  const thumb = await p.$('[role="slider"]');
  if (!thumb) return "!no slide-to-commit thumb";
  await thumb.focus();
  await p.keyboard.press("Enter");
  await p.waitForTimeout(2400);
  const after = await raw(p, "periods");
  const closed = after.filter((x) => x.status === "closed").length;
  const wasClosed = before.filter((x) => x.status === "closed").length;
  if (closed !== wasClosed + 1) return `!closed ${wasClosed} → ${closed}`;
  return `closed periods ${wasClosed} → ${closed}`;
});

/* ── 12. deleteProduct ── */
await run("deleteProduct · product page", "/products/", async (p) => {
  const before = await rows(p, "products");
  const row = await p.$("tbody tr");
  if (!row) return "!no product row";
  await row.click();
  await p.waitForTimeout(2200);
  const del = await p.$('button:has-text("حذف")');
  if (!del) return "!no delete control";
  await del.click();
  await p.waitForTimeout(700);
  const confirm = await p.$('[role="dialog"] button:has-text("حذف")');
  if (confirm) await confirm.click();
  await p.waitForTimeout(1500);
  const after = await rows(p, "products");
  if (after !== before - 1) return `!products ${before} → ${after}`;
  return `products ${before} → ${after}`;
});

console.log("\n" + "═".repeat(70));
const fails = results.filter((r) => r.verdict !== "PASS");
const jsErrs = results.filter((r) => r.jsErr);
console.log(`${results.length - fails.length}/${results.length} write paths drove clean`);
if (fails.length) {
  console.log("\nFAILURES:");
  for (const f of fails) console.log(`  · ${f.name}: ${f.detail}`);
}
if (jsErrs.length) {
  console.log("\nJS ERRORS:");
  for (const e of jsErrs) console.log(`  · ${e.name}: ${e.jsErr}`);
}
await browser.close();
