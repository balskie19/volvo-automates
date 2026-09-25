// The custom cursor, checked by BEHAVIOUR in a real browser. A cursor can look
// fine in a screenshot and still be broken in the ways that matter: stuck in a
// corner, hiding behind the lightbox, swallowing clicks, or hijacking the
// pointer on a phone. So:
//   * on a mouse: his character appears, the native cursor is hidden, a precise dot
//     sits exactly on the pointer and the character catches up with it;
//   * over a workflow image it says "Enlarge", over a Calendly link "Book a
//     call"; pressing squashes it; releasing throws a ring;
//   * clicks still land (the cursor never intercepts them);
//   * inside an open lightbox the cursor is still on top;
//   * on a touch screen, or with reduced motion, it does not exist at all.
const P = (await import("file:///C:/Claude Projects Database/Proposed Projects/volvo-portfolio/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js")).default;
const b = await P.launch({ executablePath: "C:/Users/Volvo/.cache/puppeteer/chrome/win64-152.0.7977.42/chrome-win64/chrome.exe", headless: "new" });
const BASE = process.argv[2] || "file:///C:/Claude Projects Database/Proposed Projects/volvo-automates/";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (c, l, d = "") => { if (!c) fails++; console.log((c ? "  ok   " : "  FAIL ") + l + (d ? "  " + d : "")); };
const center = (pg, sel) => pg.evaluate((s) => {
  const e = document.querySelector(s); if (!e) return null;
  e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
}, sel);
const state = (pg) => pg.evaluate(() => {
  const el = document.querySelector(".vc"), dot = document.querySelector(".vc-dot");
  if (!el) return null;
  const r = el.getBoundingClientRect(), d = dot.getBoundingClientRect();
  return { cls: el.className, cx: r.left + r.width / 2, cy: r.top + r.height / 2,
    dx: d.left + d.width / 2, dy: d.top + d.height / 2, op: +getComputedStyle(el).opacity,
    tag: el.querySelector(".vc-tag").textContent, parent: el.parentNode.tagName,
    rings: document.querySelectorAll(".vc-ring").length,
    native: getComputedStyle(document.querySelector("a") || document.body).cursor };
});

for (const [label, path, hot, hotSay] of [
  ["hub", "index.html", 'a[href*="calendly"]', "Book a call"],
  ["ghl page", "explainers/ghl.html", ".wfthumb", "Enlarge"]]) {
  console.log("\n== " + label);
  const pg = await b.newPage();
  const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
  await pg.setViewport({ width: 1280, height: 900 });
  await pg.goto(BASE + path, { waitUntil: "networkidle0" });
  await pg.evaluate(() => { try { sessionStorage.setItem("vo-intro", "1"); } catch (e) {} });
  await pg.reload({ waitUntil: "networkidle0" });

  const s0 = await state(pg);
  ok(!!s0, "his character cursor exists on a mouse");
  if (!s0) { await pg.close(); continue; }
  ok(s0.native === "none", "the native pointer is hidden", "cursor: " + s0.native);
  const img = await pg.evaluate(() => getComputedStyle(document.querySelector(".vc-face")).backgroundImage);
  const loaded = await pg.evaluate(async (u) => {
    const m = u.match(/url\("?(.*?)"?\)/); if (!m) return false;
    return await new Promise((r) => { const i = new Image(); i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); i.src = m[1]; });
  }, img);
  ok(loaded, "the character inside it actually loads", img.slice(0, 70));

  await pg.mouse.move(300, 300); await pg.mouse.move(520, 410, { steps: 12 }); await wait(700);
  const s1 = await state(pg);
  ok(Math.abs(s1.dx - 520) < 1.5 && Math.abs(s1.dy - 410) < 1.5, "the aiming dot sits exactly on the pointer", s1.dx.toFixed(1) + "," + s1.dy.toFixed(1));
  /* it settles BESIDE the pointer (16px margin + half its 46px width), so it
     never covers what is being clicked */
  const ex = 520 + 16 + 23, ey = 410 + 16 + 23;
  ok(Math.hypot(s1.cx - ex, s1.cy - ey) < 3, "the character catches up and settles just beside the pointer", Math.hypot(s1.cx - ex, s1.cy - ey).toFixed(1) + "px off its resting spot");
  const covers = await pg.evaluate(() => {
    const r = document.querySelector(".vc").getBoundingClientRect(), d = document.querySelector(".vc-dot").getBoundingClientRect();
    const px = d.left + d.width / 2, py = d.top + d.height / 2;
    return px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
  });
  ok(!covers, "the character does not sit on top of the point being clicked");
  ok(s1.op > 0.9, "it is visible once the mouse moves", "opacity " + s1.op);

  const h = await center(pg, hot); await wait(300);
  await pg.mouse.move(h.x, h.y, { steps: 8 }); await wait(450);
  const s2 = await state(pg);
  ok(/is-hot/.test(s2.cls) && s2.tag === hotSay, "over a " + hot + " it grows and says \"" + hotSay + "\"", "said \"" + s2.tag + "\"");

  await pg.mouse.move(640, 60); await wait(300);
  await pg.mouse.down(); await wait(60);
  const s3 = await state(pg);
  ok(/is-down/.test(s3.cls), "pressing squashes it");
  await pg.mouse.up(); await wait(40);
  const s4 = await state(pg);
  ok(s4.rings >= 1 && !/is-down/.test(s4.cls), "releasing throws a ring from the click point");
  await wait(700);
  ok((await state(pg)).rings === 0, "the ring cleans itself up");

  /* clicks must still land: the cursor never gets in the way */
  const hit = await pg.evaluate((pt) => { const e = document.elementFromPoint(pt.x, pt.y); return e && !e.closest(".vc,.vc-dot,.vc-ring"); }, h);
  ok(hit, "the element under the pointer is the page, never the cursor");

  if (label === "ghl page") {
    await pg.mouse.move(h.x, h.y); await pg.mouse.click(h.x, h.y); await wait(700);
    const s5 = await state(pg);
    ok(s5.parent === "DIALOG", "inside the open lightbox, the cursor moves into it (top layer)", "parent " + s5.parent);
    await pg.mouse.move(900, 500, { steps: 6 }); await wait(500);
    const topmost = await pg.evaluate(() => {
      const dlg = document.getElementById("wfx"); const el = document.querySelector(".vc");
      return dlg.open && dlg.contains(el) && getComputedStyle(el).opacity > 0.9;
    });
    ok(topmost, "and stays visible above the enlarged workflow");
    await pg.keyboard.press("Escape"); await wait(300);
    ok((await state(pg)).parent === "BODY", "when the lightbox closes it comes back out");
  } else {
    /* the hub's own navigation still works with the cursor on */
    const nav = await center(pg, '[data-room="systems"]');
    if (nav) { await pg.mouse.click(nav.x, nav.y); await wait(500); }
    ok(await pg.evaluate(() => document.getElementById("room-systems").classList.contains("on")), "clicking the nav still opens a room");
  }
  await pg.screenshot({ path: "cursor-" + label.replace(/ /g, "-") + ".png" });
  ok(errs.length === 0, "no script errors", errs[0] || "");
  await pg.close();
}

/* touch and reduced motion: it must not exist */
/* a phone is emulated as a phone (touch + mobile viewport), which is what
   flips hover:none / pointer:coarse - puppeteer cannot fake those media
   features on their own */
for (const [label, setup] of [
  ["touch screen", (pg) => pg.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })],
  ["reduced motion", (pg) => pg.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }])]]) {
  const pg = await b.newPage();
  await setup(pg);
  await pg.goto(BASE + "explainers/ghl.html", { waitUntil: "networkidle0" });
  const r = await pg.evaluate(() => ({ el: !!document.querySelector(".vc"), on: document.documentElement.classList.contains("vc-on") }));
  ok(!r.el && !r.on, label + ": no custom cursor, normal pointer kept", JSON.stringify(r));
  await pg.close();
}
await b.close();
console.log(fails ? "\n" + fails + " FAILED" : "\nall cursor checks passed");
process.exit(fails ? 1 : 0);
