// Cloudflare Pages Function: POST /api/webhook
// Riceve gli eventi di Stripe e ne verifica la firma (Stripe-Signature) con STRIPE_WEBHOOK_SECRET.
// È qui, e non nella pagina di successo, che va registrato un pagamento andato a buon fine.

const enc = new TextEncoder();

async function verify(payload, header, secret, toleranceSec = 300) {
  if (!header) return false;
  const t = (header.split(",").find((p) => p.startsWith("t=")) || "").slice(2);
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((s) => {
    if (s.length !== hex.length) return false;
    // timingSafeEqual esiste nel runtime di Cloudflare; altrove si ripiega sul confronto semplice
    return crypto.subtle.timingSafeEqual ? crypto.subtle.timingSafeEqual(enc.encode(s), enc.encode(hex)) : s === hex;
  });
}

export async function onRequestPost({ request, env }) {
  const payload = await request.text();
  if (!env.STRIPE_WEBHOOK_SECRET) return new Response("Webhook non configurato", { status: 503 });
  const ok = await verify(payload, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET);
  if (!ok) {
    console.log("Webhook signature verification failed.");
    return new Response("Firma non valida", { status: 400 });
  }
  const event = JSON.parse(payload);
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      // Il pagamento è confermato solo quando payment_status è "paid".
      if (session.payment_status === "paid") {
        console.log("Pagamento ricevuto:", session.id, session.amount_total, session.currency, session.customer_details && session.customer_details.email);
        // TODO: segnare la prenotazione come pagata (oggi le prenotazioni si gestiscono a mano).
      }
      break;
    }
    default:
      console.log("Unhandled event type:", event.type);
  }
  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
}
