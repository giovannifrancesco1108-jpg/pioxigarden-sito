// GET /api/pay-status: dice al sito se il pagamento con carta è attivo e con quali prezzi (nessun segreto).
import { prezzi } from "../../lib/prezzi.js";
export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({ card: Boolean(env.STRIPE_SECRET_KEY), ...prezzi(env) }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
