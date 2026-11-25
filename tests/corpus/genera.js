/* Banco di prova: 185 documenti SINTETICI (nomi e numeri inventati, nessuna persona reale), in molte nazionalità e layout.
   Non sono foto: sono i testi che il telefono ricava da una foto o da un copia-incolla, con errori di lettura simulati.
   Le righe MRZ hanno cifre di controllo valide (ICAO 9303). Risultato sempre uguale (seme fisso). */
const MRZ = require("../../admin/alloggiati/mrz.js");
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(20261125);
const pick = (a) => a[Math.floor(R() * a.length)];
const int = (a, b) => a + Math.floor(R() * (b - a + 1));
const p2 = (n) => String(n).padStart(2, "0");

const PAESI = "ITA FRA DEU ESP GBR USA CAN AUS NLD BEL CHE AUT POL ROU PRT GRC SWE NOR DNK FIN IRL CZE SVK HUN BGR HRV SVN LTU LVA EST RUS UKR TUR JPN CHN KOR IND BRA ARG MEX CHL EGY MAR ISR ALB SRB".split(" ").filter((c) => MRZ.PAESI[c]);
const COGNOMI = ["ROSSI", "BIANCHI", "SMITH", "MARTIN", "GARCIA", "MUELLER", "NOVAK", "KOWALSKI", "IVANOV", "POPESCU", "SILVA", "DUPONT", "JANSSEN", "NIELSEN", "ANDERSSON", "DE LUCA", "VAN DER BERG", "LOPEZ FERNANDEZ", "DELLA VALLE", "KIM", "TANAKA", "SANTOS", "HADDAD", "COHEN", "PETROVIC", "HORVATH", "BROWN", "WILSON", "SCHMIDT", "LEFEVRE", "MORENO", "GRECO", "ESPOSITO", "RICCI", "CONTI"];
const NOMI_M = ["MARIO", "JOHN", "HANS PETER", "CARLOS", "PIOTR", "JEAN PIERRE", "LUCA", "AHMED", "DAVID", "MICHAEL", "ANDREA", "PAWEL", "NIKOLAI", "YUKI", "MATTEO", "JOSE LUIS", "THOMAS", "ERIK"];
const NOMI_F = ["ANNA", "MARIE", "KATARINA", "ELENA", "MARIA JOSE", "SOFIA", "EMMA", "ANNA MARIA", "LAURA", "OLGA", "CHIARA", "ISABELLE", "JULIA", "LI NA", "FATIMA", "GIULIA"];
const COMUNI = [["ROMA", "RM"], ["MILANO", "MI"], ["NAPOLI", "NA"], ["TORINO", "TO"], ["BRESCIA", "BS"], ["PALERMO", "PA"], ["BOLOGNA", "BO"], ["GENZANO DI ROMA", "RM"], ["CASTEL GANDOLFO", "RM"], ["FIRENZE", "FI"]];
const CITTA = ["BERLIN", "PARIS", "LONDON", "MADRID", "WARSAW", "NEW YORK", "SYDNEY", "TOKYO", "LISBON", "PRAHA", "VIENNA", "AMSTERDAM"];
const MESI_EN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const LETT = "ABCDEFGHJKLMNPRSTUVWXYZ";
const rl = (n) => Array.from({ length: n }, () => LETT[int(0, LETT.length - 1)]).join("");
const rd = (n) => Array.from({ length: n }, () => int(0, 9)).join("");
const cdc = (s) => String(MRZ.cd(s));
const pad = (s, n) => (s + "<".repeat(n)).slice(0, n);
const mrzNome = (c, n) => c.replace(/ /g, "<") + "<<" + n.replace(/ /g, "<");

function persona() {
  const f = R() < 0.5, nazione = R() < 0.3 ? "ITA" : pick(PAESI), anno = int(1950, 2012);
  const nasc = { g: int(1, 28), m: int(1, 12), a: anno };
  return { cognome: pick(COGNOMI), nome: pick(f ? NOMI_F : NOMI_M), sesso: f ? "F" : "M", nasc, nazione };
}
const dIT = (n, sep) => p2(n.g) + (sep || "/") + p2(n.m) + (sep || "/") + n.a;
const dMRZ = (n) => String(n.a).slice(2) + p2(n.m) + p2(n.g);
const scad = () => ({ g: int(1, 28), m: int(1, 12), a: int(2027, 2035) });

function mrzTD3(p, num, emi) {
  const l1 = ("P<" + emi + mrzNome(p.cognome, p.nome)).slice(0, 44).padEnd(44, "<");
  const e = scad(), body = num.padEnd(9, "<") + cdc(num.padEnd(9, "<")) + p.nazione + dMRZ(p.nasc) + cdc(dMRZ(p.nasc)) + p.sesso + dMRZ(e) + cdc(dMRZ(e)) + "<".repeat(14) + "0";
  const fin = cdc(body.slice(0, 10) + body.slice(13, 20) + body.slice(21, 43));
  return [l1, body + fin];
}
function mrzTD1(p, num, emi) {
  const n9 = num.padEnd(9, "<"), l1 = "I<" + emi + n9 + cdc(n9) + "<".repeat(15), e = scad();
  const l2a = dMRZ(p.nasc) + cdc(dMRZ(p.nasc)) + p.sesso + dMRZ(e) + cdc(dMRZ(e)) + p.nazione + "<".repeat(11);
  const fin = cdc(l1.slice(5, 30) + l2a.slice(0, 7) + l2a.slice(8, 15) + l2a.slice(18, 29));
  return [l1, l2a + fin, pad(mrzNome(p.cognome, p.nome), 30)];
}
// CF di fantasia ma formalmente valido
function cfDi(p, com) {
  const l = (s, nome) => { const x = s.replace(/[^A-Z]/g, ""), c = x.replace(/[AEIOU]/g, ""), v = x.replace(/[^AEIOU]/g, ""); let k = c; if (nome && c.length >= 4) k = c[0] + c[2] + c[3]; return (k + v + "XXX").slice(0, 3); };
  const base = l(p.cognome, false) + l(p.nome, true) + String(p.nasc.a).slice(2) + "ABCDEHLMPRST"[p.nasc.m - 1] + p2(p.nasc.g + (p.sesso === "F" ? 40 : 0)) + "H" + rd(3);
  const D = { 0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21, A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23 };
  let s = 0; for (let i = 0; i < 15; i++) { const c = base[i]; s += i % 2 === 0 ? D[c] : /\d/.test(c) ? +c : c.charCodeAt(0) - 65; }
  return base + String.fromCharCode(65 + s % 26);
}

const docs = [];
function nuovo(kind, p, extra) { docs.push(Object.assign({ kind, p }, extra)); }
const pesi = [["passaporto-mrz", 55], ["carta-td1", 35], ["cie-etichette-cf-mrz", 20], ["cie-riga-unica", 15], ["cartacea", 10], ["passaporto-it", 10], ["patente", 10], ["fr-de-es", 20], ["solo-mrz", 10]];
for (const [k, n] of pesi) for (let i = 0; i < n; i++) {
  const p = persona();
  if (/^(cie|cartacea|passaporto-it|patente)/.test(k)) { p.nazione = "ITA"; }
  if (k === "fr-de-es") p.nazione = pick(["FRA", "DEU", "ESP", "AUT", "BEL"]);
  if (k === "carta-td1" && p.nazione === "ITA") p.nazione = pick(["FRA", "DEU", "ESP", "NLD", "POL"]);
  const com = pick(COMUNI);
  nuovo(k, p, { com, citta: pick(CITTA) });
}

/* ---- testo per ogni tipo di documento + verità attesa ---- */
function rumore(t, liv) {
  if (liv === 0) return t;
  let o = t;
  if (liv >= 1) o = o.replace(/ {1}/g, (m) => (R() < 0.08 ? "  " : m));
  if (liv >= 2) o = o.split("\n").map((r) => (R() < 0.15 ? r.trim() + " " : r)).join("\n");
  if (liv >= 3) o = o.replace(/\n(?=[A-Za-z]{3,12} )/g, (m) => (R() < 0.4 ? " " : m)); // alcune righe si uniscono
  return o;
}
function costruisci(d, i) {
  const p = d.p, nome = d.p.nome, c = p.cognome, nas = p.nasc, liv = i % 4;
  let testo = "", att = { cognome: c, nome, sesso: p.sesso, data_nascita: dIT(nas), cittadinanza: p.nazione };
  const num = d.kind === "cartacea" ? rl(2) + rd(7) : /^cie/.test(d.kind) ? rl(2) + rd(5) + rl(2) : /^patente/.test(d.kind) ? rl(2) + rd(7) + rl(1) : d.kind === "carta-td1" ? rl(1) + rd(8) : /^passaporto/.test(d.kind) ? (R() < 0.5 ? rl(2) + rd(7) : rl(1) + rd(7) + rl(1)) : rl(2) + rd(6) + rl(1);
  att.numero_documento = num;
  const luogoIT = d.com[0] + " (" + d.com[1] + ")";
  switch (d.kind) {
    case "passaporto-mrz": {
      const [a, b] = mrzTD3(p, num, p.nazione); att.tipo_documento = "PASOR";
      testo = "PASSPORT\nSurname\n" + c + "\nGiven names\n" + nome + "\nNationality\n" + (MRZ.PAESI[p.nazione]) + "\nDate of birth\n" + p2(nas.g) + " " + MESI_EN[nas.m - 1] + " " + nas.a + "\nSex\n" + p.sesso + "\nPlace of birth\n" + d.citta + "\nPassport No\n" + num + "\n" + a + "\n" + b; break; }
    case "solo-mrz": {
      const [a, b] = mrzTD3(p, num, p.nazione); att.tipo_documento = "PASOR"; testo = a + "\n" + b; break; }
    case "carta-td1": {
      const [a, b, c3] = mrzTD1(p, num, p.nazione); att.tipo_documento = "IDENT";
      testo = "IDENTITY CARD / CARTE D'IDENTITE\nSurname / Nom " + c + "\nGiven names / Prenoms " + nome + "\nDate of birth / Date de naissance " + p2(nas.g) + "." + p2(nas.m) + "." + nas.a + "\nSex / Sexe " + p.sesso + "\nNationality " + p.nazione + "\n" + a + "\n" + b + "\n" + c3; break; }
    case "cie-etichette-cf-mrz": {
      const [a, b, c3] = mrzTD1(p, num, "ITA"), cf = cfDi(p, d.com); att.tipo_documento = "IDELE"; att.comune_nascita = d.com[0]; att.provincia_nascita = d.com[1];
      testo = "REPUBBLICA ITALIANA\nCARTA DI IDENTITA' ELETTRONICA\nCognome/Surname\n" + c + "\nNome/Name\n" + nome + "\nLuogo e data di nascita/Place and date of birth\n" + luogoIT + " " + dIT(nas, ".") + "\nSesso/Sex " + p.sesso + "\nStatura/Height " + int(150, 195) + "\nCittadinanza/Nationality ITA\nEmesso da/Issued by COMUNE DI " + d.com[0] + "\n" + num + "\nCodice fiscale " + cf + "\n" + a + "\n" + b + "\n" + c3; break; }
    case "cie-riga-unica": {
      att.tipo_documento = "IDELE"; att.comune_nascita = d.com[0]; att.provincia_nascita = d.com[1];
      testo = "REPUBBLICA ITALIANA MINISTERO DELL'INTERNO CARTA DI IDENTITA' ELETTRONICA Cognome Surname " + c + " Nome Name " + nome + " Luogo e data di nascita Place and date of birth " + luogoIT + " " + dIT(nas, ".") + " Sesso Sex " + p.sesso + " Statura Height " + int(150, 195) + " Cittadinanza Nationality ITA Emissione Issuing 01.01.2021 Scadenza Expiry 01.01.2031 " + num; break; }
    case "cartacea": {
      att.tipo_documento = "IDENT"; att.comune_nascita = d.com[0]; att.provincia_nascita = d.com[1];
      testo = "COMUNE DI " + d.com[0] + "\nCARTA D'IDENTITA' N° " + num.slice(0, 2) + " " + num.slice(2) + "\nCognome " + c + "\nNome " + nome + "\nnato il " + dIT(nas, ".") + "\na " + luogoIT + "\nCittadinanza ITALIANA\nResidenza " + pick(COMUNI)[0] + "\nStato civile CELIBE\nProfessione IMPIEGATO\nStatura 1." + int(55, 95); break; }
    case "passaporto-it": {
      att.tipo_documento = "PASOR"; att.comune_nascita = d.com[0]; att.provincia_nascita = d.com[1];
      testo = "PASSAPORTO / PASSPORT\nCognome / Surname\n" + c + "\nNome / Given names\n" + nome + "\nCittadinanza / Nationality\nITALIANA\nData di nascita / Date of birth\n" + p2(nas.g) + " " + ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"][nas.m - 1] + "/" + MESI_EN[nas.m - 1] + " " + String(nas.a).slice(2) + "\nSesso / Sex\n" + p.sesso + "\nLuogo di nascita / Place of birth\n" + luogoIT + "\nAutorità / Authority\nQUESTURA DI " + d.com[0] + "\nN. passaporto / Passport No\n" + num; break; }
    case "patente": {
      att.tipo_documento = "PATEN"; att.comune_nascita = d.com[0]; att.provincia_nascita = d.com[1];
      testo = "PATENTE DI GUIDA\n1. " + c + "\n2. " + nome + "\n3. " + dIT(nas) + " " + luogoIT + "\n4a. 01/01/2020 4b. 01/01/2030\n4c. MIT-UCO\n5. " + num; break; }
    case "fr-de-es": {
      const n = p.nazione, E = { FRA: ["Nom", "Prénoms", "Date de naissance", "Nationalité", "Lieu de naissance", "Numéro du document", "Sexe"], DEU: ["Nachname", "Vorname", "Geburtsdatum", "Staatsangehörigkeit", "Geburtsort", "Dokumentnummer", "Geschlecht"], ESP: ["Apellidos", "Nombre", "Fecha de nacimiento", "Nacionalidad", "Lugar de nacimiento", "Número de documento", "Sexo"], AUT: ["Familienname", "Vorname", "Geburtsdatum", "Staatsangehörigkeit", "Geburtsort", "Dokumentnummer", "Geschlecht"], BEL: ["Nom", "Prénoms", "Date de naissance", "Nationalité", "Lieu de naissance", "Numéro du document", "Sexe"] }[n];
      att.tipo_documento = "IDENT"; att.cittadinanza = n;
      testo = "IDENTITY CARD\n" + E[0] + "\n" + c + "\n" + E[1] + "\n" + nome + "\n" + E[2] + "\n" + dIT(nas, ".") + "\n" + E[3] + "\n" + n + "\n" + E[4] + "\n" + d.citta + "\n" + E[5] + "\n" + num + "\n" + E[6] + "\n" + p.sesso; break; }
  }
  if (d.kind === "cartacea" || d.kind === "patente") delete att.sesso; // non è stampato sul documento
  if (d.kind === "patente") delete att.cittadinanza;
  return { testo: rumore(testo, liv), att };
}

/* ---- incolla: 120 singoli, 25 coppie, 5 terne (= 185 documenti) ---- */
/* modalità "duro": gli errori tipici di una foto letta male e di un copia-incolla sciatto */
const SCAMBI = { "0": "O", "1": "I", "5": "S", "8": "B" };
function duro(x, d) {
  let t = x.testo, att = x.att;
  // 1) nei numeri italiani (formato noto) qualche cifra diventa lettera simile
  if (/^(cie|cartacea|passaporto-it)/.test(d.kind) && R() < 0.5) {
    const n = att.numero_documento, k = n.split("").map((c) => (SCAMBI[c] && R() < 0.5 ? SCAMBI[c] : c)).join("");
    if (k !== n) t = t.split(n).join(k);
  }
  // 2) etichette in minuscolo o tutto maiuscolo, righe di disturbo
  t = t.split("\n").map((r) => (r.includes("<<") ? r : R() < 0.2 ? r.toLowerCase() : R() < 0.1 ? r.toUpperCase() : r)).join("\n");
  if (R() < 0.3) t = pick(["SPECIMEN", "Pagina 1 di 2", "Copia per uso interno", "www.esempio.gov"]) + "\n" + t;
  if (R() < 0.2) t += "\n" + pick(["Valido per l'espatrio", "Firma del titolare", "---"]);
  return t;
}
function genera(opz) {
  const modoDuro = !!(opz && opz.duro);
  const tutti = docs.map((d, i) => { const x = costruisci(d, i); if (modoDuro) x.testo = duro(x, d); return Object.assign({ id: i + 1 }, d, x); });
  // mescolo in modo ripetibile
  for (let i = tutti.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [tutti[i], tutti[j]] = [tutti[j], tutti[i]]; }
  const incolla = []; let k = 0;
  const prendi = (n) => { const g = tutti.slice(k, k + n); k += n; return g; };
  for (let i = 0; i < 120; i++) incolla.push(prendi(1));
  for (let i = 0; i < 25; i++) incolla.push(prendi(2));
  for (let i = 0; i < 5; i++) incolla.push(prendi(3));
  return incolla.map((g, i) => ({ n: i + 1, testo: g.map((x) => x.testo).join(modoDuro ? "\n" : "\n\n"), attese: g.map((x) => ({ id: x.id, kind: x.kind, att: x.att })) }));
}
module.exports = { genera, PAESI };
if (require.main === module) { const c = genera(); console.log(c.length + " incolla, " + c.reduce((s, x) => s + x.attese.length, 0) + " documenti, " + new Set(c.flatMap((x) => x.attese.map((a) => a.att.cittadinanza))).size + " nazionalità"); }
