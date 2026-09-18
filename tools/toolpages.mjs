// One card per tool on the index, one page behind each card.
//
//   node tools/toolpages.mjs   ->  explainers/index.html
//                                  explainers/ghl.html
//                                  explainers/make.html
//                                  explainers/n8n.html
//
// Volvo's note: the work was "not properly named", and he is right. In the
// source files a build is identified by its first node - "Webhook", "Search AD
// Copy Column" - which names the MECHANISM and hides the job. Every entry is
// renamed for what it removes from somebody's week, and the chain underneath is
// drawn step for step so the claim stays checkable.
//
// Inside a tool page the builds are grouped by TRIGGER, because that is how a
// reader picks one: they arrive wondering "can he make something happen when a
// form is filled in", not wondering which node came first.
//
// The index is the card grid from the reference he sent, in his branding: paper
// on ink with a hard offset shadow rather than dark glass. The marks are each
// vendor's REAL logo, fetched from that vendor and kept in img/logos/.
//
// OpenPhone now trades as Quo - its App Store listing reads "Quo (formerly
// OpenPhone)" - so its mark is a Q. The card keeps the name he worked under and
// carries the rename beside it, because a Q with no explanation reads as the
// wrong logo.
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { page } from "./lib/pagekit.mjs";
import { renderFlow, FLOW_CSS, FLOW_JS } from "./lib/flowplayer.mjs";
import { TOOLS, DEEP } from "./lib/tooldata.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "explainers");
mkdirSync(OUT, { recursive: true });

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");

/* ── the shared look of a tool page ─────────────────────────────────────── */
const TOOL_CSS = FLOW_CSS + `
.filt{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 26px}
.fb{font-family:var(--f-mono);font-size:11.5px;background:var(--card);border:3px solid var(--ink);
  border-radius:99px;padding:8px 14px;cursor:pointer;box-shadow:3px 3px 0 0 var(--ink);
  transition:background .16s var(--ease),transform .12s var(--ease)}
.fb.on{background:var(--pop)}
.fb:active{transform:translateY(2px);box-shadow:1px 1px 0 0 var(--ink)}
.fb:focus-visible{outline:3px solid var(--field);outline-offset:3px}
.grp{margin:0 0 34px}
.ghd{margin:0 0 14px;padding-bottom:10px;border-bottom:3px solid var(--ink);position:relative}
.ghd h2{font-family:var(--f-disp);font-weight:900;letter-spacing:-.025em;margin:0;
  font-size:clamp(20px,2.8vw,28px)}
.ghd p{margin:4px 0 0;font-size:14.5px;color:var(--muted);line-height:1.55;max-width:56ch}
.cnt{position:absolute;right:0;top:2px;font-family:var(--f-mono);font-size:10.5px;
  letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.wf{background:var(--card);border:3px solid var(--ink);border-radius:15px;
  box-shadow:5px 5px 0 0 var(--ink);padding:clamp(14px,2vw,20px);margin:0 0 14px}
.wf h3{font-family:var(--f-disp);font-weight:900;letter-spacing:-.02em;margin:0 0 6px;
  font-size:clamp(17px,2.2vw,22px);line-height:1.2}
.wf p{margin:0;font-size:14.5px;line-height:1.6;color:var(--muted)}
.why{margin-top:12px !important;padding:10px 12px;background:rgba(245,213,71,.18);
  border-left:4px solid var(--pop);border-radius:0 8px 8px 0;font-size:14px !important}
.why b{color:var(--ink)}
/* A few builds have a page of their own where you can drive them rather than
   watch them. Those get a way through from here; the rest do not pretend to. */
.deep{display:flex;width:fit-content;align-items:center;gap:8px;margin-top:12px;
  font-family:var(--f-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;
  background:var(--field);color:var(--paper);border-radius:99px;padding:8px 14px;
  text-decoration:none;transition:transform .16s var(--ease)}
.deep i{font-style:normal;transition:transform .16s var(--ease)}
.deep:hover i{transform:translateX(4px)}
.deep:active{transform:translateY(2px)}
.deep:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
@media(prefers-reduced-motion:reduce){ .deep,.deep i{transition:none} }
@media(max-width:560px){ .cnt{position:static;display:block;margin-top:6px} }`;

function toolPage(tool) {
  let n = 0;
  const item = it => `      <article class="wf">
        <h3>${esc(it.name)}</h3>
        <p>${esc(it.purpose)}</p>
        ${renderFlow(it.flow, n++, it.name)}
        ${it.note ? `<p class="why"><b>Worth noticing.</b> ${esc(it.note)}</p>` : ""}
        ${it.deep ? `<a class="deep" href="${it.deep.file}">${esc(it.deep.label)} <i aria-hidden="true">&rarr;</i></a>` : ""}
      </article>`;

  const group = g => `    <section class="grp" data-g="${g.key}">
      <header class="ghd">
        <h2>${esc(g.label)}</h2>
        <p>${esc(g.blurb)}</p>
        <span class="cnt">${plural(g.items.length, "build")}</span>
      </header>
${g.items.map(item).join("\n")}
    </section>`;

  const total = tool.groups.reduce((a, g) => a + g.items.length, 0);

  return page(tool.name + " builds", `
<a class="back" href="index.html">&lsaquo; All tools</a>
<span class="eyebrow">${esc(tool.name)} &middot; ${plural(total, tool.countNote.replace(/s$/, ""))}</span>
<h1>${esc(tool.tagline)}</h1>
<p class="lede">${esc(tool.blurb)} Each one plays from its trigger to its last step, the same shape as
the canvas it was built on. Press play, or just scroll - they start when they reach you.</p>

<div class="filt" role="group" aria-label="Filter by what starts it">
  <button class="fb on" data-f="all" type="button">Everything</button>
${tool.groups.map(g => `  <button class="fb" data-f="${g.key}" type="button">${esc(g.label)}</button>`).join("\n")}
</div>

${tool.groups.map(group).join("\n")}

<p class="lede" style="margin-top:26px">${esc(tool.foot)}</p>

<script>
${FLOW_JS}
document.querySelectorAll(".fb").forEach(function(b){
  b.addEventListener("click", function(){
    var f = b.getAttribute("data-f");
    document.querySelectorAll(".fb").forEach(function(o){ o.classList.toggle("on", o === b); });
    document.querySelectorAll(".grp").forEach(function(g){
      g.style.display = (f === "all" || g.getAttribute("data-g") === f) ? "" : "none";
    });
  });
});
</script>`, TOOL_CSS);
}

/* ── the index: one card per tool ───────────────────────────────────────── */
const CARDS = [
  ...TOOLS.map(t => ({ file: t.file, logo: t.logo, note: t.note, name: t.name, tagline: t.tagline,
    badge: t.badge, bullets: t.bullets,
    meta: "See them run" })),
  ...DEEP.map(d => ({ file: d.file, logo: d.logo, note: d.note, name: d.name, tagline: d.tagline,
    badge: d.badge, bullets: d.bullets, meta: "walk it through" }))
];

/* The counter is a position in a set, and it is only honest because the set is
   closed and shown whole: six cards, all on screen, numbered 01 to 06. It would
   be decoration on a list that scrolled or filtered. */
const card = (base = "", logoBase = "") => (c, i) => `  <a class="tc" href="${base}${c.file}">
    <div class="tch">
      <span class="tcm"><img src="${logoBase}img/logos/${c.logo}" alt="" aria-hidden="true" width="26" height="26" loading="lazy"></span>
      <span class="tcn">${String(i + 1).padStart(2, "0")} <i>/</i> ${String(CARDS.length).padStart(2, "0")}</span>
    </div>
    <h3 class="tcti">${esc(c.name)}${c.note ? ` <i class="tcw">${esc(c.note)}</i>` : ""}</h3>
    <p class="tct">${esc(c.tagline)}</p>
    <span class="tcb">${esc(c.badge)}</span>
    <ul class="tcl">
${c.bullets.map(b => `      <li>${esc(b)}</li>`).join("\n")}
    </ul>
    <span class="tcg">${esc(c.meta)} <i aria-hidden="true">&rarr;</i></span>
  </a>`;

/* One stylesheet for the grid, used by the standalone index AND pasted into the
   hub's Systems room. Two copies of it would be two of them waiting to
   disagree, and the hub is the one a client actually lands on. */
const GRID_CSS = `
.tgrid{display:grid;gap:16px;grid-template-columns:1fr}
@media(min-width:660px){ .tgrid{grid-template-columns:repeat(2,1fr)} }
@media(min-width:1000px){ .tgrid{grid-template-columns:repeat(3,1fr)} }
/* The card is one object: same edges, same inner padding, and the arrow line
   pinned to the bottom of every card whatever the bullets do above it. */
.tc{display:flex;flex-direction:column;background:var(--card);border:3px solid var(--ink);
  border-radius:16px;box-shadow:6px 6px 0 0 var(--ink);padding:16px 16px 14px;
  text-decoration:none;color:inherit;
  transition:transform .18s var(--ease),box-shadow .18s var(--ease)}
.tc:hover{transform:translate(-2px,-2px);box-shadow:9px 9px 0 0 var(--ink)}
.tc:active{transform:translate(2px,2px);box-shadow:3px 3px 0 0 var(--ink)}
.tc:focus-visible{outline:3px solid var(--field);outline-offset:4px}
.tch{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
/* The vendor's real mark, fetched from the vendor - or, where a brand
   publishes no square glyph anywhere, from its own app-store icon - and kept as
   a file in img/logos/. None of them is drawn here. A logo redrawn from memory
   is wrong in a way a reader feels but cannot name, so the rule is fetch it or
   do not use it, and a letterform is the honest fallback when it cannot be
   found at all. */
.tcm{display:grid;place-items:center;width:42px;height:42px;border:3px solid var(--ink);
  border-radius:11px;background:var(--card)}
.tcm img{display:block;width:26px;height:26px;object-fit:contain}
.tcw{font-family:var(--f-mono);font-style:normal;font-weight:400;font-size:.46em;
  letter-spacing:.1em;text-transform:uppercase;color:var(--muted);vertical-align:.34em;
  white-space:nowrap}
.tcn{font-family:var(--f-mono);font-size:10.5px;letter-spacing:.14em;color:var(--muted);
  font-variant-numeric:tabular-nums}
.tcn i{font-style:normal;opacity:.45}
.tcti{font-family:var(--f-disp);font-weight:900;letter-spacing:-.025em;margin:0 0 4px;
  font-size:clamp(20px,2.4vw,24px);line-height:1.1;color:var(--ink)}
.tct{margin:0 0 11px;font-size:14.5px;line-height:1.5;color:var(--muted)}
.tcb{align-self:flex-start;font-family:var(--f-mono);font-size:9.5px;letter-spacing:.14em;
  text-transform:uppercase;background:var(--pop);border:2px solid var(--ink);border-radius:99px;
  padding:4px 10px;margin-bottom:12px}
.tcl{list-style:none;margin:0 0 14px;padding:0;display:flex;flex-direction:column;gap:7px}
.tcl li{position:relative;padding-left:23px;font-size:13.5px;line-height:1.45;color:var(--ink)}
.tcl li::before{content:"";position:absolute;left:0;top:3px;width:14px;height:8px;
  border-left:2.5px solid var(--field);border-bottom:2.5px solid var(--field);
  transform:rotate(-45deg)}
.tcg{margin-top:auto;padding-top:11px;border-top:2px dashed var(--hair);
  font-family:var(--f-mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--muted);display:flex;align-items:center;justify-content:space-between;gap:8px}
.tc:hover .tcg{color:var(--ink)}
.tcg i{font-style:normal;transition:transform .18s var(--ease)}
.tc:hover .tcg i{transform:translateX(4px)}
@media(prefers-reduced-motion:reduce){
  .tc,.tcg i{transition:none}
  .tc:hover{transform:none;box-shadow:6px 6px 0 0 var(--ink)}
  .tc:hover .tcg i{transform:none}
}`;

const index = page("Built, by tool", `
<a class="back" href="../index.html#systems">&lsaquo; Back to the portfolio</a>
<span class="eyebrow">The work &middot; ${CARDS.length} tools</span>
<h1>Every build, sorted by what it was built in.</h1>
<p class="lede">Six tools, and each one is here because it was the right one for that job rather
than the one I happened to know. Open a tool to watch its builds run, step by step, from the thing
that sets them off to the thing they leave behind.</p>

<div class="tgrid">
${CARDS.map(card("", "../")).join("\n")}
</div>

<p class="lede" style="margin-top:26px">Read from the build files themselves. Client names are
withheld throughout.</p>`, GRID_CSS);


writeFileSync(join(OUT, "index.html"), index);
console.log("wrote explainers/index.html  (" + CARDS.length + " tool cards)");

for (const t of TOOLS) {
  writeFileSync(join(OUT, t.file), toolPage(t));
  const n = t.groups.reduce((a, g) => a + g.items.length, 0);
  console.log("wrote explainers/" + t.file.padEnd(10) + " " + String(n).padStart(2) + " builds, " +
    t.groups.length + " groups");
  for (const g of t.groups) console.log("     " + String(g.items.length).padStart(2) + "  " + g.label);
}

/* ── the same grid, into the hub's Systems room ─────────────────────────────
   The hub is the page a client actually lands on, so the grid has to live there
   too - and a hand-copied second version of it is a third thing to keep in
   step. It is written between sentinels instead, and the sentinels are
   load-bearing: this script refuses rather than guessing if either is missing,
   because a half-matched replacement would eat the rest of the room. */
const HUB = join(ROOT, "index.html");
const A = "<!-- tools:grid -->", B = "<!-- /tools:grid -->";
const AC = "/* tools:grid-css */", BC = "/* /tools:grid-css */";
let hub = readFileSync(HUB, "utf8");

for (const [open, close] of [[A, B], [AC, BC]]) {
  const n = hub.split(open).length - 1, m = hub.split(close).length - 1;
  if (n !== 1 || m !== 1) throw new Error(`index.html must hold exactly one ${open} and one ${close} (found ${n}/${m})`);
}

const cut = (src, open, close, body) =>
  src.slice(0, src.indexOf(open) + open.length) + body + src.slice(src.indexOf(close));

hub = cut(hub, A, B, `
    <div class="tgrid">
${CARDS.map(card("explainers/")).join("\n")}
    </div>
  `);
hub = cut(hub, AC, BC, GRID_CSS + "\n");
writeFileSync(HUB, hub);
console.log("synced the Systems room in index.html (" + CARDS.length + " cards)");
