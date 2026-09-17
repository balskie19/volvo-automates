// Render the share card from the real home screen.
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
// A share card has one job: who, and what they do. The room grid crops into
// meaningless fragments at 1200x630, so it is removed and the sidebar plus the
// promise are what the card carries.
await page.evaluate(() => {
  document.querySelectorAll(".room,.menu-btn,.scrim").forEach(el => el.remove());
  var tools = document.querySelector(".tools");
  if (tools) tools.style.marginTop = "26px";
  var main = document.querySelector(".main");
  if (main) main.style.paddingTop = "34px";
});
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: join(ROOT, "og.png") });
await browser.close();
console.log("og.png written from the home screen at 1200x630");
