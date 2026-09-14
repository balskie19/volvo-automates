// Render the share card from the real first slide.
//   node tools/og.mjs
// A social card drawn by hand drifts from the site; a screenshot cannot.
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PUPPETEER = "C:/Claude Projects Database/Proposed Projects/volvo-portfolio/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const CHROME = "C:/Users/Volvo/.cache/puppeteer/chrome/win64-152.0.7977.42/chrome-win64/chrome.exe";

const { default: puppeteer } = await import(pathToFileURL(PUPPETEER).href);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "shell" });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(ROOT, "index.html")).href, { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 1800));
// the chrome belongs to the deck, not to a shared link
await page.evaluate(() => {
  document.querySelectorAll(".bar,.hint,.ticks,.guide").forEach(el => el.remove());
});
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: join(ROOT, "og.png") });
await browser.close();
console.log("og.png written from slide 1 at 1200x630");
