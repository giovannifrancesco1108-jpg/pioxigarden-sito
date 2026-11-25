/* Lettura della zona a lettura ottica (MRZ, le righe con <<<) di passaporti e carte d'identità.
   Tutto sul telefono: nessun dato esce dal dispositivo. Formati ICAO 9303: TD1 (3 righe da 30, carte d'identità),
   TD2 (2 righe da 36), TD3 (2 righe da 44, passaporti). Le cifre di controllo correggono gli errori tipici della lettura. */
(function (root) {
"use strict";
/* codici ICAO dei paesi → nome in italiano (come nelle tabelle della Polizia; i nomi diversi si cercano per somiglianza) */
var PAESI = {"AFG":"AFGHANISTAN","ALB":"ALBANIA","DZA":"ALGERIA","AND":"ANDORRA","AGO":"ANGOLA","ATG":"ANTIGUA E BARBUDA","SAU":"ARABIA SAUDITA","ARG":"ARGENTINA","ARM":"ARMENIA","AUS":"AUSTRALIA","AUT":"AUSTRIA","AZE":"AZERBAIGIAN","BHS":"BAHAMAS","BHR":"BAHREIN","BGD":"BANGLADESH","BRB":"BARBADOS","BEL":"BELGIO","BLZ":"BELIZE","BEN":"BENIN","BTN":"BHUTAN","BLR":"BIELORUSSIA","BOL":"BOLIVIA","BIH":"BOSNIA-ERZEGOVINA","BWA":"BOTSWANA","BRA":"BRASILE","BRN":"BRUNEI","BGR":"BULGARIA","BFA":"BURKINA FASO","BDI":"BURUNDI","KHM":"CAMBOGIA","CMR":"CAMERUN","CAN":"CANADA","CPV":"CAPO VERDE","TCD":"CIAD","CHL":"CILE","CHN":"CINA","CYP":"CIPRO","COL":"COLOMBIA","COM":"COMORE","COG":"CONGO","COD":"CONGO, REPUBBLICA DEMOCRATICA","PRK":"COREA DEL NORD","KOR":"COREA DEL SUD","CIV":"COSTA D'AVORIO","CRI":"COSTA RICA","HRV":"CROAZIA","CUB":"CUBA","DNK":"DANIMARCA","DMA":"DOMINICA","ECU":"ECUADOR","EGY":"EGITTO","SLV":"EL SALVADOR","ARE":"EMIRATI ARABI UNITI","ERI":"ERITREA","EST":"ESTONIA","ETH":"ETIOPIA","FJI":"FIGI","PHL":"FILIPPINE","FIN":"FINLANDIA","FRA":"FRANCIA","GAB":"GABON","GMB":"GAMBIA","GEO":"GEORGIA","D":"GERMANIA","DEU":"GERMANIA","GHA":"GHANA","JAM":"GIAMAICA","JPN":"GIAPPONE","DJI":"GIBUTI","JOR":"GIORDANIA","GRC":"GRECIA","GRD":"GRENADA","GTM":"GUATEMALA","GIN":"GUINEA","GNB":"GUINEA-BISSAU","GNQ":"GUINEA EQUATORIALE","GUY":"GUYANA","HTI":"HAITI","HND":"HONDURAS","HKG":"HONG KONG","IND":"INDIA","IDN":"INDONESIA","IRN":"IRAN","IRQ":"IRAQ","IRL":"IRLANDA","ISL":"ISLANDA","ISR":"ISRAELE","ITA":"ITALIA","KAZ":"KAZAKISTAN","KEN":"KENYA","KGZ":"KIRGHIZISTAN","KIR":"KIRIBATI","RKS":"KOSOVO","UNK":"KOSOVO","KWT":"KUWAIT","LAO":"LAOS","LSO":"LESOTHO","LVA":"LETTONIA","LBN":"LIBANO","LBR":"LIBERIA","LBY":"LIBIA","LIE":"LIECHTENSTEIN","LTU":"LITUANIA","LUX":"LUSSEMBURGO","MAC":"MACAO","MKD":"MACEDONIA DEL NORD","MDG":"MADAGASCAR","MWI":"MALAWI","MYS":"MALAYSIA","MDV":"MALDIVE","MLI":"MALI","MLT":"MALTA","MAR":"MAROCCO","MHL":"MARSHALL","MRT":"MAURITANIA","MUS":"MAURIZIO","MEX":"MESSICO","FSM":"MICRONESIA","MDA":"MOLDAVIA","MCO":"MONACO","MNG":"MONGOLIA","MNE":"MONTENEGRO","MOZ":"MOZAMBICO","MMR":"MYANMAR","NAM":"NAMIBIA","NRU":"NAURU","NPL":"NEPAL","NIC":"NICARAGUA","NER":"NIGER","NGA":"NIGERIA","NOR":"NORVEGIA","NZL":"NUOVA ZELANDA","OMN":"OMAN","NLD":"PAESI BASSI","PAK":"PAKISTAN","PLW":"PALAU","PSE":"PALESTINA","PAN":"PANAMA","PNG":"PAPUA NUOVA GUINEA","PRY":"PARAGUAY","PER":"PERU'","POL":"POLONIA","PRT":"PORTOGALLO","QAT":"QATAR","GBR":"REGNO UNITO","GBD":"REGNO UNITO","GBN":"REGNO UNITO","GBO":"REGNO UNITO","GBP":"REGNO UNITO","GBS":"REGNO UNITO","CZE":"REPUBBLICA CECA","CAF":"REPUBBLICA CENTRAFRICANA","DOM":"REPUBBLICA DOMINICANA","ROU":"ROMANIA","RWA":"RUANDA","RUS":"RUSSIA","KNA":"SAINT KITTS E NEVIS","LCA":"SAINT LUCIA","VCT":"SAINT VINCENT E GRENADINE","WSM":"SAMOA","SMR":"SAN MARINO","STP":"SAO TOME' E PRINCIPE","SEN":"SENEGAL","SRB":"SERBIA","SYC":"SEYCHELLES","SLE":"SIERRA LEONE","SGP":"SINGAPORE","SYR":"SIRIA","SVK":"SLOVACCHIA","SVN":"SLOVENIA","SOM":"SOMALIA","ESP":"SPAGNA","LKA":"SRI LANKA","USA":"STATI UNITI D'AMERICA","ZAF":"SUD AFRICA","SDN":"SUDAN","SSD":"SUDAN DEL SUD","SUR":"SURINAME","SWE":"SVEZIA","CHE":"SVIZZERA","SWZ":"ESWATINI","TJK":"TAGIKISTAN","TWN":"TAIWAN","TZA":"TANZANIA","THA":"THAILANDIA","TLS":"TIMOR EST","TGO":"TOGO","TON":"TONGA","TTO":"TRINIDAD E TOBAGO","TUN":"TUNISIA","TUR":"TURCHIA","TKM":"TURKMENISTAN","TUV":"TUVALU","UKR":"UCRAINA","UGA":"UGANDA","HUN":"UNGHERIA","URY":"URUGUAY","UZB":"UZBEKISTAN","VUT":"VANUATU","VAT":"CITTA' DEL VATICANO","VEN":"VENEZUELA","VNM":"VIETNAM","YEM":"YEMEN","ZMB":"ZAMBIA","ZWE":"ZIMBABWE","XXA":"APOLIDE","XXB":"RIFUGIATO","XXC":"RIFUGIATO"};
function val(c) { return c === "<" ? 0 : c >= "0" && c <= "9" ? c.charCodeAt(0) - 48 : c >= "A" && c <= "Z" ? c.charCodeAt(0) - 55 : -1; }
function cd(s) { var t = 0, w = [7, 3, 1]; for (var i = 0; i < s.length; i++) { var v = val(s[i]); if (v < 0) return -1; t += v * w[i % 3]; } return t % 10; }
function ok(s, d) { return /^\d$/.test(d) && cd(s) === +d; }
var N2D = { O: "0", Q: "0", D: "0", U: "0", I: "1", L: "1", Z: "2", S: "5", B: "8", G: "6", T: "7" };
var D2A = { "0": "O", "1": "I", "2": "Z", "5": "S", "8": "B", "6": "G" };
function num(s) { return s.replace(/[A-Z]/g, function (c) { return N2D[c] || c; }); }
function alpha(s) { return s.replace(/[0-9]/g, function (c) { return D2A[c] || c; }); }
function clean(l) {
  return String(l || "").toUpperCase().replace(/[«‹＜〈(\[{]/g, "<").replace(/\s+/g, "").replace(/[^A-Z0-9<]/g, "");
}
function fit(l, n) { l = l.slice(0, n); while (l.length < n) l += "<"; return l; }
// numero del documento: se la cifra di controllo non torna, prova a scambiare i caratteri che si confondono
var AMB = { O: "0", "0": "O", I: "1", "1": "I", B: "8", "8": "B", S: "5", "5": "S", Z: "2", "2": "Z", G: "6", "6": "G", D: "0", Q: "0" };
function docNum(s, d) {
  d = num(d);
  if (ok(s, d)) return { v: s, ok: true };
  var pos = []; for (var i = 0; i < s.length; i++) if (AMB[s[i]]) pos.push(i);
  if (pos.length && pos.length <= 8) {
    for (var m = 1; m < 1 << pos.length; m++) {
      var a = s.split(""); for (var j = 0; j < pos.length; j++) if (m & (1 << j)) a[pos[j]] = AMB[a[pos[j]]];
      var t = a.join(""); if (ok(t, d)) return { v: t, ok: true, cambiato: true };
    }
  }
  return { v: s, ok: false };
}
function data(yymmdd, futuro) {
  var s = num(yymmdd); if (!/^\d{6}$/.test(s)) return "";
  var yy = +s.slice(0, 2), mm = s.slice(2, 4), dd = s.slice(4, 6), ora = new Date().getFullYear() % 100;
  var y = futuro ? 2000 + yy : yy > ora ? 1900 + yy : 2000 + yy;
  if (+mm < 1 || +mm > 12 || +dd < 1 || +dd > 31) return "";
  return dd + "/" + mm + "/" + y;
}
function nomi(s) {
  s = alpha(s).replace(/([<K]{3,}|<+K+<*|K{2,}<*)$/, "").replace(/<+$/, "");
  var p = s.split(/<<+/), cog = (p[0] || "").replace(/</g, " ").trim(), nom = p.slice(1).join(" ").replace(/</g, " ").replace(/\s+/g, " ").trim();
  return { cognome: cog, nome: nom };
}
function sesso(c) { return c === "M" ? "M" : c === "F" ? "F" : ""; }
function righe(text) {
  return String(text || "").split(/\n/).map(clean).filter(function (l) { return l.length >= 12; });
}
// la lettura accorcia spesso le file di <<<: per questo le righe si leggono per struttura, non per posizione fissa
var D = "[0-9OQDUILZSBGT]";
function re(x) { return new RegExp(x); }
// righe 2 dei passaporti: prima con la nazionalità di 3 caratteri, poi accettando le file di < accorciate
var R_TD3_2 = [re("^([A-Z0-9]{5,9})(<{0,4})(" + D + ")([A-Z0-9<]{3})(" + D + "{6})(" + D + ")([MFX<])(?:(" + D + "{6})(" + D + ")?)?"),
  re("^([A-Z0-9]{5,9})(<{0,4})(" + D + ")([A-Z]{1,2})<{0,2}(" + D + "{6})(" + D + ")([MFX<])(?:(" + D + "{6})(" + D + ")?)?")];
var R_TD1_1 = re("^([ACI][A-Z0-9<])([A-Z]{3}|[A-Z]{1,2}<{0,2})([A-Z0-9]{5,9})(<{0,4})(" + D + "|<)");
var R_TD1_2 = re("^(" + D + "{6})(" + D + ")([MFX<])(?:(" + D + "{6})(" + D + ")([A-Z0-9<]{1,3})?)?");
var R_TD3_1 = /^([PV][A-Z0-9<])([A-Z]{3}|[A-Z]{1,2}<{1,2})([A-Z][A-Z0-9<]+)$/;
function td3(a, b) {
  var m1 = R_TD3_1.exec(a); if (!m1) return null;
  var out = null;
  R_TD3_2.forEach(function (R) {
    var m2 = R.exec(b); if (!m2) return;
    var nr = docNum(m2[1], m2[3]), bd = num(m2[5]), ed = m2[8] ? num(m2[8]) : "", nn = nomi(m1[3]);
    var r = { formato: "TD3", tipo: m1[1].replace(/<$/, ""), emittente: alpha(m1[2]).replace(/</g, ""),
      cognome: nn.cognome, nome: nn.nome, numero: nr.v, nazionalita: alpha(m2[4]).replace(/</g, ""),
      nascita: data(bd), sesso: sesso(m2[7]), scadenza: ed ? data(ed, true) : "",
      controlli: { numero: nr.ok && !nr.cambiato, nascita: ok(bd, num(m2[6])), scadenza: !!ed && !!m2[9] && ok(ed, num(m2[9])) } };
    if (!out || punteggio(r) > punteggio(out)) out = r;
  });
  return out;
}
function td1(a, b, c) {
  var best = null;
  for (var k = 0; k <= 2; k++) { var r = td1k(a.slice(k), b, c); if (r && (!best || punteggio(r) > punteggio(best))) best = r; }
  return best;
}
function td1k(a, b, c) {
  var m1 = R_TD1_1.exec(a), m2 = R_TD1_2.exec(b);
  if (!m1 || !m2) return null;
  var nr = m1[5] === "<" ? { v: m1[3], ok: false } : docNum(m1[3], m1[5]), em = alpha(m1[2]).replace(/</g, "");
  if (!nr.ok) { // un carattere in più o in meno all'inizio: cerca 3 lettere + 9 caratteri + cifra di controllo che torna
    for (var i = 0; i + 13 <= a.length; i++) { var t = docNum(a.substr(i + 3, 9), a[i + 12]); if (t.ok && PAESI[a.substr(i, 3)]) { nr = t; em = a.substr(i, 3); break; } }
  }
  var bd = num(m2[1]), ed = m2[4] ? num(m2[4]) : "", nn = nomi(c || "");
  return { formato: "TD1", tipo: m1[1].replace(/<$/, ""), emittente: em,
    cognome: nn.cognome, nome: nn.nome, numero: nr.v, nazionalita: alpha(m2[6] || "").replace(/</g, ""),
    nascita: data(bd), sesso: sesso(m2[3]), scadenza: ed ? data(ed, true) : "",
    controlli: { numero: nr.ok && !nr.cambiato, nascita: ok(bd, num(m2[2])), scadenza: !!ed && !!m2[5] && ok(ed, num(m2[5])) } };
}
function sistema(r) { if (r && !PAESI[r.nazionalita] && PAESI[r.emittente]) r.nazionalita = r.emittente; return r; }
function punteggio(r) { return (r.controlli.numero ? 1 : 0) + (r.controlli.nascita ? 1 : 0) + (r.controlli.scadenza ? 1 : 0) + (r.cognome ? 1 : 0); }
// dal testo letto trova la MRZ e la interpreta; null se non c'è
function leggi(text) {
  var L = righe(text), best = null;
  function prova(r) { r = sistema(r); if (r && (!best || punteggio(r) > punteggio(best))) best = r; }
  for (var i = 0; i < L.length; i++) {
    var a = L[i], b = L[i + 1], c = L[i + 2];
    if (b) prova(td3(a, b));
    if (b) prova(td1(a, b, c));
  }
  return best && punteggio(best) >= 2 && best.controlli.nascita ? best : best && punteggio(best) >= 3 ? best : null;
}
var api = { leggi: leggi, cd: cd, righe: righe, PAESI: PAESI };
if (typeof module !== "undefined" && module.exports) module.exports = api; else root.MRZ = api;
})(this);
