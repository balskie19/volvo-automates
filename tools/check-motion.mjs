// Motion is the easiest thing to ship broken and believe works: a paused SMIL
// clock, a hidden state that never un-hides, a lightbox that opens empty. None
// of those error. So this drives the real page and asserts BEHAVIOUR:
//   * every image fits its card (a long workflow must shrink, not overflow);
//   * a card scrolled into view ends up fully drawn - nothing stuck hidden;
//   * a packet is at a different place a moment later - it really moves;
//   * the pings fire at the start and the end;
//   * clicking opens the lightbox at full size with the right name, Replay
//     restarts it, Esc and a backdrop click both close it, focus comes back;
//   * with reduced motion, everything is simply there and nothing moves.
const P = (await import("file:///C:/Claude Projects Database/Proposed Projects/volvo-portfolio/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js")).default;
const b = await P.launch({ executablePath: "C:/Users/Volvo/.cache/puppeteer/chrome/win64-152.0.7977.42/chrome-win64/chrome.exe", headless: "new" });
const U = process.argv[2] || "file:///C:/Claude Projects Database/Proposed Projects/volvo-automates/explainers/ghl.html";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (cond, label, detail = "") => { if (!cond) fails++; console.log((cond ? "  ok   " : "  FAIL ") + label + (detail ? "  " + detail : "")); };

const pg = await b.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
await pg.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await pg.goto(U, { waitUntil: "networkidle0" });
await pg.evaluate(() => document.fonts.ready);

/* 1. images fit */
const fit = await pg.evaluate(() => [...document.querySelectorAll(".wfthumb")].map((t) => {
  const s = t.querySelector(".wsvg").getBoundingClientRect(), r = t.getBoundingClientRect();
  return { key: t.dataset.open, over: s.height > r.height + 1 || s.width > r.width + 1, h: Math.round(s.height) };
}));
/* A check that finds nothing must FAIL, not pass. Run seconds after a deploy
   it once hit an edge still serving the previous build, found zero images and
   reported "all 0 images fit". Stop there: nothing below can mean anything. */
if (!fit.length) {
  console.log("  FAIL found no workflow images at all - wrong page, stale deploy, or broken build");
  await b.close();
  process.exit(1);
}
ok(fit.every((f) => !f.over), "all " + fit.length + " images fit their frame", fit.filter((f) => f.over).map((f) => f.key).join(",") || "");
ok(Math.max(...fit.map((f) => f.h)) <= 312, "longest image capped", "tallest " + Math.max(...fit.map((f) => f.h)) + "px");

/* geometry, on the full-size drawings: no label out of its box, no two boxes
   overlapping, no forward wire climbing the page (loops are exempt - they are
   meant to go back up, round the side) */
const geo = await pg.evaluate(() => {
  const out = { spill: [], overlap: [], up: [] };
  document.querySelectorAll("template[id^='wfx-']").forEach((tpl) => {
    const host = document.createElement("div");
    host.style.cssText = "position:absolute;left:-99999px;top:0";
    host.innerHTML = tpl.innerHTML;
    document.body.appendChild(host);
    const key = tpl.id.slice(4);
    const boxes = [...host.querySelectorAll(".wn")].map((g) => g.querySelector("rect").getBBox());
    host.querySelectorAll(".wn").forEach((g) => {
      const r = g.querySelector("rect").getBBox();
      g.querySelectorAll("text").forEach((t) => {
        const b = t.getBBox();
        if (b.x < r.x + 1 || b.x + b.width > r.x + r.width - 1) out.spill.push(key + ':"' + t.textContent + '"');
      });
    });
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const A = boxes[i], B = boxes[j];
      if (A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height) out.overlap.push(key);
    }
    host.querySelectorAll(".we:not(.is-loop)").forEach((p) => {
      const L = p.getTotalLength(), s = p.getPointAtLength(0), e = p.getPointAtLength(L);
      if (e.y <= s.y) out.up.push(key);
    });
    host.remove();
  });
  return out;
});
ok(geo.spill.length === 0, "no step label runs out of its box", geo.spill.slice(0, 5).join(", "));
ok(geo.overlap.length === 0, "no two steps overlap", [...new Set(geo.overlap)].join(", "));
ok(geo.up.length === 0, "no forward wire climbs the page", [...new Set(geo.up)].join(", "));

/* 2. scroll a LONG one into view, let it draw, confirm nothing is left hidden */
/* The page decides which workflow to drive, not this file: the one with the
   most steps (the hardest to fit and the longest to animate), plus any other
   one for the backdrop test. Hard-coding GoHighLevel keys made this checker
   useless on the other five tool pages. */
const picks = await pg.evaluate(() => {
  const all = [...document.querySelectorAll(".wf")].map((c) => ({
    key: c.querySelector(".wfthumb").dataset.open,
    name: c.querySelector(".wft").textContent.trim(),
    steps: c.querySelectorAll(".wfthumb .wn").length }));
  all.sort((a, b) => b.steps - a.steps);
  return { target: all[0], other: all[all.length - 1] };
});
const target = picks.target.key;
const targetName = picks.target.name;
const otherKey = picks.other.key;
await pg.evaluate((k) => document.querySelector('[data-open="' + k + '"]').scrollIntoView({ block: "center" }), target);
await wait(250);
const armed = await pg.evaluate((k) => document.querySelector('[data-open="' + k + '"]').className, target);
ok(/go/.test(armed), "the card starts playing when it comes into view", armed);
await wait(6200);
const drawn = await pg.evaluate((k) => {
  const t = document.querySelector('[data-open="' + k + '"]');
  const hidden = [...t.querySelectorAll(".wn")].filter((g) => parseFloat(getComputedStyle(g).opacity) < 0.99).length;
  const undrawn = [...t.querySelectorAll(".we")].filter((p) => parseFloat(getComputedStyle(p).strokeDashoffset) > 0.01).length;
  return { hidden, undrawn, nodes: t.querySelectorAll(".wn").length };
}, target);
ok(drawn.hidden === 0 && drawn.undrawn === 0, "fully drawn after the draw-in", drawn.nodes + " steps, " + drawn.hidden + " hidden, " + drawn.undrawn + " wires undrawn");

/* 3. packets move AND CAN BE SEEN. The first version of this check accepted a
   packet that moved while invisible, which is no motion at all. Sample across
   a whole cycle: some sample must show a visible packet, and a visible packet
   must have moved between two samples. */
const snap = () => pg.evaluate((k) => [...document.querySelector('[data-open="' + k + '"]').querySelectorAll(".wpk")].map((c) => {
  const r = c.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), o: parseFloat(getComputedStyle(c).opacity) };
}), target);
let seenMoving = 0, maxVisible = 0, prev = await snap();
for (let i = 0; i < 26; i++) {
  await wait(380);
  const cur = await snap();
  maxVisible = Math.max(maxVisible, cur.filter((p) => p.o > 0.5).length);
  seenMoving += cur.filter((p, j) => p.o > 0.5 && prev[j].o > 0.5 && (p.x !== prev[j].x || p.y !== prev[j].y)).length;
  prev = cur;
}
ok(maxVisible > 0 && seenMoving > 0, "a VISIBLE packet travels down the workflow",
  "up to " + maxVisible + " visible at once, " + seenMoving + " visible moves seen");

/* 3b. END flashes when the packet lands - it must be dark for most of the cycle */
const pingTrace = [];
for (let i = 0; i < 30; i++) {
  await wait(330);
  pingTrace.push(await pg.evaluate((k) => {
    const e = document.querySelector('[data-open="' + k + '"] .wping.is-end');
    return e ? parseFloat(getComputedStyle(e).opacity) : -1;
  }, target));
}
const lit = pingTrace.filter((o) => o > 0.15).length;
ok(Math.max(...pingTrace) > 0.3 && lit / pingTrace.length < 0.25, "END flashes on arrival rather than glowing all cycle",
  "lit in " + lit + " of " + pingTrace.length + " samples, peak " + Math.max(...pingTrace).toFixed(2));

/* 4. the lightbox */
await pg.click('[data-open="' + target + '"]');
await wait(500);
const box = await pg.evaluate(() => {
  const d = document.getElementById("wfx");
  const s = d.querySelector(".wfxbody .wsvg");
  return { open: d.open, name: d.querySelector("#wfx-name span").textContent,
    svgW: s ? Math.round(s.getBoundingClientRect().width) : 0, natural: s ? +s.getAttribute("width") : -1,
    locked: document.documentElement.classList.contains("wfx-open") };
});
ok(box.open, "clicking the image opens the lightbox");
ok(box.name === targetName, "the lightbox carries the workflow's own name", JSON.stringify(box.name));
ok(box.svgW >= box.natural, "the lightbox shows it at least full size", box.svgW + "px against " + box.natural + "px drawn");
ok(box.locked, "the page behind stops scrolling");
await pg.screenshot({ path: "motion-lightbox.png" });

await pg.click("[data-replay]"); await wait(120);
const replay = await pg.evaluate(() => {
  const g = document.querySelector("#wfx .wfxbody .k-trigger");
  return g ? parseFloat(getComputedStyle(g).opacity) : -1;
});
ok(replay < 1, "Replay starts it again from the top", "trigger opacity " + replay.toFixed(2) + " just after replay");

await pg.keyboard.press("Escape"); await wait(250);
const afterEsc = await pg.evaluate(() => ({ open: document.getElementById("wfx").open,
  focus: document.activeElement && document.activeElement.dataset.open,
  locked: document.documentElement.classList.contains("wfx-open") }));
ok(!afterEsc.open, "Esc closes it");
ok(afterEsc.focus === target, "focus returns to the image that opened it", String(afterEsc.focus));
ok(!afterEsc.locked, "the page scrolls again");

await pg.click('[data-open="' + otherKey + '"]'); await wait(400);
await pg.mouse.click(8, 8); await wait(250);
ok(!(await pg.evaluate(() => document.getElementById("wfx").open)), "a click on the backdrop closes it");

/* EVERY workflow's lightbox must carry its name, exactly as the card does.
   Checking one name let four through: names with quote marks broke the
   attribute and arrived empty. */
const names = await pg.evaluate(async () => {
  const d = document.getElementById("wfx"), out = [];
  for (const t of document.querySelectorAll(".wfthumb")) {
    const card = t.closest(".wf").querySelector(".wft").textContent.trim();
    t.click();
    await new Promise((r) => setTimeout(r, 60));
    out.push({ card, box: d.querySelector("#wfx-name span").textContent.trim(),
      label: t.getAttribute("aria-label") });
    d.close();
    await new Promise((r) => setTimeout(r, 30));
  }
  return out;
});
const wrong = names.filter((n) => n.box !== n.card || n.label.indexOf(n.card) < 0);
ok(wrong.length === 0, "all " + names.length + " lightboxes show the workflow's own name",
  wrong.map((n) => JSON.stringify(n.card) + " -> " + JSON.stringify(n.box)).join("; "));

ok(errs.length === 0, "no script errors", errs[0] || "");
await pg.evaluate(() => document.querySelector(".wf").scrollIntoView({ block: "center" }));
await wait(3200);
await pg.screenshot({ path: "motion-card.png" });
await pg.close();

/* 5. reduced motion: all there, nothing moving */
const rm = await b.newPage();
await rm.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await rm.setViewport({ width: 1280, height: 900 });
await rm.goto(U, { waitUntil: "networkidle0" });
const still = await rm.evaluate(() => ({
  armed: document.querySelectorAll(".armed").length,
  hidden: [...document.querySelectorAll(".wn")].filter((g) => parseFloat(getComputedStyle(g).opacity) < 0.99).length,
  packets: [...document.querySelectorAll(".wpk")].filter((c) => getComputedStyle(c).display !== "none").length
}));
ok(still.armed === 0 && still.hidden === 0 && still.packets === 0, "reduced motion: everything visible, nothing moving", JSON.stringify(still));
await rm.close();

/* 6. phone */
const ph = await b.newPage();
await ph.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await ph.goto(U, { waitUntil: "networkidle0" });
const phone = await ph.evaluate(() => ({ sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth }));
ok(!phone.sideways, "phone: no sideways scroll");
await ph.click('[data-open="' + target + '"]'); await wait(600);
const pbox = await ph.evaluate(() => {
  const d = document.getElementById("wfx"), r = d.getBoundingClientRect();
  return { open: d.open, w: Math.round(r.width), h: Math.round(r.height) };
});
ok(pbox.open && pbox.w >= 388, "phone: the lightbox goes full screen", pbox.w + "x" + pbox.h);
await ph.screenshot({ path: "motion-phone.png" });
await ph.close();
await b.close();

console.log(fails ? "\n" + fails + " FAILED" : "\nall checks passed");
process.exit(fails ? 1 : 0);
