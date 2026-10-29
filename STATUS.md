# STATUS.md

## What was built

**Meta Tag Forge** — an offline, single-page web app that forges the invisible tags a brand-new site needs. Pure HTML/JS/CSS, zero dependencies, runs straight from `file://`. No network, no accounts, nothing leaves the computer. A companion tool for filling a fresh site's `<head>` (pairs naturally with the author-site-starter-template).

Files:
- `index.html` — the entire tool
- `js/tags.js` — pure, dependency-free tag-template rendering (escaping, truncation, head-block assembly, robots handling, warnings). UMD: loads in the browser as a plain script and in node via `require`, which is what makes it testable
- `js/favicon.js` — canvas-based icon carving (16/32/180/192/512 px PNGs), letter-badge minting, and a hand-written **ICO container packer** (16 + 32 + 48 bundled) — no libraries
- `js/app.js` — form wiring, live previews, copy buttons, localStorage persistence, icon-generation flow
- `css/style.css` — warm, beginner-friendly styling
- `tests/run-tests.mjs` + `tests/smoke-app.mjs` — node test suites
- `tests/run-tests.html` + `tests/browser-tests.js` — the same assertions runnable in any browser from `file://`

Features:
- **Search-snippet preview** mimicking a Google desktop result: favicon chip, site name, breadcrumb path (`example.com › guides › page`), blue title, gray description, clipped at 60 / 160 characters with a trailing ellipsis
- **Open Graph preview** (Facebook/LinkedIn/Discord style) and a **Twitter/X card preview** that flips between big-image and small-square layouts with the card-style dropdown
- **Copy-paste head block**: title, description, canonical, robots *only when something is restricted* (the friendly default emits no robots tag), theme-color, favicon link set, og:* (type, site_name, title, description, url, image + width/height/alt), twitter:* (card, site, title, description, image), optional manifest link. All values HTML-escaped; tags carry full text — only the previews demonstrate clipping
- **Robots guidance**: index/follow selects plus noarchive/nosnippet/noimageindex checkboxes, with a plain-English sentence ("tells search engines to: keep this page OUT of search results; …") that updates live
- **robots.txt generator**: User-agent: * / Allow: / / Disallow list / optional Sitemap line
- **Icon forge**: upload an image (center-cropped to square) or mint a letter badge; generates favicon-16x16, favicon-32x32, apple-touch-icon (180), icon-192, icon-512 downloads plus a bundled favicon.ico
- **Gentle nudges**: plain-English warnings for missing/over-long title (60) and description (160), missing canonical, non-absolute URLs, relative og:image, identical title+description, big-card-without-image
- **Persistence**: the whole form auto-saves to `localStorage` (`mtf.config.v1`); live character counters turn gold when over budget
- Copy buttons with `navigator.clipboard` and an `execCommand` textarea fallback for `file://`-restricted contexts

## How to run it

Open `index.html` directly in a browser (double-click works; `file://` is fully supported). No build step, no server.

```bash
# tests (node 18+):
npm test
# or individually:
node tests/run-tests.mjs
node tests/smoke-app.mjs
```

No-node option: open `tests/run-tests.html` in any browser.

## Verification results

- `node tests/run-tests.mjs` — **31/31 pass** (marking suite red progress: 1 → 4 → 1 → 1 → 0). Covers escaping of the five risky characters, word-boundary truncation with ellipsis at the 60/160 budgets, handle normalization (`@@DYLAN` → `@dylan`), URL parsing/breadcrumbs, robots-content joining and default omission, favicon link sets, head-block assembly and ordering, escaped-value injection, manifest/favicon toggles, robots.txt shape, warning rules, ICO container bytes (count, type, per-entry width/planes/bit depth, payload sizes and offsets), 256-px encoding edge case, base64 round-trip.
- `node tests/smoke-app.mjs` — **16/16 pass.** Headless DOM-shim test of the app's update loop: config read, head-block output, preview mirroring, counters, localStorage round-trip, applyConfig restore, robots-tag emission/omission, small-card class toggle, favicon-line toggles, robots.txt wiring, nudge list, copy-button clipboard-API and execCommand-fallback paths.
- Browser beta suite (`tests/run-tests.html`, verified via a scripted DOM harness): **11/11 pass** exercising the real `js/tags.js` + `js/favicon.js` plus canvas rendering at every forge size.
- Three real bugs caught by the tests and fixed: the ICO packer wrote image directory *after* copying the header into the output buffer (silently all-zero metadata), `normalizeHandle` didn't collapse `@@handle`, and a test-side mis-specified og:image assertion.
- Verified no `$("id")`/field drift: all 24 element ids referenced by `app.js` exist in `index.html`.

## Known gaps

- Snippet clipping is char-based (≈60/≈160), not pixel-width-based as Google actually renders — the classic approximation
- The .ico bundle embeds PNG payloads; universally readable by modern browsers and CI renderers, but legacy image software expecting BMP-format .ico will not load it
- No one-click "download all icons" zip: `URL.createObjectURL` downloads are click-driven, so each file has its own button; a store-only ZIP writer would fix this
- og:image dimensions/alt are typed by hand rather than sniffed from the image file
- Previews approximate desktop widths; no mobile-width SERP rendering
- README suggests admin/search disallow paths as examples only — the tool can't crawl the user's site to suggest real ones
- i18n: English only; theme is single (warm light), no dark mode
