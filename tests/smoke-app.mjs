import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

class StubEl {
  constructor(id, tag) {
    this.id = id || "";
    this.tagName = (tag || "div").toUpperCase();
    this.style = {};
    this.dataset = {};
    this.value = "";
    this.checked = false;
    this.className = "";
    this.children = [];
    this.listeners = {};
    this._text = "";
    this.selected = false;
  }
  get classList() {
    const self = this;
    return {
      add: (c) => {
        const set = new Set(self.className.split(/\s+/).filter(Boolean));
        set.add(c);
        self.className = [...set].join(" ");
      },
      remove: (c) => {
        self.className = self.className.split(/\s+/).filter(c2 => c2 && c2 !== c).join(" ");
      },
      toggle: (c) => {
        self.className.includes(c) ? self.classList.remove(c) : self.classList.add(c);
      },
      contains: (c) => self.className.split(/\s+/).includes(c)
    };
  }
  get textContent() {
    return this._text;
  }
  set textContent(v) {
    this._text = v === null || v === undefined ? "" : String(v);
    this.children = [];
  }
  addEventListener(type, fn) {
    (this.listeners[type] = this.listeners[type] || []).push(fn);
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    this.children = this.children.filter(c => c !== child);
    return child;
  }
  select() {
    this.selected = true;
  }
  getContext() {
    throw new Error("canvas is not available in the smoke shim");
  }
  toDataURL() {
    return "data:image/png;base64,AAAA";
  }
}

const registry = new Map();

function makeDefaults() {
  const defaults = {
    "in-site": ["Dylan's AI Handbook", false],
    "in-title": ["AI in Plain English", false],
    "in-desc": ["A nurse-turned-AI-author explains AI like a friend would — plain English, step by step.", false],
    "in-url": ["https://example.com/guides/ai-in-plain-english", false],
    "in-theme": ["#7a4f9e", false],
    "theme-picker": ["#7a4f9e", false],
    "in-og-image": ["https://example.com/images/plain-english-cover.jpg", false],
    "in-og-w": ["1200", false],
    "in-og-h": ["630", false],
    "in-og-alt": ["", false],
    "in-card": ["summary_large_image", false],
    "in-twitter": ["@dylanasdale", false],
    "in-og-type": ["website", false],
    "in-index": ["index", false],
    "in-follow": ["follow", false],
    "chk-archive": [false, true],
    "chk-snippet": [false, true],
    "chk-imageindex": [false, true],
    "chk-favicons": [true, true],
    "chk-manifest": [false, true],
    "in-disallow": ["/admin/", false],
    "in-sitemap": ["https://example.com/sitemap.xml", false]
  };
  for (const [id, [val, isCheck]] of Object.entries(defaults)) {
    const el = new StubEl(id, isCheck ? "input" : "input");
    if (isCheck) el.checked = val;
    else el.value = val;
    registry.set(id, el);
  }
  for (const id of [
    "count-title", "count-desc", "serp-favicon", "serp-site", "serp-crumb",
    "serp-title", "serp-desc", "og-img", "og-domain", "og-title", "og-desc",
    "og-site", "tw-name", "tw-handle", "x-card", "x-img", "x-title", "x-desc",
    "x-domain", "warnings", "out-head", "out-robots", "robots-explain",
    "btn-copy-head", "btn-copy-robots", "btn-forge", "fav-file", "fav-strip",
    "fav-status", "fav-letter", "fav-bg"
  ]) {
    registry.set(id, new StubEl(id, id.startsWith("out-") ? "pre" : "div"));
  }
}

makeDefaults();

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};

let execCommandCalls = 0;
globalThis.document = {
  getElementById: (id) => registry.get(id) || null,
  createElement: (tag) => new StubEl("", tag),
  execCommand: () => {
    execCommandCalls++;
    return true;
  },
  body: new StubEl("body", "body")
};
globalThis.navigator = {};

const App = require("../js/app.js");

let passed = 0;
let failed = 0;
const failures = [];
const asyncTests = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("ok    " + name);
  } catch (err) {
    failed++;
    failures.push({ name, err: err.message });
    console.log("FAIL  " + name + " — " + err.message);
  }
}

function testAsync(name, fn) {
  asyncTests.push({ name, fn });
}

function eq(actual, expected, label) {
  if (actual !== expected) {
    throw new Error((label || "value") + " — expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual));
  }
}
function ok(cond, label) {
  if (!cond) throw new Error(label || "expected true");
}
function includes(haystack, needle, label) {
  if (!String(haystack).includes(needle)) {
    throw new Error((label || "haystack") + " — missing " + JSON.stringify(needle) + "\n--- got ---\n" + haystack);
  }
}

test("readForm collects a complete config from seeded inputs", () => {
  const cfg = App.readForm();
  eq(cfg.siteName, "Dylan's AI Handbook");
  eq(cfg.title, "AI in Plain English");
  eq(cfg.twitterCard, "summary_large_image");
  eq(cfg.robots.noindex, false);
  eq(cfg.robots.nofollow, false);
  eq(cfg.includeFavicons, true);
  eq(cfg.includeManifest, false);
});

test("update() fills the head block with the core tags", () => {
  App.update();
  const head = registry.get("out-head").textContent;
  includes(head, "<title>AI in Plain English</title>");
  includes(head, 'name="description"');
  includes(head, '<link rel="canonical" href="https://example.com/guides/ai-in-plain-english">');
  includes(head, '<meta name="twitter:site" content="@dylanasdale">');
});

test("update() includes favicon lines when the checkbox is on", () => {
  App.update();
  includes(registry.get("out-head").textContent, '<link rel="icon" href="/favicon.ico" sizes="32x32">');
});

test("update() mirrors the adapted URL path into all three previews", () => {
  App.update();
  includes(registry.get("serp-crumb").textContent, "example.com › guides › ai-in-plain-english");
  eq(registry.get("og-domain").textContent, "example.com");
  eq(registry.get("x-domain").textContent, "example.com");
});

test("update() paints the SERP title and description from the form", () => {
  App.update();
  eq(registry.get("serp-title").textContent, "AI in Plain English");
  ok(registry.get("serp-desc").textContent.includes("plain English"));
});

test("counters show live char counts without the over-flag", () => {
  App.update();
  ok(registry.get("count-title").textContent.endsWith("/60"));
  ok(!registry.get("count-title").className.includes("over"));
});

test("config persistence round-trips through localStorage", () => {
  const cfg = App.readForm();
  App.saveConfig();
  const saved = App.loadConfig();
  eq(saved.title, cfg.title);
  eq(saved.robots.noindex, false);
});

test("applyConfig restores saved values into the inputs", () => {
  App.applyConfig(App.loadConfig());
  eq(registry.get("in-title").value, "AI in Plain English");
  eq(registry.get("in-card").value, "summary_large_image");
});

test("flipping noindex emits the robots tag and the plain-English explainer", () => {
  registry.get("in-index").value = "noindex";
  App.update();
  includes(registry.get("out-head").textContent, '<meta name="robots" content="noindex">');
  includes(registry.get("robots-explain").textContent, "keep this page OUT of search results");
  registry.get("in-index").value = "index";
  App.update();
  ok(!registry.get("out-head").textContent.includes('name="robots"'));
  includes(registry.get("robots-explain").textContent, "left out entirely");
});

test("switching the Twitter card style toggles the small-square layout class", () => {
  registry.get("in-card").value = "summary";
  App.update();
  ok(registry.get("x-card").className.includes("small"));
  includes(registry.get("out-head").textContent, '<meta name="twitter:card" content="summary">');
  registry.get("in-card").value = "summary_large_image";
  App.update();
  ok(!registry.get("x-card").className.includes("small"));
});

test("turning favicons off removes the icon lines from the head block", () => {
  registry.get("chk-favicons").checked = false;
  App.update();
  ok(!registry.get("out-head").textContent.includes("favicon.ico"));
  registry.get("chk-favicons").checked = true;
  App.update();
  includes(registry.get("out-head").textContent, "favicon.ico");
});

test("robots.txt output picks up the disallow list and sitemap", () => {
  App.update();
  const txt = registry.get("out-robots").textContent;
  includes(txt, "User-agent: *");
  includes(txt, "Allow: /");
  includes(txt, "Disallow: /admin/");
  includes(txt, "Sitemap: https://example.com/sitemap.xml");
});

test("a half-empty form produces gentle nudges, a full one produces none", () => {
  registry.get("in-url").value = "";
  App.update();
  ok(registry.get("warnings").children.some(li => /canonical/i.test(li.textContent)), "canonical nudge present");
  registry.get("in-url").value = "https://example.com/guides/ai-in-plain-english";
  App.update();
  eq(registry.get("warnings").children[0].className, "good");
  ok(registry.get("warnings").children[0].textContent.includes("Looks solid"));
});

test("robots extras append extra directives", () => {
  registry.get("chk-archive").checked = true;
  registry.get("chk-snippet").checked = true;
  App.update();
  includes(registry.get("out-head").textContent, '<meta name="robots" content="noarchive, nosnippet">');
  registry.get("chk-archive").checked = false;
  registry.get("chk-snippet").checked = false;
  App.update();
});

testAsync("copyText falls back to execCommand when the clipboard API is blocked", async () => {
  const btn = registry.get("btn-copy-head");
  const okFlag = await App.copyText(registry.get("out-head").textContent, btn, "Copy tags");
  ok(okFlag === true, "copy reports success");
  ok(execCommandCalls >= 1, "fallback execCommand ran");
  eq(btn.textContent, "Copied!");
});

testAsync("copyText prefers navigator.clipboard when it works", async () => {
  let written = "";
  let execBefore = execCommandCalls;
  globalThis.navigator = {
    clipboard: { writeText: async (t) => { written = t; } }
  };
  const btn = registry.get("btn-copy-robots");
  const okFlag = await App.copyText("robots.txt content", btn, "Copy robots.txt");
  ok(written === "robots.txt content", "clipboard API wrote the text");
  eq(execCommandCalls, execBefore, "no fallback needed");
  ok(okFlag === true);
});

await (async () => {
  for (const { name, fn } of asyncTests) {
    try {
      await fn();
      passed++;
      console.log("ok    " + name);
    } catch (err) {
      failed++;
      failures.push({ name, err: err.message });
      console.log("FAIL  " + name + " — " + err.message);
    }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exitCode = failed ? 1 : 0;
})();
