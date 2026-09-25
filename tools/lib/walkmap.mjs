// One of Volvo's real workflows, as a picture that moves.
//
// The brief, in his words: his workflow NAME highlighted, a visual of how it
// works, "a clickable image that then enlarges after it is clicked", and
// "moving motions from the start of the workflows and on the end". The goal is
// a clean portfolio that amazes a client.
//
// So each card is a compact IMAGE of the whole workflow (a long one shrinks to
// fit rather than running down the page), and clicking it opens the same
// workflow full size in a lightbox. Both versions move the same way:
//   1. it DRAWS ITSELF, row by row from the trigger down, wires then boxes;
//   2. then a signal FLOWS: the trigger pings, a packet runs every wire in
//      order - splitting where the workflow branches - and END pings as the
//      packet lands. Then it goes round again.
//
// The flow runs on ONE clock per drawing: every packet's animation lasts the
// whole cycle and moves only during its own slot (keyTimes), so a 15-step
// workflow cannot drift out of step with itself however long it loops.
//
// Layout is computed, never hand-placed: depth from the trigger by LONGEST
// path is the row. Longest, never shortest - with shortest, a step reachable
// both directly and the long way round lands on the short route's row and its
// wire runs back up the page.
export const NODE_W = 208, NODE_H = 46, GAP_X = 22, GAP_Y = 34, PAD = 18;

const DRAW_STEP = 0.26;   // seconds between rows while it draws itself
const FLOW_STEP = 0.55;   // seconds a packet spends crossing one row
const HOLD = 1.3;         // pause at the end of each cycle, so END is seen

/* Quotes MUST be escaped: four of his names contain them ("REFER" FB
   Responder, "Headshots" event IG Responder, both DND After "Quit" Reply),
   and this output lands inside attributes. Without &quot; the attribute closed
   at the first quote and the lightbox showed an empty highlighter where the
   name should be - on exactly the thing he asked to have highlighted. */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");
const r3 = (n) => Math.round(n * 1000) / 1000;

/* A LOOP edge (4th element "back": n8n's retry-until-done, a Loop Over Items)
   takes no part in the layout. Counted, a cycle would push its own steps down
   the page on every pass. It is drawn round the side instead. */
const isBack = (e) => e[3] === "back";

function depths(ids, edges) {
  const d = new Map(ids.map((i) => [i, 0]));
  const fwd = edges.filter((e) => !isBack(e));
  for (let pass = 0; pass < ids.length; pass++) {
    let moved = false;
    for (const [a, z] of fwd) if (d.get(a) + 1 > d.get(z)) { d.set(z, d.get(a) + 1); moved = true; }
    if (!moved) break;
  }
  return d;
}

const BOW = 46;   // how far a loop curve swings out past the boxes

export function layout(wf) {
  const ids = Object.keys(wf.nodes);
  const depth = depths(ids, wf.edges);
  const loops = wf.edges.some(isBack);
  const rows = new Map();
  for (const id of ids) {
    const k = depth.get(id);
    if (!rows.has(k)) rows.set(k, []);
    rows.get(k).push(id);
  }
  const widest = Math.max(...[...rows.values()].map((r) => r.length));
  const side = loops ? BOW + 14 : 0;   // room either side, so centring stays true
  const W = PAD * 2 + side * 2 + widest * NODE_W + (widest - 1) * GAP_X;
  const H = PAD * 2 + rows.size * NODE_H + (rows.size - 1) * GAP_Y;
  const pos = new Map();
  for (const [dep, row] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    const rowW = row.length * NODE_W + (row.length - 1) * GAP_X;
    let x = (W - rowW) / 2;
    for (const id of row) { pos.set(id, { x, y: PAD + dep * (NODE_H + GAP_Y) }); x += NODE_W + GAP_X; }
  }
  return { pos, W, H, depth, maxDepth: rows.size - 1 };
}

/* <text> does not wrap, it runs out the side of the box, so the wrap is
   computed. CH is the measured width of one character at this size, and the
   page check compares the result against the real rendered box. */
const CH = 6.1, MAXC = Math.floor((NODE_W - 22) / CH);
function wrap(t) {
  if (t.length <= MAXC) return [t];
  const out = []; let cur = "";
  for (const w of t.split(" ")) {
    if ((cur + " " + w).trim().length <= MAXC) cur = (cur + " " + w).trim();
    else { if (cur) out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  if (out.length > 2) { out.length = 2; out[1] = out[1].slice(0, MAXC - 1) + "…"; }
  return out;
}

const pathD = (A, B) => {
  const x1 = A.x + NODE_W / 2, y1 = A.y + NODE_H, x2 = B.x + NODE_W / 2, y2 = B.y;
  const my = (y1 + y2) / 2;
  return `M${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
};

/* A loop leaves the right side of the later step and swings back up into the
   right side of the earlier one, so it reads as "go round again" rather than
   as a wire cutting back through the steps it came from. */
const loopD = (A, B) => {
  const x1 = A.x + NODE_W, y1 = A.y + NODE_H / 2, x2 = B.x + NODE_W, y2 = B.y + NODE_H / 2;
  const out = Math.max(x1, x2) + BOW;
  return `M${x1} ${y1} C ${out} ${y1}, ${out} ${y2}, ${x2} ${y2}`;
};

/* keyTimes must run 0..1 and never go backwards; equal neighbours are allowed
   and make a clean jump. Build them from slot edges and clamp. */
function keys(times, values) {
  const t = times.map((x) => r3(Math.min(1, Math.max(0, x))));
  for (let i = 1; i < t.length; i++) if (t[i] < t[i - 1]) t[i] = t[i - 1];
  return { keyTimes: t.join(";"), values: values.join(";") };
}

/* One drawing. `prefix` keeps ids unique: the card's thumbnail and the
   lightbox copy are two drawings of the same workflow on one page. */
export function renderSvg(wf, prefix) {
  const { pos, W, H, depth, maxDepth } = layout(wf);
  const cycle = Math.max(1, maxDepth) * FLOW_STEP + HOLD;
  const drawn = (maxDepth + 1) * DRAW_STEP + 0.5;   // flow starts once it has drawn itself
  const slot = (d) => (d * FLOW_STEP) / cycle;

  /* Route labels go on their OWN layer, above every wire. Emitted beside their
     own path, a label was struck through by whichever wire was drawn after it
     ("Partial Response", "on error"), and on a straight vertical wire it sat
     exactly where the signal travels. */
  const labels = [];
  const edges = wf.edges.map((e, i) => {
    const [a, z, label] = e;
    const A = pos.get(a), B = pos.get(z);
    if (!A || !B) throw new Error(wf.key + ": edge " + a + "->" + z + " names a step that does not exist");
    const da = depth.get(a), dz = depth.get(z);
    const id = `${prefix}-e${i}`;
    if (isBack(e)) {
      const out = Math.max(A.x, B.x) + NODE_W + BOW;
      if (label) labels.push(`<text class="wl" style="--d:${r3(da * DRAW_STEP + 0.3)}s" x="${out - 4}" y="${(A.y + B.y) / 2 + NODE_H / 2 + 3}" text-anchor="end">${esc(label)}</text>`);
      return `<path class="we is-loop" id="${id}" pathLength="1" style="--d:${r3(da * DRAW_STEP + 0.3)}s;--len:${r3(DRAW_STEP * 2)}s" d="${loopD(A, B)}"/>`;
    }
    if (label) {
      const straight = Math.abs(A.x - B.x) < 1;
      /* a straight wire gets its label BESIDE it, a curved one at its middle */
      const lx = straight ? A.x + NODE_W / 2 + 7 : (A.x + B.x) / 2 + NODE_W / 2;
      labels.push(`<text class="wl" style="--d:${r3(da * DRAW_STEP + 0.2)}s" x="${lx}" y="${(A.y + NODE_H + B.y) / 2 + 3}" text-anchor="${straight ? "start" : "middle"}">${esc(label)}</text>`);
    }
    return `<path class="we" id="${id}" pathLength="1" style="--d:${r3(da * DRAW_STEP + 0.12)}s;--len:${r3((dz - da) * DRAW_STEP)}s" d="${pathD(A, B)}"/>`;
  }).join("\n    ");

  /* the packets: one per forward wire, all on the drawing's single clock. A
     loop gets no packet - it has no place in the one-way story from trigger to
     end, and its dashed curve already says "round again". */
  const packets = wf.edges.map((edge, i) => {
    if (isBack(edge)) return "";
    const [a, z] = edge;
    const s0 = slot(depth.get(a)), s1 = slot(depth.get(z));
    const e = 0.012;
    const move = keys([0, s0, s1, 1], [0, 0, 1, 1]);
    const fade = keys([0, s0, s0 + e, s1 - e, s1, 1], [0, 0, 1, 1, 0, 0]);
    return `<circle class="wpk" r="5.5" opacity="0">
      <animateMotion dur="${r3(cycle)}s" begin="${r3(drawn)}s" repeatCount="indefinite" calcMode="linear"
        keyPoints="${move.values}" keyTimes="${move.keyTimes}"><mpath href="#${prefix}-e${i}"/></animateMotion>
      <animate attributeName="opacity" dur="${r3(cycle)}s" begin="${r3(drawn)}s" repeatCount="indefinite"
        values="${fade.values}" keyTimes="${fade.keyTimes}"/>
    </circle>`;
  }).join("\n    ");

  /* pings: every trigger as the cycle starts, every END as its packet lands */
  const pings = Object.entries(wf.nodes).map(([k, n]) => {
    const isStart = n.kind === "trigger";
    /* a failure ending is still an ending: the packet lands there too */
    const isEnd = n.kind === "end" || n.kind === "fail";
    if (!isStart && !isEnd) return "";
    const p = pos.get(k);
    const at = isStart ? 0 : slot(depth.get(k));
    const w = 0.09;
    const sw = keys([0, at, at + w, 1], [0, 0, 16, 16]);
    /* HOLD at zero until the instant it fires. With only [0, at] as keys,
       SMIL interpolates linearly between them and END fades in across the
       whole cycle instead of flashing when the packet lands - which is what
       the first version did, measured at 0.05 -> 0.80 over three seconds. */
    const op = keys([0, at - 0.002, at, at + w, 1], [0, 0, 0.85, 0, 0]);
    return `<rect class="wping ${isStart ? "is-start" : "is-end"}" x="${p.x}" y="${p.y}" width="${NODE_W}" height="${NODE_H}" rx="9" opacity="0">
      <animate attributeName="stroke-width" dur="${r3(cycle)}s" begin="${r3(drawn)}s" repeatCount="indefinite" values="${sw.values}" keyTimes="${sw.keyTimes}"/>
      <animate attributeName="opacity" dur="${r3(cycle)}s" begin="${r3(drawn)}s" repeatCount="indefinite" values="${op.values}" keyTimes="${op.keyTimes}"/>
    </rect>`;
  }).join("");

  const nodes = Object.entries(wf.nodes).map(([k, node]) => {
    const p = pos.get(k);
    const ls = wrap(node.label);
    const top = p.y + (ls.length > 1 ? 19 : 27);
    return `<g class="wn k-${node.kind || "action"}" style="--d:${r3(depth.get(k) * DRAW_STEP)}s">
      <rect class="wnb" x="${p.x}" y="${p.y}" width="${NODE_W}" height="${NODE_H}" rx="9"/>
      ${ls.map((l, i) => `<text class="wnt" x="${p.x + NODE_W / 2}" y="${top + i * 13}" text-anchor="middle">${esc(l)}</text>`).join("")}
    </g>`;
  }).join("\n    ");

  return `<svg class="wsvg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="--w:${W}px" role="img"
    aria-label="${esc(wf.name)}: ${Object.keys(wf.nodes).length} steps">
    ${edges}
    ${labels.join("\n    ")}
    ${pings}
    ${nodes}
    ${packets}
  </svg>`;
}

export function renderWorkflow(wf, n) {
  const steps = Object.keys(wf.nodes).length;
  return `<article class="wf" id="wf-${wf.key}">
      <div class="wfc">
        <header class="wfh">
          <span class="wfn">${String(n).padStart(2, "0")}</span>
          <h3 class="wft"><span>${esc(wf.name)}</span></h3>
        </header>
        <p class="wfd">${esc(wf.does)}</p>
        ${wf.note ? `<p class="wfw"><b>Worth noticing.</b> ${esc(wf.note)}</p>` : ""}
        ${wf.partial ? `<p class="wfp"><b>About this drawing.</b> ${esc(wf.partial)}</p>` : ""}
        <div class="wff">
          <span class="wfs">${steps} steps</span>
          ${wf.deep ? `<a class="wfdeep" href="${wf.deep}">Walk through it <i aria-hidden="true">&rarr;</i></a>` : ""}
        </div>
      </div>
      <button class="wfthumb" type="button" data-open="${wf.key}"
        aria-label="Enlarge the ${esc(wf.name)} workflow">
        ${renderSvg(wf, "t-" + wf.key)}
        <span class="wfzoom" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6"/></svg>Click to enlarge</span>
      </button>
      <template id="wfx-${wf.key}" data-name="${esc(wf.name)}" data-does="${esc(wf.does)}">${renderSvg(wf, "f-" + wf.key)}</template>
    </article>`;
}

/* One lightbox for the whole page. A native <dialog> gives Esc, a focus trap
   and a backdrop for free, which is three things a hand-rolled overlay gets
   wrong at least one of. */
export const workflowDialog = (kicker) => `
<dialog class="wfx" id="wfx" aria-labelledby="wfx-name">
  <div class="wfxh">
    <div>
      <p class="wfxk">${esc(kicker)}</p>
      <h2 id="wfx-name" class="wft"><span></span></h2>
      <p class="wfxd"></p>
    </div>
    <div class="wfxa">
      <button class="wfxb" type="button" data-replay>Replay</button>
      <button class="wfxb wfxx" type="button" data-close aria-label="Close">&times;</button>
    </div>
  </div>
  <div class="wfxbody"></div>
</dialog>`;

export const WORKFLOW_CSS = `
/* ── the card: words on the left, the moving picture on the right ── */
.wf{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:clamp(16px,2.4vw,28px);
  align-items:center;background:var(--card);border:3px solid var(--ink);border-radius:18px;
  box-shadow:6px 6px 0 0 var(--ink);padding:clamp(16px,2.2vw,24px);margin:0 0 18px}
@media(max-width:860px){ .wf{grid-template-columns:minmax(0,1fr)} }
.wfc{display:flex;flex-direction:column;gap:10px;min-width:0}
.wfh{display:flex;align-items:flex-start;gap:12px}
.wfn{font-family:var(--f-mono);font-weight:700;font-size:11px;letter-spacing:.1em;flex:none;
  background:var(--field);color:var(--pop);border:2.5px solid var(--ink);border-radius:9px;padding:6px 9px}
/* his name, under a highlighter stripe: the first thing a prospect reads */
.wft{font-family:var(--f-disp);font-weight:900;font-size:clamp(20px,2.5vw,27px);
  letter-spacing:-.025em;line-height:1.18;margin:0}
.wft span{background:linear-gradient(transparent 60%, var(--pop) 60%, var(--pop) 92%, transparent 92%);
  padding:0 4px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.wfd{margin:0 !important;font-size:15px !important;line-height:1.6 !important;color:var(--ink)}
.wfw{margin:0 !important;padding:10px 12px;background:rgba(245,213,71,.2);
  border-left:4px solid var(--pop);border-radius:0 8px 8px 0;font-size:13.5px !important;
  line-height:1.55 !important;color:var(--muted)}
.wfw b{color:var(--ink)}
.wfp{margin:0 !important;padding:9px 12px;background:#F4F3EC;border-left:4px solid var(--hair);
  border-radius:0 8px 8px 0;font-size:12.5px !important;line-height:1.5 !important;color:var(--muted)}
.wfp b{color:var(--ink)}
.wfs{font-family:var(--f-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}

/* ── the image: the whole workflow, shrunk to fit, clickable ── */
.wfthumb{position:relative;display:grid;place-items:center;width:100%;min-height:220px;
  max-height:380px;padding:18px 14px 44px;background:var(--paper);border:2.5px solid var(--ink);
  border-radius:14px;cursor:zoom-in;overflow:hidden;
  background-image:radial-gradient(circle,rgba(11,14,28,.09) 1px,transparent 1.2px);
  background-size:16px 16px;
  transition:transform .2s var(--ease),box-shadow .2s var(--ease)}
.wfthumb:hover{transform:translate(-2px,-2px);box-shadow:5px 5px 0 0 var(--ink)}
.wfthumb:active{transform:translate(1px,1px);box-shadow:1px 1px 0 0 var(--ink)}
.wfthumb:focus-visible{outline:3px solid var(--field);outline-offset:4px}
.wfthumb .wsvg{display:block;width:auto;height:auto;max-width:100%;max-height:310px}
.wfzoom{position:absolute;right:10px;bottom:10px;display:inline-flex;align-items:center;gap:6px;
  font-family:var(--f-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;
  background:var(--pop);color:var(--ink);border:2px solid var(--ink);border-radius:99px;padding:5px 11px;
  transition:transform .2s var(--ease)}
.wfzoom svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round}
.wfthumb:hover .wfzoom{transform:translateY(-2px)}

/* ── the drawing itself ── */
.wnb{fill:var(--card);stroke:var(--ink);stroke-width:2.5}
.wnt{font-family:var(--f-mono);font-size:10.5px;fill:var(--ink)}
.k-trigger .wnb{fill:var(--field)}
.k-trigger .wnt{fill:var(--pop)}
.k-decision .wnb{fill:#EFEEE6}
.k-wait .wnb{fill:#F7F6EF}
.k-fail .wnb{stroke:var(--bad)}
.k-end .wnb{fill:var(--pop);stroke-width:3}
.we{stroke:var(--ink);stroke-width:2;fill:none;opacity:.45}
/* a paper halo, so a label reads cleanly even where a wire crosses it */
.wl{font-family:var(--f-mono);font-size:9px;fill:var(--muted);paint-order:stroke;
  stroke:var(--paper);stroke-width:4px;stroke-linejoin:round}
.wpk{fill:var(--pop);stroke:var(--ink);stroke-width:2.2}
.wping{fill:none;stroke:var(--pop)}
.wping.is-start{stroke:var(--field)}
/* a loop is dashed, so it never reads as the main road */
.we.is-loop{stroke-dasharray:.04 .03;opacity:.55}
.armed .we.is-loop{stroke-dasharray:.04 .03;stroke-dashoffset:0;opacity:0}
.go .we.is-loop{animation:wl-in .5s ease forwards;animation-delay:var(--d)}
.k-fail .wnt{fill:var(--ink)}
.wff{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.wfdeep{display:inline-flex;align-items:center;gap:7px;font-family:var(--f-mono);font-size:10.5px;
  letter-spacing:.1em;text-transform:uppercase;color:var(--paper);background:var(--field);
  border:2px solid var(--ink);border-radius:99px;padding:6px 12px;text-decoration:none;
  transition:transform .16s var(--ease)}
.wfdeep i{font-style:normal;transition:transform .16s var(--ease)}
.wfdeep:hover i{transform:translateX(3px)}
.wfdeep:active{transform:translateY(1px)}
.wfdeep:focus-visible{outline:3px solid var(--pop);outline-offset:3px}

/* ── the motion. Only a drawing that has been ARMED by script starts hidden,
   so with no script, or before it runs, every workflow is fully visible. ── */
.armed .wn,.armed .wl{opacity:0}
.armed .we{stroke-dasharray:1;stroke-dashoffset:1}
.go .wn{animation:wn-in .5s var(--ease) forwards;animation-delay:var(--d)}
.go .wl{animation:wl-in .4s ease forwards;animation-delay:var(--d)}
.go .we{animation:we-draw var(--len) ease-in-out forwards;animation-delay:var(--d)}
.go .k-end{animation:wn-in .5s var(--ease) forwards,end-glow 1.1s ease-out forwards;
  animation-delay:var(--d),calc(var(--d) + .35s)}
.wn{transform-box:fill-box;transform-origin:center}
@keyframes wn-in{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}
@keyframes wl-in{from{opacity:0}to{opacity:1}}
@keyframes we-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes end-glow{0%{filter:drop-shadow(0 0 0 rgba(245,213,71,0))}
  40%{filter:drop-shadow(0 0 10px rgba(245,213,71,.95))}100%{filter:drop-shadow(0 0 0 rgba(245,213,71,0))}}

/* ── the lightbox ── */
dialog.wfx{width:min(1180px,94vw);max-width:none;max-height:92vh;padding:0;margin:auto;
  border:3px solid var(--ink);border-radius:20px;background:var(--paper);color:var(--ink);
  box-shadow:10px 10px 0 0 var(--ink);overflow:hidden;display:none;flex-direction:column}
dialog.wfx[open]{display:flex;animation:wfx-in .32s var(--ease)}
dialog.wfx::backdrop{background:rgba(11,14,28,.74);backdrop-filter:blur(4px)}
@keyframes wfx-in{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
.wfxh{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;
  padding:18px 22px 16px;background:var(--card);border-bottom:3px solid var(--ink);flex:none}
.wfxk{margin:0 0 6px !important;font-family:var(--f-mono);font-size:10px !important;letter-spacing:.16em;
  text-transform:uppercase;color:var(--muted)}
.wfxd{margin:8px 0 0 !important;font-size:14.5px !important;line-height:1.55 !important;color:var(--muted);max-width:70ch}
.wfxa{display:flex;gap:8px;flex:none}
.wfxb{font-family:var(--f-mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;
  background:var(--paper);color:var(--ink);border:2.5px solid var(--ink);border-radius:99px;
  padding:8px 14px;cursor:pointer;box-shadow:3px 3px 0 0 var(--ink);
  transition:transform .14s var(--ease),box-shadow .14s var(--ease),background .14s var(--ease)}
.wfxb:hover{background:var(--pop)}
.wfxb:active{transform:translate(2px,2px);box-shadow:1px 1px 0 0 var(--ink)}
.wfxb:focus-visible{outline:3px solid var(--field);outline-offset:3px}
.wfxx{font-size:20px;line-height:1;padding:5px 12px}
.wfxbody{overflow:auto;padding:26px 20px 34px;flex:1;
  background-image:radial-gradient(circle,rgba(11,14,28,.09) 1px,transparent 1.2px);background-size:18px 18px}
/* An enlargement should be LARGER: up to 1.5x its drawn size where the
   lightbox has room, never below its drawn size, and a wide one simply fills
   the width. A narrow workflow at 1x sat small in a wide box. */
.wfxbody .wsvg{display:block;margin:0 auto;max-width:none;height:auto;
  width:min(calc(var(--w) * 1.5), 100%);min-width:var(--w)}
html.wfx-open{overflow:hidden}

@media(max-width:560px){
  .wfxh{padding:14px 14px 12px}
  .wfxbody{padding:18px 10px 26px}
  dialog.wfx{width:100vw;max-height:100dvh;height:100dvh;border-radius:0;border-width:0;box-shadow:none}
}
@media(prefers-reduced-motion:reduce){
  .wfthumb,.wfzoom,.wfxb{transition:none}
  dialog.wfx[open]{animation:none}
  .wpk,.wping{display:none}
}`;

export const WORKFLOW_JS = `
(function(){
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Arm a drawing (hide it) and later set it going (draw, then flow). Both the
     CSS draw-in and the SMIL flow restart from zero, so every play is the
     whole story from the trigger to END. */
  function arm(box){ box.classList.remove("go"); box.classList.add("armed");
    var s = box.querySelector(".wsvg"); if (s && s.pauseAnimations){ s.pauseAnimations(); s.setCurrentTime(0); } }
  function go(box){ var s = box.querySelector(".wsvg");
    void box.offsetWidth; box.classList.add("go");
    if (s && s.setCurrentTime){ s.setCurrentTime(0); s.unpauseAnimations(); } }

  var thumbs = [].slice.call(document.querySelectorAll(".wfthumb"));
  if (reduced){
    thumbs.forEach(function(t){ var s = t.querySelector(".wsvg"); if (s && s.pauseAnimations) s.pauseAnimations(); });
  } else if ("IntersectionObserver" in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting){ go(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.35 });
    thumbs.forEach(function(t){ arm(t); io.observe(t); });
  }

  var dlg = document.getElementById("wfx");
  if (!dlg || !dlg.showModal) return;
  var body = dlg.querySelector(".wfxbody");
  var nameEl = dlg.querySelector("#wfx-name span");
  var doesEl = dlg.querySelector(".wfxd");
  var current = null, opener = null;

  function load(key){
    var tpl = document.getElementById("wfx-" + key);
    if (!tpl) return;
    current = key;
    nameEl.textContent = tpl.getAttribute("data-name");
    doesEl.textContent = tpl.getAttribute("data-does");
    body.innerHTML = tpl.innerHTML;
    body.scrollTop = 0;
    var s = body.querySelector(".wsvg");
    if (reduced){ if (s && s.pauseAnimations) s.pauseAnimations(); return; }
    arm(body);
    requestAnimationFrame(function(){ go(body); });
  }

  thumbs.forEach(function(t){
    t.addEventListener("click", function(){
      opener = t;
      load(t.getAttribute("data-open"));
      document.documentElement.classList.add("wfx-open");
      dlg.showModal();
    });
  });
  function close(){ dlg.close(); }
  dlg.addEventListener("close", function(){
    document.documentElement.classList.remove("wfx-open");
    body.innerHTML = "";
    if (opener) opener.focus();
  });
  dlg.querySelector("[data-close]").addEventListener("click", close);
  dlg.querySelector("[data-replay]").addEventListener("click", function(){ if (current) load(current); });
  /* a click on the dimmed backdrop lands on the dialog element itself */
  dlg.addEventListener("click", function(e){ if (e.target === dlg) close(); });
})();`;
