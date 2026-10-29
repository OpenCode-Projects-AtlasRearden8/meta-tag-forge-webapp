const createRequire = (await import("node:module")).createRequire;
const require = createRequire(import.meta.url);
const M = require("../js/tags.js");
const F = require("../js/favicon.js");

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failed++;
    failures.push({ name, err: err.message });
  }
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
  if (!haystack.includes(needle)) {
    throw new Error((label || "haystack") + " — missing " + JSON.stringify(needle) + "\n--- got ---\n" + haystack);
  }
}
function deepEq(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error((label || "value") + " — expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual));
  }
}
function notIncludes(haystack, needle, label) {
  if (haystack.includes(needle)) {
    throw new Error((label || "haystack") + " — should NOT contain " + JSON.stringify(needle));
  }
}

test("escapeHtml escapes the five risky characters", () => {
  eq(M.escapeHtml(`a & b < c > d " e ' f`), 'a &amp; b &lt; c &gt; d &quot; e &#39; f');
});

test("escapeHtml passes through plain text and numbers", () => {
  eq(M.escapeHtml("plain text 2026"), "plain text 2026");
  eq(M.escapeHtml(null), "");
});

test("truncate leaves short text untouched", () => {
  eq(M.truncate("Short and sweet", 160), "Short and sweet");
});

test("truncate at exactly the limit stays whole", () => {
  const s = "x".repeat(160);
  eq(M.truncate(s, 160), s);
});

test("truncate clips long text at a word boundary with ellipsis", () => {
  const s = "This is a fairly long description sentence that just keeps going on and on and on and on and needs to stop somewhere before it hits the hard limit we set for what Google is willing to show.";
  const out = M.truncate(s, 160);
  ok(out.length <= 161, "clipped length fits (got " + out.length + ")");
  ok(out.endsWith("…"), "ends with ellipsis");
  const inner = out.slice(0, -1);
  ok(s.startsWith(inner), "ellipsis continues the original words, not a mid-word cut");
  ok(s.length > 160, "test string is longer than the budget");
});

test("truncateTitle uses a 60-char budget", () => {
  eq(M.truncateTitle("The Massive AI Manual"), "The Massive AI Manual");
  ok(M.truncateTitle("a".repeat(99)).length <= 61);
});

test("truncateDescription uses a 160-char budget", () => {
  ok(M.truncateDescription("b".repeat(300)).length <= 161);
});

test("normalizeHandle is idempotent and collapses repeated @", () => {
  eq(M.normalizeHandle("Dylan"), "@dylan");
  eq(M.normalizeHandle("@Dylan"), "@dylan");
  eq(M.normalizeHandle("@@dylan"), "@dylan");
  eq(M.normalizeHandle("  @DYLAN "), "@dylan");
  eq(M.normalizeHandle(""), "");
});

test("parseUrl splits host and breadcrumb trail", () => {
  const p = M.parseUrl("https://example.com/guides/first-steps.html");
  ok(p.ok);
  eq(p.host, "example.com");
  eq(p.breadcrumb, "example.com › guides › first-steps");
});

test("parseUrl tolerates bare domains and trailing slashes", () => {
  eq(M.parseUrl("https://example.com/").breadcrumb, "example.com");
});

test("parseUrl flags non-URLs instead of throwing", () => {
  ok(!M.parseUrl("not a url at all").ok);
  ok(!M.parseUrl("").ok);
});

test("robots content joins chosen directives", () => {
  eq(M.buildRobotsContent({ noindex: true, noarchive: true }), "noindex, noarchive");
});

test("robots content is empty when all defaults", () => {
  eq(M.buildRobotsContent({}), "");
  eq(M.buildRobotsContent({ noindex: false, nofollow: false }), "");
});

test("favicon link set uses conventional file names", () => {
  const links = M.faviconLinks();
  eq(links.length, 4);
  includes(links[0], 'href="/favicon.ico"', "ico link");
  includes(links[3], 'href="/apple-touch-icon.png" sizes="180x180"', "apple link");
});

test("buildHead emits the core tags in order", () => {
  const head = M.buildHead({
    siteName: "My Site",
    title: "My Page",
    description: "My description.",
    url: "https://example.com/page",
    themeColor: "#123456"
  });
  includes(head, "<title>My Page</title>");
  includes(head, '<meta name="description" content="My description.">');
  includes(head, '<link rel="canonical" href="https://example.com/page">');
  includes(head, '<meta name="theme-color" content="#123456">');
  includes(head, '<meta property="og:type" content="website">');
  includes(head, '<meta property="og:site_name" content="My Site">');
  includes(head, '<meta property="og:url" content="https://example.com/page">');
  ok(head.indexOf("<title>") === 0, "title comes first");
  notIncludes(head, "robots", "no robots tag when default");
});

test("buildHead escapes quotes injected into values", () => {
  const head = M.buildHead({
    title: 'Dangerous "title" & <stuff>',
    description: "x"
  });
  notIncludes(head, 'content="Dangerous "');
  includes(head, '<title>Dangerous &quot;title&quot; &amp; &lt;stuff&gt;</title>');
  notIncludes(head, "<stuff>");
});

test("buildHead omits optional blocks that have no data", () => {
  const head = M.buildHead({});
  notIncludes(head, 'name="description"');
  notIncludes(head, "canonical");
  notIncludes(head, "og:image");
  notIncludes(head, "twitter:site");
});

test("buildHead omits the robots tag for pure defaults", () => {
  const head = M.buildHead({ robots: { noindex: false, nofollow: false } });
  notIncludes(head, 'name="robots"');
});

test("buildHead emits the robots tag only when something is restricted", () => {
  const head = M.buildHead({ robots: { noindex: true, noarchive: true } });
  includes(head, '<meta name="robots" content="noindex, noarchive">');
});

test("buildHead keeps full title/description (no ellipsis inside real tags)", () => {
  const long = "w".repeat(200);
  const head = M.buildHead({ title: long, description: `d`.repeat(200) });
  notIncludes(head, "…");
});

test("buildHead includes favicon and manifest lines when asked", () => {
  const head = M.buildHead({ includeFavicons: true, includeManifest: true });
  includes(head, '<link rel="icon" href="/favicon.ico" sizes="32x32">');
  includes(head, '<link rel="manifest" href="/site.webmanifest">');
  const lean = M.buildHead({});
  notIncludes(lean, "favicon.ico");
  notIncludes(lean, "manifest");
});

test("buildHead sizes the og:image and tags the twitter handle", () => {
  const head = M.buildHead({
    ogImage: "https://example.com/cover.jpg",
    ogImageWidth: "1200",
    ogImageHeight: "630",
    ogImageAlt: 'A "quoted" alt',
    twitterSite: "Dylan",
    twitterCard: "summary"
  });
  includes(head, '<meta property="og:image:width" content="1200">');
  includes(head, '<meta property="og:image:height" content="630">');
  includes(head, '<meta name="twitter:card" content="summary">');
  includes(head, '<meta name="twitter:site" content="@dylan">');
  includes(head, "A &quot;quoted&quot; alt");
});

test("buildRobotsTxt standard shape", () => {
  const txt = M.buildRobotsTxt({
    baseUrl: "https://example.com/guides/ai",
    disallow: ["/admin/", " /private ", ""],
    sitemapUrl: "https://example.com/sitemap.xml"
  });
  includes(txt, "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /private\n\nSitemap: https://example.com/sitemap.xml\n");
});

test("buildRobotsTxt works with no site map and no blocks", () => {
  const txt = M.buildRobotsTxt({});
  eq(txt, "User-agent: *\nAllow: /\n");
  notIncludes(txt, "Sitemap");
});

test("collectWarnings flags the missing-everything case", () => {
  const warnings = M.collectWarnings({});
  ok(warnings.length >= 3, "at least title, description and url nudges");
  ok(warnings.some(w => /description/i.test(w)));
  ok(warnings.some(w => /canonical/i.test(w)));
});

test("collectWarnings flags over-long title and description", () => {
  const warnings = M.collectWarnings({
    title: "t".repeat(80),
    description: "d".repeat(200),
    url: "https://example.com"
  });
  ok(warnings.some(w => /80 characters/.test(w)), "long title flagged");
  ok(warnings.some(w => /200 characters/.test(w)), "long description flagged");
});

test("collectWarnings accepts a fully filled-in page", () => {
  const warnings = M.collectWarnings({
    title: "Short",
    description: "A tidy little description.",
    url: "https://example.com",
    ogImage: "https://example.com/cover.jpg"
  });
  eq(warnings.length, 0);
});

test("collectWarnings flags repeated title in description", () => {
  const warnings = M.collectWarnings({
    title: "Same words",
    description: "Same words",
    url: "https://example.com",
    ogImage: "https://example.com/cover.jpg"
  });
  ok(warnings.some(w => /identical/i.test(w)));
});

test("ICO container: header counts, sizes, offsets and payloads line up", () => {
  const pngA = new Uint8Array([137, 80, 78, 71, 1, 0, 0, 0]);
  const pngB = new Uint8Array([137, 80, 78, 71, 2, 0, 0, 0, 2, 1]);
  const ico = F.buildIco([
    { size: 16, bytes: pngA },
    { size: 32, bytes: pngB }
  ]);
  const dv = new DataView(ico.buffer);
  eq(dv.getUint16(0, true), 0, "reserved");
  eq(dv.getUint16(2, true), 1, "type is icon");
  eq(dv.getUint16(4, true), 2, "two images");
  eq(dv.getUint8(6, true), 16, "first width");
  eq(dv.getUint8(7, true), 16, "first height");
  eq(dv.getUint16(10, true), 1, "color planes");
  eq(dv.getUint16(12, true), 32, "bit depth");
  eq(dv.getUint32(14, true), pngA.length, "first payload length");
  eq(dv.getUint32(18, true), 6 + 16 * 2, "first image starts after header");
  eq(dv.getUint32(30, true), pngB.length, "second payload length");
  const secondOffset = dv.getUint32(34, true);
  eq(secondOffset, 6 + 16 * 2 + pngA.length, "second image follows the first");
  eq(ico.length, 6 + 16 * 2 + pngA.length + pngB.length, "total size");
  deepEq([...ico.slice(secondOffset, secondOffset + 4)], [...pngB.slice(0, 4)], "second payload is intact");
});

test("ICO container: sizes 256 and up encode as 0, entries stay in bounds", () => {
  const big = new Uint8Array(4);
  const ico = F.buildIco([{ size: 256, bytes: big }]);
  const dv = new DataView(ico.buffer);
  eq(dv.getUint8(6, true), 0, "256 encodes as 0");
  eq(ico.length, 6 + 16 + 4);
});

test("base64ToBytes round-trips", () => {
  const bytes = F.base64ToBytes(Buffer.from("abc.LMNO?!", "utf8").toString("base64").slice(0, 12));
  ok(bytes.length > 0);
  ok(bytes instanceof Uint8Array);
});

const results = {
  passed,
  failed,
  failures
};

if (typeof process !== "undefined") {
  for (const f of failures) {
    console.error("FAIL  " + f.name + "\n      " + f.err);
  }
  console.log(`${passed} passed, ${failed} failed`);
  process.exitCode = failed ? 1 : 0;
  if (typeof module !== "undefined") module.exports = results;
}
export default results;
