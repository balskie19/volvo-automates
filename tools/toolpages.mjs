// One card per tool on the index, one page behind each card, and EVERY page
// built the same way: his real workflows, his name for each one highlighted,
// a compact moving image of the whole workflow that opens full size.
//
//   node tools/toolpages.mjs   ->  explainers/index.html
//                                  explainers/{ghl,make,n8n,retell,intercom,openphone}.html
//                                  + the Systems room of index.html (between sentinels)
//
// Volvo, after the GoHighLevel page: "recreate all workflows I have on each
// different tool on this manner." So there is one page builder and one card
// renderer for all six tools. The data is read off his own screenshots:
// GoHighLevel in lib/ghldata.mjs, everything else in lib/workflows.mjs.
//
// The index is the card grid from the reference he sent, in his branding. The
// marks are each vendor's REAL logo, fetched from that vendor (img/logos/).
// OpenPhone now trades as Quo, and the card says so.
//
// Retell, Intercom and OpenPhone each also have an interactive explainer from
// earlier (retell-agent, website-chat, call-routing). Those are kept and linked
// from the workflow card as "Walk through it", not replaced.
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { page } from "./lib/pagekit.mjs";
import { renderWorkflow, WORKFLOW_CSS, WORKFLOW_JS, workflowDialog } from "./lib/walkmap.mjs";
import { GHL, GROUPS as GHL_GROUPS } from "./lib/ghldata.mjs";
import { N8N, N8N_GROUPS, MAKE, MAKE_GROUPS, RETELL, RETELL_GROUPS,
  INTERCOM, INTERCOM_GROUPS, OPENPHONE, OPENPHONE_GROUPS } from "./lib/workflows.mjs";
import { TOOLS, DEEP } from "./lib/tooldata.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "explainers");
mkdirSync(OUT, { recursive: true });

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");

/* card copy (logo, bullets, tagline) lives in tooldata.mjs; look it up by key */
const COPY = Object.fromEntries([...TOOLS, ...DEEP].map(t => [t.key, t]));

/* ── the six pages ──────────────────────────────────────────────────────── */
const PAGES = [
  { key: "ghl", file: "ghl.html", list: GHL, groups: GHL_GROUPS,
    unit: "workflow", kicker: "GoHighLevel workflow",
    blurb: COPY.ghl.blurb,
    foot: "Read off the builder itself. Client names are withheld throughout, and where a workflow was too large to screenshot legibly the drawing says so rather than inventing the steps." },
  { key: "make", file: "make.html", list: MAKE, groups: MAKE_GROUPS,
    unit: "scenario", kicker: "Make.com scenario",
    blurb: COPY.make.blurb,
    foot: "Read off the scenario editor itself. Scenario names are blurred in the screenshots to keep client names private, so all but four are titled from their own modules; the four with visible names carry them exactly. Every module is labelled as the editor labels it." },
  { key: "n8n", file: "n8n.html", list: N8N, groups: N8N_GROUPS,
    unit: "workflow", kicker: "n8n workflow",
    blurb: COPY.n8n.blurb,
    foot: "Read off the n8n editor. The screenshots show the canvas without the workflow's name, so each is titled from its own steps; the steps are exactly as the editor labels them. Dashed curves are loops: the workflow goes round again until its condition is met." },
  { key: "retell", file: "retell.html", list: RETELL, groups: RETELL_GROUPS,
    unit: "agent", kicker: "Retell AI voice agent",
    blurb: "A voice agent that makes real phone calls. Every box is a state in the agent's conversation, and the call chooses its own route through them.",
    foot: "Read off the Retell builder. The client's name is withheld." },
  { key: "intercom", file: "intercom.html", list: INTERCOM, groups: INTERCOM_GROUPS,
    unit: "workflow", kicker: "Intercom workflow",
    blurb: "The chat on a client's website, built in Intercom. It greets, shows packages, and books a shoot without anyone on the team replying.",
    foot: "Read off the Intercom workflow canvas, including its own numbers. The client's name is withheld." },
  { key: "openphone", file: "openphone.html", list: OPENPHONE, groups: OPENPHONE_GROUPS,
    unit: "call flow", kicker: "OpenPhone call flow",
    blurb: "What happens when the business phone rings, built in OpenPhone (now Quo) with its Sona AI answering whenever a person cannot.",
    foot: "Read off the OpenPhone call flow editor. The client's name and number are withheld." }
];

const PAGE_CSS = `
.grp{margin:0 0 34px}
.ghd{margin:0 0 16px;padding-bottom:10px;border-bottom:3px solid var(--ink);position:relative}
.ghd h2{font-family:var(--f-disp);font-weight:900;letter-spacing:-.025em;margin:0;
  font-size:clamp(20px,2.8vw,28px)}
.cnt{position:absolute;right:0;top:4px;font-family:var(--f-mono);font-size:10.5px;
  letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
@media(max-width:560px){ .cnt{position:static;display:block;margin-top:6px} }`;

function workflowPage(p) {
  const c = COPY[p.key];
  let n = 0;
  const sections = p.groups.map((g) => {
    const mine = p.list.filter((w) => w.group === g.key);
    if (!mine.length) return "";
    return `    <section class="grp">
      <header class="ghd">
        <h2>${esc(g.label)}</h2>
        <span class="cnt">${plural(mine.length, p.unit)}</span>
      </header>
${mine.map((w) => renderWorkflow(w, ++n)).join("\n")}
    </section>`;
  }).filter(Boolean).join("\n");

  /* every workflow must belong to a group the page draws, or it silently vanishes */
  const orphans = p.list.filter(w => !p.groups.some(g => g.key === w.group));
  if (orphans.length) throw new Error(p.key + ": no group for " + orphans.map(w => w.key).join(", "));

  const many = p.list.length > 1;
  return page(c.name + " " + p.unit + "s", `
<a class="back" href="index.html">&lsaquo; All tools</a>
<span class="eyebrow">${esc(c.name)}${c.note ? " (" + esc(c.note) + ")" : ""} &middot; ${plural(p.list.length, p.unit)}</span>
<h1>${esc(c.tagline)}</h1>
<p class="lede">${esc(p.blurb)} ${many ? "Each one below is" : "Below is"} a real build, drawn step by step
as it runs. Click ${many ? "any one" : "it"} to see it full size.</p>

${sections}

<p class="lede" style="margin-top:26px">${esc(p.foot)}</p>
${workflowDialog(p.kicker)}
<script>${WORKFLOW_JS}</script>`, PAGE_CSS + WORKFLOW_CSS);
}

/* ── the index: one card per tool ───────────────────────────────────────── */
const BADGE = { ghl: true, make: true, n8n: true };   // these show a live count
const CARDS = PAGES.map(p => {
  const c = COPY[p.key];
  return { file: p.file, logo: c.logo, note: c.note, name: c.name, tagline: c.tagline,
    badge: BADGE[p.key] ? plural(p.list.length, p.unit) : c.badge,
    bullets: c.bullets, meta: p.list.length > 1 ? "See them run" : "See it run" };
});

/* The counter is a position in a set, and it is only honest because the set is
   closed and shown whole: six cards, all on screen, numbered 01 to 06. */
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
   hub's Systems room, so the two cannot disagree. */
const GRID_CSS = `
.tgrid{display:grid;gap:16px;grid-template-columns:1fr}
@media(min-width:660px){ .tgrid{grid-template-columns:repeat(2,1fr)} }
@media(min-width:1000px){ .tgrid{grid-template-columns:repeat(3,1fr)} }
.tc{display:flex;flex-direction:column;background:var(--card);border:3px solid var(--ink);
  border-radius:16px;box-shadow:6px 6px 0 0 var(--ink);padding:16px 16px 14px;
  text-decoration:none;color:inherit;
  transition:transform .18s var(--ease),box-shadow .18s var(--ease)}
.tc:hover{transform:translate(-2px,-2px);box-shadow:9px 9px 0 0 var(--ink)}
.tc:active{transform:translate(2px,2px);box-shadow:3px 3px 0 0 var(--ink)}
.tc:focus-visible{outline:3px solid var(--field);outline-offset:4px}
.tch{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
/* the vendor's real mark, fetched from the vendor, never redrawn */
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

const total = PAGES.reduce((a, p) => a + p.list.length, 0);
const index = page("Built, by tool", `
<a class="back" href="../index.html#systems">&lsaquo; Back to the portfolio</a>
<span class="eyebrow">The work &middot; ${CARDS.length} tools &middot; ${total} builds</span>
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
console.log("wrote explainers/index.html  (" + CARDS.length + " tool cards, " + total + " builds)");

for (const p of PAGES) {
  writeFileSync(join(OUT, p.file), workflowPage(p));
  const named = p.list.filter(w => w.named).length;
  console.log("wrote explainers/" + p.file.padEnd(15) + String(p.list.length).padStart(3) + " " +
    plural(p.list.length, p.unit).replace(/^\d+ /, "").padEnd(11) + (p.key === "ghl" ? "" : "  (" + named + " with their builder name)"));
}

/* ── the same grid, into the hub's Systems room ─────────────────────────────
   Written between sentinels, and the sentinels are load-bearing: this refuses
   rather than guessing if either is missing, because a half-matched
   replacement would eat the rest of the room. */
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
