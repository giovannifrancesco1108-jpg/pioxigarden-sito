/* Controlli sugli ospiti prima dell'invio alla Questura (Alloggiati Web).
   Due livelli: "err" = blocca la verifica/l'invio; "avv" = avviso da guardare (si può comunque procedere dopo conferma).
   Funzioni pure: si provano anche con node (vedi tests/controlli.test.js). */
(function (root) {
"use strict";
var ITALIA = "100000100";

function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9' ]+/g, " ").replace(/\s+/g, " ").trim(); }
function data(s) {
  var m = /^(\d\d)\/(\d\d)\/(\d{4})$/.exec(s || ""); if (!m) return null;
  var d = new Date(+m[3], m[2] - 1, +m[1]);
  return d.getDate() === +m[1] && d.getMonth() === m[2] - 1 && d.getFullYear() === +m[3] ? d : null;
}
function etaAl(nascita, giorno) { var e = giorno.getFullYear() - nascita.getFullYear(), m = giorno.getMonth() - nascita.getMonth(); if (m < 0 || (m === 0 && giorno.getDate() < nascita.getDate())) e--; return e; }
function isoData(iso) { var p = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ""); return p ? new Date(+p[1], p[2] - 1, +p[3]) : null; }

/* Formati dei numeri dei documenti italiani (gli stranieri hanno formati troppo diversi: lì si controlla solo che sia plausibile) */
var FORMATI_IT = {
  IDELE: { re: /^[A-Z]{2}\d{5}[A-Z]{2}$/, es: "AA12345BB" },
  IDENT: { re: /^[A-Z]{2}\d{7}$|^[A-Z]{2}\d{5}[A-Z]{2}$/, es: "AA1234567" },
  PASOR: { re: /^[A-Z]{2}\d{7}$/, es: "AA1234567" },
  PATEN: { re: /^[A-Z0-9]{10}$/, es: "10 caratteri, per esempio U1A234567B" }
};

/* g = ospite: {cognome,nome,sesso,nascita,statoN,comuneN,citt,doc,num,ril}; ctx = {arrivo:"aaaa-mm-gg", capo:true/false,
   perCodice(codice) → voce di tabella o null, doc:[{c,n}] } */
function ospite(g, ctx) {
  var err = {}, avv = {}, E = function (k, t) { if (!err[k]) err[k] = t; }, A = function (k, t) { if (!avv[k]) avv[k] = t; };
  var arr = isoData(ctx.arrivo), vuoto = function (v) { return !String(v == null ? "" : v).trim(); };

  ["cognome", "nome"].forEach(function (k) {
    var v = String(g[k] || "").trim();
    if (!v) return E(k, "Manca");
    if (/\d/.test(v)) return E(k, "Ci sono dei numeri: controlla");
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' .\-]+$/.test(v)) return E(k, "Ci sono caratteri strani: controlla");
    if (norm(v).length < 2) A(k, "Solo una lettera: è giusto?");
  });
  if (g.cognome && g.nome && norm(g.cognome) === norm(g.nome)) A("nome", "Nome e cognome uguali: è giusto?");
  if (g.sesso !== "M" && g.sesso !== "F") E("sesso", "Scegli maschio o femmina");

  var nd = data(g.nascita);
  if (vuoto(g.nascita)) E("nascita", "Manca");
  else if (!nd) E("nascita", "Data non valida (gg/mm/aaaa)");
  else {
    var oggi = new Date();
    if (nd > oggi) E("nascita", "Data nel futuro");
    else if (arr && nd > arr) E("nascita", "Nato dopo l'arrivo");
    else {
      var eta = etaAl(nd, arr || oggi);
      if (eta > 110) A("nascita", "Più di 110 anni: è giusta?");
      if (ctx.capo && eta < 14) E("nascita", "Il capo deve avere almeno 14 anni");
      else if (ctx.capo && eta < 18) A("nascita", "Il capo è minorenne: è giusto?");
    }
  }

  var sn = g.statoN ? ctx.perCodice(g.statoN) : null;
  if (!g.statoN) E("statoN", "Manca"); else if (!sn || !/^100000/.test(g.statoN)) E("statoN", "Stato non presente nella tabella ufficiale");
  if (g.statoN === ITALIA) {
    var cn = g.comuneN ? ctx.perCodice(g.comuneN) : null;
    if (!g.comuneN) E("comuneN", "Manca il comune (nato in Italia)");
    else if (!cn || /^100000/.test(g.comuneN)) E("comuneN", "Comune non presente nella tabella ufficiale");
    else {
      if (!cn.p || cn.p === "EE") E("comuneN", "Il comune non ha la sigla della provincia");
      if (cn.x) A("comuneN", "Comune cessato: va bene solo se è nato prima della soppressione");
    }
  } else if (g.comuneN) E("comuneN", "Il comune si indica solo per chi è nato in Italia");

  var ci = g.citt ? ctx.perCodice(g.citt) : null;
  if (!g.citt) E("citt", "Manca"); else if (!ci || !/^100000/.test(g.citt)) E("citt", "Cittadinanza non presente nella tabella ufficiale");
  else if (sn && g.statoN !== g.citt && g.statoN === ITALIA && g.citt !== ITALIA) A("citt", "Nato in Italia con altra cittadinanza: è giusto?");

  if (ctx.capo) {
    var tipo = (ctx.doc || []).filter(function (d) { return d.c === g.doc; })[0];
    if (!g.doc) E("doc", "Scegli il tipo di documento");
    else if (!tipo) E("doc", "Codice documento non presente nella tabella ufficiale");

    var num = String(g.num || "").trim().toUpperCase();
    if (!num) E("num", "Manca");
    else if (/\s/.test(num)) E("num", "Ci sono spazi nel numero");
    else if (!/^[A-Z0-9]+$/.test(num)) E("num", "Il numero ha caratteri non ammessi (solo lettere e numeri)");
    else if (num.length < 4) E("num", "Numero troppo corto");
    else if (num.length > 20) E("num", "Numero troppo lungo (massimo 20)");
    else {
      var rl = g.ril ? ctx.perCodice(g.ril) : null, italiano = rl && !/^100000/.test(g.ril) || g.ril === ITALIA;
      var f = FORMATI_IT[g.doc];
      if (f && italiano && !f.re.test(num)) A("num", "Di solito un documento italiano così ha il formato " + f.es);
      if (/^0+$/.test(num) || /^(.)\1+$/.test(num)) A("num", "Numero poco plausibile");
    }
    if (!g.ril) E("ril", "Manca il luogo di rilascio");
    else if (!ctx.perCodice(g.ril)) E("ril", "Luogo non presente nella tabella ufficiale");
  }
  return { err: err, avv: avv };
}

/* controlli sull'insieme: arrivo, notti, doppioni, tabelle scaricate */
function insieme(G, ctx) {
  var err = [], avv = [], arr = isoData(ctx.arrivo), oggi = new Date(), z = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  if (!arr) err.push("Manca il giorno di arrivo");
  else {
    var diff = Math.round((z - arr) / 864e5);
    if (diff < -1) err.push("L'arrivo è nel futuro");
    else if (diff > 1) avv.push("L'arrivo è di " + diff + " giorni fa: il portale accetta di solito oggi o ieri");
  }
  var n = +ctx.notti; if (!(n >= 1 && n <= 30) || Math.floor(n) !== n) err.push("Le notti devono essere un numero intero da 1 a 30");
  if (!G.length) err.push("Manca almeno un ospite");
  if (G.length > 60) err.push("Troppe schedine in un invio (massimo 60)");
  var visti = {};
  G.forEach(function (g, i) {
    var k = norm(g.cognome) + "|" + norm(g.nome) + "|" + (g.nascita || "");
    if (norm(g.cognome) && visti[k] != null) err.push("L'ospite " + (i + 1) + " è uguale all'ospite " + (visti[k] + 1));
    else visti[k] = i;
  });
  if (ctx.docTabella && !ctx.docTabella.length) err.push("La tabella dei documenti non è stata scaricata: aggiorna le tabelle");
  else ["IDENT", "IDELE", "PASOR", "PATEN"].forEach(function (c) { if (ctx.docTabella && !ctx.docTabella.some(function (d) { return d.c === c; })) avv.push("Nella tabella dei documenti manca il codice " + c); });
  if (ctx.comuniN === 0) err.push("La tabella di comuni e stati non è stata scaricata: aggiorna le tabelle");
  return { err: err, avv: avv };
}

var api = { ospite: ospite, insieme: insieme, data: data, etaAl: etaAl, norm: norm, FORMATI_IT: FORMATI_IT, ITALIA: ITALIA };
if (typeof module !== "undefined" && module.exports) module.exports = api; else root.CTL = api;
})(this);
