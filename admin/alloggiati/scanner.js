/* "Cam scanner" per le foto dei documenti: ritaglia il documento, raddrizza, toglie ombre e alza il contrasto.
   Funzioni pure su pixel in grigio (Uint8Array): funzionano sul telefono e nelle prove. Nessun dato esce dal telefono. */
(function (root) {
"use strict";

function grigio(rgba, w, h) { var g = new Uint8Array(w * h), i, j = 0; for (i = 0; i < rgba.length; i += 4) g[j++] = (rgba[i] * 0.3 + rgba[i + 1] * 0.59 + rgba[i + 2] * 0.11) | 0; return g; }

/* punti "con bordo" (testo, contorno della carta): gradiente forte */
function punti(g, w, h) {
  var mag = new Float32Array(w * h), x, y, s = 0, s2 = 0, n = 0, v;
  for (y = 1; y < h - 1; y++) for (x = 1; x < w - 1; x++) {
    v = Math.abs(g[y * w + x + 1] - g[y * w + x - 1]) + Math.abs(g[(y + 1) * w + x] - g[(y - 1) * w + x]);
    mag[y * w + x] = v; s += v; s2 += v * v; n++;
  }
  var m = s / Math.max(1, n), sd = Math.sqrt(Math.max(0, s2 / Math.max(1, n) - m * m)), soglia = m + 0.8 * sd, P = [];
  for (y = 1; y < h - 1; y++) for (x = 1; x < w - 1; x++) if (mag[y * w + x] > soglia) P.push(x, y);
  return P;
}

/* rettangolo dove c'è il documento: dove i bordi sono abbastanza fitti. Se non è convincente, tutta l'immagine. */
function ritaglio(g, w, h) {
  var P = punti(g, w, h), col = new Uint32Array(w), riga = new Uint32Array(h), i;
  for (i = 0; i < P.length; i += 2) { col[P[i]]++; riga[P[i + 1]]++; }
  function intervallo(v, len, perc) {
    var tot = 0, k; for (k = 0; k < len; k++) tot += v[k];
    if (!tot) return [0, len - 1];
    var a = 0, b = len - 1, acc = 0, tag = tot * perc;
    while (a < len - 1 && acc + v[a] < tag) { acc += v[a]; a++; }
    acc = 0; while (b > 0 && acc + v[b] < tag) { acc += v[b]; b--; }
    return [a, b];
  }
  var cx = intervallo(col, w, 0.02), cy = intervallo(riga, h, 0.02);
  var px = Math.round(w * 0.02), py = Math.round(h * 0.02);
  var x0 = Math.max(0, cx[0] - px), x1 = Math.min(w - 1, cx[1] + px), y0 = Math.max(0, cy[0] - py), y1 = Math.min(h - 1, cy[1] + py);
  var area = (x1 - x0 + 1) * (y1 - y0 + 1) / (w * h);
  if (area < 0.3 || x1 - x0 < 50 || y1 - y0 < 50) return { x: 0, y: 0, w: w, h: h, ritagliato: false };
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, ritagliato: area < 0.97 };
}

/* inclinazione in gradi (positivo = ruotato in senso orario): le righe di testo diventano orizzontali dove l'istogramma è più "a picchi" */
function inclinazione(g, w, h) {
  var P = punti(g, w, h);
  if (P.length < 200) return 0;
  var passo = Math.max(1, Math.floor(P.length / 2 / 20000)), cx = w / 2, cy = h / 2;
  function punteggio(a) {
    var r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), bins = new Uint32Array(w + h + 4), off = (w + h) / 2 | 0, i, y2, sc = 0, k;
    for (i = 0; i < P.length; i += 2 * passo) { y2 = (P[i + 1] - cy) * c - (P[i] - cx) * s; k = Math.round(y2) + off; if (k >= 0 && k < bins.length) bins[k]++; }
    for (k = 0; k < bins.length; k++) sc += bins[k] * bins[k];
    return sc;
  }
  var best = 0, bs = -1, a, sc;
  for (a = -20; a <= 20; a += 2) { sc = punteggio(a); if (sc > bs) { bs = sc; best = a; } }
  var b2 = best;
  for (a = best - 1.5; a <= best + 1.5; a += 0.5) { sc = punteggio(a); if (sc > bs) { bs = sc; b2 = a; } }
  // se il miglioramento è piccolo, non toccare (evita di ruotare per niente)
  return Math.abs(b2) < 1 || punteggio(0) > bs * 0.97 ? 0 : b2;
}

/* toglie ombre e sfondo non uniforme (divide per lo sfondo sfocato) e stira il contrasto */
function normalizza(g, w, h) {
  var W = w + 1, S = new Uint32Array(W * (h + 1)), x, y, rs;
  for (y = 0; y < h; y++) { rs = 0; for (x = 0; x < w; x++) { rs += g[y * w + x]; S[(y + 1) * W + x + 1] = S[y * W + x + 1] + rs; } }
  var r = Math.max(8, Math.round(Math.max(w, h) / 24)), out = new Uint8Array(w * h), x0, x1, y0, y1, n, bg, v, hist = new Uint32Array(256);
  for (y = 0; y < h; y++) {
    y0 = Math.max(0, y - r); y1 = Math.min(h, y + r + 1);
    for (x = 0; x < w; x++) {
      x0 = Math.max(0, x - r); x1 = Math.min(w, x + r + 1); n = (x1 - x0) * (y1 - y0);
      bg = (S[y1 * W + x1] - S[y0 * W + x1] - S[y1 * W + x0] + S[y0 * W + x0]) / n;
      v = g[y * w + x] * 215 / Math.max(40, bg); out[y * w + x] = v > 255 ? 255 : v < 0 ? 0 : v; hist[out[y * w + x]]++;
    }
  }
  var tot = w * h, acc = 0, lo = 0, hi = 255;
  while (lo < 254 && acc + hist[lo] < tot * 0.01) { acc += hist[lo]; lo++; }
  acc = 0; while (hi > lo + 1 && acc + hist[hi] < tot * 0.15) { acc += hist[hi]; hi--; }
  var k = 255 / Math.max(1, hi - lo), i;
  for (i = 0; i < out.length; i++) { v = (out[i] - lo) * k; out[i] = v > 255 ? 255 : v < 0 ? 0 : v; }
  return out;
}

root.SCAN = { grigio: grigio, ritaglio: ritaglio, inclinazione: inclinazione, normalizza: normalizza };
if (typeof module !== "undefined" && module.exports) module.exports = root.SCAN;
})(typeof window !== "undefined" ? window : globalThis);
