// GET /api/pay-status: dice al sito se il pagamento con carta è attivo e con quali prezzi (nessun segreto).
import { getPrezzi, getImp, stripeKey } from "../../lib/store.js";
export async function onRequestGet({ env }) {
  const [P, I, K] = await Promise.all([getPrezzi(env), getImp(env), stripeKey(env)]);
  return new Response(JSON.stringify({ card: Boolean(K) && I.carta, ...P }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
