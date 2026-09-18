// A workflow canvas that PLAYS, left to right.
//
// Volvo asked for the thing itself, then asked for it horizontal. Both were the
// right call. A trigger on the left with steps running right is how a scenario
// canvas actually reads, and it turns a page of nine builds from 7,400px tall
// into something a person can scan.
//
// LAYOUT IS COMPUTED, NOT HAND-PLACED. Depth - the longest path from the
// trigger - becomes the COLUMN, and everything at equal depth stacks into rows.
// Longest path, never shortest: with shortest, a step reachable both directly
// and through three others lands in the same column as the short route, and the
// wire then runs backwards into it. Hand-placing fifty builds would be fifty
// chances to draw a wire that lies about the order.
//
// THE CANVAS FOLLOWS THE PULSE. A nine-step build is about 2,000px wide, which
// no phone can show at a readable size. Rather than asking anyone to drag, the
// canvas scrolls itself to keep the live step in view - the one thing a printed
// diagram cannot do, and most of the reason this is worth animating at all.
export const NODE_W = 170, NODE_H = 64, GAP_X = 54, GAP_Y = 22, PAD = 16;
const MAX_LINES = 3;

function depths(nodes, edges) {
  const fwd = edges.filter(e => !e.back);
  const d = new Map(nodes.map(n => [n.id, 0]));
  for (let pass = 0; pass < nodes.length; pass++) {
    let moved = false;
    for (const e of fwd) {
      const want = d.get(e.from) + 1;
      if (want > d.get(e.to)) { d.set(e.to, want); moved = true; }
    }
    if (!moved) break;
  }
  return d;
}

export function layout(flow) {
  const d = depths(flow.nodes, flow.edges);
  const cols = new Map();
  for (const n of flow.nodes) {
    const k = d.get(n.id);
    if (!cols.has(k)) cols.set(k, []);
    cols.get(k).push(n);
  }
  const tallest = Math.max(...[...cols.values()].map(c => c.length));
  const hasBack = flow.edges.some(e => e.back);
  const bodyH = tallest * NODE_H + (tallest - 1) * GAP_Y;
  const H = PAD * 2 + bodyH + (hasBack ? 34 : 0);
  const W = PAD * 2 + cols.size * NODE_W + (cols.size - 1) * GAP_X;

  const pos = new Map();
  for (const [depth, col] of [...cols.entries()].sort((a, b) => a[0] - b[0])) {
    const colH = col.length * NODE_H + (col.length - 1) * GAP_Y;
    let y = PAD + (bodyH - colH) / 2;
    for (const n of col) {
      pos.set(n.id, { x: PAD + depth * (NODE_W + GAP_X), y });
      y += NODE_H + GAP_Y;
    }
  }
  return { pos, W, H, backY: PAD + bodyH + 20 };
}

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* <text> does not wrap - it keeps going out the side of the card - so the wrap
   is computed here. CH is the measured width of one character at this size; an
   estimate of 6.4 left labels 2px past the edge once already, and the page's
   own check compares the result against the real rendered box. */
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

function edgePath(a, b, back, backY) {
  if (!back) {
    const ax = a.x + NODE_W, ay = a.y + NODE_H / 2;
    const bx = b.x, by = b.y + NODE_H / 2;
    const mx = (ax + bx) / 2;
    return `M${ax} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${bx} ${by}`;
  }
  /* A return leg runs UNDER the whole canvas. Routed like a forward wire it
     would cut straight back through the steps it just came from, and read as a
     mistake rather than as "go round again". */
  const ax = a.x + NODE_W / 2, ay = a.y + NODE_H;
  const bx = b.x + NODE_W / 2, by = b.y + NODE_H;
  return `M${ax} ${ay} L ${ax} ${backY} L ${bx} ${backY} L ${bx} ${by}`;
}

/* `name` is the build's own name, used for the canvas's accessible label. It is
   passed in rather than read off the flow because the flow is the GRAPH - the
   same graph is allowed to appear under two names, and a screen reader saying
   "undefined workflow" is what happens when that is forgotten. */
export function renderFlow(flow, idx, name = "Workflow") {
  const { pos, W, H, backY } = layout(flow);
  const id = "fl" + idx;

  const edges = flow.edges.map(e => {
    const A = pos.get(e.from), B = pos.get(e.to);
    const p = edgePath(A, B, e.back, backY);
    const lbl = e.label ? (() => {
      const lx = e.back ? (A.x + B.x) / 2 + NODE_W / 2 : (A.x + NODE_W + B.x) / 2;
      const ly = e.back ? backY - 6 : (A.y + B.y) / 2 + NODE_H / 2 - 7;
      return `<text class="fe-l" x="${lx}" y="${ly}" text-anchor="middle">${esc(e.label)}</text>`;
    })() : "";
    return `<path class="fe" data-a="${e.from}" data-b="${e.to}" d="${p}"/>${lbl}`;
  }).join("\n      ");

  const nodes = flow.nodes.map(n => {
    const p = pos.get(n.id);
    const ls = wrap(n.label);
    const first = p.y + NODE_H / 2 - (ls.length - 1) * 7 + 4;
    return `<g class="fn k-${n.kind || "action"}" id="${id}-n-${n.id}" data-x="${p.x}" data-w="${NODE_W}">
        <rect class="fnb" x="${p.x}" y="${p.y}" width="${NODE_W}" height="${NODE_H}" rx="13"/>
        ${ls.map((l, i) => `<text class="fnt" x="${p.x + NODE_W / 2}" y="${first + i * 14}" text-anchor="middle">${esc(l)}</text>`).join("")}
      </g>`;
  }).join("\n      ");

  const cfg = JSON.stringify({ id, play: flow.play, caption: flow.caption || {} }).replace(/'/g, "&#39;");
  return `<div class="flow" data-flow='${cfg}'>
  <div class="fscroll">
    <svg viewBox="0 0 ${W} ${H}" style="min-width:${W}px" role="img" aria-label="${esc(name)} workflow">
      ${edges}
      ${nodes}
      <circle class="fp" id="${id}-pulse" r="7" cx="-99" cy="-99"/>
    </svg>
  </div>
  <div class="frail"><i></i></div>
  <div class="fbar">
    <button class="fplay" type="button" aria-label="Play this workflow">Play</button>
    <span class="fcap" aria-live="polite">Ready</span>
  </div>
</div>`;
}

export const FLOW_CSS = `
.flow{margin:14px 0 0;border:3px solid var(--ink);border-radius:14px;background:var(--paper);
  padding:10px 0 0;overflow:hidden}
.fscroll{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;padding:0 10px;
  scrollbar-width:thin}
.flow svg{height:auto;display:block}
.fnb{fill:var(--card);stroke:var(--ink);stroke-width:3;transition:fill .22s var(--ease)}
.fnt{font-family:var(--f-mono);font-size:11px;fill:var(--ink)}
.fn.on .fnb{fill:var(--pop)}
.fn.done .fnb{fill:#FBF3CE}
.k-decision .fnb{fill:#EFEEE6}
.k-decision.on .fnb,.k-fail.on .fnb{fill:var(--pop)}
.k-fail .fnb{stroke:var(--bad)}
.k-end .fnb{stroke-width:4.5}
/* The trigger stays indigo the whole way through, so at a glance you can always
   see where the thing starts without reading a word of it. */
.k-trigger .fnb,.k-trigger.on .fnb,.k-trigger.done .fnb{fill:var(--field)}
.k-trigger .fnt{fill:var(--paper)}
.fe{stroke:var(--ink);stroke-width:2.5;fill:none;opacity:.28;transition:opacity .2s,stroke .2s}
.fe.lit{opacity:1;stroke:var(--field)}
.fe-l{font-family:var(--f-mono);font-size:9.5px;fill:var(--muted)}
.fp{fill:var(--pop);stroke:var(--ink);stroke-width:2.5;opacity:0;transition:opacity .15s}
.fp.go{opacity:1}
/* how far through the run you are, without a number to read */
.frail{height:4px;background:var(--hair);margin:8px 10px 0;border-radius:3px;overflow:hidden}
.frail i{display:block;height:100%;width:0;background:var(--field);transition:width .5s var(--ease)}
.fbar{display:flex;align-items:center;gap:10px;padding:8px 10px 10px;flex-wrap:wrap}
.fplay{font-family:var(--f-mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;
  background:var(--pop);border:3px solid var(--ink);border-radius:99px;padding:7px 15px;
  cursor:pointer;box-shadow:3px 3px 0 0 var(--ink)}
.fplay:active{transform:translateY(2px);box-shadow:1px 1px 0 0 var(--ink)}
.fcap{font-family:var(--f-mono);font-size:11px;color:var(--muted);letter-spacing:.04em;flex:1 1 180px}
@media(prefers-reduced-motion:reduce){
  /* Someone who asked not to be moved gets the finished state, not a
     one-millisecond replay of it, and no canvas that scrolls itself. */
  .fn .fnb{fill:#FBF3CE}
  .k-trigger .fnb{fill:var(--field)}
  .fe{opacity:1}
  .fp,.fplay{display:none}
  .frail i{width:100% !important}
}`;

export const FLOW_JS = `
(function(){
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function build(box){
    var cfg = JSON.parse(box.getAttribute("data-flow"));
    var scroll = box.querySelector(".fscroll");
    var svg = box.querySelector("svg");
    var pulse = document.getElementById(cfg.id + "-pulse");
    var cap = box.querySelector(".fcap");
    var rail = box.querySelector(".frail i");
    var timers = [], raf = null;

    function node(n){ return document.getElementById(cfg.id + "-n-" + n); }
    function edge(a,b){ return svg.querySelector('[data-a="' + a + '"][data-b="' + b + '"]'); }

    function reset(){
      timers.forEach(clearTimeout); timers = []; if (raf) cancelAnimationFrame(raf);
      svg.querySelectorAll(".fn").forEach(function(n){ n.classList.remove("on","done"); });
      svg.querySelectorAll(".fe").forEach(function(e){ e.classList.remove("lit"); });
      pulse.classList.remove("go");
      rail.style.width = "0%";
      scroll.scrollLeft = 0;
    }

    /* Keep the live step in view. The canvas is wider than any phone, and a
       reader who has to drag in order to follow along will not follow along. */
    function follow(n){
      if (!n) return;
      var vb = svg.viewBox.baseVal.width || 1;
      var scale = svg.getBoundingClientRect().width / vb;
      var x = parseFloat(n.getAttribute("data-x")) * scale;
      var w = parseFloat(n.getAttribute("data-w")) * scale;
      var want = x + w / 2 - scroll.clientWidth / 2;
      var max = scroll.scrollWidth - scroll.clientWidth;
      want = Math.max(0, Math.min(max, want));
      if (Math.abs(want - scroll.scrollLeft) < 8) return;
      try { scroll.scrollTo({ left: want, behavior: "smooth" }); }
      catch (e) { scroll.scrollLeft = want; }
    }

    /* The pulse walks the real path rather than being handed to CSS, so a
       replay can interrupt it mid-wire and the captions stay on one clock. */
    function travel(path, ms, done){
      var len = path.getTotalLength(), t0 = null;
      pulse.classList.add("go");
      function step(t){
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / ms);
        var p = path.getPointAtLength(len * k);
        pulse.setAttribute("cx", p.x); pulse.setAttribute("cy", p.y);
        if (k < 1) raf = requestAnimationFrame(step);
        else { pulse.classList.remove("go"); done && done(); }
      }
      raf = requestAnimationFrame(step);
    }

    function play(){
      reset();
      var i = 0;
      function hop(){
        var id = cfg.play[i], n = node(id);
        svg.querySelectorAll(".fn.on").forEach(function(x){ x.classList.remove("on"); x.classList.add("done"); });
        if (n) n.classList.add("on");
        cap.textContent = cfg.caption[id] || (n ? n.textContent.trim() : "");
        rail.style.width = Math.round((i / (cfg.play.length - 1)) * 100) + "%";
        follow(n);
        if (i >= cfg.play.length - 1){
          timers.push(setTimeout(function(){
            if (n) { n.classList.remove("on"); n.classList.add("done"); }
            cap.textContent = "Done";
          }, 700));
          return;
        }
        var e = edge(id, cfg.play[i + 1]);
        timers.push(setTimeout(function(){
          if (e){ e.classList.add("lit"); travel(e, 600, function(){ i++; hop(); }); }
          else { i++; hop(); }
        }, 500));
      }
      hop();
    }

    box.querySelector(".fplay").addEventListener("click", play);
    return { play: play, box: box };
  }

  var flows = [].slice.call(document.querySelectorAll(".flow")).map(build);
  if (reduced || !("IntersectionObserver" in window)) return;

  /* Plays when it reaches you, once. The observer only watches boxes that are
     on the page and visible; a filtered-out group is display:none and simply
     never fires, which is correct rather than a bug. */
  var seen = new WeakSet();
  var io = new IntersectionObserver(function(en){
    en.forEach(function(x){
      if (!x.isIntersecting || seen.has(x.target)) return;
      seen.add(x.target);
      var f = flows.filter(function(y){ return y.box === x.target; })[0];
      if (f) setTimeout(f.play, 240);
    });
  }, { threshold: 0.3 });
  flows.forEach(function(f){ io.observe(f.box); });
})();`;
