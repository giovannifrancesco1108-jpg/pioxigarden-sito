// Cloudflare Pages Function: POST /api/create-checkout-session
// Crea una sessione di Stripe Checkout (pagina di pagamento ospitata da Stripe) e reindirizza l'ospite lì.
// Il sito è statico e non ha un server Node: invece dell'SDK chiamiamo direttamente l'API REST di Stripe,
// l'equivalente di stripe.checkout.sessions.create(...).
// Le chiavi stanno SOLO nelle variabili d'ambiente di Cloudflare (mai nel codice: il repository è pubblico).

export async function onRequestPost({ env }) {
  if (!env.STRIPE_SECRET_KEY) {
    return new Response("Pagamento con carta non ancora configurato.", { status: 503 });
  }

  // TODO: imposta "subscription" solo se vendi pagamenti ricorrenti. Per i soggiorni resta "payment".
  const mode = "payment";

  // success_url, cancel_url e line_items sono segnaposto: vedi STRIPE_INTEGRATION_TODO.md
  const domain = env.DOMAIN || "https://example.com";
  const params = {
    // parametri configurati in Checkout Studio (da usare così come sono)
    ui_mode: "hosted_page",
    billing_address_collection: "auto",
    "phone_number_collection[enabled]": "false",
    "automatic_tax[enabled]": "false",
    allow_promotion_codes: "false",
    submit_type: "auto",
    integration_identifier: "hosted_web_0001",
    origin_context: "web",
    // segnaposto da sostituire
    mode,
    success_url: `${domain}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domain}`,
    "line_items[0][price]": "price_...",
    "line_items[0][quantity]": "1",
  };
  // payment_method_collection si usa solo con mode "subscription"
  if (mode === "subscription") params.payment_method_collection = "always";

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  const session = await res.json();
  if (!res.ok) {
    console.log("Stripe Checkout error:", session.error && session.error.message);
    return new Response("Non è stato possibile avviare il pagamento. Riprova o scrivici su WhatsApp.", { status: 502 });
  }
  return Response.redirect(session.url, 303);
}
