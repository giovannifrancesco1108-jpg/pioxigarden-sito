# Gestionale Alloggiati Web – note per Claude Code

Pannello admin (`/admin/alloggiati/`) + worker Cloudflare che invia le schedine alla Polizia di Stato (Alloggiati Web). Il proprietario lavora solo da telefono: tutto deve funzionare lì, anche offline.

## Comandi di prova (da lanciare prima di ogni commit)
- `node tests/alloggiati.test.js` – prove unitarie (lettura testo, MRZ, codice fiscale, controlli)
- `node tests/server.test.mjs` – controlli lato server (168 caratteri, ID appartamento)
- (scanner in `admin/alloggiati/scanner.js`, prove incluse in `tests/alloggiati.test.js`)
- `node tests/corpus/run.js` – 185 documenti sintetici di 39 nazionalità, 150 incolla (singoli, coppie, terzetti). Deve dare 100%.
- `node tests/corpus/run.js --duro --errori` – versione "sporca" (O/0, minuscole, righe spazzatura, documenti attaccati). Elenca i campi sbagliati: è la lista di cosa migliorare. Opzioni: `--tipo=`, `--min=`.
- `node tests/corpus/layout.js [--sporco] [--errori]` – 360 documenti in inglese con 6 impaginazioni diverse (etichetta:valore, sopra, sotto, elenco, coppie). Normale ~95%, `--sporco` ~49% (righe spazzatura tra etichetta e valore): è il punto da migliorare.

## Regole
1. Solo dati sintetici nei test. Mai dati reali di ospiti nel repo, nei log o nei test.
2. Non salvare dati degli ospiti: restano nella pagina finché non vengono inviati.
3. L'AI è l'ultima spiaggia: prima lettura offline (`incolla.js`, `mrz.js`), l'AI solo come secondo parere, e le differenze vanno mostrate all'utente.
4. Nessun inserimento automatico: ciò che viene letto passa dalla schermata "Controlla prima di inserire" (`mostraRevisione` in `index.html`).
5. Più documenti incollati = più persone (`INC.dividi`, `blocchi`, `raggruppa`). Il capo famiglia/gruppo è il più grande.
6. Tracciato schedina: 168 caratteri (la pagina ne aggiunge 6 con l'ID appartamento, il server li toglie). Non cambiare le posizioni senza aggiornare `controllaSchedine`.
7. Codici (documenti, luoghi, stati) sempre dalle tabelle scaricate dal portale, mai inventati.
8. Non modificare `main` direttamente: branch + PR, il proprietario fa il merge dal telefono. Dopo ogni modifica visibile aumenta l'etichetta verde "VERSIONE n" in `index.html`.

## Dove sono i punti deboli (da `--duro`)
Casi con documento diverso incollato di seguito senza riga vuota (passaporto-it + CIE riga unica), CIE con etichette + CF + MRZ che viene letta come 3 persone, luogo di nascita "a CITTÀ (PR)" in cartacea. Quando ne risolvi uno, aggiungi un test in `tests/alloggiati.test.js`.

## Struttura
- `admin/alloggiati/incolla.js` lettura del testo incollato (UMD, oggetto `INC`)
- `admin/alloggiati/mrz.js` MRZ ICAO 9303 con cifre di controllo
- `admin/alloggiati/controlli.js` controlli per campo e d'insieme
- `lib/alloggiati.js`, `worker/alloggiati.js` SOAP + rotte del worker
- `tests/corpus/genera.js` generatore sintetico con seme fisso
