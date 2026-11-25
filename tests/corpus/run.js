/* Esegue il lettore del testo sul banco di prova e stampa la percentuale di campi giusti.
   Uso: node tests/corpus/run.js [--duro] [--errori] [--tipo=passaporto-mrz] [--min=95]
   Esce con codice 1 se la percentuale totale è sotto --min (di default 0: serve solo come misura). */
globalThis.MRZ = require("../../admin/alloggiati/mrz.js");
const INC = require("../../admin/alloggiati/incolla.js");
const { genera } = require("./genera.js");
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith("--" + k + "=")); return a ? a.split("=")[1] : d; };
const mostra = process.argv.includes("--errori"), solo = arg("tipo", ""), min = +arg("min", 0);
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const compatta = (s) => norm(s).replace(/ /g, "");
const naz = (iso, got) => !!got && (got === iso || norm(got) === norm(MRZ.PAESI[iso]) || (iso === "ITA" && /^ITALIAN/.test(norm(got))));
const CAMPI = {
  cognome: (a, g) => compatta(g.cognome) === compatta(a.cognome),
  nome: (a, g) => compatta(g.nome) === compatta(a.nome),
  sesso: (a, g) => g.sesso === a.sesso,
  data_nascita: (a, g) => g.data_nascita === a.data_nascita,
  numero_documento: (a, g) => compatta(g.numero_documento) === compatta(a.numero_documento),
  tipo_documento: (a, g) => g.tipo_documento === a.tipo_documento,
  cittadinanza: (a, g) => naz(a.cittadinanza, g.cittadinanza),
  comune_nascita: (a, g) => !a.comune_nascita || compatta(g.comune_nascita) === compatta(a.comune_nascita),
  provincia_nascita: (a, g) => !a.provincia_nascita || (g.provincia_nascita || "").toUpperCase() === a.provincia_nascita,
};
const tot = {}, perTipo = {}; let paste = 0, pasteOk = 0, persone = 0, personeOk = 0, docs = 0, docsOk = 0; const errori = [];
const duro = process.argv.includes("--duro");
if (duro) console.log("MODALITÀ DURA: errori di lettura, righe di disturbo, documenti attaccati senza riga vuota");
for (const c of genera({ duro })) {
  if (solo && !c.attese.some((x) => x.kind === solo)) continue;
  paste++;
  const out = INC.leggi(c.testo).persone, usate = new Set(); let tuttoOk = out.length === c.attese.length;
  if (out.length === c.attese.length) pasteOk++; else errori.push("incolla " + c.n + ": attese " + c.attese.length + " persone, lette " + out.length);
  for (const e of c.attese) {
    docs++;
    let j = out.findIndex((g, i) => !usate.has(i) && compatta(g.numero_documento) === compatta(e.att.numero_documento));
    if (j < 0) j = out.findIndex((g, i) => !usate.has(i) && compatta(g.cognome) === compatta(e.att.cognome));
    const g = j >= 0 ? (usate.add(j), out[j]) : {};
    let docOk = j >= 0;
    for (const k of Object.keys(CAMPI)) {
      if (e.att[k] === undefined) continue;
      const ok = CAMPI[k](e.att, g), t = (tot[k] = tot[k] || { ok: 0, n: 0 }), pt = (perTipo[e.kind] = perTipo[e.kind] || { ok: 0, n: 0 });
      if (k === "comune_nascita" && !e.att.comune_nascita) continue; if (k === "provincia_nascita" && !e.att.provincia_nascita) continue;
      t.n++; pt.n++; if (ok) { t.ok++; pt.ok++; } else { docOk = false; errori.push("incolla " + c.n + " [" + e.kind + " #" + e.id + "] " + k + ": atteso «" + e.att[k] + "», letto «" + (g[k] || "") + "»"); }
    }
    if (docOk) docsOk++;
  }
}
const pc = (o) => (o.n ? (100 * o.ok / o.n).toFixed(1) : "—") + "% (" + o.ok + "/" + o.n + ")";
console.log("\nPer campo:"); Object.keys(tot).forEach((k) => console.log("  " + k.padEnd(18) + pc(tot[k])));
console.log("\nPer tipo di documento:"); Object.keys(perTipo).sort().forEach((k) => console.log("  " + k.padEnd(24) + pc(perTipo[k])));
const tutti = Object.values(tot).reduce((s, x) => ({ ok: s.ok + x.ok, n: s.n + x.n }), { ok: 0, n: 0 });
console.log("\nIncolla con il numero giusto di persone: " + pc({ ok: pasteOk, n: paste }));
console.log("Documenti letti PERFETTAMENTE (tutti i campi): " + pc({ ok: docsOk, n: docs }));
console.log("Campi giusti in totale: " + pc(tutti));
if (mostra) { console.log("\nErrori (" + errori.length + "):"); errori.slice(0, 80).forEach((e) => console.log("  " + e)); }
if (100 * tutti.ok / tutti.n < min) { console.log("\nSotto la soglia di " + min + "%"); process.exit(1); }
