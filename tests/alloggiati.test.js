// Prove senza rete: node tests/alloggiati.test.js
const assert = require("assert");
globalThis.MRZ = require("../admin/alloggiati/mrz.js");
const INC = require("../admin/alloggiati/incolla.js");
const CTL = require("../admin/alloggiati/controlli.js");
let n = 0; const ok = (nome, f) => { f(); n++; console.log("ok  " + nome); };

ok("data in vari formati", () => {
  assert.equal(INC.dataNorm("01.02.1980"), "01/02/1980"); assert.equal(INC.dataNorm("1/2/80"), "01/02/1980");
  assert.equal(INC.dataNorm("1980-02-01"), "01/02/1980"); assert.equal(INC.dataNorm("01 FEB 1980"), "01/02/1980");
  assert.equal(INC.dataNorm("12 AGO/AUG 74"), "12/08/1974"); assert.equal(INC.dataNorm("31/02/1980"), "");
});
ok("carta d'identità italiana con etichette bilingui", () => {
  const r = INC.leggi("Carta d'identità elettronica\nCognome/Surname ROSSI\nNome/Name MARIO\nLuogo e data di nascita/Place and date of birth ROMA (RM) 01.02.1980\nSesso/Sex M\nCittadinanza/Nationality ITA\nNumero CA12345AB");
  const p = r.persone[0]; assert.equal(r.persone.length, 1);
  assert.equal(p.cognome, "ROSSI"); assert.equal(p.nome, "MARIO"); assert.equal(p.data_nascita, "01/02/1980");
  assert.equal(p.comune_nascita, "ROMA"); assert.equal(p.provincia_nascita, "RM"); assert.equal(p.sesso, "M");
  assert.equal(p.tipo_documento, "IDELE"); assert.equal(p.numero_documento, "CA12345AB");
});
ok("passaporto in inglese + MRZ coerente", () => {
  const r = INC.leggi("PASSPORT\nSurname\nERIKSSON\nGiven names\nANNA MARIA\nDate of birth\n12 AUG 1974\nSex\nF\nPassport No\nL898902C3\nP<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10");
  const p = r.persone[0]; assert.equal(r.persone.length, 1);
  assert.equal(p.cognome, "ERIKSSON"); assert.equal(p.nome, "ANNA MARIA"); assert.equal(p.data_nascita, "12/08/1974");
  assert.deepEqual(p.differenze, []); assert.equal(p.tipo_documento, "PASOR"); assert.deepEqual(p.fonti, ["testo", "mrz"]);
});
ok("testo e MRZ che non coincidono vengono segnalati", () => {
  const r = INC.leggi("Surname ERIKSSON\nGiven names ANNA MARIA\nDate of birth 13/08/1974\nPassport No L898902C4\nP<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10");
  const p = r.persone[0]; assert.ok(p.differenze.includes("data di nascita")); assert.ok(p.differenze.includes("numero del documento"));
  assert.equal(p.data_nascita, "12/08/1974"); assert.equal(p.numero_documento, "L898902C3"); assert.ok(p.dubbi.includes("data_nascita"));
});
ok("solo MRZ", () => {
  const r = INC.leggi("P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10");
  assert.equal(r.persone.length, 1); assert.equal(r.persone[0].numero_documento, "L898902C3");
});
ok("patente italiana numerata", () => {
  const r = INC.leggi("PATENTE DI GUIDA\n1. BIANCHI\n2. LUCA\n3. 05/06/1990 MILANO (MI)\n4a. 01/01/2020 4b. 01/01/2030\n4c. MIT-UCO\n5. MI1234567X");
  const p = r.persone[0]; assert.equal(p.cognome, "BIANCHI"); assert.equal(p.data_nascita, "05/06/1990"); assert.equal(p.comune_nascita, "MILANO"); assert.equal(p.numero_documento, "MI1234567X");
});
ok("due persone nello stesso testo", () => {
  const r = INC.leggi("Cognome: VERDI\nNome: ANNA\nData di nascita: 01/01/1990\nSesso: F\n\nCognome: NERI\nNome: PAOLO\nData di nascita: 02/02/1985\nSesso: M");
  assert.equal(r.persone.length, 2); assert.equal(r.persone[1].cognome, "NERI");
});
ok("CIE su una sola riga (testo copiato da una foto)", () => {
  const r = INC.leggi("REPUBBLICA ITALIANA MINISTERO DELL'INTERNO CARTA DI IDENTITA' Cognome Surname ROSSI Nome Name MARIO Luogo e data di nascita Place and date of birth BRESCIA (BS) 10.12.1985 Sesso Sex M Statura Height 175 Cittadinanza Nationality ITA Emissione Issuing 01.01.2020 Scadenza Expiry 10.12.2030 Emesso da Issued by COMUNE DI ROMA CA12345AB");
  const p = r.persone[0]; assert.equal(r.persone.length, 1);
  assert.equal(p.cognome, "ROSSI"); assert.equal(p.nome, "MARIO"); assert.equal(p.data_nascita, "10/12/1985");
  assert.equal(p.comune_nascita, "BRESCIA"); assert.equal(p.provincia_nascita, "BS"); assert.equal(p.sesso, "M"); assert.equal(p.cittadinanza, "ITA");
  assert.equal(p.tipo_documento, "IDENT"); assert.match(p.rilascio_testo, /ROMA/);
});
ok("carta d'identità cartacea", () => {
  const r = INC.leggi("COMUNE DI ROMA\nCARTA D'IDENTITA' N° AA 1234567\nCognome ROSSI\nNome MARIO\nnato il 10.12.1985\na BRESCIA (BS)\nCittadinanza ITALIANA\nResidenza ROMA\nStato civile CELIBE\nProfessione IMPIEGATO\nStatura 1.75");
  const p = r.persone[0]; assert.equal(p.cognome, "ROSSI"); assert.equal(p.data_nascita, "10/12/1985"); assert.equal(p.comune_nascita, "BRESCIA");
  assert.equal(p.numero_documento, "AA1234567"); assert.equal(p.tipo_documento, "IDENT"); assert.equal(p.cittadinanza, "ITA"); // l'aggettivo diventa il codice del paese
});
ok("passaporto italiano", () => {
  const r = INC.leggi("PASSAPORTO / PASSPORT\nCognome / Surname\nBIANCHI\nNome / Given names\nLUCA\nCittadinanza / Nationality\nITALIANA\nData di nascita / Date of birth\n05 GIU/JUN 90\nSesso / Sex\nM\nLuogo di nascita / Place of birth\nMILANO (MI)\nData di rilascio / Date of issue\n01 GEN/JAN 20\nAutorità / Authority\nQUESTURA DI ROMA\nN. passaporto / Passport No\nYA1234567");
  const p = r.persone[0]; assert.equal(p.data_nascita, "05/06/1990"); assert.equal(p.comune_nascita, "MILANO"); assert.equal(p.numero_documento, "YA1234567"); assert.equal(p.tipo_documento, "PASOR"); assert.match(p.rilascio_testo, /QUESTURA DI ROMA/);
});
ok("carta tedesca con etichette bilingui", () => {
  const r = INC.leggi("PERSONALAUSWEIS\nName/Surname\nMUELLER\nVornamen/Given names\nHANS PETER\nGeburtsdatum/Date of birth\n12.03.1975\nStaatsangehörigkeit/Nationality\nD\nGeburtsort/Place of birth\nBERLIN\nDokumentnummer\nT220001293");
  const p = r.persone[0]; assert.equal(p.cognome, "MUELLER"); assert.equal(p.nome, "HANS PETER"); assert.equal(p.data_nascita, "12/03/1975"); assert.equal(p.numero_documento, "T220001293");
});
ok("codice fiscale: controllo di nome, data e sesso", () => {
  const ok1 = INC.leggi("Cognome ROSSI\nNome MARIO\nData di nascita 10/12/1985\nSesso M\nCodice fiscale RSSMRA85T10A562S").persone[0];
  assert.deepEqual(ok1.avvisi, []); assert.equal(ok1.codice_fiscale, "RSSMRA85T10A562S");
  const male = INC.leggi("Cognome ROSSI\nNome MARIO\nData di nascita 11/12/1985\nSesso F\nCodice fiscale RSSMRA85T10A562S").persone[0];
  assert.ok(male.dubbi.includes("data_nascita") && male.dubbi.includes("sesso"));
  const rotto = INC.leggi("Cognome ROSSI\nNome MARIO\nCodice fiscale RSSMRA85T10A562X").persone[0];
  assert.ok(rotto.avvisi.some((a) => /cifra di controllo/.test(a)));
});
ok("testo senza dati", () => assert.equal(INC.leggi("ciao a tutti").persone.length, 0));

const tab = { "100000100": { c: "100000100", n: "ITALIA", p: "EE" }, "100000216": { c: "100000216", n: "FRANCIA", p: "EE" }, "412058091": { c: "412058091", n: "ROMA", p: "RM" } };
const ctx = (extra) => Object.assign({ arrivo: "2026-11-24", capo: true, perCodice: (c) => tab[c] || null, doc: [{ c: "IDELE", n: "CIE" }, { c: "PASOR", n: "PASS" }] }, extra);
const buono = { cognome: "ROSSI", nome: "MARIO", sesso: "M", nascita: "01/02/1980", statoN: "100000100", comuneN: "412058091", citt: "100000100", doc: "IDELE", num: "CA12345AB", ril: "412058091" };
ok("ospite corretto: nessun errore", () => { const r = CTL.ospite(buono, ctx()); assert.deepEqual(r.err, {}); assert.deepEqual(r.avv, {}); });
ok("codici inesistenti e formati sbagliati", () => {
  const r = CTL.ospite(Object.assign({}, buono, { doc: "XXXXX", num: "AB 123", citt: "999999999", comuneN: "000000000", nascita: "31/02/1980" }), ctx());
  ["doc", "num", "citt", "comuneN", "nascita"].forEach((k) => assert.ok(r.err[k], k));
});
ok("avviso sul formato del numero italiano", () => assert.ok(CTL.ospite(Object.assign({}, buono, { num: "1234567" }), ctx()).avv.num));
ok("nato dopo l'arrivo e capo minorenne", () => {
  assert.ok(CTL.ospite(Object.assign({}, buono, { nascita: "01/01/2027" }), ctx()).err.nascita);
  assert.ok(CTL.ospite(Object.assign({}, buono, { nascita: "01/01/2015" }), ctx()).err.nascita);
  assert.ok(CTL.ospite(Object.assign({}, buono, { nascita: "01/01/2012" }), ctx()).avv.nascita);
});
ok("insieme: arrivo, notti, doppioni, tabelle", () => {
  const g = [buono, Object.assign({}, buono)];
  const r = CTL.insieme(g, { arrivo: "2026-11-24", notti: 0, docTabella: [], comuniN: 0 });
  assert.ok(r.err.length >= 4);
});
console.log(n + " prove superate");

/* ---- OCR sporco di documenti esteri (storpiature di un OCR vero, dati INVENTATI) ---- */
(function () {
  const t = "SLOVENSKA REPUBLIKA SLOVAK REPURLIC\nOBCUNSKY PREUKAZ :ID-CARD\nPelecciseo / Sumame\nHudák\nento/ Govee names\nMartin\nSrlere sociaservs / Netionolty\nSVK\nhsmesce\nM\n12.03.1979\nHosne oroveuro\n790312/4417\nSVK\nEK518204\nDatum platnasti / Dote of expin\n14.09.2032\nwwln ano oe ge ls\nPoprad\n14.09.2022 Podis dritelo / Sgnature\ntárdck";
  const r = INC.leggi(t); assert.equal(r.persone.length, 1);
  const p = r.persone[0];
  assert.equal(p.cognome, "HUDAK"); assert.equal(p.nome, "MARTIN"); assert.equal(p.cittadinanza, "SVK");
  assert.equal(p.data_nascita, "12/03/1979"); assert.equal(p.sesso, "M"); assert.equal(p.numero_documento, "EK518204");
  assert.ok(p.dubbi.includes("data_nascita") && p.dubbi.includes("numero_documento"), "i campi trovati senza etichetta restano da controllare");
  assert.equal(INC.ripara("Vorname"), "Vorname", "un'etichetta vera non va cambiata");
  assert.equal(INC.ripara("Given names"), "Given names");
  assert.equal(INC.ripara("Date of birth 13/08/1974"), "Date of birth 13/08/1974", "le date con la barra restano intatte");
  console.log("ok  documento slovacco con OCR sporco");
})();

/* ---- scanner: ritaglio, raddrizzamento, ombre ---- */
(function () {
  const SCAN = require("../admin/alloggiati/scanner.js");
  const w = 400, h = 300, g = new Uint8Array(w * h).fill(90), ang = 7 * Math.PI / 180, cx = 200, cy = 150;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = (x - cx) * Math.cos(ang) + (y - cy) * Math.sin(ang), v = -(x - cx) * Math.sin(ang) + (y - cy) * Math.cos(ang);
    if (Math.abs(u) < 150 && Math.abs(v) < 100) { g[y * w + x] = 225; if (Math.abs(u) < 130 && Math.floor((v + 100) / 8) % 2 === 0 && Math.abs(v) < 85) g[y * w + x] = 30; }
  }
  const a = SCAN.inclinazione(g, w, h);
  assert.ok(Math.abs(Math.abs(a) - 7) <= 2, "inclinazione stimata " + a);
  const rit = SCAN.ritaglio(g, w, h); assert.ok(rit.w <= w && rit.h <= h && rit.w > 150);
  const ombra = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) ombra[y * w + x] = (x < 200 ? 110 : 220) - ((y >> 3) % 2 ? 60 : 0);
  const n = SCAN.normalizza(ombra, w, h); const media = (x0, x1) => { let s = 0, c = 0; for (let y = 0; y < h; y++) for (let x = x0; x < x1; x++) { s += n[y * w + x]; c++; } return s / c; };
  assert.ok(Math.abs(media(20, 180) - media(220, 380)) < 40, "l'ombra a metà foto deve sparire");
  console.log("ok  scanner (ritaglio, inclinazione, ombre)");
})();

/* ---- inglese: dove sta il valore rispetto all'etichetta (dati inventati) ---- */
(function () {
  const att = { cognome: "NOVAK", nome: "JANA", data_nascita: "03/05/1985", sesso: "F", numero_documento: "AB1234567" };
  const casi = {
    "etichetta: valore": "PASSPORT\nSurname: Novak\nGiven names: Jana\nDate of birth: 03.05.1985\nSex: F\nNationality: CZE\nDocument No: AB1234567",
    "etichetta sopra": "PASSPORT\nSurname\nNovak\nGiven names\nJana\nDate of birth\n03 MAY 1985\nSex\nF\nNationality\nCZE\nPassport No\nAB1234567",
    "valore sopra": "PASSPORT\nNovak\nSurname\nJana\nGiven names\n03/05/1985\nDate of birth\nF\nSex\nCZE\nNationality\nAB1234567\nPassport No",
    "elenco etichette poi valori": "IDENTITY CARD\nSurname\nGiven names\nDate of birth\nSex\nNationality\nDocument number\nNOVAK\nJANA\n1985-05-03\nF\nCZE\nAB1234567",
    "due etichette sulla stessa riga": "IDENTITY CARD\nSurname Given names\nNOVAK JANA\nBirth date\n03.05.1985\nGender\nF\nCitizenship\nCZE\nID No\nAB1234567",
    "etichette bilingui e storpiate": "REPUBLIC\nPriezvisko / Sumame\nNOVAK\nMeno / Govee names\nJANA\nDatum narodenia / Dote of birth\n03.05.1985\nPohlavie / Sex\nF\nNationality\nCZE\nCislo dokladu / Document No\nAB1234567",
  };
  Object.keys(casi).forEach((nome) => {
    const r = INC.leggi(casi[nome]); assert.equal(r.persone.length, 1, nome);
    Object.keys(att).forEach((k) => assert.equal(r.persone[0][k], att[k], nome + ": " + k));
  });
  console.log("ok  inglese: 6 impaginazioni diverse");
})();

// ---- carte italiane (dati INVENTATI, impaginazione come le carte vere) ----
(function () {
  const cie = (luogo, sesso, citt) => "REPUBBLICA ITALIANA\nMINISTERO DELL'INTERNO\nCARTA DI IDENTITA / IDENTITY CARD\nCOMUNE DI / MUNICIPALITY\nROMA\nCOGNOME / SURNAME\nBIANCHI\nNOME / NAME\nLUCA\nLUOGO E DATA DI NASCITA\nPLACE AND DATE OF BIRTH\n" + luogo + " 12.03.1985\nSESSO STATURA CITTADINANZA\nSEX HEIGHT NATIONALITY\n" + sesso + " 180 " + citt + "\nEMISSIONE / ISSUING\n30.06.2022\nSCADENZA / EXPIRY\n12.03.2033\nCA12345AB";
  let p = INC.leggi(cie("ROMA (RM)", "M", "ITA")).persone[0];
  assert.equal(p.cognome, "BIANCHI"); assert.equal(p.nome, "LUCA"); assert.equal(p.sesso, "M");
  assert.equal(p.cittadinanza, "ITA"); assert.equal(p.comune_nascita, "ROMA"); assert.equal(p.provincia_nascita, "RM");
  assert.equal(p.numero_documento, "CA12345AB");
  p = INC.leggi(cie("LENINGRADO (SUN)", "F", "RUS")).persone[0];
  assert.equal(p.sesso, "F"); assert.equal(p.cittadinanza, "RUS");
  assert.ok(!p.comune_nascita, "all'estero: nessun comune italiano"); assert.equal(p.stato_nascita, "SUN");
  p = INC.leggi(cie("ST.NIKLAAS (BEL)", "F", "ITA")).persone[0];
  assert.equal(p.stato_nascita, "BEL"); assert.ok(!p.provincia_nascita);
  console.log("ok  CIE italiana: tre etichette su una riga e nato all'estero");
})();
(function () {
  const sporco = ".* * x PATENTE DI GUIDA REPUBBLICA ITALIANA\nwi | i 1. VERDI\nke KL 2. PAOLO\n3. 07/05/71 SAVONA (SV)\n4a, 04/11/2022 4c. MIT-UCO\n> <a 4b. 16/02/2033\n77 5, U172K3301B\n—a 7.";
  const a = INC.leggi(sporco).persone[0];
  assert.equal(a.cognome, "VERDI"); assert.equal(a.nome, "PAOLO"); assert.equal(a.data_nascita, "07/05/1971");
  assert.equal(a.comune_nascita, "SAVONA"); assert.equal(a.numero_documento, "U172K3301B");
  const b = INC.leggi("PATENTE DI GUIDA REPUBBLICA ITALIANA\n\n1\n\nVERDI\n\n2\n\nPAOLO\n\n3\n\n07/05/71\n\nSAVONA (SV)\n\n5, U172K3301B").persone[0];
  assert.equal(b.cognome, "VERDI"); assert.equal(b.nome, "PAOLO");
  console.log("ok  patente con OCR sporco (rumore, numeri su righe separate)");
})();

// ---- OCR sporco e più letture della stessa foto (dati INVENTATI) ----
(function () {
  // sporcizia ai lati dei valori, provincia storpiata, etichetta letta come valore
  const t = "REPUBBLICA ITALIANA\nCARTA DI IDENTITA / IDENTITY CARD\nCOMUNE DI\nROMA\nCOGNOME / SURNAME\nBIANCHI % E ve\nNOME / NAME\neal _ = \\\nLUCA\nLUOGO E DATA DI NASCITA\nSIENA{S1) 12.03.1985\nSESSO STATURA CITTADINANZA\nM 180 ITA\nCA12345AB";
  const p = INC.leggi(t).persone[0];
  assert.equal(p.cognome, "BIANCHI"); assert.equal(p.nome, "LUCA");
  assert.equal(p.comune_nascita, "SIENA"); assert.equal(p.provincia_nascita, "SI");
  // il riempitivo della MRZ letto «cccc» non finisce nel nome
  const m = INC.leggi("Surname\nPRICE\nGiven names\nHANNAH LOUISE CCECCEECEGCC\nDate of birth\n11 MAR 90\nSex\nF").persone[0];
  assert.equal(m.nome, "HANNAH LOUISE");
  // la patente non ha sesso né cittadinanza: non se li inventa
  const pat = INC.leggi("PATENTE DI GUIDA REPUBBLICA ITALIANA\n1. VERDI\n2. PAOLO\n3. 07/05/71 SAVONA (SV)\n5. U172K3301B\n9. AB\nF").persone[0];
  assert.ok(!pat.sesso && !pat.cittadinanza);
  console.log("ok  OCR sporco: simboli ai lati, provincia {S1), riempitivo MRZ, patente");
})();
(function () {
  const buona = "Surname\nNOVAK\nGiven names\nJANA\nDate of birth\n03.05.1985\nSex\nF\nNationality\nCZE\nPassport No\nAB1234567";
  const senzaCitt = "Surname\nNOVAK\nGiven names\nJANA\nDate of birth\n03.05.1985\nSex\nF\nPassport No\nAB1234567";
  const senzaData = "Surname\nNOVAK\nGiven names\nJANA\nNationality\nCZE\nSex\nF\nPassport No\nAB1234567";
  const rumore = "xx\nSurname\nNOVAC\nGiven names\nJANA\nDate of birth\n03.05.1985";
  const u = INC.unisci([senzaCitt, senzaData, rumore, buona]);
  assert.equal(u.persone.length, 1, "una sola persona");
  const p = u.persone[0];
  assert.equal(p.cognome, "NOVAK"); assert.equal(p.data_nascita, "03/05/1985"); assert.equal(p.cittadinanza, "CZE"); assert.equal(p.numero_documento, "AB1234567");
  // due persone diverse nella stessa foto restano due
  const altra = "Surname\nKOVAC\nGiven names\nPETER\nDate of birth\n11.11.1970\nSex\nM\nNationality\nSVK\nPassport No\nCD7654321";
  assert.equal(INC.unisci([buona, altra, buona, altra]).persone.length, 2);
  console.log("ok  più letture della stessa foto unite con il voto");
})();

(function () { // rumore: nessuna persona inventata
  assert.equal(INC.unisci(["xx\nNumber AB1234567 qq", "Sex\nM\nboh"]).persone.length, 0);
  console.log("ok  letture senza dati veri non creano ospiti vuoti");
})();

// ---- lettura ad ancore (dati INVENTATI, impaginazioni e storpiature viste nelle foto vere) ----
(function () {
  // passaporto britannico: sesso e luogo sulla stessa riga, data «06 JAN /JAN 67», numero dopo «P GBR»
  const uk = INC.leggi("UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND\nPASSPORT\nType/Type Code/Code Passport No./Passeport No.\nP GBR 540001974\nSurname/Nom (1)\nHARLOW\nGiven names/Prenoms (2)\nSOPHIE CLAIRE\nNationality/Nationalite (3)\nBRITISH CITIZEN\nDate of birth/Date de naissance (4)\n06 JAN /JAN 67\nSex/Sexe (5) Place of birth/Lieu de naissance (6)\nF READING\nDate of issue/Date de delivrance (7) Authority/Autorite (8)\n07 NOV /NOV 17 HMPO\nDate of expiry/Date d'expiration (9)\n19 SEP /SEP 31").persone[0];
  assert.equal(uk.sesso, "F"); assert.equal(uk.numero_documento, "540001974"); assert.equal(uk.cittadinanza, "GBR");
  assert.equal(uk.data_nascita, "06/01/1967"); assert.equal(uk.luogo_nascita, "READING"); assert.equal(uk.rilascio_stato, "REGNO UNITO");
  // carta francese: sesso, nazionalità e data su una riga; nomi «Marie, Anne»
  const fr = INC.leggi("REPUBLIQUE FRANCAISE\nCARTE NATIONALE D'IDENTITE / IDENTITY CARD\nNOM / Surname\nLE GALL\nPrenoms / Given names\nMarie, Anne\nSEXE / Sex NATIONALITE / Nationality DATE DE NAISS. / Date of birth\nF FRA 04 10 1947\nLIEU DE NAISSANCE / Place of birth\nRODEZ\nN DU DOCUMENT / Document No. DATE D'EXPIR / Expiry date\nSP84N4U31 10 10 2029").persone[0];
  assert.equal(fr.sesso, "F"); assert.equal(fr.data_nascita, "04/10/1947"); assert.equal(fr.numero_documento, "SP84N4U31"); assert.equal(fr.nome, "MARIE ANNE");
  // DNI spagnolo: i due cognomi su due righe
  const es = INC.leggi("REINO DE ESPANA\nDOCUMENTO NACIONAL DE IDENTIDAD\nAPELLIDOS\nMORENO\nDIAZ\nNOMBRE\nJAVIER\nSEXO NACIONALIDAD\nM ESP\nFECHA DE NACIMIENTO\n14 07 1988\nNUM SOPORTE\nBAF482913").persone[0];
  assert.equal(es.cognome, "MORENO DIAZ"); assert.equal(es.nome, "JAVIER"); assert.equal(es.data_nascita, "14/07/1988"); assert.equal(es.rilascio_stato, "SPAGNA");
  // carta cartacea: «a CITTÀ (PR)» su una riga a sé
  const ca = INC.leggi("REPUBBLICA ITALIANA\nCOMUNE DI ROMA\nCARTA D'IDENTITA N. AB1234567\nCognome ROSSI\nNome MARIO\nnato il 01.02.1980\n(atto n. 12 P. I S. A)\na CATANIA (CT)\nCittadinanza ITALIANA").persone[0];
  assert.equal(ca.comune_nascita, "CATANIA"); assert.equal(ca.provincia_nascita, "CT"); assert.equal(ca.cittadinanza, "ITA");
  // CIE: numero letto con le lettere finali come cifre («CA4830175» → «CA48301TS»), comune di rilascio dall'etichetta
  const cie = INC.leggi("REPUBBLICA ITALIANA\nMINISTERO DELL'INTERNO\nCA4830175\nCARTA DI IDENTITA / IDENTITY CARD\nCOMUNE DI / MUNICIPALITY\nLUCERA\nCOGNOME / SURNAME\nSERRA\nNOME / NAME\nDAVIDE\nLUOGO E DATA DI NASCITA\nPLACE AND DATE OF BIRTH\nSAN SEVERO (FG) 14.05.1999\nSESSO STATURA CITTADINANZA\nSEX HEIGHT NATIONALITY\nM 177 ITA").persone[0];
  assert.equal(cie.numero_documento, "CA48301TS"); assert.ok(cie.dubbi.indexOf("numero_documento") >= 0, "numero corretto = da controllare");
  assert.equal(cie.rilascio_comune, "LUCERA"); assert.equal(cie.comune_nascita, "SAN SEVERO");
  // etichette storpiate dall'OCR: «MIE / SUBNAME», «(0GO E DATA Di NASOTR», «‘SéSSO»
  const st = INC.leggi("REPUBBLICA ITALIANA\nCA57204KD\nMIE / SUBNAME\nMoRRA\nN'\n/ NAME\nGIANFILIPPO\nPLACE AND DATE OF SiRTH\n(0GO E DATA Di NASOTR\nMELFI (P2) 03.11.1968\n‘SéSSO\nSEX\nM").persone[0];
  assert.equal(st.cognome, "MORRA"); assert.equal(st.nome, "GIANFILIPPO"); assert.equal(st.comune_nascita, "MELFI"); assert.equal(st.provincia_nascita, "PZ"); assert.equal(st.data_nascita, "03/11/1968");
  // patente: «4c. MC-PZ» → rilasciata a POTENZA (capoluogo della sigla)
  const pa = INC.leggi("PATENTE DI GUIDA REPUBBLICA ITALIANA\n1. CARUSO\n2. PIETRO\n3. 11/09/84 LAURIA (PZ)\n4a. 05/06/2021 4c. MC-PZ\n4b. 11/09/2031\n5. PZ7718204K").persone[0];
  assert.equal(pa.rilascio_comune, "POTENZA");
  console.log("ok  ancore: passaporto UK, carta francese, DNI, cartacea, CIE storpiata, patente MC-PZ");
})();
(function () { // voto tra letture: la coda di spazzatura non vince, il nome troncato si completa
  const t = (c, n) => "REPUBBLICA ITALIANA\nCOGNOME / SURNAME\n" + c + "\nNOME / NAME\n" + n + "\nLUOGO E DATA DI NASCITA\nACIREALE (CT) 02.06.1960\nSESSO STATURA CITTADINANZA\nM 171 ITA\nCA30118RX";
  const u = INC.unisci([t("SCIACCA", "GIUSEPPE ANTO"), t("SCIACCA RA", "GIUSEPPE ANTONIO"), t("SCIACCA", "GIUSEPPE ANTONIO"), t("SCIACCA HF WEY", "GIUSEPPE ANTONIO")]).persone[0];
  assert.equal(u.cognome, "SCIACCA"); assert.equal(u.nome, "GIUSEPPE ANTONIO");
  assert.equal(INC.leggi(t("ROSSI", "MARIO").replace("02.06.1960", "02.06.3960")).persone[0].data_nascita || "", "", "anno impossibile scartato");
  console.log("ok  voto tra letture: niente code di spazzatura, nomi troncati completati, date impossibili scartate");
})();
(function () { // CIE con le etichette piccole non lette dall'OCR: si ragiona sull'ordine fisso della carta
  const p = INC.leggi("REPUBBLICA ITALIANA\nCB92388ES\nMINISTERO DELL'INTERNO\nCARTA DI IDENTITA / IDENTITY CARD\nVELLETRI\nD'AMATO\nMARTINA\nTRAPANI (TP) 06.09.1974\nF 168 ITA").persone[0];
  assert.equal(p.cognome, "D'AMATO"); assert.equal(p.nome, "MARTINA"); assert.equal(p.comune_nascita, "TRAPANI"); assert.equal(p.rilascio_comune, "VELLETRI");
  assert.ok(p.dubbi.indexOf("cognome") >= 0 && p.dubbi.indexOf("nome") >= 0, "trovati per posizione: da controllare");
  console.log("ok  CIE senza etichette leggibili: cognome, nome e comune dall'ordine della carta");
})();
