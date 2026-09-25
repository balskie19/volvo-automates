// Volvo's face as the mouse cursor, and it reacts to what a lead is doing.
//
// Volvo: "Change the mouse cursor into my animated image that is interactive
// when a lead clicks into stuff into my portfolio." His REAL photograph, never
// a drawing (standing rule).
//
// What it does, all on transform/opacity only:
//   * a small photo disc follows the pointer on a spring, so it trails and
//     settles rather than being glued to it, and leans into the direction of
//     travel;
//   * a precise ink dot sits EXACTLY on the pointer - the disc is the
//     personality, the dot is what you aim with, so nothing gets harder to click;
//   * over anything clickable the disc grows, gets a lemon ring, and says what a
//     click will do: "Enlarge" on a workflow image, "Book a call" on a Calendly
//     link, "Open" on everything else (or the element's own data-cursor text);
//   * pressing squashes it, releasing throws a ring out from the click point;
//   * it fades when the pointer leaves the window.
//
// It only ever appears on a real mouse (pointer: fine + hover), never on a
// phone, and never for someone who asked the OS for reduced motion - they keep
// the normal cursor. The native cursor comes back over text fields, where
// people need the I-beam.
//
// It is kept out of the GoHighLevel embed: a cursor that hides the host site's
// own pointer is not something to paste into a client's page. The hub wraps it
// in <!-- cursor --> sentinels and tools/ghl.mjs strips that block.

export const cursorBlock = (img) => `<!-- cursor -->
<style>
@media (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference){
  html.vc-on, html.vc-on *{cursor:none !important}
  html.vc-on input, html.vc-on textarea, html.vc-on select, html.vc-on [contenteditable]{cursor:auto !important}
  .vc, .vc-dot, .vc-ring{position:fixed;left:0;top:0;pointer-events:none;z-index:2147483646;
    will-change:transform,opacity}
  /* the photo rides BESIDE the pointer, down and to the right, like a
     companion. Centred on it, his face covered the very thing being clicked
     and the aiming dot landed on his face. It grows away from the pointer too. */
  .vc{width:46px;height:46px;margin:16px 0 0 16px;opacity:0;transition:opacity .25s ease}
  .vc-face,.vc-halo{transform-origin:0 0}
  .vc-tag{left:0 !important;transform:translate(0,-4px) !important}
  .vc.is-hot .vc-tag{transform:translate(0,22px) !important}
  html.vc-on .vc.is-in{opacity:1}
  .vc-face{position:absolute;inset:0;border-radius:50%;border:3px solid #0B0E1C;
    background:#F5D547 url("${img}") center/cover no-repeat;
    box-shadow:3px 3px 0 0 #0B0E1C;
    transition:transform .32s cubic-bezier(.34,1.4,.5,1),border-color .2s ease,box-shadow .2s ease}
  /* the lemon halo that appears over a link */
  .vc-halo{position:absolute;inset:-7px;border-radius:50%;border:3px solid #F5D547;
    opacity:0;transform:scale(.7);transition:opacity .22s ease,transform .32s cubic-bezier(.34,1.4,.5,1)}
  .vc-tag{position:absolute;left:50%;top:100%;margin-top:12px;white-space:nowrap;
    font:700 10px/1 "Azeret Mono",ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;
    color:#0B0E1C;background:#F5D547;border:2px solid #0B0E1C;border-radius:99px;padding:6px 10px;
    opacity:0;transform:translate(-50%,-4px);transition:opacity .18s ease,transform .22s ease}
  .vc.is-hot .vc-face{transform:scale(1.42)}
  .vc.is-hot .vc-halo{opacity:1;transform:scale(1.42)}
  .vc.is-hot .vc-tag{opacity:1;transform:translate(-50%,10px)}
  .vc.is-down .vc-face{transform:scale(.82) !important;transition-duration:.08s}
  .vc.is-hot.is-down .vc-face{transform:scale(1.18) !important}
  /* idle: a small breath, so it reads as alive when the hand is still */
  .vc.is-idle .vc-face{animation:vc-breathe 2.4s ease-in-out infinite}
  @keyframes vc-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
  .vc-dot{width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#0B0E1C;
    box-shadow:0 0 0 2px #F5D547;opacity:0;transition:opacity .2s ease}
  html.vc-on .vc-dot.is-in{opacity:1}
  .vc-ring{width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:3px solid #F5D547;
    opacity:0}
  .vc-ring.go{animation:vc-ring .5s cubic-bezier(.2,.8,.3,1) forwards}
  @keyframes vc-ring{0%{opacity:.95;transform:var(--p) scale(.4)}100%{opacity:0;transform:var(--p) scale(3.4)}}
}
</style>
<script data-cursor>
(function(){
  var mq = window.matchMedia && matchMedia("(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)");
  if (!mq || !mq.matches) return;

  var d = document, root = d.documentElement;
  var el = d.createElement("div"); el.className = "vc"; el.setAttribute("aria-hidden", "true");
  el.innerHTML = '<span class="vc-halo"></span><span class="vc-face"></span><span class="vc-tag"></span>';
  var dot = d.createElement("div"); dot.className = "vc-dot"; dot.setAttribute("aria-hidden", "true");
  d.body.appendChild(el); d.body.appendChild(dot);
  var tag = el.querySelector(".vc-tag");
  root.classList.add("vc-on");

  /* spring toward the pointer; the lean comes from the horizontal velocity */
  var tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty, vx = 0, vy = 0;
  var idleT = null, seen = false;
  function frame(){
    var ax = (tx - x) * 0.2, ay = (ty - y) * 0.2;
    vx = (vx + ax) * 0.6; vy = (vy + ay) * 0.6;
    x += vx; y += vy;
    var lean = Math.max(-18, Math.min(18, vx * 1.1));
    el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + lean.toFixed(1) + "deg)";
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function idle(){ el.classList.add("is-idle"); }
  addEventListener("mousemove", function(e){
    tx = e.clientX; ty = e.clientY;
    dot.style.transform = "translate(" + tx + "px," + ty + "px)";
    if (!seen){ x = tx; y = ty; seen = true; }
    el.classList.add("is-in"); dot.classList.add("is-in");
    el.classList.remove("is-idle"); clearTimeout(idleT); idleT = setTimeout(idle, 1400);
  }, { passive: true });
  d.addEventListener("mouseleave", function(){ el.classList.remove("is-in"); dot.classList.remove("is-in"); });

  /* what a click here would do, in the lead's words */
  var HOT = 'a,button,[role="button"],summary,label,.wfthumb,.tc,[data-cursor]';
  function say(t){
    if (!t) return "";
    var own = t.getAttribute("data-cursor"); if (own) return own;
    if (t.classList.contains("wfthumb")) return "Enlarge";
    var href = t.getAttribute("href") || "";
    if (/calendly\\.com/.test(href)) return "Book a call";
    if (/^mailto:/.test(href)) return "Email me";
    if (/linkedin\\.com/.test(href)) return "LinkedIn";
    if (t.hasAttribute("data-replay")) return "Replay";
    if (t.hasAttribute("data-close")) return "Close";
    if (t.tagName === "BUTTON" && t.textContent.trim().length && t.textContent.trim().length < 18) return t.textContent.trim();
    return "Open";
  }
  d.addEventListener("mouseover", function(e){
    var t = e.target.closest && e.target.closest(HOT);
    if (t){ tag.textContent = say(t); el.classList.add("is-hot"); }
    else el.classList.remove("is-hot");
  });

  /* press squashes, release throws a ring out from exactly where it was clicked */
  addEventListener("mousedown", function(){ el.classList.add("is-down"); });
  addEventListener("mouseup", function(e){
    el.classList.remove("is-down");
    var r = d.createElement("div"); r.className = "vc-ring"; r.setAttribute("aria-hidden", "true");
    r.style.setProperty("--p", "translate(" + e.clientX + "px," + e.clientY + "px)");
    r.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
    (el.parentNode || d.body).appendChild(r); void r.offsetWidth; r.classList.add("go");
    setTimeout(function(){ r.remove(); }, 600);
  });
  /* a modal <dialog> renders in the top layer, above every z-index, so the
     cursor has to move INTO the open dialog or it would vanish behind it */
  var dlgs = d.querySelectorAll("dialog");
  dlgs.forEach(function(g){
    g.addEventListener("close", function(){ d.body.appendChild(el); d.body.appendChild(dot); });
    new MutationObserver(function(){ if (g.open){ g.appendChild(el); g.appendChild(dot); } })
      .observe(g, { attributes: true, attributeFilter: ["open"] });
  });
})();
</script>
<!-- /cursor -->`;
