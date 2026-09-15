// Publish the site to Cloudflare Pages.
//   node tools/deploy.mjs
//
// Three things this handles that a bare `wrangler pages deploy` does not:
//
// 1. It stages a CLEAN dist: the deck, the CV, and nothing else. No .git, no
//    README, no tooling.
// 2. It hands wrangler the token explicitly. A non-interactive deploy otherwise
//    reports "Not logged in" even after `wrangler login` has run, because
//    different wrangler code paths look in different directories. That helper
//    lives in the Colorly project and is imported, never copied, so the two
//    cannot drift.
// 3. It creates the Pages project first. Cloudflare will not create one
//    implicitly, and the deploy fails with a confusing error if it is missing.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HELPER = "C:/Claude Projects Database/Proposed Projects/colorly/tools/cfToken.mjs";
const PROJECT = "volvo-automates";
const ROOT = resolve(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");

let findToken, wranglerCommand;
try {
  ({ findToken, wranglerCommand } = await import(pathToFileURL(HELPER).href));
} catch (err) {
  console.error("could not load the Cloudflare credential helper at:\n  " + HELPER);
  console.error("if that project moved, point HELPER at its new location.");
  throw err;
}

// --- stage exactly what should be public
rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, "cv"), { recursive: true });
const FILES = ["index.html", "cv/index.html", "robots.txt", "sitemap.xml", "llms.txt", "404.html", "og.png"];
// The websites slide ships screenshots, and a directory is not a file:
// staging only the named files would publish a slide of four broken tiles.
const DIRS = ["shots"];
for (const f of FILES) {
  const from = join(ROOT, f);
  if (!existsSync(from)) { console.log("  (skipping missing " + f + ")"); continue; }
  cpSync(from, join(DIST, f));
}
for (const d of DIRS) cpSync(join(ROOT, d), join(DIST, d), { recursive: true });
for (const f of ["index.html", "cv/index.html", "robots.txt", "sitemap.xml", "llms.txt", "404.html"]) {
  if (!existsSync(join(DIST, f))) throw new Error("staging missed " + f);
}
// Every local asset the deck names must exist in dist, or a tile is a silent 404.
const markup = readFileSync(join(ROOT, "index.html"), "utf8")
  .replace(new RegExp("<style[^]*?</style>", "gi"), "");
let checked = 0;
for (const m of markup.matchAll(new RegExp("src=" + String.fromCharCode(92, 34) + "?([^" + String.fromCharCode(34) + "\\s>]+)", "g"))) {
  const ref = m[1].replace(/^["']|["']$/g, "");
  if (/^(https?:|data:|#)/.test(ref)) continue;
  if (ref.indexOf("$") === 0 || ref.indexOf("{") >= 0) continue;
  if (!existsSync(join(DIST, ref))) throw new Error("deck references " + ref + " but dist has no such file");
  checked++;
}
console.log("verified " + checked + " local asset references");
console.log("staged: " + FILES.join(", "));

// --- credentials
const token = await findToken();
const env = { ...process.env, CLOUDFLARE_API_TOKEN: token };

// wranglerCommand takes the arguments and returns [command, argv]: wrangler is
// a .cmd shim on Windows and node will not spawn those directly.
function run(args, opts = {}) {
  const [cmd, argv] = wranglerCommand(args);
  return execFileSync(cmd, argv, {
    cwd: ROOT, env, encoding: "utf8", stdio: opts.quiet ? "pipe" : "inherit",
  });
}

// --- the project must exist before anything can be deployed into it
try {
  run(["pages", "project", "create", PROJECT, "--production-branch", "main"], { quiet: true });
  console.log("created Pages project " + PROJECT);
} catch (err) {
  const out = String(err.stdout || "") + String(err.stderr || "");
  if (!/already exists/i.test(out)) throw err;
  console.log("Pages project " + PROJECT + " already exists");
}

// --- publish
run(["pages", "deploy", "dist", "--project-name", PROJECT, "--branch", "main", "--commit-dirty=true"]);
console.log("\nlive: https://" + PROJECT + ".pages.dev");
