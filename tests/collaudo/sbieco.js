// Prova degli angoli trovati da SCAN.angoli sulle foto sintetiche di genera_sbieco.py (dati inventati).
require("../../admin/alloggiati/scanner.js"); const fs = require("fs"), path = require("path");
const cart = process.argv[2] || "/tmp/sbieco", V = JSON.parse(fs.readFileSync(path.join(cart, "angoli.json"), "utf8")), v = process.argv.includes("-v");
let ok = 0, n = 0, errs = [];
for (const k of Object.keys(V)) {
  if (V[k].docs) { // foto con più documenti: quanti ne trova, e con che precisione
    const { w, h, docs } = V[k], rgba = new Uint8Array(fs.readFileSync(path.join(cart, k + ".rgba"))), t0 = Date.now(), D = SCAN.documenti(SCAN.grigio(rgba, w, h), w, h, rgba), diag = Math.hypot(w, h); n++;
    const errs2 = docs.map((Q) => Math.min(...D.map((d) => Math.max(...Q.map((a, i) => Math.hypot(a[0] - d.punti[i][0], a[1] - d.punti[i][1]))) / diag), 1));
    const giusto = D.length === docs.length && errs2.every((e) => e < 0.02); if (giusto) ok++; errs.push(Math.max(...errs2));
    if (v || !giusto) console.log(k, V[k].disposizione.padEnd(7), V[k].fondo.padEnd(7), "trovati " + D.length + "/" + docs.length, "errori " + errs2.map((e) => (e * 100).toFixed(1) + "%").join(" "), (Date.now() - t0) + "ms");
    continue;
  }
  const { w, h, angoli } = V[k], rgba = new Uint8Array(fs.readFileSync(path.join(cart, k + ".rgba"))), g = SCAN.grigio(rgba, w, h), t0 = Date.now(), r = SCAN.angoli(g, w, h, rgba); n++;
  const diag = Math.hypot(w, h), e = r ? Math.max(...angoli.map((a, i) => Math.hypot(a[0] - r.punti[i][0], a[1] - r.punti[i][1]))) / diag : 1;
  if (e < 0.02) ok++; errs.push(e);
  if (v || e >= 0.02) console.log(k, V[k].fondo.padEnd(7), r ? "errore " + (e * 100).toFixed(1) + "% sic " + r.sicurezza : "NON TROVATO", (Date.now() - t0) + "ms");
}
console.log((V[Object.keys(V)[0]].docs ? "Foto con più documenti divise giuste" : "Angoli giusti") + " (errore < 2% della diagonale): " + ok + "/" + n);
