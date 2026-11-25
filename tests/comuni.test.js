/* Prove della ricerca di comuni e stati (funzione «trova» della pagina) con nomi sporcati da OCR e copia-incolla.
   La funzione si prende direttamente da admin/alloggiati/index.html, così si prova il codice vero.
   I codici delle tabelle qui sono inventati; i nomi dei comuni sono quelli pubblici. */
"use strict";
const fs = require("fs"), assert = require("assert"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "../admin/alloggiati/index.html"), "utf8");
const pezzo = (da, a) => { const i = html.indexOf(da), j = html.indexOf(a, i); if (i < 0 || j < 0) throw new Error("non trovo " + da); return html.slice(i, j); };
const codice = pezzo("function norm(s)", "\n") + "\n" + pezzo("var SIN=", "\n") + "\n" + pezzo("function compatto(s)", "function cerca(L,q)");
const { norm, trova } = new Function(codice + "\nreturn {norm:norm,trova:trova};")();

const COMUNI = "ROMA RM|GENZANO DI ROMA RM|CASTEL GANDOLFO RM|ALBANO LAZIALE RM|CIAMPINO RM|MARINO RM|FRASCATI RM|VELLETRI RM|ARICCIA RM|NETTUNO RM|ANZIO RM|MONTEROTONDO RM|SUBIACO RM|" +
  "POTENZA PZ|TITO PZ|LAURIA PZ|MARSICOVETERE PZ|MELFI PZ|SASSARI SS|FOGGIA FG|SAN GIOVANNI ROTONDO FG|SAN SEVERO FG|LUCERA FG|PAVULLO NEL FRIGNANO MO|MODENA MO|SIENA SI|SORA FR|" +
  "CASSINO FR|TERRACINA LT|FONDI LT|FORMIA LT|LATINA LT|GAETA LT|CATANIA CT|ACIREALE CT|TRECASTAGNI CT|GENOVA GE|MILANO MI|NAPOLI NA|TORINO TO|THIENE VI|FERRARA FE|CASTEL FOCOGNANO AR|" +
  "REGGIO NELL'EMILIA RE|REGGIO DI CALABRIA RC|SANT'AGATA DE' GOTI BN|SANT'ANGELO DEI LOMBARDI AV|L'AQUILA AQ|CASTELNOVO NE' MONTI RE|SAN TEODORO SS|SAN TEODORO ME|CALLIANO TN|CALLIANO AT|" +
  "SAN GIORGIO A CREMANO NA|MONTE SAN GIOVANNI CAMPANO FR|SANTA MARIA CAPUA VETERE CE|AGOSTA RM|ROCCA DI PAPA RM|GROTTAFERRATA RM|LANUVIO RM|NEMI RM|PALESTRINA RM|TIVOLI RM|GUIDONIA MONTECELIO RM";
const STATI = "ITALIA|REGNO UNITO|IRLANDA|FRANCIA|SPAGNA|GERMANIA|BELGIO|RUSSIA|SVIZZERA|STATI UNITI D'AMERICA|GRECIA|ROMANIA|POLONIA|CINA|IRAN";
let n = 0; const comuni = COMUNI.split("|").map((x) => { const m = /^(.*) ([A-Z]{2})$/.exec(x); return { c: "4" + String(10000000 + n++).slice(1), n: m[1], k: norm(m[1]), p: m[2], x: false }; });
const stati = STATI.split("|").map((x) => ({ c: "100000" + String(100 + n++), n: x, k: norm(x), p: "EE", x: false }));

const casi = [ // [letto, provincia letta, comune atteso, deve essere «da controllare»]
  ["GENZANO DI ROMA", "RM", "GENZANO DI ROMA", false],
  ["GENZANO Dl ROMA", "RM", "GENZANO DI ROMA", true], // l minuscola al posto di I
  ["GENZAN0 DI ROMA", "RM", "GENZANO DI ROMA", false], // zero al posto di O: confusione certa dell'OCR
  ["GENZANO DI ROMA (RM) 11.08.2003", "", "GENZANO DI ROMA", true], // copia-incolla con la data attaccata
  ["GENZANO DI ROMA RM 11 08 2003 SESSO", "", "GENZANO DI ROMA", true],
  ["SANT AGATA DE GOTI", "BN", "SANT'AGATA DE' GOTI", false], // apostrofi persi
  ["SANTAGATA DE GOTI", "", "SANT'AGATA DE' GOTI", false],
  ["REGGIO EMILIA", "RE", "REGGIO NELL'EMILIA", false], // nome comune → nome ufficiale
  ["S. GIOVANNI ROTONDO", "FG", "SAN GIOVANNI ROTONDO", false],
  ["SAN GIOVANNl ROTONDO", "FG", "SAN GIOVANNI ROTONDO", true],
  ["PAVULLO NEL FRIGNANO", "M0", "PAVULLO NEL FRIGNANO", false],
  ["PAVULLO NEL FRIGNAN", "MO", "PAVULLO NEL FRIGNANO", true], // troncato
  ["MARSICOVETERF", "PZ", "MARSICOVETERE", true],
  ["SAN TEODORO", "ME", "SAN TEODORO", false],
  ["CALLIANO", "AT", "CALLIANO", false],
  ["CASTEL GANDOLF0", "", "CASTEL GANDOLFO", false],
  ["L AQUILA", "AQ", "L'AQUILA", false],
  ["CASTELNOVO NE MONTI", "RE", "CASTELNOVO NE' MONTI", false],
  ["CIAMPlNO", "RM", "CIAMPINO", true],
  ["ROCCA Dl PAPA", "", "ROCCA DI PAPA", true],
];
let ok = 0;
casi.forEach(([letto, prov, atteso, dubbio]) => {
  const r = trova(comuni, letto, prov);
  assert.ok(r, "non trovato: " + letto);
  assert.equal(r.n, atteso, letto + " → " + r.n);
  if (letto === "SAN TEODORO" || letto === "CALLIANO") assert.equal(r.p, prov, "comune omonimo: vince la provincia letta");
  assert.equal(!!r.vicino, dubbio, letto + ": «da controllare» atteso " + dubbio);
  ok++;
});
// non deve inventare: città estere e parole a caso non diventano comuni
["LONDON", "ATHENS", "EPPING", "PARIS", "SESSO", "NATIONALITY", "HMPO"].forEach((x) => assert.equal(trova(comuni, x, ""), null, x + " non è un comune"));
// stati
assert.equal(trova(stati, "REGNO UNIT0").n, "REGNO UNITO");
assert.equal(trova(stati, "FRANClA").n, "FRANCIA");
assert.equal(trova(stati, "ITALIANA").n, "ITALIA");
console.log("prove comuni superate: " + ok + " nomi sporchi trovati, nessun comune inventato");
// lo script della pagina deve essere JavaScript valido (un errore di sintassi blocca tutto il pannello sul telefono)
const script = html.match(/<script>([\s\S]*?)<\/script>/g).pop().replace(/^<script>|<\/script>$/g, "");
new Function(script); console.log("script della pagina: sintassi valida");
