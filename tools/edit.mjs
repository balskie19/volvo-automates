// Edit the deck and the CV in a browser, without touching code.
//
//   node tools/edit.mjs          then open http://localhost:4000
//
// Click "Edit", click any text, type over it, click "Save". The file on disk is
// rewritten. Then `node tools/deploy.mjs` puts it live.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS IS NOT JUST "SAVE THE PAGE"
//
// The deck does not exist in index.html. All fifteen slides are built at runtime
// from the SLIDES array, so the DOM you edit was never in the file, and writing
// the DOM back would bake generated markup into the source and destroy the deck.
// Edits therefore travel as {scope, before, after} and are applied to the SOURCE
// STRING for that slide.
//
// The second problem is entities. The source says `Volvo Ebal &middot; open` and
// the browser shows `Volvo Ebal · open`, so searching the source for what you
// actually saw finds nothing. `decodeWithMap()` decodes the source while
// recording, for every decoded character, the offset it came from - so a match
// found in decoded text maps back to exact byte offsets in the real file.
//
// Every write is guarded: a timestamped backup first, then the edit, then a
// structural check (slide count, guide-line count, the counts still equal each
// other) and an automatic rollback if anything moved.
// ─────────────────────────────────────────────────────────────────────────────
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join, resolve, extname, normalize } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const BACKUPS = join(ROOT, ".edit-backups");
const PORT = Number(process.env.EDIT_PORT || 4000);
const EDITABLE = new Set(["index.html", "cv/index.html"]);

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".mp4": "video/mp4",
  ".json": "application/json"
};

/* ── entity decoding that remembers where every character came from ───────── */
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  middot: "·", rsaquo: "›", lsaquo: "‹", hellip: "…",
  mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘",
  ldquo: "“", rdquo: "”", deg: "°", times: "×" };

function flatten(src) {
  let text = "";
  const mapS = [];                // mapS[i] = where emitted char i STARTS in src
  const mapE = [];                // mapE[i] = just past where it ENDS in src
  let tagsInSpan = [];            // offsets where a tag was skipped, for reporting
  for (let i = 0; i < src.length;) {
    const c = src[i];

    // 1 · an HTML tag contributes nothing to what the reader sees
    if (c === "<") {
      const close = src.indexOf(">", i);
      if (close > i && close - i < 200 && /^<[a-zA-Z/!]/.test(src.slice(i, i + 2))) {
        tagsInSpan.push(i);
        i = close + 1;
        continue;
      }
    }

    // 2 · the glue between two concatenated JS fragments: ' + <ws> '
    if (c === "'") {
      const m = /^'[ \t]*\+[ \t\r\n]*'/.exec(src.slice(i, i + 80));
      if (m) { i += m[0].length; continue; }
    }

    // 3 · an entity is one character to the reader
    if (c === "&") {
      const semi = src.indexOf(";", i);
      if (semi > i && semi - i <= 10) {
        const body = src.slice(i + 1, semi);
        let ch = null;
        if (body[0] === "#") {
          const code = body[1] === "x" || body[1] === "X"
            ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
          if (Number.isFinite(code)) ch = String.fromCodePoint(code);
        } else if (NAMED[body] !== undefined) {
          ch = NAMED[body];
        }
        if (ch !== null) {
          for (const x of ch) { text += x; mapS.push(i); mapE.push(semi + 1); }
          i = semi + 1;
          continue;
        }
      }
    }

    text += c; mapS.push(i); mapE.push(i + 1); i++;
  }
  return { text, mapS, mapE, tags: tagsInSpan };
}


// Two different things can be broken by text a person types, and BOTH matter.
//   HTML:        & < >  would change the markup.
//   JAVASCRIPT:  slide bodies are SINGLE-QUOTED JS strings, so an apostrophe
//                ends the string and a backslash starts an escape. Typing
//                "Volvo's" would not be a typo, it would stop the whole
//                deck parsing and every slide would render empty.
// Each becomes an HTML entity: renders as the character typed, inert in both.
const encode = s => String(s)
  .replace(/\\/g, "&#92;")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;")
  .replace(/\s+/g, " ")
  .trim();

/* ── find the source region an edit is allowed to touch ───────────────────── */
function slideRegion(src, index) {
  // every slide begins `    { g:"g-...", menu:"..."` at four spaces of indent
  const starts = [];
  const re = /\n {4}\{ g:"g-[a-z]+", menu:"/g;
  let m;
  while ((m = re.exec(src))) starts.push(m.index + 1);
  if (index < 0 || index >= starts.length)
    throw new Error("slide " + (index + 1) + " is outside the " + starts.length + " in the file");
  const from = starts[index];
  const to = index + 1 < starts.length ? starts[index + 1] : src.indexOf("\n  ];", from);
  if (to < 0) throw new Error("could not find the end of slide " + (index + 1));
  return [from, to];
}

/* ── apply one edit, or refuse for a reason the user can act on ───────────── */
//
// TWO KINDS, because two different things are being matched.
//   text : match what a READER SEES. Tags and JS string glue are skipped, so a
//          sentence split across fragments and wrapped in <b> still matches.
//   raw  : match the SOURCE LITERALLY. Used for anything living inside a tag or
//          a stylesheet - an image src, a link href, a colour token - which the
//          text matcher cannot see precisely because it skips tags.
// Both refuse on not-found and on more than one match, so an ambiguous edit is
// never guessed at.
function applyRaw(src, edit) {
  const [from, to] = edit.scope.startsWith("slide:")
    ? slideRegion(src, Number(edit.scope.slice(6)) - 1)
    : [0, src.length];
  const region = src.slice(from, to);
  const hit = region.indexOf(edit.before);
  if (hit < 0) throw new Error('could not find ' + JSON.stringify(edit.before.slice(0, 60)));
  if (region.indexOf(edit.before, hit + 1) >= 0)
    throw new Error(JSON.stringify(edit.before.slice(0, 40)) +
      ' appears more than once, so the change is ambiguous');
  return {
    src: src.slice(0, from + hit) + edit.after + src.slice(from + hit + edit.before.length),
    lost: 0
  };
}

function applyEdit(src, edit) {
  if (edit.kind === "raw") return applyRaw(src, edit);
  const [from, to] = edit.scope.startsWith("slide:")
    ? slideRegion(src, Number(edit.scope.slice(6)) - 1)
    : [0, src.length];
  const region = src.slice(from, to);
  const { text, mapS, mapE, tags } = flatten(region);

  const before = edit.before.replace(/\s+/g, " ").trim();
  const flat = text.replace(/\s+/g, " ");
  // build an index from the whitespace-flattened text back into the decoded text
  const idx = [];
  { let run = false;
    for (let i = 0; i < text.length; i++) {
      if (/\s/.test(text[i])) { if (run) continue; run = true; idx.push(i); }
      else { run = false; idx.push(i); }
    } }

  const hit = flat.indexOf(before);
  if (hit < 0) throw new Error('could not find "' + before.slice(0, 48) + '" to replace');
  if (flat.indexOf(before, hit + 1) >= 0)
    throw new Error('"' + before.slice(0, 48) + '" appears more than once, so the edit is ambiguous');

  const startDec = idx[hit];
  const lastDec = idx[hit + before.length - 1];
  let start = mapS[startDec];
  let end = mapE[lastDec];        // just past the LAST MATCHED character
  // never delete half of a tag pair
  [start, end] = balanceSpan(region, start, end);
  const lost = tags.filter(t => t >= start && t < end).length;
  return {
    src: src.slice(0, from + start) + encode(edit.after) + src.slice(from + end),
    lost
  };
}

// Widen a span until the tags inside it balance, so a replacement can never
// delete half of a tag pair.
const VOID_TAGS = new Set(["img","br","hr","input","meta","link","source","use","path",
  "circle","rect","ellipse","line","polygon","polyline","stop","area","col","embed","track","wbr"]);

function balanceSpan(region, start, end) {
  const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)[^>]*?(\/?)>/g;
  const open = [];
  const unmatchedClose = [];
  TAG.lastIndex = start;
  let m;
  while ((m = TAG.exec(region)) !== null && m.index < end) {
    const name = m[2].toLowerCase();
    if (m[1] === "/") {
      const i = open.lastIndexOf(name);
      if (i >= 0) open.splice(i, 1); else unmatchedClose.push(name);
    } else if (m[3] !== "/" && !VOID_TAGS.has(name)) {
      open.push(name);
    }
  }
  for (const name of unmatchedClose) {
    const i = region.lastIndexOf("<" + name, start);
    if (i >= 0 && i < start) start = i;
  }
  for (const name of open) {
    const i = region.indexOf("</" + name, end);
    if (i >= 0) {
      const close = region.indexOf(">", i);
      if (close >= 0) end = close + 1;
    }
  }
  return [start, end];
}

/* ── structure must survive every save ────────────────────────────────────── */
function structure(src) {
  return {
    slides: (src.match(/menu:"/g) || []).length,
    lines: (src.match(/^ {4}\['/gm) || []).length
  };
}

function save(file, edits) {
  const path = join(ROOT, file);
  const original = readFileSync(path, "utf8");
  const wasDeck = file === "index.html";
  const beforeStruct = structure(original);

  let src = original;
  const applied = [];
  let lost = 0;
  for (const e of edits) {
    const r = applyEdit(src, e);
    src = r.src;
    lost += r.lost;
    applied.push(e.before.slice(0, 40));
  }

  if (wasDeck) {
    const after = structure(src);
    if (after.slides !== beforeStruct.slides || after.lines !== beforeStruct.lines)
      throw new Error("the edit changed the deck's structure (" +
        beforeStruct.slides + "/" + beforeStruct.lines + " -> " +
        after.slides + "/" + after.lines + "), refusing to write");
    if (after.slides !== after.lines)
      throw new Error("slides and guide lines are out of step, refusing to write");
  }

  mkdirSync(BACKUPS, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  copyFileSync(path, join(BACKUPS, file.replace(/[\\/]/g, "_") + "." + stamp + ".bak"));
  writeFileSync(path, src);
  return { applied: applied.length, lost };
}

/* ── the editor, injected into the page as it is served ───────────────────── */
const EDITOR = `
<style id="ed-style">
#ed-bar{position:fixed;left:0;right:0;bottom:0;z-index:99999;display:flex;gap:9px;
  align-items:center;padding:9px 13px;background:#0B0E1C;color:#F2F1EA;
  font:12.5px/1.4 ui-monospace,monospace;letter-spacing:.03em;flex-wrap:wrap}
#ed-bar button{font:inherit;cursor:pointer;border:2px solid #F2F1EA;background:transparent;
  color:#F2F1EA;border-radius:99px;padding:6px 14px}
#ed-bar button.on{background:#F5D547;color:#0B0E1C;border-color:#F5D547}
#ed-bar button:disabled{opacity:.4;cursor:not-allowed}
#ed-msg{margin-left:auto;opacity:.85;max-width:56ch;text-align:right}
body.ed-on [data-ed]{outline:2px dashed rgba(245,213,71,.85);outline-offset:3px;cursor:text}
body.ed-on [data-ed]:focus{outline:2px solid #F5D547;background:rgba(245,213,71,.14)}
body.ed-on img{outline:2px dashed rgba(87,199,218,.9);outline-offset:3px;cursor:copy}
body.ed-on a{box-shadow:inset 0 -2px 0 0 rgba(255,92,26,.9)}
body.ed-on .bar,body.ed-on .hint{opacity:.2}
#ed-pal{position:fixed;right:13px;bottom:56px;z-index:99999;background:#0B0E1C;color:#F2F1EA;
  border:2px solid #F2F1EA;border-radius:12px;padding:12px;display:none;
  font:12px/1.5 ui-monospace,monospace;max-height:62vh;overflow:auto;min-width:230px}
#ed-pal.on{display:block}
#ed-pal h4{margin:0 0 9px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.7}
#ed-pal label{display:flex;align-items:center;gap:9px;margin-bottom:7px;justify-content:space-between}
#ed-pal input{width:42px;height:26px;border:0;background:transparent;cursor:pointer}
</style>
<div id="ed-bar">
  <button id="ed-toggle" type="button">Edit</button>
  <button id="ed-colour" type="button">Colours</button>
  <button id="ed-save" type="button" disabled>Save 0 changes</button>
  <button id="ed-revert" type="button" disabled>Undo all</button>
  <span id="ed-msg">Off. Nothing on this page is editable yet.</span>
</div>
<div id="ed-pal"><h4>Palette</h4><div id="ed-pal-list"></div></div>
<input id="ed-file" type="file" accept="image/*" style="display:none">
<script>
(function(){
  var IS_DECK = !!document.getElementById("deck");
  var FILE = IS_DECK ? "index.html" : "cv/index.html";
  var msg = document.getElementById("ed-msg");
  var bToggle = document.getElementById("ed-toggle");
  var bSave = document.getElementById("ed-save");
  var bRevert = document.getElementById("ed-revert");
  var bColour = document.getElementById("ed-colour");
  var pal = document.getElementById("ed-pal");
  var palList = document.getElementById("ed-pal-list");
  var filePick = document.getElementById("ed-file");
  var on = false;
  var texts = new Map();   // element -> {scope, before}
  var raws = [];           // queued non-text changes
  var pendingImg = null;

  function say(t){ msg.textContent = t; }
  function norm(s){ return String(s).replace(/\\s+/g, " ").trim(); }
  function scopeNow(){
    if (!IS_DECK) return "file";
    var sl = document.querySelector(".slide.on");
    return sl ? "slide:" + sl.id.replace("slide-", "") : "file";
  }
  function changed(){
    var n = raws.length;
    texts.forEach(function(rec, el){ if (norm(el.textContent) !== rec.before) n++; });
    bSave.textContent = "Save " + n + " change" + (n === 1 ? "" : "s");
    bSave.disabled = n === 0;
    bRevert.disabled = n === 0;
    return n;
  }

  function editable(root){
    var out = [];
    root.querySelectorAll("h1,h2,h3,h4,p,li,dd,dt,cite,blockquote,span.nm,span.rs,b,small")
      .forEach(function(el){
        if (el.closest("#ed-bar")) return;
        if (!el.textContent.trim()) return;
        if (el.querySelector("h1,h2,h3,h4,p,li,dd,dt,blockquote,div,article,section")) return;
        out.push(el);
      });
    // OUTERMOST ONLY: a <b> inside an armed <p> is part of that paragraph, and
    // arming both sends two overlapping edits - the second then looks for text
    // the first already replaced and the whole save is refused.
    return out.filter(function(el){
      return !out.some(function(o){ return o !== el && o.contains(el); });
    });
  }

  function arm(){
    document.querySelectorAll(".slide.on [data-rv], .slide.on h1, .slide.on h2")
      .forEach(function(h){ if (h.querySelector(".rv")) h.textContent = norm(h.textContent); });
    var sc = scopeNow();
    var root = IS_DECK ? document.querySelector(".slide.on .slide-in") : document.body;
    if (!root) return;
    editable(root).forEach(function(el){
      if (texts.has(el)) return;
      el.setAttribute("data-ed", "1");
      el.setAttribute("contenteditable", "plaintext-only");
      texts.set(el, { scope: sc, before: norm(el.textContent) });
      el.addEventListener("input", changed);
    });
    say("Editing " + (IS_DECK ? "slide " + sc.slice(6) : "this page") +
      ". Text: click it. Picture: click it. Link: alt-click it.");
  }

  function disarm(){
    texts.forEach(function(rec, el){
      el.removeAttribute("data-ed"); el.removeAttribute("contenteditable");
    });
  }

  /* ── pictures ─────────────────────────────────────────────────────────── */
  document.addEventListener("click", function(e){
    if (!on) return;
    var img = e.target.closest ? e.target.closest("img") : null;
    if (!img || img.closest("#ed-bar")) return;
    e.preventDefault(); e.stopPropagation();
    pendingImg = img;
    filePick.value = "";
    filePick.click();
  }, true);

  filePick.addEventListener("change", function(){
    var f = filePick.files[0];
    if (!f || !pendingImg) return;
    var img = pendingImg;
    var oldSrc = img.getAttribute("src");
    var dir = (oldSrc.indexOf("/") > 0) ? oldSrc.split("/")[0] : "img";
    say("Uploading " + f.name + "...");
    var reader = new FileReader();
    reader.onload = function(){
      fetch("/api/upload", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: f.name, dir: dir, data: reader.result })
      }).then(function(r){ return r.json(); }).then(function(r){
        if (!r.ok) { say("Upload refused: " + r.error); return; }
        raws.push({ kind: "raw", scope: scopeNow(), before: oldSrc, after: r.path });
        img.setAttribute("src", r.path + "?t=" + Date.now());
        changed();
        say("Picture swapped. Not saved yet - press Save.");
      });
    };
    reader.readAsDataURL(f);
  });

  /* ── links ────────────────────────────────────────────────────────────── */
  document.addEventListener("click", function(e){
    if (!on || !e.altKey) return;
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || a.closest("#ed-bar")) return;
    e.preventDefault(); e.stopPropagation();
    var oldHref = a.getAttribute("href");
    var next = window.prompt("Where should this link go?", oldHref);
    if (next === null || next === oldHref) return;
    raws.push({ kind: "raw", scope: scopeNow(), before: oldHref, after: next });
    a.setAttribute("href", next);
    changed();
    say("Link changed. Not saved yet - press Save.");
  }, true);

  /* ── colour ───────────────────────────────────────────────────────────── */
  function buildPalette(){
    palList.innerHTML = "";
    var css = "";
    [].slice.call(document.querySelectorAll("style")).forEach(function(st){
      if (!css && st.textContent.indexOf(":root{") >= 0) css = st.textContent;
    });
    var block = css.slice(css.indexOf(":root{"));
    block = block.slice(0, block.indexOf("}"));
    var found = block.match(/--[a-z0-9-]+:\\s*#[0-9A-Fa-f]{3,8}/g) || [];
    if (!found.length) { palList.textContent = "No colour tokens on this page."; return; }
    found.forEach(function(decl){
      var name = decl.split(":")[0].trim();
      var hex = decl.split(":")[1].trim();
      var row = document.createElement("label");
      var span = document.createElement("span");
      span.textContent = name;
      var input = document.createElement("input");
      input.type = "color"; input.value = hex.slice(0, 7);
      input.addEventListener("change", function(){
        raws.push({ kind: "raw", scope: "file", before: decl, after: name + ":" + input.value });
        document.documentElement.style.setProperty(name, input.value);
        changed();
        say("Colour " + name + " changed. Not saved yet - press Save.");
      });
      row.appendChild(span); row.appendChild(input); palList.appendChild(row);
    });
  }
  bColour.addEventListener("click", function(){
    pal.classList.toggle("on");
    bColour.classList.toggle("on", pal.classList.contains("on"));
    if (pal.classList.contains("on")) buildPalette();
  });

  /* ── toolbar ──────────────────────────────────────────────────────────── */
  bToggle.addEventListener("click", function(){
    on = !on;
    document.body.classList.toggle("ed-on", on);
    bToggle.classList.toggle("on", on);
    bToggle.textContent = on ? "Editing" : "Edit";
    if (on) arm(); else { disarm(); say("Off."); }
    changed();
  });

  if (IS_DECK) {
    var seen = document.querySelector(".slide.on");
    setInterval(function(){
      if (!on) return;
      var now = document.querySelector(".slide.on");
      if (now && now !== seen) { seen = now; arm(); }
    }, 400);
  }

  bRevert.addEventListener("click", function(){
    texts.forEach(function(rec, el){ el.textContent = rec.before; });
    raws = [];
    changed();
    say("Reverted on screen. Nothing was written to disk. Reload to undo a picture.");
  });

  bSave.addEventListener("click", function(){
    var payload = raws.slice();
    texts.forEach(function(rec, el){
      var after = norm(el.textContent);
      if (after !== rec.before) payload.push({ scope: rec.scope, before: rec.before, after: after });
    });
    if (!payload.length) return;
    bSave.disabled = true; say("Saving " + payload.length + "...");
    fetch("/api/save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: FILE, edits: payload })
    }).then(function(r){ return r.json(); }).then(function(r){
      if (!r.ok) { say("NOT saved, nothing was written: " + r.error); bSave.disabled = false; return; }
      texts.forEach(function(rec, el){ rec.before = norm(el.textContent); });
      raws = [];
      changed();
      say("Saved " + r.applied + " to disk" +
        (r.lost ? ", " + r.lost + " inline bit(s) flattened" : "") +
        ". Run: node tools/deploy.mjs");
    }).catch(function(e){ say("NOT saved: " + e.message); bSave.disabled = false; });
  });
})();
</script>
`;

/* ── server ───────────────────────────────────────────────────────────────── */
createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/save") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      res.setHeader("Content-Type", "application/json");
      try {
        const { file, edits } = JSON.parse(body);
        if (!EDITABLE.has(file)) throw new Error("that file is not editable here");
        const r = save(file, edits);
        console.log("saved " + r.applied + " edit(s) to " + file +
          (r.lost ? "  (" + r.lost + " inline tag(s) flattened)" : ""));
        res.end(JSON.stringify({ ok: true, applied: r.applied, lost: r.lost }));
      } catch (err) {
        console.log("REFUSED: " + err.message);
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/upload") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      res.setHeader("Content-Type", "application/json");
      try {
        const { name, dir, data } = JSON.parse(body);
        // the file lands in a folder the project already serves, never anywhere
        // else on disk, and never above the project root
        const folder = (dir || "shots").replace(/[^a-zA-Z0-9_-]/g, "");
        const safe = name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^[.]+/, "");
        if (!safe) throw new Error("that file name cannot be used");
        const target = join(ROOT, folder, safe);
        if (!target.startsWith(join(ROOT, folder))) throw new Error("bad path");
        mkdirSync(join(ROOT, folder), { recursive: true });
        writeFileSync(target, Buffer.from(String(data).split(",").pop(), "base64"));
        console.log("uploaded " + folder + "/" + safe);
        res.end(JSON.stringify({ ok: true, path: folder + "/" + safe }));
      } catch (err) {
        console.log("UPLOAD REFUSED: " + err.message);
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  let rel = decodeURIComponent((req.url || "/").split("?")[0]);
  if (rel.endsWith("/")) rel += "index.html";
  rel = normalize(rel).replace(/^([\\/])+/, "");
  const path = join(ROOT, rel);
  if (!path.startsWith(ROOT) || !existsSync(path)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found: " + rel);
    return;
  }
  const ext = extname(path).toLowerCase();
  if (ext === ".html") {
    let html = readFileSync(path, "utf8");
    // the editor goes in last so it sits above whatever the page built
    html = html.replace(/<\/body>/i, EDITOR + "</body>");
    res.writeHead(200, { "Content-Type": MIME[".html"] });
    res.end(html);
    return;
  }
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  res.end(readFileSync(path));
}).listen(PORT, () => {
  console.log("");
  console.log("  Edit the deck:  http://localhost:" + PORT + "/");
  console.log("  Edit the CV:    http://localhost:" + PORT + "/cv/");
  console.log("");
  console.log("  Click Edit, click any outlined text, type, click Save.");
  console.log("  Backups land in .edit-backups/ before every write.");
  console.log("  When you are happy:  node tools/deploy.mjs");
  console.log("");
});
