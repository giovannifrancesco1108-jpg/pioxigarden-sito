/* Banco di prova «mondo»: 850 documenti SINTETICI (dati inventati) di molti paesi, come escono dall'OCR di una foto.
   Per ogni documento si conoscono i valori veri; si misura quanti campi il lettore ricava giusti:
   cognome, nome, sesso, data di nascita, luogo di nascita, cittadinanza, numero, tipo e luogo di rilascio.
   Tre livelli: «pulito» (testo copiato bene), «foto» (OCR normale), «pessima» (OCR di una foto brutta).
   Il rumore imita quello visto davvero: etichette storpiate (SUBNAME, NASOTR), righe dello schermo («02:12», «Rispondi»),
   simboli ai lati dei valori, province lette «(S1)», righe in ordine sparso, riempitivi MRZ letti «ccc».
   Uso: node tests/corpus/mondo.js [--errori] [--livello=foto] [--paese=FRA] [--modello=CIE] */
"use strict";
const MRZ = require("../../admin/alloggiati/mrz.js");
globalThis.MRZ = MRZ;
const INC = require("../../admin/alloggiati/incolla.js");

function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(850850);
const pick = (a) => a[Math.floor(R() * a.length)];
const int = (a, b) => a + Math.floor(R() * (b - a + 1));
const p2 = (n) => String(n).padStart(2, "0");
const caso = (p) => R() < p;
const LETT = "ABCDEFGHJKLMNPRSTUVWXYZ";
const rl = (n) => Array.from({ length: n }, () => LETT[int(0, LETT.length - 1)]).join("");
const rd = (n) => Array.from({ length: n }, () => int(0, 9)).join("");
const sa = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const N = (s) => sa(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
const MESI_EN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MESI_FR = ["JANV", "FEVR", "MARS", "AVR", "MAI", "JUIN", "JUIL", "AOUT", "SEPT", "OCT", "NOV", "DEC"];

/* ---------- paesi: nomi, città, etichette nella lingua del posto ---------- */
const P = {
  ITA: { cog: ["ROSSI", "D'ANGELO", "DI MARCO", "DE ROSA", "LO BIANCO", "ESPOSITO", "SANTORO", "D'AMICO", "DELL'ORTO", "LA ROCCA", "SCIACCA", "FERRETTI"], m: ["GIAN PAOLO", "CARLO ALBERTO", "MATTEO", "ANDREA", "PIERGIORGIO", "LUCA", "MARCO", "GIANCARLO"], f: ["FLAVIA", "AURORA", "GIULIA", "ALESSIA", "ANNA MARIA", "LUCIA", "GIOVANNA", "MARIA CHIARA"] },
  GBR: { cog: ["SMITH", "O'NEILL", "PRICE", "HUGHES", "CARTER", "BROWN-SMITH", "WILLIAMS", "TAYLOR"], m: ["PETER JAMES", "JAMES", "OLIVER JOHN", "HARRY"], f: ["HANNAH LOUISE", "SOPHIE CLAIRE", "MARY ELLEN", "EMMA"], citta: ["LONDON", "READING", "MANCHESTER", "DOVER", "BRIGHTON", "MALTA"], naz: "BRITISH CITIZEN", ente: "HMPO" },
  IRL: { cog: ["O'CONNOR", "MURPHY", "BYRNE", "KELLY", "MAC GIOLLA"], m: ["CIARAN JOHN", "SEAN", "PATRICK JOSEPH"], f: ["SIOBHAN", "AOIFE MARIE", "NIAMH"], citta: ["DUBLIN", "CORK", "GALWAY", "LIMERICK"], naz: "EIREANNACH/IRISH", ente: "Passport Office, Dublin" },
  FRA: { cog: ["MOREAU", "DUPONT", "LE GALL", "MARTIN", "DE LA FONTAINE", "BERNARD"], m: ["JEAN-MARC LUC", "PIERRE", "JEAN-LUC", "THOMAS"], f: ["MARIE", "CAMILLE ANNE", "ISABELLE"], citta: ["RODEZ", "PARIS", "LYON", "MARSEILLE", "TOULOUSE"] },
  ESP: { cog: ["MORENO DIAZ", "FERNANDEZ LOPEZ", "MARTIN RUIZ", "SANCHEZ PEREZ"], m: ["CARLOS", "JOSE LUIS", "PABLO"], f: ["MARIA JOSE", "LUCIA", "CARMEN"], citta: ["MADRID", "SEVILLA", "VALENCIA", "BILBAO"] },
  DEU: { cog: ["MUELLER", "SCHMIDT", "VON DER LEYEN", "WAGNER", "FISCHER"], m: ["HANS PETER", "JURGEN", "LUKAS"], f: ["ANNA", "KATHARINA", "LENA SOPHIE"], citta: ["BERLIN", "HAMBURG", "MUENCHEN", "KOELN"], et: { cognome: "NAME", nome: "VORNAMEN", nascita: "GEBURTSDATUM", luogo: "GEBURTSORT", citt: "STAATSANGEHORIGKEIT", sesso: "GESCHLECHT", numero: "AUSWEISNUMMER", scad: "GULTIG BIS" }, testa: "BUNDESREPUBLIK DEUTSCHLAND\nPERSONALAUSWEIS / IDENTITY CARD / CARTE D'IDENTITE" },
  NLD: { cog: ["VAN DER BERG", "DE JONG", "JANSSEN", "BAKKER"], m: ["DAAN", "SEM JAN"], f: ["SANNE", "FLEUR"], citta: ["AMSTERDAM", "ROTTERDAM", "UTRECHT"], et: { cognome: "NAAM", nome: "VOORNAMEN", nascita: "GEBOORTEDATUM", luogo: "GEBOORTEPLAATS", citt: "NATIONALITEIT", sesso: "GESLACHT", numero: "DOCUMENTNUMMER", scad: "GELDIG TOT" }, testa: "KONINKRIJK DER NEDERLANDEN\nIDENTITEITSKAART / IDENTITY CARD" },
  BEL: { cog: ["VAN DAMME", "DUBOIS", "PEETERS", "MAES"], m: ["LUC", "PIETER JAN"], f: ["SARAH MONIQUE ANNE", "ELKE"], citta: ["LEUVEN", "GENT", "BRUXELLES"], et: { cognome: "NAAM", nome: "VOORNAMEN", nascita: "GEBOORTEDATUM", luogo: "GEBOORTEPLAATS", citt: "NATIONALITEIT", sesso: "GESLACHT", numero: "KAARTNUMMER", scad: "GELDIG TOT" }, testa: "BELGIE BELGIQUE BELGIEN\nIDENTITEITSKAART / IDENTITY CARD" },
  PRT: { cog: ["SILVA SANTOS", "PEREIRA", "COSTA"], m: ["JOAO PEDRO", "TIAGO"], f: ["ANA", "BEATRIZ"], citta: ["LISBOA", "PORTO", "BRAGA"], et: { cognome: "APELIDO(S)", nome: "NOME(S)", nascita: "DATA DE NASCIMENTO", luogo: "LOCAL DE NASCIMENTO", citt: "NACIONALIDADE", sesso: "SEXO", numero: "N DOCUMENTO", scad: "VALIDADE" }, testa: "REPUBLICA PORTUGUESA\nCARTAO DE CIDADAO / IDENTITY CARD" },
  POL: { cog: ["KOWALSKI", "NOWAK", "WISNIEWSKA"], m: ["PIOTR", "PAWEL ADAM"], f: ["KATARZYNA", "ANNA MARIA"], citta: ["WARSZAWA", "KRAKOW", "GDANSK"], et: { cognome: "NAZWISKO", nome: "IMIONA", nascita: "DATA URODZENIA", luogo: "MIEJSCE URODZENIA", citt: "OBYWATELSTWO", sesso: "PLEC", numero: "NUMER DOWODU", scad: "TERMIN WAZNOSCI" }, testa: "RZECZPOSPOLITA POLSKA\nDOWOD OSOBISTY / IDENTITY CARD" },
  ROU: { cog: ["POPESCU", "IONESCU", "DUMITRU"], m: ["ANDREI", "MIHAI"], f: ["ELENA", "IOANA"], citta: ["BUCURESTI", "CLUJ-NAPOCA", "IASI"], et: { cognome: "NUME", nome: "PRENUME", nascita: "DATA NASTERII", luogo: "LOC NASTERE", citt: "CETATENIE", sesso: "SEX", numero: "SERIA NR", scad: "VALABILITATE" }, testa: "ROMANIA\nCARTE DE IDENTITATE / IDENTITY CARD" },
  SVK: { cog: ["HUDAK", "HORVATH", "VARGA"], m: ["PETER", "MARTIN"], f: ["JANA", "ZUZANA"], citta: ["BRATISLAVA", "KOSICE"], et: { cognome: "PRIEZVISKO", nome: "MENO", nascita: "DATUM NARODENIA", luogo: "MIESTO NARODENIA", citt: "STATNA PRISLUSNOST", sesso: "POHLAVIE", numero: "CISLO DOKLADU", scad: "PLATNOST DO" }, testa: "SLOVENSKA REPUBLIKA\nOBCIANSKY PREUKAZ / IDENTITY CARD" },
  CZE: { cog: ["NOVAK", "SVOBODOVA", "DVORAK"], m: ["JAN", "TOMAS"], f: ["PETRA", "LUCIE"], citta: ["PRAHA", "BRNO"], et: { cognome: "PRIJMENI", nome: "JMENO", nascita: "DATUM NAROZENI", luogo: "MISTO NAROZENI", citt: "STATNI PRISLUSNOST", sesso: "POHLAVI", numero: "CISLO DOKLADU", scad: "PLATNOST DO" }, testa: "CESKA REPUBLIKA\nOBCANSKY PRUKAZ / IDENTITY CARD" },
  SWE: { cog: ["JOHANSSON", "LINDQVIST"], m: ["ERIK", "LARS OLOF"], f: ["ASTRID", "KARIN"], citta: ["STOCKHOLM", "GOTEBORG"], et: { cognome: "EFTERNAMN", nome: "FORNAMN", nascita: "FODELSEDATUM", luogo: "FODELSEORT", citt: "NATIONALITET", sesso: "KON", numero: "KORTNUMMER", scad: "GILTIG T O M" }, testa: "SVERIGE\nIDENTITETSKORT / IDENTITY CARD" },
  HRV: { cog: ["HORVAT", "KOVACEVIC"], m: ["IVAN", "LUKA"], f: ["ANA", "MARIJA"], citta: ["ZAGREB", "SPLIT"], et: { cognome: "PREZIME", nome: "IME", nascita: "DATUM RODENJA", luogo: "MJESTO RODENJA", citt: "DRZAVLJANSTVO", sesso: "SPOL", numero: "BROJ ISPRAVE", scad: "VRIJEDI DO" }, testa: "REPUBLIKA HRVATSKA\nOSOBNA ISKAZNICA / IDENTITY CARD" },
  AUT: { cog: ["GRUBER", "HUBER"], m: ["FLORIAN", "MAX"], f: ["SARAH", "JULIA"], citta: ["WIEN", "GRAZ"], et: { cognome: "NAME", nome: "VORNAME", nascita: "GEBURTSDATUM", luogo: "GEBURTSORT", citt: "STAATSANGEHORIGKEIT", sesso: "GESCHLECHT", numero: "AUSWEISNUMMER", scad: "GULTIG BIS" }, testa: "REPUBLIK OSTERREICH\nPERSONALAUSWEIS / IDENTITY CARD" },
  CHE: { cog: ["MULLER", "MEIER", "ROSSINI"], m: ["URS", "NICOLA"], f: ["SILVIA", "LEA"], citta: ["ZURICH", "LUGANO", "GENEVE"] },
  USA: { cog: ["JOHNSON", "MILLER", "O'BRIEN", "GARCIA"], m: ["MICHAEL JAMES", "DAVID"], f: ["JENNIFER", "SARAH ANN"], citta: ["NEW YORK, U.S.A.", "TEXAS, U.S.A.", "CALIFORNIA, U.S.A."], ente: "United States Department of State" },
  CAN: { cog: ["TREMBLAY", "ROY"], m: ["LUC", "ETHAN"], f: ["CHLOE", "EMILY"], citta: ["MONTREAL", "TORONTO"], ente: "GATINEAU" },
  AUS: { cog: ["WILSON", "TAYLOR"], m: ["JACK", "LIAM"], f: ["OLIVIA", "CHARLOTTE"], citta: ["SYDNEY", "MELBOURNE"], ente: "AUSTRALIA" },
  BRA: { cog: ["DA SILVA", "OLIVEIRA SANTOS"], m: ["JOAO", "LUCAS"], f: ["ANA CLARA", "MARIANA"], citta: ["SAO PAULO", "RIO DE JANEIRO"], ente: "POLICIA FEDERAL" },
  ARG: { cog: ["GONZALEZ", "FERNANDEZ"], m: ["MATEO", "SANTIAGO"], f: ["SOFIA", "VALENTINA"], citta: ["BUENOS AIRES", "ROSARIO"], ente: "RENAPER" },
  CHN: { cog: ["WANG", "ZHANG", "LI"], m: ["XIAOMING", "WEI"], f: ["LI NA", "FANG"], citta: ["BEIJING", "SHANGHAI"], ente: "NATIONAL IMMIGRATION ADMINISTRATION" },
  JPN: { cog: ["TANAKA", "SATO"], m: ["HIROSHI", "TAKUMI"], f: ["YUKI", "SAKURA"], citta: ["TOKYO", "OSAKA"], ente: "MINISTRY OF FOREIGN AFFAIRS" },
  IND: { cog: ["SHARMA", "PATEL"], m: ["RAHUL", "ARJUN"], f: ["PRIYA", "ANANYA"], citta: ["MUMBAI", "DELHI"], ente: "MUMBAI" },
  MAR: { cog: ["EL AMRANI", "BENALI"], m: ["YOUSSEF", "MOHAMED"], f: ["FATIMA ZAHRA", "SALMA"], citta: ["CASABLANCA", "RABAT"], ente: "RABAT" },
  TUR: { cog: ["YILMAZ", "KAYA"], m: ["EMRE", "MEHMET ALI"], f: ["ELIF", "ZEYNEP"], citta: ["ISTANBUL", "ANKARA"], ente: "T.C. ICISLERI BAKANLIGI" },
  UKR: { cog: ["SHEVCHENKO", "KOVALENKO"], m: ["OLEKSANDR", "DMYTRO"], f: ["OLENA", "IRYNA"], citta: ["KYIV", "LVIV"], ente: "8044" },
  ALB: { cog: ["HOXHA", "SHEHU"], m: ["ARBEN", "ENEA"], f: ["ELONA", "ANA"], citta: ["TIRANE", "DURRES"], ente: "MPB" },
  GRC: { cog: ["PAPADOPOULOS", "GEORGIOU"], m: ["NIKOLAOS", "GIORGOS"], f: ["MARIA", "ELENI"], citta: ["ATHINA", "THESSALONIKI"], ente: "HELLENIC POLICE" },
  NOR: { cog: ["HANSEN", "JOHANSEN"], m: ["OLE", "MAGNUS"], f: ["INGRID", "NORA"], citta: ["OSLO", "BERGEN"], ente: "POLITIET" },
  HUN: { cog: ["NAGY", "KOVACS"], m: ["BENCE", "LASZLO"], f: ["ANNA", "REKA"], citta: ["BUDAPEST", "DEBRECEN"], ente: "BM" },
};
const COMUNI = [["ROMA", "RM"], ["VELLETRI", "RM"], ["POTENZA", "PZ"], ["NUORO", "NU"], ["FOGGIA", "FG"], ["SAN SEVERO", "FG"], ["CASTELNOVO NE' MONTI", "RE"], ["ANZIO", "RM"], ["SIENA", "SI"], ["CASSINO", "FR"], ["GAETA", "LT"], ["LATINA", "LT"], ["CATANIA", "CT"], ["LAURIA", "PZ"], ["GENOVA", "GE"], ["MILANO", "MI"], ["NAPOLI", "NA"], ["FRASCATI", "RM"], ["REGGIO NELL'EMILIA", "RE"], ["SANT'AGATA DE' GOTI", "BN"]];
const ESTERI_IT = [["PARIGI", "FRA"], ["MOSCA", "SUN"], ["ST.TRUIDEN", "BEL"], ["BRIGHTON", "GBR"], ["DOVER", "GBR"], ["BUENOS AIRES", "ARG"], ["ZURIGO", "CHE"], ["TIRANA", "ALB"]];
const RILASCIO_IT = ["MARINO", "ROMA", "FRASCATI", "LAVELLO", "SUBIACO", "ACIREALE", "SCHIO", "SPERLONGA", "MENTANA", "COMACCHIO", "BIBBIENA", "CASSINO", "ANZIO", "LUCERA"];

function nascita(min, max) { return { g: int(1, 28), m: int(1, 12), a: int(min || 1940, max || 2007) }; }
const dIT = (n, sep) => p2(n.g) + (sep || "/") + p2(n.m) + (sep || "/") + n.a;
const dMRZ = (n) => String(n.a).slice(2) + p2(n.m) + p2(n.g);
const futura = () => ({ g: int(1, 28), m: int(1, 12), a: int(2027, 2036) });
const passata = () => ({ g: int(1, 28), m: int(1, 12), a: int(2016, 2026) });
const pad = (s, n) => (s + "<".repeat(n)).slice(0, n);
const mrzN = (c, n) => N(c.replace(/[ \-']/g, "<").replace(/</g, "§")).replace(/§/g, "<");
function mrzNome(c, n) { return c.replace(/[ \-]/g, "<").replace(/'/g, "") + "<<" + n.replace(/[ \-]/g, "<"); }
function td3(p, num, emi) {
  const n9 = pad(num, 9), l1 = pad("P<" + emi + mrzNome(p.c, p.n), 44);
  const corpo = n9 + MRZ.cd(n9) + p.citt + dMRZ(p.d) + MRZ.cd(dMRZ(p.d)) + p.s + dMRZ(p.scad) + MRZ.cd(dMRZ(p.scad)) + "<".repeat(14) + "<";
  const fin = MRZ.cd(n9 + MRZ.cd(n9) + dMRZ(p.d) + MRZ.cd(dMRZ(p.d)) + dMRZ(p.scad) + MRZ.cd(dMRZ(p.scad)) + "<".repeat(14) + "<");
  return l1 + "\n" + corpo + fin;
}
function td1(p, num, emi) {
  const n9 = pad(num, 9), l1 = pad((emi === "ITA" ? "C<" : "ID") + emi + n9 + MRZ.cd(n9), 30);
  const l2a = dMRZ(p.d) + MRZ.cd(dMRZ(p.d)) + p.s + dMRZ(p.scad) + MRZ.cd(dMRZ(p.scad)) + p.citt, l2 = pad(l2a, 29);
  const fin = MRZ.cd(l1.slice(5, 30) + l2.slice(0, 7) + l2.slice(8, 15) + l2.slice(18, 29));
  return l1 + "\n" + l2 + fin + "\n" + pad(mrzNome(p.c, p.n), 30);
}

/* ---------- modelli di documento: testo «come esce dall'OCR» + valori veri ---------- */
const MODELLI = {
  CIE(p, opz) { // carta d'identità elettronica italiana (fronte), come nelle foto vere
    const estero = p.estero;
    const luogo = estero ? estero[0] + " (" + estero[1] + ")" : p.comune[0] + " (" + p.comune[1] + ")";
    const righe = ["REPUBBLICA ITALIANA", "MINISTERO DELL'INTERNO", "CARTA DI IDENTITA / IDENTITY CARD", p.num, "COMUNE DI / MUNICIPALITY", p.ril,
      "COGNOME / SURNAME", p.c, "NOME / NAME", p.n, "LUOGO E DATA DI NASCITA", "PLACE AND DATE OF BIRTH", luogo + " " + dIT(p.d, ".")];
    if (opz.sparso) righe.push("SESSO", "SEX", p.s, "STATURA", "HEIGHT", String(int(150, 195)), "CITTADINANZA", "NATIONALITY", "ITA");
    else righe.push("SESSO STATURA CITTADINANZA", "SEX HEIGHT NATIONALITY", p.s + " " + int(150, 195) + " ITA");
    righe.push("EMISSIONE / ISSUING", dIT(passata(), "."), "SCADENZA / EXPIRY", dIT(p.scad, "."), "FIRMA DEL TITOLARE", "HOLDER'S SIGNATURE", rd(6));
    if (opz.retro) righe.push("", "CODICE FISCALE / FISCAL CODE", rl(6) + rd(2) + rl(1) + rd(2) + rl(1) + rd(3) + rl(1), "", td1({ ...p, citt: "ITA" }, p.num, "ITA"));
    return { testo: righe.join("\n"), vero: { citt: "ITA", tipo: "IDELE", ril: p.ril, luogo: estero ? estero[1] : p.comune[0] } };
  },
  PATENTE(p) {
    const mc = pick([["MC-" + p.comune[1], CAPO[p.comune[1]] || ""], ["MIT-UCO", "ROMA"], ["UCO", "ROMA"]]);
    const t = ["PATENTE DI GUIDA REPUBBLICA ITALIANA", "1. " + p.c, "2. " + p.n, "3. " + p2(p.d.g) + "/" + p2(p.d.m) + "/" + String(p.d.a).slice(2) + " " + p.comune[0] + " (" + p.comune[1] + ")",
      "4a. " + dIT(passata()) + " 4c. " + mc[0], "4b. " + dIT(p.scad), "5. " + p.num, "7.", "9. " + pick(["B", "AM B", "A B"])].join("\n");
    return { testo: t, vero: { tipo: "PATEN", ril: mc[1], luogo: p.comune[0], noSesso: true, noCitt: true } };
  },
  CARTACEA(p) { // carta d'identità cartacea italiana
    const t = ["REPUBBLICA ITALIANA", "COMUNE DI " + p.ril, "CARTA D'IDENTITA N. " + p.num, "Cognome " + p.c, "Nome " + p.n, "nato il " + dIT(p.d, "."), "(atto n. " + int(1, 900) + " P. I S. A)",
      "a " + p.comune[0] + " (" + p.comune[1] + ")", "Cittadinanza ITALIANA", "Residenza " + p.ril, "Via " + pick(["ROMA", "GARIBALDI", "MAZZINI"]) + " " + int(1, 99), "Stato civile " + pick(["CELIBE", "NUBILE", "CONIUGATO"]),
      "Professione " + pick(["IMPIEGATO", "STUDENTE"]), "CONNOTATI E CONTRASSEGNI SALIENTI", "Statura " + int(150, 195), "Scadenza " + dIT(p.scad, ".")].join("\n");
    return { testo: t, vero: { citt: "ITA", tipo: "IDENT", ril: p.ril, luogo: p.comune[0], noSesso: true } };
  },
  PASS_UK(p, opz) { // passaporto britannico/irlandese: etichette inglese/francese numerate, sesso e luogo sulla stessa riga
    const em = p.paese, dd = (n) => p2(n.g) + " " + MESI_EN[n.m - 1] + " /" + MESI_FR[n.m - 1].slice(0, 3) + " " + String(n.a).slice(2);
    const righe = [em === "GBR" ? "UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND" : "EIRE/IRELAND/IRLANDE", "PASSPORT", "PASSEPORT", "Type/Type Code/Code Passport No./Passeport No.", "P " + em + " " + p.num,
      "Surname/Nom (1)", p.c, "Given names/Prenoms (2)", p.n, "Nationality/Nationalite (3)", P[em].naz, "Date of birth/Date de naissance (4)", dd(p.d),
      "Sex/Sexe (5) Place of birth/Lieu de naissance (6)", p.s + " " + p.citta, "Date of issue/Date de delivrance (7) Authority/Autorite (8)", dd(passata()) + " " + P[em].ente,
      "Date of expiry/Date d'expiration (9)", dd(p.scad)];
    if (opz.mrz) righe.push("", td3({ ...p, citt: em }, p.num, em));
    return { testo: righe.join("\n"), vero: { citt: em, tipo: "PASOR", ril: em, luogo: p.citta } };
  },
  PASS_INT(p, opz) { // passaporto generico: inglese con francese/spagnolo, valori sotto
    const em = p.paese, dd = (n) => p2(n.g) + " " + MESI_EN[n.m - 1] + " " + n.a;
    const righe = ["PASSPORT", MRZ.PAESI[em] ? em : "", "Type / Type / Tipo", "P", "Passport No. / No. du Passeport / No. del Pasaporte", p.num, "Surname / Nom / Apellidos", p.c,
      "Given Names / Prenoms / Nombres", p.n, "Nationality / Nationalite / Nacionalidad", em, "Date of birth / Date de naissance / Fecha de nacimiento", dd(p.d),
      "Place of birth / Lieu de naissance / Lugar de nacimiento", p.citta, "Sex / Sexe / Sexo", p.s, "Date of issue / Date de delivrance / Fecha de expedicion", dd(passata()),
      "Date of expiration / Date d'expiration / Fecha de caducidad", dd(p.scad), "Authority / Autorite / Autoridad", P[em].ente || em];
    if (opz.mrz) righe.push("", td3({ ...p, citt: em }, p.num, em));
    return { testo: righe.join("\n"), vero: { citt: em, tipo: "PASOR", ril: em, luogo: p.citta.replace(/,.*$/, "") } };
  },
  CNI_FR(p, opz) { // carta d'identità francese 2021: sesso, nazionalità e data sulla stessa riga
    const righe = ["REPUBLIQUE FRANCAISE", "CARTE NATIONALE D'IDENTITE / IDENTITY CARD", "NOM / Surname", p.c, "Prenoms / Given names", p.n.split(" ").map((w) => w[0] + w.slice(1).toLowerCase()).join(", "),
      "SEXE / Sex NATIONALITE / Nationality DATE DE NAISS. / Date of birth", p.s + " FRA " + p2(p.d.g) + " " + p2(p.d.m) + " " + p.d.a, "LIEU DE NAISSANCE / Place of birth", p.citta,
      "N DU DOCUMENT / Document No. DATE D'EXPIR / Expiry date", p.num + " " + p2(p.scad.g) + " " + p2(p.scad.m) + " " + p.scad.a, rd(6)];
    if (opz.mrz) righe.push("", td1({ ...p, citt: "FRA" }, p.num, "FRA"));
    return { testo: righe.join("\n"), vero: { citt: "FRA", tipo: "IDENT", ril: "FRA", luogo: p.citta } };
  },
  DNI_ES(p, opz) { // DNI spagnolo: cognomi su due righe, data con spazi, niente luogo di nascita sul fronte
    const ap = p.c.split(" ");
    const righe = ["REINO DE ESPANA", "DOCUMENTO NACIONAL DE IDENTIDAD", "DNI " + rd(8) + rl(1), "APELLIDOS", ap[0], ap.slice(1).join(" ") || "", "NOMBRE", p.n, "SEXO NACIONALIDAD", p.s + " ESP",
      "FECHA DE NACIMIENTO", p2(p.d.g) + " " + p2(p.d.m) + " " + p.d.a, "EMISION VALIDEZ", dIT(passata(), " ") + " " + dIT(p.scad, " "), "NUM SOPORTE", p.num, rd(6), "NATIONAL IDENTITY CARD / DOCUMENTO NACIONAL IDENTIDAD"].filter((x) => x !== "");
    if (opz.mrz) righe.push("", td1({ ...p, citt: "ESP" }, p.num, "ESP"));
    return { testo: righe.join("\n"), vero: { citt: "ESP", tipo: "IDENT", ril: "ESP", noLuogo: true } };
  },
  ID_EU(p, opz) { // carta d'identità europea: etichetta nella lingua del posto / inglese, valore sotto
    const e = P[p.paese].et, dd = dIT(p.d, pick([".", "/", " "]));
    const righe = [P[p.paese].testa, p.num, e.cognome + " / SURNAME", p.c, e.nome + " / GIVEN NAMES", p.n, e.sesso + " / SEX", p.s, e.citt + " / NATIONALITY", p.paese,
      e.nascita + " / DATE OF BIRTH", dd, e.luogo + " / PLACE OF BIRTH", p.citta, e.numero + " / DOCUMENT NO", p.num, e.scad + " / DATE OF EXPIRY", dIT(p.scad, ".")];
    if (opz.mrz) righe.push("", td1({ ...p, citt: p.paese }, p.num, p.paese));
    return { testo: righe.join("\n"), vero: { citt: p.paese, tipo: "IDENT", ril: p.paese, luogo: p.citta } };
  },
  ID_RIGA(p) { // «Etichetta: valore» sulla stessa riga (testo copiato da un modulo o da una mail)
    const righe = ["IDENTITY CARD", "Surname: " + p.c, "Given names: " + p.n, "Sex: " + p.s, "Date of birth: " + dIT(p.d, "."), "Place of birth: " + p.citta, "Nationality: " + p.paese, "Document No: " + p.num, "Issuing state: " + p.paese];
    return { testo: righe.join("\n"), vero: { citt: p.paese, tipo: "IDENT", ril: p.paese, luogo: p.citta } };
  },
};
const CAPO = INC.CAPOLUOGO;

/* ---------- rumore dell'OCR ---------- */
const FORME = { R: "B", C: "O", O: "0", I: "l", N: "H", S: "5", E: "F", U: "V", M: "N", H: "N", T: "I", A: "4", G: "6", B: "8", L: "I", D: "O" };
function storpia(w) { // una lettera sbagliata, mancante o minuscola
  if (w.length < 5) return w;
  const i = int(1, w.length - 2), r = R();
  if (r < 0.45 && FORME[w[i]]) return w.slice(0, i) + FORME[w[i]] + w.slice(i + 1);
  if (r < 0.7) return w.slice(0, i) + w.slice(i + 1);
  return w.slice(0, i) + w[i].toLowerCase() + w.slice(i + 1);
}
const SCHERMO = ["02:12 N", "18:40 5G", "4G «_)", "et", "leri", "eco", "16:00", "Rispondi", "a!", "ee Rs", "+39 331 726 6401", "2 foto", "Scansionato con CamScanner", "ago 19, Doc 1", "~LZ", "<", "«", "ae"];
const SPORCO = ["%", "_", "«", "|", "~", "' a", "E ve", "ee", "= \\"];
function etichetta(r) { return /^[A-Z'][A-Z' .()\/,]+$/.test(r) && !/\d/.test(r) && r.length > 3 && /(SURNAME|NAME|NOME|BIRTH|NASCITA|SESSO|SEX|NATIONAL|CITTADIN|EXPIR|ISSU|EMISSIONE|SCADENZA|STATURA|HEIGHT|MUNICIPALITY|FIRMA|SIGNATURE|NOM|PRENOM|APELLIDOS|NOMBRE|SEXO|NACIMIENTO|NAISS|DOCUMENT|AUTHORITY|NUMER|PRIEZVISKO|MENO|NAAM|VOORNAMEN|NAZWISKO|IMIONA|PRENUME|NUME|GEBURT|VORNAME)/i.test(r); }
function rumore(testo, liv) {
  if (liv === "pulito") return testo;
  const forte = liv === "pessima", righe = testo.split("\n"), out = [];
  const pIn = forte ? 0.35 : 0.15;
  for (let k = 0; k < int(2, forte ? 7 : 4); k++) out.push(pick(SCHERMO)); // la barra di stato e l'intestazione dello screenshot
  righe.forEach((r) => {
    if (/<</.test(r)) { // riga MRZ: qualche «<» letto «c» o «e», raramente
      out.push(caso(forte ? 0.5 : 0.25) ? r.replace(/<{3,}$/, (m) => m.split("").map(() => (caso(0.5) ? "c" : "<")).join("")) : r); return;
    }
    let x = r;
    if (etichetta(x)) {
      if (caso(forte ? 0.6 : 0.35)) x = x.split(/(\s+|\/)/).map((w) => (/^[A-Z]{5,}$/.test(w) && caso(0.5) ? storpia(w) : w)).join("");
      if (caso(forte ? 0.25 : 0.1)) x = x.replace(/ \/ /, pick([" 7 ", "I ", " | ", " /", " "]));
      if (caso(forte ? 0.15 : 0.05) && x.length > 12) x = x.slice(int(2, 4)); // l'inizio tagliato («ME / SURNAME»)
      if (forte && caso(0.08)) return; // una riga d'etichetta persa
    } else if (x.trim()) {
      if (caso(forte ? 0.3 : 0.12)) x = x + " " + pick(SPORCO);
      if (caso(forte ? 0.15 : 0.05)) x = pick(SPORCO) + " " + x;
      if (caso(forte ? 0.3 : 0.1)) x = x.replace(/\(([A-Z]{2})\)/, (m, pr) => "(" + pr.replace("S", "5").replace("I", "1").replace("Z", "2").replace("O", "0") + ")").replace(/\(/, pick(["(", "{", "("]));
      if (caso(forte ? 0.2 : 0.06) && /^[A-Z][A-Z' \-]{3,}$/.test(x)) { const i = int(1, x.length - 2); if (x[i] !== " ") x = x.slice(0, i) + x[i].toLowerCase() + x.slice(i + 1); } // «BaRBA»
    }
    out.push(x);
    if (caso(pIn)) out.push(pick(SCHERMO));
  });
  for (let k = 0; k < int(1, forte ? 6 : 3); k++) out.push(pick(SCHERMO));
  if (forte && caso(0.3)) { // ordine sparso di due righe vicine (lettura per colonne)
    const i = int(3, out.length - 3); const tmp = out[i]; out[i] = out[i + 1]; out[i + 1] = tmp;
  }
  return out.join("\n");
}

/* ---------- 850 documenti ---------- */
function persona(paese) {
  const P0 = P[paese], s = caso(0.5) ? "M" : "F";
  return { paese, c: pick(P0.cog), n: pick(s === "M" ? P0.m : P0.f), s, d: nascita(1935, 2007), scad: futura(), citta: P0.citta ? pick(P0.citta) : "" };
}
function genera() {
  const D = [], livelli = [["pulito", 300], ["foto", 350], ["pessima", 200]];
  const piano = [ // [modello, paese o lista, peso]
    ["CIE", ["ITA"], 26], ["PATENTE", ["ITA"], 8], ["CARTACEA", ["ITA"], 5], ["PASS_UK", ["GBR", "IRL"], 10], ["CNI_FR", ["FRA"], 6], ["DNI_ES", ["ESP"], 6],
    ["ID_EU", ["DEU", "NLD", "BEL", "PRT", "POL", "ROU", "SVK", "CZE", "SWE", "HRV", "AUT"], 18],
    ["PASS_INT", ["USA", "CAN", "AUS", "BRA", "ARG", "CHN", "JPN", "IND", "MAR", "TUR", "UKR", "ALB", "GRC", "NOR", "HUN", "CHE"], 16], ["ID_RIGA", ["USA", "CHE", "GRC", "NOR", "HUN", "UKR", "TUR"], 5]];
  const tot = piano.reduce((a, x) => a + x[2], 0);
  let i = 0;
  livelli.forEach(([liv, quanti]) => {
    for (let k = 0; k < quanti; k++) {
      let r = R() * tot, sc = piano[0]; for (const x of piano) { r -= x[2]; if (r <= 0) { sc = x; break; } }
      const paese = pick(sc[1]), p = persona(paese);
      if (paese === "ITA") { p.comune = pick(COMUNI); p.ril = pick(RILASCIO_IT); if (sc[0] === "CIE" && caso(0.12)) p.estero = pick(ESTERI_IT); }
      p.num = sc[0] === "CIE" ? "C" + pick(["A", "A", "B"]) + rd(5) + rl(2) : sc[0] === "PATENTE" ? (caso(0.5) ? p.comune[1] + rd(7) + rl(1) : "U1" + rd(2) + rl(1) + rd(4) + rl(1)) : sc[0] === "CARTACEA" ? rl(2) + rd(7)
        : sc[0] === "CNI_FR" ? rl(2) + rd(2) + rl(1) + rd(1) + rl(1) + rd(2) : sc[0] === "DNI_ES" ? rl(3) + rd(6) : paese === "GBR" || paese === "IRL" ? (paese === "IRL" ? rl(2) + rd(7) : rd(9)) : rl(2) + rd(7);
      const opz = { sparso: caso(0.4), retro: caso(0.25), mrz: caso(0.55) };
      const m = MODELLI[sc[0]](p, opz);
      D.push({ i: ++i, liv, modello: sc[0], paese, testo: rumore(m.testo, liv), pulito: m.testo,
        vero: Object.assign({ cognome: p.c, nome: p.n, sesso: p.s, data_nascita: dIT(p.d), numero: p.num }, m.vero) });
    }
  });
  return D;
}

/* ---------- confronto ---------- */
const NAZ = { GBR: ["REGNO UNITO", "BRITISH CITIZEN"], IRL: ["IRLANDA"], ITA: ["ITALIA"], FRA: ["FRANCIA"], ESP: ["SPAGNA"] };
function stessoPaese(v, iso) { if (!v) return false; const n = N(v); return n === iso || n === N(MRZ.PAESI[iso] || "") || (NAZ[iso] || []).some((x) => N(x) === n); }
function confronta(p, v) {
  const r = {};
  r.cognome = N(p.cognome) === N(v.cognome);
  r.nome = N(p.nome) === N(v.nome);
  r.sesso = v.noSesso ? (p.sesso ? false : null) : p.sesso === v.sesso;
  r.data = p.data_nascita === v.data_nascita;
  if (!v.noLuogo && v.luogo) { const cand = [p.comune_nascita, p.luogo_nascita, p.stato_nascita].filter(Boolean); r.luogo = cand.some((x) => N(x) === N(v.luogo) || stessoPaese(x, v.luogo)); } else r.luogo = null;
  r.citt = v.noCitt ? (p.cittadinanza ? false : null) : stessoPaese(p.cittadinanza, v.citt);
  r.numero = N(p.numero_documento) === N(v.numero);
  r.tipo = !v.tipo ? null : p.tipo_documento === v.tipo || (v.tipo === "IDELE" && p.tipo_documento === "IDENT");
  r.rilascio = !v.ril ? null : (p.rilascio_comune && N(p.rilascio_comune) === N(v.ril)) || stessoPaese(p.rilascio_stato, v.ril) || stessoPaese(p.rilascio_comune, v.ril);
  return r;
}

if (require.main === module) {
  const arg = (n) => { const a = process.argv.find((x) => x.startsWith("--" + n + "=")); return a ? a.split("=")[1] : ""; };
  const mostra = process.argv.includes("--errori"), solo = { liv: arg("livello"), paese: arg("paese"), modello: arg("modello") };
  const D = genera().filter((d) => (!solo.liv || d.liv === solo.liv) && (!solo.paese || d.paese === solo.paese) && (!solo.modello || d.modello === solo.modello));
  const campi = ["cognome", "nome", "sesso", "data", "luogo", "citt", "numero", "tipo", "rilascio"];
  const tot = {}, perLiv = {}, perMod = {}, perPaese = {}; let n = 0, perfetti = { pulito: [0, 0], foto: [0, 0], pessima: [0, 0] }, persone1 = 0;
  D.forEach((d) => {
    const ps = INC.leggi(d.testo).persone; if (ps.length === 1) persone1++;
    const p = ps.sort((a, b) => Object.keys(b).length - Object.keys(a).length)[0] || {};
    const r = confronta(p, d.vero); let tutto = true;
    campi.forEach((k) => {
      if (r[k] === null) return;
      [tot, perLiv[d.liv] = perLiv[d.liv] || {}, perMod[d.modello] = perMod[d.modello] || {}, perPaese[d.paese] = perPaese[d.paese] || {}].forEach((T) => { T[k] = T[k] || [0, 0]; T[k][1]++; if (r[k]) T[k][0]++; });
      if (!r[k]) { tutto = false; if (mostra && n++ < 60) console.log("  #" + d.i + " [" + d.liv + " " + d.modello + " " + d.paese + "] " + k + ": atteso «" + (k === "data" ? d.vero.data_nascita : k === "citt" ? d.vero.citt : k === "numero" ? d.vero.numero : k === "rilascio" ? d.vero.ril : k === "tipo" ? d.vero.tipo : d.vero[k === "luogo" ? "luogo" : k]) + "» letto «" + (k === "data" ? p.data_nascita : k === "citt" ? p.cittadinanza : k === "numero" ? p.numero_documento : k === "rilascio" ? (p.rilascio_comune || p.rilascio_stato || "") : k === "tipo" ? p.tipo_documento : k === "luogo" ? [p.comune_nascita, p.luogo_nascita, p.stato_nascita].filter(Boolean).join("|") : p[k]) + "»"); }
    });
    perfetti[d.liv][1]++; if (tutto) perfetti[d.liv][0]++;
  });
  const pc = (x) => x ? (100 * x[0] / x[1]).toFixed(1) + "%" : "-";
  const somma = (T) => { let a = 0, b = 0; Object.values(T).forEach((x) => { a += x[0]; b += x[1]; }); return [a, b]; };
  console.log("BANCO «MONDO»: " + D.length + " documenti sintetici, " + Object.keys(perPaese).length + " paesi, " + Object.keys(perMod).length + " modelli");
  console.log("Per campo:"); campi.forEach((k) => console.log("  " + k.padEnd(10) + pc(tot[k]).padStart(7) + "  (" + (tot[k] ? tot[k][0] + "/" + tot[k][1] : "-") + ")"));
  console.log("Per livello di qualità (campi giusti · documenti perfetti):"); Object.keys(perLiv).forEach((l) => console.log("  " + l.padEnd(9) + pc(somma(perLiv[l])).padStart(7) + " · " + pc(perfetti[l])));
  console.log("Per modello:"); Object.keys(perMod).forEach((m) => console.log("  " + m.padEnd(10) + pc(somma(perMod[m])).padStart(7)));
  console.log("Per paese:"); console.log("  " + Object.keys(perPaese).map((p) => p + " " + pc(somma(perPaese[p]))).join(" · "));
  console.log("Una sola persona letta (non spezzata): " + pc([persone1, D.length]));
  const s = somma(tot); console.log("CAMPI GIUSTI IN TOTALE: " + pc(s) + " (" + s[0] + "/" + s[1] + ")");
}
module.exports = { genera, confronta };
