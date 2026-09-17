// Sit the portrait ON the card instead of IN it, and write the display sizes.
//
//   node tools/flatten-portrait.mjs src-img/portrait-<stamp>.png
//
// The model returns its own idea of cream - measured #F5EDDA against the page's
// #F2F1EA - so the picture reads as a photograph pasted into the frame, with a
// visible rectangle where one cream meets the other. In this house style the
// face fill IS the page ground (the drawn character's face is #F2F1EA on a
// #F2F1EA card, separated only by ink), so the correction is not a crop or a
// mask: it is shifting the whole cream family onto the exact paper value.
//
// The shift is WEIGHTED BY DISTANCE rather than thresholded. A hard threshold
// leaves the antialiased pixels between cream and ink on the old value, which
// draws a faint halo around every shape at exactly the sizes this is viewed at.
// Fading the correction out as a pixel approaches the ink keeps edges clean.
//
// No credits. Runs on any attempt in src-img/, so a better earlier take can be
// promoted without regenerating it.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const CHROME = "C:/Users/Volvo/.cache/puppeteer/chrome/win64-152.0.7977.42/chrome-win64/chrome.exe";
const PUP = "C:/Claude Projects Database/Proposed Projects/volvo-portfolio/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const PAPER = [0xF2, 0xF1, 0xEA];   // --paper, the value both frames already set
const REACH = 46;                    // how far from the sampled cream still counts as ground

const SRC = process.argv[2];
if (!SRC || !existsSync(SRC)) {
  console.error("usage: node tools/flatten-portrait.mjs src-img/portrait-<stamp>.png");
  process.exit(1);
}

const puppeteer = (await import("file:///" + PUP)).default;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const page = await browser.newPage();

const out = await page.evaluate(async (d, paper, reach) => {
  const img = new Image();
  img.src = "data:image/png;base64," + d;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const cx = c.getContext("2d", { willReadFrequently: true });
  cx.drawImage(img, 0, 0);
  const im = cx.getImageData(0, 0, c.width, c.height);
  const p = im.data;

  /* The ground is sampled from the corners, never assumed. Four corners, and
     they must agree, or this is not a flat-ground picture and the correction
     would be operating on something it has misread. */
  const at = (x, y) => [p[(y * c.width + x) * 4], p[(y * c.width + x) * 4 + 1], p[(y * c.width + x) * 4 + 2]];
  const corners = [at(3, 3), at(c.width - 4, 3), at(3, c.height - 4), at(c.width - 4, c.height - 4)];
  const from = [0, 1, 2].map(i => Math.round(corners.reduce((s, q) => s + q[i], 0) / 4));
  const spread = Math.max(...corners.map(q => Math.max(...q.map((v, i) => Math.abs(v - from[i])))));

  let moved = 0;
  for (let i = 0; i < p.length; i += 4) {
    const dr = p[i] - from[0], dg = p[i + 1] - from[1], db = p[i + 2] - from[2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist >= reach) continue;
    const w = 1 - dist / reach;          // 1 on the ground itself, 0 at the ink
    p[i]     = Math.round(p[i]     + (paper[0] - from[0]) * w);
    p[i + 1] = Math.round(p[i + 1] + (paper[1] - from[1]) * w);
    p[i + 2] = Math.round(p[i + 2] + (paper[2] - from[2]) * w);
    if (w > 0.9) moved++;
  }
  cx.putImageData(im, 0, 0);
  const hex = a => "#" + a.map(v => v.toString(16).padStart(2, "0")).join("");
  return {
    data: c.toDataURL("image/png").split(",")[1],
    from: hex(from), spread, moved,
    total: c.width * c.height, size: [c.width, c.height]
  };
}, readFileSync(SRC).toString("base64"), PAPER, REACH);

await browser.close();

if (out.spread > 8) {
  console.error("the four corners disagree by " + out.spread + ", so this is not a flat ground.");
  console.error("refusing rather than shifting colours across a picture I have misread.");
  process.exit(1);
}

mkdirSync(join(ROOT, "img"), { recursive: true });
const flat = SRC.replace(/\.png$/, "-flat.png");
writeFileSync(flat, Buffer.from(out.data, "base64"));

for (const [name, px] of [["volvo.webp", 480], ["volvo-small.webp", 160]]) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", flat,
    "-vf", "scale=" + px + ":" + px + ":flags=lanczos", "-quality", "90", join(ROOT, "img", name)]);
}

const kb = f => Math.round(readFileSync(f).length / 1024);
console.log("source ground :", out.from, "->", "#f2f1ea   (corners agree within " + out.spread + ")");
console.log("ground pixels :", out.moved, "of", out.total,
  "(" + (out.moved / out.total * 100).toFixed(1) + "%)");
console.log("flat kept     :", flat);
console.log("img/volvo.webp       ", kb(join(ROOT, "img", "volvo.webp")), "KB");
console.log("img/volvo-small.webp ", kb(join(ROOT, "img", "volvo-small.webp")), "KB");
