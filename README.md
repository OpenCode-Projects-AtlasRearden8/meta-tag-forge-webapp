# Meta Tag Forge

An offline, single-page tool that forges the **invisible tags a brand-new site needs** — the tags nobody sees you type but every search engine and social network reads:

- **Title + description** that Google actually shows as your blue link and snippet text
- **Open Graph** tags for Facebook, LinkedIn, and Discord previews
- **Twitter card** tags for X.com shares
- **Favicons in every size** a real site needs, forged from your logo in the browser
- **Robots guidance** in plain English, plus a ready `robots.txt`
- **Copy-paste-able HTML** — a clean head block with a one-click copy button

Pure HTML/JS/CSS, zero dependencies, no network, no accounts. Double-click `index.html` and it works.

Built by [Asdale Dynamics, LLC](https://dylanasdale.github.io) as part of its line of friendly, local-first tools — a natural companion to the **author-site-starter-template**: forge your tags here, paste them into the template's `<head>`.

## What's inside

**Tell it about your page** (left panel)
- Site name, page title, description, canonical URL, theme color
- Social bits: preview image URL, image size, alt text, Twitter/X handle, card style
- Robots switches: index / follow, plus noarchive, nosnippet, noimageindex — each one explained in plain English the moment you flip it
- Live character counters (60 for the title, 160 for the description) that turn gold when you're over

**Live previews** (right panel)
- A **Google-style search snippet**: favicon, site name, breadcrumb path, blue title, gray description — clipped exactly like a real result would be
- An **Open Graph card** like Facebook, LinkedIn, and Discord show when someone shares your link
- A **Twitter / X card**, switching between the big-image and small-square layouts as you change the card style

**Copy-paste output**
- The complete head block: title, description, canonical, robots (only when needed — the friendly default is to leave it out), theme color, favicon links, and all the Open Graph + Twitter tags, properly escaped
- A `robots.txt` you can save into the top folder of your site

**Icon forge**
- Drop in a square-ish logo and it carves out favicon-16x16, favicon-32x32, apple-touch-icon (180), icon-192, icon-512, and a bundled `favicon.ico` (16 + 32 + 48) — each with its own download button
- No logo yet? Type a letter, pick a color, and it mints a simple badge instead (that badge also previews as your social image)

**Gentle nudges**
- A plain-English advice list that points out missing tags, over-long titles, relative image URLs, and the "you picked a big-image card but there's no image" trap

Your form is remembered in your browser's `localStorage` — close the tab, come back, everything's still there. Nothing is ever sent anywhere.

## Run it

```bash
# just open it — no server, no build step:
open index.html          # macOS
# or double-click index.html in your file manager
```

Works from `file://`. Pure HTML/JS/CSS, zero dependencies.

## Tests

```bash
npm test                 # both suites via node
node tests/run-tests.mjs # tag-template rendering, escaping, truncation, robots, warnings, ICO packing
node tests/smoke-app.mjs # headless wiring test of the full page update loop
```

Prefer no node at all? Open `tests/run-tests.html` in any browser — same assertions, running the exact same `js/tags.js` the app uses.

The unit suite covers the tag-template rendering (escaping of the five risky characters, word-boundary truncation with ellipses, handle normalization, favicon link sets, head-block assembly, robots-text shape, warning rules) and the ICO container packer (header counts, width encoding, payload offsets). The ICO tests caught a real bug during development: entry metadata was written after the header was copied out, producing a silently all-zero directory.

## Privacy

- No network calls, no analytics, no fonts or CDNs fetched
- Your draft stays in your browser's `localStorage` on your machine
- No secrets, keys, or personal data anywhere in the code

## Known limits

- Snippet clipping is character-count-based (≈60 title / ≈160 description), so it's an approximation of Google's pixel-based clipping — close enough for drafting
- The .ico bundle embeds PNGs, which every modern browser reads; a few very old tools want a legacy BMP-format .ico
- There is no "download everything at once" — browsers fire one download per click, and Meta Tag Forge respects that

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Asdale Dynamics, LLC.
