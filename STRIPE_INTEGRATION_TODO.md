# Stripe: passi rimanenti

Il sito usa **Stripe Checkout ospitato**: l'ospite viene mandato su una pagina di pagamento di Stripe, paga con carta (o Apple Pay / Google Pay) e torna sul sito.

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- [functions/api/create-checkout-session.js](functions/api/create-checkout-session.js)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| mode | payment | Lasciare `payment`: un soggiorno è un pagamento singolo. `subscription` solo per pagamenti ricorrenti. |
| success_url | `${DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}` | La pagina dopo il pagamento. Il sito non ha ancora una pagina `/success`: crearla oppure usare es. `https://pioxigarden.com/it/?pagato=1`. Tenere `{CHECKOUT_SESSION_ID}`. |
| cancel_url | `${DOMAIN}` | La pagina se l'ospite annulla, es. `https://pioxigarden.com/it/#contatti`. |
| line_items[0][price] | `price_...` | L'ID di un Prezzo Stripe (Dashboard → Catalogo prodotti). Attenzione: il prezzo di un soggiorno cambia con date e notti; con un Prezzo fisso conviene usarlo per un importo fisso (es. un acconto). Per importi variabili servirà `price_data` con l'importo calcolato. |

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [functions/api/create-checkout-session.js](functions/api/create-checkout-session.js)

| Parameter | Value |
|-----------|-------|
| ui_mode | hosted_page |
| billing_address_collection | auto |
| phone_number_collection.enabled | false |
| automatic_tax.enabled | false |
| allow_promotion_codes | false |
| submit_type | auto |
| integration_identifier | hosted_web_0001 |
| origin_context | web |

`payment_method_collection` non è impostato perché vale solo con `mode: "subscription"`.

**Nota sulla versione API:** non si usa l'SDK di Stripe (il sito è statico su Cloudflare Pages, la funzione chiama l'API REST con `fetch`) e la versione API non è fissata, quindi vale quella predefinita dell'account. `ui_mode: hosted_page` richiede una versione API recente; se Stripe risponde che il valore non è valido, usare `hosted`.

## Setup

### Variabili d'ambiente (su Cloudflare, mai nel codice: il repository è pubblico)
Cloudflare → Workers e Pages → progetto **pioxigarden-sito** → Impostazioni → Variabili e segreti → aggiungi come **Segreto**:

| Nome | Valore |
|------|--------|
| `STRIPE_SECRET_KEY` | Chiave API. Meglio una **chiave limitata** (`rk_test_...`, poi `rk_live_...`) con permesso di scrittura su Checkout Sessions, invece della chiave segreta `sk_`. Da https://dashboard.stripe.com/test/apikeys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` dal webhook creato al passo sotto |
| `DOMAIN` | `https://pioxigarden.com` (finché il dominio non è attivo: `https://pioxigarden-sito.pages.dev`) |

Dopo averle salvate, rifare un deploy (Distribuzioni → Riprova distribuzione).

### Webhook
Stripe Dashboard → Workbench → Webhook → Aggiungi destinazione:
- URL: `https://pioxigarden.com/api/webhook`
- Eventi: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
- Copiare il "Signing secret" (`whsec_...`) in `STRIPE_WEBHOOK_SECRET`.

### Dipendenze
Nessuna: niente `npm install`. Le due funzioni girano sul runtime di Cloudflare.

## File nuovi
- `functions/api/create-checkout-session.js`: `POST /api/create-checkout-session` crea la sessione e reindirizza (303) alla pagina di pagamento Stripe. Senza chiave risponde 503.
- `functions/api/webhook.js`: `POST /api/webhook` verifica la firma Stripe e registra i pagamenti con `payment_status: "paid"`.

## Come funziona
1. Un pulsante/form sul sito fa `POST /api/create-checkout-session` (il pulsante non è ancora stato aggiunto alla pagina).
2. La funzione crea la Checkout Session con l'API Stripe e manda l'ospite alla pagina di pagamento.
3. Dopo il pagamento Stripe riporta l'ospite su `success_url` e invia l'evento al webhook.
4. Il pagamento si considera ricevuto solo dal webhook, non dalla pagina di successo.

## Test
Usare le chiavi di test. Carte di prova (qualsiasi data futura e CVC):
- `4242 4242 4242 4242`: pagamento riuscito
- `4000 0025 0000 3155`: richiede autenticazione 3D Secure
- `4000 0000 0000 9995`: rifiutata (fondi insufficienti)

## Prossimi passi
- Creare il Prodotto/Prezzo in Stripe e sostituire `price_...` (o passare a importi calcolati con `price_data`).
- Creare la pagina di successo e aggiungere il pulsante "Paga con carta" nella pagina di prenotazione.
- Aggiornare termini di prenotazione e FAQ (oggi dicono solo bonifico) quando il pagamento con carta è attivo.
- Stripe Tax resta disattivato (`automatic_tax: false`): con la cedolare secca non si applica l'IVA; verificare col commercialista.
- Prima di andare live: https://docs.stripe.com/get-started/checklist/go-live

## Risorse
- https://support.stripe.com
- https://docs.stripe.com/mcp
