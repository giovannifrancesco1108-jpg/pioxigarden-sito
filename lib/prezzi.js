// Prezzi usati dal sito e dal pagamento con carta.
// Si cambiano senza toccare il codice: Cloudflare → Worker → Impostazioni → Variabili e segreti
//   PREZZO_NOTTE (euro a notte, predefinito 75), PULIZIE (euro una tantum, predefinito 0),
//   NOTTI_MIN (predefinito 1).
export function prezzi(env) {
  const num = (v, d) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(n) && n >= 0 ? n : d; };
  return {
    notte: num(env.PREZZO_NOTTE, 75),
    pulizie: num(env.PULIZIE, 0),
    min: Math.max(1, Math.round(num(env.NOTTI_MIN, 1))),
    max: 30,
    ospiti: 4,
  };
}
