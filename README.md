# Volvo Automates

The site and the CV for Volvo Ebal: GoHighLevel, n8n, and applications built
with Claude Code.

**Live: https://volvo-automates.pages.dev**
CV: https://volvo-automates.pages.dev/cv/

## Layout

- `index.html` is the deck. Scroll, arrow keys, swipe, or the Next button.
  Eleven slides, each arriving with a different motion.
- `cv/index.html` is the CV. It prints to a clean A4.
- `tools/build.mjs` wraps both pages in a real HTML document. Run it after any
  edit: without the viewport meta it adds, phones lay the pages out at 980px
  and scale the result down.
- `tools/deploy.mjs` publishes to Cloudflare Pages.

## Working on it

```
node tools/build.mjs     # add the document head
node tools/deploy.mjs    # stage a clean dist and publish
```

Plain HTML. No framework, no build step beyond those two scripts, no
dependencies to install.
