/* Lettura del testo copiato da un documento: funziona sul telefono, senza internet e senza AI.
   Riconosce (1) le righe MRZ con le cifre di controllo (standard ICAO 9303) e (2) le voci scritte con le etichette
   in italiano, inglese, francese, spagnolo e tedesco ("Cognome", "Surname", "Nom", "Apellidos", "Nachname"…).
   Poi confronta le due letture tra loro: se non coincidono lo segnala. Non salva e non invia nulla. */
(function (root) {
"use strict";
var MRZ = root.MRZ || (typeof require === "function" ? require("./mrz.js") : null);

function sa(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, ""); }
function norm(s) { return sa(s).toUpperCase().replace(/[^A-Z0-9' ]+/g, " ").replace(/\s+/g, " ").trim(); }

var MESI = { gen: 1, jan: 1, feb: 2, mar: 3, apr: 4, mag: 5, may: 5, giu: 6, jun: 6, lug: 7, jul: 7, ago: 8, aug: 8, set: 9, sep: 9, ott: 10, oct: 10, nov: 11, dic: 12, dec: 12,
  janv: 1, fev: 2, mars: 3, avr: 4, mai: 5, juin: 6, juil: 7, aout: 8, sept: 9, dez: 12, ene: 1, abr: 4, dic_: 12, ago_: 8, mrz: 3, okt: 10 };

/* "01.02.1980", "1/2/80", "1980-02-01", "01 FEB 1980", "01 FEB/FEB 80" → "01/02/1980" */
function dataNorm(s) {
  var t = sa(s).toLowerCase().replace(/\s*\/\s*(?=[a-z]{3})[a-z]{3,}/g, " "), m, g, me, a;
  if ((m = /(\d{4})[-./](\d{1,2})[-./](\d{1,2})/.exec(t))) { a = +m[1]; me = +m[2]; g = +m[3]; }
  else if ((m = /(\d{1,2})[-./ ](\d{1,2})[-./ ](\d{2,4})/.exec(t))) { g = +m[1]; me = +m[2]; a = +m[3]; }
  else if ((m = /(\d{1,2})[ .\-]*([a-z]{3,5})[ .\-]*(\d{2,4})/.exec(t))) { g = +m[1]; me = MESI[m[2]] || MESI[m[2].slice(0, 3)]; a = +m[3]; }
  else return "";
  if (!me) return "";
  if (a < 100) a += a > (new Date().getFullYear() % 100) ? 1900 : 2000;
  var d = new Date(a, me - 1, g);
  if (d.getFullYear() !== a || d.getMonth() !== me - 1 || d.getDate() !== g) return "";
  return String(g).padStart(2, "0") + "/" + String(me).padStart(2, "0") + "/" + a;
}

/* etichetta → chiave. L'ordine conta: le più lunghe prima. */
var ETICHETTE = [
  ["luogodata", "luogo e data di nascita|place and date of birth|lieu et date de naissance|lugar y fecha de nacimiento|geburtsdatum und -ort|geburtsort und -datum"],
  ["nascita", "data di nascita|date of birth|birth date|date de naissance|fecha de nacimiento|geburtsdatum|nato il|nata il|born on|d\\.? ?o\\.? ?b\\.?|data nascita"],
  ["luogo", "luogo di nascita|comune di nascita|place of birth|lieu de naissance|lugar de nacimiento|geburtsort|nato a|nata a|born in|luogo nascita"],
  ["statonasc", "stato di nascita|country of birth|pays de naissance|pais de nacimiento|geburtsland"],
  ["cognome", "cognome|surname|last name|family name|nom de famille|apellidos?|nachname|familienname|nom"],
  ["nome", "nome|name|given names?|first names?|forenames?|prenoms?|nombres?|vorname[n]?"],
  ["sesso", "sesso|sex|sexe|sexo|geschlecht|genere|gender"],
  ["citt", "cittadinanza|nazionalita|nationality|citizenship|nationalite|nacionalidad|staatsangehorigkeit"],
  ["cf", "codice fiscale|fiscal code|tax code|c\\.? ?f\\.?"],
  ["ignora", "statura|height|taille|altura|grosse|residenza|residence|resident|domicilio|stato civile|marital status|professione|occupation|capelli|occhi|segni particolari|scadenza|date of expiry|expiry|expires|valid until|valida fino al|gultig bis|emissione|date of issue|data di rilascio|data rilascio|issuing|date d emission|indirizzo|address|estremi atto|atto di nascita|firma|signature|genitori|parents"],
  ["numero", "carta d'? ?identita'? ?n[°o.]?|carta di identita'? ?n[°o.]?|n[°o.] carta|numero del documento|numero documento|n\\.? ?documento|document no\\.?|document number|passport no\\.?|passport number|passeport n|n[°o]\\.? del documento|numero|document n[°o]|dokumentnummer|n[uú]mero de documento|no\\.|n\\."],
  ["rilascio", "luogo di rilascio|comune di rilascio|municipality of|comune di|issued by|rilasciat[oa] da|rilasciat[oa] a|rilasciat[oa] dal|autorita|issuing authority|authority|place of issue|issued by|issued at|emesso da|emessa da|rilascio|delivre par|autoridad|ausstellende beh[oö]rde|stato di rilascio|issuing state|issuing country|country of issue"],
  ["tipodoc", "tipo di documento|tipo documento|document type|type of document|type de document"]
];
var RE_ET = ETICHETTE.map(function (e) { return [e[0], new RegExp("(^|[^a-z0-9])(" + e[1] + ")(?![a-z0-9])", "gi")]; });

function trovaEtichette(t) {
  var s = sa(t), out = [];
  RE_ET.forEach(function (e) {
    e[1].lastIndex = 0; var m;
    while ((m = e[1].exec(s))) {
      var inizio = m.index + m[1].length, fine = inizio + m[2].length;
      // "nome" dentro "cognome/surname" o "nome e cognome": non è un'etichetta autonoma
      if (e[0] === "nome" && /(sur|cog|nom de fam|last|family)/i.test(s.slice(Math.max(0, inizio - 8), inizio))) continue;
      out.push({ k: e[0], i: inizio, f: fine });
    }
  });
  out.sort(function (a, b) { return a.i - b.i || (b.f - b.i) - (a.f - a.i); });
  var pul = []; // toglie le etichette contenute in altre (es. "nome" dentro "luogo di nascita")
  out.forEach(function (x) { var l = pul[pul.length - 1]; if (l && x.i < l.f) return; pul.push(x); });
  return pul;
}

function valoreDi(t, da, a) {
  var seg = t.slice(da, a).replace(/^[\s:;\/\-–—|.]+/, "");
  var righe = seg.split(/\n/).map(function (r) { return r.trim(); }).filter(Boolean);
  return (righe[0] || "").replace(/[\s|;]+$/, "").trim();
}

function sessoDa(v) { var s = norm(v).split(" ")[0] || ""; if (/^(M|MASCHIO|MALE|MASC|H|HOMBRE|HOMME|MANN|MANNLICH)$/.test(s)) return "M"; if (/^(F|FEMMINA|FEMALE|FEM|W|MUJER|FEMME|FRAU|WEIBLICH)$/.test(s)) return "F"; return ""; }

function luogoDa(v, r) {
  var s = String(v || "").trim(); if (!s) return;
  var m = /^(.*?)[\s,]*\(\s*([A-Za-z]{2})\s*\)\s*$/.exec(s);
  if (m) { r.comune_nascita = norm(m[1]); r.provincia_nascita = m[2].toUpperCase(); return; }
  m = /^(.*?)[\s,\-]+([A-Z]{2})$/.exec(s);
  if (m && m[1].length > 2 && !/^(UK|US|EU)$/.test(m[2])) { r.comune_nascita = norm(m[1]); r.provincia_nascita = m[2]; r.incerto_prov = true; return; }
  r.luogo_nascita = norm(s.replace(/\s*[,\/].*$/, "")); // città o stato: lo decide la pagina con le tabelle ufficiali
  var c = /[,\/]\s*(.+)$/.exec(s); if (c) r.stato_nascita = norm(c[1]);
}

function tipoDocDa(testo) {
  var t = norm(testo).replace(/'/g, " ").replace(/\s+/g, " ");
  if (/CARTA (?:D |DI )?IDENTITA ELETTRONICA|ELECTRONIC IDENTITY CARD|\bCIE\b/.test(t)) return "IDELE";
  if (/CARTA (?:D |DI )?IDENTITA|IDENTITY CARD|CARTE NATIONALE D IDENTITE|DOCUMENTO NACIONAL DE IDENTIDAD|PERSONALAUSWEIS/.test(t)) return "IDENT";
  if (/PASSAPORTO|PASSPORT|PASSEPORT|PASAPORTE|REISEPASS/.test(t)) return "PASOR";
  if (/PATENTE|DRIVING LICEN|PERMIS DE CONDUIRE|FUHRERSCHEIN|LICENCIA DE CONDUCIR/.test(t)) return "PATEN";
  return "";
}

/* patente italiana: 1. cognome  2. nome  3. data e luogo di nascita  4a/4b date  4c ente  5. numero */
function patente(t) {
  var r = {}, riga = function (n) { var m = new RegExp("(?:^|\\n)\\s*" + n + "\\s*[.)]\\s*([^\\n]+)", "i").exec(t); return m ? m[1].trim() : ""; };
  var c = riga("1"), n = riga("2"), l = riga("3"), e = riga("4c"), u = riga("5");
  if (!(c && n && /\d{2}.\d{2}.\d{2,4}/.test(l))) return null;
  r.cognome = c; r.nome = n; r.data_nascita = dataNorm(l); luogoDa(l.replace(/\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}/, "").trim(), r);
  if (u) r.numero_documento = u.replace(/\s+/g, ""); if (e) r.rilascio_testo = e; r.tipo_documento = "PATEN";
  return r;
}

function persone(testo) {
  var t = String(testo || "").replace(/\r/g, ""), P = [], pat = patente(t);
  if (pat) P.push(pat);
  var et = trovaEtichette(t), cur = {}, punti = [];
  for (var i = 0; i < et.length; i++) {
    var v = valoreDi(t, et[i].f, i + 1 < et.length ? et[i + 1].i : t.length);
    // etichetta bilingue ("Cognome / Surname"): la seconda ha valore vuoto o è la sola etichetta seguita dal valore
    punti.push({ k: et[i].k, v: v });
  }
  // valore vuoto → passa al prossimo con la stessa chiave o prende quello dell'etichetta dopo (bilingue)
  for (i = 0; i < punti.length; i++) if (!punti[i].v && punti[i + 1] && punti[i + 1].v && !punti[i + 1].usato && punti[i + 1].k === punti[i].k) punti[i].v = punti[i + 1].v;
  function chiudi() { if (Object.keys(cur).length) P.push(cur); cur = {}; }
  punti.forEach(function (p) {
    if (!p.v) return;
    var k = p.k, nuovaPersona = (k === "cognome" && cur.cognome && cur.cognome !== p.v) || (k === "nome" && cur.nome && cur.nome !== p.v && !cur.cognome);
    if (nuovaPersona) chiudi();
    if (k === "cognome") cur.cognome = norm(p.v);
    else if (k === "nome") cur.nome = norm(p.v);
    else if (k === "sesso") cur.sesso = sessoDa(p.v) || cur.sesso;
    else if (k === "nascita") cur.data_nascita = dataNorm(p.v) || cur.data_nascita;
    else if (k === "luogodata") { var d = dataNorm(p.v); if (d) cur.data_nascita = d; luogoDa(p.v.replace(/\d{1,2}[./\-\s]\d{1,2}[./\-\s]\d{2,4}|\d{4}[./\-]\d{1,2}[./\-]\d{1,2}|\d{1,2}\s*[A-Za-z]{3,5}\s*\d{2,4}/g, "").trim(), cur); }
    else if (k === "luogo") luogoDa(p.v, cur);
    else if (k === "statonasc") cur.stato_nascita = norm(p.v);
    else if (k === "citt") cur.cittadinanza = norm(p.v);
    else if (k === "cf") { var c = String(p.v).toUpperCase().replace(/[^A-Z0-9]/g, ""); if (/^[A-Z0-9]{16}$/.test(c)) cur.codice_fiscale = c; }
    else if (k === "numero") cur.numero_documento = p.v.replace(/[\s.\-]+/g, "").toUpperCase();
    else if (k === "rilascio") cur.rilascio_testo = p.v;
    else if (k === "tipodoc") cur.tipo_documento = tipoDocDa(p.v) || cur.tipo_documento;
  });
  chiudi();
  var nn = /nat[oa](?:\/a)?\s+il\s+([0-9A-Za-z\/.\- ]{6,14}?)\s+a\s+([A-Za-z' ]{2,40}?)\s*(?:\(\s*([A-Za-z]{2})\s*\))?(?:\n|$|\s{2,})/i.exec(sa(t));
  if (nn && P.length) { var q = P[0]; if (!q.data_nascita && dataNorm(nn[1])) q.data_nascita = dataNorm(nn[1]); if (!q.comune_nascita && !q.luogo_nascita) { if (nn[3]) { q.comune_nascita = norm(nn[2]); q.provincia_nascita = nn[3].toUpperCase(); } else q.luogo_nascita = norm(nn[2]); } }
  // numero del documento senza etichetta (formati italiani: CIE AA00000AA, cartacea/passaporto AA0000000)
  if (P.length === 1 && !P[0].numero_documento) {
    var nm = sa(t).toUpperCase().match(/\b[A-Z]{2}\d{5}[A-Z]{2}\b|\b[A-Z]{2}\d{7}\b/);
    if (nm) { P[0].numero_documento = nm[0]; if (P[0].rilascio_testo) P[0].rilascio_testo = P[0].rilascio_testo.replace(nm[0], "").trim(); }
  }
  // codice fiscale senza etichetta
  var cfm = sa(t).toUpperCase().match(/\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/g);
  if (cfm && P.length === 1 && !P[0].codice_fiscale) P[0].codice_fiscale = cfm[0];
  // un cognome incollato da solo senza nome (es. "ROSSI MARIO" su una riga) non si indovina: si lascia vuoto
  var td = tipoDocDa(t);
  P.forEach(function (p) { if (!p.tipo_documento && td) p.tipo_documento = td; });
  return P.filter(function (p) { return p.cognome || p.nome || p.data_nascita || p.numero_documento; });
}

/* ---- codice fiscale: serve solo per controllare la lettura (nome, cognome, data di nascita, sesso) ---- */
var CF_D = { 0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21, A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23 };
var CF_MESE = "ABCDEHLMPRST";
function cfValido(cf) {
  if (!/^[A-Z]{6}\d{2}[ABCDEHLMPRST]\d{2}[A-Z]\d{3}[A-Z]$/.test(cf)) return false;
  var somma = 0, i, c;
  for (i = 0; i < 15; i++) { c = cf.charAt(i); somma += i % 2 === 0 ? CF_D[c] : /\d/.test(c) ? +c : c.charCodeAt(0) - 65; }
  return String.fromCharCode(65 + somma % 26) === cf.charAt(15);
}
function cfLettere(s, nome) {
  var l = norm(s).replace(/[^A-Z]/g, ""), cons = l.replace(/[AEIOU]/g, ""), voc = l.replace(/[^AEIOU]/g, "");
  if (nome && cons.length >= 4) cons = cons.charAt(0) + cons.charAt(2) + cons.charAt(3);
  return (cons + voc + "XXX").slice(0, 3);
}
function cfDati(cf) { var g = +cf.slice(9, 11), f = g > 40; return { giorno: f ? g - 40 : g, mese: CF_MESE.indexOf(cf.charAt(8)) + 1, anno2: cf.slice(6, 8), sesso: f ? "F" : "M" }; }
function cfControlla(p, cf) {
  var av = [], dub = [];
  if (!cfValido(cf)) { av.push("Il codice fiscale non ha la cifra di controllo giusta: è stato letto male."); return { av: av, dub: dub }; }
  var d = cfDati(cf);
  if (p.cognome && cf.slice(0, 3) !== cfLettere(p.cognome, false)) { dub.push("cognome"); av.push("Il codice fiscale non corrisponde al cognome letto."); }
  if (p.nome && cf.slice(3, 6) !== cfLettere(p.nome, true)) { dub.push("nome"); av.push("Il codice fiscale non corrisponde al nome letto."); }
  if (p.sesso && p.sesso !== d.sesso) { dub.push("sesso"); av.push("Il sesso non coincide con quello del codice fiscale."); }
  if (p.data_nascita) { var m = /^(\d\d)\/(\d\d)\/\d\d(\d\d)$/.exec(p.data_nascita); if (m && (+m[1] !== d.giorno || +m[2] !== d.mese || m[3] !== d.anno2)) { dub.push("data_nascita"); av.push("La data di nascita non coincide con quella del codice fiscale."); } }
  return { av: av, dub: dub, sesso: d.sesso };
}

/* confronto tra due letture della stessa persona: elenco delle differenze */
function confronta(a, b) {
  var dif = [], eq = function (x, y) { return !x || !y || norm(x) === norm(y); };
  if (!eq(a.cognome, b.cognome)) dif.push("cognome");
  if (!eq(a.nome, b.nome) && !(a.nome && b.nome && (norm(a.nome).indexOf(norm(b.nome)) === 0 || norm(b.nome).indexOf(norm(a.nome)) === 0))) dif.push("nome");
  if (a.data_nascita && b.data_nascita && a.data_nascita !== b.data_nascita) dif.push("data di nascita");
  if (a.sesso && b.sesso && a.sesso !== b.sesso) dif.push("sesso");
  if (a.numero_documento && b.numero_documento && norm(a.numero_documento).replace(/ /g, "") !== norm(b.numero_documento).replace(/ /g, "")) dif.push("numero del documento");
  return dif;
}

/* MRZ → stessa forma delle altre letture */
function daMRZ(r) {
  var p = { cognome: r.cognome, nome: r.nome, sesso: r.sesso, data_nascita: r.nascita, numero_documento: r.numero, cittadinanza: MRZ.PAESI[r.nazionalita] || "", mrz: r };
  p.tipo_documento = /^P/.test(r.tipo || "") ? "PASOR" : /^C/.test(r.tipo || "") && r.emittente === "ITA" ? "IDELE" : /^[IAC]/.test(r.tipo || "") ? "IDENT" : "";
  if (r.emittente && r.emittente !== "ITA" && MRZ.PAESI[r.emittente]) p.rilascio_stato = MRZ.PAESI[r.emittente];
  return p;
}

/* Lettura completa. Ritorna { persone:[{...campi, fonti:["testo","mrz"], differenze:[], avvisi:[], dubbi:[]}], note } */
function leggi(testo) {
  var t = String(testo || ""), out = { persone: [], note: [] };
  if (t.length > 20000) { out.note.push("Testo troppo lungo: incolla solo la parte del documento."); return out; }
  var mrz = MRZ ? MRZ.leggi(t) : null, P = persone(t).map(function (p) { p.fonti = ["testo"]; return p; });
  if (mrz) {
    var m = daMRZ(mrz); m.fonti = ["mrz"];
    var i = -1; P.forEach(function (p, j) { if (i < 0 && p.cognome && norm(p.cognome) === norm(m.cognome)) i = j; });
    if (i < 0 && P.length === 1) i = 0;
    if (i >= 0) {
      var p = P[i], dif = confronta(p, m); p.differenze = dif; p.fonti = ["testo", "mrz"]; p.mrz = mrz;
      ["cognome", "nome", "sesso", "data_nascita", "numero_documento", "cittadinanza", "tipo_documento", "rilascio_stato"].forEach(function (k) { if (!p[k] && m[k]) p[k] = m[k]; });
      // se le due letture non coincidono vale la MRZ (ha le cifre di controllo) ma il campo resta da controllare
      dif.forEach(function (d) {
        var k = { "cognome": "cognome", "nome": "nome", "data di nascita": "data_nascita", "sesso": "sesso", "numero del documento": "numero_documento" }[d];
        if (k && mrz.controlli && (k !== "numero_documento" || mrz.controlli.numero) && (k !== "data_nascita" || mrz.controlli.nascita)) p[k] = m[k];
      });
    } else P.push(m);
  }
  P.forEach(function (p) {
    p.dubbi = [].concat(p.differenze || []).map(function (d) { return { "data di nascita": "data_nascita", "numero del documento": "numero_documento" }[d] || d; });
    p.avvisi = [];
    if (p.mrz) {
      if (!p.mrz.controlli.numero) { p.dubbi.push("numero_documento"); p.avvisi.push("Le cifre di controllo del numero non tornano: ricontrolla il numero."); }
      if (!p.mrz.controlli.nascita) { p.dubbi.push("data_nascita"); p.avvisi.push("Le cifre di controllo della data di nascita non tornano."); }
    }
    if (p.differenze && p.differenze.length) p.avvisi.push("Il testo e le righe MRZ non coincidono su: " + p.differenze.join(", ") + ".");
    if (p.codice_fiscale) {
      var cc = cfControlla(p, p.codice_fiscale); p.avvisi = p.avvisi.concat(cc.av); p.dubbi = p.dubbi.concat(cc.dub);
      if (!p.sesso && cc.sesso) p.sesso = cc.sesso; // dal codice fiscale il sesso è certo
    }
    if (p.incerto_prov) { p.dubbi.push("comune_nascita"); p.avvisi.push("Ho letto «" + p.comune_nascita + " " + p.provincia_nascita + "» come comune e provincia: controlla."); }
  });
  out.persone = P;
  if (!P.length) out.note.push("Non ho trovato né le righe MRZ (con <<<) né voci come Cognome, Nome, Data di nascita. Incolla più testo oppure compila a mano.");
  return out;
}

var api = { cfValido: cfValido, cfControlla: cfControlla, leggi: leggi, persone: persone, confronta: confronta, dataNorm: dataNorm, tipoDocDa: tipoDocDa, sessoDa: sessoDa };
if (typeof module !== "undefined" && module.exports) module.exports = api; else root.INC = api;
})(this);
