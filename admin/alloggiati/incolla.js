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
  ["nascita", "birth ?day|birthdate|date of birth|dob|born|datum narodenia|datum narozeni|data urodzenia|geboortedatum|data de nascimento|fodelsedato|dogum tarihi|data nasterii|data di nascita|date of birth|birth date|date de naissance|fecha de nacimiento|geburtsdatum|nato il|nata il|born on|d\\.? ?o\\.? ?b\\.?|data nascita"],
  ["luogo", "birth ?place|pob|luogo di nascita|comune di nascita|place of birth|lieu de naissance|lugar de nacimiento|geburtsort|nato a|nata a|born in|luogo nascita"],
  ["statonasc", "stato di nascita|country of birth|pays de naissance|pais de nacimiento|geburtsland"],
  ["cognome", "cognome|sur name|surname|last ?name|family ?name|last name|family name|nom de famille|apellidos?|nachname|familienname|priezvisko|prijmeni|nazwisko|achternaam|efternamn|etternavn|soyadi|apelido|sobrenome|nume|nom"],
  ["nome", "nome|name|given name\\(s\\)|given names?|given|first and middle names?|first ?names?|christian names?|other names?|middle names?|first names?|forenames?|prenoms?|nombres?|vorname[n]?|meno|jmeno|imie|voornamen|fornavn|fornamn|prenume|adi"],
  ["sesso", "sesso|sex|sexe|sexo|geschlecht|genere|gender|pohlavie|pohlavi|plec|geslacht|kon|cinsiyet"],
  ["citt", "citizen of|country of citizenship|nationality|nation|cittadinanza|nazionalita|nationality|citizenship|nationalite|nacionalidad|staatsangehorigkeit|statna prislusnost|statni prislusnost|obywatelstwo|nationaliteit|nacionalidade|nationalitet|uyrugu|cetatenie"],
  ["cf", "codice fiscale|fiscal code|tax code|c\\.? ?f\\.?"],
  ["ignora", "personal no\\.?|personal number|national id( no\\.?)?|tax (id|number)|expiration date|date of expiration|expiry date|valid (until|thru|till|to)|date of validity|issue date|issued on|date issued|signature|holder.s signature|statura|height|taille|altura|grosse|residenza|residence|resident|domicilio|stato civile|marital status|professione|occupation|capelli|occhi|segni particolari|scadenza|date of expiry|expiry|expires|valid until|valida fino al|gultig bis|emissione|date of issue|data di rilascio|data rilascio|issuing|date d emission|indirizzo|address|estremi atto|atto di nascita|firma|signature|genitori|parents"],
  ["numero", "id no\\.?|id number|identity card no\\.?|identity card number|identification no\\.?|card no\\.?|card number|doc\\.? no\\.?|document id|serial no\\.?|serial number|numero du document|numero de documento|numero de document|numero du titre|carta d'? ?identita'? ?n[°o.]?|carta di identita'? ?n[°o.]?|n[°o.] carta|numero del documento|numero documento|n\\.? ?documento|document no\\.?|document number|passport no\\.?|passport number|passeport n|n[°o]\\.? del documento|numero|document n[°o]|dokumentnummer|n[uú]mero de documento|no\\.|n\\."],
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
      if (e[0] === "nome" && /^(nome|name)$/i.test(m[2]) && /(sur|cog|nom de fam|last|family)/i.test(s.slice(Math.max(0, inizio - 8), inizio))) continue;
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
  m = /^(.*?)[\s,]*\(\s*([A-Za-z]{3})\s*\)\s*$/.exec(s); // carta italiana, nato all'estero: «ST.NIKLAAS (BEL)» = codice del paese
  if (m) { r.luogo_nascita = norm(m[1]); r.stato_nascita = m[2].toUpperCase(); return; }
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

/* numeri dei documenti con formato noto: nelle posizioni delle cifre una lettera simile (O, I, S, B…) è quasi certamente una cifra, e viceversa */
var L2D = { O: "0", Q: "0", D: "0", I: "1", L: "1", Z: "2", S: "5", B: "8", G: "6", T: "7" }, D2L = { "0": "O", "1": "I", "2": "Z", "5": "S", "8": "B", "6": "G" };
var FORMATI = ["LLDDDDDLL", "LLDDDDDDD", "LDDDDDDDL"];
function correggiNumero(n, tipo) {
  var s = String(n || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), best = null, ord = tipo === "IDELE" ? FORMATI : tipo ? [FORMATI[1], FORMATI[2], FORMATI[0]] : FORMATI, ambiguo = false;
  ord.forEach(function (f) {
    if (f.length !== s.length) return;
    var out = "", cambi = 0, ok = true;
    for (var i = 0; i < s.length && ok; i++) {
      var c = s.charAt(i);
      if (f.charAt(i) === "D") { if (/\d/.test(c)) out += c; else if (L2D[c]) { out += L2D[c]; cambi++; } else ok = false; }
      else { if (/[A-Z]/.test(c)) out += c; else if (D2L[c]) { out += D2L[c]; cambi++; } else ok = false; }
    }
    if (ok && best && cambi === best.cambi && out !== best.v && !tipo) ambiguo = true;
    if (ok && (!best || cambi < best.cambi)) best = { v: out, cambi: cambi };
  });
  return best && !ambiguo ? { v: best.v, cambiato: best.cambi > 0 } : { v: s, cambiato: false };
}
function numeroSenzaEtichetta(t) {
  var tok = sa(t).toUpperCase().match(/\b[A-Z0-9]{9}\b/g) || [];
  for (var i = 0; i < tok.length; i++) {
    if (!/[A-Z]/.test(tok[i]) || (tok[i].match(/\d/g) || []).length < 3) continue; // «EMISSIONE» diventerebbe EM15510NE: servono almeno 3 cifre vere
    var c = correggiNumero(tok[i]);
    if (c.cambiato || FORMATI.some(function (f) { return new RegExp("^" + f.replace(/L/g, "[A-Z]").replace(/D/g, "\\d") + "$").test(tok[i]); })) return tok[i];
  }
  return "";
}

/* patente italiana: 1. cognome  2. nome  3. data e luogo di nascita  4a/4b date  4c ente  5. numero */
function patente(t) {
  var r = {}, riga = function (n) { // tollera rumore prima del numero («ke KL 2. PAOLO»), virgola al posto del punto, valore sulla riga dopo
    var m = new RegExp("(?:^|\\n)[^\\n\\d]{0,14}?\\b" + n + "\\s*[.,)]\\s*([^\\n]+)", "i").exec(t);
    if (!m && n.length === 1) { m = new RegExp("(?:^|\\n)[^\\n\\d]{0,6}\\b" + n + "\\s*\\n+\\s*(?:[^\\n\\w]{0,4})([A-Za-z0-9][^\\n]*)", "i").exec(t); }
    if (!m && /^4[a-c]$/i.test(n)) m = new RegExp("\\b" + n + "\\s*[.,)]\\s*([^\\n]+)", "i").exec(t);
    if (!m && n === "5") m = /(?:^|\s)5\s*[.,)]\s*([A-Z][A-Z0-9 ]{7,13}[A-Z0-9])\s*(?:\n|$)/.exec(t); // numero patente: lettera + cifre, con rumore davanti
    return m ? m[1].trim() : "";
  };
  var c = riga("1"), n = riga("2"), l = riga("3"), e = riga("4c"), u = riga("5");
  if (!(c && n && /\d{2}.\d{2}.\d{2,4}/.test(l))) return null;
  r.cognome = c; r.nome = n; r.data_nascita = dataNorm(l); luogoDa(l.replace(/\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}/, "").trim(), r);
  if (u) r.numero_documento = u.replace(/\s+/g, ""); if (e) r.rilascio_testo = e; r.tipo_documento = "PATEN";
  return r;
}


/* OCR sporco ("Sumame", "Govee names", "Dote of expin"): riconosce l'etichetta inglese anche con qualche lettera sbagliata.
   Solo su pezzi corti separati da "/" o a inizio riga, così un nome vero non viene mai scambiato per un'etichetta. */
var OPZ = {};
var FRASI = ["date of birth", "birth date", "birthday", "place of birth", "birthplace", "country of birth", "date of issue", "issue date", "date of expiry", "expiry date", "date of expiration", "valid until", "given names", "given name", "first name", "first names", "forenames", "surname", "last name", "family name", "nationality", "citizenship", "gender", "authority", "issuing authority", "document no", "document number", "passport no", "passport number", "identity card no", "card number", "personal no", "personal number", "signature"];
function dist(a, b) {
  var m = a.length, n = b.length, d = [], i, j;
  for (i = 0; i <= m; i++) { d[i] = [i]; }
  for (j = 1; j <= n; j++) d[0][j] = j;
  for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function ripara(t) {
  return t.split("\n").map(function (riga) {
    if (riga.length > 70) return riga;
    var prot = riga.replace(/(\d)\s*\/\s*(?=\d)/g, "$1\u0001");
    return prot.split(/\s*\/\s*/).map(function (seg) {
      var k = sa(seg).toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
      if (k.length < 3 || k.split(" ").length > 4 || trovaEtichette(seg).length) return seg; // già un'etichetta vera (in qualunque lingua): non toccarla
      var best = "", bd = 99;
      FRASI.forEach(function (f) { if (f.length < 5) return; if (Math.abs(k.length - f.length) > 2) return; var d = dist(k, f); if (d < bd) { bd = d; best = f; } });
      return best && bd > 0 && bd <= Math.max(1, Math.round(best.length * (OPZ.largo ? 0.4 : 0.3))) ? best : seg;
    }).join(" / ").replace(/\u0001/g, "/");
  }).join("\n");
}

/* ultima rete: cosa si può dire anche senza etichette (date, sesso da solo sulla riga, numero, numero personale slovacco/ceco) */
function euristica(t) {
  var out = {}, oggi = new Date(), r = /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})|(\d{4})-(\d{2})-(\d{2})/g, m, cand = [];
  while ((m = r.exec(t))) {
    var dn = dataNorm(m[0]); if (!dn) continue;
    var prima = sa(t.slice(Math.max(0, m.index - 45), m.index)).toLowerCase(), dd = dn.split("/"), a = +dd[2];
    var scad = /(expir|expiry|valid|platnost|scadenza|valida|gultig|issue|emission|delivr|rilascio|ssue|expin|date of e)/.test(prima.split("\n").pop() || prima);
    var eta = oggi.getFullYear() - a;
    if (!scad && eta >= 0 && eta <= 120) cand.push({ d: dn, a: a, m: +dd[1], g: +dd[0] });
  }
  var rn = /(?:^|[^0-9])(\d{2})(\d{2})(\d{2})\s?\/\s?(\d{3,4})(?![0-9])/.exec(t);
  if (rn) { // numero personale ceco/slovacco: AAMMGG/XXXX (mese +50 per le donne)
    var mm = +rn[2], f = mm > 50, mese = f ? mm - 50 : mm, an = +rn[1] + (+rn[1] > oggi.getFullYear() % 100 ? 1900 : 2000);
    if (mese >= 1 && mese <= 12 && +rn[3] >= 1 && +rn[3] <= 31) { out.nascita_pn = String(+rn[3]).padStart(2, "0") + "/" + String(mese).padStart(2, "0") + "/" + an; out.sesso_pn = f ? "F" : "M"; }
  }
  if (out.nascita_pn) out.data_nascita = out.nascita_pn;
  else if (cand.length) { cand.sort(function (x, y) { return x.a - y.a || x.m - y.m || x.g - y.g; }); out.data_nascita = cand[0].d; }
  var righe = t.split("\n").map(function (x) { return x.trim(); });
  for (var i = 0; i < righe.length; i++) if (/^[A-Za-z]$/.test(righe[i])) { var sx = sessoDa(righe[i]); if (sx) { out.sesso = sx; break; } }
  if (!out.sesso && out.sesso_pn) out.sesso = out.sesso_pn;
  var tok = sa(t).toUpperCase().match(/(?:^|[^A-Z0-9<])([A-Z0-9]{7,10})(?![A-Z0-9<])/gm) || [], nums = [];
  tok.forEach(function (x) { x = x.replace(/^[^A-Z0-9]/, ""); if (/\d{5,}/.test(x) && /[A-Z]/.test(x) && !/^\d{2}[A-Z]{3}\d{2}/.test(x) && !/[A-Z]{4,}/.test(x)) nums.push(x); });
  if (nums.length) { nums.sort(function (x, y) { return (/^[A-Z]{1,2}\d{6,8}$/.test(y) ? 1 : 0) - (/^[A-Z]{1,2}\d{6,8}$/.test(x) ? 1 : 0); }); out.numero_documento = nums[0]; }
  return out;
}
function persone(testo) {
  var t = ripara(String(testo || "").replace(/\r/g, "").replace(/[ \t\u00a0]+/g, " ").replace(/ *\n */g, "\n")), P = [], pat = patente(t);
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
    var k = p.k, nv = norm(p.v), nuovaPersona = (k === "cognome" && cur.cognome && cur.cognome !== nv) || (k === "nome" && cur.nome && cur.nome !== nv && !cur.cognome);
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
  var nn = /nat[oa](?:\/a)?\s+il\s+([0-9A-Za-z\/.\- ]{6,14}?)\s+a\s+([A-Za-z' ]{2,40}?)\s*\(\s*([A-Za-z]{2})\s*\)/i.exec(sa(t)) ||
    /nat[oa](?:\/a)?\s+il\s+([0-9A-Za-z\/.\- ]{6,14}?)\s+a\s+([A-Za-z' ]{2,40}?)\s*()(?:\n|$|\s{2,})/i.exec(sa(t));
  if (nn && P.length) { var q = P[0]; if (!q.data_nascita && dataNorm(nn[1])) q.data_nascita = dataNorm(nn[1]); if (!q.comune_nascita && !q.luogo_nascita) { if (nn[3]) { q.comune_nascita = norm(nn[2]); q.provincia_nascita = nn[3].toUpperCase(); } else q.luogo_nascita = norm(nn[2]); } }
  // numero del documento senza etichetta (formati italiani: CIE AA00000AA, cartacea/passaporto AA0000000)
  if (P.length === 1 && !P[0].numero_documento) {
    var nm = numeroSenzaEtichetta(t);
    if (nm) { P[0].numero_documento = nm; if (P[0].rilascio_testo) P[0].rilascio_testo = P[0].rilascio_testo.replace(new RegExp(nm, "i"), "").trim(); }
  }
  // codice fiscale senza etichetta
  var cfm = sa(t).toUpperCase().match(/\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/g);
  if (cfm && P.length === 1 && !P[0].codice_fiscale) P[0].codice_fiscale = cfm[0];
  // un cognome incollato da solo senza nome (es. "ROSSI MARIO" su una riga) non si indovina: si lascia vuoto
  var td = tipoDocDa(t);
  P.forEach(function (p) { if (!p.tipo_documento && td) p.tipo_documento = td; });
  var italiano = /REPUBBLICA ITALIANA|COMUNE DI|QUESTURA|MINISTERO DELL INTERNO|PATENTE/.test(norm(t).replace(/'/g, " "));
  P.forEach(function (p) {
    p.pulizia = [];
    var itP = italiano || /^ITA$|^ITALIAN/.test(norm(p.cittadinanza || ""));
    if (itP && p.numero_documento && /^(IDELE|IDENT|PASOR)$/.test(p.tipo_documento || "")) {
      var c = correggiNumero(p.numero_documento, p.tipo_documento);
      if (c.cambiato) { p.pulizia.push("Ho corretto il numero del documento da «" + p.numero_documento + "» a «" + c.v + "» (lettere e cifre simili). Controlla con la foto."); p.numero_documento = c.v; p.numero_corretto = true; }
    }
  });
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

/* tutte le MRZ del testo (anche di più documenti incollati insieme) */
function mrzTutte(t) {
  if (!MRZ) return [];
  var L = MRZ.righe(t), out = [], i = 0;
  while (i < L.length) {
    var r = MRZ.leggi(L.slice(i, i + 3).join("\n")) || (i + 1 < L.length ? MRZ.leggi(L.slice(i, i + 2).join("\n")) : null);
    if (r) { out.push(r); i += r.formato === "TD1" ? 3 : 2; } else i++;
  }
  return out;
}
var compatta = function (x) { return norm(x).replace(/ /g, ""); };

/* più documenti incollati di seguito, senza righe vuote: si taglia prima dell'intestazione del documento successivo */
var RE_INTEST = /(REPUBBLICA ITALIANA|COMUNE DI [A-Z' ]{2,25}(?=\s*\n?\s*CARTA)|CARTA (?:D'? ?|DI )?IDENTITA|PASSAPORTO|PASSPORT\b|IDENTITY CARD|PATENTE DI GUIDA|PERSONALAUSWEIS|CARTE NATIONALE)/gi;
function dividi(testo) {
  var t = String(testo || "").replace(/\r/g, "").replace(/[ \t\u00a0]+/g, " ").replace(/ *\n */g, "\n"), z = sa(t), et = trovaEtichette(t), inizi = [], visti = {};
  var cur = {}, ult = null;
  et.forEach(function (e, i) { // primo etichetta di ogni persona: stessa regola di persone()
    var v = valoreDi(t, e.f, i + 1 < et.length ? et[i + 1].i : t.length); if (!v) return;
    var nuova = (e.k === "cognome" && cur.cognome && cur.cognome !== norm(v)) || (e.k === "nome" && cur.nome && cur.nome !== norm(v) && !cur.cognome);
    if (nuova) { inizi.push(e.i); cur = {}; }
    if (e.k === "cognome") cur.cognome = norm(v); if (e.k === "nome") cur.nome = norm(v);
  });
  var pg, rp = /PATENTE DI GUIDA/gi; while ((pg = rp.exec(z))) if (pg.index > 0) inizi.push(pg.index);
  inizi = inizi.filter(function (x, i, a) { return a.indexOf(x) === i; }).sort(function (a, b) { return a - b; });
  if (!inizi.length) return [t];
  var marc = [], m; RE_INTEST.lastIndex = 0; while ((m = RE_INTEST.exec(z))) marc.push({ i: m.index, f: m.index + m[0].length });
  var tagli = inizi.map(function (a, k) {
    var prec = k ? inizi[k - 1] : 0, c = a, cand = marc.filter(function (x) { return x.i < a && x.i > prec; });
    if (cand.length) { c = cand[cand.length - 1].i; for (var j = cand.length - 2; j >= 0; j--) if (c - cand[j].f < 40 && !/\d/.test(z.slice(cand[j].f, c))) c = cand[j].i; else break; }
    return c;
  });
  var out = [], da = 0; tagli.forEach(function (c) { out.push(t.slice(da, c)); da = c; }); out.push(t.slice(da));
  return out.map(function (x) { return x.trim(); }).filter(Boolean);
}

/* ---------- lettura larga: prova tutte le posizioni possibili del valore rispetto all'etichetta e tiene solo ciò che ha senso ---------- */
var PAROLE_NO = /(^| )(republic|republica|republika|repubblica|passport|passeport|pasaporte|identity|identita|identification|card|carta|document|specimen|nationality|surname|given|names?|date|birth|sex|authority|signature|holder|valid|expiry|issue|issued|place|number|ministero|ministry|kingdom|union|european|driving|licen[cs]e|national|type|code|of|and)( |$)/;
var TITOLI = ["passport", "identity", "republic", "document", "surname", "nationality", "authority", "signature", "ministry", "national", "citizen", "birth", "holder", "expiry", "given", "gender", "number"];
function somiglia(x) { return sa(x).toLowerCase().split(/[^a-z]+/).some(function (w) { return w.length >= 5 && TITOLI.some(function (t) { return Math.abs(w.length - t.length) <= 2 && dist(w, t) <= (t.length >= 8 ? 2 : 1); }); }); }
function nomeOk(v, largoM) {
  var x = String(v || "").trim(); if (!x) return "";
  if (largoM && /\d/.test(x) && (x.match(/\d/g) || []).length <= 2 && x.replace(/[^A-Za-z]/g, "").length >= 3) x = x.replace(/0/g, "O").replace(/1/g, "I").replace(/5/g, "S").replace(/8/g, "B").replace(/4/g, "A");
  if (/\d/.test(x) || !/^[A-Za-zÀ-ÿ'’`´ .\-]{2,45}$/.test(x) || x.replace(/[^A-Za-zÀ-ÿ]/g, "").length < 2 || x.split(/\s+/).length > 5) return "";
  if (PAROLE_NO.test(sa(x).toLowerCase()) || somiglia(x)) return "";
  return norm(x);
}
function dataOk(v, largoM) {
  var x = String(v || ""); if (largoM) x = x.replace(/[Oo]/g, "0").replace(/[lI|]/g, "1").replace(/(\d)\s+(\d)/g, "$1.$2");
  var d = dataNorm(x); if (!d) return ""; var a = +d.slice(6), anno = new Date().getFullYear();
  return a >= anno - 120 && a <= anno ? d : "";
}
function numeroOk(v) {
  var x = String(v || "").toUpperCase().replace(/[\s.\-]+/g, ""); if (!/^[A-Z0-9]{6,12}$/.test(x) || !/\d{2}/.test(x) || /^\d{2}[A-Z]{3}\d{2}/.test(x)) return "";
  if (/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(x)) return ""; // è un codice fiscale
  if (/^\d{8}$/.test(x) && dataNorm(x.slice(0, 2) + "." + x.slice(2, 4) + "." + x.slice(4))) return ""; // è una data scritta senza punti
  return x;
}
var SEP = /[\s:;\/\-–—|.]/g;
function largo(t, opz) {
  var incerti = [], m = !!(opz && opz.largo), righe = t.split("\n").map(function (x) { return x.trim(); }).filter(Boolean), et = righe.map(trovaEtichette), H = { s: {}, a: {}, b: {}, k: {}, p: {} };
  function add(h, k, v) { v = String(v || "").replace(/^[\s:;\/\-–—|.]+/, "").replace(/[\s|;]+$/, ""); if (v) (H[h][k] = H[h][k] || []).push(v); }
  var pura = function (j) { return j >= 0 && j < righe.length && !et[j].length; };
  var sola = function (j) { // riga fatta solo di etichette (nessun valore)
    if (j < 0 || j >= righe.length || !et[j].length) return false; var r = righe[j], x = "", u = 0;
    et[j].forEach(function (e) { x += r.slice(u, e.i); u = e.f; }); x += r.slice(u); return !x.replace(SEP, "");
  };
  righe.forEach(function (r, i) {
    var L = et[i];
    L.forEach(function (e, j) {
      var fine = j + 1 < L.length ? L[j + 1].i : r.length, stessa = r.slice(e.f, fine);
      add("s", e.k, stessa);
      var nk = L.map(function (x) { return x.k; }).filter(function (k, x, ar) { return ar.indexOf(k) === x; }).length;
      if (j === L.length - 1 && nk === 1 && !stessa.replace(SEP, "")) {
        if (pura(i + 1)) add("a", e.k, righe[i + 1]); else if (et[i + 1] && et[i + 1].length && pura(i + 2)) add("a", e.k, righe[i + 2]);
        if (pura(i - 1)) add("b", e.k, righe[i - 1]); if (pura(i - 2)) add("b", e.k, righe[i - 2]);
      }
      var prima = r.slice(j ? L[j - 1].f : 0, e.i); if (!stessa.replace(SEP, "")) add("b", e.k, prima);
    });
  });
  for (var i = 0; i < righe.length; i++) { // etichette una sotto l'altra, poi i valori nello stesso ordine; oppure etichette su una riga e valori sulla successiva
    if (!sola(i)) continue;
    var j = i, ks = []; while (sola(j)) { et[j].forEach(function (e) { if (ks.indexOf(e.k) < 0) ks.push(e.k); }); j++; }
    var dk = et[i].map(function (e) { return e.k; }).filter(function (k, x, ar) { return ar.indexOf(k) === x; });
    if (dk.length >= 2 && pura(j)) { // «SESSO STATURA CITTADINANZA» (anche ripetute in inglese) e poi «M 180 ITA»
      var v = righe[j], parti = v.split(/\s{2,}|\s\/\s/).filter(Boolean);
      if (parti.length !== dk.length) parti = v.split(/\s+/).filter(Boolean);
      if (parti.length !== dk.length && dk.length === 2 && parti.length > 2) { parti = [parti[0], parti.slice(1).join(" ")]; incerti = dk.slice(); }
      if (parti.length === dk.length) dk.forEach(function (k, x) { add("p", k, parti[x]); });
      i = j; continue;
    }
    if (j - i >= 2) { for (var q = 0; q < j - i && pura(j + q); q++) add("k", et[i + q][0].k, righe[j + q]); i = j - 1; }
  }
  var OK = {
    cognome: function (v) { return nomeOk(v, m); }, nome: function (v) { return nomeOk(v, m); },
    nascita: function (v) { return dataOk(v, m); }, luogodata: function (v) { return dataOk(v, m); },
    sesso: function (v) { return sessoDa(v); },
    citt: function (v) { var x = String(v).trim(); return /^[A-Za-zÀ-ÿ .'\-]{3,30}$/.test(x) && !PAROLE_NO.test(sa(x).toLowerCase()) ? norm(x) : ""; },
    numero: numeroOk,
    luogo: function (v) { var x = String(v).trim(); return /^[A-Za-zÀ-ÿ' ,().\/\-]{2,50}$/.test(x) && !PAROLE_NO.test(sa(x).toLowerCase()) && !sessoDa(x) ? x : ""; }
  };
  var ORD = { A: ["s", "a", "k", "p", "b"], K: ["k", "s", "a", "p", "b"], P: ["p", "s", "a", "k", "b"], B: ["b", "s", "k", "p", "a"] };
  function esegui(ord) {
    var r = {}, usati = {}, sc = 0, strict = 0, mappa = { cognome: "cognome", nome: "nome", data_nascita: "nascita", sesso: "sesso", cittadinanza: "citt", numero_documento: "numero", luogo: "luogo" };
    Object.keys(mappa).forEach(function (f) {
      var k = mappa[f], ok = OK[k], tr = "";
      for (var q = 0; q < ord.length && !tr; q++) { var c = (H[ord[q]][k] || []).concat(f === "data_nascita" ? (H[ord[q]].luogodata || []) : []); for (var z = 0; z < c.length; z++) { var x = ok(c[z]); if (x && !usati[x]) { tr = x; if (q <= 1 && f !== "luogo") strict++; break; } } }
      if (tr) { r[f] = tr; if (f !== "sesso") usati[tr] = 1; if (f !== "luogo") sc++; }
    });
    r.punti = sc; r.coerenza = strict; return r;
  }
  var best = null, nomi = ["A", "K", "P", "B"];
  nomi.forEach(function (n) { var r = esegui(ORD[n]); if (!best || r.coerenza > best.coerenza || (r.coerenza === best.coerenza && r.punti > best.punti)) { best = r; best.config = n; } });
  best.incerti = incerti;
  return best;
}

/* lettura di un solo blocco di testo = un documento (o più, se non ci sono righe vuote tra l'uno e l'altro) */
function leggiBlocco(t) {
  var seg = dividi(t); if (seg.length > 1) return seg.reduce(function (a, x) { return a.concat(leggiBlocco(x)); }, []);
  var M = mrzTutte(t).map(function (r) { var m = daMRZ(r); m.fonti = ["mrz"]; return m; });
  var P = persone(t).map(function (p) { p.fonti = ["testo"]; return p; }), usati = {};
  M.forEach(function (m, mi) {
    var i = -1;
    P.forEach(function (p, j) { if (i < 0 && !usati[j] && !p.mrz && ((p.cognome && compatta(p.cognome) === compatta(m.cognome)) || (p.numero_documento && compatta(p.numero_documento) === compatta(m.numero_documento)))) i = j; });
    if (i < 0 && M.length === 1 && P.length === 1 && !P[0].mrz) i = 0;
    if (i < 0) { var libere = P.map(function (p, j) { return j; }).filter(function (j) { return !usati[j] && !P[j].mrz; }); if (M.length === P.length && libere.length === P.length - Object.keys(usati).length && libere[0] !== undefined && M.length - mi === libere.length) i = libere[0]; }
    if (i >= 0) {
      usati[i] = 1;
      var p = P[i], dif = confronta(p, m); p.differenze = dif; p.fonti = ["testo", "mrz"]; p.mrz = m.mrz;
      ["cognome", "nome", "sesso", "data_nascita", "numero_documento", "cittadinanza", "tipo_documento", "rilascio_stato"].forEach(function (k) { if (!p[k] && m[k]) p[k] = m[k]; });
      // se le due letture non coincidono vale la MRZ (ha le cifre di controllo) ma il campo resta da controllare
      dif.forEach(function (d) {
        var k = { "cognome": "cognome", "nome": "nome", "data di nascita": "data_nascita", "sesso": "sesso", "numero del documento": "numero_documento" }[d], c = m.mrz.controlli;
        if (k && (k !== "numero_documento" || c.numero) && (k !== "data_nascita" || c.nascita)) p[k] = m[k];
      });
      if (m.tipo_documento && p.tipo_documento !== m.tipo_documento && /^P/.test(m.mrz.tipo || "")) p.tipo_documento = m.tipo_documento;
    } else P.push(m);
  });
  // campi che le etichette non hanno dato: li cerca senza etichette e li segna sempre come da controllare
  var tn = ripara(t.replace(/\r/g, "").replace(/\t/g, "  ").replace(/[ \u00a0]{3,}/g, "  ").replace(/ *\n */g, "\n")), lg = largo(tn, OPZ), eu = euristica(t);
  function punteggio(p) { return ["cognome", "nome", "data_nascita", "sesso", "numero_documento", "cittadinanza"].filter(function (k) { return p[k] && (k === "cognome" || k === "nome" ? nomeOk(p[k], true) : k === "data_nascita" ? dataOk(p[k]) : k === "numero_documento" ? numeroOk(p[k]) || /^[A-Z]{2}\d{5}[A-Z]{2}$|^[A-Z]{2}\d{7}$/.test(p[k]) : k === "sesso" ? /^[MF]$/.test(p[k]) : /^[A-Za-zÀ-ÿ' .\-]{3,30}$/.test(p[k])); }).length; }
  if (P.length === 1) P.forEach(function (p) { // lettura larga: se è più coerente delle etichette semplici vince lei; altrimenti riempie solo i campi vuoti
    p.euristico = p.euristico || [];
    var vince = !p.mrz && lg.punti > punteggio(p);
    ["cognome", "nome"].forEach(function (k) { if (p[k] && !nomeOk(p[k], OPZ.largo)) p[k] = ""; });
    if (p.cittadinanza && !/^[A-Za-zÀ-ÿ' .\-]{3,30}$/.test(p.cittadinanza)) p.cittadinanza = "";
    if (p.sesso && !/^[MF]$/.test(p.sesso)) p.sesso = "";
    if (p.numero_documento && !numeroOk(p.numero_documento) && !/^[A-Z]{2}\d{5}[A-Z]{2}$|^[A-Z]{2}\d{7}$|^[A-Z]\d{7}[A-Z]$/.test(p.numero_documento)) p.numero_documento = "";
    ["cognome", "nome", "data_nascita", "sesso", "cittadinanza", "numero_documento"].forEach(function (k) {
      if (lg[k] && (!p[k] || (vince && p[k] !== lg[k] && !(k === "numero_documento" && p.numero_corretto)))) { p[k] = lg[k]; if (!(lg.coerenza >= 5 && (k === "sesso" || k === "cittadinanza" || k === "data_nascita"))) p.euristico.push(k); }
    });
    (lg.incerti || []).forEach(function (k) { if (p.euristico.indexOf(k) < 0) p.euristico.push(k); }); // nome e cognome sulla stessa riga: dove finisce l'uno e inizia l'altro non si sa
    if (!p.comune_nascita && !p.luogo_nascita && lg.luogo) { luogoDa(lg.luogo, p); p.euristico.push("comune_nascita"); }
  });
  if (P.length === 1 && !P[0].mrz) P.forEach(function (p) {
    p.euristico = p.euristico || [];
    [["data_nascita"], ["sesso"], ["numero_documento"]].forEach(function (c) { var k = c[0]; if (!p[k] && eu[k]) { p[k] = eu[k]; p.euristico.push(k); } });
    if (p.data_nascita && eu.nascita_pn && p.data_nascita !== eu.nascita_pn) (p.avvisi_extra = p.avvisi_extra || []).push("La data di nascita non coincide con il numero personale (" + eu.nascita_pn + ").");
  });
  return P;
}

/* separa i documenti: righe vuote tra l'uno e l'altro; le righe MRZ da sole stanno con il documento sopra */
function blocchi(t) {
  var ch = String(t || "").replace(/\r/g, "").split(/\n[ \t]*\n/).map(function (c) { return c.trim(); }).filter(Boolean), out = [];
  ch.forEach(function (c) {
    var mrz = MRZ ? mrzTutte(c).length > 0 : false, lab = persone(c).length > 0, prev = out[out.length - 1];
    if (prev && !lab && (!mrz || !prev.mrz)) {
      // righe MRZ da sole: stanno con il documento sopra solo se il cognome o il numero coincidono (altrimenti è un altro documento)
      var stesso = true;
      if (mrz && prev.lab) { var r = mrzTutte(c)[0], q = persone(prev.t)[0] || {}; stesso = !q.cognome || compatta(q.cognome) === compatta(r.cognome) || (q.numero_documento && compatta(q.numero_documento) === compatta(r.numero)); }
      if (stesso) { prev.t += "\n" + c; prev.mrz = prev.mrz || mrz; return; }
    }
    out.push({ t: c, mrz: mrz, lab: lab });
  });
  return out.map(function (b) { return b.t; });
}

/* due letture della stessa persona (stesso numero, o stesso cognome+nome+data) diventano una sola */
function raggruppa(P) {
  var out = [];
  P.forEach(function (p) {
    var e = out.filter(function (q) {
      return (p.numero_documento && q.numero_documento && compatta(p.numero_documento) === compatta(q.numero_documento)) ||
        (p.cognome && q.cognome && compatta(p.cognome) === compatta(q.cognome) && compatta(p.nome) === compatta(q.nome) && p.data_nascita && p.data_nascita === q.data_nascita);
    })[0];
    if (!e) return out.push(p);
    Object.keys(p).forEach(function (k) { if ((e[k] === undefined || e[k] === "" || e[k] === null) && p[k]) e[k] = p[k]; });
    e.fonti = (e.fonti || []).concat((p.fonti || []).filter(function (f) { return (e.fonti || []).indexOf(f) < 0; }));
    e.uniti = (e.uniti || 1) + 1;
  });
  return out;
}

/* Lettura completa. Ritorna { persone:[{...campi, fonti:["testo","mrz"], differenze:[], avvisi:[], dubbi:[]}], note } */
/* riprova da sola: se la prima lettura lascia buchi, rilegge con la lettura larga e tiene la migliore */
function riempiti(r) { var n = 0; r.persone.forEach(function (p) { ["cognome", "nome", "data_nascita", "sesso", "cittadinanza", "numero_documento"].forEach(function (k) { if (p[k]) n++; }); n += r.persone.length * 0.01; }); return n; }
function leggi(testo, opz) {
  var a = leggi1(testo, opz);
  if (opz && opz.largo) return a;
  var buchi = a.persone.some(function (p) { return !p.cognome || !p.nome || !p.data_nascita || !p.sesso || (!p.cittadinanza && !p.mrz); });
  if (!buchi && a.persone.length) return a;
  var b = leggi1(testo, { largo: true });
  if (b.persone.length === a.persone.length && riempiti(b) > riempiti(a)) { b.note = (b.note || []).concat(["Ho riprovato con la lettura più larga."]); return b; }
  return a;
}
function leggi1(testo, opz) {
  OPZ = opz || {};
  var t = String(testo || ""), out = { persone: [], note: [] };
  if (t.length > 40000) { out.note.push("Testo troppo lungo: incolla solo la parte dei documenti."); return out; }
  var P = [];
  blocchi(t).forEach(function (b) { P = P.concat(leggiBlocco(b)); });
  P = raggruppa(P);
  P.forEach(function (p) {
    p.dubbi = [].concat(p.differenze || []).map(function (d) { return { "data di nascita": "data_nascita", "numero del documento": "numero_documento" }[d] || d; });
    p.avvisi = (p.pulizia || []).slice(); if (p.numero_corretto) p.dubbi.push("numero_documento");
    if (p.mrz) {
      if (!p.mrz.controlli.numero) { p.dubbi.push("numero_documento"); p.avvisi.push("Le cifre di controllo del numero non tornano: ricontrolla il numero."); }
      if (!p.mrz.controlli.nascita) { p.dubbi.push("data_nascita"); p.avvisi.push("Le cifre di controllo della data di nascita non tornano."); }
    }
    if (p.differenze && p.differenze.length) p.avvisi.push("Il testo e le righe MRZ non coincidono su: " + p.differenze.join(", ") + ".");
    if (p.codice_fiscale) {
      var cc = cfControlla(p, p.codice_fiscale); p.avvisi = p.avvisi.concat(cc.av); p.dubbi = p.dubbi.concat(cc.dub);
      if (!p.sesso && cc.sesso) p.sesso = cc.sesso; // dal codice fiscale il sesso è certo
    }
    (p.euristico || []).forEach(function (k) { p.dubbi.push(k); p.avvisi.push("Ho trovato «" + ({ data_nascita: "data di nascita", sesso: "sesso", numero_documento: "numero del documento", cognome: "cognome", nome: "nome", cittadinanza: "cittadinanza", comune_nascita: "luogo di nascita" }[k]) + "» senza l'etichetta: controllalo sulla foto."); });
    (p.avvisi_extra || []).forEach(function (a) { p.avvisi.push(a); p.dubbi.push("data_nascita"); });
    if (p.incerto_prov) { p.dubbi.push("comune_nascita"); p.avvisi.push("Ho letto «" + p.comune_nascita + " " + p.provincia_nascita + "» come comune e provincia: controlla."); }
  });
  out.persone = P;
  if (!P.length) out.note.push("Non ho trovato né le righe MRZ (con <<<) né voci come Cognome, Nome, Data di nascita. Incolla più testo oppure compila a mano.");
  return out;
}

var api = { leggi1: leggi1, riempiti: riempiti, largo: largo, ripara: ripara, euristica: euristica, dividi: dividi, correggiNumero: correggiNumero, blocchi: blocchi, raggruppa: raggruppa, mrzTutte: mrzTutte, cfValido: cfValido, cfControlla: cfControlla, leggi: leggi, persone: persone, confronta: confronta, dataNorm: dataNorm, tipoDocDa: tipoDocDa, sessoDa: sessoDa };
if (typeof module !== "undefined" && module.exports) module.exports = api; else root.INC = api;
})(this);
