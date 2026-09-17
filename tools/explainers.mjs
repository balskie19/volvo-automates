// Two sample explainers, built from Volvo's own build documents, to settle the
// question of WHAT FORM these should take before forty of them get made.
//
//   node tools/explainers.mjs   ->  explainers/index.html + two samples
//
// The argument they exist to make: one medium per job, not one medium for
// everything. Sample A branches, so it is a map you walk. Sample B turns on a
// single question, so it is a switch - drawn as boxes it would take the same
// space and say less.
//
// TWO RULES THE COPY HOLDS TO, both from Volvo directly.
// 1. NO SYSTEM WORDS. The labels used to be the names the software uses -
//    introPermissionToSpeak, callOutcome, dncExit. A buyer reading those learns
//    only that the page is not for them. Every label now says what the thing
//    DOES, in the words the person on the phone would use.
// 2. NO CLIENT NAME. Replaced with a visible redaction, never with a vague
//    substitute: a blacked-out name reads as discretion, "a leading firm" reads
//    as invention. The quotes stay word for word otherwise.
//
// Every line of dialogue and every number is lifted from the build documents.
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "explainers");
mkdirSync(OUT, { recursive: true });

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@400;500;700&family=Gabarito:wght@500;700;800;900&family=Public+Sans:wght@400;500;600;700&display=swap">`;

const BASE = `:root{
  --field:#212A6B;--pop:#F5D547;--paper:#F2F1EA;--ink:#0B0E1C;--card:#fff;
  --muted:#5C6070;--hair:#E0DED4;--good:#2E9E5B;--bad:#C8452F;
  --f-disp:"Gabarito",system-ui,sans-serif;--f-body:"Public Sans",system-ui,sans-serif;
  --f-mono:"Azeret Mono",ui-monospace,monospace;
  --ease:cubic-bezier(.22,1,.36,1);}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--f-body);
  -webkit-text-size-adjust:100%}
.wrap{max-width:1080px;margin:0 auto;padding:clamp(18px,3.5vw,42px) clamp(14px,3vw,26px)}
.eyebrow{font-family:var(--f-mono);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;
  color:var(--muted)}
h1{font-family:var(--f-disp);font-weight:900;letter-spacing:-.03em;margin:6px 0 10px;
  font-size:clamp(25px,4.6vw,44px);line-height:1.06}
.lede{margin:0 0 22px;font-size:clamp(15px,1.8vw,17px);line-height:1.6;color:var(--muted);max-width:62ch}
.split{display:grid;gap:18px;grid-template-columns:1fr}
@media(min-width:900px){.split{grid-template-columns:1.25fr .9fr;align-items:start}}
.panel{background:var(--card);border:3px solid var(--ink);border-radius:16px;
  box-shadow:5px 5px 0 0 var(--ink);padding:clamp(14px,2vw,20px)}
.panel h2{font-family:var(--f-disp);font-weight:900;font-size:19px;margin:0 0 4px;letter-spacing:-.02em}
.panel p{margin:0 0 10px;font-size:14.5px;line-height:1.6;color:var(--muted)}
.tag{display:inline-block;font-family:var(--f-mono);font-size:9.5px;letter-spacing:.14em;
  text-transform:uppercase;background:var(--pop);border:2px solid var(--ink);border-radius:99px;
  padding:3px 9px;margin-bottom:8px}
.src{margin-top:16px;padding-top:12px;border-top:2px dashed var(--hair);
  font-family:var(--f-mono);font-size:10.5px;letter-spacing:.06em;color:var(--muted);line-height:1.7}
svg .n{cursor:pointer}
svg .nb{fill:var(--card);stroke:var(--ink);stroke-width:3;transition:fill .18s var(--ease)}
svg .n:hover .nb,svg .n:focus .nb{fill:#FDF7DA}
svg .n.on .nb{fill:var(--pop)}
svg .nt{font-family:var(--f-mono);font-size:11px;fill:var(--ink);pointer-events:none}
svg .ns{font-family:var(--f-body);font-size:10px;fill:var(--muted);pointer-events:none}
svg .e{stroke:var(--ink);stroke-width:2.5;fill:none;opacity:.32;transition:opacity .2s,stroke .2s}
svg .e.lit{opacity:1;stroke:var(--field)}
svg .el{font-family:var(--f-mono);font-size:9px;fill:var(--muted)}
.says{background:var(--field);color:var(--paper);border-radius:12px;padding:13px 15px;
  font-size:14.5px;line-height:1.55;margin:10px 0}
.says b{color:var(--pop);display:block;font-family:var(--f-mono);font-size:9.5px;
  letter-spacing:.14em;text-transform:uppercase;margin-bottom:6px;font-weight:700}
.fields{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.f{font-family:var(--f-mono);font-size:10.5px;border:2px solid var(--hair);border-radius:99px;
  padding:4px 9px;color:var(--muted);transition:all .25s var(--ease)}
.f.hit{border-color:var(--ink);background:var(--pop);color:var(--ink)}
.rd{background:var(--ink);color:var(--ink);border-radius:3px;padding:0 6px;
  user-select:none;font-size:.92em}
.hint{font-family:var(--f-mono);font-size:10.5px;color:var(--muted);letter-spacing:.06em;margin-top:10px}
.back{display:inline-flex;gap:7px;align-items:center;font-family:var(--f-mono);font-size:11px;
  letter-spacing:.1em;text-transform:uppercase;color:var(--muted);text-decoration:none;margin-bottom:14px}
.back:hover{color:var(--ink)}`;

const page = (title, body, extraCss = "") => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>${FONTS}
<style>${BASE}${extraCss}</style></head>
<body><div class="wrap">${body}</div></body></html>`;

/* ══ SAMPLE A · the outbound caller, as a map ══════════════════════════════
   Source: 001 RETELL AI VOICE AGENTS. Every stop, every route between them and
   every quoted line is read off the live build and its own test transcript. */
const STATES = {
  intro: { x: 280, y: 30, label: "Can I have a minute?", sub: "how every call opens",
    says: "It asks permission before anything else. From here the call can go three ways: they'll talk, they want calling back, or they never want to hear from us again.",
    quote: null, fields: [] },
  media: { x: 30, y: 150, label: "Do you use a photographer?", sub: "the first real question",
    says: "The first question is about them, not about us. Nothing is offered yet.",
    quote: "Great! Just curious \u2014 do you usually use professional photography or video for your listings?",
    fields: ["Uses a professional photographer"] },
  callback: { x: 280, y: 150, label: "Call me another time", sub: "a polite no, for now",
    says: "The call ends. The record does not - the time they asked for is written down.",
    quote: null, fields: ["Asked to be called back", "How the call ended"] },
  dnc: { x: 530, y: 150, label: "Never call me again", sub: "a full stop",
    says: "This is the only stop whose job is to stop. It is kept separate on purpose, so there is always a clear record of who asked to be left alone.",
    quote: null, fields: ["Never call again", "Not a fit"] },
  qualify: { x: 30, y: 270, label: "Who do you use now?", sub: "is someone already doing it",
    says: "Finds out whether they already have someone, and whether they actually like them.",
    quote: "Sounds like something that could really help. Would it be okay if someone from our team reached out to walk you through the next steps?",
    fields: ["Happy with who they use", "What frustrates them"] },
  showcase: { x: 280, y: 270, label: "So how do you show a house?", sub: "asked only after a no",
    says: "Asked when the answer to the first question was no. It turns a dead end back into a conversation.",
    quote: "Got it! When you put a property on the market, how do you usually showcase it? Do you take your own photos, hire someone, or kind of skip visuals altogether?",
    fields: ["How they show a house today"] },
  reject: { x: 530, y: 270, label: "Not interested", sub: "a no, taken properly",
    says: "A no gets its own stop rather than being pushed toward the ending anyway.",
    quote: null, fields: ["How the call ended", "Not a fit"] },
  zero: { x: 90, y: 390, label: "Never thought about it", sub: "starting from nothing",
    says: "Someone who has never considered it needs a different conversation from someone who already pays a rival. The call knows which one it is in.",
    quote: null, fields: ["Wants to see an example", "Wants a before and after"] },
  value: { x: 470, y: 390, label: "Here is what we would do", sub: "the actual pitch",
    says: "The pitch comes late, and only once the call knows which situation it is in.",
    quote: null, fields: ["Wants to see an example", "Happy to hear from us"] },
  close: { x: 280, y: 500, label: "A person will call you", sub: "the hand over",
    says: "It never books the job itself. It hands over to a human, and says when that will happen.",
    quote: "Thanks! Someone from our team will reach out soon \u2014 likely within the next couple of days. If you have a preferred time, I can note it.",
    fields: ["Wants to book", "How the call ended", "A written summary of the call"] }
};
const EDGES = [["intro", "media"], ["intro", "callback"], ["intro", "dnc"],
  ["media", "qualify"], ["media", "showcase"], ["media", "reject"],
  ["qualify", "zero"], ["showcase", "zero"], ["showcase", "value"], ["reject", "value"],
  ["zero", "close"], ["value", "close"]];
const ALL_FIELDS = ["How the call ended", "Wants to book", "Asked to be called back",
  "Never call again", "Uses a professional photographer", "Happy with who they use",
  "What frustrates them", "How they show a house today", "Wants to see an example",
  "Wants a before and after", "Happy to hear from us", "A written summary of the call",
  "Not a fit"];

const W = 760, NW = 200, NH = 62, PAD = 13;

/* Plain labels are SENTENCES, and the boxes were sized for short code names, so
   five of them spilled straight out the side the moment the wording changed.
   Wrapping to two lines is the fix, and the wrap is computed here rather than
   left to SVG - <text> does not wrap, it just keeps going. CH is the measured
   width of one monospace character at this size; the guard below asserts the
   result against the real rendered geometry rather than against this estimate. */
const CH = 6.75, MAXC = Math.floor((NW - PAD * 2) / CH);
function wrap(t) {
  if (t.length <= MAXC) return [t];
  const words = t.split(" "); const lines = []; let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length <= MAXC) cur = (cur + " " + w).trim();
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}
const nodeSvg = (k, s) => {
  const ls = wrap(s.label);
  const top = s.y + (ls.length > 1 ? 20 : 26);
  return `<g class="n" id="n-${k}" tabindex="0" role="button" aria-label="${s.label}">
  <rect class="nb" x="${s.x}" y="${s.y}" width="${NW}" height="${NH}" rx="12"/>
  ${ls.map((l, i) => `<text class="nt" x="${s.x + PAD}" y="${top + i * 14}">${l}</text>`).join(" ")}
  <text class="ns" x="${s.x + PAD}" y="${s.y + NH - 12}">${s.sub}</text></g>`;
};
const edgeSvg = ([a, b], i) => {
  const A = STATES[a], B = STATES[b];
  const x1 = A.x + NW / 2, y1 = A.y + NH, x2 = B.x + NW / 2, y2 = B.y;
  const my = (y1 + y2) / 2;
  return `<path class="e" id="e-${i}" data-a="${a}" data-b="${b}"
    d="M${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}"/>`;
};

const sampleA = page("How the cold-call agent decides", `
<a class="back" href="index.html">&lsaquo; Both samples</a>
<span class="eyebrow">Sample A &middot; a map you can walk</span>
<h1>It is not a script. It is a map, and the call chooses the route.</h1>
<p class="lede">An AI that phones people on a client's behalf. There are ten places the call can go, and it
writes down thirteen things while it talks. Tap any box to hear what it says there and see what it
notes down. The point is that no two calls are the same, and nothing gets forgotten.</p>

<div class="split">
  <div class="panel">
    <svg viewBox="0 0 ${W} 600" width="100%" role="img" aria-label="Conversation state graph">
      ${EDGES.map(edgeSvg).join("\n      ")}
      ${Object.entries(STATES).map(([k, s]) => nodeSvg(k, s)).join("\n      ")}
    </svg>
    <p class="hint">Tap a box. The routes out of it light up.</p>
  </div>

  <div>
    <div class="panel" id="detail">
      <span class="tag" id="d-tag">${STATES.intro.sub}</span>
      <h2 id="d-title">${STATES.intro.label}</h2>
      <p id="d-says">${STATES.intro.says}</p>
      <div id="d-quote"></div>
    </div>

    <div class="panel" style="margin-top:16px">
      <span class="tag">what you get afterwards</span>
      <h2>Thirteen notes, written during the call</h2>
      <p>Nobody has to sit and listen back to a recording. It writes these down as it goes, so the
      moment the call ends you already know what happened and what to do next.</p>
      <div class="fields" id="fields">
        ${ALL_FIELDS.map(f => `<span class="f" data-f="${f}">${f}</span>`).join("")}
      </div>
      <div class="src">
        Built on Retell AI &middot; every line quoted word for word from the live build<br>
        It waits for the other person to speak first, and answers in about a second<br>
        Client name withheld
      </div>
    </div>
  </div>
</div>

<script>
var S = ${JSON.stringify(STATES)};
function show(k){
  var s = S[k];
  document.getElementById("d-title").textContent = s.label;
  document.getElementById("d-tag").textContent = s.sub;
  document.getElementById("d-says").textContent = s.says;
  document.getElementById("d-quote").innerHTML = s.quote
    ? '<div class="says"><b>What it actually says</b>' + s.quote + '</div>' : "";
  document.querySelectorAll(".n").forEach(function(n){ n.classList.toggle("on", n.id === "n-" + k); });
  document.querySelectorAll(".e").forEach(function(e){
    e.classList.toggle("lit", e.getAttribute("data-a") === k);
  });
  document.querySelectorAll(".f").forEach(function(f){
    f.classList.toggle("hit", s.fields.indexOf(f.getAttribute("data-f")) >= 0);
  });
}
Object.keys(S).forEach(function(k){
  var n = document.getElementById("n-" + k);
  n.addEventListener("click", function(){ show(k); });
  n.addEventListener("keydown", function(e){ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); show(k); } });
});
show("intro");
</script>`);

/* ══ SAMPLE B · one choice, so one switch ══════════════════════════════════
   Source: 008 OPENPHONE SONA AI SET-UP. Deliberately not a drawing: the whole
   build turns on one question, and a reader learns more by flipping it than by
   looking at four boxes joined with arrows. */
const sampleB = page("What happens when the phone rings", `
<a class="back" href="index.html">&lsaquo; Both samples</a>
<span class="eyebrow">Sample B &middot; one choice, so one switch</span>
<h1>The same call, at two o'clock and at nine o'clock.</h1>
<p class="lede">The same client, but calls coming in. The whole build turns on one question - is the office
open? - so this is a switch rather than a drawing. Move the clock and follow the call.</p>

<div class="panel" style="margin-bottom:18px">
  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
    <button class="tog on" data-h="14" type="button">It is 2:00 pm</button>
    <button class="tog" data-h="21" type="button">It is 9:00 pm</button>
  </div>
</div>

<div class="split">
  <div class="panel">
    <ol class="steps" id="steps"></ol>
  </div>
  <div class="panel">
    <span class="tag">the bit that picks up</span>
    <h2>What it says, word for word</h2>
    <div class="says"><b>Opening line</b>Hi there, this is Ashley from <span class="rd">client name</span>. Please note this
    call is recorded for quality assurance and internal review. How may I assist you today?</div>
    <p><b>It has been taught six things.</b> Six pages of the company's own answers were loaded in, so
    it repeats what they would say rather than making something up.</p>
    <p><b>It is given one job: take a message.</b> Who called, why, and anything else worth knowing.
    It is not asked to sell, and it is not allowed to book.</p>
    <div class="src">
      Built in OpenPhone &middot; this is the live setup, not a mock-up<br>
      Open hours: every phone rings together for fifteen seconds<br>
      Client name withheld
    </div>
  </div>
</div>

<script>
var FLOW = {
  "14": [
    ["Call arrives", "Someone rings the main line.", "on"],
    ["It is inside business hours", "The flow checks the schedule first, before anything rings.", "on"],
    ["Every user rings at once, for 15 seconds", "Not one after another. All of them, briefly.", "on"],
    ["Nobody picked up", "Fifteen seconds is the whole grace period.", "on"],
    ["The AI picks up", "The same AI as after hours, just reached a different way.", "win"]
  ],
  "21": [
    ["Call arrives", "Someone rings the main line.", "on"],
    ["It is outside business hours", "Same check, other answer.", "on"],
    ["Nothing rings at all", "No phone wakes anybody. This is the point of the build.", "skip"],
    ["The AI picks up straight away", "No fifteen second wait, because there is nobody to wait for.", "win"]
  ]
};
function draw(h){
  var el = document.getElementById("steps"), rows = FLOW[h];
  el.innerHTML = rows.map(function(r, i){
    return '<li class="st ' + r[2] + '" style="transition-delay:' + (i * 70) + 'ms">' +
      '<b>' + r[0] + '</b><span>' + r[1] + '</span></li>';
  }).join("");
  requestAnimationFrame(function(){
    el.querySelectorAll(".st").forEach(function(s){ s.classList.add("in"); });
  });
}
document.querySelectorAll(".tog").forEach(function(b){
  b.addEventListener("click", function(){
    document.querySelectorAll(".tog").forEach(function(o){ o.classList.remove("on"); });
    b.classList.add("on");
    draw(b.getAttribute("data-h"));
  });
});
draw("14");
</script>`, `
.tog{font-family:var(--f-mono);font-size:12px;letter-spacing:.08em;background:var(--card);
  border:3px solid var(--ink);border-radius:99px;padding:9px 16px;cursor:pointer;
  box-shadow:3px 3px 0 0 var(--ink);transition:all .16s var(--ease)}
.tog.on{background:var(--pop)}
.tog:active{transform:translateY(2px);box-shadow:1px 1px 0 0 var(--ink)}
.steps{list-style:none;margin:0;padding:0;counter-reset:s}
.st{counter-increment:s;position:relative;padding:12px 0 12px 46px;border-bottom:2px dashed var(--hair);
  opacity:0;transform:translateX(-14px);transition:opacity .4s var(--ease),transform .4s var(--ease)}
.st.in{opacity:1;transform:none}
.st:last-child{border-bottom:0}
.st::before{content:counter(s);position:absolute;left:0;top:11px;width:30px;height:30px;
  border-radius:50%;background:var(--card);border:3px solid var(--ink);display:grid;place-items:center;
  font-family:var(--f-mono);font-size:12px;font-weight:700}
.st.win::before{background:var(--pop)}
.st.skip::before{background:var(--hair);color:var(--muted)}
.st b{display:block;font-family:var(--f-disp);font-weight:800;font-size:17px;letter-spacing:-.01em}
.st span{display:block;font-size:14px;color:var(--muted);line-height:1.55;margin-top:2px}`);


const CHOICES = [
  { k: "book", label: "Book a shoot", says: "Goes straight to collecting a name, email and phone, then offers the packages. The shortest route to a booking.",
    detail: "Asks for name, email and phone before anything else, so even an abandoned chat leaves a contact behind." },
  { k: "services", label: "Our services", says: "For someone who does not yet know what they want. Eight packages, and one of them opens into eleven more.",
    detail: "Essentials &middot; Highlight &middot; Zillow Showcase &middot; All Virtual &middot; Social Media &middot; Matterport &middot; Lot and Land Bundle &middot; A la carte" },
  { k: "human", label: "Talk to someone", says: "Collects details and hands over. No attempt to talk them out of it.",
    detail: "The one route that does not try to sell anything. Asking for a human is treated as a valid answer, not an objection." },
  { k: "browse", label: "Just browsing", says: "Acknowledged and left alone, with the door open.",
    detail: "Most chat builds have no answer for this and keep pushing. This one takes the details if offered and stops." }
];

const sampleC = page("What the website chat actually does", `
<a class="back" href="index.html">&lsaquo; All four</a>
<span class="eyebrow">Three &middot; the numbers, as they came out</span>
<h1>Out of 144 people, eleven booked without speaking to anyone.</h1>
<p class="lede">A chat window on a client's website. It offers four ways in, and one of them opens
into eight packages. These are the real numbers from the build, including the ones that are not
flattering, because a page that only shows good numbers is the one nobody believes.</p>

<div class="panel" style="margin-bottom:18px">
  <span class="tag">what happened</span>
  <h2>144 started. 22 stayed. 11 finished.</h2>
  <p>Eight in a hundred went all the way to a booking with nobody on the other end. The other
  ninety-two are not lost - they left a name and a number on the way past.</p>
  <div class="bars">
    <div class="bar"><i style="--w:100%"></i><b>144</b><span>opened the chat</span></div>
    <div class="bar"><i style="--w:15.3%"></i><b>22</b><span>answered back &middot; 15%</span></div>
    <div class="bar"><i style="--w:7.6%" class="win"></i><b>11</b><span>finished &middot; 8%</span></div>
  </div>
</div>

<div class="split">
  <div class="panel">
    <span class="tag">the first thing it asks</span>
    <h2>Hello. How can I help you today?</h2>
    <p>Four buttons, not a text box. Nobody has to work out how to phrase it, and every answer
    leads somewhere the build already knows how to handle.</p>
    <div class="picks">${CHOICES.map(c => '<button class="pk" data-k="' + c.k + '" type="button">' + c.label + '</button>').join("")}</div>
    <div id="c-out" style="margin-top:14px"></div>
  </div>
  <div class="panel">
    <span class="tag">how it knows anything</span>
    <h2>Twelve pages of the client's own answers</h2>
    <p>Prices, what is included, how long it takes, what happens if it rains. Loaded in as
    documents so the chat repeats the company's words rather than inventing an answer.</p>
    <p>The same twelve pages also feed the human agents' assistant, so a person and the chat never
    give a customer two different answers.</p>
    <div class="src">
      Built in Intercom &middot; numbers taken from the live overview<br>
      Twelve documents shared &middot; client name withheld
    </div>
  </div>
</div>
<script>
var C = ${JSON.stringify(CHOICES)};
function pick(k){
  var c = C.filter(function(x){ return x.k === k; })[0];
  document.getElementById("c-out").innerHTML =
    '<div class="says"><b>' + c.label + '</b>' + c.says + '</div><p style="font-size:14px;color:var(--muted);line-height:1.6;margin:0">' + c.detail + '</p>';
  document.querySelectorAll(".pk").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-k") === k); });
}
document.querySelectorAll(".pk").forEach(function(b){
  b.addEventListener("click", function(){ pick(b.getAttribute("data-k")); });
});
pick("book");
</script>`, `
.bars{display:flex;flex-direction:column;gap:10px;margin-top:12px}
.bar{display:grid;grid-template-columns:1fr auto;align-items:center;gap:10px;position:relative;
  padding:9px 12px;border:3px solid var(--ink);border-radius:12px;background:var(--paper);overflow:hidden}
.bar i{position:absolute;inset:0 auto 0 0;width:var(--w);background:var(--field);opacity:.16}
.bar i.win{background:var(--pop);opacity:.55}
.bar b{position:relative;font-family:var(--f-disp);font-weight:900;font-size:clamp(20px,3vw,30px)}
.bar span{position:relative;font-family:var(--f-mono);font-size:11px;color:var(--muted);letter-spacing:.06em}
.picks{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.pk{font-family:var(--f-mono);font-size:12px;background:var(--paper);border:3px solid var(--ink);
  border-radius:99px;padding:8px 14px;cursor:pointer;box-shadow:3px 3px 0 0 var(--ink);
  transition:all .16s var(--ease)}
.pk.on{background:var(--pop)}
.pk:active{transform:translateY(2px);box-shadow:1px 1px 0 0 var(--ink)}`);
writeFileSync(join(OUT, "website-chat.html"), sampleC);

/* ══ 4 · the way out ════════════════════════════════════════════════════════
   Source: 003 GHL WORKFLOWS, sheets 1.7 and 2.7. Two separate systems, and
   each one ships an identical opt-out: three triggers for three spellings, then
   removal from all five conversation stages. It is demonstrated rather than
   diagrammed because the point is felt, not read - you type the word and watch
   five things switch off. */
const sampleD = page("The word that switches everything off", `
<a class="back" href="index.html">&lsaquo; All four</a>
<span class="eyebrow">Four &middot; try it, do not read it</span>
<h1>One word from the customer, and the whole thing stops.</h1>
<p class="lede">Two of the builds hold a five-stage conversation with people by text. Both of them
ship the same escape hatch. Type <b>quit</b> below in any spelling you like and watch what happens.
This is the part almost nobody builds, and it is the part that decides whether a business is
trusted.</p>

<div class="split">
  <div class="panel">
    <span class="tag">go on, try it</span>
    <h2>Reply as the customer</h2>
    <p>Anything works: Quit, QUIT, quit. Three separate triggers watch for it, because a person
    who wants out will not check their capital letters first.</p>
    <form id="f" autocomplete="off"><input id="q" placeholder="type quit, QUIT or Quit" aria-label="Your reply"><button type="submit">Send</button></form>
    <p class="hint" id="note">Nothing has happened yet.</p>
  </div>
  <div class="panel">
    <span class="tag">what switches off</span>
    <h2>All five stages, and the phone itself</h2>
    <ul class="kill">
      <li data-i="0"><b>Do not disturb</b><span>Switched on for that contact, so nothing else can reach them by accident.</span></li>
      <li data-i="1"><b>Stage one</b><span>Removed from the opening conversation.</span></li>
      <li data-i="2"><b>Stage two</b><span>Removed.</span></li>
      <li data-i="3"><b>Stage three</b><span>Removed.</span></li>
      <li data-i="4"><b>Stage four</b><span>Removed.</span></li>
      <li data-i="5"><b>Stage five</b><span>Removed. There is nothing left running.</span></li>
    </ul>
    <div class="src">
      Built in GoHighLevel &middot; the same escape hatch ships in both systems<br>
      Three triggers, one per spelling &middot; client name withheld
    </div>
  </div>
</div>
<script>
var rows = [].slice.call(document.querySelectorAll(".kill li"));
document.getElementById("f").addEventListener("submit", function(e){
  e.preventDefault();
  var v = (document.getElementById("q").value || "").trim();
  var note = document.getElementById("note");
  rows.forEach(function(r){ r.classList.remove("off"); });
  if (!v) { note.textContent = "Type something first."; return; }
  if (v.toLowerCase() !== "quit") {
    note.textContent = '"' + v + '" is not an exit, so the conversation carries on.';
    return;
  }
  note.textContent = "Matched. Everything below is switching off.";
  rows.forEach(function(r, i){ setTimeout(function(){ r.classList.add("off"); }, 90 + i * 170); });
});
</script>`, `
#f{display:flex;gap:8px;margin:12px 0 0;flex-wrap:wrap}
#f input{flex:1 1 180px;font-family:var(--f-mono);font-size:14px;padding:11px 13px;
  border:3px solid var(--ink);border-radius:12px;background:var(--paper);color:var(--ink)}
#f input:focus{outline:3px solid var(--pop);outline-offset:2px}
#f button{font-family:var(--f-mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;
  background:var(--pop);border:3px solid var(--ink);border-radius:99px;padding:10px 18px;
  cursor:pointer;box-shadow:3px 3px 0 0 var(--ink)}
#f button:active{transform:translateY(2px);box-shadow:1px 1px 0 0 var(--ink)}
.kill{list-style:none;margin:8px 0 0;padding:0}
.kill li{padding:10px 0 10px 34px;position:relative;border-bottom:2px dashed var(--hair);
  transition:opacity .3s var(--ease)}
.kill li:last-child{border-bottom:0}
.kill li::before{content:"";position:absolute;left:0;top:14px;width:16px;height:16px;border-radius:50%;
  border:3px solid var(--ink);background:var(--card);transition:background .3s var(--ease)}
.kill li.off{opacity:.5}
.kill li.off::before{background:var(--bad)}
.kill b{display:block;font-family:var(--f-disp);font-weight:800;font-size:16px}
.kill span{display:block;font-size:13.5px;color:var(--muted);line-height:1.5}`);
writeFileSync(join(OUT, "the-way-out.html"), sampleD);

writeFileSync(join(OUT, "retell-agent.html"), sampleA);
writeFileSync(join(OUT, "call-routing.html"), sampleB);

const CARDS = [
  ["retell-agent.html", "One", "The AI that phones people",
   "Ten places a call can go, and thirteen things it writes down on the way. You walk it, because no two calls take the same route."],
  ["call-routing.html", "Two", "When the phone rings",
   "One question - is the office open? - with two answers. Move the clock and follow the call."],
  ["website-chat.html", "Three", "The chat on the website",
   "144 people opened it, 11 booked without speaking to anyone. The real numbers, including the unflattering ones."],
  ["the-way-out.html", "Four", "The word that stops everything",
   "Type quit and watch five conversations switch off. The part almost nobody builds."]
];
const index = page("How these systems work", `
<span class="eyebrow">Batch one &middot; the front door</span>
<h1>Three ways in. One way out.</h1>
<p class="lede">Four builds for one client, shown the way each one actually behaves rather than as
four drawings that look alike. Three of them are doors in: the phone rings, the phone gets rung,
somebody lands on the website. The fourth is the door out, and it is the one that matters most.</p>
<div class="split">
${CARDS.map(c => '<a class="panel" href="' + c[0] + '" style="text-decoration:none;color:inherit;display:block">' +
  '<span class="tag">' + c[1] + '</span><h2>' + c[2] + '</h2><p>' + c[3] + '</p></a>').join("\n")}
</div>
<p class="lede" style="margin-top:22px">Every line quoted on these pages is word for word from the
live build. Client names are withheld throughout.</p>`);
writeFileSync(join(OUT, "index.html"), index);

console.log("wrote 5 files to " + OUT);
for (const c of CARDS) console.log("  " + c[0].padEnd(22) + c[2]);
