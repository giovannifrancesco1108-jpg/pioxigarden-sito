// POST /api/prenota  (JSON: lang, arrival, departure, guests, name, phone)
// Calcola il totale sul server (notti × prezzo + pulizie) e crea la sessione Stripe Checkout.
// Risponde { url } e il sito manda l'ospite alla pagina di pagamento di Stripe.
import { getPrezzi, getImp, nightPrice, stripeKey } from "../../lib/store.js";

const LANGS = ["it", "en", "fr", "de", "es"];
const TXT = {
  it: { n: (k) => `${k} ${k === 1 ? "notte" : "notti"}`, stay: "Soggiorno", cln: "Pulizie", g: "ospiti" },
  en: { n: (k) => `${k} ${k === 1 ? "night" : "nights"}`, stay: "Stay", cln: "Cleaning", g: "guests" },
  fr: { n: (k) => `${k} ${k === 1 ? "nuit" : "nuits"}`, stay: "Séjour", cln: "Ménage", g: "voyageurs" },
  de: { n: (k) => `${k} ${k === 1 ? "Nacht" : "Nächte"}`, stay: "Aufenthalt", cln: "Reinigung", g: "Gäste" },
  es: { n: (k) => `${k} ${k === 1 ? "noche" : "noches"}`, stay: "Estancia", cln: "Limpieza", g: "huéspedes" },
};
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const day = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || "") ? Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) : NaN);
const clean = (s, n) => String(s || "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

export async function onRequestPost({ request, env }) {
  const SK = await stripeKey(env);
  if (!SK) return json({ error: "card_off" }, 503);
  if (!(await getImp(env)).carta) return json({ error: "card_off" }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: "bad_request" }, 400); }

  const P = await getPrezzi(env);
  const lang = LANGS.includes(b.lang) ? b.lang : "it";
  const t = TXT[lang];
  const a = day(b.arrival), d = day(b.departure);
  const now = new Date(); const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 864e5; // un giorno di margine per i fusi orari
  const nights = Math.round((d - a) / 864e5);
  const guests = Math.round(+b.guests);
  const name = clean(b.name, 60);
  const phone = clean(b.phone, 30);
  if (!Number.isFinite(nights) || a < today || nights < P.min || nights > P.max) return json({ error: "dates" }, 400);
  if (!(guests >= 1 && guests <= P.ospiti) || !name || phone.replace(/\D/g, "").length < 6) return json({ error: "fields" }, 400);

  let stayCents = 0;
  for (let k = 0; k < nights; k++) stayCents += Math.round(nightPrice(P, new Date(a + k * 864e5).toISOString().slice(0, 10)) * 100);

  const fmt = new Intl.DateTimeFormat(lang, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const range = `${fmt.format(a)} – ${fmt.format(d)}`;
  const ref = `${name} · ${range} · ${guests} ${t.g} · ${phone}`;
  const origin = env.DOMAIN || new URL(request.url).origin;
  const back = `${origin}/${lang}/`;

  const params = {
    ui_mode: "hosted_page",
    billing_address_collection: "auto",
    "phone_number_collection[enabled]": "false",
    "automatic_tax[enabled]": "false",
    allow_promotion_codes: "false",
    submit_type: "book",
    integration_identifier: "hosted_web_pioxiqzr",
    origin_context: "web",
    mode: "payment",
    locale: lang,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(stayCents),
    "line_items[0][price_data][product_data][name]": `${t.stay} Pio XI Garden & Lake View Apartment`,
    "line_items[0][price_data][product_data][description]": `${t.n(nights)} · ${range} · ${guests} ${t.g}`,
    "metadata[nome]": name,
    "metadata[telefono]": phone,
    "metadata[arrivo]": b.arrival,
    "metadata[partenza]": b.departure,
    "metadata[ospiti]": String(guests),
    "payment_intent_data[description]": `Pio XI Garden – ${ref}`,
    "payment_intent_data[metadata][arrivo]": b.arrival,
    "payment_intent_data[metadata][partenza]": b.departure,
    "payment_intent_data[metadata][telefono]": phone,
    success_url: `${back}?prenotato=ok&session_id={CHECKOUT_SESSION_ID}#contatti`,
    cancel_url: `${back}#contatti`,
  };
  if (P.pulizie > 0) {
    Object.assign(params, {
      "line_items[1][quantity]": "1",
      "line_items[1][price_data][currency]": "eur",
      "line_items[1][price_data][unit_amount]": String(Math.round(P.pulizie * 100)),
      "line_items[1][price_data][product_data][name]": t.cln,
    });
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${SK}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const session = await res.json();
  if (!res.ok) {
    console.log("Stripe Checkout error:", session.error && session.error.message);
    return json({ error: "stripe" }, 502);
  }
  return json({ url: session.url });
}
