// GET /api/pay-status: dice al sito se il pagamento con carta è attivo e con quali prezzi (nessun segreto).
// GET /api/pay-status?session_id=cs_…: al ritorno da Stripe conferma se il pagamento è andato a buon fine.
//   Risponde solo con date, numero di ospiti e importo: niente nome, telefono o dati della carta.
import { getPrezzi, getImp, stripeKey } from "../../lib/store.js";

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function onRequestGet({ request, env }) {
  const sid = new URL(request.url).searchParams.get("session_id");
  if (sid !== null) {
    if (!/^cs_(live|test)_[A-Za-z0-9]{8,240}$/.test(sid)) return json({ paid: false }, 400);
    const SK = await stripeKey(env);
    if (!SK) return json({ paid: false }, 503);
    let s;
    try {
      const r = await fetch("https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(sid), { headers: { Authorization: "Bearer " + SK } });
      if (!r.ok) return json({ paid: false }, 404);
      s = await r.json();
    } catch {
      return json({ paid: false }, 502);
    }
    const m = s.metadata || {};
    return json({
      paid: s.payment_status === "paid",
      complete: s.status === "complete",
      arrival: ISO.test(m.arrivo || "") ? m.arrivo : "",
      departure: ISO.test(m.partenza || "") ? m.partenza : "",
      guests: Math.max(0, Math.min(20, Math.round(+m.ospiti || 0))),
      total: Math.round(+s.amount_total || 0) / 100,
    });
  }
  const [P, I, K] = await Promise.all([getPrezzi(env), getImp(env), stripeKey(env)]);
  return json({ card: Boolean(K) && I.carta, ...P });
}
