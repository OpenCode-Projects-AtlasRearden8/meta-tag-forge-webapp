(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MetaForge = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var TITLE_MAX = 60;
  var DESC_MAX = 160;

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function truncate(text, max) {
    var s = String(text == null ? "" : text);
    if (max == null) max = DESC_MAX;
    if (s.length <= max) return s;
    var cut = s.slice(0, max);
    var space = cut.lastIndexOf(" ");
    if (space > max * 0.6) cut = cut.slice(0, space);
    return cut.replace(/[.,;:!?\s]+$/, "") + "\u2026";
  }

  function truncateTitle(text) {
    return truncate(text, TITLE_MAX);
  }

  function truncateDescription(text) {
    return truncate(text, DESC_MAX);
  }

  function normalizeHandle(handle) {
    var s = String(handle == null ? "" : handle).trim().toLowerCase().replace(/^@+/, "");
    if (!s) return "";
    return "@" + s;
  }

  function parseUrl(raw) {
    var s = String(raw == null ? "" : raw).trim();
    if (!s) return { ok: false, host: "", breadcrumb: "", href: "" };
    try {
      var u = new URL(s);
      var segments = u.pathname
        .replace(/\/+$/, "")
        .split("/")
        .filter(Boolean)
        .map(function (seg) { return seg.replace(/\.html?$/i, ""); });
      var breadcrumb = u.host;
      if (segments.length) breadcrumb = u.host + " \u203A " + segments.join(" \u203A ");
      return { ok: true, host: u.host, breadcrumb: breadcrumb, href: u.href };
    } catch (e) {
      return { ok: false, host: "", breadcrumb: "", href: s };
    }
  }

  function buildRobotsContent(robots) {
    var r = robots || {};
    var parts = [];
    if (r.noindex) parts.push("noindex");
    if (r.nofollow) parts.push("nofollow");
    if (r.noarchive) parts.push("noarchive");
    if (r.nosnippet) parts.push("nosnippet");
    if (r.noimageindex) parts.push("noimageindex");
    return parts.join(", ");
  }

  function faviconLinks() {
    return [
      '<link rel="icon" href="/favicon.ico" sizes="32x32">',
      '<link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png">',
      '<link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png">',
      '<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">'
    ];
  }

  function buildHead(cfg) {
    cfg = cfg || {};
    var lines = [];
    if (cfg.title) {
      lines.push("<title>" + escapeHtml(cfg.title) + "</title>");
    }
    if (cfg.description) {
      lines.push('<meta name="description" content="' + escapeHtml(cfg.description) + '">');
    }
    if (cfg.url) {
      lines.push('<link rel="canonical" href="' + escapeHtml(cfg.url) + '">');
    }
    var robotsContent = buildRobotsContent(cfg.robots);
    if (robotsContent) {
      lines.push('<meta name="robots" content="' + escapeHtml(robotsContent) + '">');
    }
    if (cfg.themeColor) {
      lines.push('<meta name="theme-color" content="' + escapeHtml(cfg.themeColor) + '">');
    }
    if (cfg.includeFavicons) {
      lines = lines.concat(faviconLinks());
    }
    lines.push('<meta property="og:type" content="' + escapeHtml(cfg.ogType || "website") + '">');
    if (cfg.siteName) {
      lines.push('<meta property="og:site_name" content="' + escapeHtml(cfg.siteName) + '">');
    }
    if (cfg.title) {
      lines.push('<meta property="og:title" content="' + escapeHtml(cfg.title) + '">');
    }
    if (cfg.description) {
      lines.push('<meta property="og:description" content="' + escapeHtml(cfg.description) + '">');
    }
    if (cfg.url) {
      lines.push('<meta property="og:url" content="' + escapeHtml(cfg.url) + '">');
    }
    if (cfg.ogImage) {
      lines.push('<meta property="og:image" content="' + escapeHtml(cfg.ogImage) + '">');
      if (cfg.ogImageWidth) {
        lines.push('<meta property="og:image:width" content="' + escapeHtml(cfg.ogImageWidth) + '">');
      }
      if (cfg.ogImageHeight) {
        lines.push('<meta property="og:image:height" content="' + escapeHtml(cfg.ogImageHeight) + '">');
      }
      if (cfg.ogImageAlt) {
        lines.push('<meta property="og:image:alt" content="' + escapeHtml(cfg.ogImageAlt) + '">');
      }
    }
    lines.push('<meta name="twitter:card" content="' + escapeHtml(cfg.twitterCard || "summary_large_image") + '">');
    if (cfg.twitterSite) {
      lines.push('<meta name="twitter:site" content="' + escapeHtml(normalizeHandle(cfg.twitterSite)) + '">');
    }
    if (cfg.title) {
      lines.push('<meta name="twitter:title" content="' + escapeHtml(cfg.title) + '">');
    }
    if (cfg.description) {
      lines.push('<meta name="twitter:description" content="' + escapeHtml(cfg.description) + '">');
    }
    if (cfg.ogImage) {
      lines.push('<meta name="twitter:image" content="' + escapeHtml(cfg.ogImage) + '">');
    }
    if (cfg.includeManifest) {
      lines.push('<link rel="manifest" href="/site.webmanifest">');
    }
    return lines.join("\n");
  }

  function buildRobotsTxt(cfg) {
    cfg = cfg || {};
    cfg.disallow = cfg.disallow || [];
    var lines = ["User-agent: *", "Allow: /"];
    for (var i = 0; i < cfg.disallow.length; i++) {
      var path = String(cfg.disallow[i]).trim();
      if (path) lines.push("Disallow: " + path);
    }
    if (cfg.sitemapUrl) lines.push("", "Sitemap: " + cfg.sitemapUrl);
    return lines.join("\n") + "\n";
  }

  function collectWarnings(cfg) {
    cfg = cfg || {};
    var out = [];
    if (!cfg.title) {
      out.push("No page title yet. The title is the single most important tag \u2014 every search result and social card shows it.");
    } else if (cfg.title.length > TITLE_MAX) {
      out.push("Title is " + cfg.title.length + " characters; Google typically clips around " + TITLE_MAX + ", so keep the important words up front.");
    }
    if (!cfg.description) {
      out.push("No description yet. Without one, search engines may invent their own snippet for your page.");
    } else if (cfg.description.length > DESC_MAX) {
      out.push("Description is " + cfg.description.length + " characters; snippets usually stop near " + DESC_MAX + ".");
    }
    if (cfg.title && cfg.description && cfg.title === cfg.description) {
      out.push("Title and description are identical \u2014 use the description to add a sentence the title doesn't already say.");
    }
    var parsed = parseUrl(cfg.url);
    if (!cfg.url) {
      out.push("No canonical URL. Add it so search engines don't count copy-pasted variants of this page as duplicates.");
    } else if (!parsed.ok) {
      out.push("The canonical URL doesn't look like a full address \u2014 it needs the https:// part.");
    }
    if (cfg.ogImage && !parseUrl(cfg.ogImage).ok) {
      out.push("The preview image URL should be a full https:// address. Social sites can't fetch relative paths.");
    }
    if (!cfg.ogImage) {
      out.push("No preview image set. Social cards look bare without one; aim for 1200\u00D7630 pixels.");
    }
    if (cfg.twitterCard === "summary_large_image" && !cfg.ogImage) {
      out.push("You picked the big-image Twitter card, but there's no image URL \u2014 it will fall back to a small square.");
    }
    return out;
  }

  return {
    TITLE_MAX: TITLE_MAX,
    DESC_MAX: DESC_MAX,
    escapeHtml: escapeHtml,
    truncate: truncate,
    truncateTitle: truncateTitle,
    truncateDescription: truncateDescription,
    normalizeHandle: normalizeHandle,
    parseUrl: parseUrl,
    buildRobotsContent: buildRobotsContent,
    faviconLinks: faviconLinks,
    buildHead: buildHead,
    buildRobotsTxt: buildRobotsTxt,
    collectWarnings: collectWarnings
  };
});
