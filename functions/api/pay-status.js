// GET /api/pay-status: dice al sito se il pagamento con carta è attivo (chiave Stripe presente), senza rivelare nulla.
export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({ card: Boolean(env.STRIPE_SECRET_KEY) }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
