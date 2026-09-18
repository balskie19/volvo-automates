// The shell every explainer and tool page is built in: the fonts, the site's
// tokens, and the panel/tag/quote furniture they all share.
//
// It lives here because there are two generators now (explainers.mjs and
// toolpages.mjs) and a second copy of a stylesheet is not a stylesheet, it is
// two of them waiting to disagree. Import it, never restate it.
export const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@400;500;700&family=Gabarito:wght@500;700;800;900&family=Public+Sans:wght@400;500;600;700&display=swap">`;

export const BASE = `:root{
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
.back{display:flex;width:fit-content;gap:7px;align-items:center;font-family:var(--f-mono);font-size:11px;
  letter-spacing:.1em;text-transform:uppercase;color:var(--muted);text-decoration:none;margin-bottom:14px}
.back:hover{color:var(--ink)}`;

export const page = (title, body, extraCss = "") => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>${FONTS}
<style>${BASE}${extraCss}</style></head>
<body><div class="wrap">${body}</div></body></html>`;
