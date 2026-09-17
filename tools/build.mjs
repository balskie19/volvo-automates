// Wrap the pages in a real document, prerender the deck's words into the HTML,
// and attach the structured data.
//   node tools/build.mjs
//
// Three problems this solves, measured before it was written:
//
// 1. NO VIEWPORT META. The pages were authored as fragments for a host that
//    supplies its own head. Served standalone, a phone laid them out at 980px
//    and scaled the result down: every slide scrolled sideways, text hit 8px.
//
// 2. 22 CRAWLABLE WORDS. The deck builds all eleven slides from a JavaScript
//    array at runtime, so anything that does not execute scripts, which is most
//    AI crawlers and Google's first pass, saw an empty page. The real text is
//    now prerendered into the body and the script removes it once it boots, so
//    the interactive deck and the crawlable document are the same words.
//
// 3. NO STRUCTURED DATA. The objection slide is six genuine questions with
//    answers, which is exactly what an answer engine wants to quote, and none
//    of it was marked up.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(import.meta.dirname, "..");
const SITE = "https://volvo-automates.pages.dev";
const PUPPETEER = "C:/Claude Projects Database/Proposed Projects/volvo-portfolio/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const CHROME = "C:/Users/Volvo/.cache/puppeteer/chrome/win64-152.0.7977.42/chrome-win64/chrome.exe";

const FAVICON = "data:image/svg+xml," + encodeURIComponent(
  // The character, cropped SQUARE. The first version used the figure's own
  // 220x250 portrait box, so a 16px tab letterboxed it and the face came out a
  // blob. Rendered at 16/20/24/32/48/96 before choosing this crop: the head now
  // fills the tile and the shoulders are a sliver at the bottom edge.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220">` +
  `<defs><clipPath id="c"><rect width="220" height="220" rx="40"/></clipPath></defs>` +
  `<rect width="220" height="220" rx="40" fill="#212A6B"/>` +
  `<g clip-path="url(#c)" transform="translate(-30.8,-37.7) scale(1.28)">` +
  `<path d="M50 250 C54 212 76 192 110 192 C144 192 166 212 170 250 Z" fill="#F5D547" stroke="#0B0E1C" stroke-width="7"/>` +
  `<path d="M110 40 C148 40 166 68 166 106 C166 146 142 178 110 178 C78 178 54 146 54 106 C54 68 72 40 110 40 Z" fill="#F2F1EA" stroke="#0B0E1C" stroke-width="7"/>` +
  `<path d="M53 104 C47 62 74 34 110 34 C150 34 173 62 167 106 C160 86 148 76 130 72 C114 90 82 94 62 82 C57 88 54 95 53 104 Z" fill="#0B0E1C"/>` +
  `<path d="M72 101 q14 -9 28 -3" fill="none" stroke="#0B0E1C" stroke-width="8" stroke-linecap="round"/>` +
  `<path d="M148 98 q-14 -8 -28 0" fill="none" stroke="#0B0E1C" stroke-width="8" stroke-linecap="round"/>` +
  `<ellipse cx="88" cy="118" rx="5.5" ry="6.5" fill="#0B0E1C"/><ellipse cx="132" cy="117" rx="5.5" ry="6.5" fill="#0B0E1C"/>` +
  `<path d="M84 148 q26 -11 52 0 q-12 13 -26 13 q-14 0 -26 -13 Z" fill="#0B0E1C"/>` +
  `</g></svg>`
);

const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ── 1 · read the deck's real words out of the running page ───────────────── */
async function prerender() {
  if (!existsSync(PUPPETEER)) { console.log("puppeteer not found, skipping prerender"); return null; }
  const { default: puppeteer } = await import(pathToFileURL(PUPPETEER).href);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "shell" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(pathToFileURL(join(ROOT, "index.html")).href, { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 1200));

  const slides = [];
  const count = await page.evaluate(() => document.querySelectorAll(".slide").length);
  for (let n = 1; n <= count; n++) {
    await page.evaluate(k => document.querySelectorAll("#menuList button")[k - 1].click(), n);
    await new Promise(r => setTimeout(r, 420));
    slides.push(await page.evaluate(() => {
      const s = document.querySelector(".slide.on");
      const pick = sel => [...s.querySelectorAll(sel)].map(e => e.textContent.replace(/\s+/g, " ").trim()).filter(Boolean);
      return {
        kicker: (s.querySelector(".kick")?.textContent || "").replace(/[_\s]+$/, "").trim(),
        heading: (s.querySelector("h1,h2")?.textContent || "").replace(/\s+/g, " ").trim(),
        paras: pick(".sub, .cards3 .card p, .app p, .row .nm small, .ledger dd, .story dd, .quotes p, .stack .ccard blockquote, .bub"),
        items: pick(".bay li, .cards3 .card h3, .app h3, .row .nm, .stack .ccard .big, .quotes cite, .stack .ccard cite"),
        links: [...s.querySelectorAll("a[href^='http'],a[href^='mailto']")].map(a => ({ href: a.href, text: a.textContent.replace(/\s+/g, " ").trim() }))
      };
    }));
  }
  const faq = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("#termList .q").forEach(q => {
      const a = document.getElementById(q.getAttribute("aria-controls"));
      if (a) out.push({ q: q.textContent.replace(/^\[\d\]\s*/, "").trim(), a: a.textContent.replace(/^>\s*/, "").trim() });
    });
    return out;
  });
  await browser.close();
  console.log("prerendered " + slides.length + " slides, " + faq.length + " questions");
  return { slides, faq };
}

/* ── 2 · turn that into a plain, semantic document ────────────────────────── */
function staticDoc(data) {
  if (!data) return "";
  const parts = ['<div id="staticdoc"><article>'];
  data.slides.forEach((s, i) => {
    if (i === 0) {
      parts.push(`<h1>${esc(s.heading)}</h1>`);
    } else {
      parts.push(`<section><h2>${esc(s.heading)}</h2>`);
      if (s.kicker) parts.push(`<p><strong>${esc(s.kicker)}</strong></p>`);
    }
    s.paras.forEach(p => parts.push(`<p>${esc(p)}</p>`));
    if (s.items.length) parts.push("<ul>" + s.items.map(x => `<li>${esc(x)}</li>`).join("") + "</ul>");
    s.links.forEach(l => parts.push(`<p><a href="${esc(l.href)}">${esc(l.text || l.href)}</a></p>`));
    if (i > 0) parts.push("</section>");
  });
  if (data.faq.length) {
    parts.push("<section><h2>Questions clients ask</h2><dl>");
    data.faq.forEach(f => parts.push(`<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`));
    parts.push("</dl></section>");
  }
  parts.push("</article></div>");
  return parts.join("\n");
}

/* ── 3 · structured data. Every claim here is one the site already makes. ─── */
function jsonLd(data, page) {
  const person = {
    "@type": "Person",
    "@id": SITE + "/#volvo",
    name: "Volvo Ebal",
    jobTitle: "AI systems and automation specialist",
    email: "mailto:volvo.ebal8@gmail.com",
    url: SITE,
    sameAs: ["https://www.linkedin.com/in/volvo-ebal/", "https://github.com/balskie19"],
    address: { "@type": "PostalAddress", addressCountry: "PH" },
    knowsAbout: ["GoHighLevel", "n8n", "Claude Code", "Marketing automation", "CRM automation",
      "Workflow automation", "AI voice agents", "Make.com", "Zapier", "HubSpot", "Lead reactivation"],
    worksFor: { "@id": SITE + "/#practice" }
  };
  const service = {
    "@type": "ProfessionalService",
    "@id": SITE + "/#practice",
    name: "Volvo Automates",
    description: "Automation for agencies and service businesses: GoHighLevel CRM builds, n8n workflow automation, and custom applications built with Claude Code.",
    url: SITE,
    founder: { "@id": SITE + "/#volvo" },
    areaServed: [{ "@type": "Country", name: "United States" }, { "@type": "Country", name: "Philippines" }],
    availableLanguage: "en",
    serviceType: ["CRM automation", "Workflow automation", "AI voice and chat agents", "Custom application development"],
    hasOfferCatalog: {
      "@type": "OfferCatalog", name: "What I am hired for",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "GoHighLevel CRM builds and repairs" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "n8n workflow automation and integration" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Custom applications built with Claude Code" } }
      ]
    }
  };
  const graph = [person, service, {
    "@type": "WebSite", "@id": SITE + "/#site", url: SITE, name: "Volvo Automates",
    publisher: { "@id": SITE + "/#volvo" }, inLanguage: "en"
  }];
  if (page === "index" && data && data.faq.length) {
    graph.push({
      "@type": "FAQPage", "@id": SITE + "/#faq",
      mainEntity: data.faq.map(f => ({
        "@type": "Question", name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a }
      }))
    });
  }
  if (page === "cv") {
    graph.push({ "@type": "ProfilePage", "@id": SITE + "/cv/#page", mainEntity: { "@id": SITE + "/#volvo" } });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

/* ── 4 · wrap ─────────────────────────────────────────────────────────────── */
// 2026-09-18: index.html became a static hub - sidebar plus rooms, all real
// markup - so it carries its OWN head and schema and must not be wrapped.
// Wrapping it again would strip that head and inject a duplicate. The CV is
// still authored as a fragment, so it is the only page left here.
const PAGES = [
  { file: "cv/index.html", key: "cv", title: "Volvo Ebal · CV",
    desc: "Six client engagements with the results those clients stated, eleven applications shipped, and the tools behind them.",
    url: SITE + "/cv/" }
];

// nothing to prerender any more: the hub's rooms are static markup.
const data = null;

for (const page of PAGES) {
  const path = join(ROOT, page.file);
  let html = readFileSync(path, "utf8");

  if (html.startsWith("<!doctype html>")) {
    const i = html.indexOf("<body>"), j = html.lastIndexOf("</body>");
    if (i === -1 || j === -1) throw new Error("cannot unwrap " + page.file);
    html = html.slice(i + 6, j).trim();
  }
  html = html.replace(/<title>[\s\S]*?<\/title>\s*/, "");
  html = html.replace(/<div id="staticdoc">[\s\S]*?<\/div>\n?/, "");

  const fallback = page.key === "index" ? staticDoc(data) : "";
  const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.desc)}">
<meta name="author" content="Volvo Ebal">
<meta name="theme-color" content="#212A6B">
<link rel="icon" href="${FAVICON}">
<link rel="canonical" href="${page.url}">
<meta property="og:type" content="${page.key === "cv" ? "profile" : "website"}">
<meta property="og:site_name" content="Volvo Automates">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.desc)}">
<meta property="og:url" content="${page.url}">
<meta property="og:image" content="${SITE}/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/og.png">
<script type="application/ld+json">${jsonLd(data, page.key)}</script>
<style>html{-webkit-text-size-adjust:100%}body{margin:0}img{max-width:100%}[hidden]{display:none!important}
/* the crawlable copy of the deck. The script removes it the moment it boots,
   so a visitor never sees it twice and a reader without scripts still gets
   every word. */
#staticdoc{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}</style>
</head>
<body>
${fallback}
`;
  writeFileSync(path, head + html + "\n</body>\n</html>\n");
  console.log("wrapped " + page.file + (fallback ? "  (+" + fallback.split(/\s+/).length + " prerendered words)" : ""));
}
