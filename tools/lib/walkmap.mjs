// The Retell map, computed instead of hand-placed.
//
// Volvo pointed at the Retell page and said "the kind of workflow I wanna see":
// a VERTICAL tree. Trigger at the top, routes fanning down, a name and a small
// line in every box, and tapping one lights the routes out of it. I built these
// left to right first, which was the wrong shape twice over - wrong against
// what he asked for, and wrong because a wide-and-short map cannot sit beside a
// tall panel. A vertical map can, which is why Retell's layout works.
//
// The one difference from Retell: its positions are hand-written per node,
// which is fine for one build and eleven chances to draw a lying wire across
// eleven. Here depth from the trigger by LONGEST path becomes the ROW, and the
// steps sharing a row spread evenly and centre. Longest path, never shortest -
// with shortest, a step reachable both directly and the long way round lands in
// the same row as the short route, and its wire then runs upward.
export const NODE_W = 200, NODE_H = 64, GAP_X = 26, GAP_Y = 56, PAD = 16;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function depths(ids, edges) {
  const d = new Map(ids.map((i) => [i, 0]));
  for (let pass = 0; pass < ids.length; pass++) {
    let moved = false;
    for (const [a, z] of edges) if (d.get(a) + 1 > d.get(z)) { d.set(z, d.get(a) + 1); moved = true; }
    if (!moved) break;
  }
  return d;
}

export function layout(build) {
  const ids = Object.keys(build.nodes);
  const d = depths(ids, build.edges);
  const rows = new Map();
  for (const id of ids) {
    const k = d.get(id);
    if (!rows.has(k)) rows.set(k, []);
    rows.get(k).push(id);
  }
  const widest = Math.max(...[...rows.values()].map((r) => r.length));
  const W = PAD * 2 + widest * NODE_W + (widest - 1) * GAP_X;
  const H = PAD * 2 + rows.size * NODE_H + (rows.size - 1) * GAP_Y;
  const pos = new Map();
  for (const [depth, row] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    const rowW = row.length * NODE_W + (row.length - 1) * GAP_X;
    let x = (W - rowW) / 2;
    for (const id of row) { pos.set(id, { x, y: PAD + depth * (NODE_H + GAP_Y) }); x += NODE_W + GAP_X; }
  }
  return { pos, W, H };
}

/* <text> does not wrap - it runs out the side of the box - so the wrap is
   computed. CH is the measured width of one character at this size, and the
   page's own check compares the result against the real rendered box rather
   than against this estimate. */
const CH = 7.05, MAXC = Math.floor((NODE_W - 26) / CH);
function wrap(t) {
  if (t.length <= MAXC) return [t];
  const out = []; let cur = "";
  for (const w of t.split(" ")) {
    if ((cur + " " + w).trim().length <= MAXC) cur = (cur + " " + w).trim();
    else { if (cur) out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  return out.slice(0, 2);
}

/* Down from the bottom of one box to the top of the next, control points
   halfway - the same curve the Retell map uses, and what makes a fan of three
   routes read as a fan rather than as three unrelated lines. */
const path = (A, B) => {
  const x1 = A.x + NODE_W / 2, y1 = A.y + NODE_H, x2 = B.x + NODE_W / 2, y2 = B.y;
  const my = (y1 + y2) / 2;
  return `M${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
};

/* The walk: the first route through the tree, taking the first edge out of each
   step. Deterministic, so the page reads the same way twice. */
function walkOrder(build) {
  const first = Object.keys(build.nodes)[0];
  const out = [first], seen = new Set([first]);
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

  const edges = build.edges.map(([a, z, label]) => {
    const A = pos.get(a), B = pos.get(z);
    const lbl = label
      ? `<text class="we-l" x="${(A.x + B.x) / 2 + NODE_W / 2}" y="${(A.y + NODE_H + B.y) / 2 + 4}" text-anchor="middle">${esc(label)}</text>`
      : "";
    return `<path class="we" data-a="${a}" data-b="${z}" d="${path(A, B)}"/>${lbl}`;
  }).join("\n            ");

  const nodes = Object.entries(build.nodes).map(([k, n]) => {
    const p = pos.get(k);
    const ls = wrap(n.label);
    const top = p.y + (ls.length > 1 ? 21 : 27);
    return `<g class="wn k-${n.kind || "action"}" data-k="${k}" tabindex="0" role="button" aria-label="${esc(n.label)}">
              <rect class="wnb" x="${p.x}" y="${p.y}" width="${NODE_W}" height="${NODE_H}" rx="12"/>
              ${ls.map((l, i) => `<text class="wnt" x="${p.x + 13}" y="${top + i * 14}">${esc(l)}</text>`).join("")}
              <text class="wns" x="${p.x + 13}" y="${p.y + NODE_H - 13}">${esc(n.sub)}</text>
            </g>`;
  }).join("\n            ");

  const cfg = JSON.stringify({
    nodes: Object.fromEntries(Object.entries(build.nodes).map(([k, n]) =>
      [k, { label: n.label, sub: n.sub, says: n.says, writes: n.writes, quote: n.quote }])),
    walk: walkOrder(build)
  }).replace(/'/g, "&#39;");

  const first = Object.entries(build.nodes)[0][1];

  return `<div class="walk" id="w-${key}" data-walk='${cfg}'>
      <div class="wmap">
        <div class="wscroll">
          <svg viewBox="0 0 ${W} ${H}" style="max-width:${W}px;--w:${W}px" role="img" aria-label="${esc(key)} routes">
            ${edges}
            ${nodes}
          </svg>
        </div>
        <p class="whint">Tap a box. The routes out of it light up.</p>
      </div>
      <div class="wside">
        <div class="wpanel">
          <span class="wtag">${esc(first.sub)}</span>
          <h4 class="wtitle">${esc(first.label)}</h4>
          <p class="wsays">${esc(first.says)}</p>
          <div class="wquote"></div>
        </div>
        <div class="wpanel">
          <span class="wtag">what it writes on the contact</span>
          <div class="wfields">
            ${record.map((r) => `<span class="wf" data-f="${r}">${esc(RECORD[r])}</span>`).join("")}
          </div>
          <button class="wplay" type="button">Walk the whole thing</button>
        </div>
      </div>
    </div>`;
}

export const WALK_CSS = `
/* A vertical map is tall and narrow, so the panels sit beside it - which is
   exactly why the Retell page is laid out this way, and why the horizontal
   version could not be. */
.walk{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:14px;
  margin-top:14px;align-items:start}
@media(max-width:900px){ .walk{grid-template-columns:minmax(0,1fr)} }
.wmap{background:var(--card);border:3px solid var(--ink);border-radius:15px;
  box-shadow:5px 5px 0 0 var(--ink);padding:clamp(12px,1.8vw,20px);min-width:0}
.wmap svg{width:100%;height:auto;display:block;margin:0 auto}
/* Narrow screens keep the map at its real size and scroll it, rather than
   shrinking an 11.5px label to about 8px to make it fit. */
@media(max-width:900px){
  .wscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 -4px;padding:0 4px}
  .wmap svg{min-width:var(--w)}
}
.wn{cursor:pointer}
.wnb{fill:var(--card);stroke:var(--ink);stroke-width:3;transition:fill .18s var(--ease)}
.wn:hover .wnb{fill:#FDF7DA}
.wn.on .wnb{fill:var(--pop)}
.wnt{font-family:var(--f-mono);font-size:11.5px;fill:var(--ink);pointer-events:none}
.wns{font-family:var(--f-body);font-size:10px;fill:var(--muted);pointer-events:none}
.k-decision .wnb{fill:#EFEEE6}
.k-decision.on .wnb,.k-fail.on .wnb{fill:var(--pop)}
.k-fail .wnb{stroke:var(--bad)}
.k-end .wnb{stroke-width:4.5}
.wn:focus-visible .wnb{stroke:var(--field);stroke-width:4.5}
.we{stroke:var(--ink);stroke-width:2.5;fill:none;opacity:.26;
  transition:opacity .2s var(--ease),stroke .2s var(--ease)}
.we.lit{opacity:1;stroke:var(--field)}
.we-l{font-family:var(--f-mono);font-size:9.5px;fill:var(--muted)}
.whint{font-family:var(--f-mono) !important;font-size:11px !important;color:var(--muted) !important;
  margin:14px 0 0 !important;letter-spacing:.04em}
.wside{display:flex;flex-direction:column;gap:12px;min-width:0;
  position:sticky;top:14px}
@media(max-width:900px){ .wside{position:static} }
.wpanel{background:var(--card);border:3px solid var(--ink);border-radius:15px;
  box-shadow:5px 5px 0 0 var(--ink);padding:15px 16px}
.wtag{display:inline-block;font-family:var(--f-mono);font-size:9px;letter-spacing:.14em;
  text-transform:uppercase;background:var(--pop);border:2px solid var(--ink);border-radius:99px;
  padding:3px 10px;margin-bottom:10px}
.wtitle{font-family:var(--f-disp);font-weight:900;font-size:19px;letter-spacing:-.02em;
  margin:0 0 7px;line-height:1.15}
.wsays{margin:0 !important;font-size:14px !important;line-height:1.6 !important;color:var(--muted)}
.wquote:empty{display:none}
.wquote .says{background:var(--field);color:var(--paper);border-radius:11px;padding:11px 13px;
  font-size:13px;line-height:1.5;margin-top:12px}
.wquote .says b{color:var(--pop);display:block;font-family:var(--f-mono);font-size:9px;
  letter-spacing:.14em;text-transform:uppercase;margin-bottom:5px;font-weight:700}
.wfields{display:flex;flex-wrap:wrap;gap:6px}
.wf{font-family:var(--f-mono);font-size:10.5px;border:2px solid var(--hair);border-radius:99px;
  padding:4px 9px;color:var(--muted);transition:border-color .22s var(--ease),
  background .22s var(--ease),color .22s var(--ease)}
.wf.hit{border-color:var(--ink);background:var(--pop);color:var(--ink)}
.wplay{display:block;width:100%;margin-top:14px;font-family:var(--f-mono);font-size:10.5px;
  letter-spacing:.1em;text-transform:uppercase;background:var(--paper);border:2.5px solid var(--ink);
  border-radius:99px;padding:9px 14px;cursor:pointer;transition:background .16s var(--ease)}
.wplay:hover{background:var(--pop)}
.wplay:active{transform:translateY(1px)}
.wplay:focus-visible{outline:3px solid var(--field);outline-offset:3px}
@media(prefers-reduced-motion:reduce){ .wnb,.we,.wf,.wplay{transition:none} .wplay{display:none} }`;

export const WALK_JS = `
(function(){
  document.querySelectorAll(".walk").forEach(function(box){
    var cfg = JSON.parse(box.getAttribute("data-walk"));
    var svg = box.querySelector("svg");
    var tag = box.querySelector(".wtag");
    var title = box.querySelector(".wtitle"), says = box.querySelector(".wsays");
    var quote = box.querySelector(".wquote");
    var timers = [];

    function stop(){ timers.forEach(clearTimeout); timers = []; }

    function show(k){
      var n = cfg.nodes[k];
      if (!n) return;
      tag.textContent = n.sub;
      title.textContent = n.label;
      says.textContent = n.says;
      quote.innerHTML = n.quote
        ? '<div class="says"><b>What it actually sends</b>' + n.quote + "</div>" : "";
      svg.querySelectorAll(".wn").forEach(function(g){ g.classList.toggle("on", g.getAttribute("data-k") === k); });
      svg.querySelectorAll(".we").forEach(function(e){ e.classList.toggle("lit", e.getAttribute("data-a") === k); });
      box.querySelectorAll(".wf").forEach(function(f){
        f.classList.toggle("hit", (n.writes || []).indexOf(f.getAttribute("data-f")) >= 0);
      });
    }

    svg.querySelectorAll(".wn").forEach(function(g){
      var k = g.getAttribute("data-k");
      g.addEventListener("click", function(){ stop(); show(k); });
      g.addEventListener("keydown", function(e){
        if (e.key === "Enter" || e.key === " "){ e.preventDefault(); stop(); show(k); }
      });
    });

    var play = box.querySelector(".wplay");
    if (play) play.addEventListener("click", function(){
      stop();
      cfg.walk.forEach(function(k, i){ timers.push(setTimeout(function(){ show(k); }, i * 1100)); });
    });

    show(cfg.walk[0]);
  });
})();`;
