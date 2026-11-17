// GET /api/pay-status: dice al sito se il pagamento con carta è attivo e con quali prezzi (nessun segreto).
import { getPrezzi, getImp } from "../../lib/store.js";
export async function onRequestGet({ env }) {
  const [P, I] = await Promise.all([getPrezzi(env), getImp(env)]);
  return new Response(JSON.stringify({ card: Boolean(env.STRIPE_SECRET_KEY) && I.carta, ...P }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
