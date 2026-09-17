// Prove the GHL build renders IDENTICALLY to the real page, inside a hostile host.
//
//   node tools/ghl-check.mjs
//
// The markup of the two is the same, so their elements line up one for one in
// document order. That makes the test an equality check rather than a judgement:
// walk both trees together and compare the computed style of every element on
// every property that a host theme can reach.
//
// This exists because the first reset was wrong in a way that looked right.
// `#vo-site{text-transform:none}` sets the property on the WRAPPER and relies on
// inheritance, and an inherited value loses to a host rule that names the element
// (`h2{text-transform:uppercase}`). Every heading in the embed was uppercase while
// the sidebar, the fonts and the colours were all perfect - the kind of drift
// nobody notices until a client screenshots it.
//
// The host stylesheet in ghl/preview.html is deliberately more aggressive than
// GoHighLevel's. If the embed survives that, it survives a real theme.
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const CHROME = "C:/Users/Volvo/.cache/puppeteer/chrome/win64-152.0.7977.42/chrome-win64/chrome.exe";
const PUP = "C:/Claude Projects Database/Proposed Projects/volvo-portfolio/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

// Everything a host theme realistically sets on bare elements.
const PROPS = ["fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight",
  "letterSpacing", "textTransform", "textDecorationLine", "textAlign", "color",
  "backgroundColor", "listStyleType", "boxSizing", "marginTop", "marginBottom",
  "marginLeft", "paddingTop", "paddingLeft", "borderTopWidth", "borderTopStyle",
  "borderTopLeftRadius", "display", "width", "height"];

const collect = (rootSel, props) => {
  const root = rootSel ? document.querySelector(rootSel) : document.body;
  // <style> and <script> render nothing and sit in different places in the two
  // builds, so counting them would fail the comparison for no visual reason.
  const SKIP = { STYLE: 1, SCRIPT: 1, LINK: 1, META: 1, TITLE: 1 };
  const out = [];
  const walk = el => {
    if (SKIP[el.tagName]) return;
    const c = getComputedStyle(el);
    const rec = { tag: el.tagName.toLowerCase(), cls: (el.className || "").toString().slice(0, 40) };
    for (const p of props) rec[p] = c[p];
    out.push(rec);
    for (const k of el.children) walk(k);
  };
  for (const k of root.children) walk(k);
  return out;
};

const puppeteer = (await import("file:///" + PUP)).default;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });

async function styles(url, scope) {
  const pg = await browser.newPage();
  await pg.setViewport({ width: 1440, height: 900 });
  await pg.goto(url, { waitUntil: "networkidle0" });
  const r = await pg.evaluate(collect, scope, PROPS);
  await pg.close();
  return r;
}

const real = await styles("file:///" + join(ROOT, "index.html").replace(/\\/g, "/"), null);
const host = await styles("file:///" + join(ROOT, "ghl", "preview.html").replace(/\\/g, "/"), "#vo-site");
await browser.close();

if (real.length !== host.length) {
  console.error("element counts differ: real " + real.length + ", embed " + host.length);
  console.error("the two are not the same markup, so a style comparison would be meaningless.");
  process.exit(1);
}

/* textAlign is excused ONLY for the exact pair start/left, which are the same
   rendering in a left-to-right document and differ only because the host sets
   an explicit value. Any other disagreement is a real one. */
const same = (p, a, b) => a === b ||
  (p === "textAlign" && ((a === "start" && b === "left") || (a === "left" && b === "start")));

const bad = [];
for (let i = 0; i < real.length; i++) {
  for (const p of PROPS) {
    if (!same(p, real[i][p], host[i][p])) {
      bad.push({ i, el: real[i].tag + (real[i].cls ? "." + real[i].cls.split(" ")[0] : ""), p, real: real[i][p], embed: host[i][p] });
    }
  }
}

console.log("elements compared :", real.length);
console.log("properties each   :", PROPS.length);
console.log("comparisons       :", real.length * PROPS.length);

if (!bad.length) {
  console.log("");
  console.log("PASS - the embed renders identically to the real page inside a hostile host.");
  process.exit(0);
}

const byProp = {};
for (const b of bad) (byProp[b.p] ||= []).push(b);
console.log("");
console.log("FAIL -", bad.length, "divergences across", Object.keys(byProp).length, "properties");
for (const p of Object.keys(byProp)) {
  const list = byProp[p];
  console.log("");
  console.log("  " + p + "  (" + list.length + ")");
  for (const b of list.slice(0, 6)) {
    console.log("    <" + b.el + ">  real: " + b.real + "   embed: " + b.embed);
  }
  if (list.length > 6) console.log("    ... and " + (list.length - 6) + " more");
}
process.exit(1);
