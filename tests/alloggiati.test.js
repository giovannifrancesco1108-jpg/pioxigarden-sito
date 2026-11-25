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
  assert.equal(p.numero_documento, "AA1234567"); assert.equal(p.tipo_documento, "IDENT"); assert.equal(p.cittadinanza, "ITALIANA");
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
