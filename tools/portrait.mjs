// Turn Volvo's real headshot into the site's drawn style, keeping the likeness.
//
//   node tools/portrait.mjs "C:/path/to/headshot.jpg"
//
// Why image-to-image and not a hand-drawn SVG: a drawn portrait from a photo is
// me guessing at a face. An edit model keeps the actual geometry - hairline,
// jaw, brow, the goatee - and only restyles it, which is the whole point of the
// request: a visitor should recognise HIM, not a mascot.
//
// Route (every part probed before writing this):
//   1. upload      kieai.redpandaai.co/api/file-base64-upload  -> a downloadUrl
//   2. restyle     google/nano-banana-edit, which REQUIRES image_urls
//   3. compress    to the two sizes the page actually displays
//
// Cost is the usual 5 credits a go. Run it again with --again to iterate; every
// attempt is kept under src-img/ so a better earlier take is never lost.
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve, extname } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ENV = "C:/Claude Projects Database/Proposed Projects/adbundance/.env";
const SRC = process.argv[2];
if (!SRC || !existsSync(SRC)) {
  console.error("give me the headshot:  node tools/portrait.mjs \"C:/path/to/photo.jpg\"");
  process.exit(1);
}

const KEY = (readFileSync(ENV, "utf8").match(/KIE_KEY=(.+)/) || [])[1]?.trim().replace(/\r|"/g, "");
if (!KEY) throw new Error("no KIE key in " + ENV);
const H = { "Content-Type": "application/json", Authorization: "Bearer " + KEY };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const bal = async () => (await (await fetch("https://api.kie.ai/api/v1/chat/credit", { headers: H })).json()).data;

/* The style is described by its RULES, not by a vibe word, because "cartoon"
   is what produces a generic mascot - which is the thing being replaced. Every
   clause below is a property of the site: one ink weight, flat fills, the two
   brand colours, no shading. The likeness clauses come first because they are
   the requirement; the style clauses are the treatment. */
/* Pass 2. Pass 1 asked for "tan skin" and got a shaded vector tracing, because a
   skin tone invites the model to model form with it. In THIS house style the face
   is the SAME cream as the background and only the ink line separates them - that
   is the single most characteristic thing about the mark, and it has to be stated
   outright or no amount of "flat" will produce it. Three colours, named by hex,
   and an explicit count, because "limited palette" is not a limit. */
const PROMPT = [
  "A minimal flat vector portrait of this exact person, drawn as a bold sticker in a",
  "screen-printed style.",
  "Keep the likeness precisely: the same round face shape and soft wide jaw, the same",
  "short black hair with a low straight hairline swept slightly across the forehead,",
  "the same thick straight dark eyebrows, the same small solid patch of beard on the",
  "chin directly below the lower lip, the same thin moustache, the same calm neutral",
  "mouth. It must be recognisably this individual, not a generic character.",
  "USE EXACTLY THREE COLOURS AND NO OTHERS.",
  "1: a warm off-white cream, hex F2F1EA. This is BOTH the flat background AND the",
  "face and neck. The skin is the same cream as the background. There is no skin tone,",
  "no tan, no beige, no peach, no pink anywhere in the image.",
  "2: a near-black navy ink, hex 0B0E1C, for the hair, the eyebrows, the eyes, the",
  "chin beard, the moustache, and for every outline.",
  "3: a deep indigo, hex 212A6B, for the shirt only.",
  "Every shape is enclosed by a very thick black outline of one single uniform weight,",
  "like a heavy marker pen, the same thickness on the face, the hair and the shoulders.",
  "The face reads only through that outline against the identical cream background.",
  "Eyes are two simple solid dark shapes. The nose is a single thin line with no",
  "nostrils. Shapes are simple, rounded and reduced.",
  "Framing: a head and shoulders bust, facing forward, centred, with generous empty",
  "space above the head, the shoulders running off the bottom edge.",
  "Absolutely no shading, no gradient, no soft edges, no highlights, no blush, no",
  "cheek tone, no jaw shadow, no neck shadow, no photographic texture, no 3D render.",
  "No orange, no text, no logo, no watermark, no border, one person only."
].join(" ");

const b64 = readFileSync(SRC).toString("base64");
const mime = extname(SRC).toLowerCase() === ".png" ? "image/png" : "image/jpeg";

const before = await bal();
console.log("credits before:", before);

/* 1 · the edit models need a URL, not bytes */
process.stdout.write("uploading the photo ... ");
const up = await (await fetch("https://kieai.redpandaai.co/api/file-base64-upload", {
  method: "POST", headers: H,
  body: JSON.stringify({
    base64Data: "data:" + mime + ";base64," + b64,
    uploadPath: "images/user",
    fileName: "volvo-headshot" + extname(SRC)
  })
})).json();
if (!up?.data?.downloadUrl) throw new Error("upload failed: " + JSON.stringify(up).slice(0, 200));
console.log("ok");

/* 2 · restyle */
process.stdout.write("restyling ... ");
const create = await (await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
  method: "POST", headers: H,
  body: JSON.stringify({
    model: "google/nano-banana-edit",
    input: { prompt: PROMPT, image_urls: [up.data.downloadUrl], output_format: "png", image_size: "1:1" }
  })
})).json();
if (create.code !== 200) throw new Error("create failed: " + create.msg);

let url = null;
for (let i = 0; i < 60; i++) {
  await sleep(5000);
  const info = await (await fetch(
    "https://api.kie.ai/api/v1/jobs/recordInfo?taskId=" + create.data.taskId, { headers: H })).json();
  if (info?.data?.state === "success") { url = JSON.parse(info.data.resultJson).resultUrls[0]; break; }
  if (info?.data?.state === "fail") throw new Error("failed: " + (info.data.failMsg || "unknown"));
}
if (!url) throw new Error("timed out after five minutes");
console.log("ok");

/* 3 · keep every attempt, then write the two sizes the page displays */
mkdirSync(join(ROOT, "src-img"), { recursive: true });
mkdirSync(join(ROOT, "img"), { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const raw = join(ROOT, "src-img", "portrait-" + stamp + ".png");
writeFileSync(raw, Buffer.from(await (await fetch(url)).arrayBuffer()));

// the sidebar shows it at 118px and the About tile at 78px, so 480 is already
// generous on a 2x screen and anything larger is bytes nobody sees
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", raw,
  "-vf", "scale=480:480:flags=lanczos", "-quality", "86", join(ROOT, "img", "volvo.webp")]);
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", raw,
  "-vf", "scale=160:160:flags=lanczos", "-quality", "86", join(ROOT, "img", "volvo-small.webp")]);

const after = await bal();
const kb = p => Math.round(readFileSync(p).length / 1024);
console.log("");
console.log("attempt kept :", raw);
console.log("img/volvo.webp        ", kb(join(ROOT, "img", "volvo.webp")), "KB");
console.log("img/volvo-small.webp  ", kb(join(ROOT, "img", "volvo-small.webp")), "KB");
console.log("credits after:", after, " (spent " + (before - after) + ")");

try {
  appendFileSync("C:/Claude Projects Database/Proposed Projects/_image-credit-ledger.md",
    "| " + new Date().toISOString().slice(0, 10) + " | volvo-automates (portrait, img2img) | 1 | " +
    (before - after).toFixed(1) + " | " + after + " |\n");
} catch (e) { console.log("ledger not updated: " + e.message); }
