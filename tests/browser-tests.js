(function () {
  "use strict";

  var M = window.MetaForge;
  var F = window.FaviconForge;
  var resultsEl = document.getElementById("results");
  var summaryEl = document.getElementById("summary");
  var passed = 0;
  var failed = 0;

  function line(name, okFlag, err) {
    var li = document.createElement("li");
    li.className = okFlag ? "ok" : "fail";
    li.textContent = (okFlag ? "ok    " : "FAIL  ") + name + (okFlag ? "" : " — " + err);
    resultsEl.appendChild(li);
  }

  function test(name, fn) {
    try {
      fn();
      passed++;
      line(name, true);
    } catch (err) {
      failed++;
      line(name, false, err.message);
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
    if (!String(haystack).includes(needle)) {
      throw new Error((label || "haystack") + " — missing " + JSON.stringify(needle) + "\n--- got ---\n" + haystack);
    }
  }
  function deepEq(actual, expected, label) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error((label || "value") + " — expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual));
    }
  }

  test("escapeHtml escapes the five risky characters", function () {
    eq(M.escapeHtml('a & b < c > d " e \' f'), "a &amp; b &lt; c &gt; d &quot; e &#39; f");
  });

  test("truncate leaves short text and clips long text with an ellipsis", function () {
    eq(M.truncate("Short and sweet", 160), "Short and sweet");
    var long = "This is a fairly long description sentence that just keeps going on and on and on and on and needs to stop somewhere before it hits the hard limit we set for what Google is willing to show.";
    var out = M.truncate(long, 160);
    ok(out.length <= 161, "fits budget");
    ok(out.endsWith("…"), "ends with ellipsis");
  });

  test("truncateTitle and truncateDescription use 60 and 160 budgets", function () {
    ok(M.truncateTitle("t".repeat(99)).length <= 61);
    ok(M.truncateDescription("d".repeat(300)).length <= 161);
  });

  test("normalizeHandle adds one @, lowercases, collapses repeats", function () {
    eq(M.normalizeHandle("Dylan"), "@dylan");
    eq(M.normalizeHandle("@@DYLAN "), "@dylan");
    eq(M.normalizeHandle(""), "");
  });

  test("parseUrl builds host and breadcrumb", function () {
    var p = M.parseUrl("https://example.com/guides/first-steps.html");
    eq(p.breadcrumb, "example.com › guides › first-steps");
    ok(!M.parseUrl("not a url").ok);
  });

  test("robots content joins directives, stays empty at defaults", function () {
    eq(M.buildRobotsContent({ noindex: true, noarchive: true }), "noindex, noarchive");
    eq(M.buildRobotsContent({}), "");
  });

  test("buildHead emits core tags, escaped values, favicon lines", function () {
    var head = M.buildHead({
      siteName: "My Site",
      title: 'My "Page" & <test>',
      description: "desc 'quoted'",
      url: "https://example.com/page",
      robots: { noindex: true },
      includeFavicons: true
    });
    includes(head, "<title>My &quot;Page&quot; &amp; &lt;test&gt;</title>");
    includes(head, "desc &#39;quoted&#39;");
    includes(head, '<meta name="robots" content="noindex">');
    includes(head, '<link rel="icon" href="/favicon.ico" sizes="32x32">');
    ok(head.indexOf("<title>") === 0, "title first");
    ok(!head.includes("…"), "tags carry full text, previews do the clipping");
  });

  test("buildRobotsTxt standard shape", function () {
    var txt = M.buildRobotsTxt({
      baseUrl: "https://example.com",
      disallow: ["/admin/", "  "],
      sitemapUrl: "https://example.com/sitemap.xml"
    });
    includes(txt, "User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: https://example.com/sitemap.xml\n");
  });

  test("collectWarnings nudges the empty form", function () {
    var warnings = M.collectWarnings({});
    ok(warnings.length >= 3, "several nudges for an empty form");
    eq(M.collectWarnings({
      title: "Short",
      description: "A tidy description.",
      url: "https://example.com",
      ogImage: "https://example.com/cover.jpg"
    }).length, 0, "none for a complete page");
  });

  test("ICO container packs entries with correct sizes and offsets", function () {
    var pngA = new Uint8Array([137, 80, 78, 71, 1, 0, 0, 0]);
    var pngB = new Uint8Array([137, 80, 78, 71, 2, 0, 0, 0, 2, 1]);
    var ico = F.buildIco([{ size: 16, bytes: pngA }, { size: 32, bytes: pngB }]);
    var dv = new DataView(ico.buffer);
    eq(dv.getUint16(2, true), 1, "type icon");
    eq(dv.getUint16(4, true), 2, "two images");
    eq(dv.getUint8(6), 16, "width 16");
    eq(dv.getUint32(14, true), pngA.length, "first payload size");
    eq(dv.getUint32(18, true), 6 + 16 * 2, "first offset after header");
    eq(ico.length, 6 + 16 * 2 + pngA.length + pngB.length, "total size");
  });

  test("letter icon canvas renders at every forges size", function () {
    [16, 32, 48, 180, 192, 512].forEach(function (size) {
      var canvas = F.letterIcon("M", "#7a4f9e", size);
      eq(canvas.width, size, "width " + size);
      eq(canvas.height, size, "height " + size);
    });
  });

  summaryEl.textContent = passed + " passed, " + failed + " failed";
  summaryEl.className = failed ? "summary fail" : "summary ok";
  document.title = (failed ? "FAIL " : "PASS ") + " — Meta Tag Forge tests";
})();
