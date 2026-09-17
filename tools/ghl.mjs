// Turn the hub into one block you can paste into a GoHighLevel custom-code
// element, and a preview that proves it survives a hostile host page.
//
//   node tools/ghl.mjs
//
// GHL does not host a document, it hosts a FRAGMENT inside a page it already
// owns. That breaks five things, and four of them fail silently:
//
//   1. <!doctype>, <html>, <head> and <body> are stripped or nested wrongly.
//   2. Our CSS leaks OUT. `body{background:...}` repaints GHL's whole page.
//   3. GHL's CSS leaks IN. It styles bare h1/h2/p/a/ul, so anything we did not
//      style explicitly inherits their theme and drifts.
//   4. Relative asset paths 404. `img/volvo.webp` does not exist on their CDN.
//   5. Bare hashes collide. `#about` is a plausible anchor on a funnel page and
//      GHL's own smooth-scroll will fight the router for it.
//
// So: scope every selector under #vo-site, move the body rules onto that
// wrapper, inline every image as a data URI, and namespace the routes to
// #vo-<room>. The page keeps working as a normal site, because none of this
// depends on being inside GHL.
//
// The output is deliberately ONE file with no external asset. A paste that
// depends on pages.dev staying up is a paste that breaks the day he moves.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve, extname } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SCOPE = "#vo-site";
const src = readFileSync(join(ROOT, "index.html"), "utf8");

/* ── read a {...} block, honouring nesting and strings ─────────────────────
   A regex cannot do this: `content:"}"` and nested @media both break it. */
function readBlock(css, openAt) {
  let depth = 0, i = openAt, q = null;
  for (; i < css.length; i++) {
    const c = css[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === "/" && css[i + 1] === "*") { const e = css.indexOf("*/", i + 2); i = e < 0 ? css.length : e + 1; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (!depth) return { body: css.slice(openAt + 1, i), end: i + 1 }; }
  }
  return { body: css.slice(openAt + 1), end: css.length };
}

/* Split a selector list on top-level commas only, so :is(a,b) survives. */
function splitSelectors(s) {
  const out = []; let depth = 0, cur = "", q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { cur += c; if (c === "\\") { cur += s[++i]; } else if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === "(" || c === "[") depth++;
    if (c === ")" || c === "]") depth--;
    if (c === "," && !depth) { out.push(cur); cur = ""; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/* The whole trick. `body.open .side` must become `#vo-site.open .side`, not
   `#vo-site body.open .side` - there is no <body> inside the wrapper, so the
   naive prefix silently matches nothing and the mobile drawer never opens. */
let rootRules = 0;
function scopeSelector(list) {
  return splitSelectors(list).map(raw => {
    const sel = raw.trim();
    if (!sel) return "";
    if (/^(from|to|\d+%)$/i.test(sel)) return sel;                 // keyframe stop
    const root = /^(:root|html|body)\b/.exec(sel);
    if (root) { rootRules++; return SCOPE + sel.slice(root[0].length); }
    if (sel === "*") return SCOPE + ",\n" + SCOPE + " *";
    return SCOPE + " " + sel;
  }).filter(Boolean).join(",\n");
}

function scopeCss(css) {
  let out = "", i = 0;
  while (i < css.length) {
    if (css.startsWith("/*", i)) { const e = css.indexOf("*/", i + 2); const end = e < 0 ? css.length : e + 2; out += css.slice(i, end); i = end; continue; }
    const ws = /^\s+/.exec(css.slice(i));
    if (ws) { out += ws[0]; i += ws[0].length; continue; }
    if (css[i] === "@") {
      const brace = css.indexOf("{", i), semi = css.indexOf(";", i);
      if (brace < 0 || (semi >= 0 && semi < brace)) { out += css.slice(i, semi + 1); i = semi + 1; continue; }
      const prelude = css.slice(i, brace + 1);
      const { body, end } = readBlock(css, brace);
      const name = (/^@([a-z-]+)/i.exec(prelude) || [, ""])[1].toLowerCase();
      // keyframes and font-face hold stops and descriptors, never selectors
      out += prelude + (["media", "supports", "layer", "container"].includes(name) ? scopeCss(body) : body) + "}";
      i = end; continue;
    }
    const brace = css.indexOf("{", i);
    if (brace < 0) { out += css.slice(i); break; }
    const { body, end } = readBlock(css, brace);
    out += scopeSelector(css.slice(i, brace)) + "{" + body + "}";
    i = end;
  }
  return out;
}

/* ── pull the document apart ─────────────────────────────────────────────── */
const styleM = /<style>([\s\S]*?)<\/style>/.exec(src);
if (!styleM) throw new Error("no <style> block found");
const ldM = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(src);
const scriptM = /<script>([\s\S]*?)<\/script>\s*<\/body>/.exec(src) || /<script>([\s\S]*?)<\/script>/g && [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop();
if (!scriptM) throw new Error("no router <script> found");
const fontM = /<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com[^"]+)">/.exec(src);
const bodyM = /<body[^>]*>([\s\S]*)<\/body>/.exec(src);
if (!bodyM) throw new Error("no <body> found");

let markup = bodyM[1]
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "")
  .replace(/<script>[\s\S]*?<\/script>/g, "")
  .trim();

/* ── 1 · assets ───────────────────────────────────────────────────────────
   Two builds, because the right answer depends on a thing I cannot see: how
   his GHL editor behaves with a very large paste.
     full  - every image embedded. Nothing external, nothing to break, ever.
     light - the four screenshots point at the live site; the portrait, which
             is small and is the page's identity, stays embedded.
   The duplication is real (each screenshot appears in a door tile AND in the
   Work room) and is left alone: brotli's window collapses a repeated string
   almost entirely, so it costs paste size rather than load time. */
const MIME = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".gif": "image/gif" };
const LIVE = "https://volvo-automates.pages.dev/";
const seen = new Map();
function withAssets(html, embedAll) {
  return html.replace(/src="((?!data:|https?:)[^"]+)"/g, (whole, rel) => {
    const file = join(ROOT, rel);
    if (!existsSync(file)) throw new Error("asset referenced but missing: " + rel);
    const mime = MIME[extname(rel).toLowerCase()];
    if (!mime) throw new Error("no mime type known for " + rel);
    const b = readFileSync(file);
    seen.set(rel, Math.round(b.length / 1024));
    if (!embedAll && rel.startsWith("shots/")) return 'src="' + LIVE + rel + '"';
    return 'src="data:' + mime + ";base64," + b.toString("base64") + '"';
  });
}
/* ── 2 · namespace the routes, BEFORE the assets, or the two builds diverge
   from each other in a way nothing downstream would notice ──────────────── */
const rooms = [...src.matchAll(/id="room-([a-z0-9-]+)"/g)].map(m => m[1]);
if (!rooms.length) throw new Error("no rooms found");
let routesRewritten = 0;
markup = markup.replace(/href="#([a-z0-9-]+)"/g, (whole, name) => {
  if (!rooms.includes(name)) return whole;      // a real element id, leave it
  routesRewritten++;
  return 'href="#vo-' + name + '"';
});
if (!routesRewritten) throw new Error("no room links were namespaced");

const markupFull = withAssets(markup, true);
const markupLight = withAssets(markup, false);
if (!seen.size) throw new Error("no relative assets found; check the markup");
if (markupFull === markup) throw new Error("nothing was embedded");
const inlined = [...seen.entries()];

/* ── 3 · the router loses document.body and the bare hash ────────────────── */
let js = scriptM[1];
const jsEdits = [
  [/var body = document\.body;/, 'var body = document.getElementById("vo-site");'],
  [/show\(\(location\.hash \|\| "#home"\)\.slice\(1\), focus\);/,
    'show((location.hash || "").replace(/^#vo-/, "") || "home", focus);'],
  [/if \(location\.hash\.slice\(1\) !== name\) history\.pushState\(null, "", "#" \+ name\);/,
    'if (location.hash.replace(/^#vo-/, "") !== name) history.pushState(null, "", "#vo-" + name);']
];
for (const [re, to] of jsEdits) {
  if (!re.test(js)) throw new Error("router shape changed, this edit no longer applies: " + re);
  js = js.replace(re, to);
}

/* ── 4 · assemble ────────────────────────────────────────────────────────── */
// A defensive reset FIRST, so the real stylesheet still wins every contest.
// Without it, anything we never styled (a bare <p> in a card) inherits GHL's
// theme - which is how an embed drifts a week after it was signed off.
/* Every value below is the BROWSER's default, never a preference of mine.
   That distinction is the whole design of this block. The reset's only job is
   to cancel what the host theme says about bare elements and hand the question
   back to the real stylesheet - so if it imposes anything the browser would not
   have done, it silently changes the page it was supposed to protect. The first
   version set `a{text-decoration:none}` and `button{font:inherit}`, and quietly
   removed four underlines and restyled the menu button. `all:revert` on form
   controls rolls them back to the user-agent sheet in one move; box-sizing is
   restated after it because the revert would undo that too.
   Specificity is deliberately (1,0,1) - above any bare-element host rule, below
   every scoped site rule, which all carry at least one class. */
const reset = `${SCOPE},${SCOPE} *,${SCOPE} *::before,${SCOPE} *::after{box-sizing:border-box}
${SCOPE} h1,${SCOPE} h2,${SCOPE} h3,${SCOPE} h4,${SCOPE} h5,${SCOPE} h6,${SCOPE} p,${SCOPE} ul,${SCOPE} ol,${SCOPE} li,${SCOPE} dl,${SCOPE} dd,${SCOPE} figure,${SCOPE} blockquote,${SCOPE} pre,${SCOPE} form{margin:0;padding:0}
${SCOPE} ul,${SCOPE} ol{list-style:none}
${SCOPE} h1,${SCOPE} h2,${SCOPE} h3,${SCOPE} h4,${SCOPE} h5,${SCOPE} h6,${SCOPE} p,${SCOPE} li,${SCOPE} a,${SCOPE} span,${SCOPE} b,${SCOPE} strong,${SCOPE} small,${SCOPE} time,${SCOPE} label,${SCOPE} summary,${SCOPE} figcaption{text-transform:inherit;letter-spacing:inherit;color:inherit;text-align:inherit}
${SCOPE} a{text-decoration:underline}
${SCOPE} img,${SCOPE} svg,${SCOPE} video{max-width:100%;border:0}
${SCOPE} button,${SCOPE} input,${SCOPE} select,${SCOPE} textarea{all:revert;box-sizing:border-box}
${SCOPE}{text-align:left;line-height:normal;letter-spacing:normal;text-transform:none}`;

const scoped = scopeCss(styleM[1]);
const css = (fontM ? "@import url('" + fontM[1] + "');\n" : "") + reset + "\n" + scoped;

const assemble = (bodyHtml, assetNote) => `<!-- ═══════════════════════════════════════════════════════════════════════
     VOLVO EBAL · portfolio, packaged for GoHighLevel
     Paste this whole block into ONE custom-code / HTML element on a blank,
     full-width page. Do not put a GHL section heading above it: the sidebar
     is the page's own navigation.

     ${assetNote}

     Everything is scoped to #vo-site, so it cannot restyle the rest of your
     funnel and the rest of your funnel cannot restyle it. Routes are
     namespaced #vo-home, #vo-work ... so they cannot collide with a GHL
     anchor. Deep links work: yoursite.com/portfolio#vo-clients opens Clients.
     ═══════════════════════════════════════════════════════════════════════ -->
<div id="vo-site">
<style>
${css}
</style>

${bodyHtml}

${ldM ? '<script type="application/ld+json">' + ldM[1] + "</script>\n" : ""}<script>
${js}
</script>
</div>
`;

const out = assemble(markupFull,
  "Self-contained. No external file, no relative path, nothing to upload.\n     Every image is embedded. The only network call is the Google Fonts import.");
const outLight = assemble(markupLight,
  "The four site screenshots load from " + LIVE + ".\n     The portrait is embedded. Use this one if the editor struggles with the\n     self-contained version; use the other if you ever retire that domain.");

mkdirSync(join(ROOT, "ghl"), { recursive: true });
const dest = join(ROOT, "ghl", "volvo-portfolio-ghl.html");
writeFileSync(dest, out);
writeFileSync(join(ROOT, "ghl", "volvo-portfolio-ghl-light.html"), outLight);

/* A preview that simulates a HOSTILE host page. GHL styles bare elements and
   sets a page background; if the scoping is wrong this is where it shows,
   rather than after it is pasted into his live funnel. */
const hostile = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GHL paste preview</title>
<style>
/* deliberately aggressive stand-in for a host theme */
*{box-sizing:content-box}
body{margin:0;font-family:Georgia,serif;font-size:19px;line-height:2.1;color:#7a2d2d;
  background:#fce9d8;text-align:center;letter-spacing:.06em}
h1,h2,h3,h4{font-family:"Comic Sans MS",cursive;color:#c0392b;margin:34px 0;text-transform:uppercase}
p,li{margin:22px 0;color:#7a2d2d}
a{color:#c0392b;text-decoration:underline}
ul,ol{list-style:square;padding-left:44px}
img{border:6px dashed #c0392b;border-radius:0}
button{font-family:cursive;background:#c0392b;color:#fff;border:4px solid #000}
section,div{background:transparent}
</style></head><body>
<h1>Host page heading above the embed</h1>
<p>Host paragraph. If the embed is scoped correctly, nothing below inherits this.</p>
${out}
<p>Host paragraph after the embed.</p>
</body></html>`;
writeFileSync(join(ROOT, "ghl", "preview.html"), hostile);

const kb = n => Math.round(n / 1024);
console.log("rooms            :", rooms.length, "->", rooms.join(", "));
console.log("routes namespaced:", routesRewritten);
console.log("root rules moved :", rootRules, "(:root/html/body -> " + SCOPE + ")");
console.log("images inlined   :", inlined.map(a => a[0] + " " + a[1] + "KB").join(", "));
console.log("json-ld carried  :", !!ldM);
console.log("");
console.log("paste block      :", dest, kb(out.length) + "KB  (self-contained)");
console.log("lighter variant  :", join(ROOT, "ghl", "volvo-portfolio-ghl-light.html"), kb(outLight.length) + "KB");
console.log("hostile preview  :", join(ROOT, "ghl", "preview.html"));
