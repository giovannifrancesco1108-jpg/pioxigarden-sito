/* Punteggio del collaudo foto: confronta le persone lette dalla pagina con i valori veri (veri.json delle foto sintetiche).
   Uso: node tests/collaudo/voto.js risultati.json /cartella/veri.json [riprova] [-v] */
"use strict";
const fs = require("fs");
const R = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), V = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
const quale = process.argv.includes("riprova") ? "riprova" : "primo", dettagli = process.argv.includes("-v");
const N = (s) => String(s || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Z0-9]/g, "");
const PAESI = { ITA: ["ITA", "ITALIA"], GBR: ["GBR", "REGNOUNITO", "BRITISHCITIZEN"] };
const NOMI = ["cognome", "nome", "sesso", "data", "luogo", "citt", "numero", "rilascio"];
let giusti = 0, tot = 0, perCampo = {}, sec = 0, n = 0;
for (const k of Object.keys(R)) {
  const v = R[k], vero = V[v.file]; if (!vero) continue; n++;
  let P = quale === "riprova" ? (v.riprova && v.riprova.R) || [] : v.primo.P || [];
  (v.primo.MRZ || []).forEach((r) => P.push({ cognome: r.cognome, nome: r.nome, sesso: r.sesso, data_nascita: r.nascita, numero_documento: r.numero, cittadinanza: r.nazionalita }));
  let migliore = null;
  P.forEach((p) => {
    const luogo = [p.comune_nascita, p.luogo_nascita, p.stato_nascita].map(N), ril = [p.rilascio_comune, p.rilascio_stato].map(N);
    const o = [N(p.cognome) === N(vero[0]), N(p.nome) === N(vero[1]), vero[2] == null ? null : p.sesso === vero[2], p.data_nascita === vero[3], luogo.includes(N(vero[4])),
      vero[5] == null ? null : (PAESI[vero[5]] || [vero[5]]).includes(N(p.cittadinanza)), N(p.numero_documento) === N(vero[6]), vero[7] == null ? null : (PAESI[vero[7]] || [N(vero[7])]).some((x) => ril.includes(x))];
    const s = o.filter((x) => x === true).length; if (!migliore || s > migliore.s) migliore = { s, o };
  });
  const o = migliore ? migliore.o : vero.map((x) => (x == null ? null : false));
  o.forEach((x, i) => { if (x === null) return; perCampo[NOMI[i]] = perCampo[NOMI[i]] || [0, 0]; perCampo[NOMI[i]][1]++; tot++; if (x) { giusti++; perCampo[NOMI[i]][0]++; } });
  sec += quale === "riprova" ? v.sec2 || 0 : v.sec1 || 0;
  if (dettagli) console.log(v.file.padEnd(18), o.map((x) => (x === null ? "·" : x ? "✓" : "✗")).join(""));
}
console.log("Collaudo foto (" + quale + "): " + n + " foto · campi giusti " + giusti + "/" + tot + " (" + Math.round(100 * giusti / tot) + "%) · secondi medi per foto " + (sec / n).toFixed(0));
console.log("  " + NOMI.filter((c) => perCampo[c]).map((c) => c + " " + Math.round(100 * perCampo[c][0] / perCampo[c][1]) + "%").join(" · "));
