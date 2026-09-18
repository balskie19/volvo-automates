// A map you walk has failure modes a playing canvas does not, and all of them
// are silent:
//   * a step whose panel says nothing, or writes something the record panel
//     does not list, so the highlight never fires;
//   * an edge that lights from a step it does not leave;
//   * a step unreachable from the trigger, which nobody would ever tap into;
//   * the usual geometry - overlaps, backwards wires, labels out of their box.
// So this drives the real page rather than reading the source.
const P = (await import("file:///C:/Claude Projects Database/Proposed Projects/volvo-portfolio/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js")).default;
const b = await P.launch({ executablePath: "C:/Users/Volvo/.cache/puppeteer/chrome/win64-152.0.7977.42/chrome-win64/chrome.exe", headless: "new" });
const U = "file:///C:/Claude Projects Database/Proposed Projects/volvo-automates/explainers/ghl.html";

const pg = await b.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
await pg.setViewport({ width: 1180, height: 1000, deviceScaleFactor: 1.3 });
await pg.goto(U, { waitUntil: "networkidle0" });

const r = await pg.evaluate(() => {
  const out = { maps: 0, steps: 0, overlaps: [], backwards: [], spill: [],
    noSays: [], ghostWrites: [], unreachable: [], deadEdges: [] };
  document.querySelectorAll(".walk").forEach((box, mi) => {
    out.maps++;
    const cfg = JSON.parse(box.getAttribute("data-walk"));
    const svg = box.querySelector("svg");
    const listed = [...box.querySelectorAll(".wf")].map((f) => f.getAttribute("data-f"));
    const boxes = [...svg.querySelectorAll(".wn")].map((g) => ({ k: g.getAttribute("data-k"), r: g.querySelector("rect").getBBox() }));
    out.steps += boxes.length;

    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const A = boxes[i].r, B = boxes[j].r;
      if (A.x < B.x + B.width && B.x < A.x + A.width && A.y < B.y + B.height && B.y < A.y + A.height)
        out.overlaps.push(mi + ":" + boxes[i].k + "/" + boxes[j].k);
    }
    for (const g of svg.querySelectorAll(".wn")) {
      const rr = g.querySelector("rect").getBBox();
      for (const t of g.querySelectorAll("text")) {
        const tb = t.getBBox();
        if (tb.x < rr.x + 1 || tb.x + tb.width > rr.x + rr.width - 1 || tb.y + tb.height > rr.y + rr.height)
          out.spill.push(mi + ':"' + t.textContent + '"');
      }
    }
    const byK = Object.fromEntries(boxes.map((x) => [x.k, x.r]));
    const edges = [...svg.querySelectorAll(".we")].map((p) => [p.getAttribute("data-a"), p.getAttribute("data-b")]);
    for (const [a, z] of edges) {
      if (!byK[a] || !byK[z]) { out.deadEdges.push(mi + ":" + a + "->" + z); continue; }
      if (byK[z].y <= byK[a].y) out.backwards.push(mi + ":" + a + "->" + z);
    }
    // every step must be reachable from the first one
    const first = Object.keys(cfg.nodes)[0];
    const seen = new Set([first]);
    for (let pass = 0; pass < edges.length + 1; pass++)
      for (const [a, z] of edges) if (seen.has(a)) seen.add(z);
    Object.keys(cfg.nodes).forEach((k) => { if (!seen.has(k)) out.unreachable.push(mi + ":" + k); });

    // every step must say something, and everything it claims to write must be
    // a chip that exists, or the highlight silently does nothing
    Object.entries(cfg.nodes).forEach(([k, n]) => {
      if (!n.says || n.says.length < 25) out.noSays.push(mi + ":" + k);
      (n.writes || []).forEach((w) => { if (listed.indexOf(w) < 0) out.ghostWrites.push(mi + ":" + k + " -> " + w); });
    });
  });
  return out;
});

console.log("maps / steps    : " + r.maps + " / " + r.steps);
for (const [label, list] of [["cards overlapping", r.overlaps], ["wires running back", r.backwards],
  ["labels spilling", r.spill], ["edges to nowhere", r.deadEdges],
  ["steps you cannot reach", r.unreachable], ["steps that say nothing", r.noSays],
  ["writes with no chip", r.ghostWrites]])
  console.log("  " + (label + "                      ").slice(0, 24) + (list.length ? list.slice(0, 6).join(", ") : "none"));

/* does tapping actually change the three things it should? */
const tap = await pg.evaluate(async () => {
  const box = document.querySelectorAll(".walk")[3];          // the booked-call map
  const steps = [...box.querySelectorAll(".wn")];
  const read = () => ({
    title: box.querySelector(".wtitle").textContent.trim(),
    lit: box.querySelectorAll(".we.lit").length,
    hits: [...box.querySelectorAll(".wf.hit")].map((f) => f.textContent.trim())
  });
  const before = read();
  steps[3].dispatchEvent(new MouseEvent("click", { bubbles: true }));   // "take them out of the chase"
  await new Promise((r) => setTimeout(r, 120));
  const after = read();
  return { before, after, onNow: box.querySelectorAll(".wn.on").length };
});
console.log("");
console.log("before tap      : " + JSON.stringify(tap.before));
console.log("after tap       : " + JSON.stringify(tap.after));
console.log("steps lit at once: " + tap.onNow + " (must be 1)");
console.log("page errors     : " + (errs.length ? errs[0] : "none"));

const h = await pg.evaluate(() => Math.round(document.documentElement.scrollHeight));
console.log("page height     : " + h + "px");
await pg.screenshot({ path: "ghl-walk.png", clip: { x: 0, y: 0, width: 1180, height: 1400 } });
await pg.close();

const ph = await b.newPage();
await ph.setViewport({ width: 390, height: 900, deviceScaleFactor: 2 });
await ph.goto(U, { waitUntil: "networkidle0" });
const phone = await ph.evaluate(() => ({
  sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  w: document.documentElement.scrollWidth + "/" + document.documentElement.clientWidth,
  cols: getComputedStyle(document.querySelector(".walk")).gridTemplateColumns.split(" ").length,
  smallest: Math.min(...[...document.querySelectorAll(".wnt,.wf,.wsays")].map((t) => t.getBoundingClientRect().height)).toFixed(1)
}));
console.log("phone           : sideways " + phone.sideways + " (" + phone.w + "), " + phone.cols + " column, smallest box " + phone.smallest + "px");
await ph.screenshot({ path: "ghl-walk-phone.png", clip: { x: 0, y: 0, width: 390, height: 900 } });
await ph.close();
await b.close();
