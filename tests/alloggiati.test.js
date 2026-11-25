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
