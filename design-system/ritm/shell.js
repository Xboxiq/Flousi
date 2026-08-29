/* RITM · the pieces every screen in this system is assembled from.
   Icons are drawn in a 24 box with a 20-unit live area and round ends, exactly
   as the brand's icon board specifies. The stroke width is set by CSS per size
   so that 1.75 rendered pixels holds at 16, 20 and 24. */

const P = {
  ops:      '<path d="M3 12h4l2-7 4 14 2-7h6"/>',
  reps:     '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M17 6a3 3 0 0 1 0 6"/><path d="M18 20a5 5 0 0 0-2-4"/>',
  commission:'<path d="M6 18 18 6"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  collect:  '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  expense:  '<path d="M5 4h14v16l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 9h6M9 13h4"/>',
  settle:   '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  report:   '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 9h8M8 13h8M8 17h4"/>',
  target:   '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  search:   '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bell:     '<path d="M18 16H6l1.5-2.5V10a4.5 4.5 0 0 1 9 0v3.5z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  period:   '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  export:   '<path d="M12 3v12M8 11l4 4 4-4"/><path d="M4 17v3h16v-3"/>',
  freeze:   '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  stock:    '<path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5z"/><path d="m3 8.5 9 4.5 9-4.5M12 13v7"/>',
  plus:     '<path d="M12 5v14M5 12h14"/>',
  check:    '<path d="m5 13 4 4L19 7"/>',
  x:        '<path d="M6 6l12 12M18 6 6 18"/>',
  chevron:  '<path d="m14 6-6 6 6 6"/>',      /* points to the reading edge in RTL */
  chevronL: '<path d="m10 6 6 6-6 6"/>',
  down:     '<path d="m6 9 6 6 6-6"/>',
  alert:    '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  info:     '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  filter:   '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  more:     '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
};

export const icon = (n, cls = "i") =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ""}</svg>`;

/* The RITM mark, redrawn from the client's own artwork at pixel precision:
   four bars, fully rounded, width 4.2 and pitch 6.6 on a 24 x 39 box. The
   bottoms step down by one pitch each; the fourth bar is short and hangs
   between the others, which is what stops it reading as a bar chart.
   `size` is the WIDTH — the mark is taller than it is wide. */
export const mark = (size = 24, fill = "var(--accent)") =>
  `<svg width="${size}" height="${size * 39 / 24}" viewBox="0 0 24 39" fill="${fill}" aria-hidden="true">
     <rect x="0" y="7" width="4.2" height="32" rx="2.1"/><rect x="6.6" y="3.5" width="4.2" height="29" rx="2.1"/><rect x="13.2" y="0" width="4.2" height="26" rx="2.1"/><rect x="19.8" y="5.5" width="4.2" height="14" rx="2.1"/></svg>`;

export const NAV = [
  { group: "اليوم", items: [
    { id: "ops",        label: "العمليات",   icon: "ops" },
    { id: "collect",    label: "التحصيلات",  icon: "collect", count: "3" },
    { id: "monitor",    label: "مراقبة الطلبات", icon: "period" },
  ]},
  { group: "المال", items: [
    { id: "commission", label: "العمولات",   icon: "commission" },
    { id: "expense",    label: "المصروفات",  icon: "expense" },
    { id: "settle",     label: "التسويات",   icon: "settle" },
    { id: "ledger",     label: "السجل",      icon: "report" },
  ]},
  { group: "السجل", items: [
    { id: "products",   label: "المنتجات",   icon: "stock" },
    { id: "reps",       label: "المندوبون",  icon: "reps" },
    { id: "target",     label: "الأهداف",    icon: "target" },
  ]},
  { group: "الأرشيف", items: [
    { id: "periods",    label: "الفترات",    icon: "freeze" },
    { id: "report",     label: "التقارير",   icon: "report" },
  ]},
];

/* One number set, used by every screen in this system, and it reconciles:
   5,164,500 − 2,334,920 − 769,200 − 284,580 = 1,775,800 */
export const MONTH = {
  revenue: 5164500, cost: 2334920, shares: 769200, delivery: 284580, net: 1775800,
  target: 2000000, orders: 216, outstanding: 1892820,
  reps: [
    { name: "ليث العبيدي",  short: "ليث",  base: 736000, rule: "45% من الربح", share: 331200, key: "rep-1" },
    { name: "سعد الجبوري",  short: "سعد",  base: 996000, rule: "30% من الربح", share: 298800, key: "rep-2" },
    { name: "زينب الطائي",  short: "زينب", base: 116,    rule: "1,200 للقطعة", share: 139200, key: "rep-3" },
  ],
};

/* Latin numerals everywhere, one grouping, one decimal convention: a screen
   that mixes numeral systems makes the reader do arithmetic twice. */
export const fmt = (n) =>
  new Intl.NumberFormat("ar-IQ-u-nu-latn", { maximumFractionDigits: 0 }).format(n);

export const sidebar = (active) => `
<aside class="sidebar">
  <div class="brand">${mark(22)}<b>رِتم</b><span class="eyebrow spacer">IQ</span></div>
  ${NAV.map(g => `
    <nav class="navgroup">
      <span class="navgroup-label">${g.group}</span>
      ${g.items.map(i => `
        <a class="navitem" href="#${i.id}"${i.id === active ? ' aria-current="page"' : ""}>
          ${icon(i.icon)}<span>${i.label}</span>
          ${i.count ? `<span class="count">${i.count}</span>` : ""}
        </a>`).join("")}
    </nav>`).join("")}
  <div class="sidefoot">
    <div class="usermenu">
      <span class="avatar">ح</span>
      <span style="flex:1;min-width:0">
        <b style="display:block;font-size:var(--fs-small);font-weight:var(--fw-bold)">حسين العلي</b>
        <span class="caption">مالك المحل</span>
      </span>
      ${icon("down", "i i-sm")}
    </div>
  </div>
</aside>`;

export const topbar = (crumbs, actions = "") => `
<header class="topbar">
  <nav class="crumbs">${crumbs.map((c, n) =>
    n === crumbs.length - 1
      ? `<span aria-current="page">${c}</span>`
      : `<a href="#">${c}</a><span class="sep">/</span>`).join("")}</nav>
  <div class="spacer"></div>${actions}
</header>`;
