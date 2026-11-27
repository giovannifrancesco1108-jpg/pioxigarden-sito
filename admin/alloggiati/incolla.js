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
  ["nascita", "birth ?day|birthdate|date of birth|dob|born|datum narodenia|datum narozeni|data urodzenia|geboortedatum|data de nascimento|fodelsedato|dogum tarihi|data nasterii|data di nascita|date of birth|birth date|date de naissance|date de naiss|date naiss|fecha de nacimiento|geburtsdatum|nato il|nata il|born on|d\\.? ?o\\.? ?b\\.?|data nascita"],
  ["luogo", "birth ?place|pob|luogo di nascita|comune di nascita|place of birth|lieu de naissance|lieu de naiss|lugar de nacimiento|geburtsort|nato a|nata a|born in|luogo nascita"],
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

var PARTICELLE = /^(DI|DA|DE|DEL|DELLA|LA|LE|EL|AL|DU|DES|VAN|VON|DER|DEN|TEN|O|MC|MAC|ST|SAINT)$/i;
/* tolta la sporcizia che l'OCR mette ai lati di un valore («DUPONT % E ve» → «DUPONT»): simboli e pezzetti di 1-2 lettere minuscole */
function pulisciValore(r) {
  var tk = String(r || "").replace(/[_|=~*<>\\^"“”«»¦§]+/g, " ").split(/\s+/).filter(Boolean);
  var brutto = function (w) { return !/[A-Za-z0-9À-ÿ]/.test(w) || (/^[A-Za-zÀ-ÿ]{1,2}[.,;:]?$/.test(w) && (/^[a-zà-ÿ]/.test(w) || w.replace(/[.,;:]/g, "").length === 1) && !PARTICELLE.test(w.replace(/[.,;:]/g, ""))); };
  var solido = function (x) { return x !== undefined && /[A-Za-zÀ-ÿ]{3,}/.test(x); }; // si toglie solo se resta almeno una parola vera (così «li na» o «tu 7774037» restano interi)
  while (tk.length > 1 && brutto(tk[tk.length - 1]) && tk.slice(0, -1).some(solido)) tk.pop();
  while (tk.length > 1 && brutto(tk[0]) && tk.slice(1).some(solido)) tk.shift();
  return tk.join(" ").replace(/[\s|;]+$/, "").trim();
}
function valoreDi(t, da, a) {
  var seg = t.slice(da, a).replace(/^[\s:;\/\-–—|.]+/, "");
  var righe = seg.split(/\n/).map(function (r) { return r.trim(); }).filter(Boolean);
  for (var i = 0; i < Math.min(3, righe.length); i++) { // la prima riga con qualcosa di leggibile: una riga di soli simboli («eal _ = \\») non è il valore
    var v = pulisciValore(righe[i]);
    if (/^[a-zà-ÿ]{2,4}$/.test(v) && i + 1 < righe.length) continue; // una parolina minuscola da sola è rumore se sotto c'è altro
    if ((v.replace(/[^A-Za-z0-9À-ÿ]/g, "").length >= 3) || /^[MFmf]$/.test(v)) return v;
  }
  return pulisciValore(righe[0] || "");
}

function sessoDa(v) { var s = norm(v).split(" ")[0] || ""; if (/^(M|MASCHIO|MALE|MASC|H|HOMBRE|HOMME|MANN|MANNLICH)$/.test(s)) return "M"; if (/^(F|FEMMINA|FEMALE|FEM|W|MUJER|FEMME|FRAU|WEIBLICH)$/.test(s)) return "F"; return ""; }

function luogoDa(v, r) {
  var s = String(v || "").trim().replace(/[\s,]+\d[\d\s.\/\-]*$/, "").trim(); if (!s) return; // pezzi di data rimasti in coda («LENINGRADO SUN 31 01»)
  var usa = /^(.*?[A-Za-z]{2}.*?)[\s,]+(U\W?S\W?A\W?|U\W?K\W?|UNITED STATES|UNITED KINGDOM)$/i.exec(sa(s));
  if (usa) { r.luogo_nascita = norm(usa[1]); r.stato_nascita = /K/i.test(usa[2].replace(/UNITED STATES/i, "")) ? "GBR" : "USA"; return; } // «ILLINOIS, U.S:A», «LONDON, UK»
  var e3 = /^(.*?[A-Za-z]{2}.*?)[\s,]+([A-Z]{3})$/.exec(s); // «LENINGRADO SUN»: le parentesi perse dall'OCR, resta il codice del paese
  if (e3 && (MRZ && MRZ.PAESI && MRZ.PAESI[e3[2]] || /^(SUN|YUG|CSK|DDR)$/.test(e3[2])) && !/^(ROMA|NAPOLI)$/.test(e3[2])) { r.luogo_nascita = norm(e3[1]); r.stato_nascita = e3[2]; return; }
  var m = /^(.*?)[\s,]*[(\[{]\s*([A-Za-z0-9]{2})\s*[)\]}]\s*$/.exec(s);
  if (m && /^[A-Za-z]{2}$/.test(m[2].replace(/1/g, "I").replace(/0/g, "O").replace(/5/g, "S").replace(/8/g, "B"))) { // l'OCR legge «(SI)» come «{S1)»
    r.comune_nascita = norm(m[1]); r.provincia_nascita = m[2].replace(/1/g, "I").replace(/0/g, "O").replace(/5/g, "S").replace(/8/g, "B").toUpperCase(); return; }
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
var FRASI = ["date of birth", "birth date", "birthday", "place of birth", "birthplace", "country of birth", "date of issue", "issue date", "date of expiry", "expiry date", "date of expiration", "valid until", "given names", "given name", "first name", "first names", "forenames", "surname", "last name", "family name", "nationality", "citizenship", "gender", "authority", "issuing authority", "document no", "document number", "passport no", "passport number", "identity card no", "card number", "personal no", "personal number", "signature", "date de naissance", "date de naiss", "lieu de naissance", "nationalite", "prenoms", "date d expir", "date of expiry", "expiry date", "holder s signature", "date of issue", "place of issue"];
function sembraEtichetta(v) { // un valore che assomiglia a una frase d'etichetta («DATE DE fais», «Nationallty») è sporcizia, non un dato
  var k = sa(String(v || "")).toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim(); if (k.length < 5) return false;
  return FRASI.some(function (f) { return f.length >= 5 && Math.abs(k.length - f.length) <= 3 && dist(k, f) <= Math.max(1, Math.round(f.length * 0.3)); });
}
function dist(a, b) {
  var m = a.length, n = b.length, d = [], i, j;
  for (i = 0; i <= m; i++) { d[i] = [i]; }
  for (j = 1; j <= n; j++) d[0][j] = j;
  for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
var PRIMA_DELLO_SLASH = /\b(NOM|PRENOMS?|SEXE|SEX|SESSO|COGNOME|NOME|LIEU|NATIONALITE|NATIONALITA|CITTADINANZA|SURNAME|GIVEN NAMES?|DATE DE NAISS(?:ANCE)?|DATA DI NASCITA|LUOGO E DATA DI NASCITA)[Il1|!](?=\s+[A-Za-z])/g;
function ripara(t) {
  return t.split("\n").map(function (riga) {
    if (riga.length > 70) return riga;
    riga = riga.replace(/([A-Za-zÀ-ÿ])[-_]([A-Za-zÀ-ÿ])/g, function (m0, x, y, off, str) { return /DATE.DE|NAISS|BIRTH/i.test(str.slice(Math.max(0, off - 6), off + 8)) ? x + " " + y : m0; }); // «DATE-DE NAISS»
    riga = riga.replace(PRIMA_DELLO_SLASH, "$1 /");
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
    ["cognome", "nome"].forEach(function (k) { // il riempitivo della MRZ «<<<<» l'OCR lo legge «cccc» o «eeee»: via
      if (p[k]) { p[k] = p[k].split(/\s+/).filter(function (w) { return !/^[CEGKLSIO<]{6,}$/.test(w); }).join(" "); }
      if (p[k] && !nomeOk(p[k], OPZ.largo)) p[k] = ""; });
    if (p.cittadinanza && !/^[A-Za-zÀ-ÿ' .\-]{3,30}$/.test(p.cittadinanza)) p.cittadinanza = "";
    if (p.sesso && !/^[MF]$/.test(p.sesso)) p.sesso = "";
    if (p.numero_documento && !numeroOk(p.numero_documento) && !/^[A-Z]{2}\d{5}[A-Z]{2}$|^[A-Z]{2}\d{7}$|^[A-Z]\d{7}[A-Z]$/.test(p.numero_documento)) p.numero_documento = "";
    ["cognome", "nome", "data_nascita", "sesso", "cittadinanza", "numero_documento"].forEach(function (k) {
      if (lg[k] && (!p[k] || (vince && p[k] !== lg[k] && !(k === "numero_documento" && p.numero_corretto)))) { p[k] = lg[k]; if (!(lg.coerenza >= 5 && (k === "sesso" || k === "cittadinanza" || k === "data_nascita"))) p.euristico.push(k); }
    });
    (lg.incerti || []).forEach(function (k) { if (p.euristico.indexOf(k) < 0) p.euristico.push(k); }); // nome e cognome sulla stessa riga: dove finisce l'uno e inizia l'altro non si sa
    if (!p.comune_nascita && !p.luogo_nascita && lg.luogo) { luogoDa(lg.luogo, p); p.euristico.push("comune_nascita"); }
    ["cognome", "nome", "cittadinanza", "sesso", "numero_documento"].forEach(function (k) { if (p[k] && (trovaEtichette(String(p[k])).length || sembraEtichetta(p[k])) && !p.mrz) p[k] = ""; }); // un'etichetta («DATE DE NAISS») non è un valore
    if (!p.cittadinanza && p.tipo_documento === "IDENT" && /REPUBBLICA\s+ITALIANA/i.test(t) && /MINISTERO|CARTA\s+D/i.test(t) && !p.stato_nascita) { p.cittadinanza = "ITA"; p.euristico.push("cittadinanza"); } // carta italiana con la riga della cittadinanza illeggibile: quasi sempre ITA, ma lo segna da controllare
    if (p.tipo_documento === "PATEN" && !p.mrz) { p.sesso = ""; if (!/CITTADINAN|NATIONALITY/i.test(t)) p.cittadinanza = ""; } // la patente non riporta sesso né cittadinanza
  });
  if (P.length === 1 && !P[0].mrz && P[0].tipo_documento !== "PATEN") P.forEach(function (p) {
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
  opz = opz || {};
  var fine = function (x) { // il ragionatore per ultimo: riempie i buchi e spiega
    if (opz.senzaRagiona) return x;
    var tt = String(testo || ""), piu = x.persone.length <= 1 ? ragionaTutti(tt, opz) : null;
    if (piu && (discorsivoDi(tt) || !x.persone.length || !x.persone[0].cognome)) {
      x.persone = piu.map(function (r) { return conRagiona([], r.testo, opz)[0]; }).filter(Boolean);
      x.note = (x.note || []).concat(["Nel messaggio ci sono " + x.persone.length + " persone: le ho lette una per riga."]);
      return x;
    }
    x.persone = conRagiona(x.persone, tt, opz); return x;
  };
  var o1 = {}; Object.keys(opz).forEach(function (k) { o1[k] = opz[k]; }); o1.senzaRagiona = true;
  var a = leggi1(testo, o1);
  if (opz.largo) return fine(a);
  var buchi = a.persone.some(function (p) { return !p.cognome || !p.nome || !p.data_nascita || !p.sesso || (!p.cittadinanza && !p.mrz); });
  if (!buchi && a.persone.length) return fine(a);
  var b = leggi1(testo, { largo: true, senzaRagiona: true });
  if (b.persone.length === a.persone.length && riempiti(b) > riempiti(a)) { b.note = (b.note || []).concat(["Ho riprovato con la lettura più larga."]); return fine(b); }
  return fine(a);
}
function leggi1(testo, opz) {
  OPZ = opz || {};
  var t = String(testo || ""), out = { persone: [], note: [] };
  if (t.length > 40000) { out.note.push("Testo troppo lungo: incolla solo la parte dei documenti."); return out; }
  var P = [];
  blocchi(t).forEach(function (b) { P = P.concat(leggiBlocco(b)); });
  P = raggruppa(P);
  // «persone» fatte solo di un'etichetta ripetuta dal copia-incolla (un cognome o un nome e nient'altro): non sono un secondo ospite
  if (P.length > 1) { var nuc = function (p) { return ["cognome", "nome", "data_nascita", "numero_documento", "sesso", "cittadinanza"].filter(function (k) { return p[k] && !eEtichetta(p[k]); }).length; };
    var forti = P.filter(function (p) { return nuc(p) >= 3 || p.mrz; }); if (forti.length === 1) P = forti;
    else if (!forti.length) { // pezzi della stessa persona spezzati dal copia-incolla: se non si contraddicono, è uno solo
      var K = ["cognome", "nome", "data_nascita", "numero_documento", "sesso", "cittadinanza"], uno = {}, lite = false;
      P.forEach(function (p) { K.forEach(function (k) { var v = p[k] && !eEtichetta(p[k]) ? p[k] : ""; if (!v) return; if (uno[k] && uno[k] !== v) lite = true; else uno[k] = v; }); });
      if (!lite) { var base = P[0]; P.slice(1).forEach(function (p) { Object.keys(p).forEach(function (k) { if (!base[k] || (eEtichetta(base[k]) && typeof base[k] === "string")) base[k] = p[k]; }); }); P = [base]; } } }
  if (P.length <= 1 && !OPZ.senzaAncore) { // lettura ad ancore: completa e corregge ciò che le etichette esatte non hanno dato
    var an = ancore(t), q = P[0], nucleoA = ["cognome", "nome", "data_nascita", "sesso", "citt", "numero"].filter(function (k) { return an[k]; }).length;
    if (!q && nucleoA >= 3) { q = { pulizia: [], euristico: [] }; P.push(q); }
    if (q) uniscianc(q, an);
  }
  var italiano_ = /R?EPUBBLICA\s+ITALIAN|MINISTERO\s+DELL|CARTA\s+D.?\s*IDENTIT/i.test(sa(t));
  P.forEach(function (p) {
    if (italiano_ && p.numero_documento && !p.mrz) { var nc = String(p.numero_documento).toUpperCase().replace(/[^A-Z0-9]/g, ""), fx = "";
      if (nc.length === 9) fx = fixCie(nc);
      else if (nc.length === 10) for (var z = 2; z < 10 && !fx; z++) fx = fixCie(nc.slice(0, z) + nc.slice(z + 1)) && /^C[A-Z]/.test(nc) ? fixCie(nc.slice(0, z) + nc.slice(z + 1)) : ""; // un carattere in più letto dall'OCR
      if (fx && fx !== nc) { p.numero_documento = fx; (p.euristico = p.euristico || []).push("numero_documento"); } }
    if (p.cittadinanza && !/^[A-Z]{3}$/.test(p.cittadinanza)) { var cc = codicePaese(p.cittadinanza); if (cc) p.cittadinanza = cc; }
    ["cognome", "nome", "comune_nascita", "luogo_nascita", "rilascio_comune"].forEach(function (k) { if (!p[k] || p.mrz && (k === "cognome" || k === "nome")) return; var pw = String(p[k]).split(/\s+/), bu = pw.filter(function (w) { return !frammentoEtichetta(w); }); if (bu.length < pw.length) p[k] = bu.join(" "); });
    ["comune_nascita", "luogo_nascita", "rilascio_comune"].forEach(function (k) { // «F», «27 ME», «LIEW DE NAISSANCE», «APL AWCIPALITY» non sono luoghi
      if (!p[k]) return; var lv = String(p[k]).trim().replace(/^(?:[A-Z]{1,2}\s+)+(?=[A-Z]{3,})/, function (m0) { return /^(LA|LE|LO|IL|EL|AL|SAN|ST|DE|DI|DEL)\s/.test(m0) ? m0 : ""; });
      var paro = lv.split(/\s+/), brutte = paro.filter(function (w) { return w.length <= 2 && !PARTICELLE.test(w) && !/^(LA|LE|LO|IL|EL|AL|SAN|ST|DE|DI|DEL|SUL|SUR|AM|AN|IN|AU|AUX)$/.test(w); }).length;
      if (lv.replace(/[^A-Za-z]/g, "").length < 2 || /^[MF]$/i.test(lv) || /^\d/.test(lv) || paro.some(parolaEtichetta) || /PALITY|CIPAL|MUNI[CG]|NAISS|BIRTH|NASCIT/i.test(lv) || (paro.length >= 3 && brutte >= 2)) { p[k] = ""; if (k === "comune_nascita") p.provincia_nascita = ""; }
      else p[k] = lv;
    });
    if (p.data_nascita) { var an2 = +p.data_nascita.slice(-4); if (an2 < 1900 || an2 > new Date().getFullYear()) { p.data_nascita = ""; } } // «ITALIANA», «BRITISH CITIZEN», «EIREANNACH/IRISH» → codice
    if (p.rilascio_testo && !p.rilascio_comune && !p.rilascio_stato) { var rt = norm(p.rilascio_testo); if (/^[A-Z]{3}$/.test(rt) && MRZ && MRZ.PAESI && MRZ.PAESI[rt]) p.rilascio_stato = MRZ.PAESI[rt]; else if (/\bMIT\b|\bUCO\b|MOTORIZZAZIONE/.test(rt)) p.rilascio_comune = "ROMA"; }
    if (!p.rilascio_comune && !p.rilascio_stato && p.tipo_documento === "PASOR" && /^[A-Z]{3}$/.test(p.cittadinanza || "") && p.cittadinanza !== "ITA" && MRZ && MRZ.PAESI && MRZ.PAESI[p.cittadinanza]) { p.rilascio_stato = MRZ.PAESI[p.cittadinanza]; (p.euristico = p.euristico || []).push("rilascio"); } // il passaporto lo rilascia il paese di cui si è cittadini: da controllare
  });
  if (!OPZ.senzaRagiona) P = conRagiona(P, t, OPZ);
  P.forEach(function (p) { if (p.tipo_documento === "PATEN" && p.rilascio_testo && !p.rilascio_comune) { var mc = /\b(?:U?MC|M\.?C\.?)\s*[-–]?\s*([A-Z]{2})\b/.exec(norm(p.rilascio_testo)); if (mc && CAPOLUOGO[mc[1]]) p.rilascio_comune = CAPOLUOGO[mc[1]]; } });
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


/* quanto è credibile un valore letto: un numero di carta italiana col formato giusto pesa più di uno storpiato */
function validita(k, v, p) {
  var x = String(v || "").toUpperCase();
  if (k === "numero_documento") { if (/^C[A-Z]\d{5}[A-Z]{2}$/.test(x)) return 3; if (numeroOk(x)) return 1; return 0.2; }
  if (k === "cognome" || k === "nome") { if (!nomeOk(x)) return 0.1; if (/^[A-Z]{3}$/.test(x) && MRZ && MRZ.PAESI && MRZ.PAESI[x]) return 0.2; return x.replace(/[^A-Z]/g, "").length >= 3 ? 1 : 0.4; }
  if (k === "data_nascita") { var an_ = +String(x).slice(-4); return dataNorm(x) && an_ >= 1900 && an_ <= new Date().getFullYear() ? 1 : 0; }
  if (k === "comune_nascita") return x.replace(/[^A-Z]/g, "").length >= 3 && !/\d/.test(x) ? (p && p.provincia_nascita ? 1.5 : 1) : 0.2;
  if (k === "rilascio_comune") return x.replace(/[^A-Z]/g, "").length >= 3 && !/\d/.test(x) ? 1 : 0.1;
  return 1;
}
function simili(k, a, b) {
  if (a === b) return true;
  if (!/^(cognome|nome|comune_nascita|luogo_nascita|rilascio_comune|numero_documento)$/.test(k)) return false;
  var x = a.replace(/[^A-Z0-9 ]/g, ""), y = b.replace(/[^A-Z0-9 ]/g, "");
  if ((k === "nome" || k === "cognome") && Math.min(x.length, y.length) >= 4 && (x.indexOf(y) === 0 || y.indexOf(x) === 0)) return true; // uno è l'altro troncato o con una coda
  var lim = Math.max(1, Math.round(Math.max(x.length, y.length) * 0.2));
  return Math.abs(x.length - y.length) <= lim && dist(x, y) <= lim;
}

/* Più letture della stessa foto (immagine intera, a fasce, canali di colore diversi, ruotata…): ogni lettura sbaglia in un punto diverso.
   Raggruppa le persone che sono la stessa (stesso cognome, data o numero) e per ogni campo vince il valore che compare più volte,
   pesato su quanto è completa la lettura da cui viene. I campi su cui le letture non sono d'accordo restano "da controllare". */
var CAMPI_U = ["cognome", "nome", "sesso", "data_nascita", "comune_nascita", "provincia_nascita", "luogo_nascita", "stato_nascita", "cittadinanza", "numero_documento", "tipo_documento", "codice_fiscale", "rilascio_comune", "rilascio_stato"];
function unisci(testi, opz) {
  var cand = [];
  (testi || []).forEach(function (t, i) {
    var r; try { r = leggi(t, opz); } catch (e) { return; }
    r.persone.forEach(function (p) { var n = CAMPI_U.filter(function (k) { return p[k]; }).length; if (n >= 2) cand.push({ p: p, n: n, i: i }); });
  });
  cand.sort(function (a, b) { return b.n - a.n; });
  var lev = function (x, y) { var d = [], i, j; for (i = 0; i <= x.length; i++) d[i] = [i]; for (j = 1; j <= y.length; j++) d[0][j] = j;
    for (i = 1; i <= x.length; i++) for (j = 1; j <= y.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1)); return d[x.length][y.length]; };
  var uguali = function (a, b) { // stessa persona: stessa data di nascita, stesso numero, o cognome uguale a meno di un paio di lettere sbagliate dall'OCR
    if (a.data_nascita && b.data_nascita) return a.data_nascita === b.data_nascita;
    if (a.numero_documento && b.numero_documento && a.numero_documento === b.numero_documento) return true;
    if (a.cognome && b.cognome) { var x = norm(a.cognome), y = norm(b.cognome); return x === y || (Math.min(x.length, y.length) >= 5 && lev(x, y) <= 2); }
    return false;
  };
  var gruppi = [];
  cand.forEach(function (c) { var g = gruppi.filter(function (x) { return uguali(x[0].p, c.p); })[0]; if (g) g.push(c); else gruppi.push([c]); });
  // un gruppo piccolo con lo stesso cognome di uno grande è quasi sempre la stessa persona con la data letta male
  for (var gi = gruppi.length - 1; gi > 0; gi--) {
    var piccolo = gruppi[gi]; if (piccolo.length >= 3) continue;
    for (var gj = 0; gj < gi; gj++) { var gr = gruppi[gj], a1 = gr[0].p, b1 = piccolo[0].p;
      if (gr.length > piccolo.length && a1.cognome && b1.cognome && (norm(a1.cognome) === norm(b1.cognome) || (Math.min(a1.cognome.length, b1.cognome.length) >= 5 && lev(norm(a1.cognome), norm(b1.cognome)) <= 2))) { gruppi[gj] = gr.concat(piccolo); gruppi.splice(gi, 1); break; } }
  }
  var nucleo = function (p) { return ["cognome", "nome", "data_nascita", "sesso", "cittadinanza", "numero_documento"].filter(function (k) { return p[k]; }).length; };
  var out = [], note = [];
  var M = gruppi.length ? gruppi[0][0].n : 0;
  gruppi.filter(function (g) { return g[0].n >= Math.max(4, M - 2) && (g.length >= 2 || g[0].n >= 5 || gruppi.length === 1); }).forEach(function (g) {
    var base = JSON.parse(JSON.stringify(g[0].p)), voti, dis = [];
    CAMPI_U.forEach(function (k) {
      voti = {}; g.forEach(function (c) { var v = c.p[k]; if (v) { var kk = String(v).toUpperCase(); voti[kk] = voti[kk] || { v: v, w: 0, c: 0 }; voti[kk].w += c.n * c.n * validita(k, v, c.p); voti[kk].c++; } });
      // valori quasi uguali (una lettera storpiata, un nome troncato) votano insieme
      var vk = Object.keys(voti), gr = [];
      vk.forEach(function (a) { var x = gr.filter(function (G) { return simili(k, G[0], a); })[0]; if (x) x.push(a); else gr.push([a]); });
      gr = gr.map(function (G) { var w = 0, c = 0; G.forEach(function (a) { w += voti[a].w; c += voti[a].c; }); var rap = G.slice().sort(function (a, b) { return (voti[b].w - voti[a].w) || (b.length - a.length); })[0];
        if (k === "nome" || k === "cognome") { // «GIAN MARC» → «GIAN MARCO»: si allunga solo completando l'ultima parola, mai aggiungendone (in coda di solito c'è rumore)
          var completa = G.filter(function (b) { return b !== rap && b.indexOf(rap) === 0 && b.split(" ").length === rap.split(" ").length && voti[b].c >= 1; }).sort(function (a, b) { return voti[b].w - voti[a].w; })[0];
          if (completa && rap.split(" ").pop().length >= 3) rap = completa;
          var corto = G.filter(function (b) { return b !== rap && rap.indexOf(b + " ") === 0; }).sort(function (a, b) { return voti[b].w - voti[a].w; })[0];
          if (corto && voti[corto].w >= voti[rap].w * 0.5) rap = corto; } // «ROSSI HF WEY» contro «ROSSI»: vince quello senza la coda
        if (k === "numero_documento") { var buono = G.filter(function (a) { return /^C[A-Z]\d{5}[A-Z]{2}$/.test(a); }).sort(function (a, b) { return voti[b].w - voti[a].w; })[0]; if (buono) rap = buono; } // tra numeri simili vince quello col formato giusto
        return { rap: rap, w: w, c: c }; }).sort(function (a, b) { return b.w - a.w; });
      if (!gr.length || gr[0].w <= 0) return;
      var ks = gr.map(function (x) { return x.rap; }); voti = {}; gr.forEach(function (x) { voti[x.rap] = { v: x.rap, w: x.w, c: x.c }; });
      base[k] = voti[ks[0]].v;
      if (ks.length > 1 && voti[ks[0]].w < 2.5 * voti[ks[1]].w) dis.push(k); // letture in disaccordo
      else if (ks.length === 1 && voti[ks[0]].c >= 2 && base.dubbi) base.dubbi = base.dubbi.filter(function (d) { return d !== k || /^(numero_documento|data_nascita)$/.test(k) && base.mrz; }); // più letture indipendenti concordi
    });
    base.dubbi = (base.dubbi || []).slice(); base.avvisi = (base.avvisi || []).slice();
    dis.forEach(function (k) { if (base.dubbi.indexOf(k) < 0) base.dubbi.push(k); base.avvisi.push("Le letture della foto non sono d'accordo su «" + k.replace(/_/g, " ") + "»: controllalo."); });
    base.lette = g.length; if (base.mrz || nucleo(base) >= 3) out.push(base); // meno di tre campi veri: è rumore, non una persona
  });
  if (out.length) note.push("Unite " + cand.length + " letture della stessa foto.");
  return { persone: out, note: note };
}

/* ===================== LETTURA AD ANCORE =====================
   Come ragiona una persona davanti a un documento fotografato male:
   1) trova l'etichetta di ogni campo anche se l'OCR l'ha storpiata («SUBNAME», «NASOTR», «SéSSO», «COOTTADINANZA»);
   2) prende il primo valore vicino che ha la FORMA giusta per quel campo (una data, M/F, un codice di paese, un nome),
      saltando righe spazzatura e altre etichette; se sotto non c'è, guarda subito sopra (impaginazioni col valore sopra);
   3) se un'etichetta manca del tutto, riconosce i valori dalla forma: «MELFI (PZ) 03.11.1968» è luogo e data di nascita,
      «CA57204KD» è il numero di una carta italiana, «M 170 ITA» è sesso-statura-cittadinanza;
   4) dall'intestazione capisce il paese del documento («REPUBBLICA ITALIANA», «UNITED KINGDOM», «REINO DE ESPAÑA»…).
   Restituisce anche, per ogni campo, da dove viene il valore («ancora» o «forma»): quelli trovati solo per forma vanno controllati. */
var VOC = {
  luogodata: ["LUOGO E DATA DI NASCITA", "PLACE AND DATE OF BIRTH", "LIEU ET DATE DE NAISSANCE", "LUGAR Y FECHA DE NACIMIENTO", "GEBURTSORT UND DATUM", "LOCAL E DATA DE NASCIMENTO"],
  cognome: ["COGNOME", "SURNAME", "LAST NAME", "FAMILY NAME", "NOM DE FAMILLE", "APELLIDOS", "APELLIDO", "NACHNAME", "FAMILIENNAME", "PRIEZVISKO", "PRIJMENI", "NAZWISKO", "ACHTERNAAM", "EFTERNAMN", "ETTERNAVN", "EFTERNAVN", "SOYADI", "APELIDOS", "APELIDO", "SOBRENOME", "NUME", "NOM", "SLOINNE", "EPONYMO", "PRIIMEK", "PREZIME", "VEZETEKNEV", "PAVARDE", "UZVARDS", "PEREKONNANIMI", "SUKUNIMI", "COGNOMI"],
  nome: ["NOME", "NAME", "GIVEN NAMES", "GIVEN NAME", "FORENAMES", "FORENAME", "FIRST NAMES", "FIRST NAME", "PRENOMS", "PRENOM", "NOMBRE", "NOMBRES", "VORNAMEN", "VORNAME", "MENO", "JMENO", "IMIONA", "IMIE", "VOORNAMEN", "FORNAMN", "FORNAVN", "PRENUME", "ADI", "TUSAINM", "ONOMA", "IME", "UTONEV", "VARDAS", "VARDS", "EESNIMED", "ETUNIMET", "OTHER NAMES", "CHRISTIAN NAMES", "PRENOMI"],
  nascita: ["DATA DI NASCITA", "DATE OF BIRTH", "BIRTH DATE", "DATE DE NAISSANCE", "DATE DE NAISS", "FECHA DE NACIMIENTO", "FECHA NACIMIENTO", "NACIMIENTO", "GEBURTSDATUM", "DATUM NARODENIA", "DATUM NAROZENI", "DATA URODZENIA", "GEBOORTEDATUM", "DATA DE NASCIMENTO", "FODELSEDATUM", "FODSELSDATO", "DOGUM TARIHI", "DATA NASTERII", "DATA BREITHE", "DATUM ROJSTVA", "DATUM RODENJA", "SZULETESI IDO", "SYNTYMAAIKA", "DATE NAISS", "DOB", "BIRTHDAY", "NATO IL", "NATA IL"],
  luogo: ["LUOGO DI NASCITA", "PLACE OF BIRTH", "BIRTHPLACE", "BIRTH PLACE", "LIEU DE NAISSANCE", "LIEU DE NAISS", "LUGAR DE NACIMIENTO", "GEBURTSORT", "MIESTO NARODENIA", "MISTO NAROZENI", "MIEJSCE URODZENIA", "GEBOORTEPLAATS", "LOCAL DE NASCIMENTO", "FODELSEORT", "FODESTED", "DOGUM YERI", "LOCUL NASTERII", "AIT BHREITHE", "KRAJ ROJSTVA", "MJESTO RODENJA", "SZULETESI HELY", "SYNTYMAPAIKKA", "COMUNE DI NASCITA", "NATO A", "NATA A"],
  sesso: ["SESSO", "SEX", "SEXE", "SEXO", "GESCHLECHT", "GENDER", "POHLAVIE", "POHLAVI", "PLEC", "GESLACHT", "KON", "KJONN", "KOEN", "CINSIYET", "GNEAS", "FYLO", "SPOL", "NEM", "SUKUPUOLI"],
  citt: ["CITTADINANZA", "NATIONALITY", "NATIONALITE", "NACIONALIDAD", "STAATSANGEHORIGKEIT", "STATNA PRISLUSNOST", "STATNI PRISLUSNOST", "OBYWATELSTWO", "NATIONALITEIT", "NACIONALIDADE", "NATIONALITET", "UYRUGU", "CETATENIE", "NAISIUNTACHT", "CITIZENSHIP", "NAZIONALITA", "ITHAGENEIA", "DRZAVLJANSTVO", "ALLAMPOLGARSAG", "PILIETYBE", "PILSONIBA", "KODAKONSUS", "KANSALAISUUS", "CITTADINANZA ITALIANA"],
  numero: ["DOCUMENT NO", "DOCUMENT NUMBER", "PASSPORT NO", "PASSPORT NUMBER", "PASSEPORT NO", "CARD NO", "CARD NUMBER", "ID NO", "ID NUMBER", "NO DU DOCUMENT", "N DU DOCUMENT", "NUMERO DU DOCUMENT", "NUMERO DOCUMENTO", "NUMERO DEL DOCUMENTO", "NUM SOPORTE", "NUMERO DE SOPORTE", "NUMERO DE DOCUMENTO", "DOKUMENTNUMMER", "AUSWEISNUMMER", "PASSNUMMER", "PASS NR", "PAS UIMHIR", "NUMER DOKUMENTU", "CISLO DOKLADU", "CISLO PASU", "DOCUMENTNUMMER", "NUMERO PASSAPORTO", "PASSAPORTO N", "NUMERO CARTA"],
  rilascio: ["COMUNE DI", "MUNICIPALITY", "AUTHORITY", "AUTORITE", "ISSUING AUTHORITY", "PLACE OF ISSUE", "LIEU DE DELIVRANCE", "EXPEDIDO EN", "AUTORIDAD", "AUSSTELLENDE BEHORDE", "BEHORDE", "UDARAS", "RILASCIATA DA", "RILASCIATO DA", "RILASCIATA DAL", "ISSUED BY", "ISSUED AT", "EMESSA DA", "EMESSO DA", "VYDAL", "VYDAVAJUCI ORGAN", "ORGAN WYDAJACY", "LUOGO DI RILASCIO", "COMUNE DI RILASCIO"],
  ignoradata: ["EMISSIONE", "ISSUING", "DATE OF ISSUE", "ISSUE DATE", "DATE DE DELIVRANCE", "FECHA DE EXPEDICION", "EMISION", "EXPEDICION", "AUSSTELLUNGSDATUM", "DATUM VYDANIA", "DATA WYDANIA", "SCADENZA", "EXPIRY", "DATE OF EXPIRY", "EXPIRY DATE", "DATE D EXPIRATION", "DATE D EXPIR", "DATE OF EXPIRATION", "VALIDEZ", "VALIDITE", "GULTIG BIS", "PLATNOST DO", "WAZNY DO", "GELDIG TOT", "VALIDADE", "TERMIN WAZNOSCI", "VALABILITATE", "GILTIG T O M", "VRIJEDI DO", "FECHA DE CADUCIDAD", "DATE OF EXPIRATION"],
  ignora: ["COGNOME E NOME DEL PADRE E DELLA MADRE", "FATHER AND MOTHER S TUTOR S NAME", "DEL PADRE E DELLA MADRE", "INDIRIZZO DI RESIDENZA", "STATURA", "HEIGHT", "TAILLE", "ALTURA", "GROSSE", "KORPERGROSSE", "FIRMA DEL TITOLARE", "HOLDERS SIGNATURE", "HOLDER S SIGNATURE", "SIGNATURE", "SIGNATURE DU TITULAIRE", "FIRMA", "UNTERSCHRIFT", "TYPE", "CODE", "CODICE FISCALE", "FISCAL CODE", "RESIDENZA", "RESIDENCE", "INDIRIZZO DI RESIDENZA", "ESTREMI ATTO DI NASCITA", "PERSONAL NO", "PERSONAL NUMBER", "NATIONAL ID", "TIPO", "KOD", "COLORE DEGLI OCCHI", "AUGENFARBE", "EYES", "DATA BREITHE"],
  testata: ["REPUBBLICA ITALIANA", "MINISTERO DELL INTERNO", "CARTA DI IDENTITA", "IDENTITY CARD", "PASSAPORTO", "PASSPORT", "PASSEPORT", "PATENTE DI GUIDA", "DRIVING LICENCE", "UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND", "REPUBLIQUE FRANCAISE", "CARTE NATIONALE D IDENTITE", "REINO DE ESPANA", "DOCUMENTO NACIONAL DE IDENTIDAD", "BUNDESREPUBLIK DEUTSCHLAND", "PERSONALAUSWEIS", "REISEPASS", "IDENTITEITSKAART", "PASAPORTE", "THIS PAGE IS RESERVED FOR OFFICIAL OBSERVATIONS", "EUROPEAN UNION", "UNIONE EUROPEA"]
};
var ANC = []; // [{k, t:[token…], n:lettere}]
Object.keys(VOC).forEach(function (k) { VOC[k].forEach(function (f) { var t = f.split(" "); ANC.push({ k: k, t: t, n: t.join("").length }); }); });
ANC.sort(function (a, b) { return b.n - a.n; }); // le frasi più lunghe prima (LUOGO E DATA DI NASCITA prima di DATA DI NASCITA)

function tokRiga(r) { // token con posizione nel testo originale
  var s = sa(r).toUpperCase(), out = [], re = /[A-Z0-9]+/g, m;
  while ((m = re.exec(s))) out.push({ w: m[0], i: m.index, f: m.index + m[0].length });
  return out;
}
function tokUguale(a, b) { // a = token dell'etichetta, b = token letto
  if (a === b) return true;
  if (a.length <= 4) return false; // etichette corte (NOME, NAME, NUME, IMIE, SEX): solo uguali, sennò «MIE» diventa «IMIE»
  var lim = a.length <= 6 ? 1 : a.length <= 9 ? 2 : 3;
  if (Math.abs(a.length - b.length) > lim) return false;
  var b2 = b.replace(/0/g, "O").replace(/1/g, "I").replace(/5/g, "S").replace(/8/g, "B");
  return dist(a, b2) <= lim;
}
/* etichette in una riga: [{k, da, a (indici token), i, f (caratteri)}], le più lunghe vincono */
function ancoreRiga(tk) {
  var usati = [], out = [];
  [0, 1].forEach(function (giro) { // prima le etichette lette giuste per intero, poi quelle con una parola storpiata («DATE OF BIRTH» non deve diventare «DATE OF ISSUE»)
  ANC.forEach(function (an) {
    var n = an.t.length;
    for (var j = 0; j + n <= tk.length; j++) {
      var ok = 0, x;
      for (x = 0; x < n; x++) { if (usati[j + x]) break; if (tokUguale(an.t[x], tk[j + x].w)) ok++; }
      if (x < n) continue;
      var serve = giro === 1 && n >= 3 ? n - 1 : n; // nelle frasi lunghe una parola può essere illeggibile
      if (ok < serve) continue;
      if (n >= 3 && (!tokUguale(an.t[0], tk[j].w) && !tokUguale(an.t[n - 1], tk[j + n - 1].w))) continue;
      for (x = 0; x < n; x++) usati[j + x] = true;
      out.push({ k: an.k, da: j, a: j + n, i: tk[j].i, f: tk[j + n - 1].f });
    }
  });
  });
  // frase lunga troncata dall'OCR all'inizio: «(OGO E DATA Di NASOTR» → «… DATA DI NASCITA» dentro «LUOGO E DATA DI NASCITA»
  out.sort(function (a, b) { return a.i - b.i; });
  return out;
}
function riga_spazzatura(r) {
  var s = sa(r).trim(); if (!s) return true;
  var lettere = (s.match(/[A-Za-z]/g) || []).length, cifre = (s.match(/[0-9]/g) || []).length;
  if (lettere + cifre < 2) return true;
  if (/^\d{1,2}[:.]\d{2}\b/.test(s) && lettere < 3) return true; // ora dello screenshot «02:12»
  if (!cifre && !/[A-Z]/.test(s)) return true; // «eco», «leri», «ae»: solo minuscole sparse
  if (!cifre && lettere <= 2) return true;
  return false;
}
var NAZ = { ITALIANA: "ITA", ITALIANO: "ITA", ITALIAN: "ITA", BRITISH: "GBR", IRISH: "IRL", EIREANNACH: "IRL", FRANCAISE: "FRA", FRANCAIS: "FRA", FRENCH: "FRA", ESPANOLA: "ESP", ESPANOL: "ESP", SPANISH: "ESP", DEUTSCH: "DEU", GERMAN: "DEU", OSTERREICH: "AUT", AUSTRIAN: "AUT", SUISSE: "CHE", SWISS: "CHE", BELGE: "BEL", BELGIAN: "BEL", NEDERLANDSE: "NLD", DUTCH: "NLD", PORTUGUESA: "PRT", PORTUGUESE: "PRT", POLSKIE: "POL", POLISH: "POL", ROMANA: "ROU", ROMANIAN: "ROU", AMERICAN: "USA", CANADIAN: "CAN", AUSTRALIAN: "AUS", SLOVENSKA: "SVK", SLOVAK: "SVK", CESKA: "CZE", CZECH: "CZE", HELLENIC: "GRC", GREEK: "GRC", SVENSK: "SWE", SWEDISH: "SWE", DANSK: "DNK", DANISH: "DNK", NORSK: "NOR", NORWEGIAN: "NOR", SUOMI: "FIN", FINNISH: "FIN", MAGYAR: "HUN", HUNGARIAN: "HUN", HRVATSKO: "HRV", CROATIAN: "HRV", UKRAINIAN: "UKR", RUSSIAN: "RUS", ALBANIAN: "ALB", BRAZILIAN: "BRA", BRASILEIRA: "BRA", ARGENTINA: "ARG", MEXICANA: "MEX", CHINESE: "CHN", JAPANESE: "JPN", INDIAN: "IND", MOROCCAN: "MAR", TURKISH: "TUR", ISRAELI: "ISR" };
var TESTATE = [[/R?EPUBBLICA\s+ITALIAN|MINISTERO\s+DELL.?\s*INTERNO|PATENTE\s+DI\s+GUIDA|CARTA\s+D.?\s*IDENTIT|COMUNE\s+DI\s*\/?\s*MUNICIP/, "ITA"], [/UNITED\s+KINGDOM|GREAT\s+BRITAIN|NORTHERN\s+IRELAND/, "GBR"], [/\bEIRE\b|\bIRELAND\b|IRLANDE/, "IRL"], [/REPUBLIQUE\s+FRAN|CARTE\s+NATIONALE\s+D/, "FRA"], [/REINO\s+DE\s+ESPA|DOCUMENTO\s+NACIONAL\s+DE\s+IDENTIDAD/, "ESP"], [/REPUBLIK\s+OSTERREICH/, "AUT"], [/BUNDESREPUBLIK\s+DEUTSCHLAND/, "DEU"], [/SCHWEIZ|CONFEDERATION\s+SUISSE|SVIZZERA/, "CHE"], [/KONINKRIJK\s+DER\s+NEDERLANDEN|NEDERLAND/, "NLD"], [/BELGIQUE|BELGIE|KINGDOM\s+OF\s+BELGIUM/, "BEL"], [/REPUBLICA\s+PORTUGUESA/, "PRT"], [/RZECZPOSPOLITA\s+POLSKA/, "POL"], [/ROMANIA/, "ROU"], [/SLOVENSKA\s+REPUBLIKA/, "SVK"], [/CESKA\s+REPUBLIKA/, "CZE"], [/UNITED\s+STATES\s+OF\s+AMERICA/, "USA"], [/CANADA/, "CAN"], [/AUSTRALIA/, "AUS"], [/HELLENIC\s+REPUBLIC|ELLINIKI/, "GRC"], [/SVERIGE|SWEDEN/, "SWE"], [/DANMARK|DENMARK/, "DNK"], [/NORGE|NORWAY/, "NOR"], [/SUOMI|FINLAND/, "FIN"], [/MAGYARORSZAG|HUNGARY/, "HUN"], [/REPUBLIKA\s+HRVATSKA/, "HRV"], [/UKRAINE|UKRAINA/, "UKR"], [/REPUBLICA\s+FEDERATIVA\s+DO\s+BRASIL/, "BRA"]];
function paeseDoc(t) { var s = sa(t).toUpperCase(); for (var i = 0; i < TESTATE.length; i++) if (TESTATE[i][0].test(s)) return TESTATE[i][1]; return ""; }
function codicePaese(v) { // «ITA», «BRITISH CITIZEN», «EIREANNACH/IRISH», «FRA» → codice a 3 lettere
  var s = sa(v).toUpperCase().replace(/[^A-Z ]+/g, " ").trim(); if (!s) return "";
  var w = s.split(/\s+/);
  for (var i = 0; i < w.length; i++) { var x = w[i].replace(/0/g, "O"); if (x.length === 3 && MRZ && MRZ.PAESI && MRZ.PAESI[x]) return x; }
  for (i = 0; i < w.length; i++) if (NAZ[w[i]]) return NAZ[w[i]];
  for (i = 0; i < w.length; i++) for (var n in NAZ) if (w[i].length >= 5 && dist(w[i], n) <= 1) return NAZ[n];
  return "";
}
function nomeAncora(v) { // valore che sembra un nome: lettere (anche minuscole Alain,Jean-Claude), niente cifre, niente etichette
  var x = sa(pulisciValore(v)).replace(/\s*,\s*/g, " ").replace(/[«»"“”`´’]/g, "'").trim();
  x = x.split(/\s+/).filter(function (w) { return !/^[CEGKLSIO<]{6,}$/i.test(w); }).join(" "); // riempitivo MRZ letto «cccc»
  var tw = x.split(/\s+/); while (tw.length > 1 && /^[A-Za-z]{1,2}$/.test(tw[tw.length - 1]) && !PARTICELLE.test(tw[tw.length - 1]) && tw.slice(0, -1).some(function (w) { return w.length >= 3; })) tw.pop(); x = tw.join(" "); // «ROSSI FF», «MARIO Z»
  if (!x || /\d/.test(x)) return "";
  if (!/^[A-Za-z' .\-]{2,45}$/.test(x)) return "";
  var lett = (x.match(/[A-Za-z]/g) || []).length, maiu = (x.match(/[A-Z]/g) || []).length;
  if (lett < 2) return "";
  if (maiu / lett < 0.5 && !/^([A-Z][a-z'\-]*[A-Za-z'\-]*[ \-]?)+$/.test(x.replace(/\s+/g, " "))) return ""; // «leri», «eco»: rumore minuscolo
  var pw = x.split(/\s+/), buone = pw.filter(function (w) { return !frammentoEtichetta(w); }); if (!buone.length) return ""; if (buone.length < pw.length) x = buone.join(" ");
  var tk = tokRiga(x); if (ancoreRiga(tk).length) return ""; // è un'etichetta
  if (tk.some(function (w) { return /^(REPUBLIC|REPUBBLICA|REPUBLIQUE|REPUBLICA|REPUBLIK|BUNDESREPUBLIK|KINGDOM|REGNO|REINO|ROYAUME|KONINKRIJK|CARD|CARTA|CARTE|TARJETA|KARTE|PASSPORT|PASSAPORTO|PASSEPORT|PASAPORTE|REISEPASS|PERMIT|LICENCE|LICENSE|PATENTE|MINISTERO|MINISTRY|DOCUMENT|DOCUMENTO|IDENTITY|IDENTITA|IDENTITE|IDENTIDAD|NATIONAL|NAZIONALE|NACIONAL|UNION|EUROPEA|EUROPEAN|STATE|STATES|ESTADO|MUNICIPALITY|COMUNE)$/.test(w.w); })) return ""; // intestazioni del documento
  if (sembraEtichetta(x)) return "";
  if (/\b(PADRE|MADRE|FATHER|MOTHER|TUTOR|RESIDENZA|RESIDENCE|INDIRIZZO)\b/i.test(x)) return ""; // retro della carta: non è il titolare
  return norm(x).replace(/\s+/g, " ");
}
var PAROLE_ET = []; Object.keys(VOC).forEach(function (k) { VOC[k].forEach(function (f) { f.split(" ").forEach(function (w) { if (w.length >= 5 && PAROLE_ET.indexOf(w) < 0) PAROLE_ET.push(w); }); }); });
["COMUNE", "MUNICIPALITY", "IDENTITA", "IDENTITY", "MINISTERO", "INTERNO", "REPUBBLICA", "ITALIANA", "TITOLARE", "SIGNATURE"].forEach(function (w) { if (PAROLE_ET.indexOf(w) < 0) PAROLE_ET.push(w); });
var PAROLE_CAMPO = []; Object.keys(VOC).forEach(function (k) { if (k === "testata" || k === "ignora" || k === "ignoradata") return; VOC[k].forEach(function (f) { f.split(" ").forEach(function (w) { if (w.length >= 3 && !/^(DELLA|DELLE|DEGLI|DEL|DES|DER|DEN|VAN|VON|THE|AND|NAT[OA])$/.test(w) && PAROLE_CAMPO.indexOf(w) < 0) PAROLE_CAMPO.push(w); }); }); });
["MUNICIPALITY", "IDENTITY", "SIGNATURE", "PASSEPORT", "PASAPORTE", "SOPORTE"].forEach(function (w) { PAROLE_CAMPO.push(w); });
/* pezzo di un'etichetta spezzata dal copia-incolla («SUR», «MUNICIPAL», «KORTNUMMER», «NAISSARC»): non è un dato */
function frammentoEtichetta(w) {
  w = sa(w).toUpperCase().replace(/[^A-Z]/g, ""); if (w.length < 3) return false;
  return PAROLE_CAMPO.some(function (e) { return e === w || (e.length > w.length && (e.indexOf(w) === 0 || e.slice(-w.length) === w) && w.length >= Math.min(4, e.length - 1)) ; });
}
function parolaEtichetta(w) { w = sa(w).toUpperCase().replace(/[^A-Z0-9]/g, ""); if (w.length < 5) return false; return PAROLE_ET.some(function (e) { return tokUguale(e, w); }); }
function luogoAncora(v) { var x = pulisciValore(v).replace(/[0-9]{1,2}[./\-][0-9]{1,2}[./\-][0-9]{2,4}.*$/, "").trim(); if (!x || !/[A-Za-z]{2}/.test(x) || /\d{2}/.test(x.replace(/[(\[{][^)\]}]*[)\]}]/g, ""))) return "";
  if (x.split(/\s+/).some(parolaEtichetta) || /\b(COMUNE|CONUNE|COMUN|MUNICIP)/i.test(sa(x))) return ""; /* «COMUNE O1», «MOROCPALITY»: etichetta storpiata, non un luogo */ if (ancoreRiga(tokRiga(x)).length) return ""; return x; }
function numeroAncora(v) {
  var c = pulisciValore(v).toUpperCase().split(/\s+/).filter(function (w) { return !dataNorm(w); }).map(function (w) { return w.replace(/[^A-Z0-9]/g, ""); }).filter(function (w) { return w.length >= 6 && w.length <= 12 && /\d/.test(w); });
  for (var i = 0; i < c.length; i++) { var n = c[i]; if (numeroOk(n) || /^[A-Z]{2}\d{5}[A-Z]{2}$/.test(n)) return n; }
  return "";
}
var LUOGODATA = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' .\-]{1,40}?)\s*[(\[{]\s*([A-Za-z0-9]{2,3})\s*[)\]}]\s*,?\s*(\d{1,2}\s*[.\/\-]\s*\d{1,2}\s*[.\/\-]\s*\d{2,4})/;
var NUM_CIE = /\b(C[A-Z0-9][0-9OIlSBZ]{5}[A-Z0-9]{2})\b/;
function fixCie(x) { // CA57204KD: 2 lettere, 5 cifre, 2 lettere — l'OCR scambia O/0, I/1, S/5, Z/2, B/8, G/6
  var a = x.toUpperCase(), L = { 0: "O", 1: "I", 5: "S", 2: "Z", 8: "B", 6: "G", 4: "A", 7: "T" }, D = { O: "0", Q: "0", D: "0", I: "1", L: "1", S: "5", Z: "2", B: "8", G: "6", A: "4", T: "7" };
  var r = a.slice(0, 2).replace(/[0-9]/g, function (c) { return L[c] || c; }) + a.slice(2, 7).replace(/[A-Z]/g, function (c) { return D[c] || c; }) + a.slice(7, 9).replace(/[0-9]/g, function (c) { return L[c] || c; });
  return /^C[A-Z]\d{5}[A-Z]{2}$/.test(r) ? r : "";
}
var SIGLE_PROV = "AG:AGRIGENTO,AL:ALESSANDRIA,AN:ANCONA,AO:AOSTA,AP:ASCOLI PICENO,AQ:L'AQUILA,AR:AREZZO,AT:ASTI,AV:AVELLINO,BA:BARI,BG:BERGAMO,BI:BIELLA,BL:BELLUNO,BN:BENEVENTO,BO:BOLOGNA,BR:BRINDISI,BS:BRESCIA,BT:BARLETTA,BZ:BOLZANO,CA:CAGLIARI,CB:CAMPOBASSO,CE:CASERTA,CH:CHIETI,CL:CALTANISSETTA,CN:CUNEO,CO:COMO,CR:CREMONA,CS:COSENZA,CT:CATANIA,CZ:CATANZARO,EN:ENNA,FC:FORLI,FE:FERRARA,FG:FOGGIA,FI:FIRENZE,FM:FERMO,FR:FROSINONE,GE:GENOVA,GO:GORIZIA,GR:GROSSETO,IM:IMPERIA,IS:ISERNIA,KR:CROTONE,LC:LECCO,LE:LECCE,LI:LIVORNO,LO:LODI,LT:LATINA,LU:LUCCA,MB:MONZA,MC:MACERATA,ME:MESSINA,MI:MILANO,MN:MANTOVA,MO:MODENA,MS:MASSA,MT:MATERA,NA:NAPOLI,NO:NOVARA,NU:NUORO,OR:ORISTANO,PA:PALERMO,PC:PIACENZA,PD:PADOVA,PE:PESCARA,PG:PERUGIA,PI:PISA,PN:PORDENONE,PO:PRATO,PR:PARMA,PT:PISTOIA,PU:PESARO,PV:PAVIA,PZ:POTENZA,RA:RAVENNA,RC:REGGIO DI CALABRIA,RE:REGGIO NELL'EMILIA,RG:RAGUSA,RI:RIETI,RM:ROMA,RN:RIMINI,RO:ROVIGO,SA:SALERNO,SI:SIENA,SO:SONDRIO,SP:LA SPEZIA,SR:SIRACUSA,SS:SASSARI,SU:CARBONIA,SV:SAVONA,TA:TARANTO,TE:TERAMO,TN:TRENTO,TO:TORINO,TP:TRAPANI,TR:TERNI,TS:TRIESTE,TV:TREVISO,UD:UDINE,VA:VARESE,VB:VERBANIA,VC:VERCELLI,VE:VENEZIA,VI:VICENZA,VR:VERONA,VT:VITERBO,VV:VIBO VALENTIA";
var CAPOLUOGO = {}; SIGLE_PROV.split(",").forEach(function (x) { var p = x.split(":"); CAPOLUOGO[p[0]] = p[1]; });
function provinciaOCR(s) { var p = String(s || "").toUpperCase().replace(/1/g, "I").replace(/0/g, "O").replace(/5/g, "S").replace(/8/g, "B").replace(/2/g, "Z").replace(/6/g, "G"); return p; }

function ancore(testo) {
  var righe = String(testo || "").replace(/\r/g, "").split("\n").map(function (r) { return r.replace(/\s+/g, " ").trim(); }).filter(function (r) { return r.length; });
  var R = righe.map(function (r) { var tk = tokRiga(r); return { r: r, tk: tk, an: ancoreRiga(tk), spaz: riga_spazzatura(r) }; });
  var out, usate;
  // resto di una riga tolte le etichette (e i numerini «(1)» dei passaporti)
  function resto(x) {
    var s = x.r, sa_ = sa(s), pezzi = [], u = 0;
    x.an.forEach(function (a) { pezzi.push(s.slice(u, a.i)); u = a.f; });
    var coda = s.slice(u), mc = /^\s*\/\s*([A-Za-z]{2,})\.?\s*$/.exec(coda); // «COGNOME / SUR»: la seconda lingua mozzata dal copia-incolla
    if (mc && PAROLE_CAMPO.some(function (e) { return e.indexOf(sa(mc[1]).toUpperCase()) === 0; })) coda = "";
    pezzi.push(coda);
    return pezzi.join(" ").replace(/\(\s*\d{1,2}\s*\)/g, " ").replace(/[\/|:;]+/g, " ").replace(/\s+/g, " ").trim();
  }
  R.forEach(function (x) { x.resto = x.an.length ? resto(x) : x.r; x.solo = x.an.length > 0 && (x.resto.replace(/[^A-Za-z0-9]/g, "").length < 2 || riga_spazzatura(x.resto)); });
  var tipoDi = { cognome: "nome", nome: "nome", nascita: "data", luogo: "luogo", luogodata: "luogodata", sesso: "sesso", citt: "citt", numero: "numero", rilascio: "luogo", ignora: "qualsiasi", ignoradata: "data", testata: "niente" };
  function prova(k, v) { // il valore va bene per il campo k? → valore pulito o ""
    var t = tipoDi[k];
    if (t === "nome") return nomeAncora(v);
    if (t === "data") return dataNorm(v);
    if (t === "luogodata") { var d = dataNorm(v); return d ? v : ""; }
    if (t === "luogo") return dataNorm(v) && !/[A-Za-z]{3}/.test(v.replace(/\d{1,2}\s*[A-Za-z]{3,5}\s*\d{2,4}/, "")) ? "" : luogoAncora(v);
    if (t === "sesso") { var s1 = pulisciValore(v).split(/\s+/)[0] || ""; return /^[MFmf]$/.test(s1) || /^(MASCHIO|FEMMINA|MALE|FEMALE|HOMME|FEMME|MUJER|HOMBRE|MANNLICH|WEIBLICH)$/i.test(sa(s1)) ? sessoDa(s1) : ""; }
    if (t === "citt") return codicePaese(v);
    if (t === "numero") return numeroAncora(v);
    if (t === "qualsiasi") return pulisciValore(v).replace(/[^A-Za-z0-9]/g, "").length >= 1 ? v : "";
    return "";
  }
  function metti(k, v, i, come) {
    if (!v) return false;
    if (k === "luogodata") { var d = dataNorm(v); if (d && !out.data_nascita) { out.data_nascita = d; out.da.data_nascita = come; } var l = v.replace(/\d{1,2}\s*[./\-]\s*\d{1,2}\s*[./\-]\s*\d{2,4}.*$/, "").trim(); if (l && !out.luogo) { out.luogo = l; out.da.luogo = come; } }
    else if (k === "nascita") { if (!out.data_nascita) { out.data_nascita = v; out.da.data_nascita = come; } }
    else if (k === "ignora" || k === "ignoradata" || k === "testata") { }
    else if (!out[k]) { out[k] = v; out.da[k] = come; }
    else return false;
    if (i != null) usate[i] = true; return true;
  }
  // 1) etichetta → valore (stessa riga, poi sotto, poi sopra — o il contrario: si provano tutte e due le impaginazioni)
  function passo(dir) { out = { da: {} }; usate = {}; var vicini = 0;
  R.forEach(function (x, i) {
    var chiavi = x.an.map(function (a) { return a.k; }).filter(function (k, j, ar) { return ar.indexOf(k) === j && k !== "testata"; });
    if (!chiavi.length) return;
    if (!x.solo && chiavi.length === 1) { var v0 = prova(chiavi[0], x.resto); if (v0 && metti(chiavi[0], v0, null, "ancora")) return; }
    // riga con più etichette («SESSO STATURA CITTADINANZA», «Sex/Sexe (5) Place of birth (6)»): il valore sotto si divide per tipo
    var cerca = function (dir, max, salta) {
      for (var j = i + dir, n = 0, giri = 0; j >= 0 && j < R.length && n < max && giri < 14; j += dir, giri++) {
        var y = R[j]; if (y.spaz || usate[j] || (salta && salta.indexOf(j) >= 0)) continue;
        if (!y.solo) n++;
        if (y.solo) { if (dir > 0 && y.an.some(function (a) { return a.k === chiavi[0]; })) continue; if (dir > 0) continue; else break; } // l'altra lingua della stessa etichetta, o un'altra etichetta
        return j;
      }
      return -1;
    };
    var assegna = function (j) {
      var v = R[j].an.length ? R[j].resto : R[j].r;
      if (chiavi.length === 1) {
        var vv = prova(chiavi[0], v);
        if (vv && chiavi[0] === "cognome" && /APELLIDOS|APELIDOS|SOBRENOME/i.test(sa(x.r)) && j + 1 < R.length) { // nome su due righe («APELLIDOS» / «MORENO» / «DIAZ» / «NOMBRE»)
          var z1 = R[j + 1], z2 = R[j + 2];
          if (z1 && !z1.spaz && !z1.an.length && !usate[j + 1] && nomeAncora(z1.r) && /^[A-Z' \-]+$/.test(sa(z1.r).trim()) && (!z2 || z2.solo)) { vv = vv + " " + nomeAncora(z1.r); usate[j + 1] = true; }
        }
        if (vv && metti(chiavi[0], vv, j, "ancora")) return true; return false;
      }
      if (chiavi.indexOf("cognome") >= 0 && chiavi.indexOf("nome") >= 0) return false; // «Surname Given names» / «VAN DER BERG ANDREI»: dove finisce il cognome non si sa
      // riga con più valori («F ATHENS», «M 180 ITA», «07 NOV /NOV 17 HMPO», «M FRA 12 05 1970»): prima le date, poi i pezzi con forma certa, il resto al luogo
      var lin = String(v).replace(/[|_~«»%=\\]+/g, " ").replace(/\s+/g, " ").trim(), fatto = false;
      var reD = /(^|\s)(\d{1,2}[ .\/\-]+(?:\d{1,2}|[A-Za-z]{3,5})(?:\s*\/\s*[A-Za-z]{3,5})?[ .\/\-]+\d{2,4})(?=\s|$)/g, md, date = [];
      while ((md = reD.exec(lin))) if (dataNorm(md[2])) date.push(dataNorm(md[2]));
      var resto_ = lin.replace(reD, " ").split(/\s+/).filter(Boolean), presi = [];
      var chiaviData = chiavi.filter(function (k) { return k === "nascita" || k === "ignoradata" || k === "luogodata"; });
      chiaviData.forEach(function (k, z) { if (date[z] && k !== "ignoradata" && metti("nascita", date[z], null, "ancora")) fatto = true; });
      var prendi = function (test) { for (var q = 0; q < resto_.length; q++) if (!presi[q] && test(resto_[q])) { presi[q] = true; return resto_[q]; } return ""; };
      chiavi.forEach(function (k) {
        var x;
        if (k === "sesso") { x = prendi(function (w) { return /^[MFmf]$/.test(w); }); if (x && metti("sesso", x.toUpperCase(), null, "ancora")) fatto = true; }
        else if (k === "ignora") prendi(function (w) { return /^\d{2,3}$/.test(w); });
        else if (k === "citt") { x = prendi(function (w) { return !!codicePaese(w) && !/^[MF]$/.test(w); }); if (x && metti("citt", codicePaese(x), null, "ancora")) fatto = true; }
        else if (k === "numero") { x = prendi(function (w) { return !!numeroAncora(w); }); if (x && metti("numero", numeroAncora(x), null, "ancora")) fatto = true; }
      });
      chiavi.forEach(function (k) {
        if (k !== "luogo" && k !== "rilascio") return;
        var parole = resto_.filter(function (w, q) { if (presi[q]) return false; return /[A-Za-z]{2}/.test(w) && !/^\d+$/.test(w); });
        var val = luogoAncora(parole.join(" "));
        if (val && metti(k, val, null, "ancora")) { fatto = true; resto_.forEach(function (w, q) { if (parole.indexOf(w) >= 0) presi[q] = true; }); }
      });
      if (fatto) usate[j] = true; return fatto;
    };
    var provati = [], j; // il primo valore con la forma giusta tra i prossimi (il copia-incolla può metterci in mezzo un numero o un'altra colonna)
    for (var tent = 0; tent < 3; tent++) { j = cerca(dir, 3, provati); if (j < 0) break; if (assegna(j)) { vicini += Math.abs(j - i) <= 2 ? 3 : 2; return; } provati.push(j); }
    j = cerca(dir, 5, provati); if (j >= 0 && assegna(j)) { vicini += 2; return; }
    j = cerca(-dir, 2); if (j >= 0 && assegna(j)) vicini += 1; // trovato solo nell'altra direzione: conta meno
  });
  return vicini; }
  var pAvanti = passo(1), oAvanti = out, pIndietro = passo(-1), oIndietro = out;
  out = pIndietro > pAvanti ? oIndietro : oAvanti; // a parità: valore sotto l'etichetta (il caso più comune)

  // carta cartacea: «nato il 01.02.1980» … «a CATANIA (CT)»
  if (!out.luogo) { var nc = /(?:^|\n)\s*(?:nat[oa]\s+)?a\s+([A-Za-z][A-Za-z' .\-]{1,40}?)\s*[(\[{]\s*([A-Za-z0-9]{2})\s*[)\]}]/.exec(sa(righe.join("\n"))); if (nc) { out.luogo = nc[1].trim() + " (" + nc[2] + ")"; out.da.luogo = "ancora"; } }
  // 2) riconoscimento per forma, dove le etichette non bastano
  var tutto = righe.join("\n");
  if (!out.data_nascita || !out.luogo) {
    var ld = LUOGODATA.exec(sa(tutto));
    if (ld) { var dd = dataNorm(ld[3].replace(/\s+/g, "")); if (dd && !out.data_nascita) { out.data_nascita = dd; out.da.data_nascita = "forma"; } if (!out.luogo) { out.luogo = ld[1].trim() + " (" + ld[2] + ")"; out.da.luogo = "forma"; } }
  }
  var pd = paeseDoc(tutto); if (pd) out.paese_doc = pd;
  // carta d'identità italiana con le etichette illeggibili: l'ordine è fisso (comune di rilascio, cognome, nome, «CITTÀ (PR) data»)
  if (pd === "ITA" && /IDENTIT/i.test(sa(tutto)) && (!out.cognome || !out.nome)) {
    var iLd = -1; for (var q0 = 0; q0 < R.length; q0++) if (LUOGODATA.test(sa(R[q0].r))) { iLd = q0; break; }
    if (iLd > 0) {
      var prima = []; for (var q1 = iLd - 1; q1 >= 0 && prima.length < 3; q1--) { var y = R[q1]; if (y.spaz || y.an.length) { if (y.an.some(function (a) { return a.k === "testata"; })) break; continue; } var nn = nomeAncora(y.r); if (!nn) { if (/\d/.test(y.r)) break; continue; } prima.unshift({ v: nn, i: q1 }); }
      if (prima.length >= 2) {
        var cg = prima[prima.length - 2].v, nm = prima[prima.length - 1].v;
        if (!out.cognome && !out.nome) { out.cognome = cg; out.da.cognome = "forma"; out.nome = nm; out.da.nome = "forma"; }
        if (prima.length === 3 && !out.rilascio) { out.rilascio = prima[0].v; out.da.rilascio = "forma"; }
      }
    }
  }
  if (pd === "ITA" && !/PATENTE/i.test(sa(tutto))) { var mm, reC = new RegExp(NUM_CIE.source, "g"), su = sa(tutto).toUpperCase().replace(/(C[A-Z0-9])\s+(?=[0-9OIlSBZ]{3})/g, "$1"); // a volte il copia-incolla spezza il numero
    while ((mm = reC.exec(su))) { var fc = fixCie(mm[1]); if (fc) { out.cie = fc; break; } }
    if (out.cie && !out.numero) { out.numero = out.cie; out.da.numero = "forma"; } }
  if (out.numero && pd === "ITA" && /^C[A-Z0-9]/.test(out.numero) && out.numero.length === 9 && fixCie(out.numero)) out.numero = fixCie(out.numero);
  if (!out.sesso || !out.citt) { var msc = /(?:^|\n)\s*([MF])\s+(\d{3})\s+([A-Z]{3})\s*(?:\n|$)/.exec(tutto); if (msc) { if (!out.sesso) { out.sesso = msc[1]; out.da.sesso = "forma"; } if (!out.citt && codicePaese(msc[3])) { out.citt = codicePaese(msc[3]); out.da.citt = "forma"; } } }
  if (!out.citt) { var cw = /\b(BRITISH CITIZEN|IRISH|EIREANNACH|FRANCAISE|ESPANOLA|DEUTSCH|ITALIANA)\b/.exec(sa(tutto).toUpperCase()); if (cw) { out.citt = codicePaese(cw[1]); out.da.citt = "forma"; } }
  // luogo: «POTENZA (PZ)» comune italiano; «PARIGI (FRA)» stato estero
  if (out.luogo) { var tmp = {}; var lg = out.luogo.replace(/[(\[{]\s*([A-Za-z0-9]{2})\s*[)\]}]/, function (m0, p) { return "(" + provinciaOCR(p) + ")"; }); luogoDa(lg, tmp); out.luogo_p = tmp; }
  if (out.rilascio) { var rl = norm(out.rilascio); var mc = /^(?:MC|UMC|M C)\s*[- ]?\s*([A-Z]{2})$/.exec(rl); if (mc && CAPOLUOGO[mc[1]]) out.rilascio_comune = CAPOLUOGO[mc[1]]; else if (/\bMIT\b|\bUCO\b|MOTORIZZAZIONE|MINISTERO/.test(rl)) out.rilascio_comune = "ROMA"; else if (pd === "ITA") out.rilascio_comune = rl; }
  if (pd && pd !== "ITA") out.rilascio_stato_doc = pd;
  return out;
}

function N_(x) { return String(x || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
/* un valore che in realtà è un'etichetta o un suo pezzo («SUR», «FODELSEDATUM», «KORTNUMMER», «S SURN») */
function eEtichetta(v) {
  var w = sa(String(v || "")).toUpperCase().replace(/[^A-Z ]/g, " ").trim().split(/\s+/).filter(Boolean); if (!w.length) return false;
  if (ancoreRiga(tokRiga(w.join(" "))).length) return true;
  return w.every(function (x) { return frammentoEtichetta(x) || (x.length >= 3 && PAROLE_CAMPO.some(function (e) { return e.length > x.length && e.indexOf(x) === 0; })); });
}
function uniscianc(q, an) {
  q.euristico = q.euristico || [];
  if (!q.mrz) ["cognome", "nome", "cittadinanza", "comune_nascita", "luogo_nascita", "rilascio_comune"].forEach(function (k) { if (q[k] && eEtichetta(q[k])) { q[k] = ""; if (k === "comune_nascita") q.provincia_nascita = ""; } });
  var mappa = [["cognome", "cognome"], ["nome", "nome"], ["data_nascita", "data_nascita"], ["sesso", "sesso"], ["citt", "cittadinanza"], ["numero", "numero_documento"]];
  mappa.forEach(function (m) {
    var v = an[m[0]], k = m[1], come = an.da[m[0]]; if (!v) return;
    if (q.tipo_documento === "PATEN" && (k === "sesso" || k === "cittadinanza")) return; // la patente non li riporta
    if (q.mrz && q[k]) return; // la MRZ con le cifre di controllo vince
    if (k === "data_nascita" && q[k] && q[k] !== v) { // due date diverse per la nascita: quella di nascita è sempre la più vecchia (le altre sono emissione e scadenza)
      var ord = function (d) { var m = /^(\d\d)\/(\d\d)\/(\d{4})$/.exec(d); return m ? m[3] + m[2] + m[1] : "9"; };
      if (ord(v) < ord(q[k])) { q[k] = v; if (q.euristico.indexOf(k) < 0) q.euristico.push(k); } return; }
    var eur = q.euristico.indexOf(k) >= 0;
    if (!q[k]) { q[k] = v; if (come !== "ancora") q.euristico.push(k); }
    else if (k === "numero_documento" && come === "ancora" && q[k] !== v && N_(q[k]).indexOf(N_(v)) >= 0 && N_(v).length >= 6) q[k] = v; // «GBR540001974» → «540001974»
    else if ((k === "cognome" || k === "nome") && come === "ancora" && v.indexOf(q[k] + " ") === 0) q[k] = v; // cognome su due righe («SANCHEZ» / «PEREZ»)
    else if (eur && come === "ancora" && q[k] !== v) { q[k] = v; q.euristico = q.euristico.filter(function (x) { return x !== k; }); }
  });
  var debole = function (v) { v = String(v || "").trim(); return !v || /[a-z]{4}/.test(v) && !/[A-Z]{3}/.test(v) || /NAISS|BIRTH|NASCIT|PLACE|LIEU|LUGAR|GEBURT/i.test(v) || v.split(/\s+/).some(parolaEtichetta); };
  if (an.luogo_p && debole(q.comune_nascita) && debole(q.luogo_nascita) && !q.stato_nascita) { q.comune_nascita = ""; q.luogo_nascita = ""; q.provincia_nascita = ""; Object.keys(an.luogo_p).forEach(function (k) { q[k] = an.luogo_p[k]; }); if (an.da.luogo !== "ancora") q.euristico.push("comune_nascita"); }
  if (an.rilascio_comune && !q.rilascio_comune && !q.rilascio_stato) q.rilascio_comune = an.rilascio_comune;
  if (an.rilascio_stato_doc && !q.rilascio_stato && !q.rilascio_comune && MRZ && MRZ.PAESI && MRZ.PAESI[an.rilascio_stato_doc]) q.rilascio_stato = MRZ.PAESI[an.rilascio_stato_doc];
  // carta d'identità elettronica italiana: il numero è SEMPRE «C» + lettera + 5 cifre + 2 lettere (CA12345AB, le più nuove CB…): se c'è nel testo vince su ogni altro numero
  if (an.paese_doc === "ITA" && !q.mrz && an.cie && q.numero_documento !== an.cie && !(q.tipo_documento === "PATEN")) { if (q.numero_documento && !/^C[A-Z]\d{5}[A-Z]{2}$/.test(q.numero_documento)) q.euristico.push("numero_documento"); q.numero_documento = an.cie; }
  if (an.paese_doc === "ITA" && /^C[A-Z]\d{5}[A-Z]{2}$/.test(q.numero_documento || "") && (!q.tipo_documento || q.tipo_documento === "IDENT")) q.tipo_documento = "IDELE";
}

/* ======================== RAGIONATORE ========================
   Legge un testo qualsiasi (documento copiato, messaggio WhatsApp, email, elenco senza etichette) come farebbe una persona:
   1) raccoglie da TUTTO il testo i candidati di ogni campo: date (anche «12 marzo 1985», «March 12, 1985», «12. März 1985»),
      frasi («nata a Roma il…», «born in Leeds on…», «né le… à…», «mi chiamo…», «carta d'identità n.…»), forme
      («CITTÀ (PR)», numeri di documento, M/F, codici di paese, aggettivi di nazionalità in 6 lingue);
   2) distingue nome e cognome con un dizionario di nomi propri (con il sesso), le particelle (DE, DI, LO, VAN…),
      il maiuscolo («Marie DUPONT»), la virgola («Smith, John») e l'ordine tipico di ogni tipo di testo;
   3) verifica i candidati tra loro: la data di nascita è la più vecchia plausibile (le altre sono emissione e scadenza),
      il codice fiscale conferma cognome, nome, data e sesso e decide l'ordine quando è dubbio;
   4) per ogni campo dice PERCHÉ ha scelto quel valore e quanto è sicuro («frase», «etichetta», «forma», «deduzione»).
   I valori dedotti (sesso dal nome, ordine nome/cognome indovinato) vanno sempre controllati. */
var NOMI_M = "ADAM ADRIANO ALBERTO ALDO ALESSANDRO ALESSIO ALEX ALEXANDER ALFREDO ALI ALAIN ANDREA ANDREI ANDREW ANDRES ANGELO ANTOINE ANTONIO ARTURO AURELIO BENEDETTO BENJAMIN BERNARD BIAGIO BRUNO CARLO CARLOS CESARE CHARLES CHRISTIAN CHRISTOPHER CIARAN CLAUDIO CORRADO CRISTIAN CRISTIANO DANIEL DANIELE DANILO DARIO DAVID DAVIDE DENIS DIEGO DIMITRI DMYTRO DOMENICO DONATO EDOARDO EDWARD ELIA EMANUELE EMILIO EMRE ENEA ENRICO ENZO ERIK ERNESTO ETHAN EUGENIO FABIO FABRIZIO FEDERICO FELICE FERDINANDO FILIPPO FLORIAN FRANCESCO FRANCO FRANCOIS FRANK GABRIELE GAETANO GENNARO GEORGE GERARDO GIACOMO GIAN GIANCARLO GIANFRANCO GIANLUCA GIANMARCO GIANNI GIORGIO GIORGOS GIOVANNI GIULIO GIUSEPPE GREGORIO GUIDO HANS HARRY HENRI HIROSHI HUGO IGNAZIO IVAN JACK JACOPO JAMES JAN JAVIER JEAN JOAO JOHN JORGE JOSE JOSEPH JUAN JURGEN KARL KEVIN LARS LASZLO LAURENT LEONARDO LIAM LORENZO LUC LUCA LUCAS LUCIANO LUDOVICO LUIGI LUIS LUKA LUKAS MAGNUS MANUEL MARCELLO MARCO MARIO MARK MARTIN MASSIMO MATEO MATTEO MATTIA MAURIZIO MAX MEHMET MICHAEL MICHELE MIGUEL MIHAI MOHAMED NICOLA NICOLAS NICOLO NIKOLAOS NORBERTO OLE OLEKSANDR OLIVER OSCAR PABLO PAOLO PASQUALE PATRICK PAUL PAWEL PEDRO PETER PIER PIERGIORGIO PIERO PIERRE PIETRO PIOTR RAFFAELE RAHUL RENATO RENZO RICCARDO ROBERTO ROCCO ROMANO SALVATORE SAMUELE SANDRO SANTIAGO SEAN SEBASTIAN SEBASTIANO SEM SERGIO SILVIO SIMONE STEFANO TAKUMI TIAGO TOMAS TOMMASO THOMAS UMBERTO URS VALERIO VINCENZO VITTORIO WALTER WEI WILLIAM XIAOMING YOUSSEF DAAN PIETER ARBEN ARJUN BENCE ALEXANDRE GUILLAUME JULIEN MAXIME NICCOLO OTTAVIO OSVALDO REMO".split(" ");
var NOMI_F = "ADA ADRIANA AGNESE ALBA ALESSANDRA ALESSIA ALICE ALINE AMANDA ANA ANNA ANNALISA ANANYA ANGELA ANNE ANNIE ANTONELLA ARIANNA ASIA ASTRID AURORA BARBARA BEATRICE BEATRIZ BIANCA CAMILLA CAMILLE CARLA CARMEN CAROLINA CATERINA CECILIA CHARLOTTE CHIARA CHLOE CINZIA CLAIRE CLARA CLAUDIA CRISTINA DANIELA DEBORA DONATELLA ELENA ELENI ELEONORA ELISA ELISABETTA ELIF ELKE ELONA EMILY EMMA ERICA FANG FATIMA FEDERICA FLAVIA FLEUR FRANCESCA GABRIELLA GIADA GIOVANNA GIORGIA GIULIA GIUSEPPINA GRAZIA HANNAH ILARIA INGRID IOANA IRENE IRYNA ISABELLA ISABELLE JANA JENNIFER JULIA KARIN KATARZYNA KATHARINA LARA LAURA LEA LENA LETIZIA LI LINDA LORENA LORENZA LUCIA LUCIE LUDOVICA LUISA MANUELA MARA MARGHERITA MARIA MARIANNA MARIANA MARIE MARINA MARTA MARTINA MARY MATILDE MELISSA MICHELA MIRIAM MONICA NADIA NATALIA NIAMH NICOLE NINA NOEMI NORA OLENA OLIVIA OMBRETTA PAOLA PATRIZIA PETRA PRIYA RAFFAELLA REBECCA REKA RITA ROBERTA ROSA ROSSELLA SABRINA SAKURA SALMA SANNE SARA SARAH SERENA SILVIA SIMONA SIOBHAN SOFIA SONIA SOPHIE STEFANIA SUSANNA TERESA TIZIANA VALENTINA VALERIA VANESSA VERONICA VIOLA VITTORIA YUKI ZEYNEP ZUZANA AOIFE CLAIRE ELLEN LOUISE MONIQUE TRACY ALEXANDRA ELEANOR ELISABETH GEORGETTE DOMINIQUE".split(" ");
var GENERE = {}; NOMI_M.forEach(function (n) { GENERE[n] = "M"; }); NOMI_F.forEach(function (n) { GENERE[n] = GENERE[n] ? "X" : "F"; });
["ANDREA", "SIMONE", "NICOLA", "LUCA", "GABRIELE", "MICHELE", "DANIELE"].forEach(function (n) { GENERE[n] = "M"; }); // in Italia sono nomi maschili
var PART = /^(DE|DI|DA|DEL|DELLA|DELLE|DEGLI|DEI|DELL'?|D'|LO|LA|LE|LI|VAN|VON|DER|DEN|TEN|TER|MAC|MC|O'|AL|EL|BEN|BIN|DOS|DAS|DU|DES|ST|SAN|SANTA)$/;
var NAZ_AGG = { ITALIANA: "ITA", ITALIANO: "ITA", ITALIAN: "ITA", ITALIENNE: "ITA", ITALIEN: "ITA", ITALIENISCH: "ITA", BRITISH: "GBR", ENGLISH: "GBR", BRITANNICA: "GBR", BRITANNICO: "GBR", IRISH: "IRL", IRLANDESE: "IRL", AMERICAN: "USA", STATUNITENSE: "USA", AMERICANA: "USA", AMERICANO: "USA", CANADIAN: "CAN", CANADESE: "CAN", AUSTRALIAN: "AUS", AUSTRALIANA: "AUS", AUSTRALIANO: "AUS", FRENCH: "FRA", FRANCAISE: "FRA", FRANCAIS: "FRA", FRANCESE: "FRA", SPANISH: "ESP", ESPANOLA: "ESP", ESPANOL: "ESP", SPAGNOLA: "ESP", SPAGNOLO: "ESP", GERMAN: "DEU", DEUTSCH: "DEU", DEUTSCHE: "DEU", TEDESCA: "DEU", TEDESCO: "DEU", AUSTRIAN: "AUT", AUSTRIACA: "AUT", AUSTRIACO: "AUT", SWISS: "CHE", SVIZZERA: "CHE", SVIZZERO: "CHE", DUTCH: "NLD", OLANDESE: "NLD", BELGIAN: "BEL", BELGA: "BEL", PORTUGUESE: "PRT", PORTUGUESA: "PRT", PORTOGHESE: "PRT", POLISH: "POL", POLACCA: "POL", POLACCO: "POL", ROMANIAN: "ROU", RUMENA: "ROU", RUMENO: "ROU", ROMENA: "ROU", ROMENO: "ROU", GREEK: "GRC", GRECA: "GRC", GRECO: "GRC", BRAZILIAN: "BRA", BRASILIANA: "BRA", BRASILIANO: "BRA", ARGENTINE: "ARG", ARGENTINIAN: "ARG", ARGENTINA: "ARG", ARGENTINO: "ARG", CHINESE: "CHN", CINESE: "CHN", JAPANESE: "JPN", GIAPPONESE: "JPN", INDIAN: "IND", INDIANA: "IND", INDIANO: "IND", MOROCCAN: "MAR", MAROCCHINA: "MAR", MAROCCHINO: "MAR", TURKISH: "TUR", TURCA: "TUR", TURCO: "TUR", UKRAINIAN: "UKR", UCRAINA: "UKR", UCRAINO: "UKR", ALBANIAN: "ALB", ALBANESE: "ALB", RUSSIAN: "RUS", RUSSA: "RUS", RUSSO: "RUS", SWEDISH: "SWE", SVEDESE: "SWE", NORWEGIAN: "NOR", NORVEGESE: "NOR", DANISH: "DNK", DANESE: "DNK", FINNISH: "FIN", HUNGARIAN: "HUN", UNGHERESE: "HUN", CZECH: "CZE", CECA: "CZE", CECO: "CZE", SLOVAK: "SVK", CROATIAN: "HRV", CROATA: "HRV", MEXICAN: "MEX", MESSICANA: "MEX", MESSICANO: "MEX" };
var MESI_L = { GENNAIO: 1, FEBBRAIO: 2, MARZO: 3, APRILE: 4, MAGGIO: 5, GIUGNO: 6, LUGLIO: 7, AGOSTO: 8, SETTEMBRE: 9, OTTOBRE: 10, NOVEMBRE: 11, DICEMBRE: 12,
  JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, MAY: 5, JUNE: 6, JULY: 7, AUGUST: 8, SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12,
  JANVIER: 1, FEVRIER: 2, MARS: 3, AVRIL: 4, MAI: 5, JUIN: 6, JUILLET: 7, AOUT: 8, SEPTEMBRE: 9, OCTOBRE: 10, DECEMBRE: 12,
  ENERO: 1, FEBRERO: 2, ABRIL: 4, MAYO: 5, JUNIO: 6, JULIO: 7, SEPTIEMBRE: 9, OCTUBRE: 10, NOVIEMBRE: 11, DICIEMBRE: 12,
  JANUAR: 1, FEBRUAR: 2, MARZ: 3, JUNI: 6, JULI: 7, OKTOBER: 10, DEZEMBER: 12, JANEIRO: 1, FEVEREIRO: 2, MARCO: 3, MAIO: 5, JUNHO: 6, JULHO: 7, SETEMBRO: 9, OUTUBRO: 10, NOVEMBRO: 11, DEZEMBRO: 12 };
Object.keys(MESI).forEach(function (k) { MESI_L[k.toUpperCase()] = MESI[k]; });
var NON_NOMI = /^(SONO|MI|CHIAMO|MY|NAME|IS|I|AM|IM|HELLO|HI|CIAO|BUONGIORNO|BUONASERA|SALVE|GRAZIE|THANKS|THANK|YOU|BONJOUR|HOLA|HALLO|ECCO|MIEI|DATI|DETAILS|HERE|ARE|THE|FOR|CHECK|IN|PER|IL|LA|LE|UN|UNA|E|ED|AND|DI|DA|A|NATO|NATA|BORN|ON|NE|NEE|NACIDO|NACIDA|GEBOREN|AM|EN|EL|DE|DEL|ME|LLAMO|JE|APPELLE|MEIN|IST|ICH|BIN|HEISSE|FULL|COGNOME|NOME|CARTA|PASSAPORTO|PASSPORT|DOCUMENTO|NUMERO|NUMBER|NR|NO|N|IDENTITA|IDENTITY|NATIONALITY|NAZIONALITA|CITTADINANZA|SEX|SESSO|MALE|FEMALE|MASCHIO|FEMMINA|SIG|SIGRA|SIGNOR|SIGNORA|MR|MRS|MS|MISS|DOTT|DR|ARRIVO|ARRIVIAMO|ARRIVAL|NOTTI|NIGHTS|OSPITE|OSPITI|GUEST|SIAMO|WE|PRENOTAZIONE|BOOKING|RESIDENTE|RESIDENZA|VIA|PIAZZA|CORSO|TEL|TELEFONO|EMAIL|MAIL|CF|CODICE|FISCALE|TESSERA|SANITARIA|DNI|RILASCIATA|RILASCIATO|COMUNE|LUOGO|DATA|NASCITA|PROVINCIA|ITALIA|ITALY|REPUBBLICA|ITALIANA|ITALIANO|DOCUMENT|DOCUMENTS|ID|CARD|NATIONALITE|NACIONALIDAD|STAATSANGEHORIGKEIT|REISEPASS|CARTE|IDENTITE|DATE|PLACE|BIRTH|OF|TO|AT|WITH|CON|THANKYOU|SALUTI|CORDIALI|REGARDS|BEST|MERCI|GRACIAS|DANKE|SVP|PLEASE|PREGO|OK|SI|YES|PROVINCE|ORE|ALLE|CHE|POI|ANCHE|ALSO|WIFE|HUSBAND|MOGLIE|MARITO|FIGLIO|FIGLIA|SON|DAUGHTER|WAS|WERE|BEEN|HAVE|HAS|MY|OUR|NOSTRI|NOSTRO|HO|HA|ABBIAMO|STATO|STATA|J'AI|SUIS|ES|EST|IST|BIN|WIR|SIND|MEINE|ESTOY|TENGO)$/;

function annoPieno(a, nascita) { a = +a; if (a >= 100) return a; var y = new Date().getFullYear() % 100; return a > y ? 1900 + a : 2000 + a; }
function dataVera(g, m, a) { var d = new Date(a, m - 1, g); return d.getFullYear() === a && d.getMonth() === m - 1 && d.getDate() === g; }
/* tutte le date del testo, con il pezzo di testo che le precede (serve a capire che data è) */
function dateNelTesto(t) {
  var s = sa(t), S = s.toUpperCase(), out = [], m, re;
  var push = function (g, me, a, i, l) { g = +g; me = +me; a = annoPieno(a); if (!me || !dataVera(g, me, a)) return; if (out.some(function (o) { return Math.abs(o.i - i) < 3; })) return; out.push({ d: p2_(g) + "/" + p2_(me) + "/" + a, ord: a * 10000 + me * 100 + g, a: a, i: i, f: i + l, prima: S.slice(Math.max(0, i - 40), i), dopo: S.slice(i + l, i + l + 25) }); };
  re = /\b(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})\b/g; while ((m = re.exec(S))) push(m[3], m[2], m[1], m.index, m[0].length);
  re = /\b(\d{1,2})\s*[.\/\-]\s*(\d{1,2})\s*[.\/\-]\s*(\d{4}|\d{2})\b/g; while ((m = re.exec(S))) push(m[1], m[2], m[3], m.index, m[0].length);
  re = /\b(\d{1,2})\s+(\d{1,2})\s+(\d{4})\b/g; while ((m = re.exec(S))) push(m[1], m[2], m[3], m.index, m[0].length);
  re = /\b(\d{1,2})(?:ST|ND|RD|TH|°|º)?\.?\s*(?:DE\s+)?([A-Z]{3,10})\.?\s*(?:\/\s*[A-Z]{3,5}\s*)?(?:DE\s+|,\s*)?(\d{4}|\d{2})\b/g;
  while ((m = re.exec(S))) { var me = MESI_L[m[2]] || MESI_L[m[2].slice(0, 3)]; if (me) push(m[1], me, m[3], m.index, m[0].length); }
  re = /\b([A-Z]{3,10})\.?\s+(\d{1,2})(?:ST|ND|RD|TH)?,?\s+(\d{4})\b/g; while ((m = re.exec(S))) { var me2 = MESI_L[m[1]] || MESI_L[m[1].slice(0, 3)]; if (me2) push(m[2], me2, m[3], m.index, m[0].length); }
  return out.sort(function (a, b) { return a.i - b.i; });
}
function p2_(n) { return String(n).padStart(2, "0"); }
var RE_NASC = /(NAT[OAIE]|NASCITA|BORN|BIRTH|D\.?O\.?B|NE[E]?\s+LE|NAISS|NACID[OA]|NACIMIENTO|GEBOREN|GEBURT|NASCIMENTO|NASCID[OA]|URODZ|NAROD)/;
var RE_ALTRE = /(EMISSIONE|EMESS|RILASC|SCADENZA|SCADE|VALID|EXPIR|ISSUE|ISSUED|DELIVR|EXPEDIC|CADUC|GULTIG|AUSSTELL|ARRIV|PARTENZ|CHECK|DAL\s|AL\s|FINO|UNTIL|FROM|DEPART|LEAV|PRENOT|BOOK)/;
function sceltaNascita(D) { // la data di nascita: quella detta «nato il…», altrimenti la più vecchia plausibile
  var oggi = new Date(), ok = D.filter(function (d) { var anni = oggi.getFullYear() - d.a; return anni >= 0 && anni <= 110 && d.ord <= oggi.getFullYear() * 10000 + (oggi.getMonth() + 1) * 100 + oggi.getDate(); });
  var det = ok.filter(function (d) { var pr = d.prima.slice(-28); return RE_NASC.test(pr) && !RE_ALTRE.test(pr.slice(pr.search(RE_NASC))); });
  if (det.length) return { v: det[0].d, come: "frase", perche: "è la data scritta dopo «" + (RE_NASC.exec(det[0].prima.slice(-28)) || [""])[0].toLowerCase() + "»" };
  var nonAltre = ok.filter(function (d) { return !RE_ALTRE.test(d.prima.slice(-22)); });
  var cand = (nonAltre.length ? nonAltre : ok).slice().sort(function (a, b) { return a.ord - b.ord; });
  if (!cand.length) return null;
  return { v: cand[0].d, come: ok.length > 1 ? "deduzione" : "forma", perche: ok.length > 1 ? "è la più vecchia delle " + ok.length + " date (le altre sono emissione, scadenza o arrivo)" : "è l'unica data del testo" };
}
/* nome e cognome da una sequenza di parole: dove si spezza? */
function divideNome(parole, indizi) {
  var w = parole.map(function (x) { return x.toUpperCase(); }), n = w.length; indizi = indizi || {};
  if (n < 2) return null;
  var g = function (x) { return GENERE[sa(x).replace(/[^A-Z]/g, "")]; };
  var best = null;
  for (var k = 1; k < n; k++) [0, 1].forEach(function (ord) { // ord 0: nome poi cognome; 1: cognome poi nome
    var A = w.slice(0, k), B = w.slice(k), nomi = ord === 0 ? A : B, cogn = ord === 0 ? B : A;
    if (PART.test(nomi[nomi.length - 1]) || (ord === 0 && PART.test(A[A.length - 1]))) return; // «DE» sta col cognome che segue
    if (ord === 1 && PART.test(A[A.length - 1])) return;
    var sc = 0;
    nomi.forEach(function (x) { sc += g(x) ? 2 : -1.2; });
    cogn.forEach(function (x) { sc += PART.test(x) ? 0.6 : g(x) ? -1.6 : 0.8; });
    if (indizi.maiuscolo) { cogn.forEach(function (x, i) { var o = indizi.orig[ord === 0 ? k + i : i]; if (o && o === o.toUpperCase() && /[A-Z]{2}/.test(o)) sc += 1.5; }); nomi.forEach(function (x, i) { var o = indizi.orig[ord === 0 ? i : k + i]; if (o && o === o.toUpperCase() && /[A-Z]{2}/.test(o)) sc -= 1.5; }); }
    if (indizi.virgola != null) sc += (ord === 1 && k === indizi.virgola) ? 4 : -2;
    if (indizi.ordine === ord) sc += 0.7;
    if (nomi.length > 2) sc -= 1; if (cogn.length > 3) sc -= 1;
    if (!best || sc > best.sc) best = { sc: sc, nome: nomi.join(" "), cognome: cogn.join(" "), ord: ord, certo: nomi.some(g) && !cogn.some(g) };
  });
  return best;
}
function provinciaValida(p) { return !!CAPOLUOGO[p]; }
var STOP_LUOGO = /\s+(?:IL|ON|LE|EL|AM|THE|AND|E|ED|IN DATA|DATA|IN)\s+.*$|\s*[,.;:]\s.*$|\s*\d.*$/;
function pulisciLuogo(x) { x = sa(x).toUpperCase().replace(/\bIN\s+DATA\b.*$/, "").replace(STOP_LUOGO, "").replace(/[^A-Z' ()\-.]/g, " ").replace(/\s+/g, " ").trim(); var w = x.split(" "); while (w.length && NON_NOMI.test(w[w.length - 1].replace(/[^A-Z]/g, ""))) w.pop(); return w.slice(0, 5).join(" "); }

function discorsivoDi(t) { var parole = String(t || "").split(/\s+/).filter(function (w) { return /^[A-Za-zÀ-ÿ']{2,}$/.test(w); }), minus = parole.filter(function (w) { return /^[a-zà-ÿ']+$/.test(w); }).length; return parole.length >= 6 && minus / parole.length > 0.35; } // un messaggio scritto, non un documento
function ragiona(testo, opz) {
  opz = opz || {};
  var T = String(testo || "").replace(/\r/g, ""), S = sa(T).toUpperCase(), r = { perche: {}, come: {} }, disc = discorsivoDi(T);
  var metti = function (k, v, come, perche) { if (!v || r[k]) return; r[k] = v; r.come[k] = come; r.perche[k] = perche; };
  // --- codice fiscale: è la prova più forte per nome, cognome, data e sesso
  var cfs = (S.match(/\b[A-Z]{6}\d{2}[ABCDEHLMPRST]\d{2}[A-Z]\d{3}[A-Z]\b/g) || []).filter(cfValido);
  var cf = cfs[0] ? cfDati(cfs[0]) : null; if (cfs[0]) r.codice_fiscale = cfs[0];
  // --- date
  var D = dateNelTesto(T), dn = sceltaNascita(D);
  if (cf) { var a2 = cf.anno2, cand = D.filter(function (d) { return d.d.slice(0, 5) === p2_(cf.giorno) + "/" + p2_(cf.mese) && String(d.a).slice(2) === a2; })[0];
    var aCF = annoPieno(a2), dCF = p2_(cf.giorno) + "/" + p2_(cf.mese) + "/" + aCF;
    if (cand) metti("data_nascita", cand.d, "verifica", "coincide con il codice fiscale");
    else if (!dn || dn.come !== "frase") metti("data_nascita", dCF, "codice fiscale", "ricavata dal codice fiscale " + cfs[0]);
  }
  if (dn) metti("data_nascita", dn.v, dn.come, dn.perche);
  // --- sesso
  var ms = /\b(NATA|NEE(?=\s+(?:LE|A|EN|\d))|NACIDA|NASCIDA|FEMALE|FEMMINA|FEMME|WEIBLICH|SIGNORA|SIG\.?RA|MRS|MS|MISS)\b/.exec(S), mm = /\b(NATO|NE(?=\s+(?:LE|A|EN|\d))|NACIDO|NASCIDO|MALE|MASCHIO|HOMME|MANNLICH|SIGNOR|SIG|MR)\b/.exec(S);
  if (cf) metti("sesso", cf.sesso, "codice fiscale", "dal codice fiscale (giorno " + (cf.sesso === "F" ? "+40" : "normale") + ")");
  var msx = /(?:SESSO|SEX|SEXE|SEXO|GENDER|GESCHLECHT)\s*[:\-]?\s*([MF]|MALE|FEMALE|MASCHIO|FEMMINA|MASCULINO|FEMENINO)\b/.exec(S);
  if (msx) metti("sesso", /^F/.test(msx[1]) ? "F" : "M", "frase", "scritto «" + msx[0].toLowerCase() + "»");
  if (!disc) { if (ms && /NAT|NE|NAC|NASC/.test(ms[1])) ms = null; if (mm && /NAT|NE|NAC|NASC/.test(mm[1])) mm = null; } // sul documento «nato il» è stampato per tutti
  if (ms && !(mm && mm.index < ms.index && /NATO|NACIDO/.test(mm[0]))) metti("sesso", "F", "frase", "il testo dice «" + ms[0].toLowerCase() + "»");
  if (mm && /^(NATO|NE|NACIDO|NASCIDO|MALE|MASCHIO|HOMME|MANNLICH|MR)$/.test(mm[1])) metti("sesso", "M", "frase", "il testo dice «" + mm[0].toLowerCase() + "»");
  var lineeMF = T.split("\n").map(function (x) { return x.trim(); }).filter(function (x) { return /^[MF]$/.test(x); }); if (lineeMF.length === 1) metti("sesso", lineeMF[0], "forma", "riga con solo «" + lineeMF[0] + "»");
  var vMF = /(?:^|,)\s*([MF])\s*(?:,|$)/m.exec(T); if (vMF) metti("sesso", vMF[1], "forma", "«" + vMF[1] + "» tra le virgole");
  // --- cittadinanza
  var mc = /(?:CITTADINANZA|NAZIONALITA|NATIONALITY|NATIONALITE|NACIONALIDAD|NACIONALIDADE|STAATSANGEHORIGKEIT|CITIZENSHIP|CITIZEN)\s*[:\-]?\s*([A-Z]{3,20})/.exec(S);
  var codN = function (w) { w = w.replace(/[^A-Z]/g, ""); return NAZ_AGG[w] || (w.length === 3 && MRZ && MRZ.PAESI && MRZ.PAESI[w] ? w : ""); };
  if (mc && codN(mc[1])) metti("cittadinanza", codN(mc[1]), "frase", "scritto «" + mc[0].toLowerCase() + "»");
  if (!r.cittadinanza) { var ma = /\b(?:I'?M|I\s+AM|SONO|SOY|JE\s+SUIS|ICH\s+BIN)\s+(?:A\s+|AN\s+)?([A-Z]{4,14})\b/.exec(S); if (ma && NAZ_AGG[ma[1]]) metti("cittadinanza", NAZ_AGG[ma[1]], "frase", "«" + ma[0].toLowerCase() + "»"); }
  if (!r.cittadinanza) { var pz = S.split(/[\s,;:\n\/]+/).map(function (w) { return w.replace(/[^A-Z]/g, ""); }); for (var q = 0; q < pz.length; q++) { if (NAZ_AGG[pz[q]] && pz[q].length >= 5) { metti("cittadinanza", NAZ_AGG[pz[q]], "forma", "la parola «" + pz[q].toLowerCase() + "»"); break; } } }
  if (!r.cittadinanza) { var l3 = T.split(/[\n,;]+/).map(function (x) { return x.trim().toUpperCase(); }).filter(function (x) { return /^[A-Z]{3}$/.test(x) && MRZ && MRZ.PAESI && MRZ.PAESI[x]; }); if (l3.length === 1) metti("cittadinanza", l3[0], "forma", "codice del paese «" + l3[0] + "» da solo"); }
  // --- documento
  var tipo = "", mt;
  if (/CARTA\s+D.?\s*IDENTITA|CARTA\s+IDENTITA|\bC\.?\s?I\.?\s+(?:N|NR|NUM|\d|C[A-Z])|IDENTITY\s+CARD|CARTE\s+D.?\s*IDENTITE|\bDNI\b|PERSONALAUSWEIS|DOCUMENTO\s+NACIONAL/.test(S)) tipo = "IDENT";
  if (/PASSAPORTO|PASSPORT|PASSEPORT|PASAPORTE|REISEPASS|PASAPORT|PASZPORT/.test(S)) tipo = tipo && /CARTA|CARTE|IDENTITY|DNI/.test(S) && S.search(/PASS/) > S.search(/CARTA|CARTE|IDENTITY|DNI/) ? tipo : "PASOR";
  if (/PATENTE|DRIVING\s+LICEN|PERMIS\s+DE\s+CONDUIRE|FUHRERSCHEIN|CARNET\s+DE\s+CONDUCIR/.test(S) && !tipo) tipo = "PATEN";
  var reNum = /(?:CARTA\s+D.?\s*IDENTITA(?:\s+ELETTRONICA)?|CARTA\s+IDENTITA(?:\s+ELETTRONICA)?|\bC\.?\s?I\.?|IDENTITY\s+CARD|CARTE\s+D.?\s*IDENTITE|\bDNI|PASSAPORTO|PASSPORT|PASSEPORT|PASAPORTE|REISEPASS|PATENTE|DOCUMENTO|DOCUMENT|NUMERO|NUMBER)\s*(?:N(?:UMERO|UMBER|R|O)?\.?\s*|N°\s*|#\s*|:\s*|-\s*|DI\s+IDENTITA\s*)*[:\-]?\s*([A-Z0-9]{5,12})\b/g;
  while ((mt = reNum.exec(S))) { var nn = mt[1]; if (/\d/.test(nn) && /\d{2,}|^[A-Z]{1,3}\d/.test(nn) && !dataNorm(nn) && !/^\d{1,4}$/.test(nn)) { metti("numero_documento", nn, "frase", "scritto dopo «" + mt[0].replace(nn, "").trim().toLowerCase() + "»"); break; } }
  if (!r.numero_documento) { var cie = /\b(C[A-Z]\d{5}[A-Z]{2})\b/.exec(S); if (cie) metti("numero_documento", cie[1], "forma", "ha la forma del numero della carta d'identità elettronica (C + lettera + 5 cifre + 2 lettere)"); }
  if (!r.numero_documento) { var tk = T.split(/[\n,;]+/).map(function (x) { return x.trim(); }).filter(function (x) { return /^[A-Z0-9]{6,12}$/i.test(x) && /\d/.test(x) && /[A-Z]/i.test(x) && !dataNorm(x) && !cfValido(x.toUpperCase()); }); if (tk.length === 1) metti("numero_documento", tk[0].toUpperCase(), "forma", "unica sequenza di lettere e cifre che sembra un numero di documento"); }
  if (r.numero_documento && /^C[A-Z0-9]/.test(r.numero_documento) && r.numero_documento.length === 9 && !/^C[A-Z]\d{5}[A-Z]{2}$/.test(r.numero_documento) && /CARTA|IDENTITA|ITALIAN/.test(S) && fixCie(r.numero_documento)) { r.numero_documento = fixCie(r.numero_documento); r.come.numero_documento = "deduzione"; var nl_ = r.numero_documento; r.perche.numero_documento = "corretto: nella carta d'identità elettronica le ultime 2 sono lettere"; }
  if (r.numero_documento && /^C[A-Z]\d{5}[A-Z]{2}$/.test(r.numero_documento)) tipo = "IDELE";
  if (tipo) metti("tipo_documento", tipo, "frase", { IDENT: "si parla di carta d'identità", IDELE: "numero di carta d'identità elettronica", PASOR: "si parla di passaporto", PATEN: "si parla di patente" }[tipo]);
  var mr = /RILASCIAT[AO]\s+(?:DAL\s+COMUNE\s+DI|DAL\s+|DALLA\s+|DA\s+|A\s+|IN\s+)?([A-Z][A-Z' ]{2,30})/.exec(S) || /ISSUED\s+(?:BY|IN|AT)\s+([A-Z][A-Z' ]{2,30})/.exec(S) || /COMUNE\s+DI\s+([A-Z][A-Z' ]{2,30})/.exec(S);
  if (mr) { var rl = pulisciLuogo(mr[1]); if (rl.length >= 3) metti("rilascio_comune", rl, "frase", "«" + mr[0].toLowerCase().trim() + "»"); }
  // --- luogo di nascita
  var luogo = "", prov = "", ml;
  if ((ml = /\b(?:NAT[OAIE]|NACID[OA]|NE[E]?|BORN|GEBOREN|NASCID[OA])\b[^\n]{0,40}?\b(?:A|IN|EN|A\s+LA|À|AD)\s+([A-Z][A-Z' .\-]{1,40}?)\s*(?:\(\s*([A-Z]{2})\s*\)|\s([A-Z]{2})\b(?=\s*(?:,|\.|IL|ON|EL|LE|AM|$|\n)))?(?=\s*(?:,|\.|;|\n|$|\s+IL\b|\s+ON\b|\s+EL\b|\s+LE\b|\s+AM\b|\s+\d|\s*\())/.exec(S.replace(/\bA\s+LA\b/g, "A"))))
    { luogo = pulisciLuogo(ml[1]); prov = ml[2] || (ml[3] && provinciaValida(ml[3]) ? ml[3] : ""); if (luogo) metti("luogo", luogo, "frase", "«" + ml[0].trim().toLowerCase().slice(0, 50) + "»"); }
  if (!r.luogo && (ml = /(?:PLACE\s+OF\s+BIRTH|BIRTHPLACE|LUOGO\s+DI\s+NASCITA|LIEU\s+DE\s+NAISSANCE|LUGAR\s+DE\s+NACIMIENTO|GEBURTSORT|COMUNE\s+DI\s+NASCITA)\s*[:\-]?\s*\n?\s*([A-Z][A-Z' .\-]{1,40}?)\s*(?:\(\s*([A-Z]{2})\s*\))?\s*(?:\n|,|$)/.exec(S))) { luogo = pulisciLuogo(ml[1]); prov = ml[2] || ""; if (luogo) metti("luogo", luogo, "etichetta", "dopo «" + ml[0].split(/[:\n]/)[0].trim().toLowerCase() + "»"); }
  if (!r.luogo && (ml = /(?:^|[\n,]\s*)([A-Z][A-Z' .\-]{1,40}?)\s*\(\s*([A-Z]{2})\s*\)/m.exec(S)) && provinciaValida(ml[2])) { luogo = pulisciLuogo(ml[1]); prov = ml[2]; metti("luogo", luogo, "forma", "«" + ml[1].trim() + " (" + ml[2] + ")»: comune con la sigla della provincia"); }
  if (!r.luogo && (ml = /(?:^|,)[ \t]*([A-Z][A-Z' .\-]{1,40}?)[ \t]+([A-Z]{2})[ \t]*(?:,|$)/m.exec(S)) && provinciaValida(ml[2]) && (disc || /,/.test(T))) { luogo = pulisciLuogo(ml[1]); prov = ml[2]; metti("luogo", luogo, "forma", "«" + ml[1].trim() + " " + ml[2] + "»: comune con la sigla della provincia"); }
  if (!r.luogo && opz.eLuogo) { var righe0 = T.split(/[\n,;]+/).map(function (x) { return x.trim(); }); for (var z = 0; z < righe0.length; z++) { var cl = sa(righe0[z]).toUpperCase(); if (cl.length >= 3 && !/\d/.test(cl) && opz.eLuogo(cl)) { luogo = cl; metti("luogo", cl, "tabella", "«" + righe0[z] + "» è un comune della tabella"); break; } } }
  if (r.luogo) { var tmp = {}; luogoDa(prov ? r.luogo + " (" + prov + ")" : r.luogo, tmp); if (/\b(U\.?S\.?A|USA|UK|U\.?K)\b/.test(r.luogo)) luogoDa(r.luogo.replace(/\s*\(.*$/, ""), tmp); r.luogo_p = tmp; }
  // --- nome e cognome
  var trovaNome = function () {
    // 1) frasi: «mi chiamo…», «my name is…», «sono…», «Full name:…», «Nome e cognome:…»
    var mf = /\b(?:MI[ \t]+CHIAMO|IL[ \t]+MIO[ \t]+NOME[ \t]+E|MY[ \t]+NAME[ \t]+IS|I'?M|I[ \t]+AM|SONO|JE[ \t]+M'?APPELLE|JE[ \t]+SUIS|ME[ \t]+LLAMO|SOY|MEIN[ \t]+NAME[ \t]+IST|ICH[ \t]+HEISSE|ICH[ \t]+BIN|FULL[ \t]+NAME|NOME[ \t]+E[ \t]+COGNOME|COGNOME[ \t]+E[ \t]+NOME|NAME|NOMINATIVO|OSPITE|GUEST)\b[ \t]*[:\-]?[ \t]*((?:[A-Z][A-Z'\-]*\.?,?[ \t]+){0,4}[A-Z][A-Z'\-]+)/g, x;
    var orig = sa(T);
    while ((x = mf.exec(S))) {
      var testo_ = x[1].replace(/\s+(NAT[OA]|BORN|NE[E]?|NACID[OA]|GEBOREN|E|AND|ET|Y|UND|IL|ON|LE|EL|DI|DA|FROM|DE|VON|AUS|THE)\s.*$/, function (m0, w) { return /^(DI|DA|DE|VON)$/.test(w) ? m0 : ""; }).trim();
      var w = testo_.replace(/,/g, " , ").split(/\s+/).filter(Boolean), vir = w.indexOf(",");
      var stop = -1; w.forEach(function (y, j) { if (stop < 0 && y !== "," && NON_NOMI.test(y.replace(/[^A-Z]/g, "")) && !PART.test(y)) stop = j; }); if (stop >= 0) w = w.slice(0, stop); // ci si ferma alla prima parola che non è un nome («John Smith, I was…»)
      if (vir >= w.length) vir = -1; if (vir > 0 && w.length - vir - 1 < 1) { w = w.slice(0, vir); vir = -1; }
      w = w.filter(function (y) { return y !== ","; });
      while (w.length && PART.test(w[w.length - 1])) w.pop();
      if (w.length < 2 || NAZ_AGG[w[0]]) continue;
      var og = orig.slice(x.index + x[0].length - x[1].length, x.index + x[0].length).replace(/,/g, " ").split(/\s+/).filter(Boolean);
      var d = divideNome(w.slice(0, 5), { virgola: vir > 0 ? vir : null, ordine: 0, maiuscolo: og.some(function (o) { return /[a-z]/.test(o); }), orig: og });
      if (d) return { d: d, come: "frase", perche: "«" + x[0].trim().toLowerCase().slice(0, 40) + "»" };
    }
    // 1b) «Bianchi Marco nato a…», «Marie Dupont, née le…»: le parole subito prima di «nato/born/né»
    var rn = /(?:^|\n|[,;:.!]\s*|\s[-–]\s)[ \t]*((?:[A-Z][A-Z'\-]+[ \t]+){1,4}?[A-Z][A-Z'\-]+)[ \t]*,?[ \t]+(?:NAT[OA]|BORN|NEE?|NACID[OA]|GEBOREN|NASCID[OA])\b/g, y;
    while ((y = rn.exec(S))) {
      var w2 = y[1].split(/\s+/).filter(function (z) { return !NON_NOMI.test(z) || PART.test(z); }); if (w2.length < 2 || w2.length > 5) continue;
      var st = y.index + y[0].indexOf(y[1]), og2 = orig.slice(st, st + y[1].length).split(/\s+/);
      var d2 = divideNome(w2, { maiuscolo: og2.some(function (o) { return /[a-z]/.test(o); }), orig: og2, ordine: og2.some(function (o) { return /[a-z]/.test(o); }) ? 0 : 1 });
      if (d2) return { d: d2, come: d2.certo ? "dizionario" : "deduzione", perche: d2.certo ? "«" + d2.nome + "» è un nome proprio, quindi «" + d2.cognome + "» è il cognome" : "nome e cognome prima di «" + y[0].trim().split(/\s+/).pop().toLowerCase() + "»: ordine da controllare" };
    }
    // 2) righe o pezzi (tra virgole) fatti solo di parole che sembrano nomi
    var pezzi = T.split(/\n|[,;]|\s[-–—|]\s/).map(function (y) { return y.trim(); }).filter(Boolean), nomiR = [];
    pezzi.forEach(function (y, i) {
      var u = sa(y).toUpperCase().replace(/^(SIG\.?R?A?|MR|MRS|MS|DOTT\.?S?S?A?|DR)\.?\s+/, "");
      if (/\d|@|:/.test(u) || u.length < 2 || u.length > 45) return;
      var ww = u.split(/\s+/).filter(Boolean); if (ww.length > 4) return;
      if (ww.some(function (z) { return !/^[A-Z'\-]+$/.test(z) || (NON_NOMI.test(z) && !PART.test(z)) || NAZ_AGG[z] || MESI_L[z]; })) return;
      if (r.luogo && N_(u) === N_(r.luogo)) return; if (r.rilascio_comune && N_(u) === N_(r.rilascio_comune)) return;
      if (/^[MF]$/.test(u) || (u.length === 3 && MRZ && MRZ.PAESI && MRZ.PAESI[u])) return;
      if (opz.eLuogo && ww.length <= 3 && opz.eLuogo(u) && !ww.some(function (z) { return GENERE[z]; })) return; // è un comune, non un nome
      nomiR.push({ u: u, w: ww, i: i, o: sa(y).split(/\s+/) });
    });
    if (nomiR.length >= 2 && nomiR[0].w.length <= 3 && nomiR[1].w.length <= 3 && nomiR[1].i - nomiR[0].i <= 2) { // due righe: cognome e nome (o il contrario)
      var a = nomiR[0], b = nomiR[1], ga = a.w.filter(function (z) { return GENERE[z]; }).length / a.w.length, gb = b.w.filter(function (z) { return GENERE[z]; }).length / b.w.length;
      var cogPrima = gb >= ga; // nelle note e nei moduli italiani di solito prima il cognome
      return { d: { cognome: (cogPrima ? a : b).u, nome: (cogPrima ? b : a).u, certo: ga !== gb }, come: ga !== gb ? "dizionario" : "deduzione", perche: ga !== gb ? "«" + (cogPrima ? b : a).u + "» è un nome proprio, l'altra riga è il cognome" : "due righe con parole: la prima è il cognome (ordine dei moduli)" };
    }
    if (nomiR.length >= 1 && nomiR[0].w.length >= 2) { var dd = divideNome(nomiR[0].w, { maiuscolo: nomiR[0].o.some(function (o) { return /[a-z]/.test(o); }), orig: nomiR[0].o, ordine: 1 }); if (dd) return { d: dd, come: dd.certo ? "dizionario" : "deduzione", perche: dd.certo ? "«" + dd.nome + "» è un nome proprio" : "ordine più probabile" }; }
    return null;
  };
  var tn = trovaNome();
  if (tn) {
    var dn2 = tn.d;
    if (cf) { // il codice fiscale decide l'ordine
      var c1 = cfLettere(dn2.cognome, false) === r.codice_fiscale.slice(0, 3) && cfLettere(dn2.nome, true) === r.codice_fiscale.slice(3, 6);
      var c2 = cfLettere(dn2.nome, false) === r.codice_fiscale.slice(0, 3) && cfLettere(dn2.cognome, true) === r.codice_fiscale.slice(3, 6);
      if (c2 && !c1) { var tt = dn2.cognome; dn2 = { cognome: dn2.nome, nome: tt, certo: true }; tn.come = "codice fiscale"; tn.perche = "il codice fiscale dice quale è il cognome"; }
      else if (c1) { tn.come = "codice fiscale"; tn.perche = "confermato dal codice fiscale"; }
    }
    metti("cognome", norm(dn2.cognome), tn.come, tn.perche); metti("nome", norm(dn2.nome), tn.come, tn.perche);
    var gN = GENERE[(dn2.nome || "").split(" ")[0]];
    if (!r.sesso && (gN === "M" || gN === "F")) metti("sesso", gN, "dizionario", "«" + dn2.nome.split(" ")[0] + "» di solito è un nome " + (gN === "M" ? "maschile" : "femminile") + "");
  }
  if (!r.cittadinanza && r.tipo_documento === "IDELE") metti("cittadinanza", "ITA", "deduzione", "la carta d'identità elettronica italiana la hanno i cittadini italiani");
  if (!r.cittadinanza && r.luogo_p && r.luogo_p.provincia_nascita && /CARTA\s+D.?\s*IDENTITA|ITALIAN/.test(S)) metti("cittadinanza", "ITA", "deduzione", "nato in Italia con carta d'identità italiana");
  return r;
}
/* sesso mancante (la «M/F» sulla carta è una lettera sola, l'OCR la perde spesso): si propone quello del nome, sempre da controllare. Non sulla patente. */
function sessoDalNome(p) {
  if (!p || p.sesso || !p.nome || p.tipo_documento === "PATEN") return p;
  var n = sa(p.nome).toUpperCase().split(/\s+/)[0], g = GENERE[n]; if (g !== "M" && g !== "F") return p;
  p.sesso = g; p.euristico = (p.euristico || []).concat(["sesso"]); p.dubbi = (p.dubbi || []).concat(["sesso"]); p.avvisi = (p.avvisi || []).concat(["Sesso non letto: «" + n + "» di solito è un nome " + (g === "M" ? "maschile" : "femminile") + ". Controllalo."]);
  p.perche = p.perche || {}; p.perche.sesso = "«" + n + "» di solito è un nome " + (g === "M" ? "maschile" : "femminile"); return p;
}
/* un messaggio con più persone («Siamo in due: Bianchi Marco nato… / Rossi Elena nata…»): un pezzo per ogni riga con una data di nascita */
function ragionaTutti(t, opz) {
  var righe = String(t || "").replace(/\r/g, "").split("\n"), pezzi = [], cur = null;
  righe.forEach(function (r) {
    var conData = dateNelTesto(r).length > 0 && /[A-Za-z]{3}/.test(r);
    if (conData && cur && dateNelTesto(cur.join("\n")).length && nomePrimaDi(r)) { pezzi.push(cur); cur = null; }
    if (!cur) { if (!conData && !pezzi.length) return; cur = []; } // le righe di saluto prima della prima persona non servono
    cur.push(r);
  });
  if (cur) pezzi.push(cur);
  if (pezzi.length < 2) return null;
  var P = pezzi.map(function (x) { var tx = x.join("\n"), r = ragiona(tx, opz); r.testo = tx; return r; });
  if (P.filter(function (r) { return ["cognome", "nome", "data_nascita"].every(function (k) { return r[k]; }); }).length < 2) return null;
  return P;
}
function nomePrimaDi(r) { return /^[ \t]*[-•*\d.)]*[ \t]*[A-Za-zÀ-ÿ'][A-Za-zÀ-ÿ'\-]+[ \t]+[A-Za-zÀ-ÿ']/.test(r); }
/* il ragionatore entra nella lettura: riempie quello che manca e, se il testo non ha etichette (messaggio, elenco), fa da lettore principale */
function conRagiona(P, t, OPZ) {
  var r = ragiona(t, OPZ), K = [["cognome"], ["nome"], ["data_nascita"], ["sesso"], ["cittadinanza"], ["numero_documento"], ["tipo_documento"], ["rilascio_comune"], ["codice_fiscale"]];
  var forti = ["frase", "etichetta", "codice fiscale", "verifica", "tabella"];
  var nuc = ["cognome", "nome", "data_nascita", "numero_documento", "sesso"].filter(function (k) { return r[k]; }).length;
  if (!P.length) { if (nuc < 3) return P; P.push({ pulizia: [], euristico: [], dubbi: [], avvisi: [] }); }
  if (P.length !== 1) return P;
  var p = P[0]; p.euristico = p.euristico || []; p.perche = p.perche || {};
  var discorsivo = discorsivoDi(t);
  var etichette = (t.match(/\b(COGNOME|SURNAME|NOME|GIVEN NAMES?|NAME|SESSO|SEX|NATIONALITY|CITTADINANZA|DATE OF BIRTH|DATA DI NASCITA)\b/gi) || []).length;
  K.forEach(function (x) {
    var k = x[0], v = r[k]; if (!v) return;
    var forte = forti.indexOf(r.come[k]) >= 0 || ((k === "cognome" || k === "nome") && r.come[k] === "dizionario"), deb = !p[k] || (p.euristico.indexOf(k) >= 0 && forte) || (typeof p[k] === "string" && eEtichetta(p[k]));
    if (k === "data_nascita" && p[k] && p[k] !== v && (r.come[k] === "frase" || r.come[k] === "verifica" || r.come[k] === "codice fiscale") && !p.mrz) deb = true;
    if ((k === "cognome" || k === "nome") && p.cognome && p.nome && etichette >= 2 && !discorsivo && !p.mrz && r.come[k] !== "codice fiscale") return; // documento con etichette: comanda la lettura per etichette
    if ((k === "cognome" || k === "nome") && discorsivo && (forte || r.come[k] === "dizionario") && p[k] !== v) deb = true; // messaggio scritto: le frasi valgono più delle «etichette» trovate in mezzo
    if ((k === "cognome" || k === "nome") && r.come[k] === "codice fiscale" && p[k] && p[k] !== v && !p.mrz) deb = true;
    if (!deb || (p.mrz && p[k])) return;
    if ((k === "sesso" || k === "cittadinanza") && (p.tipo_documento === "PATEN" || r.tipo_documento === "PATEN") && !forte) return; // la patente non li ha: non si indovinano
    p[k] = v; p.perche[k] = r.perche[k];
    if (!forte) { if (p.euristico.indexOf(k) < 0) p.euristico.push(k); } else if (discorsivo) p.euristico = p.euristico.filter(function (z) { return z !== k; });
  });
  if (r.luogo_p && discorsivo && forti.indexOf(r.come.luogo) >= 0) { p.comune_nascita = ""; p.provincia_nascita = ""; p.luogo_nascita = ""; p.stato_nascita = ""; }
  if (r.luogo_p && !p.comune_nascita && !p.luogo_nascita && !p.stato_nascita) { Object.keys(r.luogo_p).forEach(function (k) { p[k] = r.luogo_p[k]; }); p.perche.luogo = r.perche.luogo; if (forti.indexOf(r.come.luogo) < 0) p.euristico.push("comune_nascita"); }
  if (r.cittadinanza && p.cittadinanza && r.come.cittadinanza === "frase" && p.euristico.indexOf("cittadinanza") >= 0) p.cittadinanza = r.cittadinanza;
  Object.keys(r.perche).forEach(function (k) { if (!p.perche[k] && p[k] && String(p[k]) === String(r[k])) p.perche[k] = r.perche[k]; });
  // ciò che il ragionatore ha solo dedotto va controllato nella schermata «Controlla prima di inserire»
  p.dubbi = p.dubbi || []; p.avvisi = p.avvisi || [];
  var NOMEC = { cognome: "cognome", nome: "nome", data_nascita: "data di nascita", sesso: "sesso", cittadinanza: "cittadinanza", numero_documento: "numero del documento", tipo_documento: "tipo di documento", comune_nascita: "luogo di nascita" };
  p.euristico.forEach(function (k) { if (p.dubbi.indexOf(k) >= 0 || !NOMEC[k]) return; p.dubbi.push(k); var pk = k === "comune_nascita" ? "luogo" : k; p.avvisi.push("«" + NOMEC[k] + "» dedotto" + (p.perche[pk] ? " (" + p.perche[pk] + ")" : "") + ": controllalo."); });
  return P;
}

var api = { sessoDalNome: sessoDalNome, ragiona: ragiona, ragionaTutti: ragionaTutti, dateNelTesto: dateNelTesto, divideNome: divideNome, _na: function (v) { return [nomeAncora(v), sembraEtichetta(v), pulisciValore(v)]; }, _ar: function (r) { return ancoreRiga(tokRiga(r)); }, _spaz: function (r) { return riga_spazzatura(r); }, ancore: ancore, paeseDoc: paeseDoc, codicePaese: codicePaese, CAPOLUOGO: CAPOLUOGO, unisci: unisci, leggi1: leggi1, riempiti: riempiti, largo: largo, ripara: ripara, euristica: euristica, dividi: dividi, correggiNumero: correggiNumero, blocchi: blocchi, raggruppa: raggruppa, mrzTutte: mrzTutte, cfValido: cfValido, cfControlla: cfControlla, leggi: leggi, persone: persone, confronta: confronta, dataNorm: dataNorm, tipoDocDa: tipoDocDa, sessoDa: sessoDa };
if (typeof module !== "undefined" && module.exports) module.exports = api; else root.INC = api;
})(this);
