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


/* ===================== SCANSIONE «COME LE APP SCANNER» =====================
   1) angoli(): trova i 4 angoli del documento anche se fotografato di sbieco (linee dei bordi con la trasformata di Hough,
      poi il quadrilatero più grande con i lati davvero «sul bordo»); se il bordo non si vede, null.
   2) raddrizza(): porta il quadrilatero a rettangolo (omografia, campionamento bilineare): il documento diventa «piatto».
   3) migliora(): toglie ombre e sfondo grigio mantenendo i colori (fondo bianco, testo scuro), come «Migliora» degli scanner.
   Tutto sul telefono, nessun dato esce. */
function riduci(g, w, h, M) {
  var k = Math.min(1, M / Math.max(w, h)), W = Math.max(8, Math.round(w * k)), H = Math.max(8, Math.round(h * k)), o = new Uint8Array(W * H), x, y, xx, yy, s, n;
  for (y = 0; y < H; y++) {
    var y0 = Math.floor(y / k), y1 = Math.max(y0 + 1, Math.min(h, Math.floor((y + 1) / k)));
    for (x = 0; x < W; x++) {
      var x0 = Math.floor(x / k), x1 = Math.max(x0 + 1, Math.min(w, Math.floor((x + 1) / k))); s = 0; n = 0;
      for (yy = y0; yy < y1; yy += 1 + ((y1 - y0) >> 2)) for (xx = x0; xx < x1; xx += 1 + ((x1 - x0) >> 2)) { s += g[yy * w + xx]; n++; }
      o[y * W + x] = s / n;
    }
  }
  return { g: o, w: W, h: H, k: k };
}
function sfoca(g, w, h) { var o = new Uint8Array(w * h), x, y, s, n, dx, dy; for (y = 0; y < h; y++) for (x = 0; x < w; x++) { s = 0; n = 0; for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++) { var X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h) { s += g[Y * w + X]; n++; } } o[y * w + x] = s / n; } return o; }
function incrocio(a, b) { var c1 = Math.cos(a.t), s1 = Math.sin(a.t), c2 = Math.cos(b.t), s2 = Math.sin(b.t), d = c1 * s2 - s1 * c2; if (Math.abs(d) < 1e-6) return null; return [(a.r * s2 - b.r * s1) / d, (c1 * b.r - c2 * a.r) / d]; }
function canale(rgba, w, h, c) { var o = new Uint8Array(w * h), i, j = 0; for (i = c; i < rgba.length; i += 4) o[j++] = rgba[i]; return o; }
function angoli(g, w, h, rgba, multi) {
  // i bordi si cercano su più «canali»: grigio e, se ci sono i colori, rosso, verde, blu (una carta chiara su un tavolo chiaro si stacca per il colore)
  var CH = [g]; if (rgba && rgba.length === w * h * 4) CH.push(canale(rgba, w, h, 0), canale(rgba, w, h, 1), canale(rgba, w, h, 2));
  var R, W, H, N, mag, dir, x, y, i, hist = new Uint32Array(1024), PIC = [], TUTTI = [];
  CH.forEach(function (ch, q) {
    var Rq = riduci(ch, w, h, 420); if (!q) { R = Rq; W = R.w; H = R.h; N = W * H; mag = new Float32Array(N); dir = new Float32Array(N); }
    var b = sfoca(sfoca(Rq.g, W, H), W, H); PIC.push(b);
    for (y = 1; y < H - 1; y++) for (x = 1; x < W - 1; x++) {
      i = y * W + x;
      var gx = -b[i - W - 1] - 2 * b[i - 1] - b[i + W - 1] + b[i - W + 1] + 2 * b[i + 1] + b[i + W + 1];
      var gy = -b[i - W - 1] - 2 * b[i - W] - b[i - W + 1] + b[i + W - 1] + 2 * b[i + W] + b[i + W + 1];
      var m = Math.sqrt(gx * gx + gy * gy); if (m > mag[i]) { mag[i] = m; dir[i] = Math.atan2(gy, gx); }
    }
  });
  for (i = 0; i < N; i++) hist[Math.min(1023, mag[i] | 0)]++;
  var soglie = [0.12, 0.25].map(function (f) { var acc0 = 0, s = 1023; while (s > 8 && acc0 + hist[s] < N * f) { acc0 += hist[s]; s--; } return Math.max(s, 12); });
  var soglia = soglie[0];
  var bordo = new Uint8Array(N); for (i = 0; i < N; i++) if (mag[i] > soglie[1]) bordo[i] = 1; // per verificare i lati basta un bordo debole
  var forte = new Uint8Array(N); for (i = 0; i < N; i++) if (mag[i] > soglia) forte[i] = 1;
  // Hough: ogni punto vota solo gli angoli vicini alla direzione del suo gradiente
  var D = Math.ceil(Math.sqrt(W * W + H * H)), NR = 2 * D + 1, A = new Uint16Array(180 * NR), COS = [], SIN = [], t;
  for (t = 0; t < 180; t++) { COS[t] = Math.cos(t * Math.PI / 180); SIN[t] = Math.sin(t * Math.PI / 180); }
  for (y = 1; y < H - 1; y++) for (x = 1; x < W - 1; x++) {
    i = y * W + x; if (!forte[i]) continue;
    var tg = Math.round(dir[i] * 180 / Math.PI); tg = ((tg % 180) + 180) % 180;
    for (var dt = -6; dt <= 6; dt++) { t = (tg + dt + 180) % 180; var r = Math.round(x * COS[t] + y * SIN[t]) + D; A[t * NR + r]++; }
  }
  // le linee più votate, senza doppioni
  var cand = [], minV = Math.min(W, H) * 0.18;
  for (i = 0; i < A.length; i++) if (A[i] >= minV) cand.push(i);
  cand.sort(function (p, q) { return A[q] - A[p]; });
  var L = [];
  for (var c = 0; c < cand.length && L.length < 36; c++) {
    var tt = Math.floor(cand[c] / NR), rr = cand[c] % NR - D, dopp = false;
    for (var j = 0; j < L.length && !dopp; j++) {
      var d1 = Math.abs(L[j].td - tt), rr2 = L[j].r;
      if (d1 < 7 && Math.abs(rr2 - rr) < 10) dopp = true;
      if (180 - d1 < 7 && Math.abs(rr2 + rr) < 10) dopp = true;
    }
    if (!dopp) L.push({ td: tt, t: tt * Math.PI / 180, r: rr, v: A[cand[c]] });
  }
  var oriz = L.filter(function (l) { return l.td >= 50 && l.td <= 130; }), vert = L.filter(function (l) { return l.td <= 40 || l.td >= 140; });
  var yA = function (l, xx) { return (l.r - xx * Math.cos(l.t)) / Math.sin(l.t); }, xA = function (l, yy) { return (l.r - yy * Math.sin(l.t)) / Math.cos(l.t); };
  var sul = function (p, q) { // il lato p→q è un vero bordo? bordo con la direzione giusta + differenza tra dentro e fuori
    var len = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(8, Math.round(len / 2)), ok = 0, con = 0, k, ux = (q[0] - p[0]) / len, uy = (q[1] - p[1]) / len, nx = -uy, ny = ux;
    for (k = 1; k < n; k++) {
      var X = p[0] + (q[0] - p[0]) * k / n, Y = p[1] + (q[1] - p[1]) * k / n, trov = 0, dx, dy;
      for (dy = -2; dy <= 2 && !trov; dy++) for (dx = -2; dx <= 2 && !trov; dx++) {
        var XX = Math.round(X) + dx, YY = Math.round(Y) + dy; if (XX < 0 || YY < 0 || XX >= W || YY >= H) continue;
        var j = YY * W + XX; if (bordo[j] && Math.abs(Math.cos(dir[j]) * nx + Math.sin(dir[j]) * ny) > 0.87) trov = 1;
      }
      ok += trov;
      var xi = Math.round(X + nx * 4), yi = Math.round(Y + ny * 4), xo = Math.round(X - nx * 4), yo = Math.round(Y - ny * 4);
      if (xi >= 0 && yi >= 0 && xi < W && yi < H && xo >= 0 && yo >= 0 && xo < W && yo < H) { var dmax = 0; for (var c = 0; c < PIC.length; c++) dmax = Math.max(dmax, Math.abs(PIC[c][yi * W + xi] - PIC[c][yo * W + xo])); if (dmax > 14) con++; }
      else con += 0.5; // lato sul bordo della foto: non si può dire
    }
    return Math.min(ok, con * 1.15) / (n - 1);
  };
  var best = null, a1, a2, v1, v2;
  for (a1 = 0; a1 < oriz.length; a1++) for (a2 = a1 + 1; a2 < oriz.length; a2++) {
    var top = oriz[a1], bot = oriz[a2]; if (yA(top, W / 2) > yA(bot, W / 2)) { top = oriz[a2]; bot = oriz[a1]; }
    if (yA(bot, W / 2) - yA(top, W / 2) < H * 0.18) continue;
    for (v1 = 0; v1 < vert.length; v1++) for (v2 = v1 + 1; v2 < vert.length; v2++) {
      var sx = vert[v1], dx_ = vert[v2]; if (xA(sx, H / 2) > xA(dx_, H / 2)) { sx = vert[v2]; dx_ = vert[v1]; }
      if (xA(dx_, H / 2) - xA(sx, H / 2) < W * 0.18) continue;
      var P = [incrocio(top, sx), incrocio(top, dx_), incrocio(bot, dx_), incrocio(bot, sx)];
      if (P.some(function (p) { return !p || p[0] < -W * 0.04 || p[1] < -H * 0.04 || p[0] > W * 1.04 || p[1] > H * 1.04; })) continue;
      var area = 0; for (var k = 0; k < 4; k++) { var p0 = P[k], p1 = P[(k + 1) % 4]; area += p0[0] * p1[1] - p1[0] * p0[1]; } area = area / 2 / (W * H);
      if (area < (multi ? 0.035 : 0.1)) continue;
      var conv = true; for (k = 0; k < 4 && conv; k++) { var a = P[k], bb = P[(k + 1) % 4], cc = P[(k + 2) % 4]; if ((bb[0] - a[0]) * (cc[1] - bb[1]) - (bb[1] - a[1]) * (cc[0] - bb[0]) <= 0) conv = false; }
      if (!conv) continue;
      var cov = [sul(P[0], P[1]), sul(P[1], P[2]), sul(P[2], P[3]), sul(P[3], P[0])], mn = Math.min.apply(null, cov), me = (cov[0] + cov[1] + cov[2] + cov[3]) / 4;
      if (me < 0.5 || mn < 0.3) continue;
      var sc = me * (mn + 0.3) * Math.sqrt(area);
      var cand = { sc: sc, P: P, cov: me, mn: mn, area: area };
      if (multi) TUTTI.push(cand);
      if (area >= 0.1 && (!best || sc > best.sc)) best = cand;
    }
  }
  var fuori = function (b) { var s = 1 / R.k, P0 = b.P.map(function (p) { return [p[0] * s, p[1] * s]; }), Pf = affina(CH, w, h, P0) || P0;
    return { punti: Pf.map(function (p) { return [Math.max(0, Math.min(w - 1, p[0])), Math.max(0, Math.min(h - 1, p[1]))]; }), sicurezza: Math.round(b.cov * 100) / 100, area: Math.round(b.area * 100) / 100 }; };
  if (!multi) return best ? fuori(best) : null;
  return sceltaMulti(best, TUTTI).map(fuori);
}
/* Più documenti nella stessa foto (es. due carte d'identità, o fronte e retro affiancati).
   1) se il quadrilatero migliore contiene DUE documenti ben chiusi che insieme lo riempiono, sono due documenti;
   2) si aggiungono altri documenti staccati, di misura simile e con i bordi chiari. Mai più di 4. */
function centroDi(P) { return [(P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4, (P[0][1] + P[1][1] + P[2][1] + P[3][1]) / 4]; }
function dentroQ(p, P, m) { for (var i = 0; i < 4; i++) { var a = P[i], b = P[(i + 1) % 4], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; if (((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) / l < -(m || 0)) return false; } return true; }
function scatola(P) { var xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; }); return [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)]; }
function sovrapp(A, B) { var a = scatola(A), b = scatola(B), ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])), iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])); return ix * iy / Math.min((a[2] - a[0]) * (a[3] - a[1]), (b[2] - b[0]) * (b[3] - b[1])); }
function sceltaMulti(best, T) {
  var buoni = T.filter(function (c) { return c.cov >= 0.7 && c.mn >= 0.5; });
  var docs = best ? [best] : [], i, j;
  if (best) { // 1) il migliore è in realtà due documenti vicini?
    var dent = buoni.filter(function (c) { return c !== best && c.area >= best.area * 0.2 && c.area <= best.area * 0.8 && c.P.every(function (p) { return dentroQ(p, best.P, 6); }); }), coppia = null;
    for (i = 0; i < dent.length; i++) for (j = i + 1; j < dent.length; j++) {
      var B = dent[i], C = dent[j]; if (sovrapp(B.P, C.P) > 0.12 || B.area + C.area < best.area * 0.7) continue;
      // i due pezzi devono occupare insieme i 4 angoli del «grande» (2 a testa): così non si scambia la fototessera o un riquadro interno per un documento
      var sb = scatola(best.P), tol = Math.hypot(sb[2] - sb[0], sb[3] - sb[1]) * 0.07, presi = [0, 0, 0, 0];
      var angoliDi = function (X) { var n = 0; best.P.forEach(function (a, q) { if (X.P.some(function (p) { return Math.hypot(p[0] - a[0], p[1] - a[1]) < tol; })) { presi[q]++; n++; } }); return n; };
      var nb = angoliDi(B), nc = angoliDi(C);
      if (nb < 2 || nc < 2 || presi.some(function (x) { return x !== 1; })) continue;
      if (B.cov < best.cov - 0.05 || C.cov < best.cov - 0.05) continue;
      if (B.area / C.area > 2.5 || C.area / B.area > 2.5) continue;
      if (!coppia || B.sc + C.sc > coppia.sc) coppia = { sc: B.sc + C.sc, d: [B, C] };
    }
    if (coppia) docs = coppia.d;
  }
  if (!docs.length) { buoni.sort(function (a, b) { return b.sc - a.sc; }); if (buoni[0]) docs = [buoni[0]]; }
  // 2) altri documenti staccati
  buoni.sort(function (a, b) { return b.sc - a.sc; });
  for (i = 0; i < buoni.length && docs.length < 4; i++) {
    var c = buoni[i]; if (docs.indexOf(c) >= 0) continue;
    var rif = docs[0], ok = c.sc >= rif.sc * 0.45 && c.area >= rif.area / 3 && c.area <= rif.area * 3;
    for (j = 0; j < docs.length && ok; j++) if (sovrapp(c.P, docs[j].P) > 0.1 || dentroQ(centroDi(c.P), docs[j].P) || dentroQ(centroDi(docs[j].P), c.P)) ok = false;
    if (ok) docs.push(c);
  }
  return docs.sort(function (a, b) { var ca = centroDi(a.P), cb = centroDi(b.P); return Math.abs(ca[1] - cb[1]) > 40 ? ca[1] - cb[1] : ca[0] - cb[0]; });
}
function documenti(g, w, h, rgba) { return angoli(g, w, h, rgba, true); }
/* precisione: ogni lato viene rimesso sul bordo vero guardando la foto più grande (salto di colore più forte lungo la perpendicolare) */
function affina(CH, w, h, P) {
  var RR = CH.map(function (c) { return riduci(c, w, h, 1100); }), k = RR[0].k, W = RR[0].w, H = RR[0].h, IM = RR.map(function (r) { return sfoca(r.g, W, H); });
  var Q = P.map(function (p) { return [p[0] * k, p[1] * k]; }), banda = Math.max(4, Math.round(5 * 1100 / 420 * 0.8)), linee = [];
  for (var e = 0; e < 4; e++) {
    var a = Q[e], b = Q[(e + 1) % 4], len = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len, nx = -uy, ny = ux, pts = [];
    for (var t = 0.08; t <= 0.92; t += 0.02) {
      var X = a[0] + (b[0] - a[0]) * t, Y = a[1] + (b[1] - a[1]) * t, bestd = 0, bests = -1;
      for (var d = -banda; d <= banda; d++) {
        var x1 = Math.round(X + nx * (d + 1)), y1 = Math.round(Y + ny * (d + 1)), x0 = Math.round(X + nx * (d - 1)), y0 = Math.round(Y + ny * (d - 1));
        if (x0 < 0 || y0 < 0 || x1 < 0 || y1 < 0 || x0 >= W || x1 >= W || y0 >= H || y1 >= H) continue;
        var sc = 0; for (var c = 0; c < IM.length; c++) sc = Math.max(sc, Math.abs(IM[c][y1 * W + x1] - IM[c][y0 * W + x0]));
        if (sc > bests) { bests = sc; bestd = d; }
      }
      if (bests > 12) pts.push([X + nx * bestd, Y + ny * bestd, bestd]);
    }
    if (pts.length < 10) { linee.push(null); continue; }
    var ds = pts.map(function (q) { return q[2]; }).sort(function (x, y) { return x - y; }), med = ds[ds.length >> 1];
    pts = pts.filter(function (q) { return Math.abs(q[2] - med) <= 2; });
    if (pts.length < 8) { linee.push(null); continue; }
    // retta ai minimi quadrati (in forma normale)
    var mx = 0, my = 0; pts.forEach(function (q) { mx += q[0]; my += q[1]; }); mx /= pts.length; my /= pts.length;
    var sxx = 0, syy = 0, sxy = 0; pts.forEach(function (q) { var dx = q[0] - mx, dy = q[1] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
    var th = 0.5 * Math.atan2(2 * sxy, sxx - syy), nxx = -Math.sin(th), nyy = Math.cos(th);
    linee.push({ t: Math.atan2(nyy, nxx), r: mx * nxx + my * nyy });
  }
  var out = [];
  for (var i = 0; i < 4; i++) {
    var L1 = linee[(i + 3) % 4], L2 = linee[i];
    if (!L1 || !L2) { out.push([Q[i][0] / k, Q[i][1] / k]); continue; }
    var p = incrocio(L1, L2); if (!p || Math.hypot(p[0] - Q[i][0], p[1] - Q[i][1]) > banda * 3) { out.push([Q[i][0] / k, Q[i][1] / k]); continue; }
    out.push([p[0] / k, p[1] / k]);
  }
  return out;
}
/* omografia che porta il rettangolo (0,0)-(W,H) sul quadrilatero Q (in senso orario da in alto a sinistra) */
function omografia(Q, W, H) {
  var S = [[0, 0], [W, 0], [W, H], [0, H]], M = [], v = [], i, j, k;
  for (i = 0; i < 4; i++) { var x = S[i][0], y = S[i][1], X = Q[i][0], Y = Q[i][1];
    M.push([x, y, 1, 0, 0, 0, -x * X, -y * X]); v.push(X); M.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]); v.push(Y); }
  for (i = 0; i < 8; i++) { var piv = i; for (j = i + 1; j < 8; j++) if (Math.abs(M[j][i]) > Math.abs(M[piv][i])) piv = j;
    var tm = M[i]; M[i] = M[piv]; M[piv] = tm; var tv = v[i]; v[i] = v[piv]; v[piv] = tv;
    if (Math.abs(M[i][i]) < 1e-12) return null;
    for (j = 0; j < 8; j++) if (j !== i) { var f = M[j][i] / M[i][i]; for (k = i; k < 8; k++) M[j][k] -= f * M[i][k]; v[j] -= f * v[i]; } }
  var h = []; for (i = 0; i < 8; i++) h.push(v[i] / M[i][i]); h.push(1); return h;
}
function misure(Q, lungo) { // larghezza e altezza giuste per il documento raddrizzato
  var d = function (a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }, w = Math.max(d(Q[0], Q[1]), d(Q[3], Q[2])), h = Math.max(d(Q[0], Q[3]), d(Q[1], Q[2])), k = lungo / Math.max(w, h);
  return { w: Math.max(16, Math.round(w * k)), h: Math.max(16, Math.round(h * k)) };
}
function raddrizza(rgba, w, h, Q, W, H) {
  var o = new Uint8ClampedArray(W * H * 4), hh = omografia(Q, W, H), x, y, c; if (!hh) return null;
  for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
    var z = hh[6] * (x + 0.5) + hh[7] * (y + 0.5) + 1, sx = (hh[0] * (x + 0.5) + hh[1] * (y + 0.5) + hh[2]) / z - 0.5, sy = (hh[3] * (x + 0.5) + hh[4] * (y + 0.5) + hh[5]) / z - 0.5;
    var x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0, X0 = Math.max(0, Math.min(w - 1, x0)), X1 = Math.max(0, Math.min(w - 1, x0 + 1)), Y0 = Math.max(0, Math.min(h - 1, y0)), Y1 = Math.max(0, Math.min(h - 1, y0 + 1));
    var a = (Y0 * w + X0) * 4, b = (Y0 * w + X1) * 4, cc = (Y1 * w + X0) * 4, d = (Y1 * w + X1) * 4, oi = (y * W + x) * 4;
    for (c = 0; c < 3; c++) o[oi + c] = (rgba[a + c] * (1 - fx) + rgba[b + c] * fx) * (1 - fy) + (rgba[cc + c] * (1 - fx) + rgba[d + c] * fx) * fy;
    o[oi + 3] = 255;
  }
  return o;
}
/* «Migliora»: divide ogni colore per lo sfondo sfocato (via ombre e grigio), poi stira il contrasto; i colori restano */
function migliora(rgba, w, h) {
  var g = grigio(rgba, w, h), W = w + 1, S = new Uint32Array(W * (h + 1)), x, y, rs, r = Math.max(8, Math.round(Math.max(w, h) / 20)), o = new Uint8ClampedArray(rgba.length), hist = new Uint32Array(256);
  for (y = 0; y < h; y++) { rs = 0; for (x = 0; x < w; x++) { rs += g[y * w + x]; S[(y + 1) * W + x + 1] = S[y * W + x + 1] + rs; } }
  for (y = 0; y < h; y++) { var y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
    for (x = 0; x < w; x++) { var x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1), bg = (S[y1 * W + x1] - S[y0 * W + x1] - S[y1 * W + x0] + S[y0 * W + x0]) / ((x1 - x0) * (y1 - y0)), f = 240 / Math.max(50, bg), i = (y * w + x) * 4;
      o[i] = rgba[i] * f; o[i + 1] = rgba[i + 1] * f; o[i + 2] = rgba[i + 2] * f; o[i + 3] = 255; hist[(o[i] * 0.3 + o[i + 1] * 0.59 + o[i + 2] * 0.11) | 0]++; } }
  var tot = w * h, acc = 0, lo = 0; while (lo < 200 && acc + hist[lo] < tot * 0.005) { acc += hist[lo]; lo++; }
  var k = 255 / Math.max(1, 245 - lo), i2; for (i2 = 0; i2 < o.length; i2 += 4) { o[i2] = (o[i2] - lo) * k; o[i2 + 1] = (o[i2 + 1] - lo) * k; o[i2 + 2] = (o[i2 + 2] - lo) * k; }
  return o;
}

/* Qualità della foto (prima di fidarsi): nitidezza (varianza del laplaciano), luce, riflessi, documento troppo piccolo o tagliato.
   Dà un punteggio 0–100 e i problemi in parole semplici; non scarta nulla da solo. */
function qualita(g, w, h, ang) {
  var R = riduci(g, w, h, 900), W = R.w, H = R.h, a = R.g, x, y, i, n = 0, s = 0, s2 = 0, somma = 0, bruciati = 0, P = [];
  for (y = 1; y < H - 1; y++) for (x = 1; x < W - 1; x++) { i = y * W + x; var L = 4 * a[i] - a[i - 1] - a[i + 1] - a[i - W] - a[i + W]; s += L; s2 += L * L; n++; }
  for (i = 0; i < a.length; i++) { somma += a[i]; if (a[i] >= 250) bruciati++; }
  var nit = s2 / n - (s / n) * (s / n), luce = somma / a.length, rifl = bruciati / a.length, voto = 100;
  if (nit < 25) { voto -= 45; P.push("la foto è sfocata: rifalla tenendo fermo il telefono"); } else if (nit < 60) { voto -= 20; P.push("la foto è un po' sfocata"); }
  if (luce < 60) { voto -= 30; P.push("c'è poca luce"); } else if (luce > 235) { voto -= 15; P.push("la foto è troppo chiara"); }
  if (rifl > 0.06) { voto -= 25; P.push("ci sono riflessi forti: inclina un po' il documento o spegni il flash"); }
  if (!ang) { voto -= 15; P.push("non vedo bene i bordi del documento: se serve, sistemali tu"); }
  else {
    if (ang.area < 0.2) { voto -= 15; P.push("il documento è piccolo nella foto: avvicinati"); }
    var bordo = ang.punti.filter(function (p) { return p[0] <= 2 || p[1] <= 2 || p[0] >= w - 3 || p[1] >= h - 3; }).length;
    if (bordo >= 2) { voto -= 10; P.push("il documento tocca il bordo della foto: forse è tagliato"); }
  }
  return { voto: Math.max(0, voto), nitidezza: Math.round(nit), luce: Math.round(luce), riflessi: Math.round(rifl * 1000) / 10, problemi: P };
}

root.SCAN = { qualita: qualita, documenti: documenti, grigio: grigio, ritaglio: ritaglio, inclinazione: inclinazione, normalizza: normalizza, angoli: angoli, omografia: omografia, misure: misure, raddrizza: raddrizza, migliora: migliora };
if (typeof module !== "undefined" && module.exports) module.exports = root.SCAN;
})(typeof window !== "undefined" ? window : globalThis);
