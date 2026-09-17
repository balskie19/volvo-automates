// Build four openers as runnable previews, so the choice is made by watching
// rather than by reading a description.
//
//   node tools/openers.mjs        ->  openers/index.html + a.html .. d.html
//
// Each is a DIFFERENT MECHANIC, not a restyle of one idea - that was the note
// that produced this: matching a reference's palette while keeping its
// mechanic is still copying, because the mechanic is the identity.
//
//   A  Ledger     a log that writes itself, timestamps advancing   (live today)
//   B  Headline   one huge sentence whose last word keeps changing
//   C  Terminal   a session typing itself out, answers arriving
//   D  Stamp      the problems land, then get stamped shut
//
// All four share one shell: skippable by button, key or click; once per
// session on the real site; and never shown at all to anyone who asked not to
// be moved. The previews loop so they can be watched without reloading.
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "openers");
mkdirSync(OUT, { recursive: true });

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@400;500;700&family=Gabarito:wght@500;700;800;900&family=Public+Sans:wght@400;500;600;700&display=swap">`;

const BASE = `:root{
  --field:#212A6B; --pop:#F5D547; --paper:#F2F1EA; --ink:#0B0E1C; --muted:#5C6070;
  --f-disp:"Gabarito",system-ui,sans-serif;
  --f-body:"Public Sans",system-ui,sans-serif;
  --f-mono:"Azeret Mono",ui-monospace,monospace;
  --ease-out:cubic-bezier(.22,1,.36,1);
}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--field);font-family:var(--f-body);overflow:hidden}
.intro{position:fixed;inset:0;display:grid;place-content:center;justify-items:start;
  padding:clamp(16px,3vw,30px);background:var(--field)}
.eyebrow{font-family:var(--f-mono);font-size:10px;letter-spacing:.22em;text-transform:uppercase;
  color:var(--pop);opacity:0;transform:translateY(6px);
  transition:opacity .5s var(--ease-out),transform .5s var(--ease-out);margin-bottom:20px}
.go .eyebrow{opacity:.85;transform:none}
.skip{position:fixed;right:16px;bottom:14px;font-family:var(--f-mono);font-size:10px;
  letter-spacing:.16em;text-transform:uppercase;color:rgba(242,241,234,.5);background:none;
  border:0;padding:9px 12px;cursor:pointer;opacity:0;transition:opacity .4s var(--ease-out) .8s,color .2s}
.go .skip{opacity:1}
.skip:hover{color:var(--pop)}
.replay{position:fixed;left:16px;bottom:14px;font-family:var(--f-mono);font-size:10px;
  letter-spacing:.16em;text-transform:uppercase;color:var(--ink);background:var(--pop);
  border:2px solid var(--ink);border-radius:99px;padding:8px 15px;cursor:pointer;z-index:9}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:1ms !important;transition-duration:1ms !important;
    animation-delay:0ms !important;transition-delay:0ms !important;animation-iteration-count:1 !important}
}`;

/* ── A · Ledger ─────────────────────────────────────────────────────────── */
const ICONS = {
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  tag: '<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2.2 2.2L15.5 13"/>'
};
const A = {
  id: "a", name: "Ledger",
  blurb: "A log that writes itself while nobody is there. The timestamps moving from 9:02 to 9:04 are the argument.",
  secs: "4.5s",
  css: `.log{display:flex;flex-direction:column;gap:11px;width:min(760px,100%)}
.ln{display:flex;align-items:center;gap:clamp(14px,2.2vw,22px);background:var(--paper);
  border:3px solid var(--ink);border-radius:16px;box-shadow:5px 5px 0 0 var(--ink);
  padding:clamp(12px,1.6vw,17px) clamp(14px,2vw,22px);opacity:0;transform:translateX(-26px);
  transition:opacity .42s var(--ease-out),transform .42s var(--ease-out)}
.ln.in{opacity:1;transform:none}
.ln .ic{flex:none;width:clamp(52px,6.4vw,68px);height:clamp(52px,6.4vw,68px);border-radius:14px;
  background:var(--field);border:3px solid var(--ink);display:grid;place-items:center}
.ln .ic svg{width:clamp(26px,3.2vw,34px);height:clamp(26px,3.2vw,34px);stroke:var(--pop);
  stroke-width:2.1;fill:none;stroke-linecap:round;stroke-linejoin:round}
.ln .txt{flex:1 1 auto;font-family:var(--f-disp);font-weight:800;letter-spacing:-.02em;
  font-size:clamp(19px,3vw,32px);line-height:1.15;color:var(--ink)}
.ln .at{flex:none;font-family:var(--f-mono);font-size:clamp(11px,1.3vw,14px);color:var(--muted)}
.ln.win{background:var(--pop)} .ln.win .ic{background:var(--ink)} .ln.win .at{color:var(--ink);opacity:.6}
.kicker{margin-top:clamp(18px,3vw,30px);font-family:var(--f-disp);font-weight:900;letter-spacing:-.03em;
  font-size:clamp(26px,5.4vw,58px);line-height:1.05;color:var(--paper);opacity:0;transform:translateY(14px);
  transition:opacity .55s var(--ease-out),transform .55s var(--ease-out)}
.done .kicker{opacity:1;transform:none}
.kicker b{color:var(--pop)}
@media(max-height:560px){
  .log{gap:7px}.ln{padding:7px 12px;gap:12px}.ln .ic{width:42px;height:42px}
  .ln .ic svg{width:22px;height:22px}.ln .txt{font-size:17px}.ln .at{font-size:10px}
  .kicker{margin-top:12px;font-size:clamp(19px,3.4vw,30px)}.kicker br{display:none}}
@media(max-width:560px){.ln .at{display:none}.ln .txt{font-size:clamp(17px,4.6vw,22px)}}`,
  html: `<span class="eyebrow">Volvo Ebal &middot; Automation &amp; AI systems</span>
  <span class="log">
${[["bolt", "A lead comes in.", "9:02 PM"], ["tag", "It is tagged and routed.", "9:02 PM"],
  ["chat", "It gets an answer.", "9:03 PM"], ["cal", "It books a call.", "9:04 PM"]]
  .map(([k, t, at], i) => `    <span class="ln${i === 3 ? " win" : ""}"><span class="ic"><svg viewBox="0 0 24 24">${ICONS[k]}</svg></span><span class="txt">${t}</span><span class="at">${at}</span></span>`).join("\n")}
  </span>
  <span class="kicker">And nobody<br><b>was awake.</b></span>`,
  js: `var lines=q(".ln"),BEAT=780,START=260;
  for(var i=0;i<lines.length;i++)(function(i){at(START+i*BEAT,function(){lines[i].classList.add("in")})})(i);
  var settled=START+(lines.length-1)*BEAT+420;
  at(settled,function(){intro.classList.add("done")});
  DONE=settled+1500;`
};

/* ── B · Headline ───────────────────────────────────────────────────────── */
const B = {
  id: "b", name: "Headline",
  blurb: "One enormous sentence. Only the last word changes, and the list of what it changes to IS the service list.",
  secs: "4.2s",
  css: `.head{font-family:var(--f-disp);font-weight:900;letter-spacing:-.035em;line-height:1.02;
  color:var(--paper);font-size:clamp(34px,8.4vw,92px);max-width:14ch}
.head .fixed{opacity:0;transform:translateY(16px);
  transition:opacity .6s var(--ease-out),transform .6s var(--ease-out);display:block}
.go .head .fixed{opacity:1;transform:none}
/* the swapping word rides a mask, so each one is cut off cleanly rather than
   crossfading into the next - a crossfade here reads as a glitch */
.slot{display:block;position:relative;height:1.06em;overflow:hidden;color:var(--pop)}
.slot span{position:absolute;inset:0;opacity:0;transform:translateY(96%);
  transition:opacity .34s var(--ease-out),transform .46s var(--ease-out);white-space:nowrap}
.slot span.on{opacity:1;transform:none}
.slot span.out{opacity:0;transform:translateY(-96%)}
.rule{margin-top:clamp(16px,2.4vw,26px);height:5px;width:0;background:var(--pop);border-radius:3px;
  transition:width .8s var(--ease-out)}
.done .rule{width:min(420px,72vw)}
.sub{margin-top:14px;font-family:var(--f-mono);font-size:clamp(10px,1.4vw,13px);letter-spacing:.16em;
  text-transform:uppercase;color:rgba(242,241,234,.62);opacity:0;transition:opacity .5s var(--ease-out)}
.done .sub{opacity:1}
/* A phone on its side is 390px TALL, and 8.4vw of an 844px width is a 71px
   headline - three lines of it do not fit in 390. Height is the constraint
   here, never width, so the cap is on height and the measure widens to keep
   the line count down. */
@media(max-height:560px){
  .head{font-size:clamp(22px,4.2vw,38px);max-width:22ch}
  .rule{margin-top:10px;height:4px}
  .sub{margin-top:9px}
}`,
  html: `<span class="eyebrow">Volvo Ebal &middot; Automation &amp; AI systems</span>
  <h1 class="head"><span class="fixed">I build the system that runs your</span>
    <span class="slot">
      <span>follow-up.</span><span>quoting.</span><span>reactivation.</span>
      <span>onboarding.</span><span>whole back office.</span>
    </span></h1>
  <span class="rule"></span>
  <span class="sub">GoHighLevel &middot; n8n &middot; Claude Code</span>`,
  js: `var words=q(".slot span"),HOLD=620,k=0;
  at(520,function(){words[0].classList.add("on")});
  for(var i=1;i<words.length;i++)(function(i){
    at(520+i*HOLD,function(){
      words[i-1].classList.remove("on");words[i-1].classList.add("out");
      words[i].classList.add("on");});
  })(i);
  var settled=520+(words.length-1)*HOLD+400;
  at(settled,function(){intro.classList.add("done")});
  DONE=settled+1400;`
};

/* ── C · Terminal ───────────────────────────────────────────────────────── */
const C = {
  id: "c", name: "Terminal",
  blurb: "A session typing itself out. Already in his world: the site's questions room is an objection terminal.",
  secs: "5.0s",
  css: `.term{width:min(720px,100%);font-family:var(--f-mono);font-size:clamp(13px,1.9vw,19px);
  line-height:1.85;color:var(--paper);background:rgba(11,14,28,.34);border:3px solid var(--ink);
  border-radius:16px;box-shadow:6px 6px 0 0 var(--ink);padding:clamp(16px,2.4vw,26px)}
.term .bar{display:flex;gap:6px;margin-bottom:14px}
.term .bar i{width:11px;height:11px;border-radius:50%;background:rgba(242,241,234,.28)}
.term .bar i:first-child{background:var(--pop)}
.row{display:block;white-space:pre-wrap;min-height:1.85em}
.row.cmd{color:var(--pop)}
.row.out{color:rgba(242,241,234,.82)}
.row.big{font-family:var(--f-disp);font-weight:900;font-size:clamp(20px,3.4vw,36px);
  letter-spacing:-.02em;color:var(--paper);line-height:1.2;margin-top:10px}
.cur{display:inline-block;width:.62em;height:1.05em;background:var(--pop);vertical-align:-.18em;
  animation:blink 1s steps(2,start) infinite}
@keyframes blink{to{visibility:hidden}}
@media(max-height:560px){.term{font-size:13px;line-height:1.6;padding:14px}.row.big{font-size:20px}}`,
  html: `<span class="eyebrow">Volvo Ebal &middot; Automation &amp; AI systems</span>
  <div class="term">
    <span class="bar"><i></i><i></i><i></i></span>
    <span class="row cmd" data-t="&gt; volvo --what-do-you-do"></span>
    <span class="row out" data-t="  the piece between your tools that nobody owns"></span>
    <span class="row cmd" data-t="&gt; volvo --proof"></span>
    <span class="row out" data-t="  6 businesses · 11 apps · 3 live right now"></span>
    <span class="row big" data-t="Send me the thing eating your week."></span>
  </div>`,
  js: `var rows=q(".row"),SPEED=22,GAP=260;
  var cur=document.createElement("i");cur.className="cur";
  var t=0;
  rows.forEach(function(r){
    var txt=r.getAttribute("data-t"),i=0;
    at(t,function(){ r.appendChild(cur);
      var iv=setInterval(function(){
        if(i>=txt.length){clearInterval(iv);return;}
        r.insertBefore(document.createTextNode(txt[i++]),cur);
      },SPEED); timers.push(iv); intervals.push(iv);
    });
    t += txt.length*SPEED + GAP;
  });
  at(t,function(){intro.classList.add("done");});
  DONE=t+1300;`
};

/* ── D · Stamp, in three sets of words ──────────────────────────────────
   Volvo picked this mechanic and asked for different wording and a slower
   pace, so the mechanic is now fixed and the WORDS are the variable. All three
   say the same thing in a different register; every one of them is drawn from
   the site's own problem section rather than invented for the animation.

   US English throughout. The first cut of this said "enquiry", which is the
   British spelling and has no business on a page written for US clients. */
const STAMP_CSS = `.deck{position:relative;width:min(1180px,90vw);
  margin-top:clamp(54px,min(5.2vw,8.4vh),134px);
  margin-bottom:clamp(14px,min(1.8vw,3vh),38px)}
.card{display:flex;align-items:center;gap:clamp(12px,min(1.5vw,2.4vh),22px);
  background:var(--paper);border:3px solid var(--ink);
  border-radius:clamp(14px,min(1.3vw,2vh),22px);box-shadow:6px 6px 0 0 var(--ink);
  padding:clamp(12px,min(1.9vw,3.2vh),34px) clamp(16px,min(2.3vw,3.8vh),38px);
  font-family:var(--f-disp);font-weight:800;letter-spacing:-.025em;color:var(--ink);
  font-size:clamp(17px,min(3.2vw,5.4vh),58px);line-height:1.12;
  margin-bottom:clamp(10px,min(1.2vw,2vh),24px);opacity:0;
  transition:opacity .46s var(--ease-out),transform .52s var(--ease-out)}
.card:nth-child(1){transform:translateY(-26px) rotate(-1.5deg)}
.card:nth-child(2){transform:translateY(-26px) rotate(.9deg)}
.card:nth-child(3){transform:translateY(-26px) rotate(-.7deg)}
.card.in{opacity:1}
.card.in:nth-child(1){transform:rotate(-1.5deg)}
.card.in:nth-child(2){transform:rotate(.9deg)}
.card.in:nth-child(3){transform:rotate(-.7deg)}
.card i{flex:none;width:clamp(10px,min(.9vw,1.5vh),16px);height:clamp(10px,min(.9vw,1.5vh),16px);
  border-radius:50%;background:#C8452F;border:2px solid var(--ink);
  transition:background-color .4s var(--ease-out) .12s}
.done .card i{background:#2E9E5B}

/* The stamp straddles the BOTTOM RIGHT of the stack rather than crossing the
   middle of it. Centred, it landed squarely over the second sentence and cost
   a line of copy - a stamp may cover a card, it may not cover the words it is
   there to make a point about. It arrives oversized and rotated, then snaps
   down: a stamp that fades in is a sticker, a stamp that lands has weight. */
.stamp{position:absolute;right:-1%;bottom:100%;margin-bottom:-14px;
  font-family:var(--f-mono);font-weight:700;
  font-size:clamp(17px,min(3.4vw,5.6vh),56px);letter-spacing:.14em;
  color:var(--pop);border:5px solid var(--pop);border-radius:12px;
  padding:clamp(7px,min(.9vw,1.5vh),15px) clamp(14px,min(2vw,3.4vh),34px);
  text-transform:uppercase;background:rgba(33,42,107,.9);
  opacity:0;transform:rotate(-14deg) scale(2.5);
  transition:opacity .18s linear,transform .42s cubic-bezier(.3,.9,.2,1)}
.done .stamp{opacity:1;transform:rotate(-7deg) scale(1)}

.sub{margin-top:clamp(10px,min(1.6vw,2.6vh),30px);font-family:var(--f-disp);font-weight:900;
  letter-spacing:-.035em;line-height:1.04;
  font-size:clamp(21px,min(5vw,8.4vh),88px);color:var(--paper);
  opacity:0;transform:translateY(14px);
  transition:opacity .55s var(--ease-out) .5s,transform .55s var(--ease-out) .5s}
.done .sub{opacity:1;transform:none}
.sub b{color:var(--pop)}

@media(max-width:560px){
  /* A narrow tall screen makes the WIDTH term bind, so min(vw,vh) held the type
     at its floor and the composition occupied 31% of a phone - correct by the
     rule and wrong on the screen. Here the type is sized against width alone
     and allowed to WRAP: two lines of 25px fill a tall screen far better than
     one line of 17px, and wrapping costs nothing. */
  .deck{margin-top:58px;margin-bottom:12px}
  card{font-size:clamp(22px,6.4vw,34px);line-height:1.2;
    padding:16px 18px;margin-bottom:14px;gap:14px;border-radius:15px}
  .card i{width:11px;height:11px}
  .sub{font-size:clamp(27px,8.6vw,44px);margin-top:16px}
  /* on a phone the stamp must not hang off the viewport, so it comes inboard */
  /* Dropped further below the stack on a phone than on a desktop. A short
     third line ("By morning they are gone.") leaves the whole right half of the
     card empty, so a wide stamp word lands on the sentence instead of past it -
     measured 18% of the glyphs covered before this. Sitting lower means it
     straddles the card EDGE, which is where a real stamp catches anyway. */
  .stamp{right:-2%;bottom:100%;margin-bottom:-10px;font-size:clamp(15px,4.8vw,22px);padding:7px 13px}}
/* A phone on its side is 390px TALL, and place-content:center clips at BOTH
   ends when the content overflows. Height is the scarce axis, so this query is
   on height. */
@media(max-height:560px){
  .intro{padding:12px}
  .eyebrow{margin-bottom:8px;font-size:10px}
  .deck{margin-top:42px;margin-bottom:8px}
  .card{padding:8px 14px;margin-bottom:8px;font-size:clamp(15px,4.4vh,22px);border-radius:12px}
  .card i{width:9px;height:9px}
  .stamp{font-size:clamp(14px,4vh,22px);padding:6px 12px;margin-bottom:-8px;border-width:4px}
  .sub{margin-top:10px;font-size:clamp(18px,6vh,30px)}
}`;

const STAMP_JS = `var cards=q(".card"),START=380,BEAT=820,PAUSE=900;
  for(var i=0;i<cards.length;i++)(function(i){
    at(START+i*BEAT,function(){cards[i].classList.add("in")})})(i);
  var settled=START+(cards.length-1)*BEAT+PAUSE;
  at(settled,function(){intro.classList.add("done")});
  DONE=settled+2100;`;

const D1 = {
  id: "d1", name: "Stamp · Plain",
  blurb: "The three failures stated flatly, in the site's own words. The least styled and the easiest to believe.",
  secs: "5.4s",
  css: STAMP_CSS,
  html: `<span class="eyebrow">Volvo Ebal &middot; Automation &amp; AI systems</span>
  <div class="deck">
    <span class="card"><i></i>A lead waits all night for a reply.</span>
    <span class="card"><i></i>One record, typed into three systems.</span>
    <span class="card"><i></i>A workflow died in silence.</span>
    <span class="stamp">Handled</span>
  </div>
  <span class="sub">I build the part <b>nobody owns.</b></span>`,
  js: STAMP_JS
};

const D2 = {
  id: "d2", name: "Stamp · Clocked",
  blurb: "Numbers carry it. The gap between 9:02pm and 9:14am does the arguing, the way the ledger's timestamps do.",
  secs: "5.4s",
  css: STAMP_CSS,
  html: `<span class="eyebrow">Volvo Ebal &middot; Automation &amp; AI systems</span>
  <div class="deck">
    <span class="card"><i></i>9:02pm inquiry. 9:14am reply.</span>
    <span class="card"><i></i>The same record, typed three times a day.</span>
    <span class="card"><i></i>Six weeks broken. Nobody noticed.</span>
    <span class="stamp">Handled</span>
  </div>
  <span class="sub">I build the part <b>nobody owns.</b></span>`,
  js: STAMP_JS
};

const D3 = {
  id: "d3", name: "Stamp · Pointed",
  blurb: "Named as things a reader will recognise from their own week. Sharpest, and still blames nobody.",
  secs: "5.4s",
  css: STAMP_CSS,
  html: `<span class="eyebrow">Volvo Ebal &middot; Automation &amp; AI systems</span>
  <div class="deck">
    <span class="card"><i></i>The lead that went cold overnight.</span>
    <span class="card"><i></i>The person you pay to think, retyping.</span>
    <span class="card"><i></i>The workflow that failed quietly.</span>
    <span class="stamp">Handled</span>
  </div>
  <span class="sub">I build the part <b>nobody owns.</b></span>`,
  js: STAMP_JS
};

const E1 = {"id":"e1","name":"Plain · Night","blurb":"Grade 1.0. Tells the story of one night: someone asks, nobody is there, they go elsewhere.","secs":"5.4s",
  css: STAMP_CSS,
  html: `<span class="eyebrow">Volvo Ebal &middot; Automation &amp; AI systems</span>
  <div class="deck">
    <span class="card"><i></i>A customer writes you at 9 at night.</span>
    <span class="card"><i></i>Everyone has gone home.</span>
    <span class="card"><i></i>By morning they bought from someone else.</span>
    <span class="stamp">Fixed</span>
  </div>
  <span class="sub">I make it answer <b>at 9 at night.</b></span>`,
  js: STAMP_JS
};

const E2 = {"id":"e2","name":"Plain · Chores","blurb":"Grade 1.0. Three small jobs nobody should be doing by hand. The least dramatic and the most familiar.","secs":"5.4s",
  css: STAMP_CSS,
  html: `<span class="eyebrow">Volvo Ebal &middot; Automation &amp; AI systems</span>
  <div class="deck">
    <span class="card"><i></i>The same name, typed three times.</span>
    <span class="card"><i></i>A message no one ever saw.</span>
    <span class="card"><i></i>A job that quietly stopped working.</span>
    <span class="stamp">Done</span>
  </div>
  <span class="sub">I build the part <b>that does it for you.</b></span>`,
  js: STAMP_JS
};

const E3 = {"id":"e3","name":"Plain · Sleep","blurb":"CHOSEN. Grade 1.5. The stamp answers the three lines back, which turns a list into an argument.","secs":"5.4s",
  css: STAMP_CSS,
  html: `<span class="eyebrow">Volvo Ebal &middot; Automation &amp; AI systems</span>
  <div class="deck">
    <span class="card"><i></i>Someone asks about you at night.</span>
    <span class="card"><i></i>No one is there to answer.</span>
    <span class="card"><i></i>By morning they are gone.</span>
    <span class="stamp">Not anymore</span>
  </div>
  <span class="sub">I make systems that <b>run for you 24/7.</b></span>`,
  js: STAMP_JS
};

const VARIANTS = [E1, E2, E3, D1, D2, D3, A, B, C];

const page = v => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Opener ${v.id.toUpperCase()} · ${v.name}</title>
${FONTS}
<style>
${BASE}
${v.css}
</style></head>
<body>
<div class="intro" id="intro">
  ${v.html}
  <button class="skip" type="button">Skip &rsaquo;</button>
</div>
<button class="replay" type="button" onclick="play()">Replay</button>
<script>
var intro=document.getElementById("intro"),timers=[],intervals=[],DONE=0;
function q(s){return [].slice.call(intro.querySelectorAll(s));}
function at(ms,fn){timers.push(setTimeout(fn,ms));}
function clear(){timers.forEach(clearTimeout);intervals.forEach(clearInterval);timers=[];intervals=[];}
function play(){
  clear();
  // rebuild from the pristine markup so a replay is identical to a first run
  intro.innerHTML = START_HTML;
  intro.className = "intro";
  DONE = 0;
  requestAnimationFrame(function(){ intro.classList.add("go"); run(); });
  intro.querySelector(".skip").addEventListener("click", function(){ clear(); });
}
function run(){
${v.js}
  // the preview loops, so the whole thing can be judged without reloading
  at(DONE, function(){ play(); });
}
var START_HTML = intro.innerHTML;
play();
</script>
</body></html>`;

for (const v of VARIANTS) writeFileSync(join(OUT, v.id + ".html"), page(v));

/* the chooser */
const card = v => `  <a class="pick" href="${v.id}.html">
    <span class="tag">Option ${v.id.toUpperCase()}</span>
    <h2>${v.name}</h2>
    <p>${v.blurb}</p>
    <span class="meta">${v.secs} &middot; opens full screen</span>
  </a>`;
const cards = VARIANTS.slice(0, 3).map(card).join("\n");
const others = VARIANTS.slice(3, 6).map(card).join("\n");
const rest = VARIANTS.slice(6).map(card).join("\n");

writeFileSync(join(OUT, "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Four openers</title>
${FONTS}
<style>
${BASE}
body{overflow:auto;background:var(--paper);color:var(--ink)}
.wrap{max-width:900px;margin:0 auto;padding:clamp(22px,5vw,58px) clamp(16px,4vw,28px)}
h1{font-family:var(--f-disp);font-weight:900;letter-spacing:-.03em;
  font-size:clamp(28px,6vw,52px);margin:0 0 10px}
.lede{font-family:var(--f-body);font-size:clamp(15px,2vw,18px);line-height:1.6;
  color:var(--muted);margin:0 0 30px;max-width:62ch}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.pick{display:flex;flex-direction:column;gap:8px;text-decoration:none;color:inherit;
  background:#fff;border:3px solid var(--ink);border-radius:16px;box-shadow:5px 5px 0 0 var(--ink);
  padding:20px;transition:transform .16s var(--ease-out),box-shadow .16s var(--ease-out)}
.pick:hover{transform:translateY(-4px);box-shadow:7px 9px 0 0 var(--ink)}
.tag{font-family:var(--f-mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--ink);background:var(--pop);border:2px solid var(--ink);border-radius:99px;
  padding:3px 10px;align-self:flex-start}
.pick h2{font-family:var(--f-disp);font-weight:900;letter-spacing:-.02em;font-size:25px;margin:2px 0 0}
.pick p{margin:0;font-size:15px;line-height:1.55;color:var(--muted)}
.meta{font-family:var(--f-mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--muted);margin-top:4px}
.sec{font-family:var(--f-disp);font-weight:900;letter-spacing:-.02em;
  font-size:22px;margin:34px 0 14px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.sec span{font-family:var(--f-mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--muted);font-weight:400}
.note{margin-top:30px;font-size:14px;line-height:1.6;color:var(--muted);
  border-left:3px solid var(--pop);padding-left:14px;max-width:62ch}
</style></head>
<body><div class="wrap">
<h1>Four openers. Pick one.</h1>
<p class="lede">Each is a different mechanic, not a restyle of the same idea. Every one is
in your palette, fills the screen, works on a phone, is skippable by button, key or tap,
and is never shown to anyone who has asked for reduced motion. Click to watch it full
screen; each preview loops, and Replay is bottom left.</p>
<h2 class="sec">Plain English <span>read-level grade 1 to 1.5</span></h2>
<div class="grid">
${cards}
</div>
<h2 class="sec">The earlier wording <span>grade 2.4 to 3.5</span></h2>
<div class="grid">
${others}
</div>
<h2 class="sec">Other mechanics <span>not the stamp</span></h2>
<div class="grid">
${rest}
</div>
<p class="note">Option A is what is live right now, so it is the one to beat rather than the
default. If none of them is right, the useful thing to tell me is which part is wrong: the
mechanic, the words, or the pace.</p>
</div></body></html>`);

console.log("wrote " + (VARIANTS.length + 1) + " files to " + OUT);
for (const v of VARIANTS) console.log("  " + v.id + ".html  " + v.name.padEnd(10) + v.secs);
console.log("\nopen: " + join(OUT, "index.html"));
