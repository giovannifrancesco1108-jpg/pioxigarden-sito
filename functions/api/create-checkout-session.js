// POST /api/create-checkout-session
// L'ospite paga con carta l'importo concordato (acconto o saldo) su una pagina di pagamento ospitata da Stripe.
// Il sito è statico: invece dell'SDK chiamiamo direttamente l'API REST di Stripe (checkout.sessions.create).
// Le chiavi stanno SOLO nei segreti di Cloudflare (mai nel codice: il repository è pubblico).

import { stripeKey } from "../../lib/store.js";

const LANGS = ["it", "en", "fr", "de", "es"];
const NAME = {
  it: "Soggiorno a Pio XI Garden & Lake View Apartment",
  en: "Stay at Pio XI Garden & Lake View Apartment",
  fr: "Séjour au Pio XI Garden & Lake View Apartment",
  de: "Aufenthalt im Pio XI Garden & Lake View Apartment",
  es: "Estancia en Pio XI Garden & Lake View Apartment",
};
const MIN_EUR = 10;
const MAX_EUR = 5000;

export async function onRequestPost({ request, env }) {
  const SK = await stripeKey(env);
  if (!SK) {
    return new Response("Pagamento con carta non ancora configurato.", { status: 503 });
  }

  let form;
  try { form = await request.formData(); } catch { return new Response("Richiesta non valida.", { status: 400 }); }
  const lang = LANGS.includes(form.get("lang")) ? form.get("lang") : "it";
  const amount = Math.round(parseFloat(String(form.get("amount") || "").replace(",", ".")) * 100);
  const ref = String(form.get("ref") || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const origin = env.DOMAIN || new URL(request.url).origin;
  const back = `${origin}/${lang}/`;

  if (!Number.isFinite(amount) || amount < MIN_EUR * 100 || amount > MAX_EUR * 100 || !ref) {
    return Response.redirect(`${back}?pagamento=errore#carta`, 303);
  }

  const params = {
    // parametri configurati in Checkout Studio
    ui_mode: "hosted_page",
    billing_address_collection: "auto",
    "phone_number_collection[enabled]": "false",
    "automatic_tax[enabled]": "false",
    allow_promotion_codes: "false",
    submit_type: "pay",
    integration_identifier: "hosted_web_pioxiqzr",
    origin_context: "web",
    // pagamento singolo per l'importo concordato
    mode: "payment",
    locale: lang,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(amount),
    "line_items[0][price_data][product_data][name]": NAME[lang],
    "line_items[0][price_data][product_data][description]": ref,
    "metadata[riferimento]": ref,
    "payment_intent_data[description]": `Pio XI Garden – ${ref}`,
    "payment_intent_data[metadata][riferimento]": ref,
    success_url: `${back}?pagamento=ok&session_id={CHECKOUT_SESSION_ID}#carta`,
    cancel_url: `${back}?paga=${amount / 100}&rif=${encodeURIComponent(ref)}#carta`,
  };

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SK}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  const session = await res.json();
  if (!res.ok) {
    console.log("Stripe Checkout error:", session.error && session.error.message);
    return Response.redirect(`${back}?pagamento=errore#carta`, 303);
  }
  return Response.redirect(session.url, 303);
}
