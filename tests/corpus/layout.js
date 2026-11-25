// Banco di prova per l'inglese e la posizione dei dati: 6 impaginazioni × OCR pulito/sporco. Dati inventati.
// node tests/corpus/layout.js [--sporco] [--errori]
globalThis.MRZ = require("../../admin/alloggiati/mrz.js");
const INC = require("../../admin/alloggiati/incolla.js");
let seed = 20261126; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296, pick = (a) => a[Math.floor(rnd() * a.length)];
const COGN = ["Kovalčik", "O'Connor", "Müller", "Nowak", "Silva Santos", "Johansson", "Dubois", "Ivanova", "Papadopoulos", "Smith", "Garcia Lopez", "Horváth", "Novák", "Andersen", "Çelik", "Popescu", "Van Der Berg", "Tanaka", "Haddad", "Lindqvist"];
const NOMI = ["Peter", "Aoife", "Jürgen", "Katarzyna", "Maria José", "Erik", "Camille", "Olga", "Nikos", "John", "Ana", "László", "Jana", "Mads", "Emre", "Andrei", "Pieter", "Yuki", "Omar", "Sofia"];
const PAESI = [["SVK", "Slovak"], ["IRL", "Irish"], ["DEU", "German"], ["POL", "Polish"], ["PRT", "Portuguese"], ["SWE", "Swedish"], ["FRA", "French"], ["BGR", "Bulgarian"], ["GRC", "Greek"], ["GBR", "British"], ["ESP", "Spanish"], ["HUN", "Hungarian"], ["CZE", "Czech"], ["DNK", "Danish"], ["TUR", "Turkish"], ["ROU", "Romanian"], ["NLD", "Dutch"], ["JPN", "Japanese"], ["USA", "American"]];
const CITTA = ["Bratislava", "Dublin", "Hamburg", "Krakow", "Lisbon", "Stockholm", "Lyon", "Sofia", "Athens", "London", "Madrid", "Budapest", "Prague", "Aarhus", "Ankara", "Cluj", "Utrecht", "Osaka", "Boston"];
const MESI = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const p2 = (n) => String(n).padStart(2, "0");
const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
function persona() {
  const g = 1 + Math.floor(rnd() * 28), m = 1 + Math.floor(rnd() * 12), a = 1945 + Math.floor(rnd() * 60), pa = pick(PAESI);
  const num = pick(["", "A", "AB", "MG", "P"]) + String(Math.floor(rnd() * 9e7 + 1e6)).slice(0, 6 + Math.floor(rnd() * 3));
  return { cognome: pick(COGN), nome: pick(NOMI), g, m, a, sesso: pick(["M", "F"]), iso: pa[0], naz: pa[1], luogo: pick(CITTA), num };
}
const dataFmt = (p, k) => [p2(p.g) + "." + p2(p.m) + "." + p.a, p2(p.g) + "/" + p2(p.m) + "/" + p.a, p2(p.g) + " " + MESI[p.m - 1] + " " + p.a, p2(p.g) + " " + MESI[p.m - 1] + "/" + MESI[p.m - 1] + " " + String(p.a).slice(2), p.a + "-" + p2(p.m) + "-" + p2(p.g)][k % 5];
const ETI = { cognome: ["Surname", "Last name", "Family name", "Surname / Nom"], nome: ["Given names", "Given name(s)", "First name", "Forenames"], nascita: ["Date of birth", "Birth date", "Date of birth / Date de naissance", "DOB"], sesso: ["Sex", "Gender", "Sex / Sexe"], citt: ["Nationality", "Citizenship", "Nationality / Nationalité"], luogo: ["Place of birth", "Birthplace"], numero: ["Document No", "Passport No", "Document number", "ID No", "Card No"] };
const IGN = [["Date of issue", "01.02.2019"], ["Date of expiry", "01.02.2029"], ["Authority", "MINISTRY OF INTERIOR"]];
function rovina(t, forte) { // errori tipici dell'OCR: lettere cambiate nelle etichette, righe spazzatura, maiuscole
  return t.split("\n").map((r) => {
    if (!forte) return r;
    if (/^[A-Za-z' \/().]+$/.test(r) && /(surname|name|date|birth|sex|nation|place|number|document|passport|citizen)/i.test(r) && rnd() < 0.5) { const i = Math.floor(rnd() * r.length); r = r.slice(0, i) + pick(["a", "e", "o", "i", "c"]) + r.slice(i + 1); }
    return rnd() < 0.1 ? r + "\n" + pick(["•CZ•", "-ARI", "REENREPUENN", "wwln ano oe ge ls", "(0000 217874059"]) : r;
  }).join("\n");
}
function genera(sporco) {
  const out = [];
  for (let i = 0; i < 360; i++) {
    const p = persona(), L = i % 6, e = (k) => pick(ETI[k]), d = dataFmt(p, i), tit = pick(["PASSPORT", "IDENTITY CARD", "REPUBLIC OF " + p.naz.toUpperCase(), "NATIONAL ID CARD"]);
    const sx = p.sesso, cognomeT = i % 2 ? p.cognome.toUpperCase() : p.cognome, nomeT = i % 2 ? p.nome.toUpperCase() : p.nome;
    const campi = [["cognome", cognomeT], ["nome", nomeT], ["nascita", d], ["sesso", sx], ["citt", i % 3 ? p.iso : p.naz], ["luogo", p.luogo], ["numero", p.num]];
    const etiche = campi.map(([k]) => e(k)); let t;
    if (L === 0) t = tit + "\n" + campi.map(([k, v], j) => etiche[j] + ": " + v).join("\n"); // etichetta: valore
    else if (L === 1) t = tit + "\n" + campi.map(([k, v], j) => etiche[j] + "\n" + v).join("\n"); // etichetta sopra, valore sotto
    else if (L === 2) t = tit + "\n" + campi.map(([k, v], j) => v + "\n" + etiche[j]).join("\n"); // valore sopra, etichetta sotto
    else if (L === 3) t = tit + "\n" + etiche.join("\n") + "\n" + campi.map(([, v]) => v).join("\n"); // tutte le etichette, poi tutti i valori
    else if (L === 4) t = tit + "\n" + etiche[0] + " " + etiche[1] + "\n" + cognomeT + " " + nomeT + "\n" + etiche.slice(2).map((x, j) => x + "\n" + campi[j + 2][1]).join("\n"); // due etichette su una riga, due valori sulla successiva
    else t = tit + "\n" + etiche[0] + " / Nom\n" + cognomeT + "\n" + etiche[1] + "\n" + nomeT + "\n" + etiche.slice(2).map((x, j) => x + " " + campi[j + 2][1]).join("\n"); // misto
    t += "\n" + IGN.map(([k, v]) => k + "\n" + v).join("\n");
    out.push({ i, layout: L, testo: rovina(t, sporco), atteso: { cognome: norm(p.cognome), nome: norm(p.nome), data_nascita: p2(p.g) + "/" + p2(p.m) + "/" + p.a, sesso: p.sesso, numero_documento: p.num, citt: p.iso } });
  }
  return out;
}
if (require.main === module) {
  const sporco = process.argv.includes("--sporco"), C = genera(sporco), mostra = process.argv.includes("--errori");
  const campi = ["cognome", "nome", "data_nascita", "sesso", "numero_documento"], tot = {}, perL = {}; let ok = 0, n = 0, perf = 0;
  C.forEach((c) => {
    const P = INC.leggi(c.testo, { largo: sporco }).persone, p = P[0] || {}; let tutto = true;
    campi.forEach((k) => { const g = (p[k] || "") === c.atteso[k]; tot[k] = tot[k] || [0, 0]; tot[k][1]++; if (g) tot[k][0]++; else { tutto = false; if (mostra && n++ < 40) console.log("  #" + c.i + " [L" + c.layout + "] " + k + ": atteso «" + c.atteso[k] + "» letto «" + (p[k] || "") + "»"); } perL[c.layout] = perL[c.layout] || [0, 0]; perL[c.layout][1]++; if (g) perL[c.layout][0]++; });
    if (tutto) perf++;
  });
  console.log("Impaginazioni inglesi" + (sporco ? " (OCR sporco, lettura larga)" : "") + ": " + C.length + " documenti");
  campi.forEach((k) => console.log("  " + k.padEnd(18) + (100 * tot[k][0] / tot[k][1]).toFixed(1) + "%"));
  Object.keys(perL).forEach((l) => console.log("  impaginazione " + l + ": " + (100 * perL[l][0] / perL[l][1]).toFixed(1) + "%"));
  console.log("Documenti perfetti: " + (100 * perf / C.length).toFixed(1) + "% (" + perf + "/" + C.length + ")");
}
module.exports = { genera };
