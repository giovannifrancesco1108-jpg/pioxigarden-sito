// node tests/server.test.mjs
import assert from "assert";
import { controllaSchedine } from "../lib/alloggiati.js";
const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
const riga = (o) => Object.assign({ tipo: "16", arr: "24/11/2026", n: "01", cog: "ROSSI", nom: "MARIO", ses: "1", nas: "01/02/1980", com: "412058091", pr: "RM", st: "100000100", ci: "100000100", td: "IDELE", num: "CA12345AB", ril: "412058091" }, o);
const fmt = (o) => o.tipo + o.arr + o.n + pad(o.cog, 50) + pad(o.nom, 30) + o.ses + o.nas + o.com + pad(o.pr, 2) + o.st + o.ci + pad(o.td, 5) + pad(o.num, 20) + o.ril;
const tab = { luoghi: "Codice;Descrizione;Provincia\n412058091;ROMA;RM\n100000100;ITALIA;EE\n100000216;FRANCIA;EE", documenti: "Codice;Descrizione\nIDELE;CIE\nIDENT;CI\nPASOR;PASS\nPATEN;PAT" };
const r = fmt(riga({})); assert.equal(r.length, 168);
assert.deepEqual(controllaSchedine([r], tab), []);
const male = (o) => controllaSchedine([fmt(riga(o))], tab).join("|");
assert.match(male({ td: "XXXXX" }), /codice documento/);
assert.match(male({ nas: "31/02/1980" }), /data di nascita/);
assert.match(male({ com: "412058999" }), /comune di nascita non è nella tabella/);
assert.match(male({ pr: "MI" }), /provincia non corrisponde/);
assert.match(male({ st: "100000216" }), /vuoti per chi è nato all'estero/);
assert.match(male({ num: "AB 12" }), /numero del documento/);
assert.match(male({ ses: "3" }), /sesso/);
assert.match(male({ n: "31" }), /notti/);
assert.match(male({ cog: "ROSSI1" }), /cognome/);
assert.match(male({ ril: "999999999" }), /luogo di rilascio non è nella tabella/);
assert.match(male({ nas: "01/01/2027" }), /dopo l'arrivo/);
// famiglia: capo 17 + membro 19 senza documento
const capo = fmt(riga({ tipo: "17" })), fam = fmt(riga({ tipo: "19", td: "", num: "", ril: "         ", cog: "ROSSI", nom: "LUCIA", ses: "2" }));
assert.deepEqual(controllaSchedine([capo, fam], tab), []);
assert.match(controllaSchedine([capo], tab).join("|"), /almeno due/);
assert.match(controllaSchedine([capo, fmt(riga({ tipo: "20", td: "", num: "", ril: "         " }))], tab).join("|"), /tipo di alloggiato/);
console.log("prove del server superate");
