// The Retell treatment, applied to a CRM build.
//
// Three parts, and the third is the one that earns the click: a map, a panel
// that answers when you tap a step, and a panel of everything the build writes
// on the contact, which lights up to show what THAT step touched. A diagram
// tells you the order; this tells you the consequences.
//
// Two differences from the Retell page, both deliberate:
//   * the map runs LEFT TO RIGHT, because Volvo asked for horizontal workflows
//     and never withdrew it;
//   * the play button stays, and drives the same two panels rather than a
//     separate animation. Walking it yourself and watching it walk are now the
//     same journey, which they were not when the pulse had its own captions.
//
// Layout is computed, never hand-placed: depth from the trigger by LONGEST path
// becomes the column, equal depths stack. Longest, never shortest - with
// shortest, a step reachable both directly and the long way round lands in the
// same column as the short route and its wire then runs backwards.
export const NODE_W = 168, NODE_H = 60, GAP_X = 50, GAP_Y = 20, PAD = 14;
const MAX_LINES = 3;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function depths(ids, edges) {
  const d = new Map(ids.map((i) => [i, 0]));
  for (let pass = 0; pass < ids.length; pass++) {
    let moved = false;
    for (const [a, z] of edges) {
      if (d.get(a) + 1 > d.get(z)) { d.set(z, d.get(a) + 1); moved = true; }
    }
    if (!moved) break;
  }
  return d;
}

export function layout(build) {
  const ids = Object.keys(build.nodes);
  const d = depths(ids, build.edges);
  const cols = new Map();
  for (const id of ids) {
    const k = d.get(id);
    if (!cols.has(k)) cols.set(k, []);
    cols.get(k).push(id);
  }
  const tallest = Math.max(...[...cols.values()].map((c) => c.length));
  const bodyH = tallest * NODE_H + (tallest - 1) * GAP_Y;
  const W = PAD * 2 + cols.size * NODE_W + (cols.size - 1) * GAP_X;
  const H = PAD * 2 + bodyH;
  const pos = new Map();
  for (const [depth, col] of [...cols.entries()].sort((a, b) => a[0] - b[0])) {
    const colH = col.length * NODE_H + (col.length - 1) * GAP_Y;
    let y = PAD + (bodyH - colH) / 2;
    for (const id of col) { pos.set(id, { x: PAD + depth * (NODE_W + GAP_X), y }); y += NODE_H + GAP_Y; }
  }
  return { pos, W, H };
}

/* <text> does not wrap, it runs out the side of the box, so the wrap is
   computed. CH is the measured width of one character at this size; the page's
   own check compares the result against the real rendered box rather than
   against this estimate. */
const CH = 6.75, MAXC = Math.floor((NODE_W - 22) / CH);
function wrap(t) {
  if (t.length <= MAXC) return [t];
  const out = []; let cur = "";
  for (const w of t.split(" ")) {
    if ((cur + " " + w).trim().length <= MAXC) cur = (cur + " " + w).trim();
    else { if (cur) out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  return out.slice(0, MAX_LINES);
}

const path = (A, B) => {
  const ax = A.x + NODE_W, ay = A.y + NODE_H / 2, bx = B.x, by = B.y + NODE_H / 2;
  const mx = (ax + bx) / 2;
  return `M${ax} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${bx} ${by}`;
};

/* the walk order: the first path through the graph, taking the first edge out
   of each step. Deterministic, so the page reads the same way twice. */
function walkOrder(build) {
  const first = Object.keys(build.nodes)[0];
  const out = [first];
  const seen = new Set([first]);
  let at = first;
  for (let i = 0; i < 40; i++) {
    const e = build.edges.find(([a, z]) => a === at && !seen.has(z));
    if (!e) break;
    at = e[1]; seen.add(at); out.push(at);
  }
  return out;
}

/* The record list is DERIVED from the steps: the union of everything they
   write, in the order the RECORD map declares them. Hand-maintaining it beside
   the steps is how the first version shipped a panel whose chips no step could
   ever light. */
export function recordFor(build, RECORD) {
  const used = new Set();
  for (const n of Object.values(build.nodes)) for (const w of (n.writes || [])) used.add(w);
  const unknown = [...used].filter((k) => !(k in RECORD));
  if (unknown.length) throw new Error("steps write records that do not exist: " + unknown.join(", "));
  return Object.keys(RECORD).filter((k) => used.has(k));
}

export function renderWalk(key, build, RECORD) {
  const record = recordFor(build, RECORD);
  const { pos, W, H } = layout(build);
  const id = "w-" + key;

  const edges = build.edges.map(([a, z, label]) => {
    const A = pos.get(a), B = pos.get(z);
    const lbl = label
      ? `<text class="we-l" x="${(A.x + NODE_W + B.x) / 2}" y="${(A.y + B.y) / 2 + NODE_H / 2 - 7}" text-anchor="middle">${esc(label)}</text>`
      : "";
    return `<path class="we" data-a="${a}" data-b="${z}" d="${path(A, B)}"/>${lbl}`;
  }).join("\n        ");

  const nodes = Object.entries(build.nodes).map(([k, n]) => {
    const p = pos.get(k);
    const ls = wrap(n.label);
    const top = p.y + NODE_H / 2 - (ls.length - 1) * 7 + 4;
    return `<g class="wn k-${n.kind || "action"}" id="${id}-${k}" data-k="${k}" tabindex="0"
          role="button" aria-label="${esc(n.label)}">
          <rect class="wnb" x="${p.x}" y="${p.y}" width="${NODE_W}" height="${NODE_H}" rx="12"/>
          ${ls.map((l, i) => `<text class="wnt" x="${p.x + NODE_W / 2}" y="${top + i * 14}" text-anchor="middle">${esc(l)}</text>`).join("")}
        </g>`;
  }).join("\n        ");

  const cfg = JSON.stringify({
    id,
    nodes: Object.fromEntries(Object.entries(build.nodes).map(([k, n]) =>
      [k, { label: n.label, says: n.says, writes: n.writes, quote: n.quote }])),
    walk: walkOrder(build)
  }).replace(/'/g, "&#39;");

  const first = Object.entries(build.nodes)[0];

  return `<div class="walk" data-walk='${cfg}'>
      <div class="wmap">
        <div class="wscroll">
          <svg viewBox="0 0 ${W} ${H}" style="min-width:${W}px" role="img" aria-label="${esc(key)} steps">
            ${edges}
            ${nodes}
          </svg>
        </div>
        <div class="wbar">
          <button class="wplay" type="button">Walk it</button>
          <span class="whint">Tap any step. What it writes lights up below.</span>
        </div>
      </div>
      <div class="wside">
        <div class="wpanel wdetail">
          <span class="wtag">step</span>
          <h4 class="wtitle">${esc(first[1].label)}</h4>
          <p class="wsays">${esc(first[1].says)}</p>
          <div class="wquote"></div>
        </div>
        <div class="wpanel wrec">
          <span class="wtag">what it writes on the contact</span>
          <div class="wfields">
            ${record.map((r) => `<span class="wf" data-f="${r}">${esc(RECORD[r])}</span>`).join("")}
          </div>
        </div>
      </div>
    </div>`;
}

export const WALK_CSS = `
/* A horizontal map is wide and short; panels beside it are narrow and tall, and
   no column width reconciles those two. So the map spans the full width and its
   two panels sit underneath. */
.walk{display:flex;flex-direction:column;gap:12px;margin-top:14px}
.wside{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:12px;align-items:start}
@media(max-width:780px){ .wside{grid-template-columns:minmax(0,1fr)} }
.wmap{border:3px solid var(--ink);border-radius:14px;background:var(--paper);padding:10px 0 0;
  overflow:hidden;min-width:0}
.wscroll{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;padding:0 10px;
  scrollbar-width:thin}
.walk svg{height:auto;display:block}
.wn{cursor:pointer}
.wnb{fill:var(--card);stroke:var(--ink);stroke-width:3;transition:fill .18s var(--ease)}
.wn:hover .wnb{fill:#FDF7DA}
.wn.on .wnb{fill:var(--pop)}
.wnt{font-family:var(--f-mono);font-size:11px;fill:var(--ink);pointer-events:none}
.k-decision .wnb{fill:#EFEEE6}
.k-decision.on .wnb,.k-fail.on .wnb{fill:var(--pop)}
.k-fail .wnb{stroke:var(--bad)}
.k-end .wnb{stroke-width:4.5}
/* the trigger stays indigo the whole way through, so you can always see where
   the thing starts without reading a word of it */
.k-trigger .wnb,.k-trigger.on .wnb{fill:var(--field)}
.k-trigger .wnt{fill:var(--paper)}
.k-trigger.on .wnt{fill:var(--pop)}
.wn:focus-visible .wnb{stroke:var(--field);stroke-width:4}
.we{stroke:var(--ink);stroke-width:2.5;fill:none;opacity:.26;transition:opacity .2s,stroke .2s}
.we.lit{opacity:1;stroke:var(--field)}
.we-l{font-family:var(--f-mono);font-size:9.5px;fill:var(--muted)}
.wbar{display:flex;align-items:center;gap:10px;padding:9px 12px 11px;flex-wrap:wrap;
  border-top:2px dashed var(--hair);margin-top:8px}
.wplay{font-family:var(--f-mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;
  background:var(--pop);border:2.5px solid var(--ink);border-radius:99px;padding:7px 15px;
  cursor:pointer;box-shadow:3px 3px 0 0 var(--ink)}
.wplay:active{transform:translateY(2px);box-shadow:1px 1px 0 0 var(--ink)}
.wplay:focus-visible{outline:3px solid var(--field);outline-offset:3px}
.whint{font-family:var(--f-mono);font-size:10.5px;color:var(--muted);flex:1 1 170px}

.wpanel{background:var(--card);border:3px solid var(--ink);border-radius:14px;
  box-shadow:4px 4px 0 0 var(--ink);padding:14px 15px}
.wtag{display:inline-block;font-family:var(--f-mono);font-size:9px;letter-spacing:.14em;
  text-transform:uppercase;background:var(--pop);border:2px solid var(--ink);border-radius:99px;
  padding:3px 9px;margin-bottom:9px}
.wtitle{font-family:var(--f-disp);font-weight:900;font-size:17px;letter-spacing:-.02em;
  margin:0 0 6px;line-height:1.15}
.wsays{margin:0 !important;font-size:13.5px;line-height:1.6;color:var(--muted)}
.wquote:empty{display:none}
.wquote .says{background:var(--field);color:var(--paper);border-radius:11px;padding:11px 13px;
  font-size:13px;line-height:1.5;margin-top:11px}
.wquote .says b{color:var(--pop);display:block;font-family:var(--f-mono);font-size:9px;
  letter-spacing:.14em;text-transform:uppercase;margin-bottom:5px;font-weight:700}
.wfields{display:flex;flex-wrap:wrap;gap:6px}
.wf{font-family:var(--f-mono);font-size:10.5px;border:2px solid var(--hair);border-radius:99px;
  padding:4px 9px;color:var(--muted);transition:border-color .22s var(--ease),
  background .22s var(--ease),color .22s var(--ease)}
.wf.hit{border-color:var(--ink);background:var(--pop);color:var(--ink)}
@media(prefers-reduced-motion:reduce){
  .wnb,.we,.wf{transition:none}
  .wplay{display:none}
}`;

export const WALK_JS = `
(function(){
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".walk").forEach(function(box){
    var cfg = JSON.parse(box.getAttribute("data-walk"));
    var svg = box.querySelector("svg");
    var scroll = box.querySelector(".wscroll");
    var title = box.querySelector(".wtitle"), says = box.querySelector(".wsays");
    var quote = box.querySelector(".wquote"), tag = box.querySelector(".wtag");
    var timers = [];

    function stop(){ timers.forEach(clearTimeout); timers = []; }

    /* Keep the chosen step in view. The canvas is wider than a phone, and a
       reader who has to drag to follow along will not follow along. */
    function follow(g){
      if (!g) return;
      var r = g.getBBox();
      var scale = svg.getBoundingClientRect().width / (svg.viewBox.baseVal.width || 1);
      var want = (r.x + r.width / 2) * scale - scroll.clientWidth / 2;
      want = Math.max(0, Math.min(scroll.scrollWidth - scroll.clientWidth, want));
      if (Math.abs(want - scroll.scrollLeft) < 8) return;
      try { scroll.scrollTo({ left: want, behavior: reduced ? "auto" : "smooth" }); }
      catch (e) { scroll.scrollLeft = want; }
    }

    function show(k, move){
      var n = cfg.nodes[k];
      if (!n) return;
      title.textContent = n.label;
      says.textContent = n.says;
      tag.textContent = (n.writes && n.writes.length) ? "this step writes" : "this step writes nothing";
      quote.innerHTML = n.quote
        ? '<div class="says"><b>What it actually sends</b>' + n.quote + "</div>" : "";
      svg.querySelectorAll(".wn").forEach(function(g){ g.classList.toggle("on", g.getAttribute("data-k") === k); });
      svg.querySelectorAll(".we").forEach(function(e){ e.classList.toggle("lit", e.getAttribute("data-a") === k); });
      box.querySelectorAll(".wf").forEach(function(f){
        f.classList.toggle("hit", (n.writes || []).indexOf(f.getAttribute("data-f")) >= 0);
      });
      if (move) follow(svg.querySelector('[data-k="' + k + '"]'));
    }

    svg.querySelectorAll(".wn").forEach(function(g){
      var k = g.getAttribute("data-k");
      g.addEventListener("click", function(){ stop(); show(k, true); });
      g.addEventListener("keydown", function(e){
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stop(); show(k, true); }
      });
    });

    var play = box.querySelector(".wplay");
    if (play) play.addEventListener("click", function(){
      stop();
      cfg.walk.forEach(function(k, i){
        timers.push(setTimeout(function(){ show(k, true); }, i * 1100));
      });
    });

    show(cfg.walk[0], false);
  });
})();`;
