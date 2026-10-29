(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FaviconForge = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var SIZES = [
    { name: "favicon-16x16.png", size: 16 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 }
  ];
  var ICO_SIZES = [16, 32, 48];

  function base64ToBytes(b64) {
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function buildIco(entries) {
    entries = entries || [];
    var count = entries.length;
    var headerLen = 6 + 16 * count;
    var header = new Uint8Array(headerLen);
    var dv = new DataView(header.buffer);
    dv.setUint16(0, 0, true);
    dv.setUint16(2, 1, true);
    dv.setUint16(4, count, true);
    var totalLen = headerLen;
    for (var i = 0; i < count; i++) totalLen += entries[i].bytes.length;
    var out = new Uint8Array(totalLen);
    var offset = headerLen;
    for (var j = 0; j < count; j++) {
      var e = entries[j];
      var base = 6 + 16 * j;
      var dim = e.size >= 256 ? 0 : e.size;
      dv.setUint8(base, dim, true);
      dv.setUint8(base + 1, dim, true);
      dv.setUint16(base + 4, 1, true);
      dv.setUint16(base + 6, 32, true);
      dv.setUint32(base + 8, e.bytes.length, true);
      dv.setUint32(base + 12, offset, true);
      out.set(e.bytes, offset);
      offset += e.bytes.length;
    }
    out.set(header, 0);
    return out;
  }

  function bytesToBlob(bytes, mime) {
    var copy = new Uint8Array(bytes.length);
    copy.set(bytes);
    return new Blob([copy], { type: mime || "image/png" });
  }

  function canvasToPngBytes(canvas) {
    return new Promise(function (resolve, reject) {
      try {
        if (canvas && typeof canvas.toBlob === "function") {
          canvas.toBlob(function (blob) {
            if (!blob) { reject(new Error("canvas.toBlob returned no data")); return; }
            blob.arrayBuffer().then(function (buf) {
              resolve(new Uint8Array(buf));
            }, reject);
          }, "image/png");
          return;
        }
        var dataUrl = canvas.toDataURL("image/png");
        resolve(base64ToBytes(dataUrl.slice(dataUrl.indexOf(",") + 1)));
      } catch (err) {
        reject(err);
      }
    });
  }

  function createCanvas(size) {
    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    return canvas;
  }

  function drawFitSource(canvas, source) {
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    if ("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality = "high";
    var sw = source.naturalWidth || source.width;
    var sh = source.naturalHeight || source.height;
    var side = Math.min(sw, sh);
    var sx = (sw - side) / 2;
    var sy = (sh - side) / 2;
    ctx.drawImage(source, sx, sy, side, side, 0, 0, canvas.width, canvas.height);
  }

  function renderSource(source, size) {
    var canvas = createCanvas(size);
    drawFitSource(canvas, source);
    return canvas;
  }

  function letterIcon(letter, bg, size) {
    var canvas = createCanvas(size);
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = bg || "#7a4f9e";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold " + Math.round(size * 0.52) + "px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(letter || "A").charAt(0), size / 2, size * 0.54);
    return canvas;
  }

  function loadFileImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("That file doesn't look like an image"));
      };
      img.src = url;
    });
  }

  return {
    SIZES: SIZES,
    ICO_SIZES: ICO_SIZES,
    base64ToBytes: base64ToBytes,
    buildIco: buildIco,
    bytesToBlob: bytesToBlob,
    canvasToPngBytes: canvasToPngBytes,
    createCanvas: createCanvas,
    renderSource: renderSource,
    letterIcon: letterIcon,
    loadFileImage: loadFileImage
  };
});
