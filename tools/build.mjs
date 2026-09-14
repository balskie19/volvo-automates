// Wrap the page fragments in a real HTML document.
//   node tools/build.mjs
//
// The pages were authored as fragments, because the artifact host supplies its
// own <head>. Served standalone they had NO viewport meta, so a phone laid them
// out at 980px and scaled the result down: every slide reported sideways scroll
// and text measured 8px. This adds the head once, in one place, for both pages.
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SITE = "https://volvo-automates.pages.dev";

/* the character, small enough to be a favicon */
const FAVICON =
  "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 250">` +
    `<rect width="220" height="250" rx="40" fill="#212A6B"/>` +
    `<path d="M92 196 L110 220 L128 196" fill="none" stroke="#0B0E1C" stroke-width="6"/>` +
    `<path d="M50 250 C54 212 76 192 110 192 C144 192 166 212 170 250 Z" fill="#F5D547" stroke="#0B0E1C" stroke-width="7"/>` +
    `<path d="M110 40 C148 40 166 68 166 106 C166 146 142 178 110 178 C78 178 54 146 54 106 C54 68 72 40 110 40 Z" fill="#F2F1EA" stroke="#0B0E1C" stroke-width="7"/>` +
    `<path d="M53 104 C47 62 74 34 110 34 C150 34 173 62 167 106 C160 86 148 76 130 72 C114 90 82 94 62 82 C57 88 54 95 53 104 Z" fill="#0B0E1C"/>` +
    `<path d="M72 101 q14 -9 28 -3" fill="none" stroke="#0B0E1C" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M148 98 q-14 -8 -28 0" fill="none" stroke="#0B0E1C" stroke-width="8" stroke-linecap="round"/>` +
    `<ellipse cx="88" cy="118" rx="5.5" ry="6.5" fill="#0B0E1C"/>` +
    `<ellipse cx="132" cy="117" rx="5.5" ry="6.5" fill="#0B0E1C"/>` +
    `<path d="M84 148 q26 -11 52 0 q-12 13 -26 13 q-14 0 -26 -13 Z" fill="#0B0E1C"/>` +
    `</svg>`
  );

const PAGES = [
  {
    file: "index.html",
    title: "Volvo Ebal · AI systems and automation",
    desc: "I build the system that runs the business after the lead comes in. GoHighLevel, n8n, and applications built with Claude Code.",
    url: SITE + "/"
  },
  {
    file: "cv/index.html",
    title: "Volvo Ebal · CV",
    desc: "Six client engagements, eleven applications shipped, and the tools behind them.",
    url: SITE + "/cv/"
  }
];

for (const page of PAGES) {
  const path = join(ROOT, page.file);
  let html = readFileSync(path, "utf8");

  // idempotent: strip a head this script added on a previous run
  if (html.startsWith("<!doctype html>")) {
    const i = html.indexOf("<body>");
    const j = html.lastIndexOf("</body>");
    if (i === -1 || j === -1) throw new Error("cannot unwrap " + page.file);
    html = html.slice(i + 6, j).trim();
  }
  // the fragment carries its own <title>; the head owns it instead
  html = html.replace(/<title>[\s\S]*?<\/title>\s*/, "");

  const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${page.title}</title>
<meta name="description" content="${page.desc}">
<meta name="theme-color" content="#212A6B">
<link rel="icon" href="${FAVICON}">
<link rel="canonical" href="${page.url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${page.title}">
<meta property="og:description" content="${page.desc}">
<meta property="og:url" content="${page.url}">
<meta name="twitter:card" content="summary_large_image">
<style>html{-webkit-text-size-adjust:100%}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
`;
  writeFileSync(path, head + html + "\n</body>\n</html>\n");
  console.log("wrapped " + page.file + "  (" + (head.length + html.length) + " bytes)");
}
