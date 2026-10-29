(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./tags.js"), require("./favicon.js"));
  } else {
    root.App = factory(root.MetaForge, root.FaviconForge);
  }
})(typeof self !== "undefined" ? self : this, function (M, F) {
  "use strict";

  var STORE_KEY = "mtf.config.v1";

  function $(id) {
    return document.getElementById(id);
  }

  function val(id) {
    var el = $(id);
    return el ? String(el.value || "").trim() : "";
  }

  function checked(id) {
    var el = $(id);
    return !!(el && el.checked);
  }

  function isDefault(robots) {
    return !robots.noindex && !robots.nofollow && !robots.noarchive && !robots.nosnippet && !robots.noimageindex;
  }

  function readForm() {
    return {
      siteName: val("in-site"),
      title: val("in-title"),
      description: val("in-desc"),
      url: val("in-url"),
      themeColor: val("in-theme"),
      ogType: val("in-og-type") || "website",
      ogImage: val("in-og-image"),
      ogImageWidth: val("in-og-w"),
      ogImageHeight: val("in-og-h"),
      ogImageAlt: val("in-og-alt"),
      twitterCard: val("in-card") || "summary_large_image",
      twitterSite: val("in-twitter"),
      robots: {
        noindex: val("in-index") === "noindex",
        nofollow: val("in-follow") === "nofollow",
        noarchive: checked("chk-archive"),
        nosnippet: checked("chk-snippet"),
        noimageindex: checked("chk-imageindex")
      },
      includeFavicons: checked("chk-favicons"),
      includeManifest: checked("chk-manifest"),
      disallowText: $("in-disallow") ? $("in-disallow").value : "",
      sitemapUrl: val("in-sitemap")
    };
  }

  function setCounter(countEl, text, max) {
    var n = text.length;
    countEl.textContent = n + "/" + max;
    countEl.className = "count" + (n > max ? " over" : "");
  }

  function escNode(id, text) {
    var el = $(id);
    if (el) el.textContent = text;
  }

  function setText(el, text) {
    el.textContent = text;
  }

  function update() {
    var cfg = readForm();

    setCounter($("count-title"), cfg.title, M.TITLE_MAX);
    setCounter($("count-desc"), cfg.description, M.DESC_MAX);

    var parsed = M.parseUrl(cfg.url);
    var siteLetter = (cfg.siteName || "W").charAt(0).toUpperCase();
    escNode("serp-favicon", siteLetter);
    escNode("serp-site", cfg.siteName || "your-site.com");
    $("serp-crumb").textContent = parsed.breadcrumb || "search engines will show your path here";
    escNode("serp-title", cfg.title ? M.truncateTitle(cfg.title) : "Your page title goes here");
    escNode("serp-desc", cfg.description ? M.truncateDescription(cfg.description) : "Your description becomes the snippet text under the title in search results.");

    var ogImg = $("og-img");
    ogImg.style.backgroundImage = cfg.ogImage ? "url('" + cfg.ogImage.replace(/'/g, "%27") + "')" : "";
    ogImg.textContent = cfg.ogImage ? "" : "your preview image would appear here";
    escNode("og-domain", parsed.host || "example.com");
    escNode("og-title", cfg.title || "Your page title");
    escNode("og-desc", M.truncateDescription(cfg.description || "Your description shows up right here."));
    escNode("og-site", cfg.siteName || "Add a site name");

    var twitterHandle = M.normalizeHandle(cfg.twitterSite);
    escNode("tw-name", cfg.siteName || "Your site");
    escNode("tw-handle", twitterHandle || "@yourhandle");
    var xCard = $("x-card");
    xCard.className = cfg.twitterCard === "summary" ? "x-card small" : "x-card";
    var xImg = $("x-img");
    xImg.style.backgroundImage = cfg.ogImage ? "url('" + cfg.ogImage.replace(/'/g, "%27") + "')" : "";
    escNode("x-title", cfg.title || "Your page title");
    escNode("x-desc", M.truncateDescription(cfg.description || "Shortened to fit."));
    escNode("x-domain", parsed.host || "example.com");

    var warnings = M.collectWarnings(cfg);
    var list = $("warnings");
    list.textContent = "";
    if (!warnings.length) {
      var good = document.createElement("li");
      good.className = "good";
      good.textContent = "Looks solid — all the core tags are in place. Copy the head block below and you're set.";
      list.appendChild(good);
    } else {
      for (var i = 0; i < warnings.length; i++) {
        var li = document.createElement("li");
        li.className = "warn";
        li.textContent = warnings[i];
        list.appendChild(li);
      }
    }

    $("out-head").textContent = M.buildHead(cfg);
    $("out-robots").textContent = M.buildRobotsTxt({
      baseUrl: cfg.url,
      disallow: cfg.disallowText.split("\n"),
      sitemapUrl: cfg.sitemapUrl
    });

    var explain = $("robots-explain");
    if (isDefault(cfg.robots)) {
      explain.textContent = "Defaults are the friendly ones: robots may index this page and follow its links, so the robots tag is left out entirely. Flip a switch and the plain-English meaning shows up here.";
    } else {
      var meanings = [];
      if (cfg.robots.noindex) meanings.push("keep this page OUT of search results");
      if (cfg.robots.nofollow) meanings.push("don't follow links found on this page");
      if (cfg.robots.noarchive) meanings.push("don't keep a cached copy on Google");
      if (cfg.robots.nosnippet) meanings.push("don't quote this page's text in search excerpts");
      if (cfg.robots.noimageindex) meanings.push("don't index this page's images in image search");
      explain.textContent = "Your robots tag (" + M.buildRobotsContent(cfg.robots) + ') tells search engines to: ' + meanings.join("; ") + ".";
    }
    return cfg;
  }

  function saveConfig() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(readForm()));
    } catch (e) {}
  }

  function loadConfig() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function applyConfig(saved) {
    if (!saved) return;
    var setVal = function (id, value) {
      var el = $(id);
      if (el && typeof value === "string" && value !== "") el.value = value;
    };
    setVal("in-site", saved.siteName);
    setVal("in-title", saved.title);
    setVal("in-desc", saved.description);
    setVal("in-url", saved.url);
    setVal("in-theme", saved.themeColor);
    setVal("in-og-image", saved.ogImage);
    setVal("in-og-w", saved.ogImageWidth);
    setVal("in-og-h", saved.ogImageHeight);
    setVal("in-og-alt", saved.ogImageAlt);
    setVal("in-twitter", saved.twitterSite);
    setVal("in-card", saved.twitterCard);
    setVal("in-og-type", saved.ogType);
    setVal("in-sitemap", saved.sitemapUrl);
    if (saved.robots) {
      $("in-index").value = saved.robots.noindex ? "noindex" : "index";
      $("in-follow").value = saved.robots.nofollow ? "nofollow" : "follow";
      $("chk-archive").checked = !!saved.robots.noarchive;
      $("chk-snippet").checked = !!saved.robots.nosnippet;
      $("chk-imageindex").checked = !!saved.robots.noimageindex;
    }
  }

  async function copyText(text, button, label) {
    var fallback = function () {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      return ok;
    };
    var ok = true;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        ok = fallback();
      }
    } else {
      ok = fallback();
    }
    button.textContent = ok ? "Copied!" : "Select & copy";
    button.classList.add("done");
    setTimeout(function () {
      button.textContent = label;
      button.classList.remove("done");
    }, 1600);
    return ok;
  }

  function renderFaviconStrip(items, status) {
    var strip = document.getElementById("fav-strip");
    strip.textContent = "";
    for (var i = 0; i < items.length; i++) {
      (function (item) {
        var wrap = document.createElement("div");
        wrap.className = "fav-item";
        if (item.canvas) {
          item.canvas.style.width = "72px";
          item.canvas.style.height = "72px";
          wrap.appendChild(item.canvas);
        }
        var link = document.createElement("a");
        link.href = item.url;
        link.download = item.name;
        link.textContent = item.name;
        wrap.appendChild(link);
        var nameNote = document.createElement("div");
        nameNote.className = "fav-name";
        nameNote.textContent = item.label || "";
        wrap.appendChild(nameNote);
        strip.appendChild(wrap);
      })(items[i]);
    }
    var statusEl = document.getElementById("fav-status");
    if (statusEl) statusEl.textContent = status;
  }

  async function forgeFromSource(source, letterMode, letter, bg) {
    var items = [];
    for (var i = 0; i < F.SIZES.length; i++) {
      var def = F.SIZES[i];
      var canvas = letterMode ? F.letterIcon(letter, bg, def.size) : F.renderSource(source, def.size);
      var bytes = await F.canvasToPngBytes(canvas);
      var blob = F.bytesToBlob(bytes, "image/png");
      items.push({
        name: def.name,
        label: def.size + " px",
        canvas: canvas,
        url: URL.createObjectURL(blob),
        size: def.size,
        bytes: bytes
      });
    }
    var icoEntries = [];
    for (var j = 0; j < F.ICO_SIZES.length; j++) {
      var size = F.ICO_SIZES[j];
      var icoCanvas = letterMode ? F.letterIcon(letter, bg, size) : F.renderSource(source, size);
      icoEntries.push({ size: size, bytes: await F.canvasToPngBytes(icoCanvas) });
    }
    var icoBytes = F.buildIco(icoEntries);
    items.push({
      name: "favicon.ico",
      label: "16 + 32 + 48 bundled",
      url: URL.createObjectURL(F.bytesToBlob(icoBytes, "image/x-icon"))
    });
    renderFaviconStrip(
      items,
      "Forged " + (items.length - 1) + " PNG sizes plus favicon.ico — each has its own download button below."
    );
    return items;
  }

  function init() {
    applyConfig(loadConfig());

    var inputs = [
      "in-site", "in-title", "in-desc", "in-url", "in-theme", "theme-picker",
      "in-og-image", "in-og-w", "in-og-h", "in-og-alt", "in-twitter", "in-card",
      "in-og-type", "in-index", "in-follow", "chk-archive", "chk-snippet",
      "chk-imageindex", "chk-favicons", "chk-manifest", "in-disallow", "in-sitemap"
    ];
    var handler = function () { saveConfig(); update(); };
    for (var i = 0; i < inputs.length; i++) {
      var el = $(inputs[i]);
      if (el) el.addEventListener("input", handler);
    }

    var themePicker = $("theme-picker");
    var themeText = $("in-theme");
    themePicker.addEventListener("input", function () { themeText.value = themePicker.value; });
    themeText.addEventListener("input", function () {
      if (/^#[0-9a-f]{6}$/i.test(themeText.value)) themePicker.value = themeText.value;
    });

    $("btn-copy-head").addEventListener("click", function () {
      copyText($("out-head").textContent, $("btn-copy-head"), "Copy tags");
    });
    $("btn-copy-robots").addEventListener("click", function () {
      copyText($("out-robots").textContent, $("btn-copy-robots"), "Copy robots.txt");
    });

    $("btn-forge").addEventListener("click", async function () {
      var btn = $("btn-forge");
      var fileInput = $("fav-file");
      var file = fileInput.files && fileInput.files[0];
      try {
        btn.disabled = true;
        btn.textContent = "Forging…";
        if (file) {
          var img = await F.loadFileImage(file);
          await forgeFromSource(img, false);
        } else {
          var letter = val("fav-letter") || "A";
          var bg = $("fav-bg") ? $("fav-bg").value : "#7a4f9e";
          await forgeFromSource(null, true, letter, bg);
        }
      } catch (err) {
        var statusEl = $("fav-status");
        if (statusEl) statusEl.textContent = "Couldn't forge icons: " + err.message + " — try a PNG or JPG.";
      } finally {
        btn.disabled = false;
        btn.textContent = "Forge icons";
      }
    });

    update();
  }

  return {
    init: init,
    update: update,
    readForm: readForm,
    applyConfig: applyConfig,
    saveConfig: saveConfig,
    loadConfig: loadConfig,
    copyText: copyText,
    forgeFromSource: forgeFromSource
  };
});
