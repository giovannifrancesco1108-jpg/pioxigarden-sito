# Gestionale Alloggiati Web – note per Claude Code

Pannello admin (`/admin/alloggiati/`) + worker Cloudflare che invia le schedine alla Polizia di Stato (Alloggiati Web). Il proprietario lavora solo da telefono: tutto deve funzionare lì, anche offline.

## Comandi di prova (da lanciare prima di ogni commit)
- `node tests/alloggiati.test.js` – prove unitarie (lettura testo, MRZ, codice fiscale, controlli)
- `node tests/server.test.mjs` – controlli lato server (168 caratteri, ID appartamento)
- `node tests/comuni.test.js` – ricerca di comuni/stati con nomi sporchi (GENZAN0, SANT AGATA, «… (RM) 11.08.2003»), comuni omonimi decisi dalla provincia, nessun comune inventato; controlla anche che lo script della pagina sia JavaScript valido
- (scanner in `admin/alloggiati/scanner.js`, prove incluse in `tests/alloggiati.test.js`)
- `node tests/corpus/run.js` – 185 documenti sintetici di 39 nazionalità, 150 incolla (singoli, coppie, terzetti). Deve dare 100%.
- `node tests/corpus/run.js --duro --errori` – versione "sporca" (O/0, minuscole, righe spazzatura, documenti attaccati). Elenca i campi sbagliati: è la lista di cosa migliorare. Opzioni: `--tipo=`, `--min=`.
- `node tests/corpus/layout.js [--sporco] [--errori]` – 360 documenti in inglese con 6 impaginazioni diverse (etichetta:valore, sopra, sotto, elenco, coppie). Normale ~96%, `--sporco` ~56%.
- `node tests/corpus/mondo.js [--errori] [--livello=foto|pulito|pessima] [--paese=FRA] [--modello=CIE]` – banco «mondo»: 1150 documenti sintetici di 32 paesi e 9 modelli (CIE, patente, cartacea, passaporto UK/IE, CNI francese, DNI spagnolo, carte UE bilingui, passaporti extra UE, «Etichetta: valore»), con il rumore dell'OCR visto nelle foto vere. Misura anche tipo e luogo di rilascio. Livelli: pulito, foto, pessima e «copia» (testo copiato dal telefono con Testo dal vivo: etichette spezzate, righe in disordine). Oggi: pulito ~99%, foto ~95%, pessima ~90%, copia ~93%, totale ~95%. Non deve scendere.
- Collaudo della lettura FOTO nella pagina vera (Chrome + puppeteer + tesseract installati): `python3 tests/collaudo/genera_foto.py /tmp/fs` crea 24 foto sintetiche (dati inventati) con `veri.json`; poi `node tests/collaudo/browser.js --foto=/tmp/fs --out=/tmp/r.json [--riprova]` le carica nel campo foto come dal telefono (Tesseract.js sostituito dallo stesso motore con lo stesso modello) e `node tests/collaudo/voto.js /tmp/r.json /tmp/fs/veri.json [riprova] [-v]` dà il punteggio. Le foto VERE degli ospiti non vanno mai nel repo: si usano solo da una cartella esterna e i risultati restano in /tmp.

## Regole
1. Solo dati sintetici nei test. Mai dati reali di ospiti nel repo, nei log o nei test.
2. Non salvare dati degli ospiti: restano nella pagina finché non vengono inviati.
3. L'AI è l'ultima spiaggia: prima lettura offline (`incolla.js`, `mrz.js`), l'AI solo come secondo parere, e le differenze vanno mostrate all'utente.
4. Nessun inserimento automatico: ciò che viene letto passa dalla schermata "Controlla prima di inserire" (`mostraRevisione` in `index.html`).
5. Più documenti incollati = più persone (`INC.dividi`, `blocchi`, `raggruppa`). Il capo famiglia/gruppo è il più grande.
6. Tracciato schedina: 168 caratteri (la pagina ne aggiunge 6 con l'ID appartamento, il server li toglie). Non cambiare le posizioni senza aggiornare `controllaSchedine`.
7. Codici (documenti, luoghi, stati) sempre dalle tabelle scaricate dal portale, mai inventati.
8. Non modificare `main` direttamente: branch + PR, il proprietario fa il merge dal telefono. Dopo ogni modifica visibile aumenta l'etichetta verde "VERSIONE n" in `index.html`.

## Incolla (il modo più preciso)
Tasto «Incolla e leggi» (`incVai`): legge gli appunti e parte subito con la lettura larga; incollare nel riquadro fa partire la lettura da sola. Il testo arriva quasi sempre dal riconoscimento testo del telefono (Foto → tieni premuto → Seleziona tutto → Copia, oppure «Scansiona testo» della tastiera): OCR ottimo, righe in disordine. Regole: la data di nascita è la più vecchia tra quelle candidate; pezzi di etichetta («SUR», «RNAME», «KORTNUMMER») non sono valori; pezzi della stessa persona che non si contraddicono si riuniscono; nella CIE il numero è sempre C+lettera+5 cifre+2 lettere (CA…, le più nuove CB…) → tipo IDELE.
Comuni nella pagina (`trova`): uguale → uguale «compatto» (senza spazi/apostrofi, 0→O…) → simile → pezzo di parole; i casi non esatti sono «da controllare».

## Come legge le foto (index.html: `leggiFoto`, `personeDaFoto`)
Per ogni foto: verso giusto (prova 0/90/270/180 finché trova etichette) → fasce orizzontali ingrandite sul canale blu (solo dove ci sono le etichette) → foto intera con contrasto 1–99% → fasce sul canale rosso; si ferma prima solo se le letture concordano. Poi `INC.unisci` vota campo per campo tra le letture (valori simili votano insieme, pesati sulla forma valida). «Riprova» aggiunge altre varianti e nessuna fermata. Righe <<< lette solo se il testo le contiene.
Lettore del testo: etichette esatte (`persone`), lettura larga (`largo`) e lettura ad ancore (`ancore`: etichette anche storpiate dall'OCR, valori riconosciuti per forma, verso sopra/sotto scelto per coerenza). Le ancore correggono solo i valori indovinati, non quelli con etichetta esatta.

## Dove sono i punti deboli (da `--duro`)
Casi con documento diverso incollato di seguito senza riga vuota (passaporto-it + CIE riga unica), CIE con etichette + CF + MRZ che viene letta come 3 persone, luogo di nascita "a CITTÀ (PR)" in cartacea. Quando ne risolvi uno, aggiungi un test in `tests/alloggiati.test.js`.

## Struttura
- `admin/alloggiati/incolla.js` lettura del testo incollato (UMD, oggetto `INC`)
- `admin/alloggiati/mrz.js` MRZ ICAO 9303 con cifre di controllo
- `admin/alloggiati/controlli.js` controlli per campo e d'insieme
- `lib/alloggiati.js`, `worker/alloggiati.js` SOAP + rotte del worker
- `tests/corpus/genera.js` generatore sintetico con seme fisso
