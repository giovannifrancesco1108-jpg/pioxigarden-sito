# Stripe: pagamento con carta

Il sito usa **Stripe Checkout ospitato**. Nella sezione "Come si prenota" c'è il blocco **Pagamento con carta** (`#carta`): l'ospite scrive l'importo concordato (10–5000 €) e nome/date, e viene mandato sulla pagina di pagamento di Stripe. Il blocco resta **nascosto** finché `STRIPE_SECRET_KEY` non è impostata (lo controlla `GET /api/pay-status`).

Link precompilato da mandare su WhatsApp: `https://pioxigarden.com/it/?paga=150&rif=Rossi%2012-14%20dic#carta` (cambiare lingua, importo e riferimento).

Dopo il pagamento l'ospite torna su `/<lingua>/?pagamento=ok#carta`; se annulla, torna al modulo già compilato.

Il sito gira come **Cloudflare Worker** (`wrangler.jsonc`, `worker/index.js`): serve i file statici e instrada `/api/*` alle funzioni in `functions/api/`. `www` e gli altri due domini rimandano con 301 a pioxigarden.com.


## Prenotazione con pagamento (modulo #contatti)
Nel modulo "Richiedi disponibilità" l'ospite sceglie date e ospiti, scrive nome e telefono (niente email: la chiede Stripe per la ricevuta) e sceglie:
- **Paga ora con carta** → `POST /api/prenota`: il server calcola notti × prezzo (+ pulizie) e crea la sessione Stripe. Compare solo se `STRIPE_SECRET_KEY` è impostata.
- **Invia su WhatsApp** → apre WhatsApp con il messaggio già compilato.

Prezzi: si impostano dal pannello riservato **/admin** (prezzo a notte, venerdì/sabato, pulizie, notti minime, periodi speciali), salvati in Cloudflare KV (binding `PX`). Le variabili `PREZZO_NOTTE`, `PULIZIE`, `NOTTI_MIN` restano solo come ripiego. Massimo 30 notti e 4 ospiti.

## Pannello /admin
- Primo accesso: si crea la password (min 8 caratteri), salvata come hash PBKDF2 in KV (`auth`). Sessione con cookie HttpOnly per 30 giorni; 10 tentativi sbagliati → blocco di 15 minuti.
- Password dimenticata: Cloudflare → Storage e database → KV → spazio del Worker → cancellare la chiave `auth`, poi riaprire /admin e crearne una nuova.
- Da collegato, sul sito compare "Modifica sito": foto, ritagli, didascalie, foto nelle stanze e blocchi liberi si salvano in KV (`col:foto`, `col:extra`, `col:blocchi`, immagini in `blob:<id>` servite su `/_blob/<id>`).
- Impostazioni: pagamento con carta acceso/spento, link Booking/Airbnb/Vrbo.
Le date pagate vanno chiuse a mano su Booking/Airbnb: il sito non legge ancora i loro calendari.

## Setup

### Variabili d'ambiente (su Cloudflare, mai nel codice: il repository è pubblico)
Cloudflare → Workers e Pages → Worker **pioxigarden-sito** → Impostazioni → Variabili e segreti → **Aggiungi** → tipo **Segreto**:

| Nome | Valore |
|------|--------|
| `STRIPE_SECRET_KEY` | Chiave API. Meglio una **chiave limitata** (`rk_test_...`, poi `rk_live_...`) con permesso **Scrittura** su Checkout Sessions (il resto può restare Nessuno), invece della chiave segreta `sk_`. Da https://dashboard.stripe.com/test/apikeys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` dal webhook creato al passo sotto |
| `DOMAIN` | facoltativo: `https://pioxigarden.com` (senza, si usa l'indirizzo da cui arriva la richiesta) |

Le variabili valgono subito, senza rifare il deploy.

### Webhook
Stripe Dashboard → Workbench → Webhook → Aggiungi destinazione:
- URL: `https://pioxigarden.com/api/webhook`
- Eventi: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
- Copiare il "Signing secret" (`whsec_...`) in `STRIPE_WEBHOOK_SECRET`.

### Dipendenze
Nessuna: niente `npm install`. Le due funzioni girano sul runtime di Cloudflare.

## File
- `functions/api/create-checkout-session.js`: `POST` dal modulo `#carta`, crea la sessione con `price_data` (importo concordato) e reindirizza (303) a Stripe.
- `functions/api/webhook.js`: verifica la firma Stripe e registra i pagamenti con `payment_status: "paid"`.
- `functions/api/pay-status.js`: `GET`, dice solo se la carta è attiva.
- `worker/index.js`, `wrangler.jsonc`, `.assetsignore`: pubblicazione come Worker.

## Test
Usare le chiavi di test. Carte di prova (qualsiasi data futura e CVC):
- `4242 4242 4242 4242`: pagamento riuscito
- `4000 0025 0000 3155`: richiede autenticazione 3D Secure
- `4000 0000 0000 9995`: rifiutata (fondi insufficienti)

## Prossimi passi
- Aggiornare termini di prenotazione e FAQ (oggi dicono solo bonifico) quando la carta è attiva, e indicare acconto/saldo.
- Stripe Tax resta disattivato (`automatic_tax: false`): verificare col commercialista.
- Prima di andare live: https://docs.stripe.com/get-started/checklist/go-live

## Risorse
- https://support.stripe.com
- https://docs.stripe.com/mcp
